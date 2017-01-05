(function(window,undefined){
	'use strict';
	var init, a, b, fn, API;
	//初始化
	init = function(){
		//初始化api实例化模块部分
		init.APIInit();



		init.apiApiFnInit();
		init.apiSignInit();
		init.callbackInit();
		//返回模块初始化
		init.APIReturnInit();
	};
	a = {};
	a.api = {};
	a.ws = {};
	a.ajax = {};
	a.ws.request = function requestWs(o){
		o.headers = o.headers || b.inherit(null);
		o.request_id = o.headers.request_id || o.request_id || b.createRequestId();
		o.headers.request_id = o.request_id;
		o.body = o.body || '';
		o.start = o.start || '';
		if (!b.type(o.success, 'function')) {
			o.success = function(){};
		}
		if (!b.type(o.error, 'function')) {
			o.error = function(msg,e){throw e;};
		}
		o.addtime = b.time();
		o._this = this ;
		o.s = this.__sys__ ;
		b.rowraw.stringify(o.headers, o.body, o.start, function(raw){
			o.raw = raw ;
			raw = undefined ;
			if (!(o.s&&o._this&&a.ws.conn)) {
				o.error('Unknown error', new Error('Unknown error'));
				o = undefined ;
				return false;
			}
			o.s.processWs = o.s.processWs||b.inherit(null);
			o.s.processConn = o.s.processConn||[];
			o.s.processWs[o.request_id] = o ;
			o.s.processConn.push(o) ;
			if (o._this) {
				if (o._this.__sys__.isWsConned) {
					//已经连接，直接发送
					a.ws.requestRun.call(o._this);
				}else if(!o._this.__sys__.isWsConning) {
					//启动连接
					a.ws.conn.call(o._this);
				}
			}
			delete o.headers;
			delete o.body;
			delete o.start;
			o = undefined ;
		});
	};
	a.ws.requestRun = function(){
		while(this.__sys__&&this.__sys__.isWsConned&&a.ws.requestSend.call(this,(this.__sys__.processConn.shift()|| undefined))){}
	};
	a.ws.requestSend = function(o){
		if (o&&o.raw) {
			a.ws.send.call(this, o.raw, function sendCb(e){
				if (e&&o&&o._this&&o._this.__sys__) {
					o._this.__sys__.isWsConned = false;
					a.ws._onerror.call(o._this,e);
				}
			});
			return o._this.__sys__.isWsConned ;
		}
	};
	a.ws.requestError = function(e){
		var o ;
		while(this.__sys__&&(o=this.__sys__.processConn.shift()|| undefined)){
			if(o&&b.type(o.error, 'function')){
				o.error(e.message||'Unknown error', e);
			}
		}
	};
	a.ws.response = function(res){
		var request_id, o, code, e ;
		if(!(res.headers&&(request_id = res.headers.request_id))){
			return;
		}
		if (this.__sys__&&this.__sys__.processWs&&(o = this.__sys__.processWs[request_id])) {
			code = parseInt(res.status||0)||0;
			if (code>=200&&code<300) {
				if (b.type(o.success, 'function')) {
					o.success(res.headers||b.inherit(null), res.body||'', res);
				}
			}else{
				if (b.type(o.error, 'function')) {
					e = new Error(res.statusText||'unknown error');
					b.extend.call(e, e, res);
					o.error((e.message||'unknown error'), e);
					e = undefined ;
				}
			}
			delete this.__sys__.processWs[request_id];
		}
		o = request_id = code = undefined ;
	};
	a.ws.pushOpen = function(callback){
		var o = {}, _this = this;
			o.headers = {
				bodytype:'string'
			};
			o.start = 'OPEN /v1_0/init PUSH/1.0';
			o.success = function(headers, body){
				_this.emit(['pushsys','open'],headers, body);
				console.log(headers, body);
			};
			o.error = function(msg,e){
				console.log(msg, e);
			};
			a.ws.request.call(this, o);
	};
	a.ws.pushClose = function(){
		var o = {};
			o.start = 'CLOSE /v1_0/init PUSH/1.0';
			o.success = function(headers, body){
				console.log(headers, body);
			};
			o.error = function(msg,e){
				console.log(msg, e);
			};
			a.ws.request.call(this, o);
	};

	init.wsPushInit = function(){
		this.on(['request','push'],function(res){
			if (!this.emit(['push', (res.method||'').toLowerCase(), (res.path||'/')], res.headers, res.body ,res)) {
				if (console&&console.debug) {
					console.debug('webSocket::push\n');
					console.debug(res);
				}
			}
		});
		this.on(['push', 'ping', '/v1_0/sign'],function(headers, body){
			if (!headers.request_id) {
				console.error('推送系统故障！');
				console.error(headers);
			}
			var o, e, headersR, _this;
			o = b.inherit(null);
			o.headers = b.parseJSON(headers.headers);
			o.method = headers.method||'PUT';
			o.path = headers.path||'/';
			o.body = '';
			o.path = (o.path.charAt(0)=='/'?'':'/') + o.path;
			o.query = b.url('query',o.path)||'';
			o.path = b.url('path',o.path)||'/';
			o.host = b.url('hostname',this.__sys__.o.url.model);
			o.request_id = headers.request_id ;
			_this = this ;
			a.api.getSign.call(this, o, function(err, sign){
				e = err;
				headersR = b.inherit(null);
				headersR = b.extend.call(headersR, true, headersR, o.headers);
				headersR.request_id = headers.request_id;

				a.ws.send.call(_this, b.rowraw.stringify(headersR, '', ('PUSH/1.0 '+(e?(e.code||400):200)+' '+(e&&e.message||'OK'))), function sendCb(e){
					if (e&&_this&&_this.__sys__) {
						_this.__sys__.isWsConned = false;
					}
					_this = undefined ;
				});
				o = e = headersR = headers = body = undefined ;
			});

		});
	};
	//获取文件接口
	a.api.pushOpen = function(){
		if (this.__sys__.is_ws) {
			//使用长连接来请求文件过来
			a.ws.pushOpen.apply(this,arguments);
		}else{
			//使用ajax来请求文件
			cb_error(new Error('暂时不支持'));
		}
	};
	//获取文件接口
	a.api.pushClose = function(){
		if (this.__sys__.is_ws) {
			//使用长连接来请求文件过来
			a.ws.pushClose.apply(this,arguments);
		}else{
			//使用ajax来请求文件
			cb_error(new Error('暂时不支持'));
		}
	};
	
	a.api.getUTCServerTime = function getUTCServerTime(difference_time) {
		var d;
			d = new Date();
			d = new Date(parseInt(d.getTime()+((parseInt(difference_time)||0)*1000))+(60*d.getTimezoneOffset()));
			return d.getUTCFullYear()+'-'+b.replenish((d.getUTCMonth() + 1),2)+'-'+b.replenish((d.getUTCDate()),2)+'T'+b.replenish((d.getUTCHours()),2)+':'+b.replenish((d.getUTCMinutes()),2)+':'+b.replenish((d.getUTCSeconds()),2)+'Z';
	};
	//初始化api实例化模块部分
	init.APIInit = function(){
		fn = {};
		API = function API(c){
			//强制实例化
			if(this instanceof API){
				init.newInit.apply(this,arguments);
				init.optionsInit.apply(this,arguments);
				init.wsInit.apply(this,arguments);
				init.wsPushInit.apply(this,arguments);
			}else{
				return new API(c);
			}
		};
		API.setBase = function(base){
			b = base ;
			//继承api
			API.prototype = b.inherit(null);
		};
		API.setHmacSHA256 = function(f){
			fn.HmacSHA256 = f ;
		};
		API.setMd5Base64 = function(f){
			fn.md5Base64 = f ;
		};
		API.setMd5Hex = function(f){
			fn.md5Hex = f ;
		};
		//抛出错误
		API.error = function(msg){
			throw Error(msg);
		};
	};


	init.wsInit = function(){
		//判断是否支持h5的长连接
		this.__sys__.WebSocket = this.__sys__.WebSocket || this.__sys__.o.window.WebSocket ;
		if (this.__sys__.WebSocket) {
			this.__sys__.is_ws = true ;
			this.__sys__.ws_type = 'html5' ;

			a.ws.conn = function(){
				var ws, _this = this ;
				this.__sys__.isWsConning = true;
				try{
					this.__sys__.WebSocket = this.__sys__.WebSocket || WebSocket ;
					ws = this.__sys__.webSocket = new this.__sys__.WebSocket(this.__sys__.o.url.ws);
					ws._this = this ;
					//连接成功
					ws.onopen = function(e){
						if (this._this) {
							this._this.__sys__.isWsConned = true ;
							this._this.__sys__.isWsConning = false ;
							a.ws.requestRun.call(this._this);
						}
					};
					ws.onmessage = function(e){
						var _this = this._this ;
						if (this._this) {
							APP.rowraw.parse(e.data||e,function(err,res){
								var emitState;
								if (!_this) {return ;}
								if (res.type=='response') {
									a.ws.response.call(_this, res);
								}else if (res.type=='request') {
									emitState = !_this.emit(['request',(res.protocol||'').toLowerCase()],res);
								}else{
									emitState = !_this.emit(['message','unknown error'],(e.data||e));
								}
								if (emitState) {
									if (console&&console.debug) {
										console.debug('webSocket::message\n');
										console.debug(res);
									}
								}
								_this = undefined ;
							});
						}
					};
					//关闭事件
					ws.onclose = function(e){
						if (this._this) {
							this._this.__sys__.isWsConned = false ;
							this._this.__sys__.isWsConning = false ;
						}
					};
					//错误事件
					ws.onerror = function(e){
						var t = this._this;
						if (t) {
							if (!_this.__sys__) {return;}
							_this.__sys__.isWsConned = false ;
							_this.__sys__.tryNum = _this.__sys__.tryNum||0;
							if (_this.__sys__.tryNum<3) {
								a.ws.conn.call(_this);
							}else{
								_this.__sys__.isWsConning = false ;
								a.ws.requestError.call(_this, e);
							}
						}
						t = undefined ;
					};
				}catch(e){
					//错误事件
					return this._this&&a.ws._onerror.call(this._this,e);
				}
			};
			a.ws.send = function(body,callback){
				try{
					//发送
					this.__sys__.webSocket.send(body);
					//回调成功
					return b.type(callback, 'function')&&callback();
				}catch(e){
					//回调失败
					if (b.type(callback, 'function')) {
						callback(e);
					}else{
						throw e ;
					}
				}
			};
		}else{
			this.__sys__.is_ws = false ;
			this.__sys__.ws_type = '' ;
		}
	};
	//基本参数初始化
	init.optionsInit = function(options){
		var o ;
		//强制是个对象
		options = typeof options == 'object' ? options : {};
		//判断是否有url这个对象
		if ((!(options&&options.url))||(typeof options != 'object')) {
			API.error('new param not find url');
		}
		//ajax请求
		if (!options.ajax) {
			API.error('new param not find ajax');
		}
		//getSessionData
		if (!(options.getSessionData&&b.type(options.getSessionData, 'function'))) {
			API.error('new param not find getSessionData');
		}
		//setSessionData
		if (!(options.setSessionData&&b.type(options.setSessionData, 'function'))) {
			API.error('new param not find setSessionData');
		}
		//定义一个系统内部用的变量
		this.__sys__ = b.inherit(null);
		//把参数都压入系统里面
		this.__sys__.o = b.inherit(null);
		//复制配置信息
		b.extend(true, this.__sys__.o, options);
		//建立指向引用
		o = this.__sys__.o;
		//window
		o.window = o.window || window ;
		//强制url是一个对象
		o.url = o.url || b.inherit(null);
		o.protocol = o.window.location.protocol||'http:';
		o.protocolws = 'ws:';
		if (o.protocol=='https:') {
			o.protocolws = 'wss:';
		}
		o.url.model = o.url.model||(o.protocol+'//'+o.window.location.host+'/');
		o.url.file = o.url.file||(o.protocol+'//'+o.window.location.host+'/');
		//默认一个ws地址
		o.url.ws = o.url.ws||(o.protocolws+'//'+o.window.location.host+'/v1_0/conn');
		//是否自动转长连接
		o.long_storage = o.long_storage===true ? true :false ;
		o.auto_to_ws = o.auto_to_ws===true ? true :false ;
		//定义默认的
		fn.getSessionData = o.getSessionData;
		fn.setSessionData = o.setSessionData;
	};
	//实例化初始化
	init.newInit = function(){
		if (!(b&&b.extend)) {
			API.error('new options param not find base');
		}
		//支持绑定模式
		b.bindFnInit();
		if (!(fn.HmacSHA256&&(typeof fn.HmacSHA256 =='function'))) {
			API.error('new options param not find HmacSHA256');
		}
		if (!(fn.md5Base64&&(typeof fn.md5Base64 =='function'))) {
			API.error('new options param not find md5Base64');
		}
		if (!(fn.md5Hex&&(typeof fn.md5Hex =='function'))) {
			API.error('new options param not find md5Hex');
		}
		b.extend.call(this, this, (new b.EventEmitter()));
		var i, fns, fnapi;
		fns = 'pushOpen pushClose getSessionId sessionInit api getSign isSessionCard createCard getSessionData setSessionData clearSessionData'.split(' ');
		fnapi = function(api, fn_name){
			api[fn_name] = function(){
				return a.api[fn_name].apply(this,arguments);
			};
		};
		for (i = 0 ; i<fns.length ; i++) {
			fnapi(this, fns[i]);
		}
		i = fns = fnapi = undefined ;
	};
	//返回模块初始化
	init.APIReturnInit = function(){
		//兼容浏览器
		if ( typeof define === 'function' && define.amd ) {
			define(function() {
				return API;
			});
		}
		//兼容module.exports
		if ( typeof module === 'object' && typeof module.exports === 'object' ) {
			module.exports = API;
		}
	};

	//请求基础模块初始化
	init.apiApiFnInit = function(){
		var ap;
		a.api.api = function(path){
			var apiProcess, _this;
			_this = this ;
			apiProcess = new a.api.ApiProcess();
			apiProcess.__path = path || '/' ;
			b.nextTick(function runNextTick(){
				if (_this) {
					apiProcess.method = apiProcess.__method ||'GET' ;
					apiProcess.headers = apiProcess.__headers || b.inherit(null) ;
					apiProcess.data = apiProcess.__data || b.inherit(null) ;
					apiProcess.path = apiProcess.__path || '/' ;
					apiProcess.path = (apiProcess.path.charAt(0)=='/'?'':'/') + apiProcess.path;
					apiProcess.query = b.url('query',apiProcess.path)||'';
					apiProcess.path = b.url('path',apiProcess.path)||'/';

					apiProcess.host = b.url('hostname',_this.__sys__.o.url.model);
					apiProcess.port = b.url('port',_this.__sys__.o.url.model);
					apiProcess.protocol = b.url('protocol',_this.__sys__.o.url.model);

					delete apiProcess.__method;
					delete apiProcess.__headers;
					delete apiProcess.__data;
					delete apiProcess.__path;
					apiProcess.request_id = b.createRequestId();
					apiProcess.body = $.param(apiProcess.data).replace( /\+/g, '%20' );
					//开始初始化线程信息
					a.api.ApiProcessRun.call(_this, apiProcess);
				}
				_this = apiProcess = undefined ;
			});
			return apiProcess ;
		};
		a.api.ApiProcess = function ApiProcess(){};
		ap = a.api.ApiProcess.prototype ;
		//请求模式
		ap.method = function(method){
			this.__method = method || 'GET';
			//获取请求模式 get post put delete 模式
			this.__method = this.__method.toString().toUpperCase();
			return this;
		};
		//设置请求path
		ap.path = function(path){
			this.__path = path || this.__path || '/' ;
			return this;
		};
		//头信息
		ap.headers = function(headers){
			this.__headers = this.__headers || b.inherit(null);
			b.extend(true, this.__headers, headers);
			return this;
		};
		//发送数据
		ap.sendData = function(data){
			this.__data = this.__data || b.inherit(null);
			b.extend(true, this.__data, data);
			return this;
		};
		ap.done = function(){
			return this.success.apply(this, arguments);
		};
		ap.fail = function(){
			return this.error.apply(this, arguments);
		};
		ap.success = function(){
			this.__success = this.__success || [];
			var i ;
			for (i = 0; i < arguments.length; i++) {
				if(b.type(arguments[i], 'function')){
					this.__success.push(arguments[i]);
				}
			}
			i = undefined ;
			return this;
		};
		ap.error = function(){
			this.__error = this.__error || [];
			var i ;
			for (i = 0; i < arguments.length; i++) {
				if(b.type(arguments[i], 'function')){
					this.__error.push(arguments[i]);
				}
			}
			i = undefined ;
			return this;
		};
		ap.destroy = function(){
			var _this = this ;
			b.nextTick(function destroyNextTick(){
				if (_this) {
					var key ;
					for (key in _this) {
						if (!Object.hasOwnProperty.call(_this,key)) continue;
						delete _this[key];
					}
					key = undefined ;
				}
			});
		};
		a.api.ApiProcessRun = function(o){
			var q, error_run, success_run, t, res, resData;
				o.try_error_num = o.try_error_num || 0 ;
				error_run = function(msg, e){
					var is_error = false;
					if (parseInt(e.code)==403&&o.request_id) {
						if (++o.try_error_num<2) {
							return q&&q.nextToName('signRun');
						}else{
							is_error = true ;
						}
					}else{
						is_error = true ;
					}
					if (is_error) {
						b.each(o&&o.__error,function(index, fn) {
							if (b.type(fn, 'function')) {
								fn(msg, e.error_id||'unknown error', e);
							}
							index = fn = undefined ;
						});
						o.__error = undefined;
						o.destroy();
						q = error_run = success_run = t = res = resData = undefined;
					}
				};
				success_run = function(){
					if(o&&o.__success&&o.__success.length>0){
						b.each(o.__success,function(index, fn) {
							if (b.type(fn, 'function')) {
								fn(resData);
							}
							index = fn = undefined ;
						});
					}
					o.destroy();
					q = error_run = success_run = t = res = resData = undefined;
				};
				//创建队列
				q = b.queue().setThis(this);
				q.push(function signRun(next){
					a.api.getSign.call(this, o, function(e, sign){
						if (e) {
							return error_run&&error_run(e);
						}else{
							next();
						}
					});
				});
				q.push(true, function sendRun(next){
					if (this.__sys__.is_ws&&this.__sys__.o.auto_to_ws) {
						t = b.inherit(null);
						t.headers = b.inherit(null);
						t.headers.request_id = o.request_id || b.createRequestId();
						t.headers.headers = b.toJSON(o.headers);
						t.headers.config_dir = this.__sys__.o.config_dir;
						t.start = o.method+' '+o.path + (o.query?('?'+o.query):'') +' APIMODELPROXY/1.0';
						t.headers.protocol = o.protocol;
						t.headers.host = o.host;
						t.headers.port = o.port;
						t.body = o.body;
						t.success = function(headers, result){
							res = result ;
							headers = result = undefined ;
							next();
						};
						t.error = function(msg,e){
							var try_body;
								e.code = e.code || e.status || 0 ;
								e.error_id = e.error_id || e.statusText || 'api_error' ;
								try{
									try_body=b.parseJSON(e.body);
									msg = try_body.msg||msg;
								}catch(e1){}
								error_run(msg, e);
						};
						a.ws.request.call(this, t);
					}else{
						t = {
							type:o.method,
							headers:b.inherit(null),
							data:o.body,
							dataType:'text',//返回格式
							cache:false,//不缓存
							crossDomain:true,//跨域
							processData: false//因为是上传二进制数据，所有没有参数
						};
						t.url = o.protocol+'//'+o.host;
						if (o.protocol=='http:'&&o.port!='80') {
							t.url += ':' + o.port;
						}
						if (o.protocol=='https:'&&o.port!='443') {
							t.url += ':' + o.port;
						}
						t.url += o.path;
						if (o.query) {
							t.url += '?' + o.query;
						}
						b.each(o.headers, function(key, value) {
							switch(key.toLowerCase()||''){
								case 'host':
								case 'content-length':
									return ;
								default :
									t.headers[key] = value ;
									return ;
							}
						});

						t.success = function(result){
							res = result ;
							result = undefined ;
							next();
						};
						t.error = function(msg,data){
							var e = new Error(msg||data.statusText);
								b.extend(true, e, data) ;
								e.code = e.code || e.status || 0 ;
								e.error_id = e.error_id || e.statusText || 'api_error' ;
								error_run(msg, e);
						};
						//使用ajax来请求文件
						this.__sys__.o.ajax(t);
					}
				});
				q.push(true,function parseData(next){
					try{
						resData = b.parseJSON(res) ;
						next();
					}catch(e){
						error_run((e.message||e.msg||'Unknown error'), e);
						resData = {};
					}
				});
				q.push(true, function successCbRun(next){
					return success_run&&success_run();
				});
				q.run();
		};
	};

	//请求基础模块初始化
	init.apiSignInit = function(){
		a.api.getSign = function(o, callback){
			o = o || b.inherit(null) ;
			o.n = '\n';
			//请求id
			o.request_id = o.request_id || b.createRequestId();
			o.method = o.method || 'get';
			if (o.method.toLowerCase()=='get') {
				o.query_body = o.body;
				o.body = '';
			}else{
				o.body = o.body||'';
			}
			//以&拆分数组
			o.query_array = [];
			//签名数组
			o.query_array_sign = [];
			if (o.query&&o.query.length>0) {
				b.each(o.query.split('&'),function(index, t) {
					if (!t) {
						return ;
					}
					var key , value, i;
						//找到第一个等号的首次出现位置
						i = t.indexOf('=');
						//取得key
						key = t.substr(0,i);
						//取得value
						value = t.substr(i+1);
						//先去左右空格再编码
						key = a.api.urlEncode(b.trim(key));
						value = a.api.urlEncode(b.trim(value));
						//插入新数组
						o.query_array_sign.push(key+'='+value);
				});
			}
			if (o.query_body&&o.query_body.length>0) {
				b.each(o.query_body.split('&'),function(index, t){
					if (!t) {
						return ;
					}
					var key , value, i;
						//找到第一个等号的首次出现位置
						i = t.indexOf('=');
						//取得key
						key = t.substr(0,i);
						//取得value
						value = t.substr(i+1);
						//先去左右空格再编码
						key = a.api.urlEncode(b.trim(decodeURIComponent(key)));
						value = a.api.urlEncode(b.trim(decodeURIComponent(value)));
						//插入新数组
						o.query_array_sign.push(key+'='+value);
				});
				delete o.query_body ;
			}
			//排序
			o.query_array_sign.sort();
			//用&拼接
			o.query = o.query_array_sign.join('&');
			//回收内存
			delete o.query_array ;delete o.query_array_sign ;
				//克隆
				
				o.headers_temp = b.inherit(null);
				//遍历头
				b.each(o.headers,function(key, value) {
					//去左右空格
					key = b.trim(key.toString());
					switch(key.toLowerCase()){
						case 'authorization':
							return;
						case 'host':
							key='Host';
							break ;
						case 'content-length':
							key='Content-Length';
							break ;
						case 'content-type':
							key='Content-Type';
							break ;
						case 'content-md5':
							key='Content-Md5';
							break ;
					}
					if (value) {
						value = b.trim(value.toString());
						o.headers_temp[key] = value;
					}
				});
				//把处理后的赋值回给
				o.headers = o.headers_temp ;
				//释放内存
				delete o.headers_temp ;

				//强制有host头
				o.headers.Host = o.headers.Host?o.headers.Host:o.host;

				if (o.body&&o.body.length>0) {
					o.headers['Content-Length'] = o.headers['Content-Length']?o.headers['Content-Length']:o.body.length;
					o.headers['Content-Type'] = o.headers['Content-Type']?o.headers['Content-Type']:'application/x-www-form-urlencoded; charset=UTF-8';
					o.headers['Content-Md5'] = fn.md5Base64(o.body);
				}


				//要签名的头的key的一个数组
				o.headers_string = [];
				//签名的头
				o.canonical_headers = [];

				o.headers_prefix = this.__sys__.o.headers_prefix || 'x-app-' ;
				o.headers_prefix_len = o.headers_prefix.length ;
				//再次遍历头
				b.each(o.headers,function(key, value) {
					var key_lower ;
						//小写的key
						key_lower = key.toLowerCase();
						//判断一下
					if (b.array.index(key_lower,['host','content-length','content-type','content-md5'])>-1||key_lower.substr(0,o.headers_prefix_len)==o.headers_prefix){
						o.canonical_headers.push( a.api.urlEncode(key_lower) +':'+ a.api.urlEncode(value));
						o.headers_string.push( key_lower);
					}
				});

				o.canonical_headers.sort();
				//用\n拼接
				o.canonical_headers = o.canonical_headers.join(o.n);
				//用;拼接
				o.headers_string = o.headers_string.join(';');

				o.session_data = b.inherit(null);

				o.Authorization = '';

				var q;
				//建立队列
				q = b.queue().setThis(this);
				//插入队列方法-获取会话数据
				q.push(function(next){
					//获取会话数据
					a.api.getSessionTrueData.call(this, function(session_data){
						//存储数据
						o.session_data = session_data ;
						//下一步
						next();
					},function(e){
						callback(e);
						callback =undefined ;
						//销毁
						q.abort();
					}, (o.try_error_num>0||false));
				});
				q.push(true,function(next){
					//获取会话信息
					o.session_id = o.session_data.session_id ;
					o.session_key = o.session_data.session_key||'session_key';
					o.session_card = o.session_data.session_card ;
					o.difference_time = o.session_data.difference_time ;
					//下一步
					next();
				});
				q.push(true,function(next){
					//授权字符串
					o.Authorization += 'app-auth-v2'+'/'+o.request_id+'/'+o.session_id+'/'+o.session_card+'/'+a.api.getUTCServerTime(o.difference_time)+'/'+'1800';
					//生成加密key
					o.signing_key = fn.HmacSHA256(o.Authorization, o.session_key);
					//下一步
					next();
				});
				q.push(true,function(next){
					o.canonical_request = o.method + o.n + a.api.urlEncodeExceptSlash(o.path) + o.n + o.query + o.n + o.canonical_headers;
					//使用signKey和标准请求串完成签名
					o.session_sign = fn.HmacSHA256(o.canonical_request, o.signing_key);
					//组成最终签名串
					o.Authorization += '/' + o.headers_string + '/'+ o.session_sign;
					//下一步
					next();
				});
				//回收变量
				q.push(true,function(next){
					//delete o.n;
					delete o.headers_string;
					delete o.headers_prefix;
					delete o.headers_prefix_len;
					delete o.session_sign;
					delete o.signing_key;
					delete o.session_key;
					delete o.session_id;
					delete o.session_data;
					delete o.session_card;
					delete o.canonical_headers;
					delete o.canonical_request;
					delete o.difference_time;
					o.headers.Authorization = o.Authorization ;
					delete o.Authorization ;
					callback(null, o);
					q.abort();
				});
				//运行队列
				q.run();
		};

		var kEscapedMap = {
			'!' : '%21',
			'\'': '%27',
			'(' : '%28',
			')' : '%29',
			'*' : '%2A'
		};

		a.api.urlEncodeExceptSlash=function(value){
			return a.api.urlEncode(value,false);
		};
		a.api.urlEncode = function (string, encodingSlash) {
			var result = encodeURIComponent(string);
			result = result.replace(/[!'\(\)\*]/g, function ($1) {
				return kEscapedMap[$1];
			});

			if (encodingSlash === false) {
				result = result.replace(/%2F/gi, '/');
			}

			return result;
		};
		a.api.isSessionCardReg=/^([0-9a-fA-F]){4}-([0-9a-fA-F]){8}-([0-9a-fA-F]){4}-([0-9a-fA-F]){4}-([0-9a-fA-F]){4}-([0-9a-fA-F]){12}-([0-9a-fA-F]){8}$/;
		a.api.isSessionCard=function(session_card){
			return (a.api.isSessionCardReg.test(session_card)||false);
		};
		a.api.createCard = function(callback){
			var p = {};
			//生成session_card
			p.session_card = '';
			p.getMd5Str = function(str){
				return fn.md5Hex((str||'').toString()).toString();
			};
			try{p.n = navigator ;}catch(e){p.n = {} ;}
			try{p.s = screen ;}catch(e){p.s = {} ;}
			try{
				p.t = {};
				p.t.canvas = document.createElement('canvas');
				p.t.ctx = p.t.canvas.getContext('2d');
				p.t.txt = 'http://www.chengjiabao.cn/';
				p.t.ctx.textBaseline = 'top';
				p.t.ctx.font = "14px 'Arial'";
				p.t.ctx.textBaseline = "chengjiabao";
				p.t.ctx.fillStyle = "#f60";
				p.t.ctx.fillRect(125,1,62,20);
				p.t.ctx.fillStyle = "#069";
				p.t.ctx.fillText(p.t.txt, 2, 15);
				p.t.ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
				p.t.ctx.fillText(p.t.txt, 4, 17);
				p.t.b64 = p.t.canvas.toDataURL().replace("data:image/png;base64,","");
				p.t = apiRESTful.CryptoJS.enc.Latin1.parse(atob(p.t.b64)).toString(apiRESTful.CryptoJS.enc.Base64);
			}catch(e){
				p.t = b.createGuid();
			}
			p.session_card += p.getMd5Str(p.t).substr(0,4);
			try{
				p.t = p.n.userAgent;
			}catch(e){
				p.t = b.createGuid();
			}
			p.session_card += '-'+p.getMd5Str(p.t).substr(8,8);
			try{
				p.t = (p.n.platform||'')+(p.n.appCodeName||'')+(p.n.appName||'')+(p.n.appVersion||'')+(p.n.language||'');
			}catch(e){
				p.t = b.createGuid();
			}
			p.session_card += '-'+p.getMd5Str(p.t).substr(8,4);
			try{
				p.t = (p.n.product||'')+(p.n.productSub||'')+(p.n.vendor||'');
			}catch(e){
				p.t = b.createGuid();
			}
			p.session_card += '-'+p.getMd5Str(p.t).substr(8,4);
			try{
				p.t = (p.s.availHeight||'')+(p.s.availLeft||'')+(p.s.availTop||'')+(p.s.availWidth||'')+(p.s.colorDepth||'')+(p.s.height||'')+(p.s.pixelDepth||'')+(p.s.width||'');
			}catch(e){
				p.t = b.createGuid();
			}
			p.session_card += '-'+p.getMd5Str(p.t).substr(8,4);
			try{
				p.t = (cjb.api.data.create_card_data.etag||'');
			}catch(e){
				p.t = b.createGuid();
			}
			p.session_card += '-'+p.getMd5Str(p.t).substr(8,12);
			try{
				p.t = (cjb.api.data.create_card_data.lastmodified||''+cjb.api.data.create_card_data.date||'');
			}catch(e){
				p.t = b.createGuid();
			}
			p.session_card += '-'+p.getMd5Str(p.t).substr(8,8);
			callback(p.session_card);
			p = callback = undefined ;
		};
		//获取数据
		a.api.getSessionData = function(callback){
			this.__sys__.o.getSessionData((b.url('hostname',this.__sys__.o.url.model)+':'+b.url('port',this.__sys__.o.url.model)),function getSessionCb(data){
				var q ;
				//创建队列
				q = b.queue().setThis(this);
				try{
					data = b.parseJSON(data)||{};
				}catch( e ) {
					data = {};
				}
				//判断是否有card
				q.push(function(next){
					if (data&&data.session_card&&a.api.isSessionCard(data.session_card)) {
						//如果有session_card就直接跳转下一步
						next();
					}else{
						//否则创建session_card
						a.api.createCard(function(session_card){
							//会话
							data.session_card = session_card ;
							//下一步
							next();
						});
					}
				});
				//下一步
				q.push(true,function(next){
					if (b.type(callback, 'function')) {
						callback(data);
					}
					q.abort();
					data = q = undefined ;
				});
				//运行队列
				q.run();
			});
		};
		a.api.setSessionData = function(data, callback){
			var q, saveData ;
				//新建队列
				q = b.queue().setThis(this);
				q.end(function onEnd(state, res){
					if (callback&&b.type(callback, 'function')) {
						if (state) {
							callback(null, res);
						}else{
							callback(res);
						}
					}
				});
				//数据序列化
				q.push(function dataToJSON(next, success, fail){
					try{
						saveData = b.toJSON(data);
						next();
					}catch(e){
						fail(e);
					}
				});
				//尝试保存数据
				q.push(true,function saveDataRun(next){
					this.__sys__.o.setSessionData((b.url('hostname',this.__sys__.o.url.model)+':'+b.url('port',this.__sys__.o.url.model)), saveData, function(e){
						callback(e);
						q.abort();
					});
				});
				//启动队列
				q.run();
		};

		//清除session数据
		a.api.clearSessionData=function(callback){
			var _this = this ;
			a.api.getSessionData.call(_this, function cb(data){
				a.api.setSessionData.call(_this, {session_card:data.session_card||''}, callback);
				_this = data = callback = undefined ;
			});
		};

		//获取检验过的session数据
		a.api.getSessionTrueData = function(cb_success, cb_error, isSessionInit){
			var q, session_data, _this;
			_this = this ;
			//加入回调系统
			a.callback.add(this,'getSessionTrueData','success',cb_success);
			a.callback.add(this,'getSessionTrueData','error',cb_error);
			cb_success = cb_error = undefined ;
			//如果是获取中就防止多次连接
			if (this.__sys__.is_get_session_true_ing===true) {
				return ;
			}
			a.callback.add(this,'getSessionTrueData','success',function(){
				_this.__sys__.is_get_session_true_ing=false;
			});
			a.callback.add(this,'getSessionTrueData','error',function(){
				_this.__sys__.is_get_session_true_ing=false;
			});
			this.__sys__.is_get_session_true_ing=true;
			q = b.queue().setThis(this);
			//插入队列
			q.push(function getSessionDataRun(next){
				a.api.getSessionData.call(this,function cb(data){
					session_data = data ;
					data = undefined ;
					next();
				});
			});
			//获取会话数据
			q.push(true,function checkSessionDataRun(next){
				//为了保证没有问题，提前5秒钟过期
				if (isSessionInit||(!session_data)||(!session_data.expires_time)||b.time()>(session_data.expires_time-5)){
					isSessionInit = undefined ;
					a.api.sessionInit.call(this,function(){
						//下一步
						q.nextToName('getSessionDataRun');
					},function(e){
						a.callback.run(this,'getSessionTrueData','error',[e]);
						q.abort();
						session_data = q = _this = undefined ;
					});
				}else{
					//下一步
					next();
				}
			});
			//检测一下数据
			q.push(true,function checkSessionDataRun2(next){
				if (session_data&&session_data.session_id&&session_data.session_key&&session_data.session_card) {
					next();
				}else{
					session_data = {};
					q.nextToName('checkSessionDataRun');
					return;
				}
			});
			//成功回调
			q.push(true,function(next){
				a.callback.run(this,'getSessionTrueData','success',[session_data]);
				q.abort();
				session_data = q = _this = undefined ;
			});
			q.run();
		};
		a.api.getSessionId = function(callback){
			a.api.getSessionTrueData.call(this, function(session_data){
				if (b.type(callback, 'function')) {
					callback(null, session_data.session_id);
					callback  =undefined ;
				}
			},function(e){
				if (b.type(callback, 'function')) {
					callback(e);
					callback  =undefined ;
				}
			});
		};
		//会话初始化
		a.api.sessionInit = function(callback){
			var q, error_run, t, res, resData, session_data, session_card, authorization, request_id;
				this.__sys__.processSI = this.__sys__.processSI || [];
				if (b.type(callback, 'function')) {
					this.__sys__.processSI.push(callback);
				}
				callback = undefined ;
				//如果是连接中就防止多次连接
				if (this.__sys__.is_session_init_ing===true) {
					data = undefined ;
					return ;
				}
				this.__sys__.processSI.push(function(){
					this.__sys__.is_session_init_ing = false ;
					this.__sys__.session_init_try_error_num = 0;
				});
				this.__sys__.is_session_init_ing = true ;

				error_run = function(msg, e){
					this.__sys__.session_init_try_error_num = this.__sys__.session_init_try_error_num || 0 ;
					if (++this.__sys__.session_init_try_error_num<5) {
						return q&&q.nextToName('clearSessionDataRun');
					}else{
						b.each(this.__sys__&&this.__sys__.processSI,function(index, fn) {
							if (b.type(fn, 'function')) {
								fn.call(this, e);
							}
							index = fn = undefined ;
						}, true, this);
						this.__sys__.processSI = [];
						q = error_run = t = res = resData = undefined;
					}
				};
				//新建队列
				q = b.queue().setThis(this);
				q.end(function onEnd(){
					b.each(this.__sys__&&this.__sys__.processSI,function(index, fn) {
						if (b.type(fn, 'function')) {
							fn.call(this, null, resData);
						}
						index = fn = undefined ;
					}, true, this);
					this.__sys__.processSI = [];
					q = error_run = t = res = resData = undefined;
				});

				q.push(function clearSessionDataRun(next){
					if (this.__sys__.session_init_try_error_num>2) {
						a.api.clearSessionData.call(this, next);
					}else{
						next();
					}
					next = undefined;
				});
				q.push(true, function getSessionDataRun(next){
					a.api.getSessionData.call(this,function cb(data){
						session_data = data ;
						data = undefined ;
						next();
					});
				});
				q.push(true, function checkSessionCardRun(next){
					session_card = session_data.session_card;
					next();
				});
				q.push(true, function signRun(next){
					request_id = b.createGuid();
					//授权字符串
					authorization = 'session-init-v1';
					authorization += '/' + request_id;
					authorization += '/' + (session_data.session_id||'0');
					authorization += '/' + session_card;
					authorization += '/' + a.api.getUTCServerTime(session_data.difference_time||0)+'/'+'1800';
					var signing_key = fn.HmacSHA256(authorization, (session_data.session_key||'session_key'));
					//生成加密key
					authorization += '/'+ b.createGuid() ;
					authorization += '/'+ fn.HmacSHA256(authorization, signing_key );
					next();
					signing_key = next = undefined ;
				});
				q.push(true, function sendRun(next){
					var _this = this ;
					if (this.__sys__.is_ws&&this.__sys__.o.auto_to_ws) {
						t = b.inherit(null);
						t.headers = b.inherit(null);
						t.headers.request_id = request_id;
						t.headers.headers = b.toJSON({ 'Authorization' : authorization });
						t.headers.config_dir = this.__sys__.o.config_dir;
						t.start = 'GET '+ this.__sys__.o.url.session_init +' APIMODELPROXY/1.0';
						t.headers.host = b.url('hostname',this.__sys__.o.url.model);
						t.headers.port = b.url('port',this.__sys__.o.url.model);
						t.headers.protocol = b.url('protocol',this.__sys__.o.url.model);
						
						t.success = function(headers, result){
							res = result ;
							headers = result = undefined ;
							next();
							_this = undefined ;
						};
						t.error = function(msg,e){
							e.code = e.code || e.status || 0 ;
							e.error_id = e.error_id || e.statusText || 'api_error' ;
							error_run.call(_this, msg, e);
							_this = undefined ;
						};
						a.ws.request.call(this, t);
					}else{
						t = {
							type:'get',
							headers:{ 'Authorization' : authorization },
							dataType:'text',//返回格式
							cache:false,//不缓存
							crossDomain:true//跨域
						};
						t.url = this.__sys__.o.url.model + '/' + this.__sys__.o.url.session_init;
						t.success = function(result){
							res = result ;
							result = undefined ;
							next();
							_this = undefined ;
						};
						t.error = function(msg,data){
							var e = new Error(msg||data.statusText);
								b.extend(true, e, data) ;
								e.code = e.code || e.status || 0 ;
								e.error_id = e.error_id || e.statusText || 'api_error' ;
								error_run.call(_this, msg, e);
								_this = undefined ;
						};
						//使用ajax来请求文件
						this.__sys__.o.ajax(t);
					}
						//o.headers = 
				});
				q.push(true,function parseData(next){
					try{
						resData = b.parseJSON(res) ;
						next();
					}catch(e){
						error_run((e.message||e.msg||'Unknown error'), e);
						resData = {};
					}
				});
				//保存数据
				q.push(true,function(next){
					if (resData.type != 'update') {
						//如果不需要就跳过
						next();
						return;
					}
					//服务器时间
					resData.session_data.server_time = resData.session_data.server_time || b.time();
					//本地时间
					resData.session_data.local_time = b.time();
					//服务器时间减去本地时间
					resData.session_data.difference_time = resData.session_data.server_time - resData.session_data.local_time;
					//到期时间
					
					if (resData.session_data.expires_time!==undefined&&resData.session_data.expires_time!==null) {
						resData.session_data.expires_time +=resData.session_data.difference_time;
					}else{
						resData.session_data.expires_time = b.time()+(60*60*24*7);
					}
					//获取会话数据
					a.api.setSessionData.call(this, resData.session_data, function(e){
						session_data = resData.session_data ;
						if (e) {
							error_run((e.message||e.msg||'session data save fail'), e);
						}else{
							//下一步
							next();
						}
						e = undefined ;
					});
				});
				q.push(true,function endRun(next, success){
					success();
				});
				q.run();
		};
	};
	//回调系统模块初始化
	init.callbackInit = function(){
		a.callback = {};
		//加入回调
		a.callback.add = function(_this, do_type, event_type, callback){
			var _this_type ;
				_this_type = typeof _this || '';
				if ((!_this)||(!( _this_type=='object'|| _this_type== 'function'  ))) {
					return ;
				}
				do_type = do_type ;
				do_type = 'callback_'+do_type;
				_this.__sys__ = _this.__sys__ || {};
				_this.__sys__[do_type] = _this.__sys__[do_type] || {};
				_this.__sys__[do_type][event_type] = _this.__sys__[do_type][event_type] || [];
				if ( b.type(callback, 'function') ) {
					_this.__sys__[do_type][event_type].push(callback);
				}
				_this = undefined ;
				_this_type = undefined ;
				do_type = undefined ;
				event_type = undefined ;
				callback = undefined ;
		};
		//执行回调
		a.callback.run = function(_this, do_type, event_type, args){
			var _this_type ;
				_this_type = typeof _this || '';
				if ((!_this)||(!( _this_type=='object'|| _this_type== 'function' ))) {
					return ;
				}
				do_type = do_type ;
				do_type = 'callback_'+do_type;
				_this.__sys__ = _this.__sys__ || {};
				_this.__sys__[do_type] = _this.__sys__[do_type] || {};
				_this.__sys__[do_type][event_type] = _this.__sys__[do_type][event_type] || [];

				while(_this.__sys__[do_type][event_type].length>0){
					if (_this.__sys__[do_type][event_type][0]!==undefined) {
						if ( b.type(_this.__sys__[do_type][event_type][0],'function') ) {
							_this.__sys__[do_type][event_type][0].apply(_this,(args||[]));
						}
						_this.__sys__[do_type][event_type].splice(0,1);
					}
				}
				_this.__sys__[do_type] = {};


				_this = undefined ;
				_this_type = undefined ;
				do_type = undefined ;
				event_type = undefined ;
				args = undefined ;
		};
	};
	//初始化
	init();
}(function(){
	var w ;
	try{
		w = window ;
	} catch ( e ) {
		try{
			w = global ;
		} catch ( e ) {
			throw 'find not global';
		}
	}
	return w;
}()));