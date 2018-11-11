"use strict"

const fs = require('fs')
const path = require('path')
const MultiProgress = require('multi-progress')
const { fork } = require('child_process')

const ROOT_PATH = process.env.ROOT || path.resolve(__dirname, 'lastfm_train')

const multi = new MultiProgress(process.stdout)
const progressBars = []

const childArgs = [ '--single_threaded', '--max-old-space-size=64' ]

const INITIAL_DIRS = fs.readdirSync(ROOT_PATH)
INITIAL_DIRS.forEach(dir => {
  let bar
  const child = fork('bulkindex.js', [dir], { execArgv: childArgs })
  child.on('error', err => console.error(err))
  child.on('message', ({ done, total }) => {
    if (total) {
      const template = `  Building bulkIndex${dir}.json :bar :percent  [:current / :total]`
      bar = multi.newBar(template, { curr: 0, total, width: 80 })
      progressBars.push(bar)
    }
    else if (done) {
      bar.tick(done)
    }
  })
})

const progressInterval = setInterval(() => {
  if (progressBars.length !== 0 && progressBars.every(bar => bar.complete)) {
    console.log('All songs parsed into bulkindex statements')
    clearInterval(progressInterval)
  }
}, 3000)
