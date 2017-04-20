'use strict'
const load = require('../load')
// 文件
module.exports = renderController
function renderController (req, res, next) {
  if ((!this) || (!req.project) || req.project.isHotLoad || req.project.isDdvStatic) {
    next()
    return
  }
  load.controller()
  .then(res => console.log('renderController', res))
  .catch(e => console.log('renderController-e', e))
}
