'use strict'
module.exports = function buildExports () {
  this.isBuildIng = true
  return new Promise((resolve, reject) => {
    this.dev && resolve()
    build.call(this).then(() => {
      this.dev || resolve.apply(this, arguments)
      // 标记结束
      this.isBuildIng = false
      this.renderQueueRun()
    }, (e) => {
      this.dev || reject.apply(this, arguments)
      this.isBuildIng = false
      this.renderQueueRun()
    })
  })
}
function build () {
  return new Promise((resolve, reject) => {
    console.log('build', this)
    resolve()
  })
}
