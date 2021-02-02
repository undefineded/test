// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
const {ipcRenderer} = require('electron')
window.getAllPort = () =>{
  return ipcRenderer.sendSync('synchronous-message', 'p')
}

ipcRenderer.on('downstate', (event, arg) => {
  console.log(arg)
  if(arg.state==='download'){
    $('.downB span').html('正在下载安装包')
    $('.digUp').hide()
    $('.downB').show()
    $('.downB .progress').width((arg.ReceivedBytes/arg.TotalBytes)*100+'%')
  }
  if(arg.state==='failed'){
    $('.digUp').show()
    $('.downB span').html('下载失败')
    alert('下载失败')
  }
  if(arg.state==='completed'){
    $('.downB span').html('下载完成 正在打开安装包')
  }
})

ipcRenderer.on('jump', (event, arg) => {
  window.location.href = 'https://www.alimama.com/index.htm?jump=1'
})

ipcRenderer.on('getPort', (event, arg) => {
    window._port = ()=>{
      return arg
    }
})

ipcRenderer.on('goLogin', (event, arg) => {
  window._backLogin2()
})
ipcRenderer.on('h_console', (event, arg) => {
  console.log(arg)
})
ipcRenderer.on('war_msg', (event, arg) => {
  window.msg(arg)
})
window.addEventListener('DOMContentLoaded', () => {
  if(window.location.origin === 'file://'){
    const _baseDefaultUrl = 'http://127.0.0.1:3000'
    // const _baseDefaultUrl = 'http://49.232.145.129:3000'
    $('#login').on('click',()=>{
      localStorage.setItem('l_ur',$('#user').val())
      localStorage.setItem('l_pd',$('#pwd').val())
      $.ajax({
        type: 'post',
        url: _baseDefaultUrl+'/users/login.php',
        // url: 'http://127.0.0.1:3000/users/login.php',
        data: {
          username: $('#user').val(),
          password: $('#pwd').val(),
        },
        success: (data) => {
          if(data.code===200){
            $('#nm').text(data.data.username)
            $.ajax({
              type: 'post',
              url: _baseDefaultUrl+'/users/info.php',
              // url: 'http://127.0.0.1:3000/users/info.php',
              data: {
                key: data.data.key
              },
              success: (data1) => {
                if(data1.code===200){
                  $('.infoContent').show()
                  if(data1.data){
                    let _info = data1.data
                    let endTime = _info.end_time
                    let nowData = new Date().getTime()
                    $('#time').text(new Date(endTime).toLocaleString())
                    saveInfo(data.data.username, data.data.code, data.data.key, data.data.id)
                    if(nowData>=endTime){
                      $('.cant_use').show()
                      $('.can_use').hide()
                    }
                  }else {
                    $('.cant_use').show()
                    $('.can_use').hide()
                  }
                }else {
                  alert(data1.msg||'error!')
                }
              }
            })
          }
          else {
            alert(data.msg||'error!')
          }
        }
      })
    })
    $('.jump_to_ali').on('click',()=>{
      window.location.href = 'https://login.taobao.com/member/login.jhtml?style=mini&newMini2=true&from=alimama&redirectURL=https%3A%2F%2Fpub.alimama.com%2Fmanage%2Foverview%2Findex.htm&full_redirect=true&disableQuickLogin=true'
    })
    window.saveInfo = function (username,code,key,id) {
      // console.log(username, code)
      let u_data = ipcRenderer.sendSync('set_info', {
        username: username,
        key: key,
        code: code,
        id: id
      })
      if (u_data.code === 200) {
      } else {
        alert(u_data.msg || 'error!')
      }
      // $.ajax({
      //   type: 'post',
      //   url: `http://127.0.0.1:${getAllPort().exPort}/set_info`,
      //   data: {
      //     username: username,
      //     key: key,
      //     code: code,
      //     id: id
      //   },
      //   success: (data) => {
      //     if(data.code===200){}else {
      //       alert(data.msg||'error!')
      //     }
      //   }
      // })
    }
    window.compareVersion = function (version1, version2) {
      const arr1 = version1.split('.')
      const arr2 = version2.split('.')
      const length1 = arr1.length
      const length2 = arr2.length
      const minlength = Math.min(length1, length2)
      let i = 0
      for (i ; i < minlength; i++) {
        let a = parseInt(arr1[i])
        let b = parseInt(arr2[i])
        if (a > b) {
          return 1
        } else if (a < b) {
          return -1
        }
      }
      if (length1 > length2) {
        for(let j = i; j < length1; j++) {
          if (parseInt(arr1[j]) != 0) {
            return 1
          }
        }
        return 0
      } else if (length1 < length2) {
        for(let j = i; j < length2; j++) {
          if (parseInt(arr2[j]) != 0) {
            return -1
          }
        }
        return 0
      }
      return 0
    }


    $(document).ready(()=>{
      // alert(333)
      if(localStorage.l_ur){
        $('#user').val(localStorage.l_ur)
      }
      if(localStorage.l_pd){
        $('#pwd').val(localStorage.l_pd)
      }

      let verDa = ipcRenderer.sendSync('getVersion', 'p')
      let localVis = verDa.data
      $.ajax({
        type: 'post',
        url: _baseDefaultUrl+'/serverVersion',
        // url: 'http://127.0.0.1:3000/serverVersion',
        data: {},
        success: (data1) => {
          if(data1.code===200){
            console.log(data1.data)
            let serverVis = data1.data
            console.log(compareVersion(serverVis, localVis))
            if(compareVersion(serverVis, localVis)===1){
              // $('#downUrl').attr('href',`http://127.0.0.1:3000/version/${serverVis}/login.exe`)
              $('#downUrl').attr('href',`${_baseDefaultUrl}/version/${serverVis}/login.exe`)
              $('.digUp').show()
            }
          }else {
            alert('获取服务器软件版本信息失败')
          }
        }
      })

      // $.ajax({
      //   type: 'post',
      //   url: `http://127.0.0.1:${getAllPort().exPort}/getVersion`,
      //   data: {},
      //   success: (data) => {
      //     if(data.code===200){
      //       console.log(data.data)
      //       let localVis  = data.data
      //       $.ajax({
      //         type: 'post',
      //         url: _baseDefaultUrl+'/serverVersion',
      //         // url: 'http://127.0.0.1:3000/serverVersion',
      //         data: {},
      //         success: (data1) => {
      //           if(data1.code===200){
      //             console.log(data1.data)
      //             let serverVis = data1.data
      //             console.log(compareVersion(serverVis, localVis))
      //             if(compareVersion(serverVis, localVis)===1){
      //               // $('#downUrl').attr('href',`http://127.0.0.1:3000/version/${serverVis}/login.exe`)
      //               $('#downUrl').attr('href',`${_baseDefaultUrl}/version/${serverVis}/login.exe`)
      //               $('.digUp').show()
      //             }
      //           }else {
      //             alert('获取服务器软件版本信息失败')
      //           }
      //         }
      //       })
      //     }else {
      //       alert('获取本地软件版本信息失败')
      //     }
      //   }
      // })
    });
  }

  // SweetAlert
// 2014 (c) - Tristan Edwards
// github.com/t4t5/sweetalert
  var hm = document.createElement("script");
  // var s = document.getElementsByTagName("script")[0];
  // s.parentNode.insertBefore(hm, s);
  let logIn = {
    ur:'',
    pd:''
  }
  window._getCodeUrl =(url) => {
    if (url.indexOf("?") !== -1) {
      let code = url.split("?")[1];
      let objUrl = {};
      code.split("&");
      for (let i = 0; i < code.split("&").length; i++) {
        objUrl[code.split("&")[i].split("=")[0]] = code
          .split("&")
          [i].split("=")[1];
      }
      return objUrl;
    }else {
      return 0
    }
  }
  window.onload = () =>{
    // https://www.alimama.com/index.htm
      if(window.location.href.indexOf('https://www.alimama.com/index.htm')!==-1){
        if(window._getCodeUrl(window.location.href).jump){
          // add_tool('<input type="button" value="返回淘宝联盟登录页(自动重新登录)" onclick="_backLogin2()">')
          // add_tool('<input type="button" value="返回淘宝联盟登录页(手动输入账号登录)" onclick="_backLogin()">')
        }else {
          window.location.href = 'https://pub.alimama.com/manage/overview/index.htm'
        }
        hm.src = "https://lib.baomitu.com/socket.io/2.3.0/socket.io.js";
        document.body.appendChild(hm)
      }
      if(window.location.href.indexOf('https://pub.alimama.com/manage/overview/index.htm')!==-1){
        setTimeout(()=>{
        },30000)
      }
      if(window.location.href.indexOf('https://login.taobao.com/member/login')!==-1){
        // alert(window._getCodeUrl(window.location.href).nologin)
        hm.src = "https://lib.baomitu.com/socket.io/2.3.0/socket.io.js";
        document.body.appendChild(hm)
        if(!window._getCodeUrl(window.location.href).nologin){

          document.getElementById('fm-login-id').focus()
          document.getElementById('fm-login-id').value = localStorage.ur?localStorage.ur:''
          document.getElementById('fm-login-id').blur()
          setTimeout(()=>{
            document.getElementById('fm-login-password').focus()
            document.getElementById('fm-login-password').value = localStorage.pd?localStorage.pd:''
            document.getElementById('fm-login-password').blur()
            setTimeout(()=>{
              if(document.getElementById('fm-login-id').value&&document.getElementById('fm-login-password').value){
                document.getElementsByClassName('password-login')[0].click()
              }
            },1000)
          },1000)

          // fetch('http://127.0.0.1:14417/readUser', {
          //   method: 'POST',
          //   body: '',
          //   headers: new Headers({'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'})
          // }).then(res => res.json())
          //   .catch(error => console.error('Error:', error))
          //   .then((response) => {
          //     console.log('Success:', response)
          //     if(response.code===200){
          //       try {
          //         let user_ = JSON.parse(response.data)
          //         document.getElementById('fm-login-id').focus()
          //         document.getElementById('fm-login-id').value = user_.ur
          //         document.getElementById('fm-login-id').blur()
          //         setTimeout(()=>{
          //           document.getElementById('fm-login-password').focus()
          //           document.getElementById('fm-login-password').value = user_.pd
          //           document.getElementById('fm-login-password').blur()
          //           setTimeout(()=>{
          //             // document.getElementsByClassName('password-login')[0].click()
          //           },1000)
          //         },1000)
          //       }catch (e) {
          //         console.log(e)
          //       }
          //     }else {
          //       try {
          //         document.getElementById('fm-login-id').focus()
          //         document.getElementById('fm-login-id').value = localStorage.ur?localStorage.ur:''
          //         document.getElementById('fm-login-id').blur()
          //         setTimeout(()=>{
          //           document.getElementById('fm-login-password').focus()
          //           document.getElementById('fm-login-password').value = localStorage.pd?localStorage.pd:''
          //           document.getElementById('fm-login-password').blur()
          //           setTimeout(()=>{
          //             if(document.getElementById('fm-login-id').value&&document.getElementById('fm-login-password').value){
          //               document.getElementsByClassName('password-login')[0].click()
          //             }
          //           },1000)
          //         },1000)
          //       }catch (e) {console.log(e)}
          //     }
          //   });
        }
        //
        document.getElementById('fm-login-id').onblur = ()=>{
          logIn.ur = document.getElementById('fm-login-id').value?document.getElementById('fm-login-id').value:''
          localStorage.setItem('ur',document.getElementById('fm-login-id').value)
          // if(logIn.ur&&logIn.pd){
          //   ipcRenderer.sendSync('synchronous-message', 'p')
          //   fetch(`http://127.0.0.1:${getAllPort().exPort}/saveUser`, {
          //     method: 'POST',
          //     body: `ur=${logIn.ur}&pd=${logIn.pd}`,
          //     headers: new Headers({'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'})
          //   }).then(res => res.json())
          //     .catch(error => console.error('Error:', error))
          //     .then((response) => {
          //       console.log('Success:', response)
          //     });
          // }
        }
        document.getElementById('fm-login-id').oninput = ()=>{
          localStorage.setItem('ur', document.getElementById('fm-login-id').value)
        }

        document.getElementById('fm-login-password').onblur = ()=>{
          logIn.pd = document.getElementById('fm-login-password').value?document.getElementById('fm-login-password').value:''
          localStorage.setItem('pd', document.getElementById('fm-login-password').value)
          // if(logIn.ur&&logIn.pd){
          //   fetch(`http://127.0.0.1:${getAllPort().exPort}/saveUser`, {
          //     method: 'POST',
          //     body: `ur=${logIn.ur}&pd=${logIn.pd}`,
          //     headers: new Headers({'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'})
          //   }).then(res => res.json())
          //     .catch(error => console.error('Error:', error))
          //     .then((response) => {
          //       console.log('Success:', response)
          //     });
          // }
        }
        document.getElementById('fm-login-password').oninput = ()=>{
          localStorage.setItem('pd', document.getElementById('fm-login-password').value)
        }
      }

      let socket = ''
      hm.onload = function(){
          // socket = io.connect(`http://localhost:${getAllPort().serPort}`);
        // socket.on("sendToClient", m => {
        //   // console.log(m);
        //   if(m.message==='startLogin'){
        //     if(window.location.href.indexOf('https://login.taobao.com/member/login')===-1){
        //       window.location.href = 'https://login.taobao.com/member/login.jhtml?style=mini&newMini2=true&from=alimama&redirectURL=https%3A%2F%2Fpub.alimama.com%2Fmanage%2Foverview%2Findex.htm&full_redirect=true&disableQuickLogin=true'
        //     }else {
        //
        //       document.getElementById('fm-login-id').focus()
        //       document.getElementById('fm-login-id').value = localStorage.ur?localStorage.ur:''
        //       document.getElementById('fm-login-id').blur()
        //       setTimeout(()=>{
        //         document.getElementById('fm-login-password').focus()
        //         document.getElementById('fm-login-password').value = localStorage.pd?localStorage.pd:''
        //         document.getElementById('fm-login-password').blur()
        //         setTimeout(()=>{
        //           if(document.getElementById('fm-login-id').value&&document.getElementById('fm-login-password').value){
        //             document.getElementsByClassName('password-login')[0].click()
        //           }
        //         },1000)
        //       },1000)
        //
        //       // fetch('http://127.0.0.1:14417/readUser', {
        //       //   method: 'POST',
        //       //   body: '',
        //       //   headers: new Headers({'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'})
        //       // }).then(res => res.json())
        //       //   .catch(error => console.error('Error:', error))
        //       //   .then((response) => {
        //       //     console.log('Success:', response)
        //       //     if(response.code===200){
        //       //       try {
        //       //         let user_ = JSON.parse(response.data)
        //       //         document.getElementById('fm-login-id').focus()
        //       //         document.getElementById('fm-login-id').value = user_.ur
        //       //         document.getElementById('fm-login-id').blur()
        //       //         setTimeout(()=>{
        //       //           document.getElementById('fm-login-password').focus()
        //       //           document.getElementById('fm-login-password').value = user_.pd
        //       //           document.getElementById('fm-login-password').blur()
        //       //           setTimeout(()=>{
        //       //             // document.getElementsByClassName('password-login')[0].click()
        //       //           },1000)
        //       //         },1000)
        //       //       }catch (e) {
        //       //         conso.log(e)
        //       //         // alert(JSON.stringify(e))
        //       //       }
        //       //     }else {
        //       //       try {
        //       //         document.getElementById('fm-login-id').focus()
        //       //         document.getElementById('fm-login-id').value = localStorage.ur?localStorage.ur:''
        //       //         document.getElementById('fm-login-id').blur()
        //       //         setTimeout(()=>{
        //       //           document.getElementById('fm-login-password').focus()
        //       //           document.getElementById('fm-login-password').value = localStorage.pd?localStorage.pd:''
        //       //           document.getElementById('fm-login-password').blur()
        //       //           setTimeout(()=>{
        //       //             if(document.getElementById('fm-login-id').value&&document.getElementById('fm-login-password').value){
        //       //               document.getElementsByClassName('password-login')[0].click()
        //       //             }
        //       //           },1000)
        //       //         },1000)
        //       //       }catch (e) {console.log(e)}
        //       //     }
        //       //   });
        //     }
        //   }
        //   if(m.message==='isMsg'){
        //     msg(m.say)
        //   }
        // });
      }
  }
  // 2. 监听send按钮点击的事件
  // $("#send").click(function(){
  //   // 获取输入的信息
  //   let message = $("#message").val().trim();
  //   // 向服务器端发送信息
  //   socket.emit("sentToServer", message);
  // });
  // 3. 获取服务端发送过来的信息



  // const replaceText = (selector, text) => {
  //   const element = document.getElementById(selector)
  //   if (element) element.innerText = text
  // }
  //
  // for (const type of ['chrome', 'node', 'electron']) {
  //   replaceText(`${type}-version`, process.versions[type])
  // }

  let _bn = document.createElement('div')
  _bn.style.position = 'fixed'
  _bn.className = '_100020_tb'
  _bn.style.textAlign = 'left'
  _bn.style.left = '5px'
  _bn.style.top = '5px'
  _bn.style.zIndex = '9999999'
  if(window.location.origin==='file://'){
    _bn.style.display = 'none'
  }

  let thisTime = new Date()
  let nnnnTime = `${thisTime.getFullYear()}-${(thisTime.getMonth()+1)>9?(thisTime.getMonth()+1):'0'+(thisTime.getMonth()+1)}-${thisTime.getDate()>9?thisTime.getDate():'0'+thisTime.getDate()}`
  _bn.innerHTML = '<div onclick="show_hide()" style="width: 30px;height: 30px;line-height: 50px;border: 1px dashed #44a0b3;border-radius: 2px;margin-bottom: 5px">\n' +
    '    <div style="height: 3px"></div>\n' +
    '    <p style="width: 25px;margin: 4px auto;height: 2px;background: #44a0b3"></p>\n' +
    '    <p style="width: 25px;margin: 4px auto;height: 2px;background: #44a0b3"></p>\n' +
    '    <p style="width: 25px;margin: 4px auto;height: 2px;background: #44a0b3"></p>\n' +
    '  </div>\n' +
    '  <div class="_tool_tblm" style="width: 300px;padding: 10px;background: #D0D0D0;border-radius: 4px">\n' +
    '    <div style="font-size: 12px">功能</div>\n' +
    '    <div>\n' +
    '      <input onclick="_backLogin2()" style="margin: 3px" type="button" value="返回登录(自动登录)">\n' +
    '      <input onclick="_backLogin()" style="margin: 3px" type="button" value="返回登录(手动登录)">\n' +
    // '      <input style="margin: 3px" type="button" value="佣金监控"><br/>\n' +
    '      <span style="font-size: 12px;padding-left: 3px">最多只支持导入最近一个月的报表</span><br/>\n' +
    '      <span style="font-size: 12px;padding-left: 3px">开始时间：</span><input id="__tb_start_time_" style="margin: 3px" type="date" value=""><br/>\n' +
    '      <span style="font-size: 12px;padding-left: 3px">结束时间：</span><input disabled id="__tb_end_time_" style="margin: 3px" type="date" value="' + nnnnTime + '"><br/>\n' +
    '      <input onclick="xlsToArray()" style="margin: 3px" type="button" value="更新报表">\n' +
    '    </div>\n' +
    '    <div style="font-size: 12px">日志</div>\n' +
    '    <div>\n' +
    '      <textarea style="width: 95%;outline: none;border-radius: 4px;padding: 6px;font-size: 12px;min-height: 190px"></textarea>\n' +
    '    </div>\n' +
    '  </div>'
  // _bn.style.width = '200px'
  // _bn.style.height = '200px'
  // _bn.style.background = '#fff'
  // _bn.style.border = '1px solid #000'
  // _bn.style.borderRadius = '5px'
  // _bn.style.padding = '12px 15px'
  // _bn.style.zIndex = '99999'
  // _bn.style.overflow = 'auto'

  var dv = _bn
  var x = 0;
  var y = 0;
  var l = 0;
  var t = 0;
  var isDown = false;//鼠标按下事件
  dv.onmousedown = function (e) {//获取x坐标和y坐标
    x = e.clientX;
    y = e.clientY;//获取左部和顶部的偏移量
    l = dv.offsetLeft;
    t = dv.offsetTop;//开关打开
    isDown = true;//设置样式
  }//鼠标移动
  window.onmousemove = function (e) {
    if (!isDown) {
      return;
    }//获取x和y
    var nx = e.clientX;
    var ny = e.clientY;//计算移动后的左偏移量和顶部的偏移量
    var nl = nx - (x - l);
    var nt = ny - (y - t);
    nl<0?nl=0:nl
    nt<0?nt=0:nt
    dv.style.left = nl + 'px';
    dv.style.top = nt + 'px';
  }//鼠标抬起事件
  dv.onmouseup = function () {//开关关闭
    isDown = false;
    dv.style.cursor = 'move';
  }
  // _bn.innerHTML = '<p style="font-size: 14px;color: #666;margin: 0;padding-bottom: 5px">.33333</p>'
  document.body.appendChild(_bn)
  function msg(m){
    document.getElementsByClassName('_100020_tb')[0]
      .getElementsByTagName('textarea')[0]
      .innerHTML = `${m}`
  }
  function add_msg(m){
    // _bn.innerHTML += `<p style="font-size: 14px;color: #666;margin: 0;padding-bottom: 5px;word-break: break-all">${m}</p>`
  }
  function add_tool(m){
    // _bn.innerHTML += m
  }
  let sendCookie = true
  let send_data = null
  // msg('消息')

  // let m_view = setInterval(()=>{
  //   console.log(document.title)
  //   msg('等待操作')
  //   if(window.location.href.indexOf('login.htm?')!==-1){
  //     msg('请先登录')
  //   }
  //   if(window.location.href.indexOf('pub.alimama.com')!==-1&&!document.getElementById('J_mmLoginIfr')){
  //     msg('已经登录')
  //     add_msg('阿里妈妈-登录')
  //     add_msg('cookie-------------')
  //     add_msg('正在发送cookie')
  //     if(send_data){
  //       add_msg('发送成功')
  //       add_msg(send_data)
  //     }
  //     add_tool('<input type="button" value="返回登录页" onclick="_backLogin()">')
  //     sendCookie&&window._getInfo((d)=>{
  //       if(!d.cookie){
  //         return
  //       }
  //       window.$.ajax({
  //         type: 'post',
  //         url: 'http://127.0.0.1:14417/isLogin',
  //         data: {},
  //         success: (data) => {
  //           send_data = JSON.stringify(data)
  //           // add_msg(JSON.stringify(data))
  //           // console.log(data)
  //           if(data.code===200){
  //             alert('发送成功')
  //             sendCookie = false
  //           }else {
  //             alert(data.msg||'error!')
  //           }
  //         }
  //       })
  //     })
  //   }
  // },4000)

})

window._backLogin = function () {
  window.location.href = 'https://login.taobao.com/member/login.jhtml?style=mini&newMini2=true&from=alimama&redirectURL=https%3A%2F%2Fpub.alimama.com%2Fmanage%2Foverview%2Findex.htm&full_redirect=true&disableQuickLogin=true&nologin=true'
}
window._backLogin2 = function () {
  // if(!window._getCodeUrl(window.location.href).nologin){
  //   window.location.href = 'https://login.taobao.com/member/login.jhtml?style=mini&newMini2=true&from=alimama&redirectURL=https%3A%2F%2Fpub.alimama.com%2Fmanage%2Foverview%2Findex.htm&full_redirect=true&disableQuickLogin=true'
  // }
  // if(window.location.href.indexOf('https://login.taobao.com/member/login')===-1){
    window.location.href = 'https://login.taobao.com/member/login.jhtml?style=mini&newMini2=true&from=alimama&redirectURL=https%3A%2F%2Fpub.alimama.com%2Fmanage%2Foverview%2Findex.htm&full_redirect=true&disableQuickLogin=true'
  // }
}
window.show_hide = function () {
  let dom_tblm = document.getElementsByClassName('_tool_tblm')[0]
  if (dom_tblm.style.display === 'none') {
    dom_tblm.style.display = ''
  } else {
    dom_tblm.style.display = 'none'
  }
}
window.msg = function (m) {
  document.getElementsByClassName('_100020_tb')[0]
    .getElementsByTagName('textarea')[0]
    .innerHTML = `${m}`
}
window.xlsToArray = function (m) {
  let _s_t = document.getElementById('__tb_start_time_').value
  let _e_t = document.getElementById('__tb_end_time_').value
  let dt_1 = new Date();
  dt_1.setMonth(dt_1.getMonth() - 1);
  let toDay_ = `${dt_1.getFullYear()}-${(dt_1.getMonth()+1)>9?(dt_1.getMonth()+1):'0'+(dt_1.getMonth()+1)}-${dt_1.getDate()} :00:00:00`
  // console.log(new Date(_s_t).getTime())
  // console.log(new Date(toDay_).getTime())
  if(new Date(toDay_).getTime()>new Date(_s_t).getTime()){
    alert('最多只支持导入最近一个月的报表')
    return;
  }
  if(!_s_t||!_e_t){
    alert('请选择导出开始日期')
    return
  }
  if(new Date(_s_t).getTime()>new Date(_e_t).getTime()){
    alert('开始时间不能大于结束时间')
    return
  }
  ipcRenderer.sendSync('startOutXls', {_s_t:_s_t,_e_t:_e_t})
  // fetch(`http://127.0.0.1:${getAllPort().exPort}/startOutXls`, {
  //   method: 'POST',
  //   body: `_s_t=${_s_t}&_e_t=${_e_t}`,
  //   headers: new Headers({'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'})
  // }).then(res => res.json())
  //   .catch(error => msg(JSON.stringify(error)))
  //   .then((response) => {
  //     msg(response?JSON.stringify(response):'错误')
  //   });
  // console.log(_s_t)
  // console.log(_e_t)
}
// window._getInfo = function (fn) {
//   $.ajax({
//     type: 'post',
//     url: 'http://127.0.0.1:14417/get_info',
//     data: {},
//     success: (data) => {
//       if(data.code===200){
//         fn(data.data)
//       }else {
//         alert(data.msg||'error!')
//       }
//     }
//   })
// }
// electron-packager . HelloWorld --platform=win32 --arch=x64
// electron-builder --win --x64


// function formatCookie(c) {
//   let arrCookie = c.split('; ')
//   console.log(arrCookie)
//   let data_t = {}
//   for(let i = 0;i<arrCookie.length;i++){
//     data_t[arrCookie[i].split('=')[0]] = arrCookie[i].split('=')[1]
//   }
//   console.log(data_t)
//   return data_t
// }
