function loadConfig($scope) {
    if (test != true && typeof (test) != "undefined") {
        $.ajax({
            type: "GET",
            url: "config/config.json",
            dataType: "json",
            success: function (resp) {
                $scope.AppConfig = resp;
                if (!test) {
                    initMap($scope);
                }

                //BuildInitPageContent($scope);
                return "completed";
            },
            error: function (resp) {
                console.log(resp);
                return "failed";
            }
        });

    }
    else
    {
        $.ajax({
            type: "GET",
            url: "config/config.json",
            dataType: "json",
            success: function (resp) {
                AppConfig = resp;
                BuildStep1Content();
                return "completed";
            },
            error: function (resp) {
                console.log(resp);
                return "failed";
            }
        });
    }
};
function LoadStep1(map) {
    //NewReportClick();
    $("#timeofyear").change(function () {
        var val = $("#timeofyear option:selected").text();
        if (val == "Months" || val == "Seasons") {
            TimeOfYearChange(map);
            var applyquerybutton = document.getElementById("selectocsblocks");
            applyquerybutton.disabled = true;
        }
    });
}
function disableButton() {
    $("#selectocsblocks").addClass("disabled");
    $("#selectocsblocks").attr("disabled", "disabled");
    $("#selectocsblocks").html('Apply Selection');
}
function enableButton() {
    $("#selectocsblocks").removeClass("disabled");
}

$(function(){
  console.log("Ready!");
  $('.modal-toggle').click(function(e){
    e.preventDefault();
    $('.modal').toggleClass('is-visible');
  });
});


