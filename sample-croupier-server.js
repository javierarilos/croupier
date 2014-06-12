"use strict";
var http = require('http');
var croupierProvider = require('./croupier-provider');

var topic = 'allocate-vm';

if(process.argv[2] === '-h'){
  console.log('Usage: node client.js [host] [port]');
  console.log('host : Server to use, mandatory.');
  console.log('port : Port to use, mandatory.');
  process.exit(0);
}

var host = process.argv[2];
var port = process.argv[3];

if(! host || ! port){
  console.error("host and port are mandatory.");
  process.exit(0);
}

var croupier = croupierProvider.startCroupier(topic, host, port);

var server = http.createServer(function(req, res){
    console.log('Received ', req.method,' request on url: ', req.url);
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('Hello croupier from :' + host + ':' + port);
    croupier.finishedRequest();
});

function close(){
  server.close();
  croupier.close();
}

server.listen(port, host);
setTimeout(close, 150000);
