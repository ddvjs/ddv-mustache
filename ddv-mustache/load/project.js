'use strict'
// 文件操作系统
const fs = require('fs')
// 路径模块
const path = require('path')

const ddvStaticPath = '/ddvstatic/'
const ddvStaticPathLen = ddvStaticPath.length
const hotLoadPath = '/ddvstatic/js/sys/hotLoad'
const hotLoadPathLen = hotLoadPath.length

function joinConfigDir ({pathArray, pathI = 0, appDir}) {
  if (!(pathArray && pathArray.length > 0 && pathI < pathArray.length)) {
    return Promise.reject(new Error('not find project'))
  }
  var project = Object.create(null)
  project.pathI = pathI
  // path,子项目路径，相对站点根目录的相对路径
  project.base = path.normalize('/' + (pathArray.slice(0, pathI).join('/')))
  // app子项目，绝对路径
  project.rootAppDir = path.join(appDir, project.base)
  // 路由文件
  project.routerFile = path.join(project.rootAppDir, 'config/router.js')

  return isFile(project.routerFile)
  .then(() => {
    return project
  })
  .catch(e => {
    pathI++
    return joinConfigDir({pathArray, pathI, appDir})
  })
}
module.exports = function getProject (appDir, router) {
  var pathArray = []
  // 以 / 来拆分 path 为一个数组
  pathArray = router.path.length > 0 ? (router.path || '/').split('/') : []

  return joinConfigDir({pathArray, appDir})
  .then(({base, routerFile, pathI}) => {
    var project = Object.create(null)
    project.routerFile = routerFile
    project.base = base
    // 提取控制器路径
    if (pathArray.length > pathI) {
      project.path = '/' + pathArray.slice(pathI).join('/')
      project.dirType = pathArray[pathI] || ''
    } else {
      project.path = '/'
      project.dirType = ''
    }
    project.isHotLoad = false
    project.isDdvStatic = false
    project.hotPath = null
    project.ddvStaticPath = null
    if (project.path === '/ddvstatic/js/sys/hotLoad.js') {
      project.isHotLoad = true
      project.hotPath = router.query || '/'
    } else if (project.path.substr(0, hotLoadPathLen) === hotLoadPath) {
      project.isHotLoad = true
      project.hotPath = project.path.substr(hotLoadPathLen)
    } else if (project.path.substr(0, ddvStaticPathLen) === ddvStaticPath) {
      project.isDdvStatic = true
      project.ddvStaticPath = project.path.substr(ddvStaticPathLen - 1)
    }
    project.pathinfo = Object.create(null)
    // 遍历拼接路径
    'cache config controllers core images libraries logs models styles views'.split(' ').forEach(dirName => {
      project.pathinfo[dirName] = path.resolve(base, dirName)
    })
    project.pathinfo.url = base + '/'
    return project
  })
}

function isFile (path) {
  return new Promise((resolve, reject) => {
    fs.stat(path, (e, stats) => {
      if ((!e) && stats && stats.isFile && stats.isFile()) {
        resolve()
      } else {
        reject(new Error('Not Directory or File'))
      }
    })
  })
}
