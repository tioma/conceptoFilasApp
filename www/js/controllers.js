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
            var miUUID = $cordovaDevice.getUUID();
            localStorage.set('enComercio', true);
            localStorage.set('server', servidor.url);
            localStorage.set('uuid', miUUID);
            var uuid = {
              uuid: miUUID
            };
            $http.post(servidor.url + '/handshake', uuid).then(function(data){
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

myApp.controller('inicioCtrl', ['$scope', 'localStorage', '$ionicPopup', 'socketFactory', '$ionicPlatform', function($scope, localStorage, $ionicPopup, socketFactory, $ionicPlatform) {

  $scope.initialRender = false;
  $scope.sistemaHabilitado = false;
  $scope.haciendoFila = false;
  var miUUID = localStorage.get('uuid');

  var myIoSocket = io.connect(localStorage.get('server'), { query: 'token=' + localStorage.get('token')});

  var mySocket = socketFactory({
    ioSocket: myIoSocket
  });

  function customBack(){
    $ionicPopup.confirm({
      title: 'Salir',
      content: '¿Desea salir de la aplicación?'
    }).then(function(confirm){
      if (confirm){
        ionic.Platform.exitApp();
      }
    })
  }

  $ionicPlatform.registerBackButtonAction(customBack, 501);

  mySocket.on('estadoSistema', function(data){
    if (data.cajas.length > 0){
      $scope.sistemaHabilitado = true;
      $scope.clientesEnCola = data.colaGeneral.length;
      $scope.cajasAtendiendo = data.cajas;
    } else {
      $scope.sistemaHabilitado = false;
    }
    $scope.initialRender = true;
  });

  mySocket.on('actualizarFila', function(data){
    console.log('llego el actualizar fila');
    //Determino mi posición en la fila
    var posicion = 0;
    data.forEach(function(cliente){
      posicion++;
      if (cliente.id == miUUID){
        $scope.posicion = posicion;
        if (posicion > 1){
          $scope.estadoFila = 'Tu posición en la fila es la número ' + posicion + '. Tenés una espera promedio de ... hasta ser llamado';
        } else {
          $scope.estadoFila = 'Sos el próximo en la fila, estate atento porque en poco tiempo vas a ser llamado.'
        }
        $scope.haciendoFila = true;
      }
    });
  });

  $scope.hacerFila = function(){
    mySocket.emit('hacerFila');
  };

  $scope.retrasarme = function(){

  };

  $scope.irme = function(){

  };
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
