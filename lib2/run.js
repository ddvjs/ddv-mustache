/** vim: et:ts=4:sw=4:sts=4
* see: https://github.com/chengjiabao/ddv for details
*/
'use strict'
// 定义进程标题
process.title = 'ddvAppConn'
// cjb_base模块
const b = require('cjb-base')
// cjb_base模块
const path = require('path')
// jsnet模块-子线程模块
const worker = require('ddv-worker')
// http模块
const http = require('http')
// domain模块
const domain = require('domain')

worker.on('socket::error', function (e) {
  console.error('socket错误开始')
  console.error(e)
  console.error('socket错误结束')
  console.error(Error().stack)
})
worker.on('server::error', function (e) {
  console.error('服务器内部错误开始')
  console.error(e)
  console.error('服务器内部错误结束')
  console.error(Error().stack)
})

worker._siteConfig = worker._siteConfig || Object.create(null)
worker.defineGetter(worker, 'siteConfig', function () {
  return worker._siteConfig
})
worker.defineSetter(worker, 'siteConfig', function (siteConfig) {
  // 站点配置
  b.extend(true, worker._siteConfig, siteConfig)
  // 调试模式
  worker.DEBUG = worker._siteConfig && worker._siteConfig.debug || worker.debug
})
worker.defineGetter(worker, 'siteRootPath', function () {
  return (worker.siteConfig && worker.siteConfig.path || null)
})
worker.defineSetter(worker, 'siteRootPath', function (value) {
  worker.siteConfig.path = value
})
worker.defineGetter(worker, 'appRootPath', function () {
  if (worker.siteRootPath) {
    return path.join(worker.siteRootPath || '', (worker.siteConfig.appDir || '/'))
  } else {
    return null
  }
})
worker.defineSetter(worker, 'appRootPath', function () {
  throw new Error('AppRootPath does not support overriding')
})
worker._start = function (siteConfig) {
  worker.siteConfig = siteConfig = siteConfig || Object.create(null)
  // 站点配置
  worker.debug = worker.siteConfig.debug

  // http
  require('./http')(worker)

  worker.updateServerConf({
    defaultListen: worker.siteConfig.defaultListen,
    listen: worker.siteConfig.listen,
    cpuLen: worker.siteConfig.cpuLen
  }, (e) => {
    if (e) {
      console.error('监听配置 更新失败')
    } else {
      console.log('监听配置 更新了')
    }
    e = void 0
  })
}

  // 建立监听作用域
  // 创建httpServer - 也就是创建http服务 传入回调
worker.server = http.createServer()

worker.server.ConnectionHttp = class ConnectionHttp extends domain.Domain {
    // 构造函数
  constructor (request, response) {
      // 调用父类构造函数
    super()
      // 请求操作指针
    this.request = request
      // 响应操作指针
    this.response = response
      // 删除引用
    request = response = void 0
    this.run(() => {
        // 初始化
      this.__init()
    })
  }
  __init () {
    if (this._sys && this._sys.inited) {
      return
    }
      // 添加异常监听对象
    this.add(this.request)
    this.add(this.response)

      // 系统内部变量
    this._sys = this._sys || Object.create(null)
      // 已经初始化
    this._sys.inited = true
      // 队列
    this._sys.queue = b.queue().setThis(this)
      // 添加参数
    this._sys.queue.addParams(this.request, this.response)
      // 还没有结束
    this.notClosed = true
      // 调试模式
    this.request.DEBUG = worker.DEBUG
      // id
    this.request.id = b.createNewPid()
      // 开始时间
    this.request.addTime = b.time()
      // 路由信息
    this.request.router = Object.create(null)
      // 全局连接id
    this.request.gwcid = worker.serverGuid + '-' + worker.id + '-' + this.request.id.toString() + '-' + worker.gwcidTimeStamp
      // 销毁方法
    this.destroy = worker.server.connectionHttpDestroy.bind(this)
      // 组合基本信息
    if (this.request.socket && b.type(this.request.socket.info, 'object')) {
      this.request.type = this.request.socket.info.type
      this.request.host = this.request.socket.info.host
      this.request.port = this.request.socket.info.port
      this.request.ipaddress = this.request.socket.info.ipaddress
      this.request.remoteAddress = this.request.socket.info.remoteAddress
      this.request.remoteFamily = this.request.socket.info.remoteFamily
      this.request.remotePort = this.request.socket.info.remotePort
      this.request.typePortIp = this.request.socket.info.typePortIp
    }
      // 用户访问协议 - http | https
    this.request.router.protocol = (this.request.type === 'ssl' ? 'https:' : 'http:')

    if (this.request.socket.info && this.request.socket.info.protocol) {
      this.request.socket.info.protocol = this.request.router.protocol
    }

    this.on('httpSum::remove', function httpSumRemove () {
      if (this.isHttpSumRemove === false) {
        worker.httpSum--
        delete this.isHttpSumRemove
      }
    })
    this.on('httpSum::add', function httpSumAdd () {
      this.isHttpSumRemove = false
      worker.httpSum++
    })
    this.emit('httpSum::add')
    this.on('error', function httpSumRemove () {
      this.emit('httpSum::remove')
    })

      // this.socket.on('error::socket', function _onRequestClose(){
      //  this.emit('error',arguments);
      // }.bind(this));
    this.request.on('aborted', function _onRequestAborted () {
      this.emit('httpSum::remove')
      this.emit('request::aborted')
    }.bind(this))
      // 请求关闭
    this.request.on('close', function _onRequestClose () {
      this.emit('httpSum::remove')
      this.emit('request::close')
      if (delete this.notClosed) { delete this.notClosed }
    }.bind(this))
      // 请求结束
    this.request.on('end', function _onRequestEnd () {
      this.emit('httpSum::remove')
      this.emit('request::end')
      if (delete this.notClosed) { delete this.notClosed }
    }.bind(this))
    this.request.on('error', function _onRequestError () {
      this.emit('error', arguments)
      if (delete this.notClosed) { delete this.notClosed }
    }.bind(this))
    this.response.on('error', function _onRequestError () {
      this.emit('error', arguments)
      if (delete this.notClosed) { delete this.notClosed }
    }.bind(this))
    this.response.on('response::close', function _onRequestClose () {
      this.emit('httpSum::remove')
      this.emit('close')
    }.bind(this))
      // 连接
    worker.emit('connection::http', this)
      // 放到进程末尾运行conn:run
      // 特殊原因，必须等待下一进程队列，
      // 等待当前所有的process.nextTick运行完成，
      // 避免不同用户之间冲突
    setTimeout(() => {
      if (this._sys && this._sys.queue) {
          // 运行队列
        this._sys.queue.run()
      }
    }, 0)
  }
  use (fn) {
    if (this._sys && this._sys.queue) {
      this._sys.queue.push.call(this._sys.queue, true, fn)
    }
    fn = void 0
    return this
  }
  }
worker.server.connectionHttpDestroyRun = function connectionHttpDestroyRun () {
  var key
  for (key in this) {
    if (!this.hasOwnProperty(key)) continue
    delete this[key]
  }
  key = undefined
}
worker.server.connectionHttpDestroy = function connectionHttpDestroy () {
  process.nextTick(function serverConnectionHttpNextTick () {
    worker.server.connectionHttpDestroyRun.call(this)
  }.bind(this))
}

  // 新的请求
worker.server.on('request', (request, response) => {
  new worker.server.ConnectionHttp(request, response)
})
  // 客户端错误
worker.server.on('clientError', function (e) {
  worker.server.emit('error', e)
})
worker.server.on('connection', function serverHttpTimeout (socket) {
  socket.on('socketSum::remove', function socketSumRemove () {
    if (this.isSocketNotEnd === true) {
      worker.socketSum--
      delete this.isSocketNotEnd
    }
  })
  socket.on('socketSum::add', function socketSumAdd () {
    worker.socketSum++
  })
  socket.on('connect', function onConnect () {
    this.emit('socketSum::add')
  })
    // 结束
  socket.on('end', function onEnd () {
    this.emit('socketSum::remove')
  })
    // 结束
  socket.on('error', function onError (e) {
      // 客户端socket重置 忽略这一错误
    if (e.message == 'read ECONNRESET' && e.name === 'Error') {
      this.emit('socketSum::remove')
      try { this.end() } catch (e1) {}
      try { this.destroy() } catch (e1) {}
      return false
    } else {
      var args = b.argsToArray(arguments)
      args.unshift('error::socket')
      this.emit.apply(this, args)
      args = undefined
    }
  })
    // 长连接超时
  socket.on('timeout', function serverHttpTimeout () {
    if (this && this.info && this.info.protocol) {
      if (['http:', 'https:'].indexOf(this.info.protocol) > -1) {
        this.emit('socketSum::remove')
        if (this && this.end && b.is.function(this.end)) {
          try { this.end() } catch (e) {}
        }
      }
    }
  })
  socket = undefined
})
  //
  // 设定超时-自定义处理超时
worker.server.setTimeout(worker.socketTimeout, function serverHttpTimeout () {})

  // 异常捕获事件绑定
worker.server.on('error', function (e) {
    // 客户端socket重置 忽略这一错误
  if (e.message == 'read ECONNRESET' && e.name === 'Error') {
    return false
  } else {
    worker.emit('server::error', e)
  }
  e = undefined
})

module.exports = {
  start: function (siteConfig) {
    worker._start(siteConfig)
    siteConfig = void 0
  }

}
