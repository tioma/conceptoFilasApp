angular.module('app.controllers', [])

.controller('inicioCtrl', ['$scope', '$cordovaGeolocation', function($scope, $cordovaGeolocation) {

  $scope.miPosicion = {
    latitud: 0,
    longitud: 0
  };

  $scope.mensaje = 'todo bien';

  var posOptions = {
    timeout: 10000,
    enableHighAccuracy: false
  };

  $cordovaGeolocation
    .getCurrentPosition(posOptions)
    .then(function (position) {
      $scope.miPosicion.latitud  = position.coords.latitude;
      $scope.miPosicion.longitud = position.coords.longitude;
      //var lat  = position.coords.latitude;
      //var long = position.coords.longitude;

      /*var inserturl = '';

       $http.get(inserturl, { params: position })
       .success(function(data){
       callback(data);
       }).error(function(error){
       callback(error);
       })*/


    }, function(err) {
      // error
      $scope.mensaje = 'paso algo';
      console.log(err);
    });

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
