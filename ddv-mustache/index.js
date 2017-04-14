'use strict'
const _ = require('lodash')
const build = require('./build')
const generate = require('./generate')
const render = require('./render')

class DdvMustache {
  constructor (options = {}) {
    var defaults = {
      dev: true,
      performance: {
        gzip: {
          threshold: 0
        },
        prefetch: true
      }
    }
    this.options = _.defaultsDeep(options, defaults)
    // Env variables
    this.dev = this.options.dev
    this.dir = (typeof options.rootDir === 'string' && options.rootDir ? options.rootDir : process.cwd())
    this.build = build.bind(this)
    this.generate = generate.bind(this)
    this.render = render.bind(this)
    this.renderQueue = []
    this.renderQueueRun = render.renderQueueRun.bind(this)
    this.close = close.bind(this)
    return this
  }
}
function close (callback) {
  console.log('释放')
}
module.exports = DdvMustache
