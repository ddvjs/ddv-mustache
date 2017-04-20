'use strict'
// 路径模块
const path = require('path')
// 路径模块
const util = require('./util.js')
// requirejs 创建
const requirejs = require('requirejs')
// mustache
const mustache = requirejs(path.resolve(__dirname, '../ddvstatic/js/mustache/mustache.js'))
// cjb_base模块
const b = require('cjb-base')
module.exports = loadJQuery
loadJQuery.dev = false
function loadJQuery () {
  if (loadJQuery.loadJQueryFn) {
    return Promise.resolve(loadJQuery.loadJQueryFn)
  } else {
    return util.readFile(path.resolve(__dirname, '../ddvstatic/js/jq/jquery-2.1.4.js'))
    .then(data => {
      loadJQuery.loadJQueryFn = function (window) {
        // eslint-disable-next-line no-new-func
        return (new Function('window', data)).apply(window, [window])
      }
      return Promise.resolve(loadJQuery.loadJQueryFn)
    })
  }
}
// jquery加载部分
loadJQuery.loadJQueryFn = null
loadJQuery.loadJQueryRender = function ($, pathinfo, windowSelect) {
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
  return Promise.resolve()
}
