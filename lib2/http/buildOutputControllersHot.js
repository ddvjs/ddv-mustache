'use strict'
// 文件操作系统
const fs = require('fs')
// 路径模块
const path = require('path')
// mkdirs
const mkdirs = require('../tool/mkdirs.js')
// cjb_base模块
const b = require('cjb-base')
// requirejs
const requirejs = require('requirejs')
// controllers
const controllers = require('../controllers/index.js')
// 路由
const router = require('./router.js')
// 项目
const project = require('./project.js')
// ddv静态库
const ddvstaticDir = path.resolve(__dirname, '../ddvstatic')

const hotLoadPath = '/ddvstatic/js/sys/hotLoad'
const hotLoadPathLen = hotLoadPath.length
// 模块
const build = module.exports = function buildOutputControllersHot (req, res, next) {
  if (!(req.project && req.project.state === true && req.project.pathinfo)) {
    next()
    return
  }
  if (!req.project.isHotLoad) {
    next()
    return
  }
  let [router_old, project_old] = [req.router, req.project]
  req.router.url = req.project.hotPath
  next.push(
    // 使用 root 路由正则
    router('/'),
    // 参考cjb-base的队列机制，true是为了能等待节点结束
    true,
    // 查找项目
    project,
    // 等待
    true,
    // 判断是否有这个项目
    function checkProject (req, res, next) {
      // 如果是项目，尝试再次查找路由
      if (req.project && req.project.state === true) {
        // next.push 是特殊流程插入，就是在当前流程后面插入新的队列，详细使用说明参考cjb-base的队列
        next.push(
          // 使用 项目内的 config 路由再次正则处理
          router(req.project.pathinfo.config),
          // 参考cjb-base的队列机制，true是为了能等待节点结束
          true,
          // 因为路由有可能修改路由地址，需要重新查找项目
          project
        )
        // 删除root路由项目信息，等待重组
        delete req.project
      }
      // 下一步
      next()
    },
    // 等待
    true,
    // 判断经过二次路由后是否还是项目
    function (req, res, next) {
      if (req.project && req.project.state !== true) {
        req.router = router_old
        req.project = project_old
        // 不是项目了，还原数据
        next()
      } else {
        // 插入热编译中间件
        next.push(build.runHot)
        // 继续
        next()
      }
      router_old = project_old = req = res = next = void 0
    }
  )
}
build.runHot = function (req, res, next, __resolve, reject) {
  // 调试模式传递
  controllers.DEBUG = req.DEBUG || false
  // 加载控制器
  controllers.loadController(req.appRootPath, req.project.pathinfo.controllers, req.project.pathinfo.core, req.project.path, (err, controller) => {
    if (err) {
      if (err.code === 404) {
        next()
        return
      } else {
        reject(err)
        return
      }
    } else {
      // 控制器
      req.controller = controller
      // 运行控制器
      build.runController.apply(this, arguments)
      return
    }
    req = res = next = __resolve = reject = controller = err = void 0
  })
}
/**
 * [runController 运行控制器]
 * @author: 桦 <yuchonghua@163.com>
 * @DateTime 2016-11-28T15:41:59+0800
 * @param    {[type]}                 controller [description]
 * @param    {[type]}                 req        [description]
 * @param    {[type]}                 res        [description]
 * @param    {Function}               next       [description]
 * @param    {[type]}                 __resolve  [description]
 * @param    {[type]}                 reject     [description]
 * @return   {[type]}                            [description]
 */
build.runController = function runController (req, res, next, __resolve, reject) {
  if (!req.controller) {
    next()
    return
  }
  let [q, br, fd, config, loadlists] = [b.queue(), '\r\n', 0, Object.create(null), []]

  // 错误
  q.end((state, res) => {
    if (state) {
      next()
    } else {
      res.code = 500
      reject(res)
    }
    // 变量gc
    req = res = next = q = void 0
  }).push((next, resolve, reject) => {
    // 查看编译目录状态
    fs.stat(req.buildOuputDirPath, (e, s) => {
      if ((!e) && s.isFile()) {
        // 如果编译目录的地址是一个放有一个文件
        // 直接删除文件
        fs.unlink(req.buildOuputDirPath, function (err) {
          if (err) {
            reject(err)
          } else {
            next()
          }
        })
      } else {
        next()
      }
    })
  }, true, (next, resolve, reject) => {
    // 生成编译目录
    mkdirs(req.buildOuputDirPath, 0o777, (state) => {
      if (state) {
        // 下一步
        next()
      } else {
        // 生成失败
        reject(new Error('Failed to create build directory！'))
      }
    })
  }, true, (next) => {
    fd = fs.createWriteStream(req.buildOuputFilePath)

    let fdRead = fs.createReadStream(path.resolve(ddvstaticDir, './js/ddv/hotLoadHead.js'))

    fdRead.pipe(fd, {
      end: false,
      autoClose: true
    })
    fdRead.on('end', () => {
      next()
    })
  }, true, (next) => {
    fd.write('addLoadLists((function(){var c,loadLists = (function(){function ddvConfig() {};ddvConfig.prototype = (Object&&Object.create)?Object.create(null):null;return new ddvConfig();}());' + br)
    next()
  }, true, (next) => {
    let appRootPathLen = (req.appRootPath.length) || 0
    b.each(req.controller.paths, (index, p) => {
      let context = fs.readFileSync(p, {encoding: 'utf8'})
      let key = p.substr(appRootPathLen)
      key = (key[0] === '/' ? '' : '/') + key
      fd.write('loadLists[' + JSON.stringify(key) + ']=' + JSON.stringify(context.toString()) + ';' + br)
    })

    let context = fs.readFileSync(path.join(req.appRootPath, './router.js'), {encoding: 'utf8'})
    fd.write('loadLists[' + JSON.stringify('/router.js') + ']=' + JSON.stringify(context.toString()) + ';' + br)

    b.each(req.controller.model, (index, p) => {
      p = path.join(req.project.pathinfo.models, p + '.js')

      let context = fs.readFileSync(path.resolve(req.appRootPath, './' + p), {encoding: 'utf8'})

      fd.write('loadLists[' + JSON.stringify(p) + ']=' + JSON.stringify(context.toString()) + ';' + br)
    })
    b.each(req.controller.view, (name, p) => {
      p = path.join(req.project.pathinfo.views, p + '.html')

      let context = fs.readFileSync(path.resolve(req.appRootPath, './' + p), {encoding: 'utf8'})

      fd.write('loadLists[' + JSON.stringify(p) + ']=' + JSON.stringify('define(function(){return ' + JSON.stringify(context.toString()) + ';})') + ';' + br)
    })
    next()
  }, true, (next, resolve, reject) => {
    // 设定 所有模块的查找根路径
    config.baseUrl = req.project.pathinfo.base
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

    let libLists = path.resolve(req.appRootPath + req.project.pathinfo.config, './lib.lists.js')

    requirejs([libLists], (config_fn) => {
      config_fn.call(config, config)
      next()
      libLists = void 0
    }, (err) => {
      reject(err)
      libLists = void 0
    })
  }, true, (next) => {
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
    next()
  }, true, (next) => {
    config.pathinfo = {dir: req.project.pathinfo}
    config.appConfig = req.appConfig || b.inherit(null)
    fd.write('loadLists["config"] = c = ' + build.toJSON(config) + ';' + br)
    next()
  }, true, (next) => {
    let i = 0
    let load = (name, path, isDdvstatic) => {
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
          fd.write('loadLists[' + JSON.stringify(name) + ']=' + JSON.stringify(context) + ';' + br)
          fn()
        }
      })
    }
    let fn = () => {
      let name = loadlists[i++] || null
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
          case '/':
            return fn()
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
        next()
      }
    }
    fn()
  }, true, (next) => {
    fd.write(br + 'return loadLists;}()),(function(){var w;try{w=window;}catch(e){try{w =global;}catch(e){throw "find not global";}}return w;}()));')
    fd.on('close', function () {
      next()
    })
    fd.end()
  }, true, (next, resolve) => {
    // 确实是文件，传递编译地址
    req.buildInputFilePath = req.buildOuputFilePath
    resolve()
  // 运行队列
  }).run()
}

// ajax提交数据转数组类型结束
// 对象转换为JSON开始
build.toJSON = function (o) {
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
      return (new String(o)).toString()
    case 'string':
      return '"' + o.replace(/([\"\\])/g, '\\$1').replace(/(\n)/g, '\\n').replace(/(\r)/g, '\\r').replace(/(\t)/g, '\\t') + '"'
    case 'array':
      for (var i = 0,
        l = o.length; i < l; i++) {
        s.push(build.toJSON(o[i]))
      }
      return '[' + s.join(',') + ']'
    case 'error':
    case 'object':
      for (var p in o) {
        if (typeof o[p] !== 'undefined') {
          s.push('"' + p + '":' + build.toJSON(o[p]))
        }
      }
      return '{' + s.join(',') + '}'
    default:
      return ''
  }
}
