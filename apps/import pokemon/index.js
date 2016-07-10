const es = new require('elasticsearch').Client({
  host: 'localhost:9200',
  log: 'trace'
});
const http = require('http');
const argv = require('optimist')
  .default('offset', 1)
  .default('limit', 150)
  .argv;
const redis = require("redis").createClient(6379, '127.0.0.1', {'return_buffers': true});
const reval = require("redis-eval");
const script  = __dirname + '/compute_avg.lua';

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

Array.prototype.flatMap = function(lambda) {
    return Array.prototype.concat.apply([], this.map(lambda));
};

function getJson(options, sub_callback) {
  let callback = function(response) {
    let body_chunk = [];
    let contentType = response.headers['content-type'];
    response.on('data', function (chunk) {
      body_chunk.push(chunk);
    });
    response.on('end', function () {
      try {
        var json_body = JSON.parse(Buffer.concat(body_chunk).toString());
        sub_callback(response, json_body);
      } catch (err) {
        console.error(err);
      }
    });
  }
  http.request(options, callback).end();
}

function getPokemonList(offset, limit, callback) {
  const options = {
    host: 'localhost',
    port: 3000,
    path: '/api/v2/pokemon/?limit='+ limit +'&offset='+ offset
  };
  getJson(options, callback);
}

function getPokemon(id, callback) {
  const options = {
    host: 'localhost',
    port: 3000,
    path: '/api/v2/pokemon/'+ id + '/'
  };
  getJson(options, callback);
}


for (let id = argv.offset; id < argv.offset+argv.limit; id++) {
  getPokemon(id, (response, pkmn) => {
    console.log("Processing pokemon id:", pkmn.id, id)
    const es_document = {
      name: pkmn.name,
      picture: pkmn.sprites.front_default,
      detail_url: 'http://localhost:3000/api/v2/pokemon/'+pkmn.id+'/'
    }
    //Calculate average
    pkmn.types.forEach(function (type) {
      pkmn.stats.forEach(function (stat) {
        console.log("Compute average for: " + type.type.name + "-" + stat.stat.name)
        reval(redis, script, [], [stat.base_stat, type.type.name, stat.stat.name], function (ret) {
          console.log("Compute average for: " + type.type.name + "-" + stat.stat.name + " => Call succeed");
        });
      });
    })
    //Index for search
    es.index({
      index: 'pokemon',
      type: 'pokemon',
      id: pkmn.id,
      body: es_document
    }, function (error, response) {
      if (error) console.log(error);
    });
  });
}

//get("url").map(getresult).map(buildesdocument).accumulate(100ms).do(request);

// getPokemonList(argv.offset, argv.limit, function (response, body) {
//   const bulk_request = body.results.flatMap(pkmn => {
//     return [es_request, pkmn]
//   });
//   es.bulk(bulk_request);
// });

//get pokemon from toto to tata
//Si pokemon pas déja importé
