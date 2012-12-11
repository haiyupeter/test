/**
 * @author wubocao
 * 日志模块，更改console的输出，添加时间和日志level信息
 */
var log = console.log;
var err = console.error;
var info = console.info;
function fillZero(str, len) {
    var sl = str.length;
    if (sl < len) {
        var bf = new Array(len - sl);
        for ( var i = len - sl; i--;) {
            bf[i] = '0';
        }
        return bf.join('') + str;
    } else {
        return str;
    }
}
function printDate(out){
	var d = new Date();
    out.write(d.getFullYear() + "/" + fillZero((d.getMonth() + 1).toString(), 2) + "/"
            + fillZero(d.getDate().toString(), 2) + ' ' + fillZero(d.getHours().toString(), 2) + '-'
            + fillZero(d.getMinutes().toString(), 2) + '-' + fillZero(d.getSeconds().toString(), 2) + '.'
            + fillZero(d.getMilliseconds().toString(), 3));
}
console.log = function() {
    process.stdout.write('[LOG]');
    printDate(process.stdout);
    process.stdout.write(':');
    log.apply(this, arguments);
}
console.info = function() {
    process.stdout.write('[INFO]');
    printDate(process.stdout);
    process.stdout.write(':');
    info.apply(this, arguments);
}
console.error = function() {
    process.stderr.write('[ERROR]');
    printDate(process.stderr);
    process.stderr.write(':');
    err.apply(this, arguments);
}

