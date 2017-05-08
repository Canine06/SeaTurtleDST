'use strict';

/* Controllers */

angular.module('myApp.controllers', []).
  controller('Intro', ['$scope', function ($scope) {
      BuildStep1Content();
      $scope.introNewReportKeyPress = function (e) {
          if (e.keyCode == 13) {
              $scope.changeView("step1");
          }
      }
      $(".leaflet-right").slideUp(1);
      return "content loaded";
  }])
  .controller('Step1', ['$scope', function ($scope) {
      $scope.step1Header = document.getElementById("Step1-Header");
      $scope.step1Instructions = document.getElementById("Step1-Instructions");
      $scope.step1Header.innerHTML = $scope.AppConfig.Step1Header;
      $scope.step1Instructions.innerHTML = $scope.AppConfig.Step1Instructions;
      $("#selectocsblocks").addClass("disabled");
      LoadStep1($scope.map);

  }])
.controller('AppController', ['$scope', '$location', function ($scope, $location) {
    $scope.changeView = function (view) {
        $location.path(view);
        if (view == "step1") {
            LoadStep1($scope.map);
        }
    }
    $scope.newReportKeyPress = function (e) {
        if (e.keyCode == 13) {
            $scope.changeView("step1");
        }
    }
    $scope.testLegend = function () {
        $(".leaflet-right").slideToggle("slow");
    }
    $scope.testLegendKeyPress = function (e) {

        if (e.keyCode == 13) {
            $(".leaflet-right").slideToggle("slow");
        }
    }
    loadConfig($scope);
}]);