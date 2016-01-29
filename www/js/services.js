angular.module('app.services', [])

.factory('BlankFactory', [function(){

}])

.service('geolocationService', ['$cordovaGeolocation', '$http', function($cordovaGeolocation, $http){

  this.checkMyPosition = function(callback){

  }

}]);

