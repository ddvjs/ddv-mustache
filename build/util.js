'use strict'

var fs = require('fs')
module.exports = {
  isFunction,
  isString,
  isNumber,
  isArray,
  isGlobal,
  isWindow,
  isPlainObject,
  isEmptyObject,
  middlelineToUpperCase,
  writeTextFile
}

// 写文本文件
function writeTextFile (path, text) {
  return new Promise(function (resolve, reject) {
    fs.writeFile(path, text, function (err) {
      err ? reject(err) : resolve()
      path = text = resolve = reject = void 0
    })
  })
}
// 中杠转驼峰
function middlelineToUpperCase (str) {
  return str.toString().replace(/(-[a-zA-Z0-9]{1})/g, function (a) { return (a.substr(1) || '').toUpperCase() })
}
// 判断是否为数组
function isArray () {
  return Array.isArray.apply(this, arguments)
}
// 判断是否为数字
function isNumber (obj) {
  return (typeof obj === 'string' || typeof obj === 'number') && (!isArray(obj) && (obj - parseFloat(obj) >= 0))
}
function isString (str) {
  return typeof str === typeof ''
}
function isFunction (fn) {
  return typeof fn === 'function'
}

// 判断是否一个标准的global
function isGlobal (obj) {
  return obj !== void 0 && obj === obj.global
}
// 判断是否一个标准的global
function isWindow (obj) {
  return obj !== void 0 && obj === obj.window
}

function isPlainObject (obj) {
  // Not plain objects:
  // - Any object or value whose internal [[Class]] property is not "[object Object]"
  // - DOM nodes
  // - window
  if ((typeof obj !== 'object') || obj.nodeType || isGlobal(obj) || isWindow(obj)) {
    return false
  }

  if (obj.constructor && !Object.hasOwnProperty.call(obj.constructor.prototype, 'isPrototypeOf')) {
    return false
  }

  // If the function hasn't returned already, we're confident that
  // |obj| is a plain object, created by {} or constructed with new Object
  return true
}
function isEmptyObject (obj) {
  var name
  for (name in obj) {
    return false
  }
  return true
}
