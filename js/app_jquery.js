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
        //$("#new-report-button").click(function () {
        //    LoadStep1();
        //});
        //$("#button-pane").click(function () {
        //    LoadStep1();
        //});
        
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
        TimeOfYearChange();
        $("#selectocsblocks").removeClass("disabled");
        $("#selectocsblocks").click(function () {
            SelectAOIComplete(map);
        });
    });
}
function disableButton() {
    $("#selectocsblocks").addClass("disabled");
}