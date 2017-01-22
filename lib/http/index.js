/** vim: et:ts=4:sw=4:sts=4
 * see: https://github.com/chengjiabao/ddv for details
 */
/* jshint node: true */
/* jshint esversion: 6 */
/* global module, process */
'use strict'
// cjb_base模块
const cjb_base = require('cjb-base')
// 工具类
const b = cjb_base.inherit(cjb_base)
// 路径模块
const path = require('path')
// 错误输出模块
const errorHand = require('./error.js')
// 编译文件
const buildOutput = require('./buildOutput.js')
// 路由
const router = require('./router.js')
// 项目
const project = require('./project.js')
// 项目
const projectConfig = require('./projectConfig.js')
// cookie
const cookie = require('./cookie.js')
// 样式编译输出
const buildOutputSass = require('./buildOutputSass.js')
// 其他项目文件直接输出
const buildOutputOther = require('./buildOutputOther.js')
// 其他项目文件直接输出
const buildOutputControllers = require('./buildOutputControllers.js')
//
const buildOutputControllersHot = require('./buildOutputControllersHot.js')

const buildOutputDdvstatic = require('./buildOutputDdvstatic.js')

let socketCloseTip = '长连接已经断开'
var worker

const newConnect = function () {
  this.checkSocketClose = function (isThrow = true) {
    if (!this.notClosed) {
      /* 防止客户断开连接后继续有程序运行 */
      if (isThrow) {
        throw Error(socketCloseTip)
      } else {
        console.error(Error(socketCloseTip))
        return false
      }
    } else {
      return false
    }
  }
  this.add(this.checkSocketClose)
  // 垃圾回收延时执行
  this.on('conn::gc::run', function () {
    this.destroy()
  })
  // 绑定回收事件
  this.on('conn::gc', function () {
    // 防止多次回收
    if (this.isConnGcEmit !== false) {
      return
    }
    this.isConnGcEmit = true
    // 推迟回收资源
    setTimeout(function nextTickRun () {
      this.emit('conn::gc::run')
    }.bind(this), 1000)
  })
  // 异常错误处理
  this.on('error', function (e) {
    errorHand.call(this, e)
    this.emit('conn::gc', 'error')
  })
  // 处理管道
  this
  // 加入基本信息
  .use((req, res, next) => {
    // 站点配置信息
    req.appConfig = Object.create(null)
    // 克隆全局配置信息
    if (worker.siteConfig && worker.siteConfig.config) {
      b.extend(true, req.appConfig, worker.siteConfig.config)
    }
    // 站点根路径
    req.siteRootPath = worker.siteRootPath
    req.appRootPath = worker.appRootPath
    next()
  })
  // 使用 root 路由正则
  .use(router('/'))
  // 使用 编译文件加快速度 - 如果没有编译文件才跑下去 - 否则直接输出编译文件
  .use(buildOutput)
  // 查找项目
  .use(project)
  // 判断是否有项目
  .use(function (req, res, next) {
    // 如果是项目，尝试再次查找路由
    if (req.project && req.project.state === true) {
      // next.push 是特殊流程插入，就是在当前流程后面插入新的队列，详细使用说明参考cjb-base的队列
      next.push(
        // 使用 项目内的 config 路由再次正则处理
        router(req.project.pathinfo.config),
        // 参考cjb-base的队列机制，true是为了能等待节点结束
        true,
        // 因为路由有可能修改路由地址，需要重新查找项目
        project
      )
      // 删除root路由项目信息，等待重组
      delete req.project
    }
    req.buildOutputNotSkip = true
    // 下一步
    next()
  })
  // 处理ddv静态库
  .use(function (req, res, next) {
    if (req.project && req.project.state) {
      // 路由中插入ddv静态库地址
      req.project.pathinfo.ddvstatic_find = req.project.pathinfo.base + '/ddvstatic/'
    }
    // 下一步
    next()
  })
  // 项目配置信息
  .use(projectConfig)
  // cookie
  .use(cookie)
  // 控制器
  .use(buildOutputControllers)
  // 其他文件直接输出
  .use(buildOutputOther)
  // 编译输出样式
  .use(buildOutputSass)
  // ddvstatic模块
  .use(buildOutputDdvstatic)
  // 控制器热编译打包
  .use(buildOutputControllersHot)
  // 使用 输出编译文件
  .use(buildOutput)
  // 实在找不到了-404吧
  .use(function error404 (req) {
    // 构造一个404错误
    let e = Error('404 - File Not Find')
    if (req.router.path) {
      e.path = req.router.path || ''
      e.stack += '\n    at path (' + e.path + ')'
    }
    if (req.router.pathquery_source) {
      e.pathquery_source = req.router.pathquery_source || ''
      e.stack += '\n    at pathquery_source (' + e.pathquery_source + ')'
    }
    if (req.router.pathquery) {
      e.pathquery = req.router.pathquery || ''
      e.stack += '\n    at pathquery (' + e.pathquery + ')'
    }
    // 错误码
    e.code = 404
    // 抛出异常
    throw e
  })
}

module.exports = function (workerInput) {
  worker = workerInput
  workerInput = void 0

  errorHand.setSiteConfig(worker.siteConfig)

  /**
   * @http|https[长连接专用的]
   * @param    {object}     connect.request       [请求操作指针]
   * @param    {object}     connect.response      [响应操作指针]
   */
  worker.on('connection::http', function (conn) {
    newConnect.call(conn)
  })
}

