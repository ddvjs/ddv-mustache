'use strict'
// cjb_base模块
const fs = require('fs')
const path = require('path')
const b = require('cjb-base')
const e = b.inherit(null)
var siteConfig

e.run = function ErrorRun (err) {
  err.code = parseInt(err.code) || 500
  err.message = err.message || 'Internal Server Error'
  this.content = err.message
  this.content += '\n\n' + err.stack
  try {
    this.response.statusCode = err.code
    this.response.setHeader('content-type', 'text/html;charset=UTF-8')
    this.response.setHeader('content-length', this.content.length)
    this.response.writeHead(this.response.statusCode)
    this.response.write(this.content, 'utf-8')
    this.response.end()
  } catch (e) {
    console.error('错误输出的时候失败')/* 防止客户断开连接后继续有程序运行 */
    console.error(e)/* 防止客户断开连接后继续有程序运行 */
  }
  e.saveLog(err, this.app && this.app.router, (this && this.request && this.request.headers && this.request.headers['user-agent'] || ''))
}
e.saveLog = function (err, router, userAgent) {
  var echoContent = ''
  var br = '\r\n'
  var time, logFile
  time = '*********[time:' + b.now() + ']**********'
  echoContent += br + time
  echoContent += br + '== http 有请求错误 =='
  echoContent += br + err.message
  if (err.code === 404 && router) {
    echoContent += br + 'url_source: ' + (router && router.url_source || 'unknow')
    echoContent += br + 'path: ' + (router && router.path || 'unknow')
    echoContent += br + 'userAgent: ' + (userAgent || 'unknow')
  }
  echoContent += br + err.stack
  echoContent += br + '== 以上错误在以下位置触发 =='
  echoContent += br + Error('echo error line stack').stack
  echoContent += br + '== 触发位置=END=触发位置 =='
  echoContent += br + time + br
  userAgent = router = undefined
    // 写入特定错误文件
  if (siteConfig && err && err.code && (logFile = siteConfig['log_error_' + err.code]) && siteConfig.log_error) {
    logFile = path.resolve(siteConfig.log_error, '..') + path.sep + logFile
    fs.writeFile(logFile, echoContent, {
      mode: '0777',
      encoding: 'utf8'
    }, function writeCb (e) {
      if (e) {
        console.error(echoContent)
      }
    })
  } else {
    console.error(echoContent)
  }
}

e.run.setSiteConfig = function (sc) {
  siteConfig = sc
  sc = undefined
}
module.exports = e.run
