'use strict'
// 路径模块
const path = require('path')
// cjb_base模块
const b = require('cjb-base')
// jsdom 创建
const jsdom = require('jsdom')
// controllers
const controllers = require('../controllers/index.js')
// loadBaseHtml
const loadBaseHtml = require('../controllers/loadBaseHtml.js')
// loadJQuery
const loadJQuery = require('../controllers/loadJQuery.js')
// loadViews
const loadViews = require('../controllers/loadViews.js')
// loadModels
const loadModels = require('../controllers/loadModels.js')
// 引入模块
const requirejs = require('requirejs')
// mustache
const mustache = requirejs(path.resolve(__dirname, '../ddvstatic/js/mustache/mustache.js'))
// apiRESTful
const apiRESTful = require('../apiRESTful.js')

const oftentool = requirejs(path.resolve(__dirname, '../ddvstatic/js/hz/oftentool.js'))
// 模块
const build = module.exports = function buildOutputControllers (req, res, next, __resolve, reject) {
  if (!(req.project && req.project.state === true && req.project.pathinfo)) {
    next()
    return
  }
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
      delete req.controller.paths
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

  // console.log(new String(res.setHeader).toString())
  // res.end();

  // console.log('controller-*',controller);
  // console.log('router',req.router);
  // console.log('project',req.project);
  // console.log('this._headers',res._headers);
  let [q] = [b.queue()]

  // 错误
  q.end((state, res) => {
    if (!state) {
      res.code = 500
      reject(res)
    }
    console.log('state,res', state, res)
    // 变量gc
    req = res = next = q = void 0
  }).push((next) => {
    req.controller.userAgent = req.headers['user-agent']
    req.controller.APP = b.inherit(b)
    req.controller.APP.userAgent = req.controller.userAgent
    oftentool(req.controller.APP)
    next()
  }, true, (next, resolve, reject) => {
    if (!req.controller.view) {
      next()
      return
    }
    loadViews.DEBUG = req.DEBUG
    // 加载loadViews
    loadViews(req.controller.view, req.appRootPath, req.project.pathinfo.views, req.DEBUG, (err, views) => {
      if (err) {
        reject(err)
        return
      }
      // 创建一个空的纯粹的对象
      req.controller.view = views
      // 销毁
      views = void 0
      // 下一步操作
      next()
    })
  }, true, (next, resolve, reject) => {
    // 检测baseHtml文件
    if (req.controller.basehtml && req.controller.basehtml.path) {
      req.controller.baseHtmlPath = path.join(req.appRootPath, req.project.pathinfo.views, req.controller.basehtml.path)
      next()
    } else {
      reject(new Error('controllers.basehtml not config basehtml path'))
    }
  }, true, (next, resolve, reject) => {
    // 加载baseHtml文件
    loadBaseHtml(req.controller.baseHtmlPath, req.DEBUG, (err, basehtml) => {
      if (err) {
        reject(err)
      } else {
        req.controller.baseHtmlText = basehtml
        next()
      }
      err = basehtml = void 0
    })
  }, true, (next, resolve, reject) => {
    req.controller.pathinfo = {
      dir: req.project.pathinfo,
      path: (req.router.path || '')
    }
    // baseHtml缓存
    req.controller.baseHtmlText = mustache.render(req.controller.baseHtmlText, req.controller.pathinfo)
    jsdom.env({
      html: req.controller.baseHtmlText,
      done: (e, window) => {
        if (e) {
          reject(e)
        } else {
          req.window = window
          next()
        }
      }
    })
  }, true, (next, resolve, reject) => {
    // 调试模式
    loadJQuery.DEBUG = req.DEBUG
    loadJQuery((e, jQueryInit) => {
      if (e) {
        reject(e)
      } else {
        jQueryInit(req.window)
        req.controller._$ = req.window.$
        req.window.$.fn.outerHtml = function (html) {
          if (arguments.length > 0) {
            this.prop('outerHTML', html)
          }
          return this.prop('outerHTML')
        }
        req.window.Mustache = mustache
        next()
      }
    })
  }, true, (next) => {
    // 重写标题
    req.window.$('title').html(req.controller.title)
    delete req.controller.title
    delete req.controller.basehtml
    delete req.controller.baseHtmlPath
    delete req.controller.baseHtmlText
    next()
  }, true, (next) => {
    loadJQuery.loadJQueryRender(req.window.$, req.controller.pathinfo, req.appConfig.window_select, () => {
      next()
    })
  }, true, (next) => {
    req.cookie_name = (b.url('hostname', req.appConfig.urlapi.model) + ':' + b.url('port', req.appConfig.urlapi.model))
    req.cookie_name = req.cookie_name || req.headers.host
    req.cookie_name = apiRESTful.run.session.hostnameen(req.cookie_name)
    req.session_data = res.cookies[req.cookie_name]
    req.session_data_old = req.session_data
    try {
      req.session_data = b.parseJSON(req.session_data) || {}
    } catch (e) {
      req.session_data = {}
    }
    if (req.session_data) {
      next()
    } else {
      // 初始化
      next()
    }
  }, true, (next, resolve, reject) => {
    if (!req.controller.model) {
      next()
      return
    }
    loadModels(req, (err) => {
      if (err) {
        reject(err)
      } else {
        req.controller.model = req._controllersModels
        next()
      }
    })
  }, true, (next, resolve, reject) => {
  // 创建加载容器
    // 选择容器
    req.controller.wrap = req.window.$(req.appConfig.window_wrap_select)
    // 这个页面的容器
    req.controller.bodywrap = req.window.$(req.appConfig.window_create)
    // 插入容器
    req.controller.wrap.append(req.controller.bodywrap)
    // pid
    req.controller.bodywrap.attr('pid', 0)
    req.controller.pathquery = req.router.pathquery
    // 修改路径
    req.controller.bodywrap.attr('pathquery', req.controller.pathquery)
    req.controller.bodywrap.attr('is_server_node', 'true')
    // 插入容器
    req.controller.bodywrap.hide()
    req.controller.styles = req.controller.styles || req.window.$(req.controller.bodywrap.children('[appwindow="styles"]:first'))
    req.controller.body = req.controller.body || req.window.$(req.controller.bodywrap.children('[appwindow="body"]:first'))

    req.controller.router = b.inherit(null)
    b.extend(true, req.controller.router, req.router)
    req.controller.router.query_string = req.controller.router.query || ''
    req.controller.router.query = b.url('?', ('?' + req.controller.router.query_string)) || b.inherit(null)
    // 下一步
    next()
  }, true, (next) => {
    // node模块
    //
    if (req.controller && req.controller.node && b.type(req.controller.node, 'array')) {
      if (req.controller.node.length > 0) {
        let app_base = req.controller.app_base
        let node = req.controller.node
        delete req.controller.app_base
        delete req.controller.node

        req.controller.toUrl = function () {
          var args, url
          args = b.argsToArray(arguments)
          if (args[0] === false) {
            args.splice(0, 1)
            url = args[0]
          } else if (args[0].indexOf('://') > -1) {
            url = args[0]
          } else {
            url = this.pathinfo.dir.pathnode + '/' + args[0]
          }

          res.setHeader('Location', url)
          res.writeHead(302)
          res.end()
        }
        // 遍历压入继承
        b.each(NodeProto, function (key, obj) {
          req.controller[key] = obj
        })
        // 遍历 app_base
        b.each(app_base, function (index, fn) {
          if (b.type(fn, 'function')) {
            fn.apply(req.controller, [req.controller, req.controller.APP])
          }
        })
        // 遍历 node
        b.each(node, function (index, fn) {
          if (b.type(fn, 'function')) {
            fn.apply(req.controller, [req.controller, req.controller.APP])
          }
        })
        // 结束解析
      }
    }
    next()
  }, true, (next, resolve, reject) => {
    var event = req.window.$.Event('sysBaseRun', b.inherit(null))
      // 等待触发处理结束
    req.controller.body.one('sysBaseRunEnd', function () {
      next()
    }).trigger(event)
      // 触发预处理事件
    if (event.result !== false) {
      req.controller.body.trigger('sysBaseRunEnd')
    }
    event = void 0
  }, true, (next) => {
    var events
    if (req.controller && req.controller.body && req.controller.body[0]) {
      events = req.controller.body.data('events') || req.window.$._data(req.controller.body[0], 'events') || {}
      if (!events.noderun) {
        next()
      } else {
        events = req.controller.body.data('events') || req.window.$._data(req.controller.body[0], 'events') || {}
        // 等待触发处理结束
        req.controller.body.one('nodeend', function () {
          next()
        // 触发预处理事件
        }).trigger('noderun')

        if (!events.noderun) {
          req.controller.body.trigger('nodeend')
        }
      }
    } else {
      next()
    }
  }, true, (next) => {
    // 序列化dom
    req.window.documentHtml = jsdom.serializeDocument(req.window.document)
    // 设置类型头
    res.setHeader('Content-Type', 'text/html;charset=UTF-8')
    // 输出头
    res.writeHead(res.statusCode)
    // 写出浏览器
    res.write(req.window.documentHtml)
    // 结束
    res.end()
  // 运行队列
  }).run()
}

const EventProto = b.inherit(null)
// node 运行
var NodeProto
NodeProto = b.inherit(null)
// 触发事件
NodeProto.trigger = function (type, is_return_e, EventProtoInput) {
  if (!this.body) {
    return false
  }
  var e = this._$.Event(type, (EventProtoInput || EventProto))
  this.body.trigger(e)
  return is_return_e ? e : this
}
NodeProto.dom = function (selector, key) {
  this.dom[key] = this.$(selector)
  return (this.dom[key].length > 0) && this.dom[key]
}

NodeProto.$ = function (selector, context) {
  return this._$(selector, (context || this.body))
}
// 结束
NodeProto.end = function () {
  // 触发
  this.body.trigger('nodeend')
}
NodeProto.render = function () {
  if (arguments[0] === false) {
    return this.body.render.apply(this.body, arguments)
  } else {
    this.body.render.apply(this.body, arguments)
    return this
  }
}
// 取得外部html
NodeProto.outerHtml = function () {
  return (arguments.length > 0) ? (this.html(arguments[0]) && this) : this.prop('outerHTML')
}

b.each((
  'trigger ' +
  // 事件
  'off on one ' +
  // HTML代码/文本
  'html text ' +
  // 属性
  'attr removeAttr prop removeProp ' +
  // CSS 类
  'css addClass removeClass toggleClass ' +
  // 文档处理
  'append prepend empty children find contents'
  ).split(' '), function (i, key) {
  if (!key) { return }
  NodeProto[key] = function () {
    switch ((key.toString() + '_' + (arguments.length > 0 ? 'true' : 'false'))) {
      case 'arguments_false':
      case 'html_false':
      case 'attr_false':
      case 'prop_false':
        return this.body[key].apply(this.body, arguments)
      default:
        this.body[key].apply(this.body, arguments)
        return this
    }
  }
})
