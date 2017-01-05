'use strict';
//文件操作系统
const fs = require('fs');
//路径模块
const path = require('path');
//模块
module.exports = function buildOutputOther(req, res, next) {
	if (req.buildInputFilePath) {
		next();
		return ;
	}
	switch(req.project.dirType||'other'){
		case 'cache':
		//case 'config':
		//case 'controllers':
		//case 'core':
		case 'sass':/* 禁止直接输出sass文件 */
			next();
		return;
	}
	let file_path;
	if (req.project&&req.project.state===true) {
		file_path = path.join(req.project.rootdir, req.project.path||'/');
	}else{
		next();
	}
	fs.stat( file_path, (e, stat)=>{
		if(e) {
			//异常-没有找到目标文件，编译管道传递下一步
			next();
		} else {
			if(stat.isFile()) {
				//确实是文件，传递编译地址
				req.buildInputFilePath = file_path ;
				next();
			} else {
				//不是文件-没有找到目标文件，编译管道传递下一步
				next();
			}
		}
		file_path = e = stat = req = res = void 0 ;
	});
};
