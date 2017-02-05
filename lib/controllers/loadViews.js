'use strict'
// 文件操作系统
const fs = require('fs')
// 路径模块
const path = require('path')
// cjb_base模块
const b = require('cjb-base')

/**
 * 加载模板
 * @author: 桦 <yuchonghua@163.com>
 * @DateTime 2016-11-28T11:28:25+0800
 * @param    {string}                 appRootPath     [项目根路径]
 * @param    {string}                 controllersPath [控制器文件路径]
 * @param    {Function}               callback        [回调]
 */
const loadViews = module.exports = function loadViews (view, appRootPath, viewsPath, isDebug, callback) {
  let [now, sum, views] = [0, 0, Object.create(null)]
  b.each(view || {}, function (key, filepath) {
    sum++
    let file = path.join(viewsPath, (filepath + '.html'))
    let fileRoot = path.join(appRootPath, file)
    loadViews.loadView(fileRoot, isDebug, (e, res) => {
      if (!(callback && b.type(callback, 'function'))) {
        return
      }
      if (e) {
        let err = new Error('loadViews Error key:' + key + ' path:' + file + '!')
        err.stack += '\n\n' + e.stack
        callback(err, null)
        err = view = views = appRootPath = viewsPath = callback = void 0
      } else {
        views[key] = res
        if ((++now) >= sum) {
          callback(null, views)
          view = views = appRootPath = viewsPath = callback = void 0
        }
      }
      file = fileRoot = e = res = filepath = key = void 0
    })
  })
  if (now === sum && b.type(callback, 'function')) {
    callback(null, views)
    now = sum = callback = void 0
  }
}

loadViews.viewsCache = Object.create(null)
// key
loadViews.viewsCacheKey = []
// 缓存文件格式
loadViews.viewsCacheLength = 50
// 清理多余的缓冲
loadViews.viewsCacheClear = function viewsCacheClear () {
  b.each((loadViews.viewsCacheKey.splice(loadViews.viewsCacheLength || 10) || []), function (index, fileRoot) {
    delete loadViews.viewsCache[fileRoot]
  })
}
loadViews.loadView = function loadView (fileRoot, isDebug, callback) {
  let end = function loadViewEnd (err, res) {
    if (!callback) {
      return
    }
    callback(err, res)
    end = err = res = callback = fileRoot = void 0
  }
  if (loadViews.viewsCache[fileRoot]) {
    process.nextTick(() => {
      return end && end(null, loadViews.viewsCache[fileRoot])
    })
  } else {
    fs.readFile(fileRoot, 'utf-8', function callback (err, html) {
      process.nextTick(() => {
        if (err) {
          return end && end(err, null)
        } else {
          if (isDebug !== true) {
            // 非调试模式缓存
            loadViews.viewsCache[fileRoot] = html
            loadViews.viewsCacheKey.unshift(fileRoot)
            loadViews.viewsCacheClear()
          }
          return end && end(null, html)
        }
      })
    })
  }
}
// 缓存
loadViews.DEBUG = false
