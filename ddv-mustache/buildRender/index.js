'use strict'
const load = require('../load')
const express = require('express')
module.exports = render
const renderBaseError = require('../render/renderBaseError.js')
function render (req, res, next) {
  load.router.dev = this.dev
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
      req.project = project || req.project
      renderRroject.call(this, req, res, next)
    }, e => next())
    // 查找项目
  })
  .catch(err => {
    renderBaseError.call(this, req, res, err)
    // 出错了
  })
}
function renderRroject (req, res, next) {
  if (req.project.isDdvStatic) {
    // 静态加载
    var t = express.Router()
    t.use(req.project.base, this.renderDistMiddleware)
    t(req, res, next)
    t = void 0
    return
  } else if (req.project.isHotLoad) {
    // 热加载
  } else {
    // 项目
  }
  console.log('project', req.project)
  console.log('pathinfo', req.project.pathinfo.config)

}
