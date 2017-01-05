/** vim: et:ts=4:sw=4:sts=4
 * see: https://github.com/chengjiabao/ddv for details
 */
/*jshint node: true */
/*jshint esversion: 6 */
/*global module, process */
'use strict';
//文件操作系统
const fs = require('fs');
//路径模块
const path = require('path');
//cjb_base模块
const b = require('cjb-base') ;
//requirejs
const requirejs = require('requirejs');
//apiRESTful
const apiRESTful = require('../apiRESTful.js');

/**
 * 加载数据模型
 * @author: 桦 <yuchonghua@163.com>
 * @DateTime 2016-11-28T11:28:25+0800
 * @param    {string}                 appRootPath     [项目根路径]
 * @param    {string}                 controllersPath [控制器文件路径]
 * @param    {Function}               callback        [回调]
 */
const loadModels = module.exports = function loadModels(req, callback){
	req._controllersModels = Object.create(null);
	let [now, sum, models] = [0, 0, req._controllersModels];
	b.each((req.controller.model||{}), function(key, filepath) {
		sum++;
		let file = path.join(req.project.pathinfo.models, (filepath + '.js')) ;
		let fileRoot = path.join(req.appRootPath, file) ;
		loadModels.getModelForProxy(fileRoot, req.DEBUG, (e, model)=>{
			if (!(callback&&b.type(callback, 'function'))) {
				return;
			}
			if (e) {
				let err = new Error('loadModels Error key:'+key+' path:'+file+'!');
					err.stack += '\n\n' + e.stack;
				callback(err, null);
				models = callback = req = err = void 0;
			}else{

				models[key] = function Model(){};
				//创建的model对象，继承被实例化的app
				models[key].prototype = model ;
				//对象实例化model
				models[key] = new models[key]();
				models[key].processApp = req;

				if ((++now)>=sum) {
					callback(null);
					models = callback = req = void 0;
				}
			}
			model = e = file = fileRoot = key = filepath = void 0;
		});
	});
	if (now==sum&&b.type(callback, 'function')) {
		callback(null);
		models = callback = req = void 0;
	}

};
let ModelTempThis = void 0;
const ModelsBase = Object.create(null);
const ModelsProxy = Object.create(null);
const MPP = b.inherit(null) ;
const MBP = b.inherit(null) ;
const MBAP = b.inherit(null) ;
loadModels.getModelForProxy = function(fileRoot, isDebug, callback){
	let [q, modelFn] = [b.queue(), null];
		q.end(function onEnd(state, res){
			b.nextTick(function(){
				if (!callback) {
					return ;
				}
				if (state) {
					callback(null, res);
				}else{
					callback(res, null);
				}
				q = callback = state = res = void 0 ;
			});
		}).push(function checkCache(next, resolve){
			if ((isDebug!==true)&&ModelsProxy[fileRoot]) {
				resolve(ModelsProxy[fileRoot]);
			}else{
				next();
			}

		}, true, function loadModelsFile(next, resolve, reject){
			//使用require加载
			requirejs([fileRoot],function (model){
				modelFn = model ;
				model = void 0 ;
				if (isDebug&&fileRoot) {
					//调试模式的缓存清除
					requirejs.undef( fileRoot );
				}
				next();
			},function (e){
				if (isDebug&&fileRoot) {
					//调试模式的缓存清除
					requirejs.undef( fileRoot );
				}
				reject(e);
				e = void 0 ;
			});
		}, true, function runModels(next, resolve, reject){

			//实例化基本操作类
			ModelsBase[fileRoot] = function ModelAPI(){
				if (ModelTempThis){
					this.__M = ModelTempThis ;
				}
			};
			ModelsBase[fileRoot].prototype = MBP ;

			//运行model，拿到各种调用方法
			if (b.type(modelFn,'function')){
				//运行
				modelFn(ModelsBase[fileRoot], b.inherit(b));
				next();
			}else{
				reject(Error('This is not a standard model'));
			}
		}, true, function ModelProxyInit(next, resolve, reject){

			//实例化model的基本调用方法
			ModelsProxy[fileRoot] = function ModelsProxy(){};
			//设定继承
			ModelsProxy[fileRoot].prototype = b.inherit(null) ;
			//实例化基本操作类
			ModelsProxy[fileRoot] = new ModelsProxy[fileRoot]();

			b.each(ModelsBase[fileRoot], function(fn_name, fn) {
				var _this = this ;
				if (b.type(fn,'function')){
					ModelsProxy[fileRoot][fn_name] = function modelFn(){
						var M;
							M = b.inherit(MPP);
							M.arguments = loadModels.ModelProxyArgs(b.argsToArray(arguments));
							M.model = ModelsProxy[fileRoot];
							M.processApp = this.processApp;
							b.nextTick(function(){
								ModelTempThis = M ;
								fn.apply(M.model,M.arguments);
								ModelTempThis = void 0 ;
							});
							return M;
					};
				}
			});
			resolve(ModelsProxy[fileRoot]);
		}).run();
};




	//加载model
	loadModels.__Ajax = function(options,success,error){
		apiRESTful.api(options.path||'/').setConn(this._API.__M.processApp).method(options.type||'GET').headers(options.headers||{}).sendData(options.data||{}).done(function(res){
			success(res);
		})
		.fail(function(msg, error_id, e){
			error(msg,e);
		});
	};
	//主要是深度克隆，防止对象被引用，导致数据污染
	loadModels.ModelProxyArgs = function(args){
		var newArgs,key ;
		if(!(args&&(typeof args == 'object'||typeof args == 'function'))){
			return args;
		}
		if(b.type(args,'array')){
			newArgs = [];
			for (key = 0; key < args.length; key++) {
				newArgs.push(loadModels.ModelProxyArgs(args[key]));
			}
		}else{
			newArgs = {};
			for(key in args){
				newArgs[key] = loadModels.ModelProxyArgs(args[key]);
			}
		}
		return newArgs;
	};


	//model加载专用
	global.models = function(model){
		requirejs.define(function(){
			return model;
		});
	};


	//错误提示开始
	class ModelsError extends Error{
		//构造函数
		constructor(message, stack){
			//调用父类构造函数
			super(message); 
			this.name = this.name||'Error';
			this.type = this.type||'ModelsError';
			this.stack += stack?('\n'+stack):'';
			message = stack = void 0 ;
		}
	}


	/**
	 * [success 成功数据反馈]
	 * @author: 桦 <yuchonghua@163.com>
	 * @DateTime 2016-06-23T19:52:22+0800
	 * @param    {object}                 data [返回的数据]
	 */
	MBP.success = function(){
		if(this.__M&&this.__M.__callback_success&&b.type(this.__M.__callback_success,'function')){
			this.__M.__callback_success.apply(this.__M,loadModels.ModelProxyArgs(b.argsToArray(arguments)));
		}
	};
	/**
	 * [error 反馈错误]
	 * @author: 桦 <yuchonghua@163.com>
	 * @DateTime 2016-06-23T19:47:08+0800
	 * @param    {string}                 msg      [错误提示]
	 * @param    {string}                 error_id [错误ID]
	 * @param    {object}                 data     [具体数据]
	 */
	MBP.error = function(msg,error_id,data){
		var error = new ModelsError(msg);
			b.extend(true, error, data);
			error.error_id = error_id || error.error_id || 'error_id_unknown' ;
			if(this.__M&&this.__M.__callback_error&&b.type(this.__M.__callback_error,'function')){
				this.__M.__callback_error.apply(this.__M,[msg, error.error_id, error]);
			}else{
				var errorEvent = b.inherit(null);
				errorEvent.error_msg = msg;
				errorEvent.error_id = error_id;
				errorEvent.error_data = data||error;
				errorEvent.error = error;
				if (this.__M.processApp.appNode.trigger('modelError',true,errorEvent).result!==false) {
					throw error;
				}
				errorEvent = undefined ;
			}
			error = undefined ;
			msg = undefined ;
			error_id = undefined ;
			data = undefined ;
	};
	//请求模式
	b.each('get GET post POST put PUT del DEL'.split(' '),function(index, type) {
		MBP[type] = function(path){
			type = type.toUpperCase();
			if (type == 'DEL') {
				type = 'DELETE';
			}
			this.__api_id = (this.__api_id||0)+1 ;
			this.__M[this.__api_id] = b.inherit(MBAP);
			this.__M[this.__api_id].__options = b.inherit(null);
			this.__M[this.__api_id].__options.data = b.inherit(null);
			this.__M[this.__api_id].__options.type = type ;
			this.__M[this.__api_id].__options.path = path ;
			this.__M[this.__api_id]._API = this ;
			return this.__M[this.__api_id] ;
		};
	});

	/**
	 * [sendData 发送数据]
	 * @author: 桦 <yuchonghua@163.com>
	 * @DateTime 2016-06-22T22:50:36+0800
	 * @param    {Boolean}                is_clear [description]
	 * @param    {[type]}                 data     [description]
	 * @return   {[type]}                          [description]
	 */
	MBAP.sendData = function(is_clear,data){
		if (is_clear===true){
			this.__options.data = b.inherit(null);
		}else{
			data = is_clear ;
			is_clear = undefined ;
		}
		b.extend(true, this.__options.data, data);
		return this ;
	};

	MBAP.send = function(options){
		var _this = this ;
		b.extend(true, this.__options, options);
		loadModels.__Ajax.call(this, this.__options, function(data){
			if(_this.__callback_success&&b.type(_this.__callback_success,'function')){
				_this.__callback_success.apply(_this,arguments);
			}else if(_this&&_this._API&&_this._API.__M&&_this._API.__M&&_this._API.__M.__callback_success&&b.type(_this._API.__M.__callback_success,'function')){
				_this._API.__M.__callback_success.apply(_this._API.__M,arguments);
			}
		},function(msg,data){
			var error = new ModelsError(msg);
				b.extend(true, error, data);
				error.error_id = error.error_id || 'error_id_unknown' ;
				if(_this.__callback_error&&b.type(_this.__callback_error,'function')){
					_this.__callback_error.apply(_this,[msg, error.error_id, error]);
				}else if(_this&&_this._API&&_this._API.__M&&_this._API.__M&&_this._API.__M.__callback_error&&b.type(_this._API.__M.__callback_error,'function')){
					_this._API.__M.__callback_error.apply(_this._API.__M,[msg, error.error_id, error]);
				}else{
					var errorEvent = b.inherit(null);
					errorEvent.error_msg = msg;
					errorEvent.error_id = error.error_id;
					errorEvent.error_data = data||error;
					errorEvent.error = error;
					if (_this._API.__M.processApp.appNode.trigger('modelError',true,errorEvent).result!==false) {
						throw error;
					}
				}
		});
	};

	/**
	 * [success 成功处理]
	 * @author: 桦 <yuchonghua@163.com>
	 * @DateTime 2016-06-22T22:50:29+0800
	 * @param    {[type]}                 data [description]
	 * @return   {[type]}                      [description]
	 */
	MBAP.success = function success(fn){
		if (b.type(fn,'function')){
			this.__callback_success = fn ;
		}
		return this ;
	};
	/**
	 * [error 处理错误]
	 * @author: 桦 <yuchonghua@163.com>
	 * @DateTime 2016-06-22T22:50:17+0800
	 * @param    {[type]}                 msg   [description]
	 * @param    {[type]}                 error [description]
	 * @return   {[type]}                       [description]
	 */
	MBAP.error = function error(fn){
		if (b.type(fn,'function')){
			this.__callback_error = fn ;
		}
		return this ;
	};

	//ModelsProxyPrototype
	/**
	 * [success 成功处理]
	 * @author: 桦 <yuchonghua@163.com>
	 * @DateTime 2016-06-22T22:50:29+0800
	 * @param    {[type]}                 data [description]
	 * @return   {[type]}                      [description]
	 */
	MPP.success = function success(fn){
		if (b.type(fn,'function')){
			this.__callback_success = fn ;
		}
		return this ;
	};
	/**
	 * [error 处理错误]
	 * @author: 桦 <yuchonghua@163.com>
	 * @DateTime 2016-06-22T22:50:17+0800
	 * @param    {[type]}                 msg   [description]
	 * @param    {[type]}                 error [description]
	 * @return   {[type]}                       [description]
	 */
	MPP.error = function error(fn){
		if (b.type(fn,'function')){
			this.__callback_error = fn ;
		}
		return this ;
	};