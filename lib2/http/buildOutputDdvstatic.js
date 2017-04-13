'use strict';
//文件操作系统
const fs = require('fs');
//路径模块
const path = require('path');
//ddv静态库
const ddvstaticDir = path.resolve(__dirname,'../ddvstatic');

const ddvStaticPath = '/ddvstatic/';
const ddvStaticPathLen = ddvStaticPath.length;
const hotLoadPath = '/ddvstatic/js/sys/hotLoad';
const hotLoadPathLen = hotLoadPath.length;
//模块
module.exports = function buildOutputControllers(req, res, next, __resolve, reject){
	if (!(req.project&&req.project.state===true&&req.project.pathinfo)) {
		next();
		return;
	}
	if (!req.project.isDdvStatic) {
		next();
		return;
	}
	let filePath = path.join(ddvstaticDir, req.project.ddvStaticPath);
	if(['/js/sys/cjb-base.js','/js/sys/cjb-base.js.map','/js/sys/cjb-base.source.js'].indexOf(req.project.ddvStaticPath)>-1){
		try{
			let t = require.resolve('cjb-base/lib'+req.project.ddvStaticPath.substr('/js/sys'.length));
			filePath = t ;
			t = void 0 ;
		}catch(e){}
	}
	fs.stat( filePath, function statCb(e, stat) {
		if(!e) {
			if(stat.isFile()) {
				//确实是文件，传递编译地址
				req.buildInputFilePath = filePath ;
				next();
			} else {
				//路径既不是文件也不是文件夹
				reject(new Error('Not a valid file'));
			}
		//没有这个文件或者文件夹
		}else if(e.code == 'ENOENT') {
			next();
		} else {
			reject(e);
		}
	});
};
