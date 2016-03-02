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
            content: 'Se produjo un error al copiar la base de datos.',
            cssClass: "danger-popup"
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
                  content: 'Se produjo un error al intentar conectar con el servidor ' + comercio.serverUrl + ' mensaje: ' + err.message,
                  cssClass: 'alert-popup'
                }).then(function(result){
                  localStorage.set('isOnline', false);
                  $state.go('inicio');
                })
              })
            } else {
              $ionicLoading.hide();
              $ionicPopup.alert({
                title: 'Sin sistema',
                content: 'Acercate hasta un comercio con el sistema habilitado',
                cssClass: "alert-popup"
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
            content: 'No se ha podido determinar su posición actual, por favor active su GPS',
            cssClass: "alert-popup"
          }).then(function(result){
            localStorage.set('enComercio', false);
            localStorage.set('errorGPS', true);
            $state.go('inicio');
          })
        }
      });
    }

  }]);

myApp.controller('inicioCtrl', ['$scope', 'localStorage', '$ionicPopup', 'socketFactory', '$ionicPlatform', '$sce', 'comerciosFactory', '$http', 'Cliente',
  function($scope, localStorage, $ionicPopup, socketFactory, $ionicPlatform, $sce, comerciosFactory, $http, Cliente) {

    $scope.sistema = {
      initialRender: false,
      colaGeneral: [],
      cajas: [],
      retrasoPromedio: []
    };

    $scope.cliente = new Cliente(
      localStorage.get('uuid'),
      localStorage.get('enComercio') === 'true',
      $scope.sistema
    );

    $scope.online = localStorage.get('isOnline') === 'true';
    $scope.errorGPS = localStorage.get('errorGPS') === 'true';

    var mySocket = null;

    function conectarSocket(){
      var myIoSocket = io.connect(localStorage.getObject('comercio').serverUrl, { query: 'token=' + localStorage.get('token')});

      mySocket = socketFactory({
        ioSocket: myIoSocket
      });

      mySocket.on('actualizarFila', function(data){

        $scope.sistema.colaGeneral = data.colaGeneral;
        $scope.sistema.cajas = data.cajas;

        if ($scope.cliente.estaEnFilaGeneral()){
          if ($scope.cliente.getPosicion() > 1){
            $scope.estadoFila = $sce.trustAsHtml('<i class="icon ion-android-person"></i> Perfecto, ya estás en la fila. Tu posición es la número <b>' + $scope.cliente.getPosicion() + '</b>. Tenés una espera promedio de <b>' + $scope.cliente.getEsperaPromedio() + '</b> minutos hasta ser llamado');
          } else {
            $scope.estadoFila = $sce.trustAsHtml('<i class="icon ion-android-person"></i> Sos el próximo en la fila, estate atento porque en unos instantes vas a ser llamado.')
          }
        }

        if ($scope.cliente.estaEnCaja()){
          $scope.estadoFila = $sce.trustAsHtml('<i class="icon ion-android-person"></i> Acercate a la caja número ' + $scope.cliente.getCaja() + '.');
        }

        $scope.sistema.initialRender = true;
      });
    }

    if ($scope.online && $scope.cliente.estaEnComercio()){
      conectarSocket();
    } else {
      $scope.initialRender = true;
    }

    function customBack(){
      $ionicPopup.confirm({
        title: 'Salir',
        content: '¿Desea salir de la aplicación?',
        cssClass: "question-popup",
        cancelText: "Cancelar"
      }).then(function(confirm){
        if (confirm){
          if ($scope.cliente.estaEnFilaGeneral()) mySocket.emit('salirFila');
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
        content: 'Vas a perder tu posición en la fila, ¿estás seguro?',
        cssClass: "question-popup",
        cancelText: "Cancelar"
      }).then(function(confirm){
        if (confirm){
          mySocket.emit('salirFila');
        }
      })
    };

    $scope.$on('offline', function(){
      $scope.online = false;
    });

    $scope.$on('online', function(){
      $scope.online = true;
      if ($scope.cliente.estaEnComercio()) mySocket.emit('pedirActualizacion');
    });

    $scope.$on('nuevaPosicion', function(ev, miPosicion){
      $scope.errorGPS = false;
      if (!$scope.cliente.estaEnComercio()){
        //Determinar si se encuentra en un comercio y conectar
        comerciosFactory.getComercioCliente(miPosicion, function(comercio, ok){
          if (ok){
            $scope.cliente.setEnComercio(true);
            localStorage.set('enComercio', true);
            localStorage.setObject('comercio', comercio);
            var uuid = {
              uuid: $scope.cliente.id
            };
            $http.post(comercio.serverUrl + '/handshake', uuid).then(function(data){
              localStorage.set('token', data.data.token);
              localStorage.set('isOnline', true);
              $scope.online = true;
              conectarSocket();
            }, function(err){
              localStorage.set('isOnline', false);
              $scope.online = false;
            })
          } else {
            localStorage.set('enComercio', false);
            $scope.cliente.setEnComercio(false);
          }
        });
      }
    });

    $scope.$on('errorGPS', function(){
      localStorage.set('errorGPS', true);
      $scope.errorGPS = true;
    });

    $scope.$on('$destroy', function(){
      mySocket.emit('salirFila');
    });

  }]);

myApp.controller('listaCtrl', ['$scope', 'localStorage', '$ionicPopup', function($scope, localStorage, $ionicPopup){

  $scope.listaCompras = localStorage.getObject('listaCompras');

  if (!angular.isDefined($scope.listaCompras.data)){
    $scope.listaCompras = {
      data: []
    }
  }

  $scope.tachar = function(indice){
    var item = $scope.listaCompras.data.splice(indice, 1)[0];
    $scope.listaCompras.data.push(item);

    localStorage.setObject('listaCompras', $scope.listaCompras);
  };

  $scope.limpiarTachados = function(){
    var aux = [];
    $scope.listaCompras.data.forEach(function(item){
      if (!item.check){
        aux.push(item);
      }
    });
    $scope.listaCompras.data = aux;
    localStorage.setObject('listaCompras', $scope.listaCompras);
  };

  $scope.agregar = function(){
    $ionicPopup.prompt({
      title: 'Nuevo ítem',
      template: 'Ingrese nuevo ítem',
      inputType: 'text',
      inputPlaceholder: 'Nuevo ítem'
    }).then(function(res) {
      console.log(res);
      if (angular.isDefined(res)){
        var item = {
          check: false,
          descripcion: res
        };
        $scope.listaCompras.data.push(item);
        localStorage.setObject('listaCompras', $scope.listaCompras);
      }
    });
  }

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

myApp.controller('loginCtrl', ['$scope', '$cordovaFacebook', function($scope, $cordovaFacebook){

  $scope.usuario = '';
  $scope.password = '';

  $scope.ingresar = function(){
    //Probando login con fb
    $cordovaFacebook.login(["public_profile", "email", "user_friends"])
      .then(function(success){
        console.log('todo ok');
        console.log(JSON.stringify(success));
      }, function(error){
        console.log('error');
        console.log(JSON.stringify(error));
      });
  }

}]);
