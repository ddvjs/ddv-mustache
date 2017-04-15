'use strict'
// express模块
const express = require('express')
// 日子模块
// const logger = require('../../logger')
// 导出
module.exports = Object.assign(renderInit, {
  renderQueueRun,
  renderMiddleware,
  render
})
// 渲染中间件
function renderMiddleware (req, res, next) {
  if (this && this.renderQueue && Array.isArray(this.renderQueue)) {
    // 插入队列中
    this.renderQueue.push([req, res, next])
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
    var args
    // 循环运行队列中的代渲染请求
    while (this.renderQueue && (args = this.renderQueue.splice(0, 1)) && args.length > 0 && (args = args[0])) {
      // 正式渲染
      renderNextTick(this, args)
    }
    args = void 0
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

  // 使用渲染模块
  // this.render.use(renderDomainMiddleware.bind(this))
  // 使用渲染模块
  this.render.use(renderMiddleware.bind(this))
}

// 渲染中间件
/* function renderDomainMiddleware (req, res, next) {
  var d = domain.create()
  // 监听domain的错误事件
  d.on('error', function (err) {
    logger.error(err)
    res.statusCode = 500
    res.json({sucess: false, messag: '服务器异常'})
    d.dispose()
  })

  d.add(req)
  d.add(res)
  d.run(next)
  if (this && this.renderDomains && Array.isArray(this.renderDomains)) {
    this.renderDomains.push(d)
  }
  d = void 0
} */
// 渲染放到下一进程，同时监听错误
function renderNextTick (self, args) {
  // 放到下一进程
  process.nextTick(function () {
    // 渲染正式运行
    render.apply(self, args)
    // 释放
    self = args = void 0
  })
}
// 渲染
function render (req, res, next) {
  next()
}
