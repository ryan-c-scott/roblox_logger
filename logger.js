"use strict";

process.title = 'royale-logger';

const Promise = require('bluebird');
const http = require('http');
const path = require('path');
const url = require('url');
const querystring = require('querystring');
const fs = Promise.promisifyAll(require('fs'));

var server = http.createServer(function(request, response) {
  var mapUrl = url.parse(request.url);
  var filename = path.normalize(mapUrl.pathname);
  var query = querystring.parse(mapUrl.query);
  var requestTime = new Date();

  var rawdata = '';
  
  request.on('data', chunk => {
    rawdata += chunk.toString();
  });

  request.on('end', () => {
    response.writeHead(200);
    response.end();

    var data = JSON.parse(rawdata);
    var messages = data.messages;

    for(var i = 0; i < messages.length; ++i) {
      var msg = messages[i];

      if(msg.player) {
        // Client
        var clientMessages = msg.messages;
        for(var j = 0; j < clientMessages.length; ++j) {
          var clientMsg = clientMessages[j];
          console.log("CLIENT: %s, %s, %s(%s) [%s].[%s] %s",
                      data.game, data.place, data.job, msg.player,
                      clientMsg[0], clientMsg[1], clientMsg[2]);
        }
      }
      else {
        // Server
        console.log("SERVER: %s, %s, %s, [%s].[%s] %s",
                    data.game, data.place, data.job,
                    msg[0], msg[1], msg[2]);
      }
    }
  });
  
}).listen(9900);
