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

myApp.controller('inicioCtrl', ['$scope', 'localStorage', '$ionicPopup', 'socketFactory', '$ionicPlatform', '$sce',
  function($scope, localStorage, $ionicPopup, socketFactory, $ionicPlatform, $sce) {

    //Flags de control
    $scope.initialRender = false;
    $scope.sistemaHabilitado = false;
    $scope.haciendoFila = false;
    $scope.enCaja = false;
    $scope.online = true;

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
          mySocket.emit('salirFila');
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
      //debería enviar la cola general y el tiempo promedio de atención por persona
      $scope.clientesEnCola = data.colaGeneral.length;
      //Determino mi posición en la fila
      var posicion = 0;
      data.colaGeneral.forEach(function(cliente){
        posicion++;
        if (cliente.id == miUUID){
          var retrasoPromedio = data.tiempoPromedioAtencion * (posicion - 1);
          $scope.posicion = posicion;
          if (posicion > 1){
            $scope.estadoFila = $sce.trustAsHtml('<i class="icon ion-android-person"></i> Perfecto, ya estás en la fila. Tu posición es la número <b>' + posicion + '</b>. Tenés una espera promedio de <b>' + retrasoPromedio + '</b> minutos hasta ser llamado');
          } else {
            $scope.estadoFila = $sce.trustAsHtml('<i class="icon ion-android-person"></i> Sos el próximo en la fila, estate atento porque en unos instantes vas a ser llamado.')
          }
        }
        $scope.haciendoFila = true;
      });
    });

    $scope.hacerFila = function(){
      mySocket.emit('hacerFila');
    };

    $scope.retrasarme = function(){

    };

    $scope.irme = function(){
      $ionicPopup.confirm({
        title: 'Abandonar fila',
        content: 'Vas a perder tu posición en la fila, ¿estás seguro?'
      }).then(function(confirm){
        if (confirm){
          mySocket.emit('salirFila');
          $scope.haciendoFila = false;
        }
      })
    };

    $scope.$on('offline', function(){
      console.log('nos desconectamos');
      $scope.online = false;
    });

    $scope.$on('online', function(){
      console.log('nos conectamos');
      $scope.online = true;
      if ($scope.haciendoFila) mySocket.emit('pedirActualizacion');
    });

    $scope.$on('$destroy', function(){
      console.log('CHAU CHAU CHAU CHAUUUUUUUU');
      mySocket.emit('salirFila');
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
