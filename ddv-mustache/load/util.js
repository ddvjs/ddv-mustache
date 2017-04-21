'use strict'
// 文件操作系统
const fs = require('fs')
const url = require('./url.js')
// 引入模块
const requirejsLib = require('requirejs')
const util = module.exports = {
  url,
  requirejs,
  isFile,
  readFile,
  toUrl,
  parseUrl,
  clone
}
function isFile (path) {
  return new Promise((resolve, reject) => {
    fs.stat(path, (e, stats) => {
      if ((!e) && stats && stats.isFile && stats.isFile()) {
        resolve()
      } else {
        reject(new Error('Not Directory or File'))
      }
    })
  })
}
function readFile (path) {
  return new Promise((resolve, reject) => {
    fs.readFile(path, 'utf-8', (err, html) => {
      err ? reject(err) : resolve(html)
    })
  })
}

function toUrl (obj) {
  var r = ''
  r += obj.protocol || 'http:'
  r += '//' + (obj.hostname || '')
  r += obj.port ? (((obj.protocol === 'http:' && obj.port === '80') || (obj.protocol === 'https:' && obj.port === '443')) ? '' : (':' + obj.port)) : ''
  obj.pathquery = obj.pathquery || (obj.path || '/') + (obj.query ? ('?' + obj.query) : '')
  r += obj.pathquery
  return r
}
function parseUrl (url, hostname, port) {
  let info = util.url('{}', url)
  info.hostname = info.hostname || hostname
  info.origin = info.protocol + '//' + info.hostname
  info.port = port || info.port
  if (!info.pathquery) {
    info.pathquery = info.path + (info.query ? ('?' + info.query) : '')
  }
  return info
}

function requirejs (routerFile) {
  return new Promise((resolve, reject) => {
    requirejsLib([routerFile], router => {
      resolve(router)
    }, e => {
      reject(e)
    })
  })
}
requirejs.undef = requirejsLib.undef
requirejs.define = requirejsLib.define
// 克隆对象
function clone (obj) {
  var newobj
  if (Array.isArray(obj)) {
    newobj = []
    obj.forEach(t => {
      newobj.push(clone(t))
    })
  } else if (typeof obj === 'object' && typeof obj !== 'function') {
    // eslint-disable-next-line no-proto
    newobj = Object.create(obj.__proto__ || null)
    var key
    for (key in obj) {
      newobj[key] = clone(obj[key])
    }
  } else {
    newobj = obj
  }
  return newobj
}
