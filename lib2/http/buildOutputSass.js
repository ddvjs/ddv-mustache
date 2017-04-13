'use strict';
//文件操作系统
const fs = require('fs');
//路径模块
const path = require('path');
//模块
module.exports = function buildOutputSass(req, res, next) {
	if (req.buildInputFilePath||req.project.dirType!=='styles') {
		next();
		return ;
	}
	let file_path = path.join(req.project.rootdir, req.project.path);
	fs.stat( file_path, (e, stat)=>{
		if(e) {
			//异常-没有找到目标文件，编译管道下行
			next();
		} else {
			if(stat.isFile()) {
				//确实是文件，传递编译地址
				req.buildInputFilePath = file_path ;
				next();
			} else {
				//不是文件-没有找到目标文件，编译管道下行
				next();
			}
		}
		file_path = e = stat = req = res = void 0 ;
	});
};
