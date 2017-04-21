'use strict'
const logger = require('../../build/logger')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const webpackConfigBase = require('./webpack.base.js')
const getEntryAndCopyPath = require('./getEntryAndCopyPath.js')
const webpack = require('webpack')
const path = require('path')
const loggerConfig = {
  colors: true,
  progress: true,
  chunks: false,
  hash: false,
  version: false
}
const copyWebpackPath = []
// 默认复制这个
copyWebpackPath.push({ from: path.resolve(__dirname, '../ddvstatic'), to: '../ddvstatic' })

module.exports = function buildExports () {
  this.isBuildIng = true
  return new Promise((resolve, reject) => {
    this.dev && resolve()
    build.call(this).then(() => {
      this.dev || resolve.apply(this, arguments)
      // 标记结束
      this.isBuildIng = false
      this.renderQueueRun()
    }, (e) => {
      logger.fatal(e)
      this.dev || reject.apply(this, arguments)
      this.isBuildIng = false
      this.renderQueueRun()
    })
  })
}
function build () {
  this.webpackConfig = Object.assign(Object.create(null), webpackConfigBase)
  this.webpackConfig.output.path = this.buildDistDir

  this._entry = this._entry || Object.create(null)
  this._entry.base = this.webpackConfig.entry || Object.create(null)

  if (this.dev) {
    // 初始化一次
    return watchChangeDev.call(this)
  } else {
    // production
    return getEntryAndCopyPath(this, (this && this._entry && this._entry.base), copyWebpackPath)
      .then(({entry, copyPath}) => {
        this.webpackConfig.entry = entry
        // 复制代码插件
        pushCopyWebpackPlugin(this.webpackConfig.plugins, copyPath)
        this._compiler = webpack(this.webpackConfig)
        this._compiler.plugin('done', stats => {
          cleanStats(stats)
          logger.success('完成')
        })
        this._compiler.run(function (err, stats) {
          if (err) {
            logger.fatal(err)
          }

          if (stats.hasErrors()) {
            logger.fatal(stats.toString(loggerConfig))
          }

          logger.success('info\n' + stats.toString(loggerConfig))
        })
      })
      .catch(err => {
        logger.log(err)
      })
  }
}

// Hack: remove extract-text-webpack-plugin log
const cleanStats = function (stats) {
  stats.compilation.children = stats.compilation.children.filter(child =>
    !/extract-text-webpack-plugin|html-webpack-plugin/.test(child.name)
  )
}
function watchChangeDev () {
  return new Promise((resolve, reject) => {
    if (this._compilerWatch && this._compilerWatch.close) {
      // 关闭原有的webpack 监听
      logger.log('webpack watch closeing...')
      this._compilerWatch.close(() => {
        logger.log('webpack watch close success')
        resolve()
      })
    } else {
      resolve()
    }
  })
  .then(() => {
    return getEntryAndCopyPath(this, (this && this._entry && this._entry.base), copyWebpackPath)
  })
  .then(({entry, copyPath}) => {
    // 获取入口列表
    this.webpackConfig.entry = entry
    // 复制代码插件
    pushCopyWebpackPlugin(this.webpackConfig.plugins, copyPath)
    logger.log('webpack watch runing...')
    // 实例化webpack
    this._compiler = webpack(this.webpackConfig)

    this._compiler.plugin('done', stats => {
      cleanStats(stats)
      logger.log('完成')
    })
    this._compilerWatch = this._compiler.watch({}, (err, stats) => {
      if (err) {
        return logger.error(err)
      }

      logger.log('webpack info \n' + stats.toString(loggerConfig))
      // stats = stats.toJson()
      // stats.errors.forEach(err => console.error(err))
      // stats.warnings.forEach(err => console.warn(err))
    })
  })
}
function pushCopyWebpackPlugin (plugins, copyPath) {
  var i
  for (i = 0; i < plugins.length; i++) {
    if (plugins[i] instanceof CopyWebpackPlugin) {
      plugins.splice(i--, 1)
    }
  }
  plugins.push(new CopyWebpackPlugin(copyPath))
  i = plugins = copyPath = void 0
}
