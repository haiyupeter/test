var http = require('http');
console.log('init main2: pid = ' + process.pid);
require('./monitor.js');
http.createServer(function(req, res){
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.write('afdfadfdafdas');
    res.end('Hello World main 2\n');
}).listen('8937');
console.log('main2 server running at http://127.0.0.1:8937');