'use strict'
// 路径模块
const path = require('path')
const NotFindFileError = require('../NotFindFileError.js')
// 路径模块
const util = require('./util.js')
module.exports = controller
controller.dev = false
function controller (appPath, project) {
  var controllersPath, corePath, filePath, files, file
  if (project && project.pathinfo) {
    [controllersPath, corePath, filePath] = [project.pathinfo.controllers, project.pathinfo.core, project.path]
  } else {
    return Promise.reject(new NotFindFileError('file not found by project not found'))
  }
  files = []
  file = path.join(appPath, controllersPath, filePath)
  if (file.substr(-3) === '.js') {
    files.push(file)
  } else {
    if (file.substr(-1) === '/') {
      file = file.substr(0, file.length - 1)
    }
    if (filePath.length > 1) {
      files.push((file + '.js'))
    }
    files.push(path.join(file, '/index.js'))
  }
  return getControllerFile(files)
  // 加载控制器
  .then(file => loadControllerFile(file, appPath, corePath))
}
// 获取控制器文件
function loadControllerFile (file, appPath, corePath) {
  return util.requirejs(file)
  .then(c => {
    if (controller.dev && file) {
      // 调试模式的缓存清除
      util.requirejs.undef(file)
    }
    if (c.extend && appPath && corePath) {
      let extend = path.join(appPath, corePath, (c.extend + '.js'))
      return util.isFile(extend)
      .then(() => {
        return loadControllerFile(extend, appPath, corePath)
        .then(extendc => {
          return {c, extendc}
        })
      }, e => {
        return {c}
      })
    }
    return {c}
  })
  .then(({c, extendc}) => {
    var controller = Object.create(null)
    var controllers = [extendc, c]
    controllers.forEach(ct => {
      var keys
      if (!ct) {
        return
      }
      keys = Object.keys(ct)
      keys && Array.isArray(keys) && keys.forEach(key => {
        var value
        value = ct[key]
        switch (key) {
          // 跳过继承字段
          case 'title':
            controller.title = value
            break
          case 'extend':
            return
          case 'node_require':
          case 'browser_require':
            controller[key] = Array.isArray(controller[key]) ? controller[key] : []
            Array.isArray(value) && value.forEach(path => {
              controller[key].push(path)
            })
            break
          // 浏览器和node服务器的代码压入数组
          case 'app_base':
          case 'browser':
          case 'node':
            controller[key] = Array.isArray(controller[key]) ? controller[key] : []
            controller[key].push(value)
            break
          // 其他使用撮合
          default:
            if (!controller[key]) {
              controller[key] = util.clone(value)
            } else {
              Object.assign(controller[key], util.clone(value))
            }
            break
        }
        key = value = void 0
      })
      keys = ct = void 0
    })
    extendc = c = controllers = void 0
    return controller
  })
  .catch(e => {
    var filePath = file
    if (appPath) {
      let appPathT = path.resolve(appPath, './')
      filePath = file.substr(appPathT.length)
    }
    if (controller.dev && file) {
      // 调试模式的缓存清除
      util.requirejs.undef(file)
    }
    var err = new Error('Failed to load controller from ' + filePath)
    if (e.stack) {
      err.stack = e.stack + '\n\n' + err.stack
    }
    err.code = 500
    return Promise.reject(err)
  })
}
// 获取控制器文件
function getControllerFile (files) {
  if (!(files && Array.isArray(files) && files.length > 0)) {
    return Promise.reject(new NotFindFileError('file not found by project not found'))
  }
  var file = files.splice(0, 1)
  if (!(file && Array.isArray(file) && file.length > 0)) {
    return Promise.reject(new NotFindFileError('file not found by project not found'))
  }
  file = file[0]
  return util.isFile(file)
  .then(() => (file))
  .catch(e => {
    return getControllerFile(files)
  })
}
// 控制器加载
global.controllers = function (controllers) {
  util.requirejs.define(controllers)
}
