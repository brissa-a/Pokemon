let express = require('express');
let app = express();
let redis = require("redis");
let client = redis.createClient(6379, '127.0.0.1', {'return_buffers': true});
let http = require("http");

client.on("error", function (err) {
    console.log("Error " + err);
});

//client.set("name", "Alexis", redis.print);
const redisKeyPrefix = "pkmn:";
const urlToRedisKey = url => redisKeyPrefix + url + ":body";
const urlToRedisKeyContentType = url => redisKeyPrefix + url + ":contenttype";

app.get('*', function (req, res) {
  console.log("receive: " + req.originalUrl);
  client.get(urlToRedisKey(req.originalUrl), function(err, cached_response) {
    client.get(urlToRedisKeyContentType(req.originalUrl), function(err, cached_contentType) {
      if (!cached_response || !cached_contentType) {
          var options = {
            host: 'pokeapi.co',
            path: req.originalUrl
          };
          let callback = function(response) {
            let body_chunk = [];
            let contentType = response.headers['content-type'];
            response.on('data', function (chunk) {
              body_chunk.push(chunk);
            });
            response.on('end', function () {
              var body = Buffer.concat(body_chunk);
              client.set(urlToRedisKey(req.originalUrl), body, redis.print);
              client.set(urlToRedisKeyContentType(req.originalUrl), contentType, redis.print);
              res.setHeader('content-type', contentType);
              res.send(body);
            });
          }
          http.request(options, callback).end();
      } else {
        console.log("Found in redis");
        res.setHeader('content-type', cached_contentType);
        res.send(cached_response);
      }
    });
  });
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});
