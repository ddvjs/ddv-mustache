'use strict'
// express模块
const express = require('express')
// 文件
const fs = require('fs')
const path = require('path')
const buildRender = require('../buildRender')
const renderBaseError = require('./renderBaseError.js')
// 域
// eslint-disable-next-line
const domain = require('domain')
// 导出
module.exports = Object.assign(renderInit, {
  renderQueueRun,
  renderWaitMiddleware,
  render
})
// 渲染中间件
function renderWaitMiddleware (req, res, next) {
  if (this && this.renderQueue && Array.isArray(this.renderQueue)) {
    // 插入队列中
    this.renderQueue.push(next)
  }
  // 如果存在队列运行方法就运行
  this.renderQueueRun && this.renderQueueRun()
}
// 渲染队列运行器
function renderQueueRun (isNextTick) {
  if (!(this.renderQueue && this.renderQueue.length > 0)) {
    // 是否已经是下一进程运行
    if (!isNextTick) {
      // 下一进程再次尝试
      process.nextTick(() => {
        // 如果存在队列运行方法就运行
        this.renderQueueRun && this.renderQueueRun(true)
      })
    }
    return
  }
  // 渲染器是否已经加载结束
  if (!this.isBuildIng) {
    var next
    // 循环运行队列中的代渲染请求
    while (this.renderQueue && (next = this.renderQueue.splice(0, 1)) && next.length > 0 && (next = next[0])) {
      // 正式渲染
      renderWaitNextTick(next)
    }
    next = void 0
  }
}
// 渲染初始化
function renderInit () {
  // 路由渲染器
  this.render = express.Router()
  // 渲染域
  this.renderDomains = []
  // 渲染队列
  this.renderQueue = []
  // 运行方法
  this.renderQueueRun = renderQueueRun.bind(this)
  this.renderDistMiddleware = serve.call(this, path.join(this.buildDir, '/dist'), true)

  // 渲染阻塞器
  this.render.use(renderDomainMiddleware.bind(this))
  // 渲染阻塞器
  this.render.use(renderWaitMiddleware.bind(this))
  // 根目录下的static优先
  this.render.use(serve.call(this, path.join(this.dir, '/static'), true))

  // 使用渲染模块
  this.render.use(render.bind(this))
  // 编译生成的静态资源
  this.render.use('/static', serve.call(this, path.join(this.buildDir, '/dist/static'), true))
  // 编程导出
  this.render.use(this.renderDistMiddleware)
}

const serve = function (path, cache) {
  return express.static(path, {
    maxAge: cache && (!this.dev) ? 60 * 60 * 24 * 30 : 0
  })
}

// 渲染中间件
function renderDomainMiddleware (req, res, next) {
  var d = domain.create()
  // 监听domain的错误事件
  d.on('error', function (err) {
    res.statusCode = 500
    renderBaseError(req, res, err)
    d.dispose()
  })

  d.add(req)
  d.add(res)
  d.run(next)
  /* if (this && this.renderDomains && Array.isArray(this.renderDomains)) {
    this.renderDomains.push(d)
  } */
  d = void 0
}
// 渲染
function render (req, res, next) {
  if (!(this.buildDir && fs.existsSync(this.buildDir))) {
    renderBaseError(req, res, new Error('If you have not compiled the rendering file, run npm run build'))
    return
  }
  buildRender.call(this, req, res, next)
}
// 渲染放到下一进程，同时监听错误
function renderWaitNextTick (next) {
  // 放到下一进程
  process.nextTick(function () {
    // 渲染正式运行
    next && next()
    // 释放
    next = void 0
  })
}
