'use strict';
//路径模块
const path = require('path');
//cjb_base模块
const b = require('cjb-base') ;
//requirejs
const requirejs = require('requirejs');
//模块
module.exports = function projectConfig(req, res, next){
	//判断是否为项目
	if (!(req.project&&req.project.state===true)) {
		//非项目，直接下一中间件
		next();
		return;
	}
	//配置信息
	req.appConfig = req.appConfig || Object.create(null);

	let end = (filepath)=>{
		if (req.DEBUG&&filepath) {
			requirejs.undef( filepath );
		}
		//直接下一个中间件
		next();
		req = res = next = end = filepath = void 0;
	};

	if (req.project&&req.project.pathinfo&&req.project.pathinfo.config) {
		//获取路径
		let filepath = path.join(req.appRootPath, req.project.pathinfo.config, 'config.js');
		//试图引入私有的
		requirejs([ filepath ],(config)=>{
			//合并配置信息
			b.extend(true, req.appConfig, (config||Object.create(null)));
			//结束
			return end&&end( filepath );
		}, ()=>{
			//结束
			return end&&end( filepath );
		});
	}else{
		//结束
		return end&&end();
	}
};
