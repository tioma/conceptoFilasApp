angular.module('app.routes', [])

.config(function($stateProvider, $urlRouterProvider) {

  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js
  $stateProvider
    
      
        
    .state('inicio', {
      url: '/page1',
      templateUrl: 'templates/inicio.html',
      controller: 'inicioCtrl'
    })
        
      
    
      
        
    .state('principal', {
      url: '/page7',
      templateUrl: 'templates/principal.html',
      controller: 'principalCtrl'
    })
        
      
    ;

  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/page1');

});