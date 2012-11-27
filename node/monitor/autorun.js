//自动运行模块
var fs = require('fs');

var autoRunModules = {}, autoRunPath = 'autorun', requirePath = '../autorun/';
function autoRun() {
    fs.readdir(autoRunPath, function(err, files) {
        if (err) {
            console.error("read dir error:", err);
        } else {
            for ( var i = 0, len = files.length; i < len; i++) {
                var file = files[i];
                if (file != '.' && file != '..') {
                    if (!autoRunModules[file]) {
                        try {
                            console.log("auto load module:", file);
                            autoRunModules[file] = require(requirePath + file);
                        } catch (e) {
                            console.error("require auto run file error:", e);
                        }
                    }
                }
            }
        }
    });
}
autoRun();
setInterval(autoRun, 10000);