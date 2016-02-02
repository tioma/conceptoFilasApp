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

  function deGradosARadianes(grados){
    return (grados * Math.PI)/180;
  }

  function calcularDistanciaCompleja(desde, hasta){
    var radioTierra = 6371000;
    var difLatitud = deGradosARadianes(hasta.latitud - desde.latitud);
    var difLongitud = deGradosARadianes(hasta.longitud - desde.longitud);

    var a = Math.sin(difLatitud/2) * Math.sin(difLatitud/2) +
            Math.cos(deGradosARadianes(desde.latitud)) * Math.cos(deGradosARadianes(hasta.latitud)) *
              Math.sin(difLongitud/2) * Math.sin(difLongitud/2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return radioTierra * c;
  }

  function calcularDistancia(desde, hasta){
    var latitudDesdeRad = deGradosARadianes(desde.latitud);
    var longitudDesdeRad = deGradosARadianes(desde.longitud);

    var latitudHastaRad = deGradosARadianes(hasta.latitud);
    var longitudHastaRad = deGradosARadianes(hasta.longitud);

    //Devuelve la distancia en metros
    //Formula simplificada
    return Math.acos(Math.sin(latitudDesdeRad)*Math.sin(latitudHastaRad) +
                      Math.cos(latitudDesdeRad)*Math.cos(latitudHastaRad) *
                      Math.cos(longitudHastaRad - longitudDesdeRad)) * 6371000;
  }

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

