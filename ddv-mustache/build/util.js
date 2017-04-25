'use strict'
const path = require('path')
const glob = require('glob')
module.exports = {
  getPathByGlob,
  getFilesByGlob,
  getCache
}
// 获取文件path列表
function getPathByGlob (pattern, options) {
  options.root = options.root || ''
  return getFilesByGlob(pattern, options)
  .then(files => {
    var paths = []
    var appDirCheck = options.root + '/'
    var appDirLen = appDirCheck.length || 0
    appDirCheck = appDirCheck.replace(/\//g, path.sep)
    files.forEach(file => {
      if (file.substr(0, appDirLen) === appDirCheck) {
        paths.push(file.substr(appDirLen))
      }
    })
    appDirLen = void 0
    return paths
  })
}
// 获取文件列表
function getFilesByGlob (pattern, options) {
  return new Promise((resolve, reject) => {
    glob(pattern, options, (err, files) => {
      files = Array.isArray(files) ? files : []
      err ? reject(err) : resolve(files)
    })
  })
}
// 获取缓存对象
function getCache (self) {
  if (self && typeof self === 'object') {
    self._entryAndCopyPathCache = self._entryAndCopyPathCache || Object.create(null)
    return Promise.resolve(self._entryAndCopyPathCache)
  } else {
    return Promise.reject(new Error('no input self'))
  }
}
