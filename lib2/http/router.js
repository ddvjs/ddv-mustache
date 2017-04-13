'use strict'
// 文件操作系统
const fs = require('fs')
// 路径模块
const path = require('path')
// 引入模块
const requirejs = require('requirejs')
// cjb_base模块
const b = require('cjb-base')
// 模块
const router = module.exports = function (routerFilePath) {
  return function routerRun (req, res, useNext) {
    router.DEBUG = req.DEBUG
    // 路由
    req.router = req.router || Object.create(null)
    // 主机
    req.router.hostname = (req.headers && req.headers.host) || req.host || req.router.hostname || (req.info && req.info.listen && req.info.listen.address) || '127.0.0.1'
    // 端口
    req.router.port = req.router.port || req.port
    // url
    req.router.url = req.router.url || req.url || '/'
    // 格式化url
    req.router.url_format = (b.formatUrl(req.router.url) || '').toString()
    // 重写解析
    req.router = router.parseUrl(req.router.url_format, req.router.hostname, req.router.port)
    // 保留原来url
    req.router.url_source = req.router.url_source || router.toUrl(req.router)
    // 保留原来path
    req.router.pathquery_source = req.router.pathquery_source || req.router.pathquery
    // 用根路由正则 处理url
    router.regExp(req.appRootPath, req.router.pathquery, routerFilePath, function regExpCb (pathquery) {
      req.router.pathquery = pathquery
      // 保留原来url
      req.router.url = router.toUrl(req.router)
      // 格式化url
      req.router.url_format = (b.formatUrl(req.router.url) || '').toString()
      // 重写解析
      b.extend(true, req.router, router.parseUrl(req.router.url))
      // 下一步
      useNext()
      req = res = useNext = void 0
    })
  }
}

/**
 * [regExp 正则处理url]
 * @author: 桦 <yuchonghua@163.com>
 * @DateTime 2016-11-20T17:36:26+0800
 * @param    {[type]}                 site_path     [description]
 * @param    {[type]}                 url           [description]
 * @param    {[type]}                 routerFilePath  [description]
 * @param    {Function}               cb        [description]
 */
router.regExp = function (site_path, pathquery, routerFilePath, cb) {
  // 获取地图
  router.getRouterMap(site_path, routerFilePath, function routerMapCb (routes) {
    var route, route_index, match_result
    for (route_index in routes.map) {
      route = routes.map[route_index]
      match_result = pathquery.match(route.rule)
      if (match_result) {
        pathquery = route.func.apply(routes, match_result.slice(1))
        if (cb && (typeof cb === 'function')) {
          cb(pathquery)
        }
        return
      }
    }
    pathquery = routes.default_func(pathquery)
    if (cb && (typeof cb === 'function')) {
      cb(pathquery)
    }
  })
}

router.toUrl = function parseUrl (obj) {
  var r = ''
  r += obj.protocol || 'http:'
  r += '//' + (obj.hostname || '')
  r += obj.port ? (((obj.protocol == 'http:' && obj.port == '80') || (obj.protocol == 'https:' && obj.port == '443')) ? '' : (':' + obj.port)) : ''
  obj.pathquery = obj.pathquery || (obj.path || '/') + (obj.query ? ('?' + obj.query) : '')
  r += obj.pathquery
  return r
}
router.parseUrl = function parseUrl (url, hostname, port) {
  let info = b.url('{}', url)
  info.hostname = info.hostname || hostname
  info.origin = info.protocol + '//' + info.hostname
  info.port = port || info.port
  if (!info.pathquery) {
    info.pathquery = info.path + (info.query ? ('?' + info.query) : '')
  }
  return info
}

// 默认非调试模式
router.DEBUG = false
// 缓存路由地图
router.routerMap = []
// 缓存20个路由重写
router.routerMapLen = 20
/**
 * [getRouterMap 获取路由地图]
 * @author: 桦 <yuchonghua@163.com>
 * @DateTime 2016-09-24T10:32:22+0800
 * @param    {string}                 site_path [项目根路径]
 * @param    {string}                 path    [路由正则路径]
 * @param    {Function}               cb      [回调]
 */
router.getRouterMap = function (site_path, routerFilePath, cb) {
  var is_router, router_map, q
  is_router = false
    // 创建队列
  q = b.queue()
    // 获取路由
  q.push(function (next) {
      // 遍历
    b.each(router.routerMap, function (index, map_t) {
      if (map_t && map_t.routerFilePath == routerFilePath) {
        router_map = map_t
        is_router = true
      }
    })
      // 如果有找到就下一步
    if (is_router) {
      next()
    } else {
      router.getRouterMapLoad(site_path, routerFilePath, function (map_t) {
        router_map = map_t
        if (router.DEBUG) {
            // 清空缓存
          router.routerMap.length = 0
        } else {
            // 加入缓存
          router.routerMap.unshift(map_t)
            // 缓存指定的大小
          if (router.routerMap.length > router.routerMapLen) {
            router.routerMap.splice(router.routerMapLen, (router.routerMap.length - router.routerMapLen))
          }
        }
        next()
      })
    }
  })
    // 操作路由
  q.push(true, function () {
    if (cb && (typeof cb === 'function')) {
      cb(router_map)
    }
    q.abort()
    is_router = router_map = q = undefined
  })
    // 运行队列
  q.run()
}
// 获取
router.getRouterMapLoad = function (site_path, routerFilePath, cb) {
  var q, is_file, router_map, default_func, router_extend, router_lists, router_file
  is_file = false
  router_extend = b.inherit(null)
  router_extend.extend = b.extend
  router_lists = b.inherit(router_extend)
  router_file = path.join(site_path, (routerFilePath + '/router.js'))
  router_map = []
  default_func = function (path) {
    return path
  }
    // 创建队列
  q = b.queue().setThis(this)
    // 判断文件是否存在
  q.push(function (next) {
    fs.stat(router_file, function (e, stat) {
      if (!e) {
        if (stat.isFile()) {
          is_file = true
        }
      }
      next()
    })
  })
    // 如果有文件，加载路由配置信息
  q.push(true, function (next) {
    if (is_file) {
      requirejs([router_file], function (router) {
        b.extend(true, router_lists, router)
        next()
      }, function (e) {
        throw e
      })
      if (router.DEBUG) {
          // 卸载加载
        requirejs.undef(router_file)
      }
    } else {
      next()
    }
  })
    // 处理路由
  q.push(true, function (next) {
    var rule
    router_lists['404'] = router_lists['404'] || router_lists['*']
    router_lists['*'] = router_lists['*'] || router_lists['404']
    for (rule in router_lists) {
      if (!Object.hasOwnProperty.call(router_lists, rule)) continue
      if (rule === '*' || rule === '404') {
        default_func = router_lists[rule] || default_func
        continue
      }
      router_map.push({
        rule: new RegExp(rule, 'i'),
        func: router_lists[rule]
      })
    }
    rule = undefined
    next()
  })
    // 回调
  q.push(true, function () {
    if (cb && (typeof cb === 'function')) {
      cb({
        routerFilePath: routerFilePath,
        map: router_map,
        default_func: default_func
      })
    }
    q.abort()
    q = is_file = router_map = default_func = router_extend = router_lists = undefined
  })
    // 运行队列
  q.run()
}
