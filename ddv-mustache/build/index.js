'use strict'
module.exports = function buildExports () {
  return new Promise((resolve, reject) => {
    this.dev && resolve()
    build.call(this).then(() => {
      this.dev || resolve.apply(this, arguments)
      this.renderQueueRun()
    }, (e) => {
      this.dev || reject.apply(this, arguments)
      this.renderQueueRun()
    })
  })
}
function build () {
  console.log('build', this)
}
