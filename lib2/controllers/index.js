'use strict'
// 文件操作系统
const fs = require('fs')
// 路径模块
const path = require('path')
// cjb_base模块
const b = require('cjb-base')
// requirejs
const requirejs = require('requirejs')
// 控制器
const controllers = module.exports = Object.create(null)

/**
 * 加载控制器
 * @author: 桦 <yuchonghua@163.com>
 * @DateTime 2016-11-28T11:28:25+0800
 * @param    {string}                 appRootPath     [项目根路径]
 * @param    {string}                 controllersPath [控制器文件路径]
 * @param    {Function}               callback        [回调]
 */
controllers.loadController = function loadController (appRootPath, controllersPath, corePath, filePath, callback) {
  let [q, i, files, file, controller, controllerArray] = [b.queue(), 0, [], null, Object.create(null), []]
  q.end(function onEnd (state, res) {
    if (b.type(callback, 'function')) {
      if (state) {
        callback(null, res)
      } else {
        callback(res, null)
      }
    }
    q = i = files = file = controller = controllerArray = res = void 0
  }).push(function joinControllersPath (next) {
    let file = path.join(appRootPath, controllersPath, filePath)
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
    next()
    file = next = void 0
  }, true, function checkControllers (next, resolve, reject) {
    if (i >= files.length) {
      let err = new Error('The controller does not exist')
      err.code = 404
      reject(err)
      return
    } else {
      file = files[i++]
      // 判断文件存在
      fs.stat(file, function statCb (e, stat) {
        if (!e) {
          if (stat.isFile()) {
            next()
          } else {
            // 尝试重新找-因为不是一个文件
            next('checkControllers')
            return
          }
        } else if (e.code === 'ENOENT') {
          // 尝试重新找-因为没有找到文件或路径
          next('checkControllers')
          return
        } else {
          e.code = 500
          reject(e)
        }
      })
    }
  }, true, function loadControllerFile (next, resolve, reject) {
    // 调用载入器载入
    requirejs([file], function (c) {
      if (controllers.DEBUG && file) {
        // 调试模式的缓存清除
        requirejs.undef(file)
      }
      controllerArray.unshift(b.clone(c))
      next()
    }, function (e) {
      let appRootPathT = path.resolve(appRootPath, './')
      if (controllers.DEBUG && file) {
        // 调试模式的缓存清除
        requirejs.undef(file)
      }
      let err = new Error('Failed to load controller from ' + file.substr(appRootPathT.length))
      if (e.stack) {
        err.stack += '\n\n' + e.stack
      }
      err.code = 500
      reject(err)
    })
  }, true, function checkLoadControllerFile (next, resolve, reject) {
    if (controllerArray.length < 0) {
      next()
      return
    }
    controller.paths = controller.paths || []
    controller.paths.push(file)
    if (controllerArray && controllerArray[0] && b.type(controllerArray[0].extend, 'string')) {
      // 获取当前控制器依赖的控制器名称
      file = path.join(appRootPath, corePath, (controllerArray[0].extend + '.js'))
      // 跳回上一步加载依赖控制器
      next('loadControllerFile')
    } else {
      next()
    }
  }, true, function mergeFile (next, resolve, reject) {
    // 循环所有的控制器
    b.each((controllerArray || []), (index, c) => {
      // 循环控制器的每一个方法
      b.each((c || []), (key, value) => {
        switch (key) {
          // 跳过继承字段
          case 'title':
            controller.title = value
            break
          case 'extend':
            return
          case 'node_require':
          case 'browser_require':
            controller[key] = b.type(controller[key], 'array') ? controller[key] : []
            b.each(value, function (index, path) {
              controller[key].push(path)
            })
            break
          // 浏览器和node服务器的代码压入数组
          case 'app_base':
          case 'browser':
          case 'node':
            controller[key] = b.type(controller[key], 'array') ? controller[key] : []
            controller[key].push(value)
            break
          // 其他使用撮合
          default:
            if (!controller[key]) {
              controller[key] = b.clone(value)
            } else {
              b.extend(true, controller[key], b.clone(value))
            }
            break
        }
      })
    })
    resolve(controller)
  }).run()
}
// 缓存
controllers.DEBUG = false

// 控制器加载
global.controllers = function (controllers) {
  requirejs.define(controllers)
}
