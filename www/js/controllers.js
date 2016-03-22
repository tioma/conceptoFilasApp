myApp.controller('navigationCtrl', ['$scope', '$ionicHistory', 'localStorage', '$ionicPopup', 'socketConnection', '$state',
  function($scope, $ionicHistory, localStorage, $ionicPopup, socketConnection, $state){

    if (localStorage.get('isLogged') === 'true'){
      $scope.usuario = localStorage.getObject('usuario');
      $scope.sideMenu = [
        {nombre: 'Mi perfil', ref: 'perfil'},
        {nombre: 'Mis compras', ref: 'compras'},
        {nombre: 'Promociones', ref: 'promociones'}
      ]
    } else {
      $scope.usuario = {
        nombre: 'Anónimo',
        avatar: 'img/avatar_guest.png'
      };
      $scope.sideMenu = [
        {nombre: 'Iniciar sesión', ref: 'login'},
        {nombre: 'Mis compras', ref: 'compras'}
      ]
    }

    $scope.irAtras = function(){
      switch ($ionicHistory.currentStateName()){
        case 'tabs.tuFila':
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
          });
          break;
        case 'tabs.gracias':
          $state.go('tabs.hacerFila');
          break;
      }
    }

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
