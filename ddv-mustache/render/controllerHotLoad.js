'use strict'
const fs = require('fs')
// cjb_base模块
const b = require('cjb-base')
const path = require('path')
const requirejs = require('requirejs')
const load = require('../load')
const util = require('../load/util.js')
const renderError = require('./error.js')
// ddv静态库
const ddvstaticDir = path.resolve(__dirname, '../ddvstatic')
// 文件
module.exports = renderControllerHotLoad
function renderControllerHotLoad (req, res, next) {
  if (this && req.project && req.project.isHotLoad && req.path) {
    var query = util.url('query', req.url)
    var reqt = Object.create(req)
    reqt.url = query
    return load.router(reqt, this.appDir)
    // 查找项目
    .then(router => load.project(this.appDir, router))
    .then(project => {
      if ((!project) || (!project.base) || project.isHotLoad || project.isDdvStatic) {
        return Promise.reject(new Error('not is hot load'))
      }
      return project
    })
    .then(project => {
      return runControllerHotLoad.call(this, project, req, res, next)
    }, e => next())
    .then(() => {
      query = reqt = void 0
    }, e => {
      // 有错误总得渲染出来吧
      renderError(req, res, e)
      query = reqt = void 0
    })
  } else {
    next()
  }
}
function runControllerHotLoad (project, req, res, next) {
  var controller
  var br = '\n'
  var config = Object.create(null)
  var loadlists = []
  return load.controller(this.appDir, project)
  .then(c => { controller = c })
  .then(() => {
    // 设置类型头
    res.setHeader('Content-Type', 'text/html;charset=UTF-8')
  })
  .then(() => {
    let fdRead = fs.createReadStream(path.resolve(ddvstaticDir, './js/ddv/hotLoadHead.js'))

    fdRead.pipe(res, {
      end: false,
      autoClose: true
    })
    return new Promise((resolve) => {
      fdRead.on('end', () => {
        resolve()
      })
    })
  })
  .then(() => {
    res.write('addLoadLists((function(){var c,loadLists = (function(){function ddvConfig() {};ddvConfig.prototype = (Object&&Object.create)?Object.create(null):null;return new ddvConfig();}());' + br)
  })
  .then(() => {
    let appDirLen = (this.appDir.length) || 0
    b.each(controller.paths, (index, p) => {
      let context = fs.readFileSync(p, {encoding: 'utf8'})
      let key = p.substr(appDirLen)
      key = (key[0] === '/' ? '' : '/') + key
      res.write('loadLists[' + JSON.stringify(key) + ']=' + JSON.stringify(context.toString()) + ';' + br)
    })

    let context = fs.readFileSync(path.join(this.appDir, './router.js'), {encoding: 'utf8'})
    res.write('loadLists[' + JSON.stringify('/router.js') + ']=' + JSON.stringify(context.toString()) + ';' + br)

    b.each(controller.model, (index, p) => {
      p = path.join(project.pathinfo.models, p + '.js')

      let context = fs.readFileSync(path.resolve(this.appDir, './' + p), {encoding: 'utf8'})

      res.write('loadLists[' + JSON.stringify(p) + ']=' + JSON.stringify(context.toString()) + ';' + br)
    })
    b.each(controller.view, (name, p) => {
      p = path.join(project.pathinfo.views, p + '.html')

      let context = fs.readFileSync(path.resolve(this.appDir, './' + p), {encoding: 'utf8'})

      res.write('loadLists[' + JSON.stringify(p) + ']=' + JSON.stringify('define(function(){return ' + JSON.stringify(context.toString()) + ';})') + ';' + br)
    })
  })
  .then(() => {
    // 设定 所有模块的查找根路径
    config.baseUrl = project.pathinfo.base
    // 设定 插件映射[path映射那些不直接放置于baseUrl下的模块名][用于模块名的path不应含有.js后缀]
    config.paths = Object.create(null)
    // 设定 为那些没有使用define()来声明依赖关系、设置模块的"浏览器全局变量注入"型脚本做依赖和导出配置。
    config.shim = Object.create(null)
    // 设定 捆绑
    config.bundles = Object.create(null)
    // 设定 优先加载
    config.priority = Object.create(null)

    // 指定要加载的一个依赖数组。当将require设置为一个config object在加载require.js之前使用时很有用。
    // 一旦require.js被定义，这些依赖就已加载。使用deps就像调用require([])，
    // 但它在loader处理配置完毕之后就立即生效。它并不阻塞其他的require()调用，
    // 它仅是指定某些模块作为config块的一部分而异步加载的手段而已。
    config.context = 'ddv'
    config.ddvstatic = './ddvstatic/'
    config.libraries = './libraries/'
    config.jqBaseUrl = config.ddvstatic + 'js/jq/'
    config.configBaseUrl = './config/'
    config.ie678 = false
    config.isWindow = true

    config.push = function () {
      var args = b.argsToArray(arguments)
      args.unshift(true, config)
      b.extend.apply(config, args)
    }

    config.loadlists = []

    let libLists = path.resolve(this.appDir + project.pathinfo.config, './lib.lists.js')

    return new Promise((resolve, reject) => {
      requirejs([libLists], (configFn) => {
        configFn.call(config, config)
        resolve()
        libLists = void 0
      }, (err) => {
        reject(err)
        libLists = void 0
      })
    })
  })
  .then(() => {
    config.loadlistsPath = []
    // 别名复制
    b.each(config.bundles, function (key, bundles) {
      b.each(bundles || [], function (i, bundle) {
        config.paths[bundle] = config.paths[key]
        config.Map[bundle] = config.Map[key]
        config.shim[bundle] = config.shim[key]
      })
    })
    config.loadlistsNew = []
    let fn = (name, lists) => {
      let shim = config.shim[name] || null
      if (shim && shim.deps) {
        b.each((shim.deps || []), function (i, name) {
          fn(name, lists)
          lists.push(name)
        })
      }
      lists.push(name)
    }

    // 循环拿路径
    b.each(config.loadlists, (index, name) => {
      fn(name, config.loadlistsNew)
    })
    loadlists = b.array.unique(config.loadlistsNew)
    delete config.loadlistsNew
  })
  .then(() => {
    config.pathinfo = {dir: req.project.pathinfo}
    config.appConfig = req.appConfig || b.inherit(null)
    res.write('loadLists["config"] = c = ' + renderControllerHotLoad.toJSON(config) + ';' + br)
  })
  .then(() => {
    return new Promise(resolve => {
      let i = 0
      let load = (name, path, isDdvstatic) => {
        console.log('path', path, 'isDdvstatic', isDdvstatic)
        if (isDdvstatic) {
          if (['/js/sys/cjb-base.js', '/js/sys/cjb-base.js.map', '/js/sys/cjb-base.source.js'].indexOf(path) > -1) {
            try {
              let t = require.resolve('cjb-base/lib' + path.substr('/js/sys'.length))
              path = t
              t = undefined
            } catch (e) {
              path = ddvstaticDir + path
            }
          } else {
            path = ddvstaticDir + path
          }
        }
        fs.readFile(path, {encoding: 'utf8'}, (err, context) => {
          if (err) {
            fn()
          } else {
            res.write('loadLists[' + JSON.stringify(name) + ']=' + JSON.stringify(context) + ';' + br)
            fn()
          }
        })
      }
      let fn = () => {
        let name = loadlists[i++] || null
        console.log(name)
        if (name) {
          let p = (config.paths[name] || name) + '.js'
          let p2 = p.substr(0, 2)
          let rootp = req.project.rootdir

          // 处理
          switch (p2) {
            case './':
              p = path.resolve(rootp, p)
              break
            case '/':
              p = path.resolve(rootp, ('..' + path.sep + p))
              break
            default:
              if (p.substr(0, 3) === '//:' ||
              p.substr(0, 3) === 'ftp' ||
              p.substr(0, 4) === 'ftps' ||
              p.substr(0, 4) === 'http' ||
              p.substr(0, 5) === 'https') {
                p = ''
                return fn()
              } else {
                p = path.resolve(rootp, p)
                break
              }
          }
          if (!p) {
            return fn()
          }
          p = path.normalize(p)
          try {
            if (p.substr(rootp.length + 1, 'ddvstatic'.length) === 'ddvstatic') {
              p = p.substr(rootp.length + 1 + 'ddvstatic'.length)
              load(name, p, true)
              return
            }
          } catch (e) {}
          load(name, p, false)
        } else {
          resolve()
        }
      }
      fn()
    })
  })
  .then(() => {
    res.write(br + 'return loadLists;}()),(function(){var w;try{w=window;}catch(e){try{w =global;}catch(e){throw "find not global";}}return w;}()));')
  })
  .then(() => {
    res.end()
  })
}
// ajax提交数据转数组类型结束
// 对象转换为JSON开始
renderControllerHotLoad.toJSON = function toJSON (o) {
  var s = []
  switch (b.type(o)) {
    case 'undefined':
      return 'undefined'
    case 'null':
      return 'null'
    case 'number':
    case 'boolean':
    case 'date':
    case 'function':
      // eslint-disable-next-line no-new-wrappers
      return (new String(o)).toString()
    case 'string':
      return '"' + o.replace(/(["\\])/g, '\\$1').replace(/(\n)/g, '\\n').replace(/(\r)/g, '\\r').replace(/(\t)/g, '\\t') + '"'
    case 'array':
      for (var i = 0,
        l = o.length; i < l; i++) {
        s.push(toJSON(o[i]))
      }
      return '[' + s.join(',') + ']'
    case 'error':
    case 'object':
      for (var p in o) {
        if (typeof o[p] !== 'undefined') {
          s.push('"' + p + '":' + toJSON(o[p]))
        }
      }
      return '{' + s.join(',') + '}'
    default:
      return ''
  }
}
