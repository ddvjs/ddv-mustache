'use strict'
var a, processPidInfo, apiProcess
const cjb_base = require('cjb-base')
const b = cjb_base.inherit(cjb_base)
a = b.inherit(null)
a.fn = b.inherit(null)
a.get = b.inherit(null)
a.tool = b.inherit(null)
a.run = b.inherit(null)
a.run.session = b.inherit(null)
processPidInfo = b.inherit(null)
apiProcess = b.inherit(null)

const CryptoJS = require('crypto-js')
const http = require('http')
const querystring = require('querystring')

// api接口
a.api = function (path) {
  var apiProcess
  apiProcess = new a.API()
  apiProcess.__path = path || '/'
  // 下一线程使用
  process.nextTick(function () {
    a.fn.__apiProcessInit.call(this)
    apiProcess = undefined
  }.bind(apiProcess))
  return apiProcess
}
a.API = function () {}
a.API.prototype = b.inherit(null)
// 请求模式
a.API.prototype.method = function (method) {
  this.__method = method || 'GET'
  // 获取请求模式 get post put delete 模式
  this.__method = this.__method.toString().toUpperCase()
  return this
}
// 设置请求path
a.API.prototype.path = function (path) {
  this.__path = path || this.__path || '/'
  return this
}
// 头信息
a.API.prototype.headers = function (headers) {
  this.__headers = this.__headers || b.inherit(null)
  b.extend(true, this.__headers, headers)
  return this
}
// 发送数据
a.API.prototype.sendData = function (data) {
  this.__data = this.__data || b.inherit(null)
  b.extend(true, this.__data, data)
  return this
}
a.API.prototype.done = function () {
  return this.success.apply(this, arguments)
}
a.API.prototype.fail = function () {
  return this.error.apply(this, arguments)
}
a.API.prototype.success = function () {
  this.__success = this.__success || []
  var i
  for (i = 0; i < arguments.length; i++) {
    if (b.type(arguments[i], 'function')) {
      this.__success.push(arguments[i])
    }
  }
  i = undefined
  return this
}
a.API.prototype.error = function () {
  this.__error = this.__error || []
  var i
  for (i = 0; i < arguments.length; i++) {
    if (b.type(arguments[i], 'function')) {
      this.__error.push(arguments[i])
    }
  }
  i = undefined
  return this
}
a.API.prototype.setConn = function (conn) {
  this.__conn = conn || this.__conn || undefined
  conn = undefined
  return this
}
a.API.prototype.destroy = function () {
  process.nextTick(function () {
    var key
    for (key in this) {
      if (!Object.hasOwnProperty.call(this, key)) continue
      delete this[key]
    }
    key = undefined
    console.log('销毁')
  }.bind(this))
}
a.fn.__apiProcessInit = function () {
  this.__method = this.__method || 'GET'
  this.__headers = this.__headers || b.inherit(null)
  this.__data = this.__data || b.inherit(null)
  this.__path = this.__path || '/'
  this.__request_id = a.get.newRequestId()
  this.__body = querystring.stringify(this.__data)
  apiProcess[this.__request_id] = this
  a.fn.__apiRun(this.__request_id)
}
a.fn.__apiRun = function (request_id) {
  var q, o, base_o, res, resData, cb_error, _this
  base_o = apiProcess[request_id]
  if (!base_o) {
    console.log('xxxx错了')
    return
  }
  _this = base_o.__conn
  cb_error = function (msg, error_id, e) {
    var request_id
    if (e.code == 403 && o.request_id) {
      base_o.try_error_num = base_o.try_error_num || 0
      if (++base_o.try_error_num < 2) {
        request_id = base_o.__request_id

        a.fn.sessionInit.call(_this, function () {
            // 下一步
          a.fn.__apiRun.call(_this, request_id)
          msg = error_id = o = base_o = res = undefined
        }, function (e) {
          cb_error((e.msg || e.message || 'Unknown Error'), (e.error_id || 'unknown_error_id'), e)
        })
        return
      }
    }
    if (!(base_o && base_o.__error && base_o.__error.length > 0)) {
      setTimeout(function () {
        q.abort()
        try { console.log(msg) } catch (e) {}
        msg = error_id = o = base_o = res = undefined
        throw e
      }, 0)
    }

    b.each(base_o.__error, function (index, fn) {
      if (b.type(fn, 'function')) {
        fn(msg, error_id, e)
      }
    })
  }
    // 创建队列
  q = b.queue().setThis(_this)
    // 组合基本签名信息
  q.push(function (next) {
    o = b.inherit(null)
    o.request_id = base_o.__request_id
    o.body = base_o.__body
    o.method = base_o.__method
    o.headers = b.extend(true, b.inherit(null), base_o.__headers)
    o.path = base_o.__path
    o.path = (o.path.charAt(0) == '/' ? '' : '/') + o.path
    o.query = b.url('query', o.path) || ''
    o.path = b.url('path', o.path) || '/'

    o.host = b.url('hostname', this.appConfig.urlapi.model)
    o.port = b.url('port', this.appConfig.urlapi.model)
    o.protocol = b.url('protocol', this.appConfig.urlapi.model)
      // 下一步
    next()
  })
    // 执行签名
  q.push(true, function (next) {
    a.tool.getSignInfo.call(this, o, function (info) {
      o = info
      info = undefined
      next()
    }, function (e) {
      cb_error((e.msg || e.message || 'Unknown Error'), (e.error_id || 'unknown_error_id'), e)
    })
  })
    // 发送
  q.push(true, function (next) {
    var opt, req, body
    opt = {
      method: o.method,
      protocol: o.protocol,
          // host: o.host,
      host: (this.appConfig.urlapi.model_host_ipaddress || o.host),
      port: o.port,
      path: o.path,
      headers: o.headers
    }
    if (o.query) {
      opt.path += '?' + o.query
    }
    body = ''
    req = http.request(opt, function (response) {
      response.on('data', function (data) { body += data }).on('end', function () {
        var status, statusText, isSuccess, text, data
        status = response.statusCode.toString() || '200'
        statusText = response.statusMessage.toString() || 'OK'
        isSuccess = status >= 200 && status < 300 || status === 304
              // if no content
        if (status === 204 || o.method === 'HEAD') {
          statusText = statusText || 'nocontent'
              // if not modified
        } else if (status === 304) {
          statusText = statusText || 'notmodified'
        }
        if (isSuccess) {
          res = body
          next()
        } else {
          var e
          statusText = statusText || 'error'
          try {
            data = b.parseJSON(body)
          } catch (e1) {
            data = {}
          }
          data.responseText = body
          e = new Error(statusText)
          b.extend(true, e, data)
          cb_error((e.msg || e.message || statusText), (e.error_id || 'api_error'), e)
        }
        status = statusText = isSuccess = text = data = body = undefined
      })
    })
    req.write(o.body)
    req.on('error', function (e) {
      cb_error(e.message, 'api_error', e)
    })
    req.end()
    opt = req = undefined
  })
  q.push(true, function (next) {
    try {
      resData = b.parseJSON(res)
      next()
    } catch (e) {
      e.responseText = res
      cb_error((e.message || e.msg || 'Unknown error'), 'api_error', e)
      resData = {}
    }
  })
  q.push(true, function (next) {
    if (base_o && base_o.__success && base_o.__success.length > 0) {
      b.each(base_o.__success, function (index, fn) {
        if (b.type(fn, 'function')) {
          fn(resData)
        }
      })
    }
    base_o.destroy()
    q = o = base_o = res = resData = cb_error = undefined
  })
    // 运行
  q.run()
}

a.tool.getSignInfo = function (o, cb_success, cb_error) {
  var q
  o = o || b.inherit(null)
  o.n = '\n'

  o.request_id = o.request_id || a.get.newRequestId()

  if (o.method.toLowerCase() == 'get') {
    o.query_body = o.body
    o.body = ''
  } else {
    o.body = o.body || ''
  }

    // 以&拆分数组
  o.query_array = []
    // 签名数组
  o.query_array_sign = []
  if (o.query && o.query.length > 0) {
    b.each(o.query.indexOf('&'), function (index, t) {
      if (!t) {
        return
      }
      var key, value, i
          // 找到第一个等号的首次出现位置
      i = t.indexOf('=')
          // 取得key
      key = t.substr(0, i)
          // 取得value
      value = t.substr(i + 1)
          // 先去左右空格再编码
      key = a.tool.urlEncode(b.trim(key))
      value = a.tool.urlEncode(b.trim(value))
          // 插入新数组
      o.query_array_sign.push(key + '=' + value)
    })
  }
  if (o.query_body && o.query_body.length > 0) {
    b.each(o.query_body.split('&'), function (index, t) {
      if (!t) {
        return
      }
      var key, value, i
          // 找到第一个等号的首次出现位置
      i = t.indexOf('=')
          // 取得key
      key = t.substr(0, i)
          // 取得value
      value = t.substr(i + 1)
          // 先去左右空格再编码
      key = a.tool.urlEncode(b.trim(decodeURIComponent(key)))
      value = a.tool.urlEncode(b.trim(decodeURIComponent(value)))
          // 插入新数组
      o.query_array_sign.push(key + '=' + value)
    })
    delete o.query_body
  }
    // 排序
  o.query_array_sign.sort()
    // 用&拼接
  o.query = o.query_array_sign.join('&')
    // 回收内存
  delete o.query_array; delete o.query_array_sign

    // 克隆

  o.headers_temp = b.inherit(null)
    // 遍历头
  b.each(o.headers, function (key, value) {
      // 去左右空格
    key = b.trim(key.toString())
    if (key.toLowerCase() == 'authorization') { return }
    if (key.toLowerCase() === 'host') { key = 'Host' }
    switch (key.toLowerCase()) {
      case 'authorization':
        return
      case 'host':
        key = 'Host'
        break
      case 'content-length':
        key = 'Content-Length'
        break
      case 'content-type':
        key = 'Content-Type'
        break
      case 'content-md5':
        key = 'Content-Md5'
        break
    }
    value = b.trim(value.toString())
    o.headers_temp[key] = value
  })
    // 把处理后的赋值回给
  o.headers = o.headers_temp
    // 释放内存
  delete o.headers_temp
    // 强制有host头
  o.headers.Host = (o.headers.Host === undefined || o.headers.Host === null) ? o.host : o.headers.Host

  if (o.body && o.body.length > 0) {
    o.headers['Content-Length'] = (o.headers['Content-Length'] === undefined || o.headers['Content-Length'] === null) ? o.body.length : o.headers['Content-Length']
    o.headers['Content-Type'] = (o.headers['Content-Type'] === undefined || o.headers['Content-Type'] === null) ? 'application/x-www-form-urlencoded; charset=UTF-8' : o.headers['Content-Type']
    o.headers['Content-Md5'] = a.md5Base64(o.body)
  }

    // 要签名的头的key的一个数组
  o.headers_string = []
    // 签名的头
  o.canonical_headers = []

  o.headers_prefix = this.appConfig.headers_prefix || 'x-app-'
  o.headers_prefix_len = o.headers_prefix.length
    // 再次遍历头
  b.each(o.headers, function (key, value) {
    var key_lower
        // 小写的key
    key_lower = key.toLowerCase()
        // 判断一下
    if (b.array.index(key_lower, ['host', 'content-length', 'content-type', 'content-md5']) > -1 || key_lower.substr(0, o.headers_prefix_len) == o.headers_prefix) {
      o.canonical_headers.push(a.tool.urlEncode(key_lower) + ':' + a.tool.urlEncode(value))
      o.headers_string.push(key_lower)
    }
  })

  o.canonical_headers.sort()
    // 用\n拼接
  o.canonical_headers = o.canonical_headers.join(o.n)
    // 用;拼接
  o.headers_string = o.headers_string.join(';')

  o.session_data = b.inherit(null)

  o.Authorization = ''

    // 建立队列
  q = b.queue().setThis(this)
    // 插入队列方法-获取会话数据
  q.push(function (next) {
      // 获取会话数据
    a.run.session.getTrueData.call(this, function (session_data) {
        // 存储数据
      o.session_data = session_data
        // 下一步
      next()
    }, function (e) {
      cb_error(e)
      cb_success = cb_error = undefined
        // 销毁
      q.abort()
    })
  })
  q.push(true, function (next) {
      // 获取会话信息
    o.session_id = o.session_data.session_id
    o.session_key = o.session_data.session_key || 'session_key'
    o.session_card = o.session_data.session_card
      // 下一步
    next()
  })
  q.push(true, function (next) {
      // 授权字符串
    o.Authorization += 'app-auth-v2' + '/' + o.request_id + '/' + o.session_id + '/' + o.session_card + '/' + a.tool.gmdate('Y-m-dTH:i:sZ', a.get.timeServer(o.session_data.difference_time)) + '/' + '1800'
      // 生成加密key
    o.signing_key = a.HmacSHA256(o.Authorization, o.session_key)
      // 下一步
    next()
  })
  q.push(true, function (next) {
    o.canonical_request = o.method + o.n + a.tool.urlEncodeExceptSlash(o.path) + o.n + o.query + o.n + o.canonical_headers
      // 使用signKey和标准请求串完成签名
    o.session_sign = a.HmacSHA256(o.canonical_request, o.signing_key)
      // 组成最终签名串
    o.Authorization += '/' + o.headers_string + '/' + o.session_sign
      // 下一步
    next()
  })
    // 回收变量
  q.push(true, function (next) {
      // delete o.n;
      // delete o.headers_string;
      // delete o.headers_prefix;
      // delete o.headers_prefix_len;
      // delete o.session_sign;
      // delete o.signing_key;
      // delete o.session_key;
      // delete o.session_id;
      // delete o.session_data;
      // delete o.session_card;
      // delete o.canonical_headers;
      // delete o.canonical_request;
    o.headers.Authorization = o.Authorization
    delete o.Authorization
    cb_success(o)
    q.abort()
  })
    // 运行队列
  q.run()
}

// 获取检验过的session数据
a.run.session.getTrueData = function (cb_success, cb_error) {
  var q, session_data, _this
  // 加入回调系统
  a.callback.add(this, 'api.session.getTrueData', 'success', cb_success)
  a.callback.add(this, 'api.session.getTrueData', 'error', cb_error)
  cb_success = cb_error = undefined
  // 如果是获取中就防止多次连接
  if (this.__sys__.is_get_session_true_ing === true) {
    return
  }
  _this = this
  a.callback.add(this, 'api.session.getTrueData', 'success', function () {
    _this.__sys__.is_get_session_true_ing = false
  })
  a.callback.add(this, 'api.session.getTrueData', 'error', function () {
    _this.__sys__.is_get_session_true_ing = false
  })
  this.__sys__.is_get_session_true_ing = true
  q = b.queue().setThis(this)
  // 插入队列
  q.push(function getSessionDataRun (next) {
    session_data = this.session_data
    next()
  })
  // 获取会话数据
  q.push(true, function checkSessionDataRun (next) {
    // 为了保证没有问题，提前5秒钟过期
    if ((!session_data) || (!session_data.expires_time) || b.time() > (session_data.expires_time - 5)) {
      a.fn.sessionInit.call(this, function () {
        // 下一步
        q.nextToName('getSessionDataRun')
      }, function (e) {
        a.callback.run(this, 'api.session.getTrueData', 'error', [e])
        q.abort()
        session_data = q = _this = undefined
      })
    } else {
      // 下一步
      next()
    }
  })
  // 检测一下数据
  q.push(true, function checkSessionDataRun2 (next) {
    if (session_data && session_data.session_id && session_data.session_key && session_data.session_card) {
      next()
    } else {
      session_data = {}
      q.nextToName('checkSessionDataRun')
      return
    }
  })
  // 成功回调
  q.push(true, function (next) {
    a.callback.run(this, 'api.session.getTrueData', 'success', [session_data])
    q.abort()
    session_data = q = _this = undefined
  })
  q.run()
}

// 初始化session
a.fn.sessionInit = function (cb_success, cb_error) {
  var q, request_id, session_data, authorization, error_try, resText, resData, _this
    // 加入回调系统
  a.callback.add(this, 'api.session.init', 'success', cb_success)
  a.callback.add(this, 'api.session.init', 'error', cb_error)
  cb_success = cb_error = undefined
    // 如果是连接中就防止多次连接
  if (this.__sys__.is_session_init_ing === true) {
    return
  }
  _this = this
  session_data = this.session_data

    // 因为需要自动重新尝试重连，所有就先来个错误预处理
  error_try = function (msg, error_id, e) {
    _this.error_try_time = _this.error_try_time || 0
    if (++_this.error_try_time <= 5) {
      _this.__sys__.is_session_init_ing = false
      a.fn.sessionInit.call(_this)
    } else {
      a.callback.run(_this, 'api.session.init', 'error', [e])
    }
    q.abort()
      // 回收资源
    q = request_id = session_data = authorization = error_try = resText = resData = _this = undefined
  }

    // 标识建立连接中
  this.__sys__.is_session_init_ing = true
    // 连接不管成功与否都标识为非建立连接中
  a.callback.add(this, 'api.session.init', 'success', function () {
    this.__sys__.is_session_init_ing = false
  })
  a.callback.add(this, 'api.session.init', 'error', function () {
    this.__sys__.is_session_init_ing = false
  })

    // 创建队列
  q = b.queue().setThis(this)
    // session_card
  q.push(true, function (next) {
    if (session_data && session_data.session_card && a.run.session.isCard(session_data.session_card)) {
        // 如果有session_card就直接跳转下一步
      next()
    } else {
        // 否则创建session_card
      a.run.session.createCard(this.userAgent, function (session_card) {
          // 会话
        session_data.session_card = session_card
          // 下一步
        next()
      })
    }
  })

    // 获取授权签名信息
  q.push(true, function (next) {
    request_id = a.get.newRequestId.call(this)
    authorization = a.run.session.getSignInt.call(this, request_id, session_data)
    next()
  })

    // 发送请求
  q.push(true, function (next) {
    var opt, req, body, url, query, host
    url = this.appConfig.urlapi.model + '/' + this.appConfig.urlapi.session_init
    url = b.formatUrl(url)
    host = b.url('hostname', url)
    opt = {
      method: 'GET',
      protocol: (b.url('protocol', url) || 'http:'),
          // host: b.url('hostname',url),
      host: (this.appConfig.urlapi.model_host_ipaddress || host),
      port: (b.url('port', url) || '80'),
      path: (b.url('path', url) || '/'),
      headers: { 'Authorization': authorization }
    }
    if (this.appConfig.urlapi.model_host_ipaddress) {
      opt.headers.Host = host
    }
    query = b.url('query', url) || ''
    if (query) {
      opt.path += '?' + query
    }
    query = url = host = authorization = undefined
    body = ''
    req = http.request(opt, function (response) {
      response.on('data', function (data) { body += data }).on('end', function () {
        var status, statusText, isSuccess, text, data
        status = response.statusCode.toString() || '200'
        statusText = response.statusMessage.toString() || 'OK'
        isSuccess = status >= 200 && status < 300 || status === 304
              // if no content
        if (status === 204 || opt.method === 'HEAD') {
          statusText = statusText || 'nocontent'
              // if not modified
        } else if (status === 304) {
          statusText = statusText || 'notmodified'
        }
        if (isSuccess) {
          resText = body
          next()
        } else {
          var e
          statusText = statusText || 'error'
          try {
            data = b.parseJSON(body)
          } catch (e1) {
            data = {}
          }
          data.responseText = body
          e = new Error(statusText)
          b.extend(true, e, data)
          error_try((e.msg || e.message || statusText), (e.error_id || 'api_error'), e)
        }
        opt = status = statusText = isSuccess = text = data = body = undefined
      })
    })
    req.on('error', function (e) {
      error_try(e.message, 'api_error', e)
    })
    req.end()
    req = undefined
  })
    // 解析JSON数据
  q.push(true, function (next) {
    try {
      resData = b.parseJSON(resText)
      next()
    } catch (e) {
      var er = new Error('parse res data error[JSON error]', e)
      error_try(er.message, 'parse_json_error', er)
      er = undefined
    }
  })
    // 保存数据
  q.push(true, function (next) {
    if (resData.type != 'update') {
        // 如果不需要就跳过
      next()
      return
    }
      // 服务器时间
    resData.session_data.server_time = resData.session_data.server_time || b.time()
      // 本地时间
    resData.session_data.local_time = b.time()
      // 服务器时间减去本地时间
    resData.session_data.difference_time = resData.session_data.server_time - resData.session_data.local_time
      // 到期时间

    if (resData.session_data.expires_time !== undefined && resData.session_data.expires_time !== null) {
      resData.session_data.expires_time += resData.session_data.difference_time
    } else {
      resData.session_data.expires_time = b.time() + (60 * 60 * 24 * 7)
    }
      // 获取会话数据
    this.session_data = resData.session_data

    var session_data = b.toJSON(this.session_data)
    if (session_data && session_data !== this.session_data_old) {
      this.removeCookie(this.cookie_name)
      this.setCookie(this.cookie_name, session_data)
    }
    next()
  })
  q.push(true, function (next) {
    a.callback.run(this, 'api.session.init', 'success')
  })
    // 运行队列
  q.run()
}

// 判断session_card
a.run.session.isCard = function (session_card) {
  return (/^([0-9a-fA-F]){4}-([0-9a-fA-F]){8}-([0-9a-fA-F]){4}-([0-9a-fA-F]){4}-([0-9a-fA-F]){4}-([0-9a-fA-F]){12}-([0-9a-fA-F]){8}$/.test(session_card) || false)
}
a.run.session.createCard = function (user_agent, callback) {
  var session_card
  user_agent = user_agent || b.now()
  session_card = a.md5Hex(user_agent + b.now()).toString().substr(15, 4)
  session_card += '-' + a.get.newRequestId() + '-'
  session_card += a.md5Hex(user_agent).toString().substr(15, 8)
  session_card = session_card.toString()
  session_card = session_card.replace(session_card.substr(13, 6), '-5555-')
  callback = callback && callback(session_card) && undefined
}
// 获取签名初始化信息
a.run.session.getSignInt = function (request_id, session_data, version) {
  var p = {}
  p.request_id = request_id || a.get.guid()
  request_id = undefined
    // 获取会话信息
  p.session_id = session_data.session_id || '0'
  p.session_key = session_data.session_key || 'session_key'
  p.session_card = session_data.session_card
  p.interference = a.get.guid()

    // 授权字符串
  p.auth_string = (version || 'session-init-v1') + '/' + p.request_id + '/' + p.session_id + '/' + p.session_card + '/' + a.tool.gmdate('Y-m-dTH:i:sZ', a.get.timeServer(session_data.difference_time)) + '/' + '1800'
    // 生成加密key
  p.signing_key = a.HmacSHA256(p.auth_string, p.session_key)
  p.auth_string = p.auth_string + '/' + p.interference
  p.session_sign = a.HmacSHA256(p.auth_string, p.signing_key)
  p.auth_string = p.auth_string + '/' + p.session_sign

  delete p.session_id; delete p.session_key
  delete p.session_card; delete p.interference
  delete p.request_id; p = p.auth_string
  return p
}
a.run.session.hostnameen = function (hostname) {
  hostname = a.utf8ToBase64((hostname || 'sid').toString())
  hostname = hostname.replace(/_/g, '____').replace(/\+/g, '___').replace(/\//g, '__').replace(/=/g, '_')
  return hostname
}
// HmacSHA256加密算法
a.HmacSHA256 = function (data, key) {
  return CryptoJS.HmacSHA256(data, key).toString(CryptoJS.enc.Hex)
}
// md5Base64加密算法
a.md5Base64 = function (data) {
  return CryptoJS.MD5(data).toString(CryptoJS.enc.Base64)
}
// md5Base64加密算法
a.md5Hex = function (data) {
  return CryptoJS.MD5(data).toString(CryptoJS.enc.Hex)
}
a.utf8ToBase64 = function (data) {
  return CryptoJS.enc.Utf8.parse(data || '').toString(CryptoJS.enc.Base64)
}
a.tool.isNumeric = function (obj) {
  // parseFloat NaNs numeric-cast false positives (null|true|false|"")
  // ...but misinterprets leading-number strings, particularly hex literals ("0x...")
  // subtraction forces infinities to NaN
  return (!b.type(obj, 'array') && (obj - parseFloat(obj) >= 0))
}

a.tool.urlEncodeExceptSlash = function (value) {
  return a.tool.urlEncode(value, false)
}

var kEscapedMap = {
  '!': '%21',
  '\'': '%27',
  '(': '%28',
  ')': '%29',
  '*': '%2A'
}

a.tool.urlEncode = function (string, encodingSlash) {
  var result = encodeURIComponent(string)
  result = result.replace(/[!'\(\)\*]/g, function ($1) {
    return kEscapedMap[$1]
  })

  if (encodingSlash === false) {
    result = result.replace(/%2F/gi, '/')
  }

  return result
}

a.tool.joinUrl = function (u) {
  var r
  r = u.protocol + '//' + u.host
  switch (u.protocol + u.port) {
    case 'ws80':
    case 'wss443':
    case 'http80':
    case 'https443':
      break
    default:
      r += ':' + u.port
      break
  }
  r += u.relative
  u = undefined
  return r
}
a.get.timeServer = function (difference_time) {
  return a.get.time() + (difference_time || 0)
}
a.get.time = function () {
  return parseInt(((new Date()).getTime()) / 1000)
}

// 和PHP一样的时间戳格式化函数
// GMT/UTC date/time
// @param  {string} format    格式
// @param  {int}    timestamp 要格式化的时间 默认为当前时间
// @return {string}           格式化的时间字符串
a.tool.gmdate = function (format, timestamp) {
  timestamp = (timestamp === undefined || timestamp === null || timestamp === '') ? a.get.time() : timestamp
  timestamp = parseInt(timestamp) + (60 * (new Date()).getTimezoneOffset())
  return a.tool.date(format, timestamp)
}

// 和PHP一样的时间戳格式化函数
// @param  {string} format    格式
// @param  {int}    timestamp 要格式化的时间 默认为当前时间
// @return {string}           格式化的时间字符串
a.tool.date = function (format, timestamp) {
  var a, jsdate = ((timestamp) ? new Date(timestamp * 1000) : new Date())
  var pad = function (n, c) {
    if ((n = n + '').length < c) {
      return new Array(++c - n.length).join('0') + n
    } else {
      return n
    }
  }
  var txt_weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  var txt_ordin = {1: 'st', 2: 'nd', 3: 'rd', 21: 'st', 22: 'nd', 23: 'rd', 31: 'st'}

  var txt_months = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

  var f = {
    // Day
    d: function () {
      return pad(f.j(), 2)
    },
    D: function () {
      t = f.l(); return t.substr(0, 3)
    },
    j: function () {
      return jsdate.getDate()
    },
    l: function () {
      return txt_weekdays[f.w()]
    },
    N: function () {
      return f.w() + 1
    },
    S: function () {
      return txt_ordin[f.j()] ? txt_ordin[f.j()] : 'th'
    },
    w: function () {
      return jsdate.getDay()
    },
    z: function () {
      return (jsdate - new Date(jsdate.getFullYear() + '/1/1')) / 864e5 >> 0
    },

    // Week
    W: function () {
      var a = f.z(), b = 364 + f.L() - a
      var nd2, nd = (new Date(jsdate.getFullYear() + '/1/1').getDay() || 7) - 1

      if (b <= 2 && ((jsdate.getDay() || 7) - 1) <= 2 - b) {
        return 1
      } else {
        if (a <= 2 && nd >= 4 && a >= (6 - nd)) {
          nd2 = new Date(jsdate.getFullYear() - 1 + '/12/31')
          return date('W', Math.round(nd2.getTime() / 1000))
        } else {
          return (1 + (nd <= 3 ? ((a + nd) / 7) : (a - (7 - nd)) / 7) >> 0)
        }
      }
    },

    // Month
    F: function () {
      return txt_months[f.n()]
    },
    m: function () {
      return pad(f.n(), 2)
    },
    M: function () {
      t = f.F(); return t.substr(0, 3)
    },
    n: function () {
      return jsdate.getMonth() + 1
    },
    t: function () {
      var n
      if ((n = jsdate.getMonth() + 1) == 2) {
        return 28 + f.L()
      } else {
        if (n & 1 && n < 8 || !(n & 1) && n > 7) {
          return 31
        } else {
          return 30
        }
      }
    },

    // Year
    L: function () {
      var y = f.Y()
      return (!(y & 3) && (y % 1e2 || !(y % 4e2))) ? 1 : 0
    },
    // o not supported yet
    Y: function () {
      return jsdate.getFullYear()
    },
    y: function () {
      return (jsdate.getFullYear() + '').slice(2)
    },

    // Time
    a: function () {
      return jsdate.getHours() > 11 ? 'pm' : 'am'
    },
    A: function () {
      return f.a().toUpperCase()
    },
    B: function () {
      // peter paul koch:
      var off = (jsdate.getTimezoneOffset() + 60) * 60
      var theSeconds = (jsdate.getHours() * 3600) +
      (jsdate.getMinutes() * 60) +
      jsdate.getSeconds() + off
      var beat = Math.floor(theSeconds / 86.4)
      if (beat > 1000) beat -= 1000
      if (beat < 0) beat += 1000
      if ((String(beat)).length == 1) beat = '00' + beat
      if ((String(beat)).length == 2) beat = '0' + beat
      return beat
    },
    g: function () {
      return jsdate.getHours() % 12 || 12
    },
    G: function () {
      return jsdate.getHours()
    },
    h: function () {
      return pad(f.g(), 2)
    },
    H: function () {
      return pad(jsdate.getHours(), 2)
    },
    i: function () {
      return pad(jsdate.getMinutes(), 2)
    },
    s: function () {
      return pad(jsdate.getSeconds(), 2)
    },
    // u not supported yet

    // Timezone
    // e not supported yet
    // I not supported yet
    O: function () {
      var t = pad(Math.abs(jsdate.getTimezoneOffset() / 60 * 100), 4)
      if (jsdate.getTimezoneOffset() > 0) t = '-' + t; else t = '+' + t
      return t
    },
    P: function () {
      var O = f.O()
      return (O.substr(0, 3) + ':' + O.substr(3, 2))
    },
    // T not supported yet
    // Z not supported yet

    // Full Date/Time
    c: function () {
      return f.Y() + '-' + f.m() + '-' + f.d() + 'T' + f.h() + ':' + f.i() + ':' + f.s() + f.P()
    },
    // r not supported yet
    U: function () {
      return Math.round(jsdate.getTime() / 1000)
    }
  }

  return format.replace(/[\\]?([a-zA-Z])/g, function (t, s) {
    var ret
    if (t != s) {
      // escaped
      ret = s
    } else if (f[s]) {
      // a date function exists
      ret = f[s]()
    } else {
      // nothing special
      ret = s
    }
    return ret
  })
}

// 回调系统模块初始化
a.callback = b.inherit(null)
// 加入回调
a.callback.add = function (_this, do_type, event_type, callback) {
  var _this_type
  _this_type = typeof _this || ''
  if ((!_this) || (!(_this_type == 'object' || _this_type == 'function'))) {
    return
  }
  do_type = do_type
  do_type = 'callback_' + do_type
  _this.__sys__ = _this.__sys__ || {}
  _this.__sys__[do_type] = _this.__sys__[do_type] || {}
  _this.__sys__[do_type][event_type] = _this.__sys__[do_type][event_type] || []
  if (b.type(callback, 'function')) {
    _this.__sys__[do_type][event_type].push(callback)
  }
  _this = undefined
  _this_type = undefined
  do_type = undefined
  event_type = undefined
  callback = undefined
}
// 执行回调
a.callback.run = function (_this, do_type, event_type, args) {
  var _this_type
  _this_type = typeof _this || ''
  if ((!_this) || (!(_this_type == 'object' || _this_type == 'function'))) {
    return
  }
  do_type = do_type
  do_type = 'callback_' + do_type
  _this.__sys__ = _this.__sys__ || {}
  _this.__sys__[do_type] = _this.__sys__[do_type] || {}
  _this.__sys__[do_type][event_type] = _this.__sys__[do_type][event_type] || []

  while (_this.__sys__[do_type][event_type].length > 0) {
    if (_this.__sys__[do_type][event_type][0] !== undefined) {
      if (b.type(_this.__sys__[do_type][event_type][0], 'function')) {
        _this.__sys__[do_type][event_type][0].apply(_this, (args || []))
      }
      _this.__sys__[do_type][event_type].splice(0, 1)
    }
  }
  _this.__sys__[do_type] = {}

  _this = undefined
  _this_type = undefined
  do_type = undefined
  event_type = undefined
  args = undefined
}
// 获取进程pid
a.get.newPid = function () {
  var info, r
  info = processPidInfo
  if (info.lasttime !== b.time()) {
    info.lasttime = b.time()
    info.lastpid = 0
  }
  r = info.lasttime.toString() + (++info.lastpid).toString()
  info = undefined
  return r
}
// 生成请求id
a.get.newRequestId = function () {
  var pid, t, rid, rid_len, rid_t, rid_new, i
    // 获取16进制的 pid
  pid = Number(a.get.newPid()).toString(16)
    // 种子
  rid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
  rid_new = ''
  for (i = rid.length - 1; i >= 0; i--) {
    rid_t = rid[i]
    if (rid_t == 'x') {
      rid_len = pid.length
      rid_t = pid ? pid.charAt(rid_len - 1) : 'x'
      pid = pid.substr(0, rid_len - 1)
    }
    rid_new = rid_t + rid_new
  }
  rid = a.get.guid(rid_new)
  i = rid_new = rid_t = rid_len = t = pid = undefined
  return rid
}
// 生成guid
a.get.guid = function (s) {
  return (s || 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx').replace(/[xy]/g, function (c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

module.exports = a
