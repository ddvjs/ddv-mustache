'use strict'
// 日子模块
const logger = require('../../build/logger')
// 导出
module.exports = renderBaseError
// 渲染
function renderBaseError (req, res, err) {
  console.log(req.project)
  logger.error(err)
  var html = '<pre>' + err.stack + '</pre>'
  res.statusCode = 500
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Content-Length', Buffer.byteLength(html))
  res.end(html, 'utf8')
}
