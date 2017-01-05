'use strict';
//文件操作系统
const fs = require('fs');
//路径模块
const path = require('path');
//mkdirs
const mkdirs = require('../tool/mkdirs.js');
//etag
const etag = require('./etag.js');
//cjb_base模块
const b = require('cjb-base') ;
//MIME类型映射 - 模块
const mime = require('mime');
//压缩/解压缩一个文件
const zlib = require('zlib');
//模块
const build = module.exports = function buildOutput(req, res, next) {
	if (!(req&&req.router&&req.router.path)) {
		//没有路由路径跳过
		next();
		return ;
	}
	//判断是否有编译文件的地址，没有生成
	if(!req.buildOuputFilePath){
		//组合编译路径
		req.buildOuputFilePath = path.join(req.siteRootPath, ('build/'+req.router.path)) ;
		//判断使用有扩展名
		if (!path.extname(req.buildOuputFilePath)) {
			//没有后缀自动使用默认文件，避免和文件夹发生重名冲突
			req.buildOuputFilePath = path.join(req.buildOuputFilePath, build.defaultName);
		}
	}
	//判断是否有编译目录的地址，没有生成
	if(!req.buildOuputDirPath){
		//提取编译目录
		req.buildOuputDirPath = path.dirname(req.buildOuputFilePath);
	}
	//调试模式不编译
	if (req.DEBUG===true&&req.buildOutputNotSkip!==true) {
		//调试模式跳过
		next();
		return ;
	}
	//文件编译压缩文件地址
	let buildEncodeFilePath = req.buildOuputFilePath ;
	//文件输入源路径
	let buildInputFilePath = req.buildInputFilePath || req.buildOuputFilePath ;
	let [q, stat, acceptEncodingType, acceptEncoding] = [b.queue(), null, null, ''];

	//错误
	q.end((state)=>{
		if (!state) {
			//没有该文件,下一流程
			next();
		}
		//变量gc
		req = res = next = buildInputFilePath = q = stat = acceptEncodingType = acceptEncoding = void 0;
	}).push((next, resolve, reject)=>{
		//判断输入文件是否存在
		fs.stat( buildInputFilePath, (e, s)=>{
			stat = s ;
			if (e) {
				//如果不支持输入文件，报错
				reject(e);
				return ;
			}
			if(stat.isFile()) {
				next();
			}
		});
	}, true, (next, resolve, reject)=>{
		//查看编译目录状态
		fs.stat(req.buildOuputDirPath, (e, s)=>{
			if((!e)&&s.isFile()){
				//如果编译目录的地址是一个放有一个文件
				//直接删除文件
				fs.unlink(req.buildOuputDirPath, function(err){
					if(err){
						reject(err);
					}else{
						next();
					}
				});
			}else{
				next();
			}
		});
	}, true, (next, resolve, reject)=>{
		//生成编译目录
		mkdirs(req.buildOuputDirPath, 0o777, (state)=>{
			if (state) {
				//下一步
				next();
			}else{
				//生成失败
				reject(new Error('Failed to create build directory！'));
			}
		});
	}, true, (next, resolve, reject)=>{
		if (buildInputFilePath===req.buildOuputFilePath) {
			//如果输入文件路径就是编译文件路径，直接下一步
			next();
		}else{
			//检测编译文件夹的输出文件的状态
			fs.stat( req.buildOuputFilePath, (e, s)=>{
				let type ='error';
				if(e) {
					if (e.code == 'ENOENT') {
						type = 'notFind';
					}else{
						type = 'error';
					}
				}else if(s.isFile()) {
					//如果编译的最后修改时间大约输入的，说明不需要重新复制
					if (s.mtime>=stat.mtime) {
						//输入文件路径 直接更改为编译输出文件
						buildInputFilePath = req.buildOuputFilePath ;
						//类型
						type = 'ok';
					}else{
						//更新
						type = 'update';
					}
				}
				//如果有错误就报错
				if (type==='error') {
					reject(e||(new Error('unkonw error')));
				}else{
					//直接下一步
					next();
					copyInputFileToOuput(type, stat.mtime, buildInputFilePath, req.buildOuputFilePath);
				}
			});
		}
	}, true, (next, resolve, reject)=>{
		acceptEncoding = (req.headers&&req.headers['accept-encoding']) || '';
		acceptEncodingType = null;
		//文件后缀
		let fileExt = req.router&&req.router.fileext||'';
		//文件大小
		let fileSize = (stat&&stat.size)||0;
		//有后缀名
		if (fileExt&&(fileExt.match(build.match))&&fileSize&&fileSize<(10*1024*1024)) {
			if (acceptEncoding.match(/\bgzip\b/)) {
				acceptEncodingType = 'gzip';
			} else if (acceptEncoding.match(/\bdeflate\b/)) {
				acceptEncodingType = 'deflate';
			}
		}
		switch (acceptEncodingType||null) {
			case 'gzip':
			case 'deflate':{
				buildEncodeFilePath += '.ddv'+acceptEncodingType;
				fs.stat(buildEncodeFilePath, (e, s)=>{
					if((!e)&&s.isFile()&&s.mtime>=stat.mtime) {
						//更改文件转态信息
						stat = s ;
						//存在缓存文件
						buildInputFilePath = buildEncodeFilePath ;
						//直接下一步
						next();
					}else{
						//生成缓存文件
						let fdr = fs.createReadStream(buildInputFilePath);
						let fdw = fs.createWriteStream(buildEncodeFilePath, {
							//写入模式
							flags: 'w',
							//缓存区模式
							encoding: null,
							//权限
							mode:0o666
						});
						fdr
						//管道压缩
						.pipe( (acceptEncodingType==='gzip'?zlib.createGzip():zlib.createDeflate()), {
							//自动结束
							end:true,
							//自动关闭
							autoClose: true
						})
						//管道写入
						.pipe(fdw,{
							//自动结束
							end:true,
							//自动关闭
							autoClose: true
						})
						//管道结束
						.on('close',()=>{
							fdr = fdw = void 0;
							//新文件路径
							buildInputFilePath = buildEncodeFilePath ;
							//检测文件转态
							fs.stat( buildEncodeFilePath, (e, s)=>{
								//更改文件转态信息
								stat = s ;
								if(e) {
									reject(e);
								}else if(s.isFile()) {
									//直接下一步
									next();
								}else{
									reject(new Error('unkonw error'));
								}
							});
						});
					}
				});
			}break;
			default:
				acceptEncodingType = null;
				//直接下一步
				next();
				break;
		}
	}, true, (next, resolve)=>{
		let is304 = false;
		//默认类型
		let type = req.buildFileType||'application/octet-stream';
		//获取类型
		if (req.router&&req.router.fileext) {
			type = mime.lookup(req.router.fileext);
		}
		//设置类型头
		res.setHeader('Content-Type', type);

		//输出加密方式
		if (acceptEncodingType) {
			res.setHeader('Content-Encoding', acceptEncodingType);
		}
		//输出内容长度
		if (stat&&stat.size) {
			res.setHeader('Content-Length',stat.size);
		}
		if (stat) {
			//输出修改时间
			if (stat.mtime&&stat.mtime.toGMTString) {
				res.setHeader('Last-Modified',stat.mtime.toGMTString());
				if (req.headers['if-modified-since']===stat.mtime.toGMTString()) {
					is304 = true ;
				}
			}
			let Etag = etag(stat, {weak:true});
			res.setHeader('ETag',Etag);
			if (req.headers['if-none-match']===Etag) {
				is304 = true ;
			}
		}
		//判断是不是缓存
		if (is304) {
			//输出状态码
			res.statusCode = 304;
			//写出头信息
			res.writeHead(res.statusCode);
			//结束
			res.end();
			//完成，变量gc
			resolve(null);
			return ;
		}
		//打开文件流
		let rs = fs.createReadStream(buildInputFilePath);
		//写出头信息
		res.writeHead(res.statusCode);
		//管道输出
		rs.pipe(res, {
			//自动结束
			end:true,
			//自动关闭
			autoClose: true
		}).on('end',()=>{
			rs = void 0 ;
			//完成，变量gc
			resolve(null);
		});
	//运行队列
	}).run();
};
//默认主文件
build.defaultName = 'index.ddvbuild';
//编译后缀
build.match = /css|js|html|png|jpg|jpeg|gif/ig;
//复制输入文件到编译目录
const copyInputFileToOuput = function(type/*notFind | ok | update*/, buildInputFileMTime, buildInputFilePath, buildOuputFilePath){
	if (type==='ok') {
		return ;
	}
	let q = b.queue();
		q.push((next)=>{
			//加锁
			next();
		}, true, (next)=>{
			let fileReadStream=fs.createReadStream(buildInputFilePath);
			let fileWriteStream = fs.createWriteStream(buildOuputFilePath, {
				//写入模式
				flags: 'w',
				//缓存区模式
				encoding: null,
				//权限
				mode:0o666
			});
			fileReadStream.pipe(fileWriteStream, {
				//自动结束
				end:true,
				//自动关闭
				autoClose: true
			});

			fileWriteStream.on('close',function(){
				console.log('复制了');
			});
			next();
		}).run();
};
