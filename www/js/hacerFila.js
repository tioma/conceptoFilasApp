/**
 * Created by Artiom on 09/03/2016.
 */
myApp.controller('hacerFilaCtrl', ['$scope', '$ionicLoading', '$http', 'GeolocationMonitor', '$ionicPopup', 'comerciosFactory', 'localStorage', '$state', 'socketConnection', 'comerceSystem', 'Cliente',
  function($scope, $ionicLoading, $http, GeolocationMonitor, $ionicPopup, comerciosFactory, localStorage, $state, socketConnection, comerceSystem, Cliente){

    $scope.sistema = {
      colaGeneral: [],
      cajas: [],
      retrasoPromedio: 2
    };

    $scope.huboError = false;

    $ionicLoading.show({
      content: 'Cargando',
      animation: 'fade-in',
      showBackdrop: false,
      hideOnStateChange: true,
      showDelay: 0
    });

    document.addEventListener("deviceready", function () {

      $scope.deshabilitarSistema = true;

      window.plugins.sqlDB.copy("filasServers.db", 0, function(){
        obtenerPosicion();
      }, function(error){
        if (error.code == 516){
          obtenerPosicion();
        } else {
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

    function obtenerPosicion(){
      GeolocationMonitor.getCurrentLocation(function(miPosicion, ok){
        if (ok){
          cargaInicial(miPosicion);
        } else {
          $scope.deshabilitarSistema = true;
          $scope.huboError = true;
          $ionicLoading.hide();
          $ionicPopup.confirm({
            title: 'Usar GPS',
            content: 'Esta aplicación necesita acceder al GPS para funcionar, ¿Desea activarlo?',
            cssClass: "question-popup",
            cancelText: "Cancelar"
          }).then(function(confirm){
            if (confirm){
              cordova.plugins.settings.openSetting("location_source", function(){
                console.log('vamos a los settings');
              }, function(){
                console.log('algo falló');
              })
            }
          })
        }
      });
    }

    function cargaInicial(miPosicion){
      $scope.cliente = new Cliente($scope.sistema);

      localStorage.setObject('posicion', miPosicion);
      comerciosFactory.getComercioCliente(miPosicion, function(comercio, ok){
        if (ok){
          var uuid = {
            uuid: $scope.cliente.getId()
          };
          $scope.comercio = comercio;
          $http.post(comercio.serverUrl + '/handshake', uuid).then(function(data){
            //localStorage.set('token', data.data.token);
            $scope.token = data.data.token;
            $ionicLoading.hide();
            socketConnection.connect(comercio.serverUrl, data.data.token);
          }, function(err){
            $ionicLoading.hide();
            $ionicPopup.alert({
              title: 'Error',
              content: 'Se produjo un error al intentar conectar con el servidor ' + comercio.serverUrl + ' mensaje: ' + err.message,
              cssClass: 'alert-popup'
            }).then(function(result){
              $scope.deshabilitarSistema = true;
            })
          })
        } else {
          $ionicLoading.hide();
          $ionicPopup.alert({
            title: 'Sin sistema',
            content: 'Acercate hasta un comercio con el sistema habilitado',
            cssClass: "alert-popup"
          }).then(function(result){
            $scope.deshabilitarSistema = true;
          })
        }
      });
    }

    $scope.$on('socket:actualizarFila', function(ev, data){
      comerceSystem.setSystem(data);
      $scope.sistema = data;
      $scope.deshabilitarSistema = !comerceSystem.estaHabilitado();
    });

    $scope.$on('nuevaPosicion', function(ev, miPosicion){
      console.log('nueva posicion');
      if ($scope.huboError){
        $scope.huboError = false;
        cargaInicial(miPosicion);
      }
    });

  }]);
