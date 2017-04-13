'use strict'
// 文件操作系统
const fs = require('fs')
// cjb_base模块
const b = require('cjb-base')

/**
 * 加载控制器
 * @author: 桦 <yuchonghua@163.com>
 * @DateTime 2016-11-28T11:28:25+0800
 * @param    {string}                 appRootPath     [项目根路径]
 * @param    {string}                 controllersPath [控制器文件路径]
 * @param    {Function}               callback        [回调]
 */
const loadBaseHtml = module.exports = function loadBaseHtml (file, isDebug, callback) {
  if (isDebug !== true && loadBaseHtml.baseHtmlCache[file] && b.type(callback, 'function')) {
    callback(null, loadBaseHtml.baseHtmlCache[file])
    file = isDebug = callback = undefined
  } else {
    fs.readFile(file, ('utf-8'), (err, data) => {
      if (err) {
        callback(err, null)
      } else {
        if (isDebug !== true) {
          loadBaseHtml.baseHtmlCache[file] = data
        }
        callback(null, data)
      }
      file = isDebug = callback = err = data = void 0
    })
  }
}

// 加载
loadBaseHtml.baseHtmlCache = Object.create(null)
