/* global define, APP */
define(['jquery', 'mustache', 'app.base'], function appAppInit ($, Mustache, base) {
// APP 超全局对象
// App 加载app的对象
// app app实例化继承的对象
// Browser app运行Browser继承的对象
// EventProto 触发事件继承的对象
  var App, init, loadApp, appRun, processApp, EventProto, MBP, MBAP, MPP, router
  processApp = function processApp () {}
  init = function (options) {
    // 信息初始化
    init.infoInit()
    init.routerInit()
    // 进程初始化
    init.processInit()
    // 初始化基本操作
    init.functionInit()
    // 初始化进程池的pid默认值
    init.pidInit()
    // 初始化配置信息
    init.config(options)
    // 加载部分初始化
    init.appRunInit()
    // loadControllers 控制器加载器的初始化
    init.loadControllersInit()
    // loadViews 视图加载器的初始化
    init.loadViewsInit()
    // model 容器的初始化
    init.loadModelsInit()
    // 数据模型加载器初始化
    init.loadModelsApiInit()
    // views 实例化 初始化
    init.appBaseInit()
    // Node 运行器初始化
    init.newNodeInit()
    // Browser 运行器初始化
    init.runBrowserInit()
    // 切换窗口初始化
    init.tabToWindowInit()
    // 初始化
    App.wrapInit()
    // 初始化popstate
    init.popStateInit()
    // 加载部分初始化
    init.loadAppInit()
    // 加载继承
    init.loadAppPrototypeInit()
    // 加载继承
    init.apiRESTfulInit()
    // 一次载入
    App.oneLoadInit()
  }

// 加载app的继承部分初始化
  init.loadAppPrototypeInit = function () {
  // 继承对象
    loadApp = {}
  // 初始化
    loadApp.__SysInit__ = function () {
      return appRun.init.apply(this, arguments)
    }
    loadApp.remove = function () {
      var _this = this
      setTimeout(function () {
        appRun.remove.apply(_this, arguments)
        _this = undefined
      }, 0)
    }
  }
// 加载app初始化
  init.appRunInit = function () {
  // 构造对象
    appRun = {}
  // 初始化
    appRun.init = function () {
    // 初始化基本信息
      appRun.infoInit.call(this)
    // 路由基本信息初始化
      appRun.routerInit.call(this)
    }
  // 加载
    appRun.load = function () {
      var _this, q, errorEcho, createWrap
      // 引用上下文
      _this = this
      // 创建队列,并且重写上下文
      q = APP.queue().setThis(this)
      // 载入控制器
      q.push(function loadControllers (next) {
        if (App.add_time_last != this.add_time) {
          q.abort(); return// 放弃加载
        }
        // 加载文件
        var loadFile = this.sys.file.controllers
        // 加载控制器
        appRun.loadControllers(loadFile, function success (controllers) {
          // 创建一个空的纯粹的对象
          _this.sys.controllers = controllers
          // 复制
          APP.extend(true, _this.sys.controllers, controllers)
          // 销毁
          controllers = undefined
          // 下一步操作
          next()
        }, function error (e) {
          // 报错提示
          errorEcho.call(_this, q, e)
          //* 后期改造*// App.error('网络错误，可能有些功能没法正常使用！['+e.message+']',e);
          // 中断队列
          // q.abort();
        })
      })
      // 加载视图模块
      q.push(true, function loadViews (next) {
        if (App.add_time_last != this.add_time) {
          q.abort(); return// 放弃加载
        }
        if (!this.sys.controllers.view) {
          next()
          return
        }
        appRun.loadViews.call(this, this.sys.controllers.view, function (views) {
          // 创建一个空的纯粹的对象
          _this.sys.views = APP.clone(views)
          // 销毁
          views = undefined
          // 下一步操作
          next()
        }, function (e) {
          // 报错提示
          errorEcho.call(_this, q, e)
          //* 后期改造*// App.error('网络错误，可能有些功能没法正常使用！['+e.message+']',e);
          // 中断队列
          // q.abort();
        })
      })
      // 加载数据模型模块
      q.push(true, function loadModels (next) {
        if (App.add_time_last !== this.add_time) {
          q.abort(); return// 放弃加载
        }
        if (!this.sys.controllers.model) {
          next()
          return
        }
        appRun.loadModels.call(this, this.sys.controllers.model, function (models) {
          // 创建一个空的纯粹的对象
          _this.sys.models = APP.clone(models)
          // 销毁
          models = undefined
          // 下一步操作
          next()
        }, function loadModelsError (e) {
          // 报错提示
          errorEcho.call(_this, q, e)
          //* 后期改造*// App.error('网络错误，可能有些功能没法正常使用！['+e.message+']',e);
          // 中断队列
          // q.abort();
        })
      })
      // 创建加载容器
      q.push(true, function createWrapRun (next) {
        if (App.add_time_last !== this.add_time) {
          q.abort(); return// 放弃加载
        }
        createWrap.call(this)
        try {
          if (this.sys && this.sys.controllers && this.sys.controllers.title) {
            // 修改标题
            document.title = this.sys.controllers.title
          }
        } catch (e) {}
        next()
      })
      // 初始化appBase
      q.push(true, function appBase (next) {
        if (App.add_time_last !== this.add_time) {
          q.abort(); return// 放弃加载
        }
        appRun.appBase.call(this)
        if (this.is_node_run) {
          q.nextToName('runBrowser')
        } else {
          // 下一步
          next()
        }
      })
      // 运行node
      q.push(true, function newNode (next) {
        if (App.add_time_last != this.add_time) {
          q.abort(); return// 放弃加载
        }
        // 如果是node运行
        if (_this.is_node_run || (!this.sys.controllers.node)) {
          next()
          return
        }
        appRun.newNode.call(this, function () {
          // 下一步操作
          next()
        }, function (e) {
          // 报错提示
          errorEcho.call(_this, q, e)
          //* 后期改造*// App.error('网络错误，可能有些功能没法正常使用！['+e.message+']',e);
          // 中断队列
          // q.abort();
        })
      })
      // 运行node
      q.push(true, function runNode (next) {
        var events
        if (_this.sys && _this.sys.controllers && _this.sys.controllers.node && APP.type(_this.sys.controllers.node, 'array')) {
          if (_this.sys.controllers.node.length < 1) {
            next()
          } else {
            // 等待触发处理结束
            _this.body.one('nodeend', function () {
              next()
            // 触发预处理事件
            }).trigger('noderun')

            if (!($._data(_this.body[0], 'events') || {}).noderun) {
              _this.body.trigger('nodeend')
            }
          }
        } else {
          next()
        }
      })
      // 运行浏览器js加载
      q.push(true, function runBrowser (next) {
        if (App.add_time_last != this.add_time) {
          q.abort(); return// 放弃加载
        }
        // 如果是浏览器运行
        if (!this.sys.controllers.browser) {
          next()
          return
        }
        appRun.runBrowser.call(this, function () {
          // 下一步操作
          next()
        }, function (e) {
          // 报错提示
          errorEcho.call(_this, q, e)
          //* 后期改造*// App.error('网络错误，可能有些功能没法正常使用！['+e.message+']',e);
          // 中断队列
          // q.abort();
        })
      })
      // browser中 browserBaseRun的事件触发
      q.push(true, function browseSysBaseRun (next) {
        if (App.add_time_last !== this.add_time) {
          q.abort(); return// 放弃加载
        }
        if (App.is_one_sys_base_run === true) {
          next()
        } else {
          App.is_one_sys_base_run = true
          // 等待触发处理结束
          this.body.one('sysBaseRunEnd', function () {
            next()
          })
          // 触发预处理事件
          if (this.appBrowser.trigger('sysBaseRun', true).result !== false) {
            this.appBrowser.trigger('sysBaseRunEnd')
          }
        }
      })
      // browser中 browserBaseRun的事件触发
      q.push(true, function browserBaseRun (next) {
        if (App.add_time_last !== this.add_time) {
          q.abort(); return// 放弃加载
        }
        // 等待触发处理结束
        this.body.one('browserBaseRunEnd', function () {
          setTimeout(function () {
            next()
          }, 0)
        })
        // 触发预处理事件
        if (this.appBrowser.trigger('browserBaseRun', true).result !== false) {
          this.appBrowser.trigger('browserBaseRunEnd')
        }
      })
      // 触发创建事件
      q.push(true, function loadLinksRun (next) {
        var wrap_i, temp_wrap, loadLinks, callback
        if (App.add_time_last !== this.add_time) {
          q.abort(); return// 放弃加载
        }
        if (!this.sys.views) {
          next()
          return
        }
        callback = function () {
          if (_this.isloadLinksEnd === true) {
            return
          }
          if (!(loadLinks && loadLinks.length > 0)) {
            _this.isloadLinksEnd = true
            next()
          }
        }
        loadLinks = []
        APP.each(this.sys.views, function (index, html) {
          wrap_i = 'parse_tmpl_jqdom_wrap' + (new Date()).getTime()
          // 包裹父级
          temp_wrap = $('<div i="' + wrap_i + '"></div>')
          // 解析
          Mustache.parse(html)
          // 渲染
          html = Mustache.render(html, APP.__pathinfo)
          // 尝试使用原生模式获取，避免浏览器兼容问题
          try {
            temp_wrap.get(0).innerHTML = html
          } catch (e) {
            temp_wrap.html(html)
          }
          $.each($('link[href]', temp_wrap), function (index, el) {
            var $this = $(el), href = APP.toJSON($this.attr('href') || 'false')
            if ($('link[href=' + href + ']', _this.styles).length > 0) {
              $this.remove()
            } else {
              loadLinks.push(href)
              $this.on('load', function () {
                var index
                while ((index = APP.array.index(href, loadLinks)) > -1) {
                  loadLinks.splice(index, 1)
                }
                callback()
              })
              setTimeout(function () {
                $this.trigger('load')
                $this = href = undefined
              }, 1000 * 0.7)
              _this.styles.append($this)
            }
          })
        })
        setTimeout(function () {
          callback()
        }, 0)
      })
      // 触发创建事件
      q.push(true, function triggerCreate (next) {
        if (App.add_time_last !== this.add_time) {
          q.abort(); return// 放弃加载
        }
        // 重置popstate
        App.setPopState(this.state, true)
        if (this.sys.is_create === true) {
          next()
        } else {
          // 防止多次触发创建
          this.sys.is_create = true
          // 提前显示，但是要求切换窗口的时候触发打开事件
          this.bodywrap.attr('trigger_open', 'true').show()
          // 触发创建事件
          this.appBrowser.trigger('create')
          // 下一步
          next()
        }
      })
      // 绑定关闭事件
      q.push(true, function onClose (next) {
        this.appBrowser.on('close', function () {
          if (_this.sys.controllers.is_cache === false) {
            // 触发创建事件
            _this.appBrowser.trigger('remove')
          }
        })
        this.appBrowser.on('remove', function () {
          _this.remove()
        })
        next()
      })
      // 切换窗口
      q.push(true, function tabToWindow (next) {
        if (App.add_time_last != this.add_time) {
          q.abort(); return// 放弃加载
        }
        // 切换窗口
        App.tabToWindow(this.appBrowser)
        q.abort()
      })
      errorEcho = function (q, e) {
        var es, qe, html_tmpl
        es = []
        es.push(e)
        q.abort()
        qe = APP.queue().setThis(this)
          // 创建显示区域
        qe.push(function (next) {
          if (!this.bodywrap) {
            createWrap.call(this)
          }
          if (App.add_time_last != this.add_time) {
            qe.abort(); return// 放弃加载
          }
          if (!(this.bodywrap && this.bodywrap.length > 0)) {
            qe.abort(); return// 放弃加载
          }
          next()
        })
          // 创建浏览器操作体
        qe.push(true, function (next) {
          appRun.runBrowser.call(this, function () {
              // 下一步操作
            next()
          }, function (e) {
              // 继续插入错误
            es.push(e)
            next()
          })
        })
          // 载入404报错页面
        qe.push(true, function (next) {
            // 使用require加载
          APP.__rLoad.require([('_ddvHotLoadHead!' + APP.__pathinfo.dir.views + '/' + APP.__rLoad.appConfig.error._404 + '.html')], function (view) {
            html_tmpl = view
            next()
          }, function error (e) {
            var re = new Error('loadViews Error page tmpl:' + APP.__rLoad.appConfig.e_404_file + '!')
            re.stack = re.stack + e.stack
            e = undefined
            es.push(re)
            html_tmpl = '<br><h1>404 - File Not Find</h1><br>{{#error_lists}}{{msg}}<br>error_id:{{error_id}}<hr>{{stack}}<br><br>{{/error_lists}}'
            re = undefined
            next()
          })
        })
          // 报错
        qe.push(true, function (next) {
          if (App.add_time_last != this.add_time) {
            qe.abort(); return// 放弃加载
          }
          var temp, error_lists = []
          APP.each(es, function (index, e) {
            temp = {}
            temp.msg = temp.message = (e.msg || e.message || 'Unknown Error')
            temp.error_id = (e.error_id || 'Unknown error_id')
            temp.stack = (e.stack || (Error(temp.msg).stack)).toString()
            temp.index = index + 1
            error_lists.push(temp)
          })
          error_lists = {'error_lists': error_lists}
          this.body.render(html_tmpl, error_lists)
            // 切换窗口
          try { App.tabToWindow(this.appBrowser) } catch (e) {}
          error_lists = temp = html_tmpl = qe = es = undefined
          next()
        })
          // 运行
        qe.run()
      }
      createWrap = function () {
        // 查找存在的
        $.each($(APP.__rLoad.appConfig.window_select + '[pathquery=' + APP.toJSON(this.pathquery) + ']'), function (index, el) {
          if (index === 0) {
            // 使用第一个
            _this.bodywrap = $(el)
            // 定义是在node运行的
            _this.is_node_run = true
          } else {
            // 其他干掉
            $(el).remove()
          }
        })
        // 一个都没有就创建一个
        if (!(this.bodywrap && this.bodywrap.length > 0)) {
          // 构造一个
          this.bodywrap = this.bodywrap || $(APP.__rLoad.appConfig.window_create)
          // 创建
          App.wrap.append(this.bodywrap)
          // 定义不是在node运行的
          this.is_node_run = false
        }
        // pid
        this.bodywrap.attr('pid', this.pid)
        // 修改路径
        this.bodywrap.attr('pathquery', this.pathquery)
        // 插入容器
        this.bodywrap.hide()
        this.styles = this.styles || $(this.bodywrap.children('[appwindow="styles"]:first'))
        this.body = this.body || $(this.bodywrap.children('[appwindow="body"]:first'))

        if (this.styles) {

        }

        this.styles.hide()
      }
      // 运行队列
      q.run()
    }
  // 路由初始化
    appRun.routerInit = function () {
      var _this
      _this = this
    // 系统目录信息
      this.sys.dir = APP.inherit(APP.__pathinfo.dir)
      this.sys.file = APP.inherit(null)
      this.url_source = this.url
      this.pathquery_source = this.pathquery
      router.regExp.call(true, this.pathquery, function (url) {
        _this.pathquery = _this.url = url
      // 路由信息
        appRun.routerInfo.call(_this)
      // 加载控制器
        appRun.load.call(_this)
        _this = undefined
      })
    }
  // 路由初始化
    appRun.routerInfo = function () {
      var cfile = this.url
    // 去除问号
      if (cfile.indexOf('?') > -1) {
        cfile = cfile.substr(0, cfile.indexOf('?'))
      }
      if (cfile.substr(0, this.sys.dir.base.length) === this.sys.dir.base) {
        cfile = cfile.substr(this.sys.dir.base.length)
        if (cfile.substr(0, 1) === '/') {
          cfile = cfile.substr(1)
        }
      } else {
        console.error('9999', this.sys.dir.base, cfile)
      }
    // 控制器文件
      this.sys.file.controllers = cfile

      this.router = APP.inherit(null)
      this.url = (this.url.indexOf(location.origin) > -1) ? this.url : (location.origin + this.url)
      APP.each('# ? path file port filename fileext hash query hostname domain'.split(' '), function (index, key) {
        var value = APP.url(key, this.url)
        switch (key) {
          case '?' :
            key = 'query'
            value = value || APP.inherit(null)
            break
          case '#' :
            key = 'hash'
          // 强制是对象
            value = value || APP.inherit(null)
            break
          case 'query' :
            key = 'query_string'
            value = value || ''
            break
          case 'hash' :
            key = 'hash_string'
            value = value || ''
            break
        }
        this.router[key] = value
        this.router.pathquery = this.pathquery
      // 强制是对象
        index = undefined
        value = undefined
        key = undefined
      }, true, this)
    }
    // 基本信息初始化
    appRun.infoInit = function () {
      this.is = this.is || APP.inherit(null)
      // 是否在node运行
      this.is.node_run = false
      // 是否为新创建的窗口
      this.is.new_create = false
      // 系统内部
      this.sys = APP.inherit(null)
      // 继承集合
      this.sys.protos = APP.inherit(null)
      // 控制器模块
      this.sys.controllers = APP.inherit(null)
      // models集合
      this.sys.models = APP.inherit(null)
      // 创建
      this.sys.is_create = false
    }

    appRun.remove = function () {
      // 移除
      $(this.bodywrap).remove()
      delete App.process[this.pid]
    }
  }
  // app基础文件
  init.routerInit = function () {
    // 构造对象
    router = {}
    router.map = {}
    router.regExp = function (url, callback) {
      router.regExpInit(function regExpInitCallback () {
        router.regExpRun(url, callback)
      })
    }
    router.regExpInitLock = false
    // 初始化
    router.regExpInit = function (callback) {
      if (router.regExpInitLock) {
        callback()
        return
      }
      router.regExpInitLock = true
      router.regExpLoad.call(this, callback)
    }
    // 加载
    router.regExpLoad = function (callback) {
      var i, check, defaultFn
      i = 0
      router.map = {}
      router.map.app = {}
      router.map.root = {}

      defaultFn = function (path) {
        return path
      }
      check = function () {
        if (++i === 2) {
          callback()
          i = check = callback = undefined
        }
      }
      APP.__rLoad.require(['app.router'], function (map) {
        var rule, routerMap, defaultFunc
        map = map || {}
        routerMap = []

        map['404'] = map['404'] || map['*']
        map['*'] = map['*'] || map['404']
        for (rule in map) {
          if (!map.hasOwnProperty(rule)) continue
          if (rule === '*' || rule === '404') {
            defaultFunc = map[rule] || defaultFn
            continue
          }
          routerMap.push({
            rule: new RegExp(rule, 'i'),
            func: map[rule]
          })
        }
        router.map.app = {
          map: routerMap,
          defaultFunc: defaultFunc || defaultFn
        }
        rule = routerMap = defaultFunc = undefined

        check && check()
      }, function (e) {
        router.map.app = {
          map: [],
          defaultFunc: defaultFn
        }
        check && check()
      })
      APP.__rLoad.require(['/router.js'], function (map) {
        var rule, routerMap, defaultFunc
        map = map || {}
        routerMap = []

        map['404'] = map['404'] || map['*']
        map['*'] = map['*'] || map['404']
        for (rule in map) {
          if (!map.hasOwnProperty(rule)) continue
          if (rule === '*' || rule === '404') {
            defaultFunc = map[rule] || defaultFunc || defaultFn
            continue
          }
          routerMap.push({
            rule: new RegExp(rule, 'i'),
            func: map[rule]
          })
        }
        router.map.root = {
          map: routerMap,
          defaultFunc: defaultFunc || defaultFn
        }
        rule = routerMap = defaultFunc = undefined

        check && check()
      }, function (e) {
        router.map.root = {
          map: [],
          defaultFunc: defaultFn
        }
        check && check()
      })
    }
    // 开始运行
    router.regExpRun = function (url, callback) {
      APP.each([router.map.root, router.map.app], function (index, routes) {
        var route, routeIndex, matchResult
        for (routeIndex in routes.map) {
          route = routes.map[routeIndex]
          matchResult = url.match(route.rule)
          if (matchResult) {
            url = route.func.apply(routes, matchResult.slice(1))
            break
          }
        }
        url = routes.defaultFunc(url)
        route = routeIndex = matchResult = undefined
      })
      if (callback && (typeof callback === 'function')) {
        callback(url)
      }
    }
  }
  // app基础文件
  init.appBaseInit = function () {
    appRun.appBase = function () {
      this.appBase = function appBase () {}
      // 创建的model对象，继承被appNode
      this.appBase.prototype = {}
      // 实例化appNode对象
      this.appBase = new this.appBase()
      // 指定views
      this.appBase.view = this.sys.views
      // 构建models
      this.appBase.model = function Models () {}
    //
      this.appBase.model.prototype = APP.inherit(null)
      // 实例化appNode对象
      this.appBase.model = new this.appBase.model()
      // 注入models
      APP.each(this.sys.models, function (key, model) {
        this.appBase.model[key] = function Model () {}
        // 创建的model对象，继承被实例化的app
        this.appBase.model[key].prototype = APP.inherit(model)
        // 对象实例化model
        this.appBase.model[key] = new this.appBase.model[key]()
      }, true, this)
    }
  }
  // 加载app初始化
  init.loadAppInit = function () {
    App.add_time_last = 0
    // 根据state加载
    App.loadAppByState = function (state, isReload) {
      var pid, _this, run
      run = function () {}
      state.pathquery = App.urlToPathquery(state.pathquery || state.url)
      if (state.pathquery === App.pathqueryold) {
        // alert('你要的地址:'+state.pathquery);
        return
      }
      App.pathqueryold = state.pathquery
      pid = $(APP.__rLoad.appConfig.window_select + '[pid][pathquery=' + APP.toJSON(state.pathquery) + ']', App.wrap).attr('pid') || 0
      if (isReload !== true) {
        _this = App.process[pid] || undefined
      }

      if (_this && _this.pid) {
        if (App.last_pathquery !== state.pathquery) {
          run = function () {
            App.tabToWindow(state.pathquery, pid)
          }
        }
      } else {
        // 指定继承app基类
        processApp.prototype = loadApp
        // 实例化
        _this = new processApp()
        // 状态
        _this.state = state
        // url
        _this.url = state.url
        // 添加时间
        _this.add_time = APP.time()
        // 进程id
        _this.pid = App.getPid().toString()
        // 相对根路径
        _this.pathquery = state.pathquery

        run = function () {
          _this.__SysInit__()
        }
        App.process[_this.pid] = _this
      }
      _this.state = _this.state || state
      // 赋值pid
      _this.state.pid = _this.pid
      // 赋值添加时间
      App.add_time_last = _this.state.add_time = _this.add_time
      // 赋值更新时间
      _this.state.up_time = _this.up_time = APP.time()
      // 最后修改路径
      App.last_pathquery = _this.state.pathquery
      // 重置popstate
      App.setPopState(_this.state, true)
      // 垃圾回收
      isReload = undefined
      run()
      _this.state = undefined
      run = undefined
      // 返回实例化的加载对象
      return _this
    }
  }
  // apiRESTful请求初始化
  init.apiRESTfulInit = function () {
    APP.__rLoad.require(['apiRESTful'], function (ddvApiRESTful) {
      var config = APP.__rLoad.appConfig
      // 设置默认请求域名
      ddvApiRESTful.setBaseUrl(config.urlapi.model)

      // 自定义头前缀
      ddvApiRESTful.setHeadersPrefix(config.headers_prefix)
      // 是否长期会话
      ddvApiRESTful.setLongStorage(config.long_storage)
      // 设置会话初始化最大自动尝试次数，默认3次
      ddvApiRESTful.setSessionInitTrySum(3)
      // 设置初始化session的path，默认/session/init
      ddvApiRESTful.setSessionInitPath(config.urlapi.session_init || '/session/init')
      APP.ddvApiRESTful = ddvApiRESTful
    })
  }
// 拦截所有a链接的请求
  init.popStateInit = function () {
  // 一次加载
    App.oneLoadInit = function () {
      App.toUrl(false, location.href.replace(location.origin, ''), 'load', true)
    }
  // 在不支持的浏览器下降级成传统网页的方式
    if (!App.isPopState) {
      return false
    }
  // 绑定所有a点击事件
    $(':root,body').on('click', 'a[target!="_blank"]', function () {
      return App.AClickRun.apply(this, arguments)
    })
  // 绑定popstate的状态变化
    $(window).on('popstate', function () {
      return App.popStateRun.apply(this, arguments)
    })
    setTimeout(function () {
      App.oneLoadInit()
    }, 20)
  /**
   * [AClickRun 拦截所有a链接的请求]
   * @author: 桦 <yuchonghua@163.com>
   * @DateTime 2016-06-18T15:39:13+0800
   * @param    {[type]}                 e [description]
   * @return   {[type]}                   [description]
   */
    App.AClickRun = function (e) {
      var $this, url, isSelf, thisdom, pathquery, pathbase, state
      // 是自己[是否为本项目]
      isSelf = true
      // 拿到被点击的a标签的jqdom
      $this = $(this)
      // 拿到原始dom
      thisdom = $this[0] || {}
      // 拿到点击的路径
      url = $this.attr('href') || null
      // 拿不到点击后的跳转路径就直接否定
      if (!url) {
        isSelf = false
      }
      // 如果跳转的主机头和当前不一致就否定
      if (thisdom.hostname !== window.location.hostname) {
        isSelf = false
      }
      // 如果端口不一样也否定
      if (thisdom.port !== window.location.port) {
        isSelf = false
      }
      // 取得项目的项目根路径
      pathbase = APP.__pathinfo.dir.base
      // 强制以'/'开头
      pathbase = (pathbase.substr(0, 1) === '/' ? '' : '/') + pathbase

      pathquery = App.urlToPathquery(url)

      // 如果跳转的目标url的前缀不为项目的根路径就否定
      if (pathquery.substr(0, pathbase.length) !== pathbase) {
        isSelf = false
      }
      // 如果被否定就中断
      if (!isSelf) { return }
      state = APP.inherit(null)
      state.pathquery = pathquery
      state.url = url
      state.title = $this.text()
      // 插入
      App.setPopState(state, false)
      // 载入新页面
      App.loadAppByState(state)
      $this = undefined
      url = undefined
      isSelf = undefined
      thisdom = undefined
      pathquery = undefined
      pathbase = undefined
      state = undefined
      // 拦截跳转
      return false
    }
  /**
   * [popStateRun 回调处理]
   * @author: 桦 <yuchonghua@163.com>
   * @DateTime 2016-06-18T15:36:33+0800
   * @param    {event}                 e [description]
   * @return   {[type]}                   [description]
   */
    App.popStateRun = function (e) {
      var $this, thisdom, originalEvent, state
      $this = $(this)
      thisdom = $this[0] || {}
      originalEvent = e.originalEvent
      state = originalEvent.state || APP.inherit(null)
      state.pathquery = state.pathquery || App.urlToPathquery(location.href)
      state.url = location.href
      App.loadAppByState(state)
    }
  // toUrl([false,]url,title,is_replace)
    App.toUrl = function () {
      var state, url
      var args = App.ModelArgsToArray(arguments)
      if (args[0] === false) {
        args.splice(0, 1)
        url = args[0]
      } else {
        url = APP.__pathinfo.dir.base + '/' + args[0]
      }
      state = APP.inherit(null)
      state.url = url
      state.pathquery = App.urlToPathquery(state.url)
      state.title = args[1] || 'load'
      // 插入
      App.setPopState(state, (args[2] === false ? false : args[2]))
      // 载入新页面
      App.loadAppByState(state)
    }
  /**
   * [__AppSetPopState 设置popstate]
   * @author: 桦 <yuchonghua@163.com>
   * @DateTime 2016-06-18T15:34:56+0800
   * @param    {object}                 state      [对象]
   * @param    {string}                 pathquery   [路径]
   * @param    {Boolean}                is_replace [布尔值]
   * @param    {string}                 title      [标题]
   */
    App.setPopState = function (state, isReplace, title) {
      if (APP.__rLoad.ie678) {
        return
      }
      if (isReplace === true && (!state)) {
        return
      }

      state = state || (('state' in history) && history.state) || {}
      state.title = (title || state.title || document.title).toString()
      state.url = state.url || state.pathquery
      if (!state.url) {
        return
      }
      state.pathquery = state.pathquery || App.urlToPath(state.url)
      if (isReplace) {
        history.replaceState(state, state.title, state.url)
      } else {
        history.pushState(state, state.title, state.url)
      }
      title = undefined
      isReplace = undefined
    }
  }
// 数据模型加载器初始化
  init.loadModelsApiInit = function () {
  // 加载model
    App.__Ajax = function (options, success, error) {
      APP.apiRESTful.api(options.path || '/').method(options.type || 'GET').headers(options.headers || {}).sendData(options.data || {}).done(function (res) {
        success(res)
      })
    .fail(function (msg, error_id, e) {
      error(msg, e)
    })
    }

  // 错误提示开始
    App.ModelsError = function ModelsError (msg, stack) {
      this.name = 'ModelsError'
      this.type = 'ModelsError'
      this.msg = msg || 'Unknown Error'
      this.message = this.msg
      this.stack = stack || (new Error(this.msg)).stack
      msg = undefined
      stack = undefined
    }
    App.ModelsError.prototype = APP.inherit(Error.prototype)
    App.ModelsError.prototype.constructor = App.ModelsError
  // 错误提示结束

    MBP = APP.inherit(null)

  /**
   * [success 成功数据反馈]
   * @author: 桦 <yuchonghua@163.com>
   * @DateTime 2016-06-23T19:52:22+0800
   * @param    {object}                 data [返回的数据]
   */
    MBP.success = function () {
      if (this.__M && this.__M.__callback_success && APP.type(this.__M.__callback_success, 'function')) {
        this.__M.__callback_success.apply(this.__M, App.ModelProxyArgs(App.ModelArgsToArray(arguments)))
      }
    }
  /**
   * [error 反馈错误]
   * @author: 桦 <yuchonghua@163.com>
   * @DateTime 2016-06-23T19:47:08+0800
   * @param    {string}                 msg      [错误提示]
   * @param    {string}                 error_id [错误ID]
   * @param    {object}                 data     [具体数据]
   */
    MBP.error = function (e) {
      var msg = e.errorMsg = e.message || e.msg || e.statusMessage
      var errorId = e.errorId = e.error_id || 'error_id_unknown'
      if (this.__M && this.__M.__callback_error && APP.type(this.__M.__callback_error, 'function')) {
        this.__M.__callback_error(msg, errorId, e)
      } else {
        if (this.__M.processApp.appBrowser.trigger('modelError', true, e).result !== false) {
          APP.App.error(msg, e)
        }
      }
      msg = errorId = void 0
    }
  // 请求模式
    APP.each('get GET post POST put PUT del DEL'.split(' '), function (index, type) {
      MBP[type] = function (path) {
        type = type.toUpperCase()
        if (type === 'DEL') {
          type = 'DELETE'
        }
        this.__api_id = (this.__api_id || 0) + 1
        this.__M[this.__api_id] = APP.inherit(MBAP)
        this.__M[this.__api_id].__options = APP.inherit(null)
        this.__M[this.__api_id].__options.data = APP.inherit(null)
        this.__M[this.__api_id].__options.type = type
        this.__M[this.__api_id].__options.path = path
        this.__M[this.__api_id]._API = this
        return this.__M[this.__api_id]
      }
    })

    MBAP = APP.inherit(null)
  /**
   * [sendData 发送数据]
   * @author: 桦 <yuchonghua@163.com>
   * @DateTime 2016-06-22T22:50:36+0800
   * @param    {Boolean}                isClear [description]
   * @param    {[type]}                 data     [description]
   * @return   {[type]}                          [description]
   */
    MBAP.sendData = function (isClear, data) {
      if (isClear === true) {
        this.__options.data = APP.inherit(null)
      } else {
        data = isClear
        isClear = undefined
      }
      APP.extend(true, this.__options.data, data)
      return this
    }

    MBAP.send = function (options) {
      var self = this
      APP.extend(true, this.__options, options)
      APP.ddvApiRESTful(this.__options.path || '/')
      .method(this.__options.type || 'GET').headers(this.__options.headers || {}).sendData(this.__options.data || {})
      .then(function (res) {
        if (self.__callback_success && APP.type(self.__callback_success, 'function')) {
          self.__callback_success(res)
        } else if (self && self._API && self._API.__M && self._API.__M && self._API.__M.__callback_success && APP.type(self._API.__M.__callback_success, 'function')) {
          self._API.__M.__callback_success(res)
        }
      })
      .catch(function (e) {
        e.error = e
        e.error_id = e.errorId = e.statusMessage || e.errorId || e.error_id || 'error_id_unknown'
        e.error_msg = e.errorMsg = e.message = e.message || e.msg || e.statusMessage || 'error_id_unknown'
        console.log('catch', e.body, Object.keys(e))
        Object.keys(e).forEach(key => console.log(e[key]))

        if (self.__callback_error && APP.type(self.__callback_error, 'function')) {
          self.__callback_error(e.message, e.error_id, e)
        } else if (self && self._API && self._API.__M && self._API.__M && self._API.__M.__callback_error && APP.type(self._API.__M.__callback_error, 'function')) {
          self._API.__M.__callback_error(e.message, e.error_id, e)
        } else {
          if (self._API.__M.processApp.appBrowser.trigger('modelError', true, e).result !== false) {
            APP.App.error(e.message, e)
          }
        }
      })
    }

  /**
   * [success 成功处理]
   * @author: 桦 <yuchonghua@163.com>
   * @DateTime 2016-06-22T22:50:29+0800
   * @param    {[type]}                 data [description]
   * @return   {[type]}                      [description]
   */
    MBAP.success = function success (fn) {
      if (APP.type(fn, 'function')) {
        this.__callback_success = fn
      }
      return this
    }
  /**
   * [error 处理错误]
   * @author: 桦 <yuchonghua@163.com>
   * @DateTime 2016-06-22T22:50:17+0800
   * @param    {[type]}                 msg   [description]
   * @param    {[type]}                 error [description]
   * @return   {[type]}                       [description]
   */
    MBAP.error = function error (fn) {
      if (APP.type(fn, 'function')) {
        this.__callback_error = fn
      }
      return this
    }

    appRun.__ModelsProxy = APP.inherit(null)
    appRun.ModelProxy = function (load_file) {
    // 实例化model的基本调用方法
      appRun.__ModelsProxy[load_file] = function ModelsProxy () {}
    // 设定继承
      appRun.__ModelsProxy[load_file].prototype = APP.inherit(null)
    // 实例化基本操作类
      appRun.__ModelsProxy[load_file] = new appRun.__ModelsProxy[load_file]()

      APP.each(appRun.ModelsBase[load_file], function (fn_name, fn) {
        var _this = this
        if (APP.type(fn, 'function')) {
          if (APP.ie678) {
            console.error('ie678还没有支持')
          } else {
            appRun.__ModelsProxy[load_file][fn_name] = function () {
              var M
              M = APP.inherit(MPP)
              M.arguments = App.ModelProxyArgs(App.ModelArgsToArray(arguments))
              M.model = appRun.__ModelsProxy[load_file]
              M.processApp = this.processApp
              setTimeout(function () {
                appRun.ModelTempThis = M
                fn.apply(M.model, M.arguments)
                appRun.ModelTempThis = undefined
              }, 0)
              return M
            }
          }
        }
      })
    }
  // ModelsProxyPrototype
    MPP = APP.inherit(null)
  /**
   * [success 成功处理]
   * @author: 桦 <yuchonghua@163.com>
   * @DateTime 2016-06-22T22:50:29+0800
   * @param    {[type]}                 data [description]
   * @return   {[type]}                      [description]
   */
    MPP.success = function success (fn) {
      if (APP.type(fn, 'function')) {
        this.__callback_success = fn
      }
      return this
    }
  /**
   * [error 处理错误]
   * @author: 桦 <yuchonghua@163.com>
   * @DateTime 2016-06-22T22:50:17+0800
   * @param    {[type]}                 msg   [description]
   * @param    {[type]}                 error [description]
   * @return   {[type]}                       [description]
   */
    MPP.error = function error (fn) {
      if (APP.type(fn, 'function')) {
        this.__callback_error = fn
      }
      return this
    }
  }
// 数据模型加载器初始化
  init.loadModelsInit = function () {
    appRun.ModelTempThis = undefined
    appRun.ModelsBase = APP.inherit(null)
  // 获取model的对象
    appRun.getModel = function (load_file, cb_success, cb_error) {
      var q, modelFn
      q = APP.queue().setThis(this)
      q.push(function loadModelsFile (next) {
        // 载入文件
        var path = APP.__pathinfo.dir.models + '/' + load_file
        path = path.replace(/\/\.\//g, '/')

        APP.__rLoad.require([path + '.js'], function success (model) {
          modelFn = model
          next()
        }, function error (e) {
          cb_error(e)
          q.abort()
        })
      })
      q.push(true, function runModels (next) {
        // 实例化基本操作类
        appRun.ModelsBase[load_file] = function ModelAPI () {
          if (appRun.ModelTempThis) {
            this.__M = appRun.ModelTempThis
          }
        }
        appRun.ModelsBase[load_file].prototype = MBP

        // 运行model，拿到各种调用方法
        if (APP.type(modelFn, 'function')) {
          // 运行
          modelFn(appRun.ModelsBase[load_file], APP)
          // model代理初始化
          appRun.ModelProxy(load_file)
          next()
        } else {
          error(Error('This is not a standard model'))
        }
      })
      q.push(true, function f () {
        cb_success(appRun.__ModelsProxy[load_file])
      })
      // 运行
      q.run()
    }
  // 视图存储
    appRun.modelsCache = APP.inherit(null)
    appRun.getModelForProxy = function (load_file, success, error) {
      var _this = this
      var cb_success = function () {
        setTimeout(function () {
          if (!(success && cb_success)) { return }
          var model
          cb_success = undefined
          model = APP.inherit(appRun.modelsCache[load_file])
          model.processApp = _this
          success(model)
          model = undefined
          load_file = undefined
          error = undefined
          success = undefined
        }, 0)
      }
      if (appRun.modelsCache[load_file]) {
        cb_success()
        return
      }
      appRun.getModel.call(this, load_file, function (model) {
        appRun.modelsCache[load_file] = model
        cb_success()
      }, error)
    }
    appRun.loadModels = function (load_files, cb_success, cb_error) {
    // 默认成功回调
      cb_success = cb_success || function () {}
    // 默认错误回调
      cb_error = cb_error || function error (e) {
      // 报错提示
        App.error('loadModels Error！', e)
      }

      var now, sum, models
      // 定义初始化默认值
      now = sum = 0
      // 创建空对象
      models = APP.inherit(null)
      // 遍历
      APP.each((load_files || []), function (key, path) {
        sum++
        appRun.getModelForProxy.call(this, path, function (model) {
          models[key] = model
          if (++now >= sum) {
            cb_success(models)
            model = undefined
          }
        }, function error (e) {
          var re = new Error('loadModels Error key:' + key + ' path:' + path + '!')
          re.stack = re.stack + e.stack
          e = undefined
          cb_error(re)
          re = undefined
        })
      }, true, this)
      if (now == sum) {
        now = undefined
        sum = undefined
        cb_success(models)
      }
    }
  }
// 初始化模板加载器
  init.loadViewsInit = function () {
    appRun.loadViews = function (load_files, cb_success, cb_error) {
    // 默认成功回调
      cb_success = cb_success || function () {}
    // 默认错误回调
      cb_error = cb_error || function error (e) {
      // 报错提示
        App.error('loadViews Error！', e)
      }

      var now, sum, views
      // 定义初始化默认值
      now = 0
      sum = load_files.length || 0
      // 创建空对象
      views = APP.inherit(null)
      // 遍历
      APP.each((load_files || []), function (key, path) {
        sum++
        // 使用require加载
        APP.__rLoad.require([('_ddvHotLoadHead!' + APP.__pathinfo.dir.views + '/' + path + '.html')], function (view) {
          views[key] = view
          if (++now >= sum) {
            setTimeout(function () { cb_success(views) }, 0)
            view = void 0
          }
        }, function error (e) {
          var re = new Error('loadViews Error key:' + key + ' path:' + path + '!')
          re.stack = re.stack + e.stack
          re.error_id = e.error_id || e.statusText || e.message
          e = undefined
          cb_error(re)
          re = undefined
        })
      })
      if (now == sum) {
        now = undefined
        sum = undefined
        cb_success(views)
      }
    }
  }
// 初始化控制器加载器
  init.loadControllersInit = function () {
    appRun.controllersProcess = APP.inherit(null)
    appRun.loadControllers = function (load_file, cb_success, cb_error, is_core) {
      if (appRun.controllersProcess[load_file]) {
        cb_success(appRun.controllersProcess[load_file])
        return
      }
      var q, load_array, controllers
    // 控制器纯粹的对象
      controllers = APP.inherit(null)
    // 加载数组
      load_array = []
    // 默认不是核心控制器
      is_core = is_core || false
    // 默认成功回调
      cb_success = cb_success || function () {}
    // 默认错误回调
      cb_error = cb_error || function error (e) {
      // 报错提示
        App.error('loadControllers Error！', e)
      }
    // 初始化一个队列
      q = APP.queue()
    // 重写上下文
      q.setThis(this)
    // 加载控制器文件
      q.push(function loadFile (next) {
      // 判断是否为核心文件
        load_file = APP.__pathinfo.dir[(is_core ? 'core' : 'controllers')] + '/' + load_file + '.js'
        APP.__rLoad.require([load_file], function success (obj) {
        // 数组插入内容
          load_array.unshift(APP.clone(obj))
          next()
        }, function error (e) {
          var re = new Error('loadControllers ' + load_file + ' Error!')
          re.stack = re.stack + e.stack
          e = undefined
          cb_error(re)
          re = undefined
        })
      })
    // 检测文件
      q.push(true, function checkFile (next) {
        if (load_array.length < 0) {
          next()
        }
        if (load_array && load_array[0] && APP.type(load_array[0].extend, 'string')) {
        // 第一个加载的是非核心，其他的都去核心文件夹中找
          is_core = true
        // 载入控制器的名称
          load_file = load_array[0].extend
        // 跳转到载入控制器重新运行
          q.nextToName('loadFile')
        } else {
          next()
        }
      })
    // 组合控制器对象
      q.push(true, function mergeFile (next) {
      // 循环所有的控制器
        APP.each((load_array || []), function (index, c) {
        // 循环控制器的每一个方法
          APP.each((c || []), function (key, value) {
            switch (key) {
            // 跳过继承字段
              case 'title':
                controllers.title = value
                break
              case 'extend':
                return
              case 'node_require':
              case 'browser_require':
                controllers[key] = APP.type(controllers[key], 'array') ? controllers[key] : []
                APP.each(value, function (index, path) {
                  controllers[key].push(path)
                })
                break
            // 浏览器和node服务器的代码压入数组
              case 'app_base':
              case 'browser':
              case 'node':
                controllers[key] = APP.is.array(controllers[key]) ? controllers[key] : []
                controllers[key].push(value)
                break
            // 其他使用撮合
              default:
                if (!controllers[key]) {
                  controllers[key] = APP.clone(value)
                } else {
                  APP.extend(true, controllers[key], APP.clone(value))
                }
                break
            }
          }, true, this)
        }, true, this)
        next()
      })
      q.push(true, function loadEnd (next) {
      // 缓存控制器
        appRun.controllersProcess[load_file] = controllers
      // 回调
        cb_success(controllers)
      // 销毁队列
        q.abort()
      })
    // 运行
      q.run()
    }
  }
  init.functionInit = function () {
    App.options = {}
  // 初始化容器
    App.wrapInit = function () {
      App.wrap = $(APP.__rLoad.appConfig.window_wrap_select || 'body')
      App.wrapdom = App.wrap[0]
    }
  // 报错
    App.error = function (msg, error) {
      alert(msg)
      if (error) {
        try {
          console.error(msg)
          setTimeout(function () {
            throw error
          }, 0)
        } catch (e) {}
      }
    }
  // url转相对路径
    App.urlToPathquery = function (url) {
      var query
      if (APP.type(url, 'string') && url.substr(0, 1) !== '/') {
        if (APP.url('path', url)) {
          query = APP.url('query', url)
          if (url.substr(0, location.origin.length) != location.origin) {
            url = APP.mapPath(location.href, url)
          }
          if (query) {
            url += '?' + query
          }
        } else {
          if (url.substr(0, location.origin.length) != location.origin) {
            url = APP.mapPath(location.href, url)
          }
        }
      }
      if (APP.url('path', url)) {
        query = APP.url('query', url)
        url = APP.url('path', url)
        if (query) {
          url += '?' + query
        }
      }
      query = undefined
      return url
    }
  // url转相对路径
    App.urlToPath = function (url) {
      if (APP.type(url, 'string') && url.indexOf('/') === 0) {
        return url
      } else {
        if (APP.url('path', url)) {
          url = APP.url('path', url)
        }
      }
      var path = APP.url('path', APP.mapPath(location.href, url))
      var queue = APP.url('queue', APP.mapPath(location.href, url))
      return APP.url('path', APP.mapPath(location.href, url))
    }
  // 标题
    App.title = function (title) {
      if (title === undefined) {
        return (document.title || this.sys.title).toString()
      } else {
        document.title = this.sys.title = title
        return this
      }
    }

  // 主要是深度克隆，防止对象被引用，导致数据污染
    App.ModelProxyArgs = function (args) {
      var newArgs, key
      if (!(args && (typeof args === 'object' || typeof args === 'function'))) {
        return args
      }
      if (APP.type(args, 'array')) {
        newArgs = []
        for (key = 0; key < args.length; key++) {
          newArgs.push(App.ModelProxyArgs(args[key]))
        }
      } else {
        newArgs = {}
        for (key in args) {
          newArgs[key] = App.ModelProxyArgs(args[key])
        }
      }
      return newArgs
    }
  // arguments 转数组
    App.ModelArgsToArray = function (args) {
      var i, r
      for (i = 0, r = []; i < args.length; i++) {
        r[i] = args[i]
      }
      i = undefined
      return r
    }
  }
// node 运行
  init.newNodeInit = function () {
    var NodeProto
    NodeProto = APP.inherit(null)
    appRun.newNode = function (cb_success, cb_error) {
      var _this = this
      if (this.sys && this.sys.controllers && this.sys.controllers.node && APP.type(this.sys.controllers.node, 'array')) {
        if (this.sys.controllers.node.length < 1) {
          cb_success()
          return
        }
      } else {
        cb_success()
        return
      }
      this.appNode = function appNode () {}
      // 创建的model对象，继承被appNode
      this.appNode.prototype = this.appBase
      // 实例化appNode对象
      this.appNode = new this.appNode()
      // 路由
      this.appNode.router = this.router
      // body
      this.appNode.body = this.body

      this.appNode.APP = APP.inherit(APP)

      // 遍历压入继承
      APP.each(NodeProto, function (key, obj) {
        this.appNode[key] = obj
      }, true, this)

      this.appNode.dom = function (selector, key) {
        this.dom[key] = this.$(selector)
        return (this.dom[key].length > 0) && this.dom[key]
      }
      // 遍历 app_base
      APP.each(this.sys.controllers.app_base, function (index, fn) {
        APP.type(fn, 'function') && fn.apply(this.appNode, [this.appNode, this.appNode.APP])
      }, true, this)
      // 遍历 node
      APP.each(this.sys.controllers.node, function (index, fn) {
        APP.type(fn, 'function') && fn.apply(this.appNode, [this.appNode, this.appNode.APP])
      }, true, this)
      // 结束解析
      cb_success()
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
    NodeProto.$ = function (selector, context) {
      return $(selector, (context || this.body))
    }

    APP.each((
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
  }
// 浏览器运行
  init.runBrowserInit = function () {
    var BrowserProto, EventProto
    BrowserProto = APP.inherit(null)
    EventProto = APP.inherit(null)

    appRun.runBrowser = function (cb_success, cb_error) {
      var _this = this
      if (this.sys && this.sys.controllers && this.sys.controllers.browser && APP.type(this.sys.controllers.browser, 'array')) {
        if (this.sys.controllers.browser.length < 1) {
          cb_success()
          return
        }
      } else {
        cb_success()
        return
      }
      this.appBrowser = function appBrowser () {}
      // 创建的model对象，继承被appBrowser
      this.appBrowser.prototype = this.appBase
      // 实例化appBrowser对象
      this.appBrowser = new this.appBrowser()
      // 路由
      this.appBrowser.router = this.router
      // body
      this.appBrowser.body = this.body
      // 全局对象
      this.appBrowser.APP = APP.inherit(APP)
      // 运行器指向 this
      this.appBrowser.__sysAppRun = this
      // 载入工具
      this.appBrowser.require = APP.__rLoad.require
      // 遍历压入继承
      APP.each(BrowserProto, function (key, obj) {
        this.appBrowser[key] = obj
      }, true, this)

      this.appBrowser.dom = function (selector, key) {
        this.dom[key] = this.$(selector)
        return (this.dom[key].length > 0) && this.dom[key]
      }

      // 浏览器自动引入
      if (this.sys.controllers.browser_require && this.sys.controllers.browser_require.length > 0) {
        APP.__rLoad.require(this.sys.controllers.browser_require, function () {
          _this.appBrowser.arguments = App.ModelArgsToArray(arguments)
          _this.appBrowser.arguments.unshift(_this.appBrowser, _this.appBrowser.APP)
          appRun.runBrowserEnd.call(_this, cb_success, cb_error)
          _this = undefined
        }, function (error) {
          cb_error(error)
          // APP.__rLoad.requirejsError(error.message,error);
        })
      } else {
        this.appBrowser.arguments = [this.appBrowser, this.appBrowser.APP]
        appRun.runBrowserEnd.call(this, cb_success, cb_error)
        _this = undefined
      }
    }
    appRun.runBrowserEnd = function (cb_success, cb_error) {
      try {
      // 遍历
        APP.each((this.sys.controllers.app_base || []), function runBrowserAppBase (index, fn) {
          APP.type(fn, 'function') && fn.apply(this.appBrowser, this.appBrowser.arguments)
        }, true, this)
      // 遍历
        APP.each((this.sys.controllers.browser || []), function runBrowserAppJs (index, fn) {
          APP.type(fn, 'function') && fn.apply(this.appBrowser, this.appBrowser.arguments)
        }, true, this)

        cb_success()
      } catch (e) {
        cb_error(e)
      }
    }

  // 触发事件
    BrowserProto.trigger = function (type, is_return_e, EventProtoInput) {
      if (!this.body) {
        return false
      }
      var e = $.Event(type, (EventProtoInput || EventProto))
      this.body.trigger(e)
      return is_return_e ? e : this
    }
    BrowserProto.remove = function () {

    }
    BrowserProto.require = function () {
      return APP.__rLoad.require.apply(BrowserProto, arguments)
    }
  // 重新加载
    BrowserProto.reload = function () {
      location.reload()
      console.error('开发中...')
    }
    BrowserProto.toUrl = function (url) {
      return App.toUrl.apply(this, arguments)
    }
    BrowserProto.back = function () {
      history.back()
    }

    APP.each((
    // 属性
    'attr removeAttr prop removeProp ' +
    // CSS 类
    'css addClass removeClass toggleClass ' +
    // CSS 位置
    'offset position scrollTop scrollLeft ' +
    // 核心 数据缓存
    'data removeData ' +
    // CSS 尺寸
    'heigh width innerHeight innerWidth outerHeight outerWidth ' +
    // 事件
    'off on one ' +
    // HTML代码/文本
    'html text ' +
    // 文档处理
    'append prepend empty children find contents'
    ).split(' '), function (i, key) {
      if (!key) { return }
      BrowserProto[key] = function () {
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
    BrowserProto.render = function () {
      if (arguments[0] === false) {
        return this.body.render.apply(this.body, arguments)
      } else {
        this.body.render.apply(this.body, arguments)
        return this
      }
    }
  // 取得外部html
    BrowserProto.outerHtml = function () {
      return (arguments.length > 0) ? (this.html(arguments[0]) && this) : this.prop('outerHTML')
    }
  // 取得外部html
    BrowserProto.$ = function (selector, context) {
      return $(selector, (context || this.body))
    }
  // 设置
    BrowserProto.set = function () {}
  // 设置表单
    BrowserProto.set.formData = function (keys, data, context) {
      keys = keys || ''
      keys = keys.split(',')
      var is_keys = keys.length > 0
      APP.each(data, function (key, value) {
        if (is_keys && APP.array.index(key, keys) < 0) {
          return
        }
        $('[i=' + APP.toJSON(key) + ']', (context || this.body)).val(value)
      })
    }
  // 获取
    BrowserProto.get = function () {}
  // 获取表单数据
    BrowserProto.get.formData = function (keys, context) {
      var p = {}
      p.keys = keys
      keys = undefined
      p.data = APP.get.formData(context || this.body)
      p.keys = APP.type(p.keys, 'string') ? p.keys.split(',') : p.keys
      p.data_out = {}
      if (APP.type(p.keys, 'array')) {
        APP.each(p.keys, function (index, key) {
          if (APP.type(p.data[key], 'array') || APP.type(p.data[key], 'string') || APP.type(p.data[key], 'number')) {
            p.data_out[key] = p.data[key]
          }
        })
        p.data = p.data_out
      }
      p = p.data
      return p
    }
  }
// 切换窗口
  init.tabToWindowInit = function () {
  // 切换窗口
    App.tabToWindow = function (app, pid) {
      var p, pathquery
      if (app instanceof processApp) {
        p = app
      } else {
        if (APP.type(app, 'object')) {
        // 如果对象是一个appBrowser
          if (app.__sysAppRun && (app.__sysAppRun instanceof processApp)) {
            p = app.__sysAppRun
          } else if (app.pathquery && app.pid) {
            pathquery = app.pathquery
            pid = app.pid
          }
        }
        pathquery = undefined
        pid = pid || p.pid
        p = undefined
        if (!(p instanceof processApp)) {
        // 如果只有pathquery尝试查找pid
          if ((!pid) && pathquery) {
            pid = $(APP.__rLoad.appConfig.window_select + '[pid][pathquery=' + APP.toJSON(state.pathquery) + ']', App.wrap).attr('pid') || 0
          }
        // 如果有pid尝试去进程池查找
          if (pid) {
            p = App.process[pid] || undefined
          }
        }
      }
      app = undefined
      pid = undefined

      if (p instanceof processApp) {
      // 切换过去
        appRun.tabToWindow.call(p)
      } else {
      // 加载一次
        try {
          console.log('重新加载一次', pathquery)
        } catch (e) {}
        App.toUrl(false, pathquery, 'load...', true)
      }
      p = undefined
      pathquery = undefined
    }
  // 切换窗口
    appRun.tabToWindow = function () {
      var is_open, _this
      is_open = false
      _this = this
      $.each($(APP.__rLoad.appConfig.window_select, App.wrap), function (index, el) {
        var p = {}
        p.el = el
        p.jqdom = $(p.el)
        p.is_hidden = p.jqdom.is(':hidden')
        p.pid = p.jqdom.attr('pid') || undefined
        p.pathquery = p.jqdom.attr('pathquery') || undefined
        p.app = App.process[p.pid] || undefined
        if (p.pathquery == _this.pathquery && p.pid == _this.pid) {
          if (p.is_hidden) {
            if (p.app) {
              p.jqdom.show()
              p.app.appBrowser.trigger('open')
              is_open = true
            } else {
              is_open = false
            }
          } else if (p.jqdom.attr('trigger_open') == 'true' && p.app) {
              // 已经被提前显示，所有需要触发事件
            p.app.appBrowser.trigger('open')
            p.jqdom.removeAttr('trigger_open')
            is_open = true
          } else {
            if (!p.app) {
              is_open = false
            }
          }
        } else {
          if (!p.is_hidden) {
            p.jqdom.hide()
            if (p.app && p.app.appBrowser.trigger) {
              p.app.appBrowser.trigger('close')
            }
          }
        }
      })
      if (!is_open) {
        console.error('异常了')
      }
    }
  }
// 配置信息
  init.config = function (options) {
    if (typeof options !== 'object') {
      App.error('必须传入对象')
    }
  // 压入配置信息
    APP.extend(true, App.options, options)
  }
// pid进程id初始化
  init.pidInit = function () {
    var p
    App.lastPid = 0
    p = APP.inherit(null)
    p.wrap = $(APP.__rLoad.appConfig.window_select, App.wrap)
    if (p.wrap && p.wrap.length > 0) {
      $.each(p.wrap, function (index, dom) {
        p.pid = parseInt($(dom).attr('pid') || null)
        if (p.pid && p.pid >= App.lastPid) {
          App.lastPid = p.pid
        }
      })
      $.each(p.wrap, function (index, dom) {
        p.pid = parseInt($(dom).attr('pid') || null)
        if (!p.pid) {
          $(dom).attr('pid', (++App.lastPid))
        }
      })
    }
    p = undefined
    App.getPid = function () {
      return (++App.lastPid).toString()
    }
  }
// 进程信息初始化
  init.processInit = function () {
  // 进程池-创建一个纯粹的对象来存储进程对象
    App.process = APP.inherit(null)
  }
// 基本信息初始化
  init.infoInit = function () {
  // 默认不支持
    App.isPopState = false
    try {
      App.isPopState = true &&
      ('onpopstate' in window) &&
      ('history' in window) &&
      ('pushState' in window.history) &&
      (typeof window.history.pushState === 'function') && true || false
    } catch (e) {
      App.isPopState = false
    }
  }

  // model加载专用
  window.models = function (model) {
    define(function () {
      return model
    })
  }
  // controllers加载专用
  window.controllers = function (controllers) {
    define(controllers)
  }

  $.fn.render = function () {
    var args, $this, tmpl, data, is_r_html, is_empty, html, select, parent, temp_wrap, styles, styleswrap, wrap_i
    is_r_html = false
    $this = $(this)
    if ($this.length < 1) {
      return this
    }
    data = APP.inherit(null)
    args = App.ModelArgsToArray(arguments)
    if (APP.type(args[0], 'boolean')) {
      if (args[0] === true) {
        is_empty = true
      }
      if (args[0] === false) {
        is_r_html = true
      }
      if (args.length > 0) {
        args.splice(0, 1)
      }
    }
    tmpl = args[0] || ''
    if (args.length > 0) {
      args.splice(0, 1)
    }
    args.unshift(true, data, APP.__pathinfo)
    $.extend.apply(data, args)
      // 解析
    Mustache.parse(tmpl)
      // 渲染
    html = Mustache.render(tmpl, data)
    args = undefined
    tmpl = undefined
    data = undefined
    if (is_r_html) {
      $this = undefined
      is_empty = undefined
        // 直接返回结果
      return html
    } else {
      select = APP.__rLoad.appConfig.window_select + '[pathquery]'
      parent = $this.is(select) ? $this : $()
      parent = parent.length > 0 ? parent : $this.parent(select)
      parent = parent.length > 0 ? parent : $this.parentsUntil(select).parent(select)
      if (parent.length > 0 && (styleswrap = $(parent.children('[appwindow="styles"]:first'))).length > 0) {
        wrap_i = 'parse_tmpl_jqdom_wrap' + (new Date()).getTime()
          // 包裹父级
        temp_wrap = $('<div i="' + wrap_i + '"></div>')

          // 尝试使用原生模式获取，避免浏览器兼容问题
        try {
          temp_wrap.get(0).innerHTML = html
        } catch (e) {
          temp_wrap.html(html)
        }
        $.each($('link[href]', temp_wrap), function (index, el) {
          if ($('link[href=' + APP.toJSON($(el).attr('href') || 'false') + ']', styleswrap).length > 0) {
            $(el).remove()
          } else {
            styleswrap.append(el)
          }
        })
        html = temp_wrap.contents()
        temp_wrap = wrap_i = undefined
      }
      select = undefined
      parent = undefined
      styleswrap = undefined
      if (is_empty) {
          // 清空插入
        $this.empty().append(html)
      } else {
          // 直接插入
        $this.append(html)
      }
      temp_wrap && temp_wrap.remove()
      is_empty = undefined
      $this = undefined
      return this
    }
  }
  return function AppFn (options) {
  // 构造一个内部对象
    App = function appApp () {}
    App.prototype = {}
  // 实例化一个
    APP.App = App = new App()
  // 初始化一次
    init(options)
  }
})
