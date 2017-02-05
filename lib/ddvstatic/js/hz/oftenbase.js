define(['require', 'apiRESTful', 'sweetAlert'], function (require, apiRESTful, swal) {
  var base = {}
  base.api = apiRESTful
  base.api.setjqAjax($.ajax)
  base.api.setCryptoJS(CryptoJS)
  base.api.url.api = 'http://api.unicom.ping-qu.com/'
  base.api.url.pushapi = 'http://1.hzt.push.xsw0306.com/push'
  base.api.url.pushwsapi = 'ws://hzpush.ping-qu.com/push'
  // APP.api.getSessionId();
  // APP.api = apiRESTful;
  base.ajax = function (url, ajaxData, callback, type, v, error_callback) {
    v = (v === undefined) ? '1_0' : v// 版本号
    var ajaxType = (type === undefined) ? 'post' : type
    base.api.ajax({
      url: 'v' + v + '/' + url,
      urltype: 'api',
      type: ajaxType,
      dataType: 'json',
      data: ajaxData,
      beforeSend: function () {
        // 显示加载提示
        $('body').append("<div id=\"ajaxTip\" style='height: 20px;line-height: 20px;text-align: center;" +
          'color: #fff;padding: 10px 20px;background-color: rgba(0, 0, 0, 0.6);position: absolute;z-index: 99999;' +
          "border-radius: 5px;top: 50%;margin-top: -20px;left: 50%;margin-left: -47px;font-size: 14px'>加载中...</div>")
      },
      error: function (XHR, TS, ET, error_data) {
        $('#ajaxTip').remove()// 移除加载提示
        if (error_data) {
          // 未登录显示登录界面
          if (!error_data.sysdata.is_login && error_data.error_id == 'NO_LOGIN') {
            document.title = '登录'
            $("[i='main_page']").css('display', 'none')
            $("[i='login_page']").css('display', 'block')
            return false
          }

          if (typeof error_callback === typeof function () {}) {
            error_callback(error_data)
            return
          }
          var time = setTimeout(function () {
            swal({
              title: '错误提示',
              text: error_data.msg,
              type: 'warning',
              confirmButtonClass: 'btn-warning',
              confirmButtonText: '确定'
            })
            clearTimeout(time)
          }, 300)
          return false
        }

        if (ET) {
          var time = setTimeout(function () {
            swal({
              title: '错误提示',
              text: '网络出错',
              type: 'error',
              confirmButtonClass: 'btn-warning',
              confirmButtonText: '确定'
            })
            clearTimeout(time)
          }, 300)
          return false
        }
      },
      success: function (data, TS, XHR) {
        $('#ajaxTip').remove()// 移除加载提示
        $("[i='login_page']").css('display', 'none')
        $("[i='main_page']").css('display', 'block')
        if (data.state) {
          if (callback) {
            callback(data)
          }
        } else {
          var time = setTimeout(function () {
            swal({
              title: '错误提示',
              text: data.msg,
              type: 'warning',
              confirmButtonClass: 'btn-warning',
              confirmButtonText: '确定'
            })
            clearTimeout(time)
          }, 300)
        }
      }
    })
  }
  // 成功弹窗,参数(object):{text: "xxxx"}(成功提示文字) or (string)
  base.swalSuccess = function (conf) {
    var tipConf = {}
    if (typeof conf === 'string') {
      tipConf.text = conf
    } else if (typeof conf === 'object') {
      tipConf.text = conf.text || ''
    } else {
      tipConf.text = ''
    }
    swal({
      title: '操作成功',
      text: tipConf.text || '',
      type: 'success',
      confirmButtonClass: 'btn-success',
      confirmButtonText: '确定'
    })
  }
  // 错误弹窗,参数(object):{text: "xxxx"}(错误提示文字) or (string)
  base.swalError = function (conf) {
    var tipConf = {}
    if (typeof conf === 'string') {
      tipConf.text = conf
    } else if (typeof conf === 'object') {
      tipConf.text = conf.text || ''
    } else {
      tipConf.text = ''
    }
    swal({
      title: '错误提示',
      text: tipConf.text || '',
      type: 'error',
      confirmButtonClass: 'btn-warning',
      confirmButtonText: '确定'
    })
  }
  // 警告弹窗,参数(object):{text: "xxxx"}(错误提示文字) or (string)
  base.swalWarn = function (conf) {
    var tipConf = {}
    if (typeof conf === 'string') {
      tipConf.text = conf
    } else if (typeof conf === 'object') {
      tipConf.text = conf.text || ''
    } else {
      tipConf.text = ''
    }
    swal({
      title: '错误提示',
      text: tipConf.text || '',
      type: 'warning',
      confirmButtonClass: 'btn-warning',
      confirmButtonText: '确定'
    })
  }

  // 确认弹窗,参数(object):{text: "xxxx", callback: function(){}}
  base.swalConfirm = function (conf) {
    var tipConf = {}
    if (typeof conf === 'string') {
      tipConf.text = conf
    } else if (typeof conf === 'object') {
      tipConf.text = conf.text || ''
    } else {
      tipConf.text = ''
    }
    swal({
      title: '确定此操作？',
      text: tipConf.text,
      type: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#DD6B55',
      confirmButtonText: '确定',
      cancelButtonText: '返回',
      closeOnConfirm: true,
      html: false
    }, function () {
      if (conf.callback != undefined && typeof conf.callback === typeof function () {}) {
        conf.callback()
      }
    })
  }

  return base
})
