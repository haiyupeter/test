var cp = require('child_process');
console.log('init monitor');


if (process.argv && process.argv.length > 0) {
	for (var i = 0; i < process.argv.length; i++) {
		console.log(process.argv[i]);
		if (i >= 2) {
			var cp_n = cp.fork(process.argv[i]);
			cp_n.on('message', function(data){
				console.log("monitor receive: " + data.txt);
			});
			cp_n.send({txt: 'hello'});
		}
	}
}

process.on('exit', function(){
	console.log('main process exit');
});
