// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js

var myApp = angular.module('app', ['ionic', 'ngAnimate', 'ngCordova', 'ui.router', 'ngSanitize', 'btford.socket-io']);

myApp.config(function($stateProvider, $urlRouterProvider, $httpProvider) {

  $httpProvider.defaults.headers.post['Content-Type'] = 'application/json;charset=utf-8';
  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js
  $stateProvider

    .state('cargando', {
      url: '/cargando',
      templateUrl: 'templates/cargando.html'
    })

    .state('inicio', {
      url: '/inicio',
      templateUrl: 'templates/inicio.html'
    })

    .state('login', {
      url: '/login',
      templateUrl: 'templates/login.html'
    })

    .state('lista', {
      url: '/lista',
      templateUrl: 'templates/lista.html'
    })

    .state('comercios', {
      url: '/comercios',
      templateUrl: 'templates/comercios.html'
    })


  ;

  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/cargando');

});

myApp.run(['$rootScope', '$ionicPlatform', 'ConnectivityMonitor', '$ionicPopup',  'localStorage', 'GeolocationMonitor',
  function($rootScope, $ionicPlatform, ConnectivityMonitor, $ionicPopup, localStorage, GeolocationMonitor) {
    $ionicPlatform.ready(function() {

      var watch = null;
      // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
      // for form inputs)
      if(window.cordova && window.cordova.plugins.Keyboard) {
        cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      }
      if(window.StatusBar) {
        // org.apache.cordova.statusbar required
        StatusBar.styleDefault();
      }

      ConnectivityMonitor.startWatching();

      if (!ConnectivityMonitor.isOnline()){
        $ionicPopup.alert({
            title: "Sin conexión",
            content: "Su dispositivo no está conectado a Internet.",
            cssClass: "energized"
          })
          .then(function(result) {
            localStorage.set('isOnline', false);
            localStorage.set('enComercio', false);
          });
      } else {
        localStorage.set('isOnline', true);
      }

      GeolocationMonitor.startWatching();

      if (localStorage.get('isLogged') === 'true'){
        $rootScope.usuario = localStorage.getObject('usuario');
        $rootScope.sideMenu = [
          {nombre: 'Mi perfil', ref: 'perfil'},
          {nombre: 'Mis compras', ref: 'compras'},
          {nombre: 'Promociones', ref: 'promociones'}
        ]
      } else {
        $rootScope.usuario = {
          nombre: 'Anónimo',
          avatar: 'img/avatar_guest.png'
        };
        $rootScope.sideMenu = [
          {nombre: 'Iniciar sesión', ref: 'login'},
          {nombre: 'Mis compras', ref: 'compras'}
        ]
      }

    });
  }]);
