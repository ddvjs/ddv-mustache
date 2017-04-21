'use strict'
// 文件
const fs = require('fs')
const load = require('../load')
module.exports = renderProject
const renderError = require('./error.js')
function renderProject (req, res, next) {
  if (!(this.buildDir && fs.existsSync(this.buildDir))) {
    renderError(req, res, new Error('If you have not compiled the rendering file, run npm run build'))
    return
  }
  load.router.dev = this.dev
  load.controller.dev = this.dev
  load.models.dev = this.dev
  load.views.dev = this.dev
  load.baseHtml.dev = this.dev
  load.JQuery.dev = this.dev
  // 使用 root 路由正则
  load.router(req, this.appDir)
  .then(router => {
    // 如果有缓存就直接输出了
    // 使用 编译文件加快速度 - 如果没有编译文件才跑下去 - 否则直接输出编译文件
    return router
  })
  .then(router => {
    // 查找项目
    return load.project(this.appDir, router)
    // 判断是否为项目
    .then(project => {
      // 从新路由
      return load.router(req, this.appDir, project.pathinfo.config)
      .then(router => {
        // 重新查找项目
        return load.project(this.appDir, router)
      })
    })
    // 判断是否为项目
    .then(project => {
      req.project = project
    }, e => {
      req.project = null
    })
    .then(() => next())
    // 查找项目
  })
  .catch(err => {
    renderError.call(this, req, res, err)
    // 出错了
  })
}
