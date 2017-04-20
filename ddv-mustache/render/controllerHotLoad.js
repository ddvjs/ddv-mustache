'use strict'
// 文件
module.exports = renderControllerHotLoad
function renderControllerHotLoad (req, res, next) {
  if (this && req.project && req.project.isHotLoad) {
    console.log('renderControllerHotLoad')
    next()
  } else {
    next()
  }
}
