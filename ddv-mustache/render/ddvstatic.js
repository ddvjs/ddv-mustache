'use strict'
// 文件
module.exports = renderDdvstatic
function renderDdvstatic (req, res, next) {
  if (!(this && req.project && req.project.isDdvStatic)) {
    next()
    return
  }
  // 记录原来的地址 false
  var urlSource = false
  // 如果有项目地址就替换
  if (req.project && req.project && req.project.ddvStaticPath) {
    // 记录原来的地址
    urlSource = req.url
    req.url = req.project.ddvStaticPath
    if (req.project.router && req.project.router.query) {
      req.url += '?' + req.project.router.query
    }
  }
  this.renderDdvstaticMiddleware(req, res, () => {
    if ((!urlSource) && urlSource !== false) {
      return
    }
    if (urlSource) {
      req.url = urlSource
      urlSource = void 0
    }
    next()
  })
}
