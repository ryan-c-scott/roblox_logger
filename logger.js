"use strict";

process.title = 'royale-logger';

const Promise = require('bluebird');
const http = require('http');
const path = require('path');
const url = require('url');
const querystring = require('querystring');
const fs = Promise.promisifyAll(require('fs'));
const MongoClient = require('mongodb').MongoClient;

function logToConsole(msg) {
  console.log("%s %s, %s, %s, %s, %s, %s, %s",
              msg.time, msg.game, msg.place, msg.job, msg.user,
              msg.level, msg.channel, msg.message);
}

function logToDB(data, doConsole) {
  var mongo = MongoClient.connect('mongodb://localhost:27017', (err, client) => {
    const db = client.db('roblox');

    var messages = data.messages;
    var logMessages = [];

    for(var i = 0; i < messages.length; ++i) {
      var msg = messages[i];

      if(msg.player) {
        // Client
        var clientMessages = msg.messages;
        for(var j = 0; j < clientMessages.length; ++j) {
          var clientMsg = clientMessages[j];

          var out = {time: clientMsg[0],
                     game: data.game,
                     place: data.place,
                     job: data.job,
                     user: msg.player,
                     level: clientMsg[1],
                     channel: clientMsg[2],
                     message: clientMsg[3]}

          //
          logMessages.push(out);
          
          if(doConsole) {
            logToConsole(out);
          }
        }
      }
      else {
        // Server
        var out = {time: msg[0],
                   game: data.game,
                   place: data.place,
                   job: data.job,
                   level: msg[1],
                   channel: msg[2],
                   message: msg[3]}

        logMessages.push(out);
        
        if(doConsole) {
          logToConsole(out)
        }
      }
    }

    // TODO: Promisify and async
    const collection = db.collection('logging');
    collection.insertMany(logMessages);
    
    client.close();
  });
}

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
    logToDB(data, true);
  });
  
}).listen(9900);

console.log("Listing on port 9900");
