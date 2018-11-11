"use strict"

const fetch = require('node-fetch')
const fs = require('fs')
const path = require('path')
const { omit } = require('lodash')
const { promisify } = require('util')

const readdirAsync = promisify(fs.readdir)
const statAsync = promisify(fs.stat)

const ELASTICSEARCH_URL = process.env.ELASTICSEARCH_URL || 'http://127.0.0.1:9200'
const INDEX_NAME = process.env.INDEX || 'songs'
const ROOT_PATH = process.env.ROOT || path.resolve(__dirname, 'lastfm_train')
const RUN_BULK_INDEX = process.env.RUN_BULK_INDEX ? process.env.RUN_BULK_INDEX === 'true' : true
const TICK = 2000

const indexStatement = `{ "index": { "_index": "${INDEX_NAME}", "_type": "_doc" }`

const getFiles = async dir => {
  const subdirs = await readdirAsync(dir)
  const files = await Promise.all(subdirs.map(async subdir => {
    const subPath = path.resolve(dir, subdir)
    return (await statAsync(subPath)).isDirectory() ? getFiles(subPath) : subPath
  }))
  return files.reduce((acc, file) => acc.concat(file), [])
}

let progress = { done: 0 }

const notifyOfProgress = msg => {
  if (process.send) {
    process.send(msg)
  } else {
    msg.done = msg.done ? progress.done + msg.done : progress.done
    progress = { ...progress, ...msg }
    console.log(`Completed ${progress.done} / ${progress.total}`)
  }
}

;(async () => {
  const args = process.argv.slice(2)
  const dirname = args[0]
  const initialDir = path.resolve(__dirname, ROOT_PATH, dirname)
  const outFile = path.resolve(__dirname, `bulkindex${dirname}.json`)
  if (fs.existsSync(outFile)) {
    fs.unlinkSync(outFile)
  }
  const outStream = fs.createWriteStream(outFile, { flags: 'a' })
  try {
    const allFiles = await getFiles(initialDir)
    notifyOfProgress({ done: 0, total: allFiles.length })
    allFiles.forEach((file, i) => {
      if (i % TICK === 0 && i > 0) {
        notifyOfProgress({ done: TICK })
      }
      const songData = JSON.parse(fs.readFileSync(file))
      outStream.write(indexStatement + "\n");
      outStream.write(JSON.stringify(omit(songData, ['similars'])) + "\n")
    })
    notifyOfProgress({ done: allFiles.length % TICK })
  } catch (err) {
    console.error(err)
  } finally {
    outStream.end()
  }
})()
