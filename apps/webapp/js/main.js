var app = angular.module("PokemonApp", ['ngRoute']);

app.config(function($routeProvider) {
        $routeProvider
            .when('/', {
                templateUrl : 'home.html',
                controller  : 'MainCtrl'
            })
            .when('/detail/:id', {
                templateUrl : 'detail.html',
                controller  : 'DetailCtrl'
            })
    });

app.controller("MainCtrl", function($scope, $timeout, $http) {
    $scope.search = "";
    $scope.pkmn_list = [];
    var prev_timeout;
    $scope.$watch("search", function(after, before) {
      $timeout.cancel(prev_timeout);
      console.log("Send request");
      prev_timeout = $timeout(function() {
        var es_request= {
          "size": 100,
          "query": {
            "prefix": {"name": $scope.search}
          }
        }
        console.log(es_request);
        $http.post('http://localhost:9200/pokemon/_search', es_request).then(function successCallback(response) {
          console.log(response.data);
          $scope.pkmn_list = response.data.hits.hits.map(function (elem) {
            elem._source.picture = elem._source.picture.replace("http://pokeapi.co", "http://localhost:3000");
            return elem;
          });
        }, function errorCallback(response) {
          console.error(response);
        });
      }, 300);
    });
});

app.controller("DetailCtrl", function($scope, $routeParams, $http) {
    $http.get('http://localhost:3000/api/v2/pokemon/' + $routeParams.id + "/").then(
      function successCallback(response) {
      var r = response.data;
      r = JSON.stringify(r);
      r = r.replace(new RegExp("http://pokeapi.co", 'g'), "http://localhost:3000")
      r = JSON.parse(r);
      $scope.pkmn = r;
      console.log($scope.pkmn);
      twttr.widgets.createTimeline({
        sourceType: "url",
        url: "https://twitter.com/twitterdev/likes"
      },
      document.getElementById('timeline'));
      // twttr.widgets.createTimeline({
      //   sourceType: "url",
      //   url: "https://twitter.com/hashtag/" + $scope.pkmn.name
      // },
      // document.getElementById('timeline'));

    }, function errorCallback(response) {
      console.error(response);
    });
});
