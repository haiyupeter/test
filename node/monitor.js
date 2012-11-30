require('./monitor/module_listener.js');
(function(){
    // 开始心跳，与父进程联系
    if (process.argv && process.argv.length) {
        for ( var i = 0, len = process.argv.length; i < len; i++) {
            if (process.argv[i] == '-ppid') {// ppid参数，由父进程启动的
                console.log('startHB');
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
            console.log('child receive msg: ' + message);
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