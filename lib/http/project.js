'use strict';
//基本工具
const b = require('cjb-base') ;
//文件操作系统
const fs = require('fs');
//路径模块
const path = require('path');

const ddvStaticPath = '/ddvstatic/';
const ddvStaticPathLen = ddvStaticPath.length;
const hotLoadPath = '/ddvstatic/js/sys/hotLoad';
const hotLoadPathLen = hotLoadPath.length;

module.exports = function project(req, res, next) {
	//路由
	req.project = req.project || Object.create(null);
	//文件路径
	req.project.file = req.project.file || Object.create(null);
	//文件路径
	req.project.pathinfo = req.project.pathinfo || Object.create(null);

	let [file, pathinfo] = [req.project.file, req.project.pathinfo];
	let [q, pathI, pathArray]=[b.queue(), -1, []];
	//以 / 来拆分 path 为一个数组
	pathArray = req.router.path.length>0?(req.router.path||'/').split('/'):[];
	//删除空目录
	pathArray = b.array.remove('', pathArray) ;

	q.end(function(state, res){
		req.project.state = state ;
		file = pathinfo = q = pathI = pathArray = req = res = void 0;
		next();
		next = void 0;
	})
	//组合配置信息
	.push(function joinConfigDir(next){
		//当前path的指针位置
		pathI++ ;
		if ((!pathArray)||pathI>pathArray.length) {
			//没有找到项目，直接结束
			throw new Error('not find project');
		}
		//path,子项目路径，相对站点根目录的相对路径
		pathinfo.base = b.formatUrl('/'+(pathArray.slice(0,pathI).join('/')));
		//app子项目，绝对路径
		req.project.rootdir = path.join(req.appRootPath, pathinfo.base);
		//路由文件
		req.project.file.router =  path.join(req.project.rootdir, 'config/router.js');
		next();
	}, true, function checkConfigDir(next){
		//判断文件存在
		fs.exists( req.project.file.router, function existsCb(is_exists) {
			//存储路由文件
			if (is_exists) {
				next();
			}else{
				//没有这个路由文件，回去重找
				next('joinConfigDir');
			}
		});
	}, true, function mergeControllersPath(next){
	//提取控制器路径
		if (pathArray.length>pathI) {
			req.project.path = '/' + pathArray.slice(pathI).join('/')  ;
			req.project.dirType = pathArray[pathI]||'' ;
		}else{
			req.project.path = '/'  ;
			req.project.dirType = '' ;
		}
		req.project.isHotLoad = false ;
		req.project.isDdvStatic = false ;
		req.project.hotPath = null ;
		req.project.ddvStaticPath = null ;
		if (req.project.path=='/ddvstatic/js/sys/hotLoad.js') {
			req.project.isHotLoad = true ;
			req.project.hotPath = req.router.query ||'/' ;
		}else if(req.project.path.substr(0,hotLoadPathLen)===hotLoadPath){
			req.project.isHotLoad = true ;
			req.project.hotPath = req.project.path.substr(hotLoadPathLen);
		}else if(req.project.path.substr(0,ddvStaticPathLen)===ddvStaticPath){
			req.project.isDdvStatic = true ;
			req.project.ddvStaticPath = req.project.path.substr(ddvStaticPathLen-1);
		}
		next();
	}, true, function mergeProjectPath(next, resolve){
		//遍历拼接路径
		b.each('cache config controllers core images libraries logs models styles views'.split(' '), function(i,dir_name){
			pathinfo[dir_name] =  b.formatUrl( pathinfo.base + '/' + dir_name ) ;
		});
		pathinfo.url = pathinfo.base+'/';
		resolve();
	}).run();
};
