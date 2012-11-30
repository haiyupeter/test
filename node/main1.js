var http = require('http');
console.log('init main1: pid = ' + process.pid);
require('./monitor.js');
http.createServer(function(req, res){
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('Hello World, main1 \n');
}).listen('8938');
console.log('main1 server running at http://127.0.0.1:8938');