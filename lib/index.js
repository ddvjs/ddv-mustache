let fs = require('fs');
let MustacheServer = require('ddv-server-mustache-1-0');
let resolve = require('path').resolve;

let rootDir = resolve(process.argv.slice(2)[0] || '.');
let siteConfigFile = resolve(rootDir, 'site.config.js');

let options = {};
if (fs.existsSync(siteConfigFile)) {
  options = require(siteConfigFile);
}

options.debug = options.debug || process.env.NODE_ENV === 'development';

//启动程序
MustacheServer.start(options);
