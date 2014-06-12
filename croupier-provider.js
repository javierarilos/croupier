"use strict";
var dgram = require('dgram');
var debug = require('debug')('croupier-provider');

var topic = 'allocate-vm';

var requests = 0;

var host = null;
var port = null;

var croupierSenderSocket = dgram.createSocket('udp4');

function _croupierMulticast(msg){
  debug('croupierMulticast: ',
              msg, 0, msg.length, croupier.multi_port, croupier.multicast_group);
  croupierSenderSocket.send(new Buffer(msg), 0, msg.length, croupier.multi_port, croupier.multicast_group);
}

function _publishProducerStatus(topic){
  var statusTxt = JSON.stringify({topic: croupier.topic, 
                                  host: croupier.host, 
                                  port: croupier.port,
                                  requests: requests,
                                  type: 'producerStatus'});
  _croupierMulticast(statusTxt);
}

function _startProducer(topic, host, port){
  _publishProducerStatus(topic, host, port);
}

function _handledRequest(){
  ++requests;
}

function _closeCroupier(){
  croupierSenderSocket.close();
  clearInterval(croupier.publishStatusInterval);
}


var croupier = {multi_port: 3000,
                multicast_group: '224.0.0.14',
                startProducer: _startProducer,
                handledRequest: _handledRequest,
                close: _closeCroupier
                };

function startCroupier(topic, host, port){
  debug('startCroupier','Starting croupier topic: ', topic, ' host: ', host, ' port: ', port);
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