'use strict'
// 路径模块
const path = require('path')
// 路径模块
const util = require('./util.js')
module.exports = loadViews
loadViews.dev = false
function loadViews (viewsPaths, appPath, viewsPath) {
  var viewsPathKeys = []
  var ps = []
  var views = Object.create(null)
  if (viewsPaths && typeof viewsPaths === 'object') {
    viewsPathKeys = Object.keys(viewsPaths)
  } else {
    return Promise.reject(new Error('paths not is a object'))
  }
  viewsPathKeys && Array.isArray(viewsPathKeys) && viewsPathKeys.forEach(key => {
    viewsPaths[key] && ps.push(
      loadView(viewsPaths[key], appPath, viewsPath)
      .then(res => {
        views[key] = res
        res = key = void 0
      })
    )
  })
  return Promise.all(ps)
  .then(() => {
    ps = viewsPathKeys = viewsPaths = appPath = viewsPath = void 0
    return views
  })
}
loadViews.viewsCache = Object.create(null)
// key
loadViews.viewsCacheKey = []
// 缓存文件格式
loadViews.viewsCacheLength = 50
// 清理多余的缓冲
loadViews.viewsCacheClear = function viewsCacheClear () {
  (loadViews.viewsCacheKey.splice(loadViews.viewsCacheLength || 10) || []).forEach(key => {
    delete loadViews.viewsCache[key]
  })
}
function loadView (filePath, appPath, viewsPath) {
  var fileRoot = path.join(viewsPath, filePath)
  var file = path.join(appPath, viewsPath, (filePath + '.html'))
  if (loadViews.viewsCache[fileRoot]) {
    return Promise.resolve(loadViews.viewsCache[path.join(viewsPath, filePath)])
  }
  return util.readFile(file)
  .then(html => {
    if (loadViews.dev !== true) {
      // 非调试模式缓存
      loadViews.viewsCache[fileRoot] = html
      loadViews.viewsCacheKey.unshift(fileRoot)
      loadViews.viewsCacheClear()
    }
    return html
  })
}
