'use strict'
const _ = require('lodash')
const build = require('./build')
const generate = require('./generate')
const renderInit = require('./render')
const path = require('path')

class DdvMustache {
  constructor (options = {}) {
    var defaults = {
      dev: true,
      performance: {
        gzip: {
          threshold: 0
        },
        prefetch: true
      }
    }
    this.options = _.defaultsDeep(options, defaults)
    // Env variables
    this.dev = this.options.dev
    // 根目录
    this.dir = (typeof options.rootDir === 'string' && options.rootDir ? options.rootDir : process.cwd())
    // 编译根目录
    this.buildDir = path.resolve(this.dir, '.ddvMustacheBuild')
    // 应用程序根目录
    this.appDir = path.join(this.dir, (options.appDir || 'app'))
    // 导出生成方法
    this.generate = generate.bind(this)
    // 初始化渲染
    renderInit.call(this)
    // 导出编译方法
    this.build = build.bind(this)
    // 关闭方法
    this.close = close.bind(this)
    // 返回实例化函数
    return this
  }
}
// 导出 DdvMustache 类
module.exports = DdvMustache
// 关闭
function close (callback) {
  console.log('释放')
}
