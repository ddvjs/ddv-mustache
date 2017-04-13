let fs = require('fs')
let MustacheServer = require('ddv-server-mustache-1-0')
let resolve = require('path').resolve

let siteRootPath = resolve('.', './')
let siteConfigFile = resolve(siteRootPath, 'site.config.js')
let options = {}
if (fs.existsSync(siteConfigFile)) {
  options = require(siteConfigFile)
}

options.debug = options.debug || process.env.NODE_ENV === 'development'
options.path = siteRootPath

// 启动程序
MustacheServer.start(options)
