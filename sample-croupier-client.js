"use strict";
var http = require('http');

if(process.argv[2] === '-h'){
  console.log('Usage: node sample-croupier-client.js [host] [port]');
  console.log('host : Croupier host to use, localhost by default.');
  console.log('port : Port to use, 8000 by default.');
}
var host = process.argv[2] || 'localhost';
var port = process.argv[3] || '8000';

var basePath = '/hello/croupier/';

var options = {
host: host,
path: basePath,
port: port,
method: 'GET',
headers: {'croupier-topic': 'allocate-vm'}
};

var callback = function(response) {
  var str = ''
  response.on('data', function (chunk) {
    str += chunk;
  });

  response.on('end', function () {
    console.log(str);
  });
}

var i = 0;

setInterval(function(){
  options.path = basePath + i++;
  console.log(">> about to request : ", options)
  var req = http.request(options, callback);
  req.end();
}, 700);