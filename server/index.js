'use strict'

const chokidar = require('chokidar')
const app = require('express')()
const worker = require('ddv-worker')
const http = require('http')
const DdvMustache = require('../ddv-mustache')
var config = null
var ddvMustache = null
var siteConfigFile = null

// 创建http服务
worker.server = http.createServer(app)

// 创建编译器的方法
function createDdvRender () {
  return (ddvMustache && ddvMustache.close ? ddvMustache.close() : Promise.resolve())
  .then(() => {
    // 删除旧的配置
    if (require.cache && siteConfigFile && require.cache[siteConfigFile]) {
      delete require.cache[siteConfigFile]
    }
    // 引入配置信息-Import and Set Nuxt.js options
    config = require(siteConfigFile)
    // 调试模式
    worker.DEBUG = config.dev = !(process.env.NODE_ENV === 'production')
  }).then(() => {
    // Init DdvMustache.js
    ddvMustache = new DdvMustache(config)
    // Build only in dev mode
    if (config.dev) {
      // 编译 - Build only in dev mode
      return ddvMustache.build()
    }
  }).then(() => {
    console.log('create ddvMustache render success')
  }).catch((error) => {
    console.error(error) // eslint-disable-line no-console
    process.exit(1)
  })
}
module.exports = worker
worker.serverStart = function serverStart (siteConfigFileInput, configInput) {
  siteConfigFile = siteConfigFileInput
  config = configInput
  chokidar.watch(siteConfigFile, { ignoreInitial: true })
  .on('all', function () {
    console.log('You have modified the configuration information and are recompiling')
    // 重新创建编译器
    createDdvRender()
  })
  // 创建编译器
  createDdvRender().then(() => {
    if (config.dev) {
      // 使用ddvMustache插件
      app.use(function (res, req, next) {
        return ddvMustache.render.apply(this, arguments)
      })
    } else {
      // 使用ddvMustache插件
      app.use(ddvMustache.render)
    }
    // 监听服务 - Listen the server
    worker.updateServerConf({
      defaultListen: config.defaultListen,
      listen: config.listen,
      cpuLen: config.cpuLen
    }).then(() => {
      console.log('监听配置参数 更新成功')
    }, e => {
      console.error('监听配置参数 更新失败')
      console.error(e)
    })
  })
}
