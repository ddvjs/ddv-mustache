'use strict'
// 文件操作系统
const fs = require('fs')
// 路径模块
const path = require('path')
// cjb_base模块
const b = require('cjb-base')
// 引入模块
const requirejs = require('requirejs')
// mustache
const mustache = requirejs(path.resolve(__dirname, '../ddvstatic/js/mustache/mustache.js'))

/**
 * 加载控制器
 * @author: 桦 <yuchonghua@163.com>
 * @DateTime 2016-11-28T11:28:25+0800
 * @param    {string}                 appRootPath     [项目根路径]
 * @param    {string}                 controllersPath [控制器文件路径]
 * @param    {Function}               callback        [回调]
 */
const loadJQuery = module.exports = function loadJQuery (callback) {
  if (loadJQuery.loadJQueryFn) {
    callback(null, loadJQuery.loadJQueryFn)
  } else {
    fs.readFile(path.resolve(__dirname, '../ddvstatic/js/jq/jquery-2.1.4.js'), 'utf-8', (err, data) => {
      if (err) {
        callback(err, null)
      } else {
        loadJQuery.loadJQueryFn = function (window) {
          /* eslint evil: true */
          return (new Function('window', data)).apply(window, [window])
        }
        callback(null, loadJQuery.loadJQueryFn)
      }
    })
  }
}

// jquery加载部分
loadJQuery.loadJQueryFn = null
loadJQuery.loadJQueryRender = function ($, pathinfo, windowSelect, loadCb) {
  $.fn.render = function () {
    var args, $this, tmpl, data, isRHtml, isEmpty, html, select, parent, tempWrap, styleswrap, wrapI
    isRHtml = false
    $this = $(this)
    if ($this.length < 1) {
      return this
    }
    data = b.inherit(null)
    args = b.argsToArray(arguments)
    if (b.type(args[0], 'boolean')) {
      if (args[0] === true) {
        isEmpty = true
      }
      if (args[0] === false) {
        isRHtml = true
      }
      if (args.length > 0) {
        args.splice(0, 1)
      }
    }
    tmpl = args[0] || ''
    if (args.length > 0) {
      args.splice(0, 1)
    }
    args.unshift(true, data, pathinfo)
    $.extend.apply(data, args)
      // 解析
    mustache.parse(tmpl)
      // 渲染
    html = mustache.render(tmpl, data)
    args = undefined
    tmpl = undefined
    data = undefined
    if (isRHtml) {
      $this = undefined
      isEmpty = undefined
        // 直接返回结果
      return html
    } else {
      select = windowSelect + '[pathquery]'
      parent = $this.is(select) ? $this : $()
      parent = parent.length > 0 ? parent : $this.parent(select)
      parent = parent.length > 0 ? parent : $this.parentsUntil(select).parent(select)
      if (parent.length > 0 && (styleswrap = $(parent.children('[appwindow="styles"]:first'))).length > 0) {
        wrapI = 'parse_tmpl_jqdom_wrap' + (new Date()).getTime()
          // 包裹父级
        tempWrap = $('<div i="' + wrapI + '"></div>')

          // 尝试使用原生模式获取，避免浏览器兼容问题
        try {
          tempWrap.get(0).innerHTML = html
        } catch (e) {
          tempWrap.html(html)
        }
        $.each($('link[href]', tempWrap), function (index, el) {
          if ($('link[href=' + b.toJSON($(el).attr('href') || 'false') + ']', styleswrap).length > 0) {
            $(el).remove()
          } else {
            styleswrap.append(el)
          }
        })
        html = tempWrap.contents()
        tempWrap = wrapI = undefined
      }
      select = undefined
      parent = undefined
      styleswrap = undefined
      if (isEmpty) {
          // 清空插入
        $this.empty().append(html)
      } else {
          // 直接插入
        $this.append(html)
      }
      if (tempWrap) {
        tempWrap.remove()
      }
      isEmpty = undefined
      $this = undefined
      return this
    }
  }
  loadCb()
  loadCb = undefined
}
// 缓存
loadJQuery.DEBUG = false
