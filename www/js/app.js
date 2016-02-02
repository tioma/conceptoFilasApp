// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js
var db = null;

angular.module('app', ['ionic', 'ngCordova', 'app.controllers', 'app.routes', 'app.services', 'app.directives'])

.run(function($ionicPlatform, ConnectivityMonitor, $ionicPopup) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if(window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if(window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }

    if (ConnectivityMonitor.isOnline()){
      ConnectivityMonitor.startWatching();
    } else {
      $ionicPopup.alert({
          title: "Sin conexión",
          content: "Su dispositivo no está conectado a Internet."
        })
        .then(function(result) {
          $ionicPlatform.exitApp();
        });
    }

    db = $cordovaSQLite.openDB("ConceptoFilas.db");
    $cordovaSQLite.execute(db, "CREATE TABLE IF NOT EXISTS comercio (id integer primary key, nombre text, latitud real, longitud real, servidor text)");
  });
});
