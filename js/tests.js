var test = true;
var AppConfig;
var $scope = new Object();
var map;
QUnit.test("New Report Test", function (assert) {
    var result = NewReportClick();
    assert.equal(result, true, "New Report Test passes");
});
QUnit.test("Select Area Of Interest Test", function (assert) {
    var drawnItems = new L.featureGroup();
    map = L.map("left-pane").setView([39, -97.5], 4);

    var result = SelectAOIComplete(map);
    assert.equal(result, true, "Select Area of Interest Test passes");
});
QUnit.test("Pick Time of Year Test", function (assert) {
    var result = TimeOfYearChange();
    var blah = "";
    assert.equal(result, true, "Pick Time of Year Test passes");
});
QUnit.test("Load Layers Test", function (assert) {
    $scope.map = map;
    $scope.AppConfig = new Object();
    $scope.AppConfig.BaseMap = "Oceans";
    $scope.AppConfig.MapLayers = [];
    var MapLayers = new Object();
    MapLayers.url = "http://dev-public.quantumspatial.com:6080/arcgis/rest/services/SeaTurtle/OCSBlocks/MapServer";
    MapLayers.label = "OCSBlocks";
    $scope.AppConfig.MapLayers.push(MapLayers);
    MapLayers = new Object();
    MapLayers.url = "http://23.23.179.177/arcgis/rest/services/PlanningandAdministration/MapServer";
    MapLayers.label = "Sand Resource Areas";
    MapLayers.layers = "7";
    $scope.AppConfig.MapLayers.push(MapLayers);
    
    var result = BuildMap($scope);
    assert.equal(result, true, "Load Layers Test passes");
});