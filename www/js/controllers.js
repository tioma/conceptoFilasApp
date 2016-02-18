myApp.controller('loadingCtrl', ['$scope', '$ionicLoading', '$http', '$cordovaDevice', 'GeolocationMonitor', '$ionicPopup', 'comerciosFactory', 'localStorage', '$state',
  function($scope, $ionicLoading, $http, $cordovaDevice, GeolocationMonitor, $ionicPopup, comerciosFactory, localStorage, $state){

    $ionicLoading.show({
      content: 'Cargando',
      animation: 'fade-in',
      showBackdrop: false,
      hideOnStateChange: true,
      showDelay: 0
    });

    document.addEventListener("deviceready", function () {

      window.plugins.sqlDB.copy("filasServers.db", 0, function(){
        console.log('base de datos copiada');
        cargaInicial();
      }, function(error){
        if (error.code == 516){
          console.log('la base ya estaba copiada');
          cargaInicial();
        } else {
          console.log(JSON.stringify(error));
          $ionicLoading.hide();
          $ionicPopup.alert({
            title: 'Error',
            content: 'Se produjo un error al copiar la base de datos.'
          }).then(function(result){
            ionic.Platform.exitApp();
          })
        }
      });
    }, false);

    function cargaInicial(){
      var miUUID = $cordovaDevice.getUUID();
      localStorage.set('uuid', miUUID);

      GeolocationMonitor.getCurrentLocation(function(miPosicion, ok){
        if (ok){
          localStorage.set('errorGPS', false);
          localStorage.setObject('posicion', miPosicion);
          comerciosFactory.getComercioCliente(miPosicion, function(comercio, ok){
            if (ok){
              localStorage.set('enComercio', true);
              localStorage.setObject('comercio', comercio);
              var uuid = {
                uuid: miUUID
              };
              $http.post(comercio.serverUrl + '/handshake', uuid).then(function(data){
                localStorage.set('token', data.data.token);
                localStorage.set('isOnline', true);
                $state.go('inicio');
              }, function(err){
                $ionicLoading.hide();
                $ionicPopup.alert({
                  title: 'Error',
                  content: 'Se produjo un error al intentar conectar con el servidor ' + servidor.url + ' mensaje: ' + err.message
                }).then(function(result){
                  localStorage.set('isOnline', false);
                  $state.go('inicio');
                })
              })
            } else {
              $ionicLoading.hide();
              $ionicPopup.alert({
                title: 'Sin sistema',
                content: 'Acercate hasta un comercio con el sistema habilitado'
              }).then(function(result){
                localStorage.set('enComercio', false);
                $state.go('inicio');
              })
            }
          });
        } else {
          console.log(JSON.stringify(miPosicion));
          $ionicLoading.hide();
          $ionicPopup.alert({
            title: 'Error',
            content: 'No se ha podido determinar su posición actual, por favor active su GPS'
          }).then(function(result){
            localStorage.set('enComercio', false);
            localStorage.set('errorGPS', true);
            $state.go('inicio');
          })
        }
      });
    }

  }]);

myApp.controller('inicioCtrl', ['$scope', 'localStorage', '$ionicPopup', 'socketFactory', '$ionicPlatform', '$sce', 'comerciosFactory', '$http',
  function($scope, localStorage, $ionicPopup, socketFactory, $ionicPlatform, $sce, comerciosFactory, $http) {

    //Flags de control
    $scope.initialRender = false;
    $scope.sistemaHabilitado = false;
    $scope.haciendoFila = false;
    $scope.enCaja = false;
    $scope.online = (localStorage.get('isOnline') === 'true');
    $scope.enComercio = (localStorage.get('enComercio') === 'true');
    $scope.errorGPS = (localStorage.get('errorGPS') === 'true');
    console.log('error de GPS:' + $scope.errorGPS);
    console.log('enComercio esta: ' + $scope.enComercio);
    console.log(typeof $scope.enComercio);
    console.log(typeof $scope.online);

    var mySocket = null;
    var miUUID = localStorage.get('uuid');

    function conectarSocket(){
      var myIoSocket = io.connect(localStorage.getObject('comercio').serverUrl, { query: 'token=' + localStorage.get('token')});

      mySocket = socketFactory({
        ioSocket: myIoSocket
      });

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
    }

    if ($scope.online && $scope.enComercio){
      console.log('qué esta pasando aca?');
      conectarSocket();

    } else {
      console.log('hola');
      $scope.initialRender = true;
    }

    function customBack(){
      $ionicPopup.confirm({
        title: 'Salir',
        content: '¿Desea salir de la aplicación?'
      }).then(function(confirm){
        if (confirm){
          if ($scope.haciendoFila) mySocket.emit('salirFila');
          ionic.Platform.exitApp();
        }
      })
    }

    $ionicPlatform.registerBackButtonAction(customBack, 501);

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

    $scope.$on('nuevaPosicion', function(ev, miPosicion){
      console.log('llego nueva posicion: ' + JSON.stringify(miPosicion));
      localStorage.set('errorGPS', false);
      $scope.errorGPS = false;
      if (!$scope.enComercio){
        //Determinar si se encuentra en un comercio y conectar
        comerciosFactory.getComercioCliente(miPosicion, function(comercio, ok){
          if (ok){
            console.log('si estaba en un comercio');
            $scope.enComercio = true;
            localStorage.set('enComercio', true);
            localStorage.setObject('comercio', comercio);
            var uuid = {
              uuid: miUUID
            };
            $http.post(comercio.serverUrl + '/handshake', uuid).then(function(data){
              console.log('hizo el handshake ok');
              localStorage.set('token', data.data.token);
              localStorage.set('isOnline', true);
              $scope.online = true;
              conectarSocket();
            }, function(err){
              console.log('no hizo el handshake');
              localStorage.set('isOnline', false);
              $scope.online = false;
            })
          } else {
            console.log('no se encontro un comercio');
            localStorage.set('enComercio', false);
            $scope.enComercio = false;
          }
        });
      }
    });

    $scope.$on('errorGPS', function(){
      console.log('llego error de gps');
      console.log('el initialRender esta: ' + $scope.initialRender);
      localStorage.set('errorGPS', true);
      $scope.errorGPS = true;
    });

    $scope.$on('$destroy', function(){
      console.log('CHAU CHAU CHAU CHAUUUUUUUU');
      mySocket.emit('salirFila');
    });

  }]);

myApp.controller('comerciosCtrl', ['$scope', 'comerciosFactory', function($scope, comerciosFactory){

  $scope.comercios = [];

  comerciosFactory.getComercios(function(data, ok){
    if (ok){
      $scope.comercios = data;
      $scope.comercios.forEach(function(comercio){
        comercio.image = "./img/comercio" + comercio.idComercio + ".jpg";
        console.log(comercio.image);
      })
    }
  });

  $scope.openMap = function(latitud, longitud){
    console.log('intento abrir mapa en latitud ' + latitud + ' y longitud ' + longitud);
    //window.open('geo:' + latitud + ',' + longitud, '_system');
    window.open('http://maps.google.com/maps?daddr=' + latitud + ',' + longitud);
  }

}]);
