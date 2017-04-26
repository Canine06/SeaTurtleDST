'use strict';


// Declare app level module which depends on filters, and services
angular.module('myApp', [
  'ngRoute',
  'myApp.filters',
  'myApp.services',
  'myApp.directives',
  'myApp.controllers',
  'angulartics', 
  'angulartics.google.analytics'
])
.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/intro', {templateUrl: 'partials/intro.html', controller: 'Intro'});
  $routeProvider.when('/step1', {templateUrl: 'partials/step1.html', controller: 'Step1'});
  $routeProvider.otherwise({redirectTo: '/intro'});
}])
.config(function($animateProvider) {
  $animateProvider.classNameFilter(/angular-animate/);
})
.config(function ($analyticsProvider) {
  $analyticsProvider.firstPageview(true); /* Records pages that don't use $state or $route */
  $analyticsProvider.withAutoBase(true);  /* Records full path */
});
