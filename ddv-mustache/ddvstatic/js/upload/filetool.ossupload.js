(function( global, factory ) {
	factory( global );
}(typeof window !== "undefined" ? window : this, function( window ) {
	var strundefined = typeof undefined;
	var filetool = window.filetool = window.filetool || {};
	if (typeof filetool.ossupload === 'function') {return filetool.ossupload;}
	var ossupload = function() {
		if (!(this instanceof ossupload)) {
			return Ossupload.ossupload.apply(Ossupload,arguments);
		}
	};
	var Ossupload = new ossupload();
	ossupload.setSign = function(sign){
		Ossupload.sign = sign;
	};
	ossupload.setAjax = function(ajax){
		Ossupload.ajax = ajax;
	};
	ossupload.setCryptoJS = function(CryptoJS){
		Ossupload.CryptoJS = CryptoJS;
	};
	ossupload.ossupload = function(){
		return Ossupload.ossupload.apply(Ossupload,arguments);
	};
	Ossupload.clone=function(myObj){
		var i , myNewObj;
		if(!(myObj&&(Ossupload.type(myObj,'object')||Ossupload.type(myObj,'array')))){
			return myObj;
		}
		if(myObj === null||myObj === undefined){
			return myObj;
		}
		myNewObj = '';
		if(Ossupload.type(myObj,'object')) {
			myNewObj = {};
			//防止克隆ie下克隆  Element 出问题
			if (myObj.innerHTML!==undefined&&myObj.innerText!==undefined&&myObj.tagName!==undefined&&myObj.tabIndex!==undefined) {
				myNewObj = myObj ;
			}else{
				for( i in myObj){
					myNewObj[i] = Ossupload.clone(myObj[i]);
				}
			}
		}else if(Ossupload.type(myObj,'array')) {
			myNewObj = [];
			for ( i = 0; i < myObj.length; i++) {
				myNewObj.push(myObj[i]);
			}
		}
		return myNewObj;
	};
	Ossupload.ossupload = function(o){
		//判断是否为实例化方式，如果是方法调用，即非实例化就实例化一次
		if (!(this instanceof Ossupload.ossupload)) {
			//实例化一个oss对象
			return new Ossupload.ossupload(o);
		}
		//如果走到这里，意味着是实例化运行到的
		var key;
		if (o.abort) {
			if (Ossupload.type(o.abort,'function')) {
				this.onAbort = o.abort;
			}
			delete o.abort ;
		}
		for (key in o) {
			this[key] = o[key];
		}
		o = undefined ;
		key = undefined ;
		//默认没有中断
		this.__is_abort = false;
		//开始初始化
		this.__init__();
	};
	//初始化
	Ossupload.ossupload.prototype.__initCheck__=function(){
		if (this.__initCheckLock === true) {
			return true;
		}
		//判断是否为文件
		if (!(this.file && (Ossupload.type(this.file,'file') || (typeof this.file ==='object' && typeof this.file.size!==strundefined) ) )) {
			this.Error('file can not is empty!.','NOT_TRUE_FILE_TYPE','It is not a correct file object you pass!');
			return false;
		}
		//存储this
		var ossuploadThis = this ;
		//判断是否已经引入签名类
		if (!(Ossupload.sign&&Ossupload.type(Ossupload.sign,'function'))){
			if (Ossupload.type(window.filetool,'object')&&( Ossupload.type(window.filetool.sign,'function')||Ossupload.type(window.filetool.sign,'object') )){
				ossupload.setSign(window.filetool.sign) ;
			}else{
				if (Ossupload.type(APP.__rLoad.require,'function')){
					APP.__rLoad.require(['filetool.sign'],function callback(sign){
						//设置签名依赖库
						ossupload.setSign(sign) ;
						//回调
						ossuploadThis.__init__();
					},function error(e){
						//反馈错误
						ossuploadThis.Error('Please call "ossupload.setSign(sign)" was added a signature dependencies','NOT_LIB_FILETOOL_SIGN',e.stack||'');
						e = undefined ;
					});
					return 'loading';
				}else{
					this.Error('Please call "ossupload.setSign(sign)" was added a signature dependencies','NOT_LIB_FILETOOL_SIGN','It has not yet introduced a dependency filetool.sign!');
					return false;
				}
			}
		}
		//判断是否已经引入签名类
		if (!(Ossupload.CryptoJS&&Ossupload.type(Ossupload.CryptoJS,'object'))){
			if (Ossupload.type(window.CryptoJS,'object')){
				ossupload.setCryptoJS(window.CryptoJS) ;
			}else{
				if (Ossupload.type(APP.__rLoad.require,'function')){
					APP.__rLoad.require(['CryptoJS'],function callback(CryptoJS){
						//设置签名依赖库
						ossupload.setCryptoJS(CryptoJS) ;
						//回调
						ossuploadThis.__init__();
					},function error(e){
						//反馈错误
						ossuploadThis.Error('By calling ossupload.setCryptoJS(CryptoJS) Incoming Interface request method','NOT_LIB_CRYPTOJS',e.stack||'');
						e = undefined ;
					});
					return 'loading';
				}else{
					this.Error('By calling ossupload.setCryptoJS(CryptoJS) Incoming Interface request method','NOT_LIB_CRYPTOJS','It has not yet introduced a dependency CryptoJS!');
					return false;
				}
			}
		}
		//判断是否已经引入签名类
		if (!(Ossupload.ajax&&Ossupload.type(Ossupload.ajax,'function'))){
			if (Ossupload.type(window.apiRESTful,'object')&&( Ossupload.type(window.apiRESTful.ajax,'function')||Ossupload.type(window.apiRESTful.ajax,'object') )){
				ossupload.setAjax(window.apiRESTful.ajax) ;
			}else{
				if (Ossupload.type(APP.__rLoad.require,'function')){
					APP.__rLoad.require(['apiRESTful'],function callback(apiRESTful){
						//设置签名依赖库
						ossupload.setAjax(apiRESTful.ajax) ;
						//回调
						ossuploadThis.__init__();
					},function error(e){
						//反馈错误
						ossuploadThis.Error('By calling ossupload.setAjax(ajax) Incoming Interface request method','NOT_LIB_APIRESTFUL_AJAX',e.stack||'');
						e = undefined ;
					});
					return 'loading';
				}else{
					this.Error('By calling ossupload.setAjax(ajax) Incoming Interface request method','NOT_LIB_APIRESTFUL_AJAX','It has not yet introduced a dependency apiRESTful.ajax!');
					return false;
				}
			}
		}
		//调用时候传入的回调方法 == 默认执行前的回调
		this.beforeSign = this.beforeSign || undefined ;
		//调用时候传入的回调方法 == 默认签名完成的回调
		this.completeSign = this.completeSign || undefined ;
		//调用时候传入的回调方法 == 默认总体进度回调
		this.progress = this.progress || undefined ;
		//调用时候传入的回调方法 == 默认签名进度回调
		this.progressSign = this.progressSign || undefined ;
		//调用时候传入的回调方法 == 默认上传进度回调
		this.progressUpload = this.progressUpload || undefined ;
		//调用时候传入的回调方法 == 默认错误完成回调
		this.error = this.error || undefined ;
		//调用时候传入的回调方法 == 默认没有完成回调
		this.complete = this.complete || undefined ;
		//默认为空
		this.sign = undefined;
		//获取文件大小
		this.file_info.file_size = this.file.size;
		//获取文件类型
		this.file_info.file_type = this.file.type;
		//标记已经通过检测
		this.__initCheckLock = true ;
		//检测通过
		return true;
	};
	Ossupload.ossupload.prototype.__init__=function(){
		//默认为空
		this.file_info = {};
		//状态为初始化
		this.file_info.__state = 'init';
		//用户取消上传
		if (this.__is_abort === true) {
			return false;
		}
		switch (this.__initCheck__()) {
			case false:
			case 'loading':
				//等待回调
				return;
				case 'true':
				case true:
				//通过
				break;
				default:
				this.Error('Please check the parameters passed','OPTIONS_ERROR','Please check the parameters passed!');
				break;
		}
		this.__GetPartSize__();
	};
	Ossupload.ossupload.prototype.__GetPartSize__=function(){
		var ossuploadThis = this ;
		//状态为签名前
		this.file_info.__state = 'getPartSize';
		//用户取消上传
		if (this.__is_abort === true) {
			return false;
		}
		if (Ossupload.type(this.getPartSize,'function')){
			this.getPartSize(this.file_info,function(data){
				ossuploadThis.__CheckPartSize__(data);
			});
		}else{
			//获取file_id
			Ossupload.ajax({
				url:(this.getPartSizeUrl||'v1_0/upload/file_part_size'),
				type:'PUT',
				dataType:'json',
				data:{
					file_size:this.file_info.file_size,
					file_type:this.file_info.file_type,
					device_type:this.device_type||'html5'
				},
				error:function(XHR, TS, ET,error_data){
					ossuploadThis.Error(Ossupload.type(error_data,'object')&&error_data.msg||ET,ET,TS);
				},
				success:function(data){
					ossuploadThis.__CheckPartSize__(data.data);
				}
			});
		}

	};
	Ossupload.ossupload.prototype.__CheckPartSize__=function(data){
		if (!data.part_size) {
			this.Error('server return part_size error','SERVER_RETURN_PART_SIZE_ERROR');
		}
		if (!data.part_sum) {
			this.Error('server return part_sum error','SERVER_RETURN_PART_SUM_ERROR');
		}

		this.file_info.part_size = data.part_size;
		this.file_info.part_sum = data.part_sum;
		this.__GetFileInfo__();
	};
	Ossupload.ossupload.prototype.__GetFileInfo__=function(){
		//状态为签名前
		this.file_info.__state = 'getFileInfo';
		//用户取消上传
		if (this.__is_abort === true) {
			return false;
		}
		var ossuploadThis = this ;
		//进行签名
		this.sign = Ossupload.sign({
			file:this.file,
			part_size:this.file_info.part_size,
			part_sum:this.file_info.part_sum,
			switch:['md5','sha1','crc32','partmd5'],
			beforeSign:function(file_info){
				return ossuploadThis.__BeforeSign__(file_info);
			},
			progress:function(e){
				return ossuploadThis&&ossuploadThis.__ProgressSign__(e);
			},
			error:function(message,type,description,error){
				//状态为签名异常
				ossuploadThis.file_info.__state = 'errorSign';
				//用户取消上传
				if (ossuploadThis.__is_abort === true) {
					return false;
				}
				ossuploadThis.Error(message,type,description);
				ossuploadThis = undefined ;
			},
			complete:function(file_info){
				ossuploadThis.__CompleteSign__(file_info);
				ossuploadThis = undefined ;
			}
		});
	};
	//签名进度反馈
	Ossupload.ossupload.prototype.__ProgressSign__=function(e){
		//状态为签名进行中
		this.file_info.__state = 'progressSign';
		//用户取消上传
		if (this.__is_abort === true) {
			return false;
		}
		e.type = 'signing';
		//如果调用返回了false就中断操作
		if (Ossupload.type(this.progressSign,'function')&&this.progressSign(e)===false) {
			this.abort();
		}
		this.__Progress__(e);
	};
	//签名进度反馈
	Ossupload.ossupload.prototype.__ProgressUpload__=function(msg){
		//状态为签名进行中
		this.file_info.__state = 'progressUpload';
		//用户取消上传
		if (this.__is_abort === true) {
			return false;
		}
		var data = {};
			data.type = 'uploading';
			data.progress = ((this.file_info.__upload_size_complete)/(this.file_info.file_size)).toFixed(4)*1;
		//如果调用返回了false就中断操作
		if (Ossupload.type(this.progressUpload,'function')&&this.progressUpload(data)===false) {
			this.abort();
		}
		this.__Progress__(data);
	};
	//进度反馈
	Ossupload.ossupload.prototype.__Progress__=function(data){
		//如果调用返回了false就中断操作
		if (Ossupload.type(this.progress,'function')&&this.progress(data)===false) {
			this.abort();
		}
	};
	//签名进度反馈
	Ossupload.ossupload.prototype.__CompleteSign__=function(file_info){
		//状态为签名完成
		this.file_info.__state = 'completeSign';
		//用户取消上传
		if (this.__is_abort === true) {
			return false;
		}
		//保存文件信息
		this.file_info = file_info;
		this.file_info.__upload__ = this ;
		//如果调用返回了false就中断操作
		if (Ossupload.type(this.completeSign,'function')&&this.completeSign(this.file_info)===false) {
			return false;
		}
		this.__GetFileId__();
	};
	//签名进度反馈
	Ossupload.ossupload.prototype.__BeforeSign__=function(file_info){
		//状态为签名前
		this.file_info.__state = 'beforeSign';
		//用户取消上传
		if (this.__is_abort === true) {
			return false;
		}
		//保存文件信息
		this.file_info = file_info;
		this.file_info.__upload__ = this ;
		//如果调用返回了false就中断操作
		if (Ossupload.type(this.beforeSign,'function')&&this.beforeSign(this.file_info)===false) {
			return false;
		}

		//计算文件大小
		this.file_size = file_info.file_size;
		this.file_name = file_info.file_name;
		this.file_type = file_info.file_type;
		return true ;
	};
	//获取上传文件id
	Ossupload.ossupload.prototype.__GetFileId__=function(){
		var ossuploadThis = this ;
		//状态为签名前
		this.file_info.__state = 'getFileId';
		//用户取消上传
		if (this.__is_abort === true) {
			return false;
		}
		if (Ossupload.type(this.getFileId,'function')){
			this.getFileId(this.file_info,function(data){
				ossuploadThis.__CheckFileInfo__(data);
			});
		}else{
			//获取file_id
			Ossupload.ajax({
				url:(this.getFileIdUrl||'v1_0/upload/file_id'),
				type:'PUT',
				dataType:'json',
				data:{
					file_md5:this.file_info.file_md5,
					file_sha1:this.file_info.file_sha1,
					file_crc32:this.file_info.file_crc32,
					file_part_md5_lower:this.file_info.file_part_md5_lower,
					file_part_md5_upper:this.file_info.file_part_md5_upper,
					file_name:this.file_info.file_name,
					file_size:this.file_info.file_size,
					file_type:this.file_info.file_type,
					last_modified:this.file_info.__last_modified,
					manage_type:this.manage_type||'anonymous',
					directory:this.directory||'common/other',
					auth_type:this.auth_type||'unknown',
					device_type:this.device_type||'html5'
				},
				error:function(XHR, TS, ET,error_data){
					ossuploadThis.Error(Ossupload.type(error_data,'object')&&error_data.msg||ET,ET,TS);
				},
				success:function(data){
					ossuploadThis.__CheckFileId__(data.data);
				}
			});
		}
	};
	//检测返回信息
	Ossupload.ossupload.prototype.__CheckFileId__=function(data){
		//状态为检测返回信息
		this.file_info.__state = 'checkFileId';
		//用户取消上传
		if (this.__is_abort === true) {
			return false;
		}
		if (!data.file_id) {
			this.Error('server return file_id error','SERVER_RETURN_FILE_Id_ERROR');
		}
		if (!data.file_crc32) {
			this.Error('server return file_crc32 error','SERVER_RETURN_FILE_CRC32_ERROR');
		}
		if (!data.file_md5) {
			this.Error('server return file_md5 error','SERVER_RETURN_FILE_MD5_ERROR');
		}
		if (!data.file_sha1) {
			this.Error('server return file_sha1 error','SERVER_RETURN_FILE_SHA1_ERROR');
		}
		if (!data.url) {
			this.Error('server return url error','SERVER_RETURN_URL_ERROR');
		}
		this.file_info.file_id = data.file_id ;
		this.file_info.file_crc32 = data.file_crc32 ;
		this.file_info.file_md5 = data.file_md5 ;
		this.file_info.file_sha1 = data.file_sha1 ;
		this.file_info.url = data.url ;
		data.is_upload_end?this.__CompleteUpload__():this.__GetFilePartInfo__();
	};
	//获取分块上传信息信息
	Ossupload.ossupload.prototype.__GetFilePartInfo__=function(){
		var ossuploadThis = this ;
		//状态为获取分块信息
		this.file_info.__state = 'getFilePartInfo';
		//用户取消上传
		if (this.__is_abort === true) {
			return false;
		}
		if (Ossupload.type(this.getFilePartInfo,'function')){
			this.getFilePartInfo(this.file_info,function(data){
				ossuploadThis.__CheckFilePartInfo__(data);
			});
		}else{
			//获取file_id
			Ossupload.ajax({
				url:(this.getFilePartInfoUrl||'v1_0/upload/file_part_info'),
				type:'PUT',
				dataType:'json',
				data:{
					file_id:this.file_info.file_id,
					file_crc32:this.file_info.file_crc32,
					file_md5:this.file_info.file_md5,
					file_sha1:this.file_info.file_sha1
				},
				error:function(XHR, TS, ET,error_data){
					ossuploadThis.Error(Ossupload.type(error_data,'object')&&error_data.msg||ET,ET,TS);
				},
				success:function(data){
					ossuploadThis.__CheckFilePartInfo__(data.data);
				}
			});
		}
	};
	//获取签名信息
	Ossupload.ossupload.prototype.__CheckFilePartInfo__=function(data){
		//状态为签名前
		this.file_info.__state = 'checkFilePartInfo';
		//用户取消上传
		if (this.__is_abort === true) {
			return false;
		}
		if (!data.file_size) {
			this.Error('server return file_size error','SERVER_RETURN_FILE_SIZE_ERROR');
		}
		if (!data.part_size) {
			this.Error('server return part_size error','SERVER_RETURN_PART_CRC32_ERROR');
		}
		if (!data.done_parts || !Ossupload.type(data.done_parts,'array')) {
			this.Error('server return done_parts error','SERVER_RETURN_DOME_PARTS_ERROR');
		}
		if (!data.part_sum) {
			this.Error('server return part_sum error','SERVER_RETURN_PART_SUM_ERROR');
		}
		this.file_info.file_size = parseFloat(data.file_size) ;
		this.file_info.part_size = parseFloat(data.part_size) ;
		this.file_info.done_parts = data.done_parts ;
		this.file_info.part_sum = parseFloat(data.part_sum) ;
		this.file_info.part_now = 0 ;
		this.file_info.__upload_size_complete = 0 ;
		this.__UploadPart__();
	};
	//上传分块
	Ossupload.ossupload.prototype.__UploadPart__=function(){
		this.__ProgressUpload__('上传中...');
		for ( ; this.file_info.part_now<=this.file_info.part_sum ; this.file_info.part_now++ ) {
			if (this.file_info.part_now===0||Ossupload.inArray(this.file_info.part_now,this.file_info.done_parts)) {
				continue;
			}
			this.__GetUploadPartMd5__();
			return;
		}
		this.__CompleteUploadSubmit__();
	};
	//获取分块Md5
	Ossupload.ossupload.prototype.__GetUploadPartMd5__=function(){
		this.file_info.__state = 'getUploadPartMd5';
		//用户取消上传
		if (this.__is_abort === true) {
			return false;
		}
		//计算切片起点 (当前块-1)*分块大小
		this.__read_size_pos = this.file_info.part_size*(this.file_info.part_now-1);
		//更改已经上传完成的字节数
		this.file_info.__upload_size_complete = this.__read_size_pos ;
		//结尾
		this.__read_size_end = Math.min(this.__read_size_pos + this.file_info.part_size, this.file_size);


		var blob_slice;
		//切片
		if (this.file.slice) {
			blob_slice = this.file.slice(this.__read_size_pos, this.__read_size_end);
		} else if (this.file.webkitSlice) {
			blob_slice = this.file.webkitSlice(this.__read_size_pos, this.__read_size_end);
		}
		//this.file_info.part_now
		var fileReader = new FileReader();
		fileReader.UThis = this;
		//文件读取后的处理
		fileReader.onload = function(e) {
			this.UThis.file_info.__state = 'progressiveReadNextRunEnd';
			//用户取消上传
			if (this.UThis.__is_abort === true) {
				return false;
			}
			//处理数据
			this.UThis.__GetUploadPartSign__(e.target.result);
		};
		fileReader.onerror = function(e) {
			this.UThis.file_info.__state = 'getUploadPartMd5Error';
			//用户取消上传
			if (this.UThis.__is_abort === true) {
				return false;
			}
			this.UThis.Error('load file '+this.UThis.file_name+' error','LOAD_FILE_ERROR',(e&&e.stack)||e);
		};
		//开始读流
		try{
			fileReader.readAsArrayBuffer(blob_slice);
		}catch(e){
			this.Error('load file '+this.file_name+' error','LOAD_FILE_ERROR');
		}
	};
	//得到文件流
	Ossupload.ossupload.prototype.__GetUploadPartSign__=function(raw_data){
		var ossuploadThis = this ;
		//状态为获取分块信息
		this.file_info.__state = 'getUploadPartSign';
		var content_md5 = Ossupload.md5Base64(Ossupload.sign.arrayBufferToWordArray(raw_data));
		//用户取消上传
		if (this.__is_abort === true) {
			return false;
		}
		if (Ossupload.type(this.getUploadPartSign,'function')){
			this.getUploadPartSign(this.file_info,function(data){
				ossuploadThis.__CheckUploadPartSign__(data);
			});
		}else{
			//获取file_id
			Ossupload.ajax({
				url:(this.getUploadPartSignUrl||'v1_0/upload/file_part_md5'),
				type:'PUT',
				dataType:'json',
				data:{
					device_type:this.device_type||'html5',
					file_id:this.file_info.file_id,
					file_crc32:this.file_info.file_crc32,
					file_md5:this.file_info.file_md5,
					file_sha1:this.file_info.file_sha1,
					part_number:this.file_info.part_now,
					part_length:((this.__read_size_end - this.__read_size_pos)||0),
					md5_base64:content_md5
				},
				error:function(XHR, TS, ET,error_data){
					ossuploadThis.Error(Ossupload.type(error_data,'object')&&error_data.msg||ET,ET,TS);
				},
				success:function(data){
					ossuploadThis.__CheckUploadPartSign__(data.data,raw_data);
				}
			});
		}
	};
	//得到文件流
	Ossupload.ossupload.prototype.__CheckUploadPartSign__=function(data,raw_data){
		//状态为签名前
		this.file_info.__state = 'checkUploadPartSign';
		//用户取消上传
		if (this.__is_abort === true) {
			return false;
		}
		if (!data.url) {
			this.Error('server return url error','SERVER_RETURN_URL_ERROR');
		}
		if (!data.method) {
			this.Error('server return method error','SERVER_RETURN_METHOD_ERROR');
		}
		if (!data.headers) {
			this.Error('server return headers error','SERVER_RETURN_HEADERS_ERROR');
		}
		this.__SendUploadPart__(data,raw_data);
		data = undefined ;
		raw_data = undefined ;
	};
	//得到文件流
	Ossupload.ossupload.prototype.__SendUploadPart__=function(data,raw_data){
		var ossuploadThis = this ;
		//状态为签名前
		this.file_info.__state = 'sendUploadPart';
		//用户取消上传
		if (this.__is_abort === true) {
			return false;
		}
		var o = {
			'url':data.url,//请求url
			'type':data.method,//请求协议 put
			'headers':data.headers,//请求头
			'dataType':'text',//返回格式
			'cache':false,//不缓存
			'crossDomain':true,//跨域
			"processData": false,//因为是上传二进制数据，所有没有参数
			'data':raw_data,//因为是上传二进制数据，所有没有参数
			error:function(XHR, TS, ET,error_data){
				ossuploadThis.Error(Ossupload.type(error_data,'object')&&error_data.msg||ET,ET,TS);
			},
			success:function(data){
				ossuploadThis.file_info.done_parts.push(ossuploadThis.file_info.part_now);
				//读取下一片
				ossuploadThis.__UploadPart__();
			}
		};
		if (data.headers['Content-Type']){
			o.contentType=data.headers['Content-Type'];//请求
		}
		$.ajax(o);
		o = undefined ;
		data = undefined ;
		raw_data = undefined ;
	};
	//合并文件
	Ossupload.ossupload.prototype.__CompleteUploadSubmit__=function(){
		var ossuploadThis = this ;
		//状态为签名前
		this.file_info.__state = 'completeUploadPartMd5';
		//用户取消上传
		if (this.__is_abort === true) {
			return false;
		}
		if (Ossupload.type(this.completeUpload,'function')){
			this.completeUpload(this.file_info,function(data){
				ossuploadThis.__CheckCompleteUpload__(data);
			});
		}else{
			//获取file_id
			Ossupload.ajax({
				url:(this.completeUploadUrl||'v1_0/upload/complete'),
				type:'POST',
				dataType:'json',
				data:{
					file_id:this.file_info.file_id,
					file_crc32:this.file_info.file_crc32,
					file_md5:this.file_info.file_md5,
					file_sha1:this.file_info.file_sha1
				},
				error:function(XHR, TS, ET,error_data){
					ossuploadThis.Error(Ossupload.type(error_data,'object')&&error_data.msg||ET,ET,TS);
				},
				success:function(data){
					ossuploadThis.__CheckCompleteUpload__();
				}
			});
		}
	};
	//合并文件
	Ossupload.ossupload.prototype.__CheckCompleteUpload__=function(){
		this.__CompleteUpload__();
	};
	//合并文件
	Ossupload.ossupload.prototype.__CompleteUpload__=function(){
		//用户取消上传
		if (this.__is_abort === true) {
			return false;
		}
		Ossupload.type(this.complete,'function')&&this.complete(this.file_info);
	};
	//初始化依赖包
	Ossupload.ossupload.prototype.__Abort__=function(){
		Ossupload.type(this.onAbort,'function')&&this.onAbort(this.file_info);
	};
	//初始化依赖包
	Ossupload.ossupload.prototype.abort=function(){
		this.__is_abort = true ;
		switch (this.file_info.__state) {
			//状态为 [签名前][签名进行中] 调用取消签名
			case 'beforeSign':
			case 'progressSign':
			this.sign.abort();break;
			case 'true':
				//通过
				break;

			//状态为这些 直接不操作
			case 'init'://[初始化]
			case 'errorSign'://[签名异常]
			case 'completeSign'://[签名完成]
			case 'getPartSize'://[获取分块大小]
			case 'getFileInfo'://[准备获取文件签名信息]
			case 'getFileId'://[获取文件id]
			case 'checkFileId'://[检测返回文件id]
			case 'getFilePartInfo'://[获取文件分块信息]
			case 'checkFilePartInfo'://[检测块信息]
			case 'getUploadPartMd5'://[获取块的md5]
			case 'getUploadPartMd5Error'://[获取块的md5错误]
			case 'getUploadPartSign'://[获取上传块的签名]
			case 'checkUploadPartSign'://[检测上传块的签名]
			case 'sendUploadPart'://[发送上传块]
			case 'completeUploadPartMd5'://[发送上传块]
			case 'progressUpload'://[发送上传块]
			break;
			//默认没有操作
			default:
			break;
		}
		//通知
		this.__Abort__();
	};



	//错误处理
	Ossupload.ossupload.prototype.Error=function(message,type,description){
		var error = new Ossupload.Error(message,type,description);
		if (this.error&&Ossupload.type(this.error,'function')){
			this.error(error.message,error.type,error.description,error);
		}else{
			throw error;
		}
	};





	Ossupload.md5Base64 = function(data){
		return Ossupload.CryptoJS.MD5(data).toString(Ossupload.CryptoJS.enc.Base64);
	};
	//获取当前时间结束
	Ossupload.type=function (obj , istype) {
		obj = obj!==undefined?obj:undefined ;
		istype = istype || undefined ;
		var type,r ;
		if ( obj === null || obj === undefined ) {
			type = obj + '';
		}else{
			try{
				type = (typeof(obj)==='undefined') ? 'undefined' : (Object.prototype.toString.call(obj).toString().slice(8, -1).toString().toLowerCase());
			}catch(e){
				obj = 'object';
			}
		}
		try{
			r = (typeof(istype)==='string') ? ( type.toString().toLowerCase() === istype.toString().toLowerCase()) : type;
		}catch(e){
			r=false;
		}
		obj = undefined ;
		type = undefined ;
		istype = undefined ;
		return r ;
	};
	//类似php里面的inArray
	Ossupload.inArray=function (a,b){
		if(!(Ossupload.type(b,'array')||Ossupload.type(b,'object'))){
			return false;
		}
		for(var i in b){
			if(b[i]==a){
				return true;
			}
		}
		return false;
	};
	Ossupload.Error = function(message,type,description){
		this.name = 'Ossupload.Error';
		this.type = type;
		this.message = message || 'Unknown Error';
		this.stack = (new Error(this.message)).stack;
		this.event_error = description||'';
		this.description = this.stack+'\n'+this.event_error;
		message=undefined;
		type=undefined;
		description=undefined;
	};
	Ossupload.Error.prototype = Object.create(Error.prototype);
	Ossupload.Error.prototype.constructor = Ossupload.Error;

	if ( typeof define === 'function' && define.amd ) {
		define( 'filetool.ossupload', [], function() {
			return ossupload;
		});
	}
	filetool.ossupload = ossupload;
	filetool = undefined ;
	return ossupload;
}));
