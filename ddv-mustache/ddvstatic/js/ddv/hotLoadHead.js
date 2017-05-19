var addLoadLists = function (loadlists, window) {
// 保留对外实体运行方法
  var addLoadListsFn = addLoadLists
// 修改对外运行添加的方法
  window.addLoadLists = addLoadLists = function addLoadListsProxy () {
    addLoadListsFn(loadlists)
  }
  var isNotInit = true
  var isInit = false
  var isDdvHotLoadHeadInit = false
  var rLoad = {}

  /**
   * [inherit 创建指定继承的对象]
   * @author: 桦 <yuchonghua@163.com>
   * @DateTime 2016-06-16T11:49:42+0800
   * @param    {[type]}                 p [description]
   * @return   {[type]}                   [description]
   */
  rLoad.inherit = function inherit (p) {
    // if(Object&&Object.create){
    //  return Object.create(p);
    // }
    var APP = function APP () {}
    APP.prototype = p
    return new APP()
  }
  // rLoad.version = (new Date()).getTime();
  rLoad.version = 20160618
  rLoad.urlV = 'v=' + rLoad.version

  rLoad.isLoadError = false
  /**
   * [requirejsError 加载错误提示]
   * @author: 桦 <yuchonghua@163.com>
   * @DateTime 2016-06-16T11:49:59+0800
   * @param    {[type]}                 name [description]
   * @return   {[type]}                      [description]
   */
  rLoad.requirejsError = function (name, error) {
    try {
      console.error('插件加载' + name + '失败，请检查config/load.js下的配置信息', '\n', error)
    } catch (e) {}
    if (!rLoad.isLoadError) {
      rLoad.isLoadError = true
      alert('网络问题，刷新重试！\n' + (error && (error.stack || error.message )))
    }
  }
  rLoad.i = 0
  rLoad.now = 0
  rLoad.len = 0
  rLoad.baseLoadRun = function (deps) {
    rLoad.len = deps.length
    for (rLoad.i = 0; rLoad.i < rLoad.len; rLoad.i++) {
      rLoad.baseLoadRequire(deps[rLoad.i])
    }
  }
  rLoad.baseLoadRequire = function (deps, tryTime) {
    tryTime = tryTime || 0
    rLoad.require([deps], function (jsobj) {
      rLoad.now ++
      rLoad.baseRequireCallBack(deps, jsobj)
    }, function (error) {
      if (tryTime < 3) {
        rLoad.baseLoadRequire(deps, ++tryTime)
      } else {
        rLoad.requirejsError(deps, error)
      }
    })
  }
  rLoad.isLoadNProgress = false
  rLoad.NProgress = undefined
  rLoad.baseRequireCallBack = function (deps, jsobj) {
    switch (deps) {
      case 'nprogress':
        rLoad.isLoadNProgress = true
        rLoad.NProgress = jsobj
        break

      default:

        break
    }
    if (rLoad.isLoadNProgress) {
      // 反馈进度
      rLoad.NProgress.set(rLoad.now / rLoad.len)
      rLoad.NProgress.start()
    }
    if (rLoad.now >= rLoad.len) {
      rLoad.isLoadNProgress && rLoad.NProgress.done()
      rLoad.baseRequireLoadEnd()
    }
  }
  rLoad.baseRequireLoadEnd = function () {
    var APP
    window.APP = APP = rLoad.require('globalAPP')
    APP.__pathinfo = rLoad.config.pathinfo
    APP.__startAPP(rLoad)
  }
  rLoad.urlArgs = function (moduleName, url) {
    var r = ''
    r += ((url.indexOf('?') >= 0) ? '&' : '?') + rLoad.urlV
    return r
  }
  rLoad.config = loadlists.config
  rLoad.appConfig = rLoad.config.appConfig || {}
  delete loadlists.config
  // 指定要加载的一个依赖数组。当将require设置为一个config object在加载require.js之前使用时很有用。
  // 一旦require.js被定义，这些依赖就已加载。使用deps就像调用require([])，
  // 但它在loader处理配置完毕之后就立即生效。它并不阻塞其他的require()调用，
  // 它仅是指定某些模块作为config块的一部分而异步加载的手段而已。
  rLoad.config.context = 'ddv'
  // 等待时间 -加载超时
  rLoad.config.waitSeconds = 15

  rLoad.config.urlArgs = function (moduleName, url) {
    return rLoad.urlArgs(moduleName, url)
  }
  rLoad.config.onLoadBefore = function onRequirejsLoadBefore (map, context) {
    if (!(map && map.name && (!map.prefix) && context && context.contextName === 'ddv')) {
      return
    }
    if (map.name.substr(0, 1) === '_') {
      return
    }
    if (loadlists[map.name]) {
      map.prefix = '_ddvHotLoadHead'
    }
  }
  rLoad.checkRequirejsLoadEnd = function () {
    if (isNotInit !== true) {
      return
    }
    if (!window.requirejs) {
      setTimeout(function () {
        rLoad.checkRequirejsLoadEnd()
      }, 35)
      return
    }
    isNotInit = false
    requirejs.exec = function (data) {
      if (data/* && jQuery.trim( data ) */) {
        // We use execScript on Internet Explorer
        // We use an anonymous function so that context is window
        // rather than jQuery in Firefox
        (window.execScript || function (data) {
          window[ 'eval' ].call(window, data)
        })(data)
      }
    }
    // 初始化引入
    rLoad.require = requirejs.config(rLoad.config)
  }
  // 回调
  rLoad.config.callback = function () {
    rLoad._ddvHotLoadHeadInit(function (err) {
      if (isInit) {
        return
      }
      isInit = true
      if (err) {
        alert('网络错误，请联系开发者查询问题！\n' + (err && (err.stack || err.message )))
        console.error(err)
        return
      }
      rLoad.baseLoadRun(rLoad.config.loadlists)
    })
    // 开始运行
  }
  rLoad.checkRequirejsLoadEnd()
  /**
   * [_ddvHotLoadHeadInit 自定义载入器]
   * @author: 桦 <yuchonghua@163.com>
   * @DateTime 2016-11-18T00:13:02+0800
   * @param    {Function}               callback [description]
   * @return   {[type]}                          [description]
   */
  rLoad._ddvHotLoadHeadInit = function (callback) {
    if (isDdvHotLoadHeadInit) {
      return
    }
    isDdvHotLoadHeadInit = true
    define('_ddvHotLoadHead', {
      load: function (name, parentRequire, load, config) {
        var url, path, text
        text = null
        if (loadlists && loadlists[name]) {
          path = ((rLoad && rLoad.config && rLoad.config.paths && rLoad.config.paths[name]) || name) || null
          url = parentRequire.toUrl(name + '.js')
          url = url.replace(/\\/g, '/').replace(/\/\.\//g, '/').replace(/\/\//g, '/')
          url = url || path || url || '/'
          url = location.origin + (url.charAt(0) == '/' ? '' : '/') + url
          text = (loadlists && loadlists[name]) || null
          if (url) {
            text = text + '\n//# sourceURL=' + url
          }
        }
        if (text) {
          load.fromText(text)
        } else if (name && name.indexOf('.html') > -1 && name.indexOf('/views/') > -1) {
          url = parentRequire.toUrl(name)
          url = url.replace(/\\/g, '/').replace(/\/\.\//g, '/').replace(/\/\//g, '/')
          var o = {}
          o.type = 'get'
          o.url = url
          o.success = function (text) {
            load.fromText('define(function(){return ' + JSON.stringify(text) + ';})')
            o = void 0
          }
          o.error = function (xhr) {
            var error = new Error(xhr.status + ' ' + xhr.statusText)
            error.error_id = xhr.statusText
            error.code = xhr.status
            load.error(error)
          }
          $.ajax(o)
        } else {
          load.error(new Error('不存在缓存文件'))
        }
      }
    })
    rLoad.require(['_ddvHotLoadHead'], function (obj) {
      if (callback && (typeof callback === 'function')) {
        callback(null, obj)
        callback = void 0
      }
    }, function error (err) {
      if (callback && (typeof callback === 'function')) {
        callback(err, null)
        callback = void 0
      }
    })
  }
}
