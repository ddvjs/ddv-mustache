'use strict'
const logger = require('../../build/logger')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const webpackConfigBase = require('./webpack.base.js')
const webpack = require('webpack')
const path = require('path')
const loggerConfig = {
  colors: true,
  progress: true,
  chunks: false,
  hash: false,
  version: false
}
webpackConfigBase.plugins.push(
  new CopyWebpackPlugin([
    { from: path.resolve(__dirname, '../ddvstatic'), to: 'ddvstatic' }
    // { from: 'lib/app', to: 'app' },
    // { from: 'lib/views', to: 'views' }
  ])
)

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
  this.webpackConfig.output.path = this.buildDir

  this._entry = this._entry || Object.create(null)
  this._entry.base = this.webpackConfig.entry || Object.create(null)

  if (this.dev) {
    // 初始化一次
    return watchChangeDev.call(this)
  } else {
    // production
    return getEntry.call(this)
      .then(entry => {
        this.webpackConfig.entry = entry
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
  console.log('333')
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
    return getEntry.call(this)
  })
  .then((entry) => {
    // 获取入口列表
    this.webpackConfig.entry = entry
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
function getEntry () {
  var obj = Object.assign(Object.create(null), ((this && this._entry && this._entry.base) || Object.create(null)), {
    'admin/styles/login': './app/admin/styles/login.css'

  })
  return Promise.resolve(obj)
}
