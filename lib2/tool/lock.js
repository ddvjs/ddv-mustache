/** vim: et:ts=4:sw=4:sts=4
 * see: https://github.com/chengjiabao/ddv for details
 */
/*jshint node: true */
/*jshint esversion: 6 */
/*global module, process */
//文件操作系统
const fs = require('fs') ;
//路径模块
const path = require('path') ;
//cjb_base模块
const b = require('cjb-base') ;
//目录锁名字
let lockDirExt = '.ddv.fs.lock';
//文件锁模块
const lock = module.exports = function(filePath, callback) {
	let[dirname, basename] = [path.dirname(filePath), path.basename(filePath)];
	let lockDir = path.join(dirname, basename, lockDirExt);
	callback = typeof(callback)==='function'?callback:function(){};
	let q = b.queue();
	//新建目录
	fs.mkdir(lockDir, function(err) {
		//存在文件夹，代表已经锁定
		if (err){

		}else{
			fs.writeFile(lockDir + '/' + process.pid, function(err) {
				if (err){
					
				}else{

				}
			});
		}

	});
	
};