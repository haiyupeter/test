console.log('init main1: pid = ' + process.pid);
require('./monitor.js');
/*
process.on('message', function(data){
	console.log('main1 recieve data: ' + data.txt);
});
process.send({txt: "test"});
*/
//process.exit();
