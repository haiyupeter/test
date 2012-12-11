var log4js = require("log4js"),
	cluster = require('cluster');

if(cluster.isMaster) {
	log4js.configure({
        "appenders" : [ {
            "type" : "multiprocess",
            "mode" : "master",
            "loggerPort" : 8089,
            "appender" : {
                "type" : "file",
                "filename" : "/data/nodejs/mainLog.log",
                "maxLogSize" : 20480,
                "backups" : 10,
                "pollInterval" : 15,
                "level" : "ALL",
                "category" : [ "main" ]
            }
        } ]
    });
} else {
	log4js.configure({
        appenders : [ {
            "type" : "multiprocess",
            "mode" : "worker",
            "loggerPort" : 8089
        } ]
    });
};

exports.get=function(name){
	return log4js.getLogger(name || "main");
}
