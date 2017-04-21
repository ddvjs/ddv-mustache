'use strict'
const path = require('path')
const buildUtil = require('./util.js')
module.exports = Object.assign(getEntryAndCopyPath, {watch})
function getEntryAndCopyPath (self, entryBase, pluginBase) {
  var cache
  if (self) {
    cache = self._entryAndCopyPathCache = self._entryAndCopyPathCache || Object.create(null)
  }
  return Promise.all([
    cache && cache.entry ? Promise.resolve(cache.entry) : getEntry(self),
    cache && cache.copyPath ? Promise.resolve(cache.copyPath) : getCopyPath(self)
  ])
  .then(([entry, copyPath]) => {
    entry = Object.assign(Object.create(null), (entryBase || Object.create(null)), entry)
    copyPath = (Array.isArray(pluginBase) ? pluginBase : []).concat(Array.isArray(copyPath) ? copyPath : [])
    return {entry, copyPath}
  })
}
function getEntry (self, isReload = false) {
  return buildUtil.getCache(self)
  .then(cache => {
    if (cache && cache.entry && (!isReload)) {
      return Promise.resolve(cache.entry)
    } else {
      return getEntryByGlob(self, cache)
      .then(paths => {
        var entry = Object.create(null)
        Array.isArray(paths) && paths.forEach(p => {
          var t = path.parse(p)
          entry[path.join(t.dir, t.name)] = ('./app/' + p)
        })
        cache.entry = entry
        return cache.entry
      })
    }
  })
}
function getEntryByGlob (self, cache) {
  return Promise.all([
    buildUtil.getPathByGlob('/*/styles/**/*.*', {
      root: self.appDir
    })
  ])
  .then(res => {
    var paths = []
    res.forEach(t => {
      if (Array.isArray(t)) {
        paths = paths.concat(t)
      }
    })
    cache.entryPaths = paths
    return paths
  })
}
function getCopyPath (self, isReload = false) {
  return buildUtil.getCache(self)
  .then(cache => {
    if (cache && cache.entry && (!isReload)) {
      return Promise.resolve(cache.entry)
    } else {
      return getCopyPathByGlob(self, cache)
    }
  })
}
function getCopyPathByGlob (self, cache) {
  var options = {
    root: self.appDir
  }
  return Promise.all([
    buildUtil.getPathByGlob('/*/controllers/', options),
    buildUtil.getPathByGlob('/*/views/', options),
    buildUtil.getPathByGlob('/*/core/', options),
    buildUtil.getPathByGlob('/*/models/', options),
    buildUtil.getPathByGlob('/*/libraries/', options),
    buildUtil.getPathByGlob('/*/images/', options),
    buildUtil.getPathByGlob('/*/config/', options),
    buildUtil.getPathByGlob('/*/fonts/', options)
  ])
  .then(res => {
    var paths = []
    res.forEach(t => {
      if (Array.isArray(t)) {
        paths = paths.concat(t)
      }
    })
    return paths
  })
  .then(paths => {
    var copyWebpackPath = []
    paths.forEach(p => {
      copyWebpackPath.push({ from: path.join(self.appDir, p), to: p })
    })
    return copyWebpackPath
  })
}

function watch (entryBase) {
  return Promise.resolve()
}
