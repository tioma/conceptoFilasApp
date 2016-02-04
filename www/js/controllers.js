angular.module('app.controllers', [])

  .controller('loadingCtrl', ['$scope', '$ionicLoading', '$http', '$cordovaDevice', '$cordovaGeolocation', '$ionicPopup', 'positionService', 'localStorage', '$state',
    function($scope, $ionicLoading, $http, $cordovaDevice, $cordovaGeolocation, $ionicPopup, positionService, localStorage, $state){

      $ionicLoading.show({
        content: 'Cargando',
        animation: 'fade-in',
        showBackdrop: false,
        hideOnStateChange: true,
        showDelay: 0
      });

      document.addEventListener("deviceready", function () {
        var posOptions = {
          timeout: 10000,
          enableHighAccuracy: true
        };

        $cordovaGeolocation
          .getCurrentPosition(posOptions)
          .then(function (position) {
            var miPosicion = {
              latitud: position.coords.latitude,
              longitud: position.coords.longitude
            };
            localStorage.setObject('posicion', miPosicion);
            var servidor = positionService.getServer(miPosicion);
            if (servidor.success){
              localStorage.set('enComercio', true);
              localStorage.set('server', servidor.url);
              var uuid = {
                uuid: $cordovaDevice.getUUID()
              };
              $http.post(servidor.url + '/handshake', uuid).then(function(data){
                localStorage.set('token', data.token);
                $state.go('inicio');
              }, function(err){
                $ionicLoading.hide();
                $ionicPopup.alert({
                  title: 'Error',
                  content: 'Se produjo un error al intentar conectar con el servidor ' + servidor.url + ' mensaje: ' + err.message
                }).then(function(result){
                  ionic.Platform.exitApp();
                })
              })
            } else {
              localStorage.set('enComercio', false);
            }
          }, function(err){
            $ionicLoading.hide();
            $ionicPopup.alert({
              title: 'Error',
              content: 'No se ha podido determinar su posición actual, por favor active su GPS'
            }).then(function(result){
              ionic.Platform.exitApp();
            })
          });
      }, false);

    }])

  .controller('inicioCtrl', ['$scope', 'localStorage', '$ionicPopup', function($scope, localStorage, $ionicPopup) {

    $scope.miPosicion = localStorage.getObject('posicion');

    $scope.mensaje = 'todo bien';

    /*var watchOptions = {
     timeout : 3000,
     enableHighAccuracy: false // may cause errors if true
     };

     var watch = $cordovaGeolocation.watchPosition(watchOptions);
     watch.then(
     null,
     function(err) {
     // error
     },
     function(position) {
     //console.log(position);

     });*/


    /*watch.clearWatch();
     // OR
     $cordovaGeolocation.clearWatch(watch)
     .then(function(result) {
     // success
     }, function (error) {
     // error
     });*/
  }])

  .controller('principalCtrl', function($scope) {

  });
