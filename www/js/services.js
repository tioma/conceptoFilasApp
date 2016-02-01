angular.module('app.services', [])

.factory('ConnectivityMonitor', ['$rootScope', '$cordovaNetwork', '$ionicPopup', function($rootScope, $cordovaNetwork, $ionicPopup){

  return {
    isOnline: function(){
      return $cordovaNetwork.isOnline()
    },
    startWatching: function(){

      $rootScope.$on('$cordovaNetwork:online', function(event, networkState){
        console.log("went online");
      });

      $rootScope.$on('$cordovaNetwork:offline', function(event, networkState){
        console.log("went offline");
        $ionicPopup.alert({
            title: "Sin conexión",
            content: "Se perdió la conexión de Internet."
          })
          .then(function(result) {
            ionic.Platform.exitApp();
          });
      });

    }
  }

}])

.service('handshakeService', ['$cordovaDevice', '$cordovaGeolocation', '$http', function($cordovaDevice, $cordovaGeolocation, $http){

  this.handshake = function(callback){
    var posOptions = {
      timeout: 10000,
      enableHighAccuracy: true
    };

    $cordovaGeolocation
      .getCurrentPosition(posOptions)
      .then(function (position) {
        var miPosicion = {
          uuid: $cordovaDevice.getUUID(),
          latitud: position.coords.latitude,
          longitud: position.coords.longitude
        };

        var inserturl = serverUrl + '/handshake';

        $http.post(inserturl, miPosicion)
          .success(function(data){
            callback(data);
          }).error(function(error){
            callback(error);
        })

      }, function(err) {
        // error
        console.log(err);
        callback(err);
      });
  };

}]);

