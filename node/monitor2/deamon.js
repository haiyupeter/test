/**
 * @author wubocao
 * 守护进程模块
 * 使用addDeamon(model,args,option)来添加一个守护进程
 * 该函数返回一个守护进程对象，通过调用该对象的stop和init来停止和重新启动该进程
 * 
 */
require("./custom_log.js");
var cp = require("child_process");
var util = require("util");

(function(){
	// 开始心跳，与父进程联系
    if (process.argv && process.argv.length) {
        for ( var i = 0, len = process.argv.length; i < len; i++) {
            if (process.argv[i] == '-ppid') {// ppid参数，由父进程启动的
                startHB();
                break;
            }
        }
    }
	// 开始心跳
	function startHB() {
        // 退出信号处理
        process.on("SIGQUIT", function() {
            console.log("request for exit");
            process.exit(0);
        });

        // 与父进程断开联系信号处理
        process.on("disconnect", function() {
            console.log("request for exit");
            process.exit(-1);
        });

        // 心跳消息处理
        process.on("message", function(message) {
            if (typeof message == "object") {
                if (message.name == "proccessInfo") {
                    process.send({
                        name : "proccessInfo",
                        value : process.memoryUsage()
                    });
                }
            } else if (typeof message === "string") {
                switch (message) {
                case "heartbeat":// 心跳回包
                    if (heartbeatTimer) {
                        times = 0;
                        clearTimeout(heartbeatTimer);
                        heartbeatTimer = 0;
                    }
                    break;
                }
            }
        });

        // times为监控心跳连续失败次数
        var times = 0, heartbeatTimer;

        // 心跳检查
        function checkParent() {
            // 做1500毫秒等待，判断deamon子进程是否挂掉
            heartbeatTimer = setTimeout(function() {
                times++;
                t = 0;
                if (times >= 3) {
                    times = 0;
                    console.log("heart check with no response more then 3 times,exit now");
                    process.exit(-1);
                }
            }, 1500);

            times > 0 && console.log("try get parent heartbeat " + times + " times");
            //心跳发包
            process.send({
                name : "broadcast",
                value : "heartbeat"
            });
        }

        //每5秒获取下
        setInterval(checkParent, 5000);
    }
})();

//对象深拷贝
function copyObj(obj, stack) {
    stack = stack || [];
    var t;
    if (obj == null) {
        return t;
    }
    if (util.isArray(obj)) {// 数组
        var instance = copyObj.getStack(obj, stack);
        if (instance) {
            return instance;
        }
        var len = obj.length;
        t = new Array(len);
        stack.push([ obj, t ]);
        for ( var i = 0; i < len; i++) {
            t[i] = copyObj(obj[i]);
        }
    } else if (typeof obj == "object") {
        var instance = copyObj.getStack(obj, stack);
        if (instance) {
            return instance;
        }
        t = {};
        stack.push([ obj, t ]);
        for ( var k in obj) {
            t[k] = copyObj(obj[k]);
        }
    } else {
        t = obj;
    }
    return t;
}
copyObj.getStack = function(obj, stack) {
    for ( var i = stack.length; i--;) {
        if (stack[i][0] === obj) {
            return stack[i][1];
        }
    }
    return null;
};

// 守护进程对象
function deamon(model, args, option) {
    if (!model || typeof model != "string") {
        throw new Error("illegal model argument");
    }
    var __args;
    if (args) {
        if (util.isArray(args)) {
            __args = copyObj(args);
        } else {
            __args = [ args ];
        }
    }
    var __opt;
    if (typeof option == "object") {
        __opt = copyObj(option);
    } else {
        __opt = {};
    }
    this.__model = model;
    this.__args = __args;
    this.__opt = __opt;
    this.__cpr = null;
    this.__cprid = 0;
    this.__heartbeat = 0;
    this.init();
}
deamon.prototype = {
    init : function() {
        if (this.__cpr) {
            return;
        }
        this.__kill = false;
        console.log("deamon init");
        var exeTime = this.__opt.timeout;
        var start = new Date().getTime();
        var context = this;
        (function run() {
            console.log("process start");
            context.__cpr = cp.fork(context.__model, context.__args, context.__opt);
            context.__cprid = context.__cpr.pid;
            context.__cpr.on("exit", function(e) {
                console.log("process exit");
                if (context.__kill) {
                    return;
                }
                if (exeTime > 0) {
                    var end = new Date().getTime();
                    if (end - start < exeTime) {
                        run();
                    } else {
                        context.__cpr = null;
                        context.__cprid = 0;
                    }
                } else {
                    run();
                }
            });
            context.__cpr.on("message", function(message) {
                if (typeof message == "object") {
                    switch (message.name) {
                    case "proccessInfo":// 进程信息(心跳检查)
                        context.__messageCall && context.__messageCall(message.value);
                        break;
                    case "broadcast":// 经常广播消息
                        try {
                            context.__cpr.send(message.value);
                        } catch (e) {
                            console.error("broadcast message error:", e);
                        }
                        break;
                    }
                }
            });
        })();
        // 开始监控心跳
        this.startHeartbeat();
    },
    stop : function() {
        if (this.__cpr) {
            console.log("deamon stop");
            this.__kill = true;
            this.__cpr.disconnect();
            this.__cpr.kill('SIGQUIT');
            this.__cpr = null;
            this.__cprid = 0;
        }
    },
    stopForce : function() {
        if (this.__cpr) {
            console.log("deamon stop force");
            this.__kill = true;
            // this.__cpr.kill('SIGKILL');
            cp.exec("kill -9 " + this.__cprid);
            this.__cpr = null;
            this.__cprid = 0;
        }
    },
    getInfo : function(callback, msg) {
        if (this.__cpr) {
            this.__messageCall = callback;
            try {
                if (msg) {
                    console.log("try get child process info with message[" + msg + "]");
                }
                this.__cpr.send({
                    name : "proccessInfo",
                    msg : msg || ""
                });
            } catch (e) {
                console.error("send message 'proccessInfo' error:", e);
            }
        } else {
            console.error("no child process when get child process info");
        }
    },
    //开始心跳
    startHeartbeat : function() {
        var deamon = this;
        //先停掉原来的心跳
        this.stopHeartbeat();
        //times为监控心跳连续失败次数
        var times = 0;
        //心跳检查
        function checkDeamon() {
            //做1500毫秒等待，判断deamon子进程是否挂掉
            var t = setTimeout(function() {
                times++;
                t = 0;
                if (times >= 3) {
                    console.log("heart check with no response more then 3 times,restart now");
                    times = 0;
                    deamon.stopHeartbeat();
                    deamon.stopForce();
                    setTimeout(function() {
                        deamon.init();
                    }, 1000);
                }
            }, 1500);
            deamon.getInfo(function(memInfo) {
                if (t != 0) {
                    clearTimeout(t);
                    t = 0;
                }
                times = 0;
                //console.log(memInfo);
            }, times > 0 ? "retry with times:" + times : "");
        }
        //每5秒获取下
        this.__heartbeat = setInterval(checkDeamon, 5000);
    },
    //停止心跳
    stopHeartbeat : function() {
        this.__heartbeat = this.__heartbeat && clearInterval(this.__heartbeat);
    }
};

exports.addDeamon = function(model, args, option) {
    args = args || [];
    // 过滤掉ppid参数
    for ( var i = 0, len = args.length; i < len; i++) {
        if (args[i] == '-ppid') {
            i++;
        }
    }
    return new deamon(model, args.concat([ '-ppid', process.pid ]), option);
}