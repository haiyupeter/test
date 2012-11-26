console.log('init main1: pid = ' + process.pid);
process.on('message', function(data){
	console.log('main1 recieve data: ' + data.txt);
});
process.send({txt: "test"});
