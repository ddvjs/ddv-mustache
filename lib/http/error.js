'use strict';
//cjb_base模块
const fs = require('fs');
const path = require('path');
const cjb_base = require('cjb-base');
const b = cjb_base.inherit(cjb_base) ;
const e = b.inherit(null) ;
var serverConf;

e.run = function ErrorRun(err){
	err.code = parseInt(err.code) || 500 ;
	err.message = err.message||'Internal Server Error';
	this.content = err.message;
	this.content += '\n\n'+err.stack;
	try{
		this.response.statusCode = err.code ;
		this.response.setHeader('content-type','text/html;charset=UTF-8');
		this.response.setHeader('content-length',this.content.length);
		this.response.writeHead(this.response.statusCode);
		this.response.write(this.content,'utf-8');
		this.response.end();
	}catch(e){
		console.error('错误输出的时候失败');/*防止客户断开连接后继续有程序运行*/
		console.error(e);/*防止客户断开连接后继续有程序运行*/
	}
	e.saveLog(err, this.app&&this.app.router, (this&&this.request&&this.request.headers&&this.request.headers['user-agent']||''));
};
e.saveLog = function(err, router, userAgent){
	var echo_content = '', br = '\r\n', time, log_file;
		time = '*********[time:'+b.now()+']**********';
		echo_content +=br+ time;
		echo_content +=br+ '== http 有请求错误 ==';
		echo_content +=br+ err.message ;
		if (err.code==404&&router) {
			echo_content +=br+ 'url_source: '+ (router&&router.url_source||'unknow');
			echo_content +=br+ 'path: '+(router&&router.path||'unknow');
			echo_content +=br+ 'userAgent: '+(userAgent||'unknow');
		}
		echo_content +=br+ err.stack ;
		echo_content +=br+ '== 以上错误在以下位置触发 ==';
		echo_content +=br+ Error('echo error line stack').stack ;
		echo_content +=br+ '== 触发位置=END=触发位置 ==';
		echo_content +=br+ time + br;
		userAgent = router = undefined ;
		//写入特定错误文件
		if (serverConf&&err&&err.code&&(log_file = serverConf['log_error_'+err.code])&&serverConf.log_error) {
			log_file = path.resolve(serverConf.log_error,'..')+path.sep + log_file;
			fs.writeFile(log_file, echo_content, {
				mode:"0777",
				encoding:"utf8"
			}, function writeCb(e){
				if (e) {
					console.error(echo_content);
				}
			});
		}else{
			console.error(echo_content);
		}
};

e.run.setServerConf = function(sc){
	serverConf = sc;
	sc = undefined ;
};
module.exports = e.run;
