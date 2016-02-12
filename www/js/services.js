myApp.factory('ConnectivityMonitor', ['$rootScope', '$cordovaNetwork', '$ionicPopup', function($rootScope, $cordovaNetwork, $ionicPopup){

  return {
    isOnline: function(){
      return $cordovaNetwork.isOnline()
    },
    startWatching: function(){

      $rootScope.$on('$cordovaNetwork:online', function(event, networkState){
        $rootScope.$broadcast('online');
      });

      $rootScope.$on('$cordovaNetwork:offline', function(event, networkState){
        $rootScope.$broadcast('offline');
      });

    }
  }

}]);

myApp.factory('localStorage', ['$window', function($window){
  return {
    set: function(key, value){
      $window.localStorage[key] = value;
    },
    get: function(key, defaultValue){
      return $window.localStorage[key] || defaultValue;
    },
    setObject: function(key, value){
      $window.localStorage[key] = JSON.stringify(value);
    },
    getObject: function(key){
      return JSON.parse($window.localStorage[key] || '{}');
    }
  }
}]);

/*myApp.factory('socket', ['socketFactory', 'localStorage', function(socketFactory, localStorage){
  var myIoSocket = io.connect(localStorage.get('server'), { query: 'token=' + localStorage.get('token')});

  var mySocket = socketFactory({
    ioSocket: myIoSocket
  });

  return mySocket;
}]);*/

myApp.service('positionService', [function(){

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

  this.getServer = function(miPosicion){
    //Acá comparo mi posicion con las que están en la base de datos para determinar si me encuentro en algún comercio
    //Hardcodeo servidor para prototipo
    return {
      success: true,
      url: 'http://10.0.3.2:3001'
    };
  }

}]);

