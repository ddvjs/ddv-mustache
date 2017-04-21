'use strict'
const spawn = require('cross-spawn')
const logger = require('../build/logger.js')
const packageJson = require('../package.json')
const version = (packageJson && packageJson.devDependencies && packageJson.devDependencies['ddv-mustache-webpack-dev']) || ''
const ddvMustacheWebpackDevVersion = version ? ('ddv-mustache-webpack-dev@' + version) : 'ddv-mustache-webpack-dev'
module.exports = ddvMustacheWebpackDev
function ddvMustacheWebpackDev (isAuto = true) {
  return new Promise((resolve, reject) => {
    try {
      resolve(require.resolve('ddv-mustache-webpack-dev'))
    } catch (err) {
      reject(err)
    }
  })
  .catch(e => isAuto ? ddvMustacheWebpackDevAutoInstall() : Promise.reject(e))
}
function ddvMustacheWebpackDevAutoInstall () {
  logger.log('auto install module ddv-mustache-webpack-dev')
  return checkHasDdvMustacheWebpackDev()
  .then(() => {
    return Promise.reject(new Error('Please check whether ddv-mustache-webpack-dev is normal'))
  }, e => ddvMustacheWebpackDevInstall())
  .then(() => {
    logger.log('install module success ddv-mustache-webpack-dev')
    return ddvMustacheWebpackDev(false)
  })
}
function ddvMustacheWebpackDevInstall () {
  logger.log('install module ddv-mustache-webpack-dev')
  return new Promise((resolve, reject) => {
    var ls = spawn('npm', ['--save-dev', 'install', ddvMustacheWebpackDevVersion], {
      cwd: process.cwd(),
      stdio: ['pipe', 'inherit', 'inherit']
    })
    ls.on('close', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error('Please allow the command to install dependent packages: npm -D i ' + ddvMustacheWebpackDevVersion))
      }
    })
  })
}
function checkHasDdvMustacheWebpackDev () {
  logger.log('check has install module ddv-mustache-webpack-dev')
  return new Promise((resolve, reject) => {
    var ls = spawn('npm', ['ls', ddvMustacheWebpackDevVersion], {
      cwd: process.cwd(),
      stdio: ['pipe', 'inherit', 'inherit']
    })
    ls.on('close', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error('Cannot find module: ddv-mustache-webpack-dev '))
      }
    })
  })
}
