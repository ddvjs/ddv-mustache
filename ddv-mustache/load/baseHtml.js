'use strict'
// 路径模块
const util = require('./util.js')
module.exports = loadBaseHtml
loadBaseHtml.dev = false
function loadBaseHtml (file) {
  if (loadBaseHtml.dev !== true && loadBaseHtml.baseHtmlCache[file]) {
    return Promise.resolve(loadBaseHtml.baseHtmlCache[file])
  } else {
    return util.readFile(file)
    .then(html => {
      if (loadBaseHtml.dev === true) {
        loadBaseHtml.baseHtmlCache[file] = html
      }
      return html
    })
  }
}
// 加载
loadBaseHtml.baseHtmlCache = Object.create(null)
