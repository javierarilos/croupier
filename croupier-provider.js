var dgram = require('dgram');

var topic = 'allocate-vm';

var requests = 0;

var host = null;
var port = null;

function processedRequest(){
  requests++;
}


var croupier = {multi_port: 3000,
                multicast_group: '224.0.0.14',
                startProducer: _startProducer,
                handledRequest: _handledRequest,
                close: _closeCroupier
                };

//TODO: move to private scope
var croupierSenderSocket = dgram.createSocket('udp4');

function _croupierMulticast(msg){
  console.log('--> croupierSenderSocket.send(new Buffer(msg), 0, msg.length, croupier.port, croupier.multicast_group)',
              msg, 0, msg.length, croupier.multi_port, croupier.multicast_group);
  croupierSenderSocket.send(new Buffer(msg), 0, msg.length, croupier.multi_port, croupier.multicast_group);
}

function _publishProducerStatus(topic){
  statusTxt = JSON.stringify({topic: croupier.topic, 
                              host: croupier.host, 
                              port: croupier.port,
                              requests: requests,
                              type: 'producerStatus'});
  console.log('--> publishing status', statusTxt);
  _croupierMulticast(statusTxt);
}

function _startProducer(topic, host, port){
  console.log(">> _startProducer.")
  _publishProducerStatus(topic, host, port);
}

function _handledRequest(){
  ++requests;
}

function _closeCroupier(){
  croupierSenderSocket.close();
  clearInterval(croupier.publishStatusInterval);
}

function startCroupier(topic, host, port){
  console.log('Starting croupier topic: ', topic, ' host: ', host, ' port: ', port);
  croupier.topic = topic;
  croupier.host = host;
  croupier.port = port;
  croupier.startProducer(topic);
  croupier.requests = 0;
  croupier.finishedRequest = _handledRequest;
  croupier.publishStatusInterval = setInterval(_publishProducerStatus, 3000);
  return croupier;
}

module.exports.startCroupier = startCroupier;