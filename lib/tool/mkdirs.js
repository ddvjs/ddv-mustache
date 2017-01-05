/** vim: et:ts=4:sw=4:sts=4
 * see: https://github.com/chengjiabao/ddv for details
 */
/*jshint node: true */
/*jshint esversion: 6 */
/*global module, process */
//cjb_base模块
const b = require('cjb-base') ;
//路径模块
const path = require('path') ;
//文件操作系统
const fs = require('fs') ;
//创建多层文件夹 异步
const mkdirs = module.exports = function mkdirs(dirpath, mode, callback) {
	callback = callback || function() {};
	fs.exists(dirpath,
		function(exitsmain) {
			if (!exitsmain) {
				//目录不存在
				var pathtmp;
				var pathlist = dirpath.split(path.sep);
				var pathlistlength = pathlist.length;
				var pathlistlengthseed = 0;
				var pathlistnew = [];
					b.each(pathlist,function(index,patht){
						if(patht){
							pathlistnew.push(patht);
						}else if(index===0){
							pathlistnew.push(path.sep);
						}
					});
					pathlist = pathlistnew ;
					pathlistnew = undefined ;

				mkdirs.mkdirAutoNext(mode, pathlist, pathlist.length,
					function(callresult) {
						if (callresult) {
							callback(true);
						}
						else {
							callback(false);
						}
					});

			}
			else {
				callback(true);
			}

		});
};

// 异步文件夹创建 递归方法
mkdirs.mkdirAutoNext = function (mode, pathlist, pathlistlength, callback, pathlistlengthseed, pathtmp) {
	callback = callback || function() {};
	if (pathlistlength > 0) {
		if (!pathlistlengthseed) {
			pathlistlengthseed = 0;
		}
		if (pathlistlengthseed >= pathlistlength) {
			callback(true);
		}else {
			if (pathtmp) {
				pathtmp = path.join(pathtmp, pathlist[pathlistlengthseed]);
			}else {
				pathtmp = pathlist[pathlistlengthseed];
			}
			fs.exists(pathtmp,
				function(exists) {
					if (!exists) {
						fs.mkdir(pathtmp, mode,
							function(isok) {
								if (!isok) {
									mkdirs.mkdirAutoNext(mode, pathlist, pathlistlength,
										function(callresult) {
											callback(callresult);
										},
										pathlistlengthseed + 1, pathtmp);
								}else {
									callback(false);
								}
							});
					}
					else {
						mkdirs.mkdirAutoNext(mode, pathlist, pathlistlength,
							function(callresult) {
								callback(callresult);
							},
							pathlistlengthseed + 1, pathtmp);
					}
				});
		}
	}
	else {
		callback(true);
	}

};