'use strict'
const load = require('../load')
module.exports = render
function render (req, res, next) {
  next()
  console.log('load',load.controller())
  return
  console.log('呵呵', req.url, req.path)
  res.end('ssss')
}
