"use strict"

const createIndexJson = require('./createindex.json')
const elasticsearch = require('elasticsearch')
const etl = require('etl')
const fs = require('fs')
const path = require('path')
const ProgressBar = require('progress')
const unzipper = require('unzipper')
const { omit } = require('lodash')

const ARCHIVE_PATH = path.resolve(__dirname, process.env.ARCHIVE || 'lastfm_train.zip')
const BULK_INDEX_LIMIT = process.env.BULK_INDEX_LIMIT || 15000
const CONCURRENCY = process.env.CONCURRENCY || 5
const ELASTICSEARCH_URL = process.env.ELASTICSEARCH_URL || 'http://127.0.0.1:9200'
const INDEX_NAME = process.env.INDEX || 'songs'
const LOG_LEVEL = process.env.LOG_LEVEL || 'info'
const MAX_RETRIES = process.env.MAX_RETRIES || 3
const TIMEOUT = process.env.TIMEOUT || 60000
const TYPE_NAME = process.env.TYPE || '_doc'

const esClient = new elasticsearch.Client({
  host: ELASTICSEARCH_URL,
  log: LOG_LEVEL,
  requestTimeout: TIMEOUT
})

const template = 'Indexing songs... :bar :percent  [:current / :total] :elapseds'
const progressBar = new ProgressBar(template, { 
  action: 'Reading archive', 
  curr: 0, 
  total: 839122, 
  width: 50 
})

let total = 0

const handleZipEntry = async entry => {
  if (entry.type === 'File') {
    total++
    progressBar.tick(1)
    const songData = omit(JSON.parse(await entry.buffer()), ['similars'])
    songData.tags = songData.tags.map(tag => 
      ({ tag: tag[0], frequency: parseInt(tag[1], 10) }))
    return songData
  } else {
    entry.autodrain()
  }
}

const initIndex = async () => {
  if (await esClient.indices.exists({ index: INDEX_NAME })) {
    const { acknowledged } = await esClient.indices.delete({ index: INDEX_NAME })
    if (acknowledged) {
      console.log(`Deleted existing ${INDEX_NAME} index`)
    }
  }
  const res = await esClient.indices.create({ index: INDEX_NAME, body: createIndexJson })
  if (res.acknowledged) {
    console.log(`Created new ${INDEX_NAME} index`)
  }
}

const logErrors = err => console.error(err)

;(async () => {
  await initIndex()

  fs.createReadStream(ARCHIVE_PATH)
    .pipe(unzipper.Parse())
    .pipe(etl.map(handleZipEntry))
    .pipe(etl.collect(BULK_INDEX_LIMIT))
    .pipe(etl.elastic.index(esClient, INDEX_NAME, TYPE_NAME, { 
      concurrency: CONCURRENCY,
      debug: true,
      maxRetries: MAX_RETRIES,
      pushErrors: true
    }))
    .pipe(etl.map(logErrors))
    .promise()
    .then(() => console.log(`Finished indexing ${total} documents into ${INDEX_NAME}`))
    .catch(err => console.error(`Failed to index documents into ${INDEX_NAME}`, err))
})()
