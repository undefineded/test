// Modules to control application life and create native browser window
const _baseDefaultUrl = 'http://127.0.0.1:3000'
// const _baseDefaultUrl = 'http://49.232.145.129:3000'
const {app, BrowserWindow, session, shell, ipcMain} = require('electron')
const fs = require('fs')
const path = require('path')
const bodyParse = require("body-parser")
const express = require('express');
const request = require('request');
const isEx = express();
const server = require('http').createServer(isEx);
const io = require('socket.io')(server);
const xlsx = require('node-xlsx');
const uuid = require('node-uuid')
const zlib = require('zlib');
let nowUuid = null
let mainWindow1 = null
let socket1 = ''
io.on('connection', socket => {
  socket1 = socket
  console.log("加入一个链接");
  // 监听客户端发送的信息
  socket.on("sentToServer", message => {
    io.emit("sendToClient", {message});
  });
  // 监听连接断开事件
  socket.on("disconnect", () => {
    console.log("连接已断开...");
  });
});

serPort = 14427
function ls() {
  server
    .listen(serPort,(err)=>{
      if (!err)
      console.log('serPort')
      console.log(serPort)
    })
    .on('error', (err) => {
      if (err.code === 'EADDRINUSE') { // 端口已经被使用
        console.log('err')
      }
      serPort++
      ls()
    })
}
// ls()
//todo 端口监听

let exPort = 14417
function sc(){
  isEx
    .listen(exPort,(err)=>{
      if (!err)
        console.log('exPort')
        console.log(exPort)
    })
    .on('error', (err) => {
      if (err.code === 'EADDRINUSE') { // 端口已经被使用
        console.log('err')
      }
      exPort++
      sc()
    })
}
// sc()
//todo 端口监听
ipcMain.on('synchronous-message',(event, arg) => { // arg为接受到的消息
  event.returnValue = {
    serPort:serPort,
    exPort:exPort
  } // 返回一个参数
})
// exPort = 14417
// isEx.listen(exPort);
//
// isEx.on('error',  (err) => {
//   if (err.code === 'EADDRINUSE') { // 端口已经被使用
//     console.log(err)
//   }
//   while (err) {
//     serPort++
//   }
//   isEx.listen(exPort);
// })


isEx.use(bodyParse.urlencoded({extended: true}));
isEx.use(bodyParse.json())
isEx.all("*", function (req, res, next) {
  if (req.path !== "/" && !req.path.includes(".")) {
    res.header("Access-Control-Allow-Credentials", true);
    // 这里获取 origin 请求头 而不是用 *
    res.header("Access-Control-Allow-Origin", req.headers["origin"]);
    res.header("Access-Control-Allow-Headers", "Content-Type");
    res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header("Content-Type", "application/json;charset=utf-8");
  }
  next();
})
let userInfo = {}
let msg_log = {}
let w_fn = {
  toLogin: ''
}
ipcMain.on('set_info',(event, arg) => { // arg为接受到的消息
  arg.username ? userInfo.username = arg.username : ''
  arg.code ? userInfo.code = arg.code : ''
  arg.key ? userInfo.key = arg.key : ''
  arg.id ? userInfo.id = arg.id : ''
  arg.cookie ? userInfo.cookie = arg.cookie : ''
  event.returnValue = {code: 200, data: arg, msg: 'success'}
})

// isEx.post('/set_info', function (req, res) {
//   // console.log('------------------')
//   // console.log(req.body)
//   req.body.username ? userInfo.username = req.body.username : ''
//   req.body.code ? userInfo.code = req.body.code : ''
//   req.body.key ? userInfo.key = req.body.key : ''
//   req.body.id ? userInfo.id = req.body.id : ''
//   req.body.cookie ? userInfo.cookie = req.body.cookie : ''
//   res.send({code: 200, data: req.body, msg: 'success'});
// });

// isEx.post('/readUser', function (req, res) {
//   fs.readFile('C:/TBLM_config.txt', (e, d) => {
//     if (e) {
//       res.send({code: 10500, data: '', msg: '读取用户配置错误'});
//       return
//     }
//     let t = d.toString()
//     res.send({code: 200, data: new Buffer(t, 'base64').toString(), msg: 'success'});
//   })
// })

ipcMain.on('saveUser',(event, arg) => { // arg为接受到的消息
  fs.writeFile('C:/TBLM_config.txt', t, (e, d) => {
    console.log(e)
    if (e) {
      event.returnValue = {code: 10500, data: '', msg: '写入配置错误'};
      return
    }
    event.returnValue = {code: 200, data: '', msg: 'success'};
  })
})

// isEx.post('/saveUser', function (req, res) {
//   let t = new Buffer(JSON.stringify({ur: req.body.ur, pd: req.body.pd})).toString('base64');
//   fs.writeFile('C:/TBLM_config.txt', t, (e, d) => {
//     console.log(e)
//     if (e) {
//       res.send({code: 10500, data: '', msg: '写入配置错误'});
//       return
//     }
//     res.send({code: 200, data: '', msg: 'success'});
//   })
// });

ipcMain.on('get_info',(event, arg) => { // arg为接受到的消息
    event.returnValue = {code: 200, data: userInfo, msg: 'success'};
})

// isEx.post('/get_info', function (req, res) {
//   res.send({code: 200, data: userInfo, msg: 'success'});
// });

let msgView = null
function getLoginMsg() {
  request({
    // encoding: null, //无压缩编码
    url: 'https://pub.alimama.com/common/getUnionPubContextInfo.json',
    method: "GET",
    headers: {
      "accept": "*/*",
      "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
      "x-requested-with": "XMLHttpRequest",
      // 上面为 TB自定义
      // "accept-encoding": "gzip, deflate, br",
      "accept-language": "zh-CN,zh;q=0.9,en;q=0.8",
      "cookie": userInfo.cookie,
      // "origin": "https://pub.alimama.com",
      "referer": "https://pub.alimama.com/manage/overview/index.htm",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "user-agent": "Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.90 Safari/537.36"
    }
  }, (error, response, body) => {
    mainWindow1.webContents.send('war_msg', '检测登录状态')
    // mainWindow1.webContents.send('war_msg', JSON.stringify(body))
    msgView = setTimeout(() => {
      getLoginMsg()
      // io.emit("sendToClient", {message:'isMsg',say:JSON.stringify(body)});
    }, 1000 * 60 * 5)
    if (error) {
      mainWindow1.webContents.send('h_console', error)
      return
    }
    try {
      let body_1 = JSON.parse(body)
      mainWindow1.webContents.send('war_msg', '登录用户-'+body_1.data.mmNick)
      mainWindow1.webContents.send('h_console', body_1)
      mainWindow1.webContents.send('h_console', body_1.data.noLogin)
      if (body_1.data.noLogin) {
        mainWindow1.webContents.send('goLogin', {msg: 'success'})
        io.emit("sendToClient", {message: 'startLogin'});
        mainWindow1.webContents.send('h_console', '登陆掉线！')
      }
    } catch (e) {
      mainWindow1.webContents.send('war_msg', '自动登录错误')
      mainWindow1.webContents.send('h_console', e)
    }
  })
}

ipcMain.on('isLogin',(event, arg) => { // arg为接受到的消息
  request({
    // url: 'http://127.0.0.1:3000/isLogin',
    url: _baseDefaultUrl + '/isLogin',
    method: "POST",
    body: `key=${userInfo.key}`,
    headers: {
      "accept": "*/*",
      "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
      "x-requested-with": "XMLHttpRequest",
      "user-agent": "Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.90 Safari/537.36"
    }
  }, (error, response, body) => {
    if (error) {
      event.returnValue = {code: 200, data: error, msg: 'success'};
      return
    }
    event.returnValue = {code: 200, data: typeof body === 'string' ? JSON.parse(body) : body, msg: 'success'};
  })
})


ipcMain.on('readLog',(event, arg) => { // arg为接受到的消息
  event.returnValue = {code: 200, data: msg_log, msg: 'success'}
})

// isEx.post('/readLog', function (req, res) {
//   res.send({code: 200, data: msg_log, msg: 'success'});
// });

ipcMain.on('getVersion',(event, arg) => { // arg为接受到的消息
  event.returnValue = {code: 200, data: app.getVersion(), msg: 'success'}
})

// isEx.post('/getVersion', function (req, res) {
//   res.send({code: 200, data: app.getVersion(), msg: 'success'});
// });

ipcMain.on('toLogin',(event, arg) => { // arg为接受到的消息
  event.returnValue = {code: 200, data: '', msg: 'success'}
})

// isEx.post('/toLogin', function (req, res) {
//   io.emit("sendToClient", {message: 'startLogin'});
//   res.send({code: 200, data: '', msg: 'success'});
// });


function formatCookie(c) {
  let arrCookie = c.split('; ')
  // console.log(arrCookie)
  let data_t = {}
  for (let i = 0; i < arrCookie.length; i++) {
    data_t[arrCookie[i].split('=')[0]] = arrCookie[i].split('=')[1]
  }
  // console.log(data_t)
  return data_t
}


// isEx.post('/testActive', function (req, res) {
//   getActive()
//   res.end()
// });

let activeStart = 1
let allKeepActive = []

let startShopIndex = 0
let isRate = false
function getActive(d) {
  if(d!=='next'){
    if(isRate){
      mainWindow1.webContents.send('war_msg', '已有任务在进行-不进行监控操作')
      return
    }
  }
  isRate = true
  //  https://pub.alimama.com/cp/event/list.json?toPage=${data.page}&perPageSize=${data.pageSize}${keyword}&sceneId=6&t=${new Date().getTime()}&_tb_token_=${formatCookie(data.cookie)._tb_token_}&pvid=
  // return new Promise((resolve, reject)=>{
  request({
    encoding: null,
    url: `https://pub.alimama.com/cp/event/list.json?toPage=${activeStart}&perPageSize=40&status=7&sceneId=6&t=${new Date().getTime()}&_tb_token_=${formatCookie(userInfo.cookie)._tb_token_}&pvid=`,
    method: "GET",
    headers: {
      "accept": "*/*",
      "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
      "x-requested-with": "XMLHttpRequest",
      // 上面为 TB自定义
      "accept-encoding": "gzip, deflate, br",
      "accept-language": "zh-CN,zh;q=0.9,en;q=0.8",
      "cookie": userInfo.cookie,
      // "origin": "https://pub.alimama.com",
      "referer": "https://pub.alimama.com/manage/cpevent/index.htm",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "user-agent": "Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.90 Safari/537.36"
    }
  }, (error, response, body) => {
    mainWindow1.webContents.send('h_console', '开始获取进行中的活动')
    if (error) {
      console.log(error)
      mainWindow1.webContents.send('h_console', error)
      mainWindow1.webContents.send('war_msg', '获取活动列表失败')
      return
    }
    zlib.unzip(body, (err, buffer) => {
      if (!err) {
        let activesData = JSON.parse(buffer.toString())
        mainWindow1.webContents.send('h_console', '参数返回')
        mainWindow1.webContents.send('h_console', activesData)
        // console.log(typeof activesData)
        mainWindow1.webContents.send('h_console', '本页活动数量'+activesData.data.result.length)
        for (let i = 0; i < activesData.data.result.length; i++) {
          mainWindow1.webContents.send('h_console', '开始循环')
          if (activesData.data.result[i].auditPassed > 0) {
            allKeepActive.push({
              eventId: activesData.data.result[i].eventId,
              title: activesData.data.result[i].title
            })
          }else {
            mainWindow1.webContents.send('h_console', '未找到已审核商品')
          }
        }
        if (activesData.data.totalCount > (40 * activeStart)) {
          mainWindow1.webContents.send('h_console', '所有条数'+ activesData.data.totalCount)
          mainWindow1.webContents.send('h_console', '当前条数'+ (40 * activeStart))
          mainWindow1.webContents.send('h_console', '获取下一页活动列表')
          activeStart++
          getActive('next')
        } else {
          mainWindow1.webContents.send('h_console', '获取有报名审核信息的活动完成共-' + allKeepActive.length + '-条')
          console.log('获取有报名审核信息的活动完成共-' + allKeepActive.length + '-条')
          console.log('开始获取活动中的报名商品')
          // allKeepActive[startShopIndex]
          getActiveShop(allKeepActive, startShopIndex)
        }
        // allKeepActive
      } else {
        mainWindow1.webContents.send('h_console', '获取活动列表失败')
        mainWindow1.webContents.send('h_console', body.toString())
        console.log('gzip 编码解压失败');
        let data = ''
        try {
          data = JSON.parse(body.toString())
          if(data.info.message==="nologin"){
            mainWindow1.webContents.send('goLogin', {msg: 'success'})
            w_fn.toLogin(()=>{
              getActive()
            })
            mainWindow1.webContents.send('h_console', '登录失效')
          }
        }catch (e) {
          mainWindow1.webContents.send('h_console', e)
        }
      }
    });
  })
  // })
}

let shopPageIndex = 1
let activeShopArr = []
let activeShopStartIndex = 0

function getActiveShop(en, index) {
  // https://pub.alimama.com/cp/event/item/list.json?eventId=385330393&category=&auditorId=&auditStatus=2&keyword=&toPage=1&perPageSize=40&t=1595401363259&_tb_token_=ee6356ee73e30&pvid=
  let eventId = en[index].eventId
  request({
    encoding: null,
    url: `https://pub.alimama.com/cp/event/item/list.json?eventId=${eventId}&category=&auditorId=&auditStatus=2&keyword=&toPage=${shopPageIndex}&perPageSize=40&t=${new Date().getTime()}&_tb_token_=${formatCookie(userInfo.cookie)._tb_token_}&pvid=`,
    method: "GET",
    headers: {
      "accept": "*/*",
      "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
      "x-requested-with": "XMLHttpRequest",
      // 上面为 TB自定义
      "accept-encoding": "gzip, deflate, br",
      "accept-language": "zh-CN,zh;q=0.9,en;q=0.8",
      "cookie": userInfo.cookie,
      // "origin": "https://pub.alimama.com",
      "referer": `https://pub.alimama.com/manage/cpevent/audit.htm&eventId=${eventId}&sceneId=6&type=cpevent`,
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "user-agent": "Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.90 Safari/537.36"
    }
  }, (error, response, body) => {
    if (error) {
      console.log(error)
      mainWindow1.webContents.send('h_console', '获取活动报名商品列表失败-重试中')
      mainWindow1.webContents.send('h_console', error)
      getActiveShop(en, index)
      return
    }
    zlib.unzip(body, (err, buffer) => {
      // console.log(body)
      if (!err) {
        let activeShopList = JSON.parse(buffer.toString())
        // mainWindow1.webContents.send('h_console', 'activeShopList----------------')
        // mainWindow1.webContents.send('h_console', activeShopList)
        for (let i = 0; i < activeShopList.data.result.length; i++) {
          activeShopArr.push({
            itemId: activeShopList.data.result[i].itemId,
            title: activeShopList.data.result[i].title,
            commissionRate: activeShopList.data.result[i].commissionRate,
            eventId: eventId,
            eventTitle: en[index].title,
          })
        }
        if (activeShopList.data.totalCount > (40 * shopPageIndex)) {
          shopPageIndex++
          getActiveShop(en, index)
        } else {
          console.log('获取商品完毕')
          shopPageIndex = 1 //分页重置
          getMaxRa(activeShopArr, activeShopStartIndex, () => {
            if (index < en.length - 1) {
              activeShopStartIndex = 0
              activeShopArr = []
              startShopIndex++
              getActiveShop(en, startShopIndex)
            } else {
              activeShopStartIndex = 0
              activeShopArr = []

              startShopIndex = 0
              isRate = false
              mainWindow1.webContents.send('h_console', '全部遍历完毕 wait-360min')
              setTimeout(()=>{
                allKeepActive = []
                activeStart = 1
                getActive()
              },1000*60*360)
            }
          })
        }
        // console.log(buffer.toString());
      } else {
        try {
          let d = JSON.parse(body.toString())
          if(d.data.result){
            let activeShopList = d
            for (let i = 0; i < activeShopList.data.result.length; i++) {
              activeShopArr.push({
                itemId: activeShopList.data.result[i].itemId,
                title: activeShopList.data.result[i].title,
                commissionRate: activeShopList.data.result[i].commissionRate,
                eventId: eventId,
                eventTitle: en[index].title,
              })
            }
            if (activeShopList.data.totalCount > (40 * shopPageIndex)) {
              shopPageIndex++
              getActiveShop(en, index)
            } else {
              console.log('获取商品完毕')
              shopPageIndex = 1 //分页重置
              getMaxRa(activeShopArr, activeShopStartIndex, () => {
                if (index < en.length - 1) {
                  activeShopStartIndex = 0
                  activeShopArr = []
                  startShopIndex++
                  getActiveShop(en, startShopIndex)
                } else {
                  activeShopStartIndex = 0
                  activeShopArr = []
                  startShopIndex = 0
                  isRate = false
                  mainWindow1.webContents.send('h_console', '全部遍历完毕 wait-360min')
                  setTimeout(()=>{
                    allKeepActive = []
                    activeStart = 1
                    getActive()
                  },1000*60*360)
                }
              })
            }
          }
          if(d.info.message==="nologin"){
            mainWindow1.webContents.send('goLogin', {msg: 'success'})
            w_fn.toLogin(()=>{
              getActiveShop(en, index)
            })
            mainWindow1.webContents.send('h_console', '登录失效')
          }
        }catch (e) {
          mainWindow1.webContents.send('h_console', body.toString())
          console.log(body)
          isRate = false
          mainWindow1.webContents.send('h_console', '获取活动报名商品列表失败')
        }
        // console.log('gzip 编码解压失败');
      }
    });
  })
}

function getMaxRa(shop, index, fn) {
  // mainWindow1.webContents.send('h_console', 'shop---------------------')
  // mainWindow1.webContents.send('h_console', shop)
  // console.log(shop)
  // console.log(shop[index])
  // https://api.zhetaoke.com:10001/api/open_gaoyongzhuanlian.ashx?appkey=9b1a959281fa4eeb85c07c25dc56b4c5&sid=35934&pid=mm_132307173_44842903_507000891&num_iid=621555564142&me=&relation_id=&special_id=&external_id=&signurl=0

  let itemId = null
  try {
    itemId = shop[index].itemId
  }catch (e) {
    mainWindow1.webContents.send('h_console', 'err-------------------------')
    mainWindow1.webContents.send('h_console', shop)
    mainWindow1.webContents.send('h_console', index)
    if(index>=shop.length){
      itemId = shop.length-1
    }
  }
  request({
    url: `https://api.zhetaoke.com:10001/api/open_gaoyongzhuanlian.ashx?appkey=9b1a959281fa4eeb85c07c25dc56b4c5&sid=35934&pid=mm_132307173_44842903_507000891&num_iid=${itemId}&me=&relation_id=&special_id=&external_id=&signurl=0`,
    // url: `https://api.zhetaoke.com:10001/api/open_gaoyongzhuanlian.ashx?appkey=9b1a959281fa4eeb85c07c25dc56b4c5&sid=35934&pid=mm_132307173_44842903_507000891&num_iid=584580325931&me=&relation_id=&special_id=&external_id=&signurl=0`,
    method: "GET",
    headers: {
      "accept": "*/*",
      "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
      "x-requested-with": "XMLHttpRequest",
      "user-agent": "Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.90 Safari/537.36"
    }
  }, (error, response, body) => {
    let maxData = {}
    try {
      maxData = JSON.parse(body)
    } catch (e) {
      mainWindow1.webContents.send('h_console', '获取高佣信息错误----正在重试')
      mainWindow1.webContents.send('h_console', error)
      getMaxRa(shop, activeShopStartIndex, fn)
      return
    }
    if (index < shop.length - 1) {
      // mainWindow1.webContents.send('h_console', 'rate---------------------')
      // mainWindow1.webContents.send('h_console', maxData)
      // console.log(maxData.tbk_privilege_get_response.result.data.max_commission_rate)
      let maxRate = ''
      try {
        maxRate = Number(maxData.tbk_privilege_get_response.result.data.max_commission_rate)
      } catch (e) {
        mainWindow1.webContents.send('h_console', `${shop[index].title}-获取商品最高佣失败`)
        mainWindow1.webContents.send('h_console', maxData)
        request({
          url: _baseDefaultUrl + '/watch_rate',
          method: "POST",
          body: JSON.stringify({
            username:userInfo.username,
            code:userInfo.code,
            id:userInfo.id,
            itemId:shop[index].itemId,
            title:shop[index].title,
            commissionRate:shop[index].commissionRate,
            eventId:shop[index].eventId,
            eventTitle:shop[index].eventTitle,
            maxRate:0,
            cause:maxData.error_response.sub_msg
          }),
          headers: {
            "accept": "*/*",
            "content-type": "application/json; charset=UTF-8",
            "x-requested-with": "XMLHttpRequest",
            "user-agent": "Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.90 Safari/537.36"
          }
        }, (error, response, body) => {
          activeShopStartIndex++
          getMaxRa(shop, activeShopStartIndex, fn)
        })
        // getMaxRa(shop, activeShopStartIndex, fn)
        return
      }
      let nowRate = shop[index].commissionRate
      if (maxRate > nowRate) {
        mainWindow1.webContents.send('h_console', `${shop[index].title}--原始佣金比率${nowRate}---最新佣金比率${maxRate}`)
        request({
          url: _baseDefaultUrl + '/watch_rate',
          method: "POST",
          body: JSON.stringify({
            username:userInfo.username,
            code:userInfo.code,
            id:userInfo.id,
            itemId:shop[index].itemId,
            title:shop[index].title,
            commissionRate:shop[index].commissionRate,
            eventId:shop[index].eventId,
            eventTitle:shop[index].eventTitle,
            maxRate:maxRate,
            cause:'佣金变动'
          }),
          headers: {
            "accept": "*/*",
            "content-type": "application/json; charset=UTF-8",
            "x-requested-with": "XMLHttpRequest",
            "user-agent": "Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.90 Safari/537.36"
          }
        }, (error, response, body) => {
          activeShopStartIndex++
          getMaxRa(shop, activeShopStartIndex, fn)
        })
      } else {
        mainWindow1.webContents.send('h_console', `${shop[index].title}**${nowRate}未变化`)
        activeShopStartIndex++
        getMaxRa(shop, activeShopStartIndex, fn)
      }
      // activeShopStartIndex++
      // getMaxRa(shop, activeShopStartIndex, fn)
    } else {
      fn('finish')
    }
  })
}


function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })
  mainWindow1 = mainWindow
  // and load the index.html of the app.
  mainWindow.loadFile('index.html')
  // mainWindow.loadURL('https://pub.alimama.com/manage/overview/index.htm')
  // mainWindow.loadURL('https://login.taobao.com/member/login.jhtml?style=mini&newMini2=true&from=alimama&redirectURL=https%3A%2F%2Fpub.alimama.com%2Fmanage%2Foverview%2Findex.htm&full_redirect=true&disableQuickLogin=true')
  // Open the DevTools.
  mainWindow.webContents.openDevTools()
  mainWindow.webContents.send('getPort', {
    a:1
  })

  const filter = {
    urls: ['https://*.pub.alimama.com/common/getUnionPubContextInfo.json*']
  }

  w_fn.toLogin = function(fn){
    session.defaultSession.webRequest.onBeforeSendHeaders(filter, (details, callback) => {
      userInfo.cookie = details.requestHeaders.Cookie
      io.emit("sendToClient", {message: 'isMsg', say: '获取cookie成功'});
      request({
        url: _baseDefaultUrl + '/users/send_cookie.php',
        method: "POST",
        body: `cookie=${encodeURIComponent(details.requestHeaders.Cookie)}&username=${userInfo.username}&code=${userInfo.code}`,
        headers: {
          "accept": "*/*",
          "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
          "x-requested-with": "XMLHttpRequest",
          "user-agent": "Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.90 Safari/537.36"
        }
      }, (error, response, body) => {
        // console.log(body)
        if (error) {
          mainWindow.webContents.send('jump', error)
          return
        }
        msg_log['get_cookie'] = body
        mainWindow.webContents.send('jump', body)
        fn('success')
      })
      callback({requestHeaders: details.requestHeaders})
    })
  }
  let isFirst = true
  session.defaultSession.webRequest.onBeforeSendHeaders(filter, (details, callback) => {
    // details.requestHeaders['User-Agent'] = 'MyAgent'
    console.log('---------------------------------')
    userInfo.cookie = details.requestHeaders.Cookie
    console.log('拦截cookie' + userInfo.cookie)
    io.emit("sendToClient", {message: 'isMsg', say: '获取cookie成功'});
    request({
      url: _baseDefaultUrl + '/users/send_cookie.php',
      // url: 'http://127.0.0.1:3000/users/send_cookie.php',
      method: "POST",
      body: `cookie=${encodeURIComponent(details.requestHeaders.Cookie)}&username=${userInfo.username}&code=${userInfo.code}`,
      headers: {
        "accept": "*/*",
        "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
        "x-requested-with": "XMLHttpRequest",
        "user-agent": "Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.90 Safari/537.36"
      }
    }, (error, response, body) => {
      // console.log(body)
      if (error) {
        mainWindow.webContents.send('jump', error)
        return
      }
      msg_log['get_cookie'] = body
      mainWindow.webContents.send('jump', body)
      io.emit("sendToClient", {message: 'isMsg', say: '发送cookie成功'});
      if(!msgView){
        getLoginMsg()
      }
      // mainWindow.webContents.send('h_console', '未检测到登陆状态')
      if(isFirst){
        isFirst = false
        setTimeout(()=>{
          mainWindow.webContents.send('h_console', '2min-开始监控佣金')
          getActive()
        },1000*60*2)
      }

    })
    // request
    callback({requestHeaders: details.requestHeaders})
  })

  mainWindow.webContents.session.on('will-download', (event, item, webContents) => {
    //设置文件存放位置，如果用户没有设置保存路径，Electron将使用默认方式来确定保存路径（通常会提示保存对话框）
    // item.setSavePath(savepath+item.getFilename())
    item.on('updated', (event, state) => {
      if (state === 'interrupted') {
        console.log('Download is interrupted but can be resumed')
        mainWindow.webContents.send('downstate', {
          state: 'interrupted'
        })
      } else if (state === 'progressing') {
        if (item.isPaused()) {
          console.log('Download is paused')
        } else {
          // mainWindow.webContents.send('downstate',item.getTotalBytes()+'-'+item.getReceivedBytes()+'-'+item.getSavePath())
          mainWindow.webContents.send('downstate', {
            state: 'download',
            TotalBytes: item.getTotalBytes(),
            ReceivedBytes: item.getReceivedBytes()
          })
          console.log(`Received bytes: ${item.getReceivedBytes()}`)
        }
      }
    })
    item.once('done', (event, state) => {
      if (state === 'completed') {
        console.log('Download successfully')
        // shell.beep()
        setTimeout(()=>{
          shell.openPath(item.getSavePath())
          // mainWindow.webContents.send('downstate',state)
          mainWindow.webContents.send('downstate', {
            state: 'completed'
          })
          setTimeout(()=>{
            app.quit()
            app.quit()
          },500)
        },2000)
      } else {
        mainWindow.webContents.send('downstate', {
          state: 'failed'
        })
        console.log(`Download failed: ${state}`)
        mainWindow.webContents.send('downstate', state)
      }
    })
  })

  let allUserXlsDate = {}
  let isOuting = false
  ipcMain.on('startOutXls',(event, arg) => { // arg为接受到的消息
    if (isOuting) {
      event.returnValue ={
        msg: '存在正在进行中的任务',
        code: 200
      }
      return;
    }
    let _s_t = arg._s_t
    let _e_t = arg._e_t
    let dt_1 = new Date();
    dt_1.setMonth(dt_1.getMonth() - 1);
    let toDay_ = `${dt_1.getFullYear()}-${(dt_1.getMonth() + 1) > 9 ? (dt_1.getMonth() + 1) : '0' + (dt_1.getMonth() + 1)}-${dt_1.getDate()} :00:00:00`
    if (new Date(toDay_).getTime() > new Date(_s_t).getTime()) {
      event.returnValue = {
        msg: '最多只支持导入最近一个月的报表',
        code: 200
      }
      mainWindow.webContents.send('war_msg', '最多只支持导入最近一个月的报表')
      return;
    }
    if (!_s_t || !_e_t) {
      event.returnValue = {
        msg: '请选择导出开始日期',
        code: 200
      }
      // alert('')
      return
    }
    if (new Date(_s_t).getTime() > new Date(_e_t).getTime()) {
      // alert('开始时间不能大于结束时间')
      event.returnValue = {
        msg: '开始时间不能大于结束时间',
        code: 200
      }
      return
    }
    if (
      !userInfo.username ||
      !userInfo.code ||
      !userInfo.key ||
      !userInfo.id ||
      !userInfo.cookie
    ) {

      mainWindow.webContents.send('war_msg', '未检测到登陆状态')
      mainWindow.webContents.send('h_console', '未检测到登陆状态')
      event.returnValue = {
        msg: '未检测到登陆状态',
        code: 200
      }
      return
    }
    isOuting = true
    nowUuid = uuid.v1()
    // 分配导出 ID
    // let xlsTime = handleTimeFormat(dt_).split(' ')+' 00:00:00'
    // let xlsTime = '2020-07-14 00:00:00'
    let xlsTime = _s_t + ' 00:00:00'
    allUserXlsDate[userInfo.id] = {
      i: 1,
      list: '',
      listData: '',
      allIndex: '',
      xlsTime: xlsTime
    }
    // let curPath = path.resolve(__dirname, '../public/xls')
    let existsName = path.resolve(__dirname, '../') + '\\' + userInfo.username
    if (!fs.existsSync(existsName)) {
      fs.mkdirSync(existsName, 0o777);
    }
    toSaveXls(allUserXlsDate[userInfo.id].xlsTime, userInfo.cookie, userInfo.id, userInfo.username)
    event.returnValue = {
      msg: '正在导入中，此过程需要数个小时，请耐心等待',
      code: 200
    }
    // event.returnValue = {code: 200, data: '', msg: 'success'}
  })
  // isEx.post('/startOutXls', (req, res, next) => {
  //   // console.log(req.session.user)
  //
  // })

  function handleTimeFormat(timestamp, type) {
    let date = new Date(timestamp)
    let y = date.getFullYear()
    let m = date.getMonth() + 1
    let d = date.getDate()
    let h = date.getHours()
    let mm = date.getMinutes()
    let s = date.getSeconds()
    if (type === 'date') {
      return add0(y) + '/' + add0(m) + '/' + add0(d)
    } else if (type === 'datetime') {
      return add0(y) + '-' + add0(m) + '-' + add0(d) + ' ' + add0(h) + ':' + add0(mm) + ':' + add0(s)
    } else if (type === 'datetimeslash') {
      return add0(y) + '/' + add0(m) + '/' + add0(d) + ' ' + add0(h) + ':' + add0(mm) + ':' + add0(s)
    } else {
      return add0(y) + '-' + add0(m) + '-' + add0(d) + ' ' + add0(h) + ':' + add0(mm) + ':' + add0(s)
    }
  }

  const add0 = (time) => {
    return time < 10 ? '0' + time : time
  }

  function saveFile(filePath, fileData) {
    return new Promise((resolve, reject) => {
      // 块方式写入文件
      const wstream = fs.createWriteStream(filePath);
      wstream.on('open', () => {
        const blockSize = 128;
        const nbBlocks = Math.ceil(fileData.length / (blockSize));
        for (let i = 0; i < nbBlocks; i += 1) {
          const currentBlock = fileData.slice(
            blockSize * i,
            Math.min(blockSize * (i + 1), fileData.length),
          );
          wstream.write(currentBlock);
        }
        wstream.end();
      });
      wstream.on('error', (err) => {
        reject(err);
      });
      wstream.on('finish', () => {
        resolve(true);
      });
    });
  }

  function toSaveXls(time, cookie, id, name) {
    request({
      encoding: null, //无压缩编码
      url: `https://pub.alimama.com/report/getCPPaymentDetails.json?queryType=1&payStatus=&DownloadID=DOWNLOAD_EXPORT_SERVICE_FEE_OVERVIEW&startTime=${time}&endTime=${handleTimeFormat(new Date(time).getTime() + 21600000)}`,
      method: "GET",
      headers: {
        "accept": "*/*",
        "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
        "x-requested-with": "XMLHttpRequest",
        // 上面为 TB自定义
        "accept-language": "zh-CN,zh;q=0.9,en;q=0.8",
        "cookie": cookie,
        "referer": "https://pub.alimama.com/manage/overview/index.htm",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "user-agent": "Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.90 Safari/537.36"
      }
    }, (error, response, body) => {
      if (error) {
        console.log(error)
      }
      if (response.headers['content-disposition']) {
        console.log(response.headers['content-disposition'])
        // let filename = response.headers['content-disposition'].split('; ')[1].split('=')[1]
        fileArray = allUserXlsDate[id].xlsTime.split('-')
        // let curPath = path.resolve(__dirname, '../public/xls')
        let existsName = path.resolve(__dirname, '../') + '\\' + name + '\\' + fileArray[0] + '-' + fileArray[1]
        mainWindow.webContents.send('h_console', '设置文件夹-' + existsName)
        if (!fs.existsSync(existsName)) {
          fs.mkdirSync(existsName, 0o777);
        }
        let outTime = new Date(time).getTime()
        let nowTime = new Date(new Date().toLocaleString().split(' ')[0].replace(/\//g, '-')).getTime()
        if (outTime < nowTime) {
          mainWindow.webContents.send('h_console', '设置路径-' + existsName + '\\' + time.replace(/:/g, '-') + '.xls')
          saveFile(existsName + '\\' + time.replace(/:/g, '-') + '.xls', body)
            .then((d) => {
              // console.log(`导出 - ${allUserXlsDate[id].xlsTime.replace(/:/g, '-')}`)
              // console.log('success')
              allUserXlsDate[id].list = xlsx.parse(existsName + '\\' + time.replace(/:/g, '-') + '.xls');
              mainWindow.webContents.send('h_console', '文件-' + existsName + '\\' + time.replace(/:/g, '-') + '.xls')
              mainWindow.webContents.send('war_msg', '开始')
              mainWindow.webContents.send('war_msg', time.replace(/:/g, '-') + '.xls')
              // console.log(xlsx.parse(existsName + '\\' + time.replace(/:/g, '-') + '.xls'))
              allUserXlsDate[id].listData = allUserXlsDate[id].list[0].data
              allUserXlsDate[id].allIndex = allUserXlsDate[id].listData.length
              let nextTime = handleTimeFormat(new Date(time).getTime() + 21600000)
              // 86400000 每天分四份导出
              // curPath = existsName + '\\' + allUserXlsDate[id].xlsTime.replace(/:/g, '-') + '.xls'
              insertOrder((d) => {
                allUserXlsDate[id].xlsTime = nextTime
                toSaveXls(allUserXlsDate[id].xlsTime, cookie, id, name)
              }, id)
            })
            .catch((e) => {
              console.log(e)
            })
        } else {
          mainWindow.webContents.send('war_msg', `完成 - 导出日期截止至 - ${allUserXlsDate[id].xlsTime}`)
          console.log(`导出日期截止至 - ${allUserXlsDate[id].xlsTime}`)
        }
      } else {
        console.log('登录过期或者下载被禁止')
        mainWindow.webContents.send('war_msg', '登录过期或者下载被禁止')
      }
    })
  }


  let _$inStart = 0

  function insertOrder(fn, id) {
    try {
      // mainWindow.webContents.send('h_console', allUserXlsDate[id].listData)
      let listData = allUserXlsDate[id].listData
      listData.splice(0, 1)
      if (!listData.length) {
        fn('success')
      }
      let toSplitData = {}
      for (let i = 0; i < listData.length?(~~(listData.length / 100)) + 1 : 0; i++) {
        toSplitData[i] = []
        toSplitData['length'] = listData.length?(~~(listData.length / 100)) + 1 : 0
      }

      // mainWindow.webContents.send('h_console', toSplitData)
      for (let i = 0; i < listData.length; i++) {
        let creat_time = new Date(listData[i][0]).getTime()
        let click_time = new Date(listData[i][1]).getTime()
        let pay_earnest_time = listData[i][17] === '--' ? 0 : new Date(listData[i][17]).getTime()
        let pay_earnest_tb_time = listData[i][18] === '--' ? 0 : new Date(listData[i][18]).getTime()
        let shop_cut_time = listData[i][12] === '' ? 0 : new Date(listData[i][12]).getTime()
        toSplitData[(~~(i / 100))].push({
          order: `(${creat_time}, ${click_time}, "${listData[i][2]}", ${listData[i][3]},"${listData[i][4]}","${listData[i][5]}",${listData[i][6]},${listData[i][7]},"${listData[i][8]}","${listData[i][9]}",${listData[i][10]},${listData[i][11]},${shop_cut_time},${listData[i][13]},${listData[i][14]},${listData[i][15]},${listData[i][16]},${pay_earnest_time},${pay_earnest_tb_time},${listData[i][19]},${id},"${nowUuid}")`,
          orderId: listData[i][15],
          shopId: listData[i][3],
          or_uid: nowUuid
        })
      }
      // console.log(toSplitData)
      mainWindow.webContents.send('h_console', toSplitData)
      split_data(toSplitData, _$inStart, () => {
        fn('success')
        mainWindow.webContents.send('war_msg', '全部发送')
        mainWindow.webContents.send('h_console', '全部发送')
      })
    } catch (e) {
      isOuting = false
      console.log(e)
      mainWindow.webContents.send('war_msg', e)
      mainWindow.webContents.send('h_console', e)
    }
  }

  function split_data(all, i, fn) {
    request({
      url: _baseDefaultUrl + '/inXls',
      // url: 'http://127.0.0.1:3000/inXls',
      method: "POST",
      body: JSON.stringify({
        xls: all[i],
        username: userInfo.username,
        code: userInfo.code
      }),
      headers: {
        "accept": "*/*",
        "content-type": "application/json; charset=UTF-8",
        "x-requested-with": "XMLHttpRequest",
        "user-agent": "Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.90 Safari/537.36"
      }
    }, (error, response, body) => {
      if (!body) {
        isOuting = false
        mainWindow.webContents.send('war_msg', '插入错误')
        mainWindow.webContents.send('h_console', '插入错误')
        mainWindow.webContents.send('h_console', body)
        mainWindow.webContents.send('h_console', error)
        return
      }
      let b = ''
      try {
        b = JSON.parse(body)
      } catch (e) {
        b = {
          code: 500
        }
      }
      mainWindow.webContents.send('h_console', b)
      if (b.code === 200) {
        if (i === all.length - 1) {
          _$inStart = 0
          fn('finish')
        } else {
          _$inStart++
          split_data(all, _$inStart, fn)
        }
      } else {
        isOuting = false
        mainWindow.webContents.send('war_msg', '失败')
        mainWindow.webContents.send('h_console', '失败')
        mainWindow.webContents.send('h_console', body)
      }
    })
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow()
  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

