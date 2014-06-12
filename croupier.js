// Croupier.JS: an HTTP Brokerless Bus
// Croupier is a small daemon (or client library, TBD) that easily adds fault-tolerance, horizontal scalability to your current HTTP backend-to-backend interactions.
//
// How croupier works
// ------------------
// Croupier works with topics. A topic for croupier is just a tag that names the service or type of servers, for example: client-api, logging, ...
// When a server starts, it uses croupier-provider module to register itself as a provider of a topic on a host and a port.
// Croupier receives the notification of the provider and keeps a registry of servers per topic.
// A client wants to send an HTTP request to one of the servers; it sends the request to croupier and adds an HTTP-header with the topic: "croupier-topic": "client-api"
// Croupier delivers the request to one of the servers providing that topic.
// 

var http = require('http'),
    httpProxy = require('http-proxy'),
    dgram = require('dgram');

// Croupier Usage
// --------------
// __node croupier.js [host] [port]__  
// __host__ : Server to use, 0.0.0.0 by default.  
// __port__ : Port to use for HTTP requests, 8000 by default.  
// 
if(process.argv[2] === '-h'){
  console.log('Usage: node croupier.js [host] [port]');
  console.log('host : Server to use, 0.0.0.0 by default.');
  console.log('port : Port to use for HTTP requests, 8000 by default.');
}
var host = process.argv[2] || '0.0.0.0';
var port = process.argv[3] || '8000';

// Discovery
// ---------
// Croupier enabled HTTP servers send status updates so that croupier can register them.
// Status updates are received via UDP-multicast: port 3000 multicast address: 224.0.0.14. This allows very little network overhead and easy discovery.
// Since croupier is meant to backend-to-backend escenarios there should not be problems on communications infrastructure due to using UDP.
// Producer status updates include the topic, host, port and the number of requests served.
// * on start: producer publishes what topics it is serving: topic, host and port
// * periodically: producer publishes its status for auto-discovery and accounting.
var croupierSocket = dgram.createSocket("udp4");

function _croupierOnMessage(msg, rinfo) {
  console.log("croupierSocket got: " + msg + " from " + rinfo.address + ":" + rinfo.port);
  msg = JSON.parse(msg);
  if('producerStatus' === msg.type){
    if(servers[msg.topic] === undefined){
      servers[msg.topic] = {};
    }
    servers[msg.topic][msg.host+':'+msg.port] = msg;
    console.log('Received new servers update : ', msg);
  }
}

function _croupierOnListening () {
 var address = croupierSocket.address();
 console.log("croupierSocket listening " + address.address + ":" + address.port);
}

croupierSocket.on("message", _croupierOnMessage)
              .on("listening", _croupierOnListening);

croupierSocket.bind(3000, function() {
  croupierSocket.addMembership('224.0.0.14');
});

// _getAddress(topic) function
// ---------------------------
// Pick a random server for the topic and returns an address object:
//     {host: host, port: port}
function _getAddress(topic){
  
  var res;
  var address = null;
  var count = 0;
  if(servers[topic]){
    for (var server_info in servers[topic])
        if (Math.random() < 1/++count){
           res = servers[topic][server_info];
       }
    if(res && res.host && res.port){
      address = {host: res.host, port: res.port};
    } else {
      console.log("}} res: ", res);
      console.log('}} WARN bad server... returning default', address)
    }
  } else {
    console.warn("Not found servers for topic: ", topic);
  }
  return address;
}

// Servers
// -------
// servers object stores the servers addresses and status by topic:
// ```javascript
//    {
//      topic1: {
//          host_a:port1: {topic: topic1, host: host_a, port: port1, requests: number_requests},
//          host_b:port2: {topic: topic1, host: host_b, port: port2, requests: number_requests},
//          (...)},
//      topic2: {
//          (...)}
//    }```
var servers = {};
var index = 0;

var proxy = httpProxy.createProxyServer({});

function _returnHTTPError(res, code, reason){
  res.writeHead(503, reason, {'Content-Type': 'application/json'});
  res.end('{"result": "error", "status": '+code+', "reason": "'+reason+'"}');
}

function _processHTTPRequest(req, res) {
  topic = req.headers['croupier-topic'];
  if(topic){
    address = _getAddress(topic);
    if(address !== null){
      console.log("* received req with topic: ", topic, "==>>", address);
      
      proxy.web(req, res, { target: address},
        function onProxyError(e, req, res){
          servicePort = address.host+":"+address.port;
          delete servers[topic][servicePort];
          console.log("### error", e, " targeting: ", address, " deleted servicePort: ", servicePort, "for topic '", topic, "'from servers.");
          _processHTTPRequest(req, res);
        });
    } else{//No server available for the topic
      _returnHTTPError(res, 503, 'croupier-topic: "'+ topic +'" has no servers available.');
    }
  } else {
    _returnHTTPError(res, 400, 'croupier-topic header is not present.');
  }
}

var httpServer = require('http').createServer(_processHTTPRequest);
httpServer.listen(8000);
console.log("listening on port 8000");