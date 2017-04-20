'use strict'
const load = require('../load')
const NotFindFileError = require('../NotFindFileError.js')
const renderError = require('./error.js')
// cjb_base模块
const b = require('cjb-base')
// path 创建
const path = require('path')
// requirejs 创建
const requirejs = require('requirejs')
// jsdom 创建
const jsdom = require('jsdom')
// mustache
const mustache = requirejs(path.resolve(__dirname, '../ddvstatic/js/mustache/mustache.js'))
// 常用
const oftentool = requirejs(path.resolve(__dirname, '../ddvstatic/js/hz/oftentool.js'))
// 文件
module.exports = renderController
function renderController (req, res, next) {
  if ((!this) || (!req.project) || req.project.isHotLoad || req.project.isDdvStatic) {
    next()
    return
  }
  load.controller(this.appDir, req.project)
  .then(c => runController.call(this, req, res, c))
  .then(text => {
    // 设置类型头
    res.setHeader('Content-Type', 'text/html;charset=UTF-8')
    // 写出浏览器
    res.write(text)
    // 结束
    res.end()
  })
  .catch(e => {
    if (e instanceof NotFindFileError) {
      // 如果没有找到页面就下一个中间件吧
      next()
    } else {
      // 有错误总得渲染出来吧
      renderError(req, res, e)
    }
  })
}
function runController (req, res, c) {
  return Promise.resolve()
  .then(() => {
    c.userAgent = req.headers['user-agent']
    c.APP = b.inherit(b)
    c.APP.userAgent = c.userAgent
    oftentool(c.APP)
  })
  .then(() => {
    if (!c.view) {
      return
    }
    return load.views(c.view, this.appDir, req.project.pathinfo.views)
    .then(views => { c.view = views })
  })
  .then(() => {
    // 检测baseHtml文件
    if (c.basehtml && c.basehtml.path && req.project.pathinfo && req.project.pathinfo.views) {
      c.baseHtmlPath = path.join(this.appDir, req.project.pathinfo.views, c.basehtml.path)
    } else {
      return Promise.reject(new Error('controllers.basehtml not config basehtml path'))
    }
  })
  .then(() => {
    // 加载baseHtml文件
    return load.baseHtml(c.baseHtmlPath)
    .then(basehtml => { c.baseHtmlText = basehtml })
  })
  .then(() => {
    c.pathinfo = {
      dir: req.project.pathinfo,
      path: (req.project.router.path || '')
    }
    // baseHtml缓存
    c.baseHtmlText = mustache.render(c.baseHtmlText, c.pathinfo)
    return new Promise((resolve, reject) => {
      jsdom.env({
        html: c.baseHtmlText,
        done: (e, window) => {
          if (e) {
            reject(e)
          } else {
            req.window = window
            resolve()
          }
        }
      })
    })
  })
  .then(() => {
    return load.JQuery()
    .then(jQueryInit => {
      jQueryInit(req.window)
      c._$ = req.window.$
      req.window.$.fn.outerHtml = function (html) {
        if (arguments.length > 0) {
          this.prop('outerHTML', html)
        }
        return this.prop('outerHTML')
      }
      req.window.Mustache = mustache
    })
  })
  .then(() => {
    // 重写标题
    req.window.$('title').html(c.title)
    delete c.title
    delete c.basehtml
    delete c.baseHtmlPath
    delete c.baseHtmlText
  })
  .then(() => {
    return load.JQuery.loadJQueryRender(req.window.$, c.pathinfo, req.appConfig.window_select)
  })
  .then(() => {
    if (!c.model) {
      return
    }
    return load.models(req, res)
    .then(m => { c.model = m })
  })
  .then(() => {
    // 创建加载容器
    // 选择容器
    c.wrap = req.window.$(req.appConfig.window_wrap_select)
    // 这个页面的容器
    c.bodywrap = req.window.$(req.appConfig.window_create)
    // 插入容器
    c.wrap.append(c.bodywrap)
    // pid
    c.bodywrap.attr('pid', 0)
    c.pathquery = req.project.router.pathquery
    // 修改路径
    c.bodywrap.attr('pathquery', c.pathquery)
    c.bodywrap.attr('is_server_node', 'true')
    // 插入容器
    c.bodywrap.hide()
    c.styles = c.styles || req.window.$(c.bodywrap.children('[appwindow="styles"]:first'))
    c.body = c.body || req.window.$(c.bodywrap.children('[appwindow="body"]:first'))

    c.router = Object.create(null)
    b.extend(true, c.router, req.project.router)
    c.router.query_string = c.router.query || ''
    c.router.query = b.url('?', ('?' + c.router.query_string)) || Object.create(null)
  })
  .then(() => {
    // node模块
    //
    if (c && c.node && b.type(c.node, 'array')) {
      if (c.node.length > 0) {
        let appBase = c.app_base
        let node = c.node
        delete c.app_base
        delete c.node

        c.toUrl = function () {
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
          c[key] = obj
        })
        // 遍历 app_base
        b.each(appBase, function (index, fn) {
          if (b.type(fn, 'function')) {
            fn.apply(c, [c, c.APP])
          }
        })
        // 遍历 node
        b.each(node, function (index, fn) {
          if (b.type(fn, 'function')) {
            fn.apply(c, [c, c.APP])
          }
        })
        // 结束解析
      }
    }
  })
  .then(() => {
    return new Promise(resolve => {
      var event = req.window.$.Event('sysBaseRun', b.inherit(null))
        // 等待触发处理结束
      c.body.one('sysBaseRunEnd', function () {
        resolve()
      }).trigger(event)
        // 触发预处理事件
      if (event.result !== false) {
        c.body.trigger('sysBaseRunEnd')
      }
      event = void 0
    })
  })
  .then(() => {
    return new Promise(resolve => {
      var events
      if (c && c.body && c.body[0]) {
        events = c.body.data('events') || req.window.$._data(c.body[0], 'events') || {}
        if (!events.noderun) {
          resolve()
        } else {
          events = c.body.data('events') || req.window.$._data(c.body[0], 'events') || {}
          // 等待触发处理结束
          c.body.one('nodeend', function () {
            resolve()
          // 触发预处理事件
          }).trigger('noderun')

          if (!events.noderun) {
            c.body.trigger('nodeend')
          }
        }
      } else {
        resolve()
      }
    })
  })
  .then(() => {
    console.log('c', c)
    // 序列化dom
    req.window.documentHtml = jsdom.serializeDocument(req.window.document)
    // 返回渲染结果
    return Promise.resolve(req.window.documentHtml)
  })
}

const EventProto = b.inherit(null)
// node 运行
var NodeProto
NodeProto = b.inherit(null)
// 触发事件
NodeProto.trigger = function (type, isReturnE, EventProtoInput) {
  if (!this.body) {
    return false
  }
  var e = this._$.Event(type, (EventProtoInput || EventProto))
  this.body.trigger(e)
  return isReturnE ? e : this
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
