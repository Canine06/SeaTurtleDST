'use strict';

/* Controllers */

angular.module('myApp.controllers', []).
  controller('Intro', ['$scope', function ($scope) {
      BuildStep1Content();
      $scope.introNewReportKeyPress = function (e) {
          if (e.keyCode == 13) {
              $scope.changeView("step1");
              disableButton();
              resetTimeSelect();
              clearSelection($scope.map);
              disableDraw();
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
      buildSlider($scope.AppConfig);
      $scope.queryBlocks = function () {
          var applyquerybutton = document.getElementById("selectocsblocks");
          //applyquerybutton.disabled = true;

          if (applyquerybutton.innerHTML == "Apply Selection") {
              QueryOCSBlocks(elayer, $scope.map);
          }
          else {
              poly.enable();
              applyquerybutton.innerHTML = "Apply Selection";
          }

      }
  }])
.controller('AppController', ['$scope', '$location', function ($scope, $location) {
    $scope.changeView = function (view) {
        $location.path(view);
        if (view == "step1") {
            LoadStep1($scope.map);
            disableButton();
            resetTimeSelect();
            clearSelection($scope.map);
            disableDraw();
        }
    }
    $scope.newReportKeyPress = function (e) {
        if (e.keyCode == 13) {
            $scope.changeView("step1");
            disableButton();
            resetTimeSelect();
            clearSelection($scope.map);
            disableDraw();
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