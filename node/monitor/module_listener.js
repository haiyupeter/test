var fs=require("fs"),
    cfg = require("./conf/comm.json");

console.log("file listener start!");

var cwd = process.cwd();
function startWith(str, test) {
    if (str === test) {
        return true;
    }
    var l1 = str.length, l2 = test.length;
    if (l1 < l2) {
        return false;
    }
    for ( var i = 0; i < l2; i++) {
        if (str.charAt(i) != test.charAt(i)) {
            return false;
        }
    }
    return true;
}
if (cfg.file_changed_watch) {
    t2();
}
/*
else {
    t1();
}
*/

// 使用filewatch监控
function t1() {
    var watchMap = {};
    (function checkCache() {
        try {
            var cache = require.cache;
            for ( var p in cache) {
                if (!watchMap[p] && startWith(p, cwd)) {
                    watchMap[p] = fs.watch(p, watch);
                    var m = cache[p];
                }
            }
        } catch (e) {
            console.error(e);
        }
        setTimeout(checkCache, 5000);
    })();

    function watch(event, file) {
        console.log("file changed:%s", file);
        process.exit(1);
    }
}
// 定时器监控
function t2() {
    var ltime = new Date().getTime();

    (function checkCache() {
        setTimeout(function() {
            var cache = require.cache;
            var arr = [];
            for ( var p in cache) {
                if (startWith(p, cwd)) {
                    arr.push(p);
                }
            }
            // 检查
            (function check(i) {
                fs.lstat(arr[i], function(err, stat) {
                    if (err) {
                        // 记录日志并且进程退出
                        console.log("file changed,restart now!");
                        process.exit(1);
                    } else {
                        try {
                            var mtime = stat.mtime;
                            if (new Date(mtime).getTime() > ltime) {
                                // 记录日志并且进程退出
                                console.log(arr[i] + " - file changed,restart now!");
                                process.exit(1);
                            } else {
                                if (i--) {
                                    check(i);
                                } else {
                                    checkCache();
                                }
                            }
                        } catch (e) {
                            console.error(e);
                            checkCache();
                        }
                    }
                });
            })(arr.length - 1);
        }, 10000);
    })();
}
