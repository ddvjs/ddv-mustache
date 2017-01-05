define( function(){
	return function(often){
		var G;
		try{
			G = window ;
		}catch(e){}
		try{
			if(!G){
				G = global ;
			}
		}catch(e){}
		often = often||{};

		//取得浏览器的userAgent字符串
		often.userAgentStr = often.userAgent||navigator.userAgent;
		often.userAgentLower = often.userAgentStr.toLowerCase();
		often.is = often.is || often.inherit(null);
		often.each('opera maxthon mozilla firefox chrome windows mac android blackberry webos iphone ipod ipad'.split(' '),function(index, isType) {
			often.is[isType] = RegExp(isType).test(often.userAgentLower) ;
		});

		//判断ie678，ie是678版本返回true
		often.is.ie678 = ( !-[1,] )||false ;
		//判断ie6 7 8 9 10 11，ie是6 7 8 9 10 11版本返回true
		often.is.ie = (!!G.ActiveXObject || 'ActiveXObject' in G)||false ;
		//确认ie浏览器
		often.is.ie6 = often.is.ie678&&!G.XMLHttpRequest;
		often.is.ie8 = often.is.ie678&&!!document.documentMode;
		often.is.ie7 = often.is.ie678&&!often.is.ie6&&!often.is.ie8;
		often.is.ff = often.is.firefox;

		//判断是否Safari
		often.is.safari = /webkit/.test(often.userAgentLower)&&/safari/.test(often.userAgentLower)&& (!often.is.chrome) ;
		//判断是否使用ios系统
		often.is.ios = often.is.iphone||often.is.ipod||often.is.ipad ;
		//判断是否使用android系统
		often.is.winphone = !!often.userAgentLower.match(/Windows Phone/i) ;
		//是否在移动端打开
		often.is.mobile = !!often.userAgentLower.match(/AppleWebKit.*Mobile.*/i) ;
		//判断支持flash
		often.is.flash = (function(G){
			var t,r=true ;
			try{
				t = new ActiveXObject('ShockwaveFlash.ShockwaveFlash');
			}catch(e){
				t = undefined ;
				try{
					t = navigator.plugins['Shockwave Flash'];
					r = (t !== undefined) ;
				}catch(e){
					r = false ;
				}
			}
			t = undefined ;
			return r ;
		}(G)) ;
		often.get.device_os = 'other';
		often.each('windows android ios webos blackberry'.split(' '),function(index, sys) {
			if (often.is[sys]) {
				often.get[sys] = sys;
			}
		});

		often.get.browser_type = 'web';
		if (often.is.mobile) {//判断是否是移动设备打开。browser代码在下面
			if (often.userAgentLower.match(/MicroMessenger/i) == "micromessenger") {
				often.get.browser_type = 'wxmp';//在微信中打开
			}else if (often.userAgentLower.match(/WeiBo/i) == "weibo") {
				often.get.browser_type = 'sina';//在新浪微博客户端打开
			}else if (often.userAgentLower.match(/QQ/i) == "qq") {
				often.get.browser_type = 'qq';//在QQ空间打开
			}else if (often.is.ios) {
				often.get.browser_type = 'ios';//是否在IOS浏览器打开
			}else if(often.is.android){
				often.get.browser_type = 'android';//是否在安卓浏览器打开
			}else{
				often.get.browser_type = 'other_mobile';//其它
			}
		}

		/**
		 * [formatCurrency 格式化人民币]
		 * @author: 桦 <yuchonghua@163.com>
		 * @DateTime 2016-04-29T11:40:43+0800
		 * @param    {string}  	num [金额]
		 * @return   {string}  	    [格式化后的金额]
		 */
		 often.formatCurrency=function(num) {
			num = num||'0';
			num = num.toString().replace(/\$|\,/g,'');
			if(isNaN(num))
				num = "0";
			sign = (num == (num = Math.abs(num)));
			num = Math.floor(num*100+0.50000000001);
			cents = num%100;
			num = Math.floor(num/100).toString();
			if(cents<10)
				cents = "0" + cents;
			for (var i = 0; i < Math.floor((num.length-(1+i))/3); i++)
				num = num.substring(0,num.length-(4*i+3))+','+
			num.substring(num.length-(4*i+3));
			return (((sign)?'':'-') + num + '.' + cents);
		 };

		/**
		 * [gmdate 和PHP一样的时间戳格式化函数 格式化后是格林时间]
		 * @author: 桦 <yuchonghua@163.com>
		 * @DateTime 2016-04-29T11:42:09+0800
		 * @param    {string}              format    [格式格式时间]
		 * @param    {int}                 timestamp [要格式化的时间 默认为当前时间]
		 * @return   {string}                        [格式化的时间字符串]
		 */
		 often.gmdate = function  ( format, timestamp ) {
			timestamp = (timestamp===undefined)?this.time():timestamp;
			timestamp = parseInt(timestamp)+(60*(new Date()).getTimezoneOffset());
			return this.date(format, timestamp);
		 };
		/**
		 * [date 和PHP一样的时间戳格式化函数 格式化后是本地时间]
		 * @author: 桦 <yuchonghua@163.com>
		 * @DateTime 2016-04-29T11:42:09+0800
		 * @param    {string}              format    [本地格式时间]
		 * @param    {int}                 timestamp [要格式化的时间 默认为当前时间]
		 * @return   {string}                        [格式化的时间字符串]
		 */
		 often.date = function  ( format, timestamp ) {
			var a, jsdate=((timestamp) ? new Date(timestamp*1000) : new Date());
			var pad = function(n, c){
				if( (n = n + "").length < c ) {
					return new Array(++c - n.length).join("0") + n;
				} else {
					return n;
				}
			};
			var txt_weekdays = ["Sunday","Monday","Tuesday","Wednesday", "Thursday","Friday","Saturday"];

			var txt_ordin = {1:"st",2:"nd",3:"rd",21:"st",22:"nd",23:"rd",31:"st"};

			var txt_months = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

			var f = {
				// Day
				d: function(){
					return pad(f.j(), 2);
				},
				D: function(){
					t = f.l(); return t.substr(0,3);
				},
				j: function(){
					return jsdate.getDate();
				},
				l: function(){
					return txt_weekdays[f.w()];
				},
				N: function(){
					return f.w() + 1;
				},
				S: function(){
					return txt_ordin[f.j()] ? txt_ordin[f.j()] : 'th';
				},
				w: function(){
					return jsdate.getDay();
				},
				z: function(){
					return (jsdate - new Date(jsdate.getFullYear() + "/1/1")) / 864e5 >> 0;
				},

				// Week
				W: function(){
					var a = f.z(), b = 364 + f.L() - a;
					var nd2, nd = (new Date(jsdate.getFullYear() + "/1/1").getDay() || 7) - 1;

					if(b <= 2 && ((jsdate.getDay() || 7) - 1) <= 2 - b){
						return 1;
					} else{

						if(a <= 2 && nd >= 4 && a >= (6 - nd)){
							nd2 = new Date(jsdate.getFullYear() - 1 + "/12/31");
							return date("W", Math.round(nd2.getTime()/1000));
						} else{
							return (1 + (nd <= 3 ? ((a + nd) / 7) : (a - (7 - nd)) / 7) >> 0);
						}
					}
				},

				// Month
				F: function(){
					return txt_months[f.n()];
				},
				m: function(){
					return pad(f.n(), 2);
				},
				M: function(){
					t = f.F(); return t.substr(0,3);
				},
				n: function(){
					return jsdate.getMonth() + 1;
				},
				t: function(){
					var n;
					if( (n = jsdate.getMonth() + 1) == 2 ){
						return 28 + f.L();
					} else{
						if( n & 1 && n < 8 || !(n & 1) && n > 7 ){
							return 31;
						} else{
							return 30;
						}
					}
				},

				// Year
				L: function(){
					var y = f.Y();
					return (!(y & 3) && (y % 1e2 || !(y % 4e2))) ? 1 : 0;
				},
				//o not supported yet
				Y: function(){
					return jsdate.getFullYear();
				},
				y: function(){
					return (jsdate.getFullYear() + "").slice(2);
				},

				// Time
				a: function(){
					return jsdate.getHours() > 11 ? "pm" : "am";
				},
				A: function(){
					return f.a().toUpperCase();
				},
				B: function(){
					// peter paul koch:
					var off = (jsdate.getTimezoneOffset() + 60)*60;
					var theSeconds = (jsdate.getHours() * 3600) +
					(jsdate.getMinutes() * 60) +
					jsdate.getSeconds() + off;
					var beat = Math.floor(theSeconds/86.4);
					if (beat > 1000) beat -= 1000;
					if (beat < 0) beat += 1000;
					if ((String(beat)).length == 1) beat = "00"+beat;
					if ((String(beat)).length == 2) beat = "0"+beat;
					return beat;
				},
				g: function(){
					return jsdate.getHours() % 12 || 12;
				},
				G: function(){
					return jsdate.getHours();
				},
				h: function(){
					return pad(f.g(), 2);
				},
				H: function(){
					return pad(jsdate.getHours(), 2);
				},
				i: function(){
					return pad(jsdate.getMinutes(), 2);
				},
				s: function(){
					return pad(jsdate.getSeconds(), 2);
				},
				//u not supported yet

				// Timezone
				//e not supported yet
				//I not supported yet
				O: function(){
					var t = pad(Math.abs(jsdate.getTimezoneOffset()/60*100), 4);
					if (jsdate.getTimezoneOffset() > 0) t = "-" + t; else t = "+" + t;
					return t;
				},
				P: function(){
					var O = f.O();
					return (O.substr(0, 3) + ":" + O.substr(3, 2));
				},
				//T not supported yet
				//Z not supported yet

				// Full Date/Time
				c: function(){
					return f.Y() + "-" + f.m() + "-" + f.d() + "T" + f.h() + ":" + f.i() + ":" + f.s() + f.P();
				},
				//r not supported yet
				U: function(){
					return Math.round(jsdate.getTime()/1000);
				}
			};

			return format.replace(/[\\]?([a-zA-Z])/g, function(t, s){
				var ret ;
				if( t!=s ){
					// escaped
					ret = s;
				} else if( f[s] ){
					// a date function exists
					ret = f[s]();
				} else{
					// nothing special
					ret = s;
				}
				return ret;
			});
		};
		/**
		 * [strtotime 类似php的日期转时间戳]
		 * @author: 桦 <yuchonghua@163.com>
		 * @DateTime 2016-04-29T11:48:36+0800
		 * @param    {string}                 datetime [普通日期格式]
		 * @return   {int}                          [秒级时间戳]
		 */
		often.strtotime = function (datetime){
			var p = {};
			p.datetime = datetime || ''; datetime = undefined ;
			p._ = p.datetime.toString().indexOf(' ')==-1?(p.datetime.toString().indexOf(':')==-1?[p.datetime,'']:['',p.datetime]):p.datetime.split(' ');
			p.ymd = p._[0]||'';
			p.his = p._[1]||'';
			p.ymd = p.ymd.toString().indexOf('-')==-1?[p.ymd]:p.ymd.split('-');
			p.his = p.his.toString().indexOf(':')==-1?[p.his]:p.his.split(':');
			p.year = (p.ymd[0]||0) - 0 ;
			p.month = (p.ymd[1]||0) - 1 ;
			p.day = (p.ymd[2]||0) - 0 ;
			p.hour   = p.his[0] - 0;
			p.minute = p.his[1] - 0;
			p.second = p.his[2] - 0;
			//兼容无"时:分:秒"模式
			if((p.his[0]==undefined) || isNaN(p.hour)){
				p.hour=0;
			}
			if((p.his[1]==undefined) || isNaN(p.minute)){
				p.minute=0;
			}
			if((p.his[2]==undefined) || isNaN(p.second)){
				p.second=0;
			}
			p.time = (new Date(p.year, p.month, p.day, p.hour, p.minute, p.second)).getTime();
			p = parseInt( p.time / 1000 );
			return p;
		};


		/*cookie管理开始*/
		/*
		a.cookie.clear()//清除所有
		a.cookie.get('name')//
		a.cookie.remove('name')
		a.cookie.set('name','dfa',cookie.getExpiresDate(days, hours, minutes), path, domain, secure)
		*/
		often.cookie={
			document:G.document||(typeof document !== 'undefined'?document:undefined),
			getExpiresDate:function(days, hours, minutes, seconds) {
				var ExpiresDate = new Date();
				if (often.type(days, 'number') && often.type(hours, 'number') && often.type(minutes, 'number')) {
					ExpiresDate.setDate(ExpiresDate.getDate() + parseInt(days));
					ExpiresDate.setHours(ExpiresDate.getHours() + parseInt(hours));
					ExpiresDate.setMinutes(ExpiresDate.getMinutes() + parseInt(minutes));
					often.type(seconds, 'number')&&ExpiresDate.setSeconds(ExpiresDate.getSeconds() + parseInt(seconds));
					return ExpiresDate.toGMTString();
				}
			},
			_getValue:function(offset) {
				var endstr = this.document.cookie.indexOf (";", offset);
				(endstr == -1)&&(endstr = this.document.cookie.length);
				return this.unescape(this.document.cookie.substring(offset, endstr));
			},
			get:function(name) {
				name = often.trim(name) ;
				var arg = name + "=";
				var alen = arg.length;
				var clen = this.document.cookie.length;
				var j,i = 0;
				while (i < clen) {
					if (this.document.cookie.substring(i,(j = i + alen)) == arg) {
						return this._getValue(j);
					}
					if((i=(this.document.cookie.indexOf(" ",i)+1))==0){break;}
				}
				return '';
			},
			set:function(name, value, expires, path, domain, secure) {
				name = often.trim(name) ;
				try{
					if(VS_COOKIEDM!==undefined && VS_COOKIEDM!==null && !domain ){
						domain = VS_COOKIEDM;
					}
				}catch(e){}
				this.document.cookie = name + "=" + this.escape (value) + ((expires) ? "; expires=" + expires : "") + ((often.type(path,'string') && path != '') ? ('; path=' + path) : '; path=/') +
				((often.type(domain,'string')&&domain!='') ? "; domain=" + domain : "") +
				((secure) ? "; secure" : "");
			},
			remove:function(name,path,domain) {
				name = often.trim(name) ;
				this.get(name)&&this.set(name,'','Thu, 01-Jan-70 00:00:01 GMT',path,domain,'');
			},
			del:function(name,path,domain) {
				this.remove(name,path,domain);
			},
			clear:function(){
				var cookieName,cookies = this.document.cookie.split(';');
				for(var i=0; i < cookies.length; i++){
					cookieName = cookies[i].split('=')[0];
					(!cookieName)||this.remove(cookieName);
				}
				cookies = undefined ;
				cookieName = undefined ;
			},
			escape:function(v){
				return escape(v);
			},
			unescape:function(v){
				return unescape(v);
			},
			test:function(){
				var r = false ;
				a.cookie.set('cjbcmsmanagecookietest',true);
				r = !!a.cookie.get('cjbcmsmanagecookietest',true);
				a.cookie.remove('cjbcmsmanagecookietest');
				return r ;
			}
		};




		//获取表单数据
		often.get = often.get||function(){};
		often.get.formData = function(formstr){
			var p = {};
				p.formstr = formstr || 'body';
				formstr = undefined ;
				p.data = {};
				p.formdom = $(p.formstr) ;
				p.formdomi = '' ;
				p.typei = '' ;
				p.namei = '' ;
				p.namekeys = ['i','name','id','data-id'] ;
				p.formdom = $('input,textarea,select',p.formdom) ;
				for (var i = 0; i < p.formdom.length; i++) {
					p.namei = '' ;
					p.formdomi = $(p.formdom[i]);
					p.typei = p.formdomi.type || p.formdomi.attr('type') || p.formdom[i].type || undefined;

					for (p.namekey in p.namekeys) {
						p.namekey = p.namekeys[p.namekey];
						p.namei = p.formdomi.attr(p.namekey);
						if(p.namei){
							break ;
						}
					}
					if (!p.namei) {continue ;}

					switch(p.typei){
						case 'radio':
						p.data[p.namei] = $('input:radio['+p.namekey+'='+p.namei+']:checked',p.formdomi.parent()).val() || '';
						break;
						case 'checkbox':
							if (!$(p.formdomi).is(':checked')){
								continue ;
							}
							p.temp_value = $(p.formdomi).val() || 'on';
							if (often.is.array(p.data[p.namei])) {
								p.data[p.namei].push(p.temp_value) ;
							}else{
								p.data[p.namei] = [ p.temp_value ] ;
							}
						break;
						case 'select-multiple':
							p.temp_value = $('select['+p.namekey+'='+p.namei+']',p.formdomi.parent()).val();
							if (often.is.array(p.data[p.namei])) {
								p.data[p.namei].push(p.temp_value) ;
							}else{
								p.data[p.namei] = [ p.temp_value ] ;
							}
						break;
						case 'select':
						case 'select-one':
							p.data[p.namei] = $('select['+p.namekey+'='+p.namei+']',p.formdomi.parent()).val();
						break;
						//case 'text':
						//case 'password':
						//case 'hidden':
						//case 'textarea':
						default:
							p.data[p.namei] = p.formdomi.val() ;
						break;

					}
					p.formdomi = '' ;
					p.namei = '' ;
					p.typei = '' ;
				}


			delete p.formstr ;
			delete p.formdom ;
			delete p.typei ;
			return p.data;
		};
		often.tool = often.tool || often.inherit(null);
		often.tool.trim = function(o){
			APP.each(o,function(key, value) {
				o[key] = often.type(value,'string')?often.trim(value):value;
			});
			return o;
		};

		/**
		 * 返回所有结果集,格式为[[1,2,3],[4,5,6]...]
		 * @author: 华狄 <861883474@qq.com>
		 * @param array
		 */

		often.combine = function (array) {

			if(!often.isArray(array)){
				console.log("非法数组");
				return false;
			}

			var r= [];
			(function f(t,a,n){

				if (n === 0) return r.push(t);

				for(var i=0; i<a[n-1].length; i++){
					f(t.concat(a[n-1][i]),a,n-1);
				}
			})([],array,array.length);

			return r;
		};

		/**
		 * 删除对象中为空的属性
		 * @author: 华狄 <861883474@qq.com>
		 * @DateTime 2016-05-27T21:10:15+0800
		 * @return   {[type]}                 [description]
		 */
		often.deleteObj = function(obj){
			for(var v in obj){
				if(obj.hasOwnProperty(v)){
					if(obj[v] === ""){
						delete obj[v];
					}
				}
			}
			return obj;
		};






		
	};
});