/*
 * @author brianliu
 * @desc http监听，初步的静态文件访问转发、module路由转发
 *
*/
var conf = require('./conf/conf');
var express = require('express');
var helper = require("common_helper");
var log4js = require("log4js");

var app = express.createServer();

// app监控数据
app.monitorData = {
    connsBillon : 0,
    totalConns : 0,// 总请求数
    connections : 0,// 当前连接数
    totalSlowConnections : 0,// 总慢速请求
    sconnsBillon : 0,
    lastSlowConnections : 0,// 前次慢速请求
    slowConnections : 0,// 慢速响应
    startTime : new Date() // 服务启动时间
};
// 连接数管理
app.connections = 0;
app.use(function(req, res, next) {
    app.monitorData.totalConns++;
    if (app.monitorData.totalConns > 999999999) {
        app.monitorData.totalConns = 0;
        app.monitorData.connsBillon++;
    }
    req.connection.startTime = new Date();
    app.monitorData.connections = req.connection.server.connections;
    req.connection.on("close", function() {
        var timeInterval = new Date() - req.connection.startTime;
        if (timeInterval >= 3000) {// 3秒及以上记为慢速请求
            app.monitorData.totalSlowConnections++;
            app.monitorData.slowConnections++;
            if (app.monitorData.totalSlowConnections > 999999999) {
                app.monitorData.totalSlowConnections = 0;
                app.monitorData.sconnsBillon++;
            }
        }
        app.monitorData.connections = req.connection.server.connections;
    });
    next();
});

// status
app.get(/^\/status$/, function(req, res) {
    var ip = helper.getIp(req.headers);
    if ((!process.env.NODE_NOCHECK) && ip != "127.0.0.1") {
        res.send('load app fail!', 404);
        return;
    }
    var memInfo = process.memoryUsage();
    res.setHeader("Content-Type", "text/plain; charset=utf-8;");
    // ip
    res.write("ip:" + ip);
    res.write("\r\n");
    res.write(getStatus());
    res.end();
});

/**
 * 获取服务状态
 */
function getStatus() {
    var array = new Array();
    var memInfo = process.memoryUsage();
    // 启动时间
    array.push("start time:" + app.monitorData.startTime.toString());
    // 允许时长
    array.push("run seconds:" + parseInt(process.uptime()));
    // 总连接数
    array.push("conns total:" + app.monitorData.totalConns);
    if (app.monitorData.connsBillon) {
        array.push("conns total billon:" + app.monitorData.sconnsBillon + "E");
    }
    // 当前连接数
    array.push("conns current:" + app.monitorData.connections);
    // 总慢速请求数
    array.push("slow conns total:" + app.monitorData.totalSlowConnections);
    if (app.monitorData.sconnsBillon) {
        array.push("slow conns total billon:" + app.monitorData.sconnsBillon + "E");
    }
    // 当前慢速请求数
    array.push("slow conns last:" + app.monitorData.lastSlowConnections);
    // 当前慢速请求数
    array.push("slow conns current:" + app.monitorData.slowConnections);
    // 堆大小
    array.push("heap total:" + helper.formatSize(memInfo.heapTotal));
    // 堆使用
    array.push("heap used:" + helper.formatSize(memInfo.heapUsed));
    //内存使用
    array.push("rss:" + helper.formatSize(memInfo.rss));
    return array.join("\r\n");
}

var logPath = "/data/nodejs/";
if (process.argv && process.argv.length) {
    for ( var i = 0, len = process.argv.length; i < len; i++) {
        if (process.argv[i] == '-log') {
            var logPath = process.argv[i + 1];
            if (logPath) {
                logPath = logPath.split("/");
                logPath.pop();
                logPath = logPath.join("/");
            }
            break;
        }
    }
}
// 状态计入日志文件
log4js.configure({
    "appenders" : [ {
        "type" : "file",
        "filename" : logPath + "/status.log",
        "maxLogSize" : 20480,
        "backups" : 10,
        "pollInterval" : 15,
        "level" : "ALL",
        "category" : [ "status" ]
    } ]
});
var logger = log4js.getLogger("status");
setInterval(function() {
    logger.info("====== STATUS ======\r\n" + getStatus() + "\r\n");
    // 更新慢速请求数量
    app.monitorData.lastSlowConnections = app.monitorData.slowConnections;
    app.monitorData.slowConnections = 0;
}, 60000);

// 框架组件
// TODO 使用file watch监控配置
loadFrameModule(conf.frameModule, app);

var port = 8088;
if (process.argv && process.argv.length) {
    for ( var i = 0, len = process.argv.length; i < len; i++) {
        if (process.argv[i] == '-port') {
            var p = process.argv[i + 1];
            if (p && /^\d+$/.test(p) && 1000 < p && p < 65535) {
                port = parseInt(p, 10);
            }
            break;
        }
    }
}
app.listen(port);
console.log('server running at ' + port + '...');
/** *******common*********** */
/*
 * 加载框架组件 @param list 组件地址 @param list httpserver对象
 */
function loadFrameModule(list, app) {
    // TODO 加载的错误处理需要补全
    for ( var i = 0; i < list.length; i++) {
        var m = require(list[i]);
        m.main(app);
    }
}