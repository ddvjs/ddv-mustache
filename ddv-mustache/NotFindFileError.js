'use strict'

class NotFindFileError extends Error {
    // 构造函数
  constructor (message, stack, name, type) {
      // 调用父类构造函数
    super(message)
    this.code = 404 || this.code || 404
    this.name = name || this.name || 'Error'
    this.type = type || this.type || 'NotFindFileError'
    this.stack += stack ? ('\n' + stack) : ''
    message = stack = void 0
  }
}
module.exports = NotFindFileError
