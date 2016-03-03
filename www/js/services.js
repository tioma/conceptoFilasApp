myApp.factory('comerciosFactory', ['$cordovaSQLite', 'positionService', function($cordovaSQLite, positionService){

  var db = null;
  var factory = {

    getComercioCliente: function(posicionCliente, callback){
      var comercio = {};
      var posicionComercio = {
        latitud: 0,
        longitud: 0
      };
      var query = "SELECT idComercio, nombre, latitud, longitud, serverUrl, direccion, observaciones FROM comercio";
      var comercio = null;
      var encontrado = false;

      db = $cordovaSQLite.openDB("filasServers.db");

      $cordovaSQLite.execute(db, query, []). then(function(res){
        for (var i = 0; i < res.rows.length; i++){
          posicionComercio.longitud = parseFloat(res.rows.item(i).longitud);
          posicionComercio.latitud = parseFloat(res.rows.item(i).latitud);
          var distancia = positionService.calcularDistancia(posicionCliente, posicionComercio);
          if (distancia < 200){
            comercio = {
              idComercio: res.rows.item(i).idComercio,
              nombre: res.rows.item(i).nombre,
              direccion: res.rows.item(i).direccion,
              observacion: res.rows.item(i).observaciones,
              latitud: res.rows.item(i).latitud,
              longitud: res.rows.item(i).longitud,
              serverUrl: res.rows.item(i).serverUrl
            };
            encontrado = true;
            //hardcode de direccion para prueba
            //comercio.serverUrl = 'http://192.168.0.103';
            callback(comercio, encontrado);
          }
        }
        callback(comercio, encontrado);
      }, function(err){
        callback(err, false);
      })
    },

    getComercios: function(callback){
      var comercios = [];
      var query = "SELECT idComercio, nombre, latitud, longitud, serverUrl, direccion, observaciones FROM comercio";

      db = $cordovaSQLite.openDB("filasServers.db");

      $cordovaSQLite.execute(db, query, []).then(function(res){
        for (var i = 0; i < res.rows.length; i++){
          var comercio = {
            idComercio: res.rows.item(i).idComercio,
            nombre: res.rows.item(i).nombre,
            direccion: res.rows.item(i).direccion,
            observacion: res.rows.item(i).observaciones,
            latitud: res.rows.item(i).latitud,
            longitud: res.rows.item(i).longitud,
            serverUrl: res.rows.item(i).serverUrl
          };
          comercios.push(comercio);
        }
        callback(comercios, true);
      }, function(err){
        callback(err, false)
      })
    }

  };

  return factory;

}]);

myApp.factory('GeolocationMonitor', ['$rootScope', '$cordovaGeolocation', '$timeout', function($rootScope, $cordovaGeolocation, $timeout){

  //Implementado con timeouts para no gastar mucha batería
  function errGeolocation(err){
    console.log('error de gps: ' + err);
    console.log(JSON.stringify(err));
    //localStorage.set('enComercio', false);
    $rootScope.$broadcast('errorGPS');
    $timeout(factory.startWatching, 30*1000);  //Ejecuta cada 30 segundos
  }

  function successGeolocation(position){
    console.log('nueva posicion');
    var miPosicion = {
      latitud: position.coords.latitude,
      longitud: position.coords.longitude
    };
    $rootScope.$broadcast('nuevaPosicion', miPosicion);
    $timeout(factory.startWatching, 30*60*1000); //Ejecuta cada 30 minutos
  }

  var posOptions = {
    maximumAge: 30 * 1000,
    timeout: 10 * 1000,
    enableHighAccuracy: true
  };

  var factory = {
    getCurrentLocation: function(callback){

      $cordovaGeolocation
        .getCurrentPosition(posOptions)
        .then(function(position){
          var miPosicion = {
            latitud: position.coords.latitude,
            longitud: position.coords.longitude
          };
          callback(miPosicion, true);
        }, function(err){
          callback(err, false);
        });
    },

    startWatching: function () {

      $cordovaGeolocation
        .getCurrentPosition(posOptions)
        .then(successGeolocation, errGeolocation);

    }
  };

  return factory;

}]);

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

myApp.factory('Cliente', [function(){

  function Cliente (id, enComercio, sistema){
    this.id = id;
    this.enComercio = enComercio;
    this.sistema = sistema;
    this.notifCaja = true;
  }

  Cliente.prototype = {
    getId: function(){
      return this.id;
    },
    getNotifCaja: function(){
      return this.notifCaja;
    },
    setNotifCaja: function(onOff){
      this.notifCaja = onOff;
    },
    estaEnComercio: function(){
      return this.enComercio;
    },
    setEnComercio: function(estado){
      this.enComercio = estado;
    },
    getPosicion: function(){
      return this.posicion;
    },
    getCaja: function(){
      return this.miCaja;
    },
    estaEnFilaGeneral: function(){
      var posicion = 0;
      var estoy = false;
      var that = this;
      this.sistema.colaGeneral.forEach(function(unCliente){
        posicion++;
        if (unCliente.id == that.id){
          estoy = true;
          that.posicion = posicion;
        }
      });
      return estoy;
    },
    estaEnCaja: function(){
      var estoy = false;
      var that = this;
      this.sistema.cajas.forEach(function(unaCaja){
        unaCaja.cola.forEach(function(unCliente){
          if (unCliente.id == that.id){
            estoy = true;
            that.miCaja = unaCaja.numero;
          }
        })
      });
      return estoy;
    },
    getEsperaPromedio: function(){
      return (this.posicion - 1) * this.sistema.retrasoPromedio;
    }
  };

  return (Cliente);

}]);

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

  this.calcularDistancia = function(desde, hasta){

    var latitudDesdeRad = deGradosARadianes(desde.latitud);
    var longitudDesdeRad = deGradosARadianes(desde.longitud);

    var latitudHastaRad = deGradosARadianes(hasta.latitud);
    var longitudHastaRad = deGradosARadianes(hasta.longitud);

    //Devuelve la distancia en metros
    //Formula simplificada
    return Math.acos(Math.sin(latitudDesdeRad)*Math.sin(latitudHastaRad) +
        Math.cos(latitudDesdeRad)*Math.cos(latitudHastaRad) *
        Math.cos(longitudHastaRad - longitudDesdeRad)) * 6371000;
  };

}]);

