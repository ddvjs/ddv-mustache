'use strict'

const path = require('path')
const webpack = require('webpack')
const config = require('./webpack.base.js')
const logger = require('./logger')
const dirRoot = path.resolve(__dirname, '../')
const entry = Object.create(null)
const nodeExternals = require('webpack-node-externals')
const ProgressBarPlugin = require('progress-bar-webpack-plugin')
entry.base = config.entry || Object.create(null)
let compiler, compilerWatch, isDev
isDev = process.argv.indexOf('build') === -1
logger.log('Loading...')
logger.log('isDev : ' + (isDev ? 'true' : 'false'))
config.output.path = path.resolve(dirRoot, 'lib')
config.plugins = Array.isArray(config.plugins) ? config.plugins : []
config.plugins.push(new ProgressBarPlugin())
console.log(nodeExternals())

// Hack: remove extract-text-webpack-plugin log
const cleanStats = function (stats) {
  stats.compilation.children = stats.compilation.children.filter(child =>
    !/extract-text-webpack-plugin|html-webpack-plugin/.test(child.name)
  )
}
if (isDev) {
  // 初始化一次
  watchChangeDev()
} else {
  // production
  getEntry()
  .then(entry => {
    config.entry = entry
    compiler = webpack(config)
    compiler.plugin('done', stats => {
      cleanStats(stats)
      logger.success('完成')
    })
    compiler.run(function (err, stats) {
      if (err) {
        logger.fatal(err)
      }

      var config = {
        colors: true,
        progress: true,
        chunks: false,
        hash: false,
        version: false
      }
      if (stats.hasErrors()) {
        logger.fatal(stats.toString(config))
      }

      logger.success('info\n' + stats.toString(config))
    })
  })
  .catch(err => {
    logger.log(err)
  })
}
function watchChangeDev () {
  new Promise(function (resolve, reject) {
    if (compilerWatch && compilerWatch.close) {
      // 关闭原有的webpack 监听
      logger.log('webpack watch closeing...')
      compilerWatch.close(function () {
        logger.log('webpack watch close success')
        resolve()
      })
    } else {
      resolve()
    }
  })
  .then(function () {
    return getEntry()
  })
  .then(function (entry) {
    // 获取入口列表
    config.entry = entry
    logger.log('webpack watch runing...')
    // 实例化webpack
    compiler = webpack(config)

    compiler.plugin('done', stats => {
      cleanStats(stats)
      logger.log('完成')
    })
    compilerWatch = compiler.watch({}, (err, stats) => {
      if (err) {
        return logger.error(err)
      }

      var config = {
        colors: true,
        progress: true,
        chunks: false,
        hash: false,
        version: false
      }
      logger.log('webpack info \n' + stats.toString(config))
      // stats = stats.toJson()
      // stats.errors.forEach(err => console.error(err))
      // stats.warnings.forEach(err => console.warn(err))
    })
  })
}
function getEntry () {
  var obj = Object.assign(Object.create(null), entry.base, {
    'server': './src/server',
    'ddv-server-mustache': './src/ddv-server-mustache'
  })
  return Promise.resolve(obj)
}
