'use strict'
module.exports = Object.assign(render, {
  renderQueueRun
})

function render (req, res, next) {
  if (!Array.isArray(this.renderQueue)) {
    this.renderQueue = []
  }
  this.renderQueue.push([req, res, next])
  this.renderQueueRun && this.renderQueueRun()
}
function renderQueueRun () {
  console.log('请渲染')
}
