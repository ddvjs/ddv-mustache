'use strict'
// 日子模块
const logger = require('../../build/logger')
const NotFindFileError = require('../NotFindFileError.js')
// 导出
module.exports = renderBaseError
// 渲染
function renderBaseError (req, res, err) {
  var is404 = false
  if (err instanceof NotFindFileError) {
    NotFindFileError.url = req.url
    NotFindFileError.path = req.path
    is404 = true
  }
  logger.error(err)
  var html = '<pre>' + err.stack + '</pre>'
  res.statusCode = is404 ? 404 : 500
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Content-Length', Buffer.byteLength(html))
  res.end(html, 'utf8')
}
