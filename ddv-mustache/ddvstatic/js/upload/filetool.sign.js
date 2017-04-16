/*
使用方式
//进行签名
sign.setCryptoJS(CryptoJS);
sign.setCrc32(Crc32);
sign({
	file:this.file,
	beforeSign:function(SIGN){
		return ossuploadThis._BeforeSign(SIGN);
	},
	progress:function(e){
		ossuploadThis._ProgressSign(e);
	},
	error:function(message,type,description,error){
		ossuploadThis.Error(message,type,description);
		ossuploadThis = undefined ;
	},
	complete:function(SIGN){
		ossuploadThis._CompleteSign(SIGN);
		ossuploadThis = undefined ;
	}
});
*/

(function( global, factory ) {
		factory( global );
}(typeof window !== "undefined" ? window : this, function( window ) {
	var strundefined = typeof undefined;
	var filetool = window.filetool = window.filetool || {};
	if (typeof filetool.sign === 'function') {return filetool.sign;}
	var sign = function() {
		if (!(this instanceof sign)) {
			return sign.sign.apply(Sign,arguments);
		}
	};
	var Sign = new sign();
	sign.setCryptoJS = function(CryptoJS){
		sign.CryptoJS = CryptoJS;
	};
	sign.setCrc32 = function(Crc32){
		sign.Crc32 = Crc32;
	};
	sign.sign = function(){
		return Sign.sign.apply(Sign,arguments);
	};
	Sign.isCompatible=function(){
		try {
			// Check for FileApi
			if (typeof FileReader == 'undefined') return false;

			// Check for Blob and slice api
			if ( typeof Blob == 'undefined') return false;

		} catch (e) {
			return false;
		}
		return true;
	};
	Sign.clone=function(myObj){
		if(!(myObj&&(Sign.type(myObj,'object')||Sign.type(myObj,'array')))){
			return myObj;
		}
		if(myObj === null||myObj === undefined){
			return myObj;
		}
		var myNewObj = '';
		if(Sign.type(myObj,'object')) {
			myNewObj = {};
			//防止克隆ie下克隆  Element 出问题
			if (myObj.innerHTML!==undefined&&myObj.innerText!==undefined&&myObj.tagName!==undefined&&myObj.tabIndex!==undefined) {
				myNewObj = myObj ;
			}else{
				for(var i in myObj){
					myNewObj[i] = Sign.clone(myObj[i]);
				}
			}
		}else if(Sign.type(myObj,'array')) {
			myNewObj = [];
			for (var i = 0; i < myObj.length; i++) {
				myNewObj.push(myObj[i]);
			}
		}
		return myNewObj;
	};
	Sign.sign = function(o){
		if (!(this instanceof Sign.sign)) {
			return new Sign.sign(o);
		}
		var key;
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
	Sign.sign.prototype.__initCheck__=function(){
		if (this.__initCheckLock === true) {
			return true;
		}
		this.file = this.file || undefined;
		if (!Sign.isCompatible()) {
			this.Error('Your browser does not support FileReader Or Blob','NOT_SUPPORT_FILEREADER_OR_BLOB','Your browser does not support FileReader AND Blob!Replace the advanced browser, tools to support this function!');
			return false;
		}else if (this.file===undefined||this.file===null){
			this.Error('Signature file not found','SIGNATURE_FILE_NOT_FOUND','Signature file not found');
			return false;
		}
		//计算文件大小
		this.file_size = this.file.size;
		this.file_name = this.file.name;
		this.file_type = this.file.type;
		this.file_info = {};
		//文件名称
		this.file_info.file_name = this.file_name ;
		//文件类型
		this.file_info.file_type = this.file_type ;
		//文件大小
		this.file_info.file_size = this.file_size ;
		//最后修改日期时间戳
		this.file_info.__last_modified = this.file.lastModified/1000;
		//最后修改日期对象
		this.file_info.__last_modified_date__ = this.file.lastModifiedDate;
		//签名实例化对象
		this.file_info.__sign__ = this ; 
		//开始时间
		this.file_info.__start_time = (new Date()).getTime()/1000;
		//已经签名的大小
		this.__pos = 0;
		//加载总个数
		this.__switch_len = 0 ;
		//加载完成个数
		this.__switch_end=0;
		//默认没有前回调
		this.beforeSign = this.beforeSign || undefined ;
		//默认没有进度回调
		this.progress = this.progress || undefined ;
		//默认没有完成回调
		this.complete = this.complete || undefined ;
		//默认没有错误回调
		this.error = this.error || undefined ;
		//标记已经通过检测
		this.__initCheckLock = true ;
		return true;
	};
	Sign.sign.prototype.__init__=function(){
		this.__state = 'beforeSign';
		//用户取消上传
		if (this.__is_abort === true) {
			return false;
		}
		if (!this.__initCheck__()) {
			return ;
		}
		//用户取消上传
		if (this.__is_abort === true) {
			return false;
		}
		if (Sign.type(this.beforeSign,'function')&&this.beforeSign(this.file_info)===false) {
			return ;
		}
		this.switch = Sign.type(this.switch,'array')&&this.switch.length>0?this.switch:['crc32','md5','sha1'];
		var partmd5 = Sign.indexOf(this.switch,'partmd5');
		if (partmd5>-1) {
			this.switch.splice(partmd5,1);
			this.__isPartMd5 = true;
			if (!Sign.inArray('md5',this.switch)) {
				this.switch.push('md5');
			}
		}
		//默认 不需要 crc32
		this.__isSignCrc32 = false;
		if (Sign.inArray('crc32',this.switch)) {
			//需要依赖crc32
			this.__isSignCrc32 = true;
		}
		//默认 不需要 CryptoJS
		this.__isSignCryptoJS = false;
		if (this.__isSignCrc32&&this.switch.length>1){
			//需要依赖 CryptoJS
			this.__isSignCryptoJS = true;
		}else if((!this.__isSignCrc32)&&this.switch.length>0){
			//需要依赖 CryptoJS
			this.__isSignCryptoJS = true;
		}
		//初始化依赖包
		this.__initLib__();
	};
	//初始化依赖包
	Sign.sign.prototype.__initLib__=function(){
		var i,libname ;
		//需要加载的个数
		this.__switch_len = this.switch.length || 0 ;
		//加载完成个数
		this.__switch_end=0;
		this.__readpos = 0;
		//加载核心库
		if (this.__isSignCryptoJS) {
			this.__initLibCryptoJSCore__();
		}
		//循环加载依赖库
		for (i=0;i<this.__switch_len;i++) {
			libname = this.switch[i] ;
			if (!Sign.type(libname,'string')) {
				try{
					libname = libname.toString();
				}catch(e){
					this.__switch_len--;
					libname = '';
					continue ;
				}
			}
			//转大写
			libname = libname.toUpperCase();
			if (libname=='CRC32'){
				this.__initLibCrc32__();
			}else{
				this.__initLibCryptoJSLib__(libname);
			}
		}
		//加载核心库统计数
		if (this.__isSignCryptoJS) {
			this.__switch_len++;
		}
		i = undefined ; libname = undefined ;
	};
	//初始化依赖包
	Sign.sign.prototype.__initLibCrc32__=function(){
		if(Sign.type(sign.Crc32,'function')){
			this.__switch_end ++ ;
			this.__initLibCheck__();
			return ;
		}else if(!Sign.type(APP.__rLoad.require,'function')){
				signThis.Error('load libraries crc32 error','LOAD_LIB_CRC32_ERROR','requirejs not find!');
		}else{
			var signThis = this ; 
			APP.__rLoad.require(['CRC32'],function(crc32){
				sign.Crc32 = crc32 ; crc32 = undefined ;
				signThis.__switch_end ++ ;
				signThis.__initLibCheck__();
			},function(error){
				signThis.Error('load libraries crc32 error','LOAD_LIB_CRC32_ERROR',error.stack||'');
				error = undefined ;
			});
		}
	};
	//初始化依赖包
	Sign.sign.prototype.__initLibCryptoJSCore__=function(){
		if(Sign.type(sign.CryptoJS,'function')){
			this.__switch_end ++ ;
			this.__initLibCheck__();
			return ;
		}else if(!Sign.type(APP.__rLoad.require,'function')){
				signThis.Error('load libraries CryptoJS error','LOAD_LIB_CRYPTOJS_ERROR','requirejs not find!');
		}else{
			var signThis = this ; 
			APP.__rLoad.require(['CryptoJS'],function(CryptoJS){
				sign.CryptoJS = CryptoJS ; CryptoJS = undefined ;
				signThis.__switch_end ++ ;
				signThis.__initLibCheck__();
			},function(error){
				signThis.Error('load libraries CryptoJS error','LOAD_LIB_CRYPTOJS_ERROR',error.stack||'');
				error = undefined ;
			});
		}
	};
	//初始化依赖包
	Sign.sign.prototype.__initLibCryptoJSLib__=function(CryptoJSLibName){
		//加载 CryptoJS 扩展包
		if(Sign.CryptoJSLib[CryptoJSLibName]&&Sign.CryptoJSLib[CryptoJSLibName]===true&&sign.CryptoJS[CryptoJSLibName]){
			this.__switch_end ++ ;
			this.__initLibCheck__();
		}else if(!Sign.type(APP.__rLoad.require,'function')){
				signThis.Error('load libraries '+CryptoJSLibName+' error','LOAD_LIB_'+CryptoJSLibName+'_ERROR','requirejs not find!');
		}else{
			var signThis = this ; 
			APP.__rLoad.require(['CryptoJS'+CryptoJSLibName],function(){
				Sign.CryptoJSAlgorithms.push({
					name: CryptoJSLibName,
					algo: sign.CryptoJS.algo[CryptoJSLibName],
					param:undefined
				});
				Sign.CryptoJSLib[CryptoJSLibName]=true;
				signThis.__switch_end ++ ;
				signThis.__initLibCheck__();
			},function(error){
				signThis.Error('load libraries '+CryptoJSLibName+' error','LOAD_LIB_'+CryptoJSLibName+'_ERROR',error.stack);
			});
		}
	};
	//初始化依赖包
	Sign.sign.prototype.__initLibCheck__=function(){
		this.__Progress__('加载依赖库');
		if (this.__switch_len===this.__switch_end&&this.__is_lock_run !== true){
			this.__Run__();
		}
	};
	Sign.sign.prototype.__Run__=function(){
		//如果已经启动过，拦截本次操作
		if (this.__is_lock_run === true) {
			return ;
		}
		//锁定
		this.__is_lock_run = true ;
		this.__state = 'beforeReadFile';
		//用户取消上传
		if (this.__is_abort === true) {
			return false;
		}
		//开启签名模块
		this.__enabledAlgorithms = [];
		var i,len,current ;
		len = Sign.CryptoJSAlgorithms.length ;
		for (i = 0; i < len; i++) {
			current = Sign.CryptoJSAlgorithms[i];
			if (Sign.inArray(current.name.toString().toLocaleLowerCase(),this.switch)) {
				this.__enabledAlgorithms.push({
					name: current.name,
					instance: current.algo.create(current.param)
				});
			}
		}
		// Special case CRC32 as it's not part of CryptoJS and takes another input format.
		if (this.__isSignCrc32) {
			this.__crc32intermediate = 0;
		}
		// 
		if (this.__isPartMd5) {
			this.__PartMd5Length=0;
			this.__PartMd5='';
			this.__PartMd5Lower='';
			this.__PartMd5Upper='';
		}
		//开始时间
		this.file_info.__read_time = (new Date()).getTime()/1000;
		this.__state = 'readFileing';
		//文件读取进程开始
		this.__progressiveRead__();
		i = undefined ; len = undefined ; current = undefined ;
	};
	//开始读文件
	Sign.sign.prototype.__progressiveRead__=function(){
		this.__state = 'progressiveRead';
		this.part_size = this.part_size||2*1024*1024; // 20KiB at a time
		this.__pos = 0;
		this.__progressiveReadNext__();
	};
	//延时读取下一片
	Sign.sign.prototype.__progressiveReadNext__=function(){
		this.__state = 'progressiveReadNext';
		//用户取消上传
		if (this.__is_abort === true) {
			return false;
		}
		var signThis = this ;
		Sign.type(signThis.__progressiveReadNextRun__,'function')&&signThis.__progressiveReadNextRun__();
	};
	//读取下一片
	Sign.sign.prototype.__progressiveReadNextRun__=function(){
		//如果是读取中，拦截本次操作
		if (this.__is_lock_read === true) {
			return ;
		}
		//加锁
		this.__is_lock_read = true ;
		//标记状态
		this.__state = 'progressiveReadNextRun';
		//用户取消上传
		if (this.__is_abort === true) {
			return false;
		}
		this._read_size_end = Math.min(this.__pos + this.part_size, this.file_size);
		var blob_slice;
		//切片
		if (this.file.slice) {
			blob_slice = this.file.slice(this.__pos, this._read_size_end);
		} else if (this.file.webkitSlice) {
			blob_slice = this.file.webkitSlice(this.__pos, this._read_size_end);
		}
		var fileReader = new FileReader();
			fileReader.signThis = this;
			//文件读取后的处理
			fileReader.onload = function(e) {
				this.__state = 'progressiveReadNextRunEnd';
				//用户取消上传
				if (this.signThis.__is_abort === true) {
					return false;
				}
				this.signThis.__pos = this.signThis._read_size_end;
				this.signThis.__readpos = this.signThis.__pos;
				//处理数据
				this.signThis.__progressiveReadWork__(e.target.result);
				if (this.signThis.__pos < this.signThis.file_size) {
					//解锁锁
					this.signThis.__is_lock_read = false ;
					//读取下一片
					this.signThis.__progressiveReadNext__();
				} else {
					// 完成
					this.signThis.__progressiveReadDone__();
				}
			};
			fileReader.onerror = function(e) {
				this.__state = 'progressiveReadNextRunError';
				//用户取消上传
				if (this.signThis.__is_abort === true) {
					return false;
				}
				this.signThis.Error('load file '+this.signThis.file_name+' error','LOAD_FILE_ERROR',(e&&e.stack)||e);
			};
			this.__state = 'progressiveReadNextRunIng';
			//开始读流
			try{
				fileReader.readAsArrayBuffer(blob_slice);
			}catch(e){
				this.Error('load file '+this.file_name+' error','LOAD_FILE_ERROR');
			}
			
		blob_slice = undefined ;
		fileReader = undefined ;
	};
	//进程信息
	Sign.sign.prototype.__progressiveReadWork__=function(data){
		this.__Progress__('签名中...');
		var p = {};
			// Work
			if (this.__enabledAlgorithms.length > 0) {
				p.wordArray = sign.arrayBufferToWordArray(data);
			}

			if (this.__isPartMd5) {
				this.__PartMd5Length++;
				this.__PartMd5 += sign.CryptoJS.MD5(p.wordArray).toString(sign.CryptoJS.enc.Hex);
			}

			p.i = 0 ;
			p.len = this.__enabledAlgorithms.length ;
			for (p.i = 0; p.i < p.len ; p.i++) {
				this.__enabledAlgorithms[p.i].instance.update(p.wordArray);
			}
			delete p.i;
			delete p.len;

			//crc32
			if (this.__isSignCrc32) {
				this.__crc32intermediate = sign.Crc32(new Uint8Array(data), this.__crc32intermediate);
			}
			p = undefined ;
	};
	Sign.sign.prototype.__progressiveReadDone__=function(){
		if (this.__isProgressiveReadDone) {
			return false ;
		}
		this.__isProgressiveReadDone = true;
		this.__state = 'readFileDone';
		var p = {} ;
		this.file_info.__end_time = (new Date()).getTime() / 1000 ;
		this.file_info.__sign_time = ( this.file_info.__end_time*1000 - this.file_info.__start_time*1000) / 1000 ;

		//crc32
		if (this.__isSignCrc32) {
			this.file_info.file_crc32 = sign.Crc32(this.__crc32intermediate,true).toUpperCase();
		}
		if (this.__isPartMd5) {
			this.__PartMd5Upper = sign.CryptoJS.MD5(this.__PartMd5.toUpperCase()).toString(sign.CryptoJS.enc.Hex) ;
			this.__PartMd5Lower = sign.CryptoJS.MD5(this.__PartMd5.toLowerCase()).toString(sign.CryptoJS.enc.Hex) ;
			this.__PartMd5Upper = (this.__PartMd5Upper + '-' + this.__PartMd5Length.toString()).toUpperCase() ;
			this.__PartMd5Lower = (this.__PartMd5Lower + '-' + this.__PartMd5Length.toString()).toUpperCase() ;

			this.file_info.file_part_md5_upper = this.__PartMd5Upper;
			this.file_info.file_part_md5_lower = this.__PartMd5Lower;
		}
		//其它加密信息
		p.i = 0 ;
		p.len = this.__enabledAlgorithms.length ;
		for (p.i = 0; p.i < p.len ; p.i++) {
			this.file_info['file_'+this.__enabledAlgorithms[p.i].name.toLowerCase()] = this.__enabledAlgorithms[p.i].instance.finalize().toString(sign.CryptoJS.enc.Hex).toUpperCase() ;
		}
		delete p.i;
		delete p.len;

		//回调反馈
		p = Sign.type(this.complete,'function')&&this.complete(this.file_info);
		p = undefined;
		this.remove();
	};
	Sign.sign.prototype.remove=function(){
		setTimeout(function(this_obj){
			this_obj = undefined ; delete this_obj;
		},0,this);
	};
	//取消签名
	Sign.sign.prototype.abort=function(){
		//console.error('用户取消签名');
		this.__is_abort = true ;
		switch (this.__state) {
			//状态为 分片数据读取中 调用取消读取操作
			case 'progressiveReadNextRunIng':
			//	fileReader.abort();
			break;


			//状态为这些 直接不操作
			case 'init'://[初始化]
			case 'beforeSign'://[读文件前]
			case 'beforeReadFile'://[开始读]
			case 'readFileDone'://[读文件完毕]
			case 'readFileing'://[准备读文件ing]
			case 'progressiveRead'://[获取分片信息]
			case 'progressiveReadNext'://[准备读取下一片信息]
			case 'progressiveReadNextRun'://[读取下一片信息]
			case 'progressiveReadNextRunEnd'://[读取下一片信息结束]
			case 'progressiveReadNextRunError'://[读取下一片信息错误]
			break;
			//默认没有操作
			default:break;
		}
	};
	//进程信息
	Sign.sign.prototype.__Progress__=function(msg){
		var data = {};
			data.msg = msg||'签名中...';msg = undefined;
			data.progress = ((this.__switch_end+this.__readpos)/(this.file_size+this.__switch_len)).toFixed(4)*1;
			data = Sign.type(this.progress,'function')&&this.progress(data)&&undefined;
	};
	//错误处理
	Sign.sign.prototype.Error=function(message,type,description){
		var error = new Sign.Error(message,type,description);
		if (this.error&&Sign.type(this.error,'function')){
			this.error(error.message,error.type,error.description,error);
		}else{
			throw error;
		}
	};
	//获取当前时间结束
	Sign.type=function (obj , istype) {
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
	Sign.indexOf = function( list, elem ) {
		var i = 0,
			len = list.length;
		for ( ; i < len; i++ ) {
			if ( list[i] === elem ) {
				return i;
			}
		}
		return -1;
	};
	//类似php里面的inArray
	Sign.inArray=function (a,b){
		if(!(Sign.type(b,'array')||Sign.type(b,'object'))){
			return false;
		}
		for(var i in b){
			if(b[i]==a){
				return true;
			}
		}
		return false;
	};
	Sign.Error = function(message,type,description){
		this.name = 'Sign.Error';
		this.type = type;
		this.message = message || 'Unknown Error';
		this.stack = (new Error(this.message)).stack;
		this.event_error = description||'';
		this.description = this.stack+'\n'+this.event_error;
		message=undefined;
		type=undefined;
		description=undefined;
	};
	Sign.Error.prototype = Object.create(Error.prototype);
	Sign.Error.prototype.constructor = Sign.Error;
	//扩展库
	Sign.CryptoJSLib = {};
	Sign.CryptoJSAlgorithms = [];
	sign.arrayBufferToWordArray=function(arrayBuffer){
		var p = {};
			p.fullWords = Math.floor(arrayBuffer.byteLength / 4);
			p.bytesLeft = arrayBuffer.byteLength % 4;

			p.u32 = new Uint32Array(arrayBuffer, 0, p.fullWords);
			p.u8 = new Uint8Array(arrayBuffer);

			p.cp = [];
			p.i = 0;
			for (p.i = 0; p.i < p.fullWords; ++p.i) {
				p.cp.push(Sign.__swapendian32__(p.u32[p.i]));
			}

			if (p.bytesLeft) {
				p.pad = 0;
				p.i = p.bytesLeft;
				for (p.i = p.bytesLeft; p.i > 0; --p.i) {
					p.pad = p.pad << 8;
					p.pad += p.u8[p.u8.byteLength - p.i];
				}
				p.i = 0;
				for (p.i = 0; p.i < 4 - p.bytesLeft; ++p.i) {
					p.pad = p.pad << 8;
				}

				p.cp.push(p.pad);
			}
			p.r = sign.CryptoJS.lib.WordArray.create(p.cp, arrayBuffer.byteLength);

			p = p.r ;
		return p ;
	};
	Sign.__swapendian32__=function(val) {
		return (((val & 0xFF) << 24) | ((val & 0xFF00) << 8) | ((val >> 8) & 0xFF00) | ((val >> 24) & 0xFF)) >>> 0;
	};

	if ( typeof define === 'function' && define.amd ) {
		define( 'filetool.sign', [], function() {
			return sign;
		});
	}
	filetool.sign = sign;
	filetool = undefined ;
	return sign;
}));
