/**
 * Created by Artiom on 10/03/2016.
 */
myApp.controller('filaCtrl', ['$scope', 'localStorage', '$ionicPopup', 'socketConnection', '$sce', '$ionicPlatform', 'comerciosFactory', '$http', 'Cliente', '$cordovaVibration', 'comerceSystem', '$state',
  function($scope, localStorage, $ionicPopup, socketConnection, $sce, $ionicPlatform, comerciosFactory, $http, Cliente, $cordovaVibration, comerceSystem, $state) {

    $scope.sistema = comerceSystem.getSystem();

    $scope.cliente = new Cliente($scope.sistema);

    $scope.online = localStorage.get('isOnline') === 'true';
    $scope.errorGPS = localStorage.get('errorGPS') === 'true';

    $scope.$on('socket:actualizarFila', function(ev, data){
      console.log(JSON.stringify(data));
      $scope.sistema.colaGeneral = data.colaGeneral;
      $scope.sistema.cajas = data.cajas;
      $scope.sistema.tiempoPromedioAtencion = data.tiempoPromedioAtencion;

      var cajasAtendiendo = [];
      $scope.sistema.cajas.forEach(function(caja){
        if (caja.atendiendo) cajasAtendiendo.push(caja);
      });

      $scope.sistema.cajasAtendiendo = cajasAtendiendo;

      if (cajasAtendiendo.length == 1) {
        $scope.estadoCajas = $sce.trustAsHtml('<i class="icon ion-android-cart"></i> El sistema se encuentra habilitado. La caja numero ' + cajasAtendiendo[0].numero + ' se encuentra atendiendo');
      } else {
        $scope.estadoCajas = $sce.trustAsHtml('<i class="icon ion-android-cart"></i> El sistema se encuentra habilitado. Las cajas <span ng-repeat="caja in sistema.cajasAtendiendo track by $index"><span ng-show="$last">y </span><span>{{caja.numero}}</span><span ng-show="!$last">, </span></span> están atendiendo');
      }

      if ($scope.cliente.estaEnCaja()){
        if ($scope.cliente.getNotifCaja){
          $scope.cliente.setNotifCaja(false);
          $cordovaVibration.vibrate(2000);
        }
      } else {
        $scope.cliente.setNotifCaja(true);
      }
    });

    $scope.$on('socket:clienteAtendido', function(ev, data){
      console.log(JSON.stringify(data));
      $state.go('tabs.gracias');
    });

    socketConnection.hacerFila();

    /*function conectarSocket(){

      console.log('conectar socket loco');

      mySocket.on('actualizarFila', function(data){

        $scope.sistema.colaGeneral = data.colaGeneral;
        $scope.sistema.cajas = data.cajas;

        var cajasAtendiendo = [];
        $scope.sistema.cajas.forEach(function(caja){
          if (caja.atendiendo) cajasAtendiendo.push(caja);
        });

        $scope.sistema.cajasAtendiendo = cajasAtendiendo;

        if (cajasAtendiendo.length == 0){
          $scope.estadoCajas = $sce.trustAsHtml('<i class="icon ion-sad"></i> Lo sentimos, actualmente no hay cajas atendiendo');
        } else if (cajasAtendiendo.length == 1) {
          $scope.estadoCajas = $sce.trustAsHtml('<i class="icon ion-android-cart"></i> El sistema se encuentra habilitado. La caja numero ' + cajasAtendiendo[0].numero + ' se encuentra atendiendo');
        } else {
          $scope.estadoCajas = $sce.trustAsHtml('<i class="icon ion-android-cart"></i> El sistema se encuentra habilitado. Las cajas <span ng-repeat="caja in sistema.cajasAtendiendo track by $index"><span ng-show="$last">y </span><span>{{caja.numero}}</span><span ng-show="!$last">, </span></span> están atendiendo');
        }

        if ($scope.cliente.estaEnFilaGeneral()){
          if ($scope.cliente.getPosicion() > 1){
            $scope.estadoFila = $sce.trustAsHtml('<i class="icon ion-android-person"></i> Perfecto, ya estás en la fila. Tu posición es la número <b>' + $scope.cliente.getPosicion() + '</b>. Tenés una espera promedio de <b>' + $scope.cliente.getEsperaPromedio() + '</b> minutos hasta ser llamado');
          } else {
            $scope.estadoFila = $sce.trustAsHtml('<i class="icon ion-android-person"></i> Sos el próximo en la fila, estate atento porque en unos instantes vas a ser llamado.')
          }
        }

        if ($scope.cliente.estaEnCaja()){
          if ($scope.cliente.getNotifCaja){
            $scope.cliente.setNotifCaja(false);
            $cordovaVibration.vibrate(2000);
          }
          $scope.estadoFila = $sce.trustAsHtml('<i class="icon ion-android-person"></i> Acercate a la caja número ' + $scope.cliente.getCaja() + '.');
        } else {
          $scope.cliente.setNotifCaja(true);
        }

        $scope.sistema.initialRender = true;
      });
    }*/

    $scope.irme = function(){
      $ionicPopup.confirm({
        title: 'Abandonar fila',
        content: 'Vas a perder tu posición en la fila, ¿estás seguro?',
        cssClass: "question-popup",
        cancelText: "Cancelar"
      }).then(function(confirm){
        if (confirm){
          socketConnection.salirFila();
          $state.go('tabs.hacerFila');
        }
      })
    };

    $ionicPlatform.registerBackButtonAction($scope.irme, 501);

    $scope.$on('offline', function(){
      $scope.online = false;
    });

    $scope.$on('online', function(){
      $scope.online = true;
      socketConnection.pedirActualizacion();
    });

    /*$scope.$on('nuevaPosicion', function(ev, miPosicion){
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
    });*/

    /*$scope.$on('errorGPS', function(){
      localStorage.set('errorGPS', true);
      $scope.errorGPS = true;
    });*/

    $scope.$on('$destroy', function(){
      socketConnection.salirFila();
    });

  }]);
