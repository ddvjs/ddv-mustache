'use strict'
// 路径模块
const path = require('path')
// url
const url = require('url')
// 路径模块
const util = require('./util.js')
// 导出
module.exports = getRouter

function getRouter (req, appRootPath, routerFilePath = '/', router) {
  router = typeof router === 'object' ? router : Object.create(null)
  // 主机
  router.hostname = (req.headers && req.headers.host) || req.host || router.hostname || (req.info && req.info.listen && req.info.listen.address) || '127.0.0.1'
  // 端口
  router.port = router.port || req.port
  // url
  router.url = router.url || req.url || '/'
  // 格式化url
  router.url_format = url.format(router.url)
  // 重写解析
  router = util.parseUrl(router.url_format, router.hostname, router.port)
  // 保留原来url
  router.url_source = router.url_source || util.toUrl(router)
  // 保留原来path
  router.pathquery_source = router.pathquery_source || router.pathquery || '/'
  // 返回一个承诺
  return getPathqueryByRegExp(appRootPath, router.pathquery, routerFilePath)
  .then(pathquery => {
    router.pathquery = pathquery || '/'
    // 保留原来url
    router.url = util.toUrl(router)
    // 格式化url
    router.url_format = (url.format(router.url) || '').toString()
    // 重写解析
    Object.assign(router, util.parseUrl(router.url))
    // path
    router.path = router.path || '/'
    // pathquery
    router.pathquery = router.pathquery || '/'
    // 下一步
    req = appRootPath = routerFilePath = void 0
    return router
  })
}

/**
 * [regExp 正则处理url]
 * @author: 桦 <yuchonghua@163.com>
 * @DateTime 2016-11-20T17:36:26+0800
 * @param    {[type]}                 site_path     [description]
 * @param    {[type]}                 url           [description]
 * @param    {[type]}                 routerFilePath  [description]
 */
function getPathqueryByRegExp (appRootPath, pathquery, routerFilePath) {
  return getRouterMap(appRootPath, routerFilePath)
  .then(routes => {
    var route, i, matchResult
    for (i in routes.map) {
      route = routes.map[i]
      matchResult = pathquery.match(route.rule)
      if (matchResult) {
        return route.func.apply(routes, matchResult.slice(1))
      }
    }
    return routes.default_func(pathquery)
  })
}
// 默认非调试模式
getRouter.dev = false
// 缓存路由地图
getRouter.routerMap = []
// 缓存20个路由重写
getRouter.routerMapLen = 20
// 获取路由地图
function getRouterMap (appRootPath, routerFilePath) {
  var routerMap
  // 遍历
  Array.isArray(getRouter.routerMap) && getRouter.routerMap.forEach(mapT => {
    if (mapT && mapT.routerFilePath === routerFilePath) {
      routerMap = mapT
    }
  })
  return routerMap ? Promise.resolve(routerMap) : getRouterMapLoad(appRootPath, routerFilePath).then(mapT => {
    if (getRouter.dev) {
        // 清空缓存
      getRouter.routerMap.length = 0
    } else {
        // 加入缓存
      getRouter.routerMap.unshift(mapT)
        // 缓存指定的大小
      if (getRouter.routerMap.length > getRouter.routerMapLen) {
        getRouter.routerMap.splice(getRouter.routerMapLen, (getRouter.routerMap.length - getRouter.routerMapLen))
      }
    }
    return mapT
  })
}
// 获取
function getRouterMapLoad (appRootPath, routerFilePath) {
  var routerLists = Object.create(null)
  var routerFile = path.join(appRootPath, (routerFilePath + '/router.js'))
  var routerMap = []
  var defaultFunc = defaultFuncRouterMap
  return util.isFile(routerFile)
  .then(() => {
    return util.requirejs(routerFile)
    .then(router => {
      if (getRouter.dev) {
        // 卸载加载
        util.requirejs.undef(routerFile)
      }
      Object.assign(routerLists, router)
    })
    .then(() => {
      var rule
      routerLists['404'] = routerLists['404'] || routerLists['*']
      routerLists['*'] = routerLists['*'] || routerLists['404']
      for (rule in routerLists) {
        if (!Object.hasOwnProperty.call(routerLists, rule)) continue
        if (rule === '*' || rule === '404') {
          defaultFunc = routerLists[rule] || defaultFunc
          continue
        }
        routerMap.push({
          rule: new RegExp(rule, 'i'),
          func: routerLists[rule]
        })
      }
    })
  }, e => {
    // 过滤错误-容错
  })
  .then(() => {
    if (getRouter.dev) {
      // 卸载加载
      util.requirejs.undef(routerFile)
    }
    return {
      routerFilePath: routerFilePath,
      map: routerMap,
      default_func: defaultFunc
    }
  })
}
function defaultFuncRouterMap (path) {
  return path
}
