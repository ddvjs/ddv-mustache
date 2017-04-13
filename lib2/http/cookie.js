/*global unescape, escape */
'use strict';
//cjb_base模块
const b = require('cjb-base') ;
/*

res.clearCookie('name')//清除所有
res.removeCookie('name')
res.setCookie('name','dfa',cookie.getExpiresDate(days, hours, minutes), path, domain, secure)

 */
//模块
const cookie = module.exports = function cookie(req, res, next){
		res.cookies = Object.create(null);
		b.each(((req.headers&&req.headers.cookie || '').split(';')), function(i, t){
			let a = (t||'').split('=')||[];
			let [name, value] = [b.trim(a[0]||''), cookie.unescape(b.trim(a[1]||''))];
			res.cookies[name] = value ;
			name = value = a = t = i = void 0 ;
		});
		res.cookiesSetArray = [];
		//缓存
		res.cookieOldStr = cookie.arrayToStr(res.cookies);
		//过期时间
		res.getExpiresDate = cookie.getExpiresDate;
		//设置cookie
		req.setCookie = res.setCookie = function setCookie(name, value, expires, path, domain, secure) {
			let t = '' ;
				t+= (b.trim(name) + '=');
				t+= cookie.escape(value) ;
				t+= expires ? '; expires=' + expires : '' ;
				t+= (b.type(path, 'string') && path !== '') ? ('; path=' + path) : '; path=/' ;
				t+= (b.type(domain,'string') && domain !== '') ? '; domain=' + domain : '' ;
				t+= secure ? '; secure' : '';
				//加入输出数组
				res.cookiesSetArray.push(t);
				//设置输出头
				res.setHeader('Set-Cookie', res.cookiesSetArray);
		}.bind(res);
		//移除
		req.removeCookie = res.removeCookie = function removeCookie(name, path, domain){
			this.setCookie(name, '', 'Thu, 01-Jan-70 00:00:01 GMT', path, domain, '');
		}.bind(res);
		//清空cookie
		req.clearCookie = res.clearCookie = function clearCookie(){
			b.each(res.cookies||[], function(name) {
				delete res.cookies[name] ;
				this.removeCookie(name);
			}, true, this);
		}.bind(res);
		//下一中间件
		next();
};
cookie.arrayToStr = function (obj){
	let a = [];
		b.each((obj||{}), function(name, value){
			a.push(name+'='+value);
			name = value = void 0;
		});
		a.sort();
		obj = void 0;
		a = a.join(';');
		return a;
};

cookie.getExpiresDate = function(days, hours, minutes, seconds) {
	var ExpiresDate = new Date();
	if (b.type(days, 'number') && b.type(hours, 'number') && b.type(minutes, 'number')) {
		ExpiresDate.setDate(ExpiresDate.getDate() + parseInt(days));
		ExpiresDate.setHours(ExpiresDate.getHours() + parseInt(hours));
		ExpiresDate.setMinutes(ExpiresDate.getMinutes() + parseInt(minutes));
		if (b.type(seconds, 'number')) {
			ExpiresDate.setSeconds(ExpiresDate.getSeconds() + parseInt(seconds));
		}
	}
	return ExpiresDate.toGMTString();
};
cookie.unescape = function (str){
	return unescape(str);
};
cookie.escape = function (str){
	return escape(str);
};
