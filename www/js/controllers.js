myApp.controller('loadingCtrl', ['$scope', '$ionicLoading', '$http', '$cordovaDevice', '$cordovaGeolocation', '$ionicPopup', 'positionService', 'localStorage', '$state',
  function($scope, $ionicLoading, $http, $cordovaDevice, $cordovaGeolocation, $ionicPopup, positionService, localStorage, $state){

    console.log('hola a todo el mundo!');
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
              console.log(JSON.stringify(data));
              console.log('el token es: ' + data.data.token);
              localStorage.set('token', data.data.token);
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

  }]);

myApp.controller('inicioCtrl', ['$scope', 'localStorage', '$ionicPopup', 'socketFactory', function($scope, localStorage, $ionicPopup, socketFactory) {

  console.log('acá estamos en el inicio');
  console.log('el server es: ' + localStorage.get('server'));
  console.log('el token es: ' + localStorage.get('token'));
  var myIoSocket = io.connect(localStorage.get('server'), { query: 'token=' + localStorage.get('token')});

  var mySocket = socketFactory({
    ioSocket: myIoSocket
  });

  $scope.miPosicion = localStorage.getObject('posicion');

  $scope.mensaje = 'todo bien';

  mySocket.on('connect', function(data){
    console.log('hola que tal');
    $ionicPopup.alert({
      title: 'se conecto',
      content: 'se conecto'
    })
  });

  /*mySocket.on('authenticated', function(data){
    console.log('hola que tal');
    $ionicPopup.alert({
      title: 'se conecto',
      content: 'se conecto'
    })
  });*/

  mySocket.on('tomaID', function(data){
    console.log('hola que tal');
    $ionicPopup.alert({
      title: 'vino data',
      content: 'id: ' + data
    })
  });

  /*socket.on('tomaID', function(data) {
   $scope.socketID = data;
   });*/
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
}]);

myApp.controller('principalCtrl', function($scope) {

});
