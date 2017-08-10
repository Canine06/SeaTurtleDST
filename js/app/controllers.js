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
              resetSlider();
          }
      }
      $(".leaflet-right").slideUp(1);
      return "content loaded";
  }])
  .controller('Step1', ['$scope', function ($scope) {
      $scope.step1Header = document.getElementById("Step1-Header");
      $scope.step1Instructions = document.getElementById("Step1-Instructions");
      $scope.step1ContentInstructions = document.getElementById("Step1-ContentInstructions");
      $scope.step1Header.innerHTML = $scope.AppConfig.Step1Header;
      $scope.step1Instructions.innerHTML = $scope.AppConfig.Step1Instructions;

      $scope.step1ContentInstructions.innerHTML = "";
      var listitems = [];
      for (var i = 0; i < AppConfig.Step1InstructionSteps.length; i++) {
          var listitem = document.createElement("li");
          listitem.appendChild(document.createTextNode(AppConfig.Step1InstructionSteps[i]));
          $scope.step1ContentInstructions.appendChild(listitem);
      }

      $("#selectocsblocks").addClass("disabled");
      LoadStep1($scope.map);
      buildSlider($scope.AppConfig);
      resetSlider();
      $scope.queryBlocks = function () {
          var applyquerybutton = document.getElementById("selectocsblocks");
          //applyquerybutton.disabled = true;

          if (applyquerybutton.innerHTML == "Apply Selection") {
              QueryOCSBlocks(elayer, $scope.map);
          }
          else {
              poly.enable();
              
              applyquerybutton.innerHTML = "Apply Selection";
              resetSlider();
          }

      }
      $(document).ready(function () {
          new nicEditor({ buttonList: ['bold', 'italic', 'underline', 'left', 'center', 'right', 'justify', 'ol', 'ul', 'fontSize', 'fontFamily', 'fontFormat', 'forecolor'] }).panelInstance('CommentArea');
          //new nicEditor({ fullPanel: true }).panelInstance('CommentArea');
          $("div.nicEdit-main").keyup(function () {
              if ($(this).text().length > 0) {
                  if ($("#timeofyear option:selected").text() != "Select time period" && selectedOCSBlocks != null) {
                      $('#AnalyzeData').attr('disabled', false);
                      $('#AnalyzeData').removeClass('disabled');
                  }
              }
              else {
                  $('#AnalyzeData').attr('disabled', true);
                  $('#AnalyzeData').addClass('disabled');
              }
          });
      });
          
    
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
            resetSlider();
        }
    }
    $scope.newReportKeyPress = function (e) {
        if (e.keyCode == 13) {
            $scope.changeView("step1");
            disableButton();
            resetTimeSelect();
            clearSelection($scope.map);
            disableDraw();
            resetSlider();
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