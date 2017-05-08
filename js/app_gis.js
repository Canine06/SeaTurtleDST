var map;
var AppConfig;
var ocsBlocks, sandResources, poly;
var selectedOCSBlocks;
var drawnItems = new L.featureGroup();
var resultsLayer = new L.featureGroup();
var geojson = null;
var hasTool = 0;
var drawcontrol = null;
var test = false;
function initMap($scope) {
    AppConfig = $scope.AppConfig;
    BuildMap($scope);
    BuildLegend($scope);

}
function BuildMap($scope) {
    if (!test) {
        $scope.map = L.map("left-pane", { attributionControl: false }).setView([39, -97.5], 4);
        //Add basemap
        $scope.baseMap = L.esri.basemapLayer(AppConfig.BaseMap).addTo($scope.map);

        //Add dynamic layers
        $scope.map.createPane("sandresources");
        $scope.sandResources = L.esri.dynamicMapLayer({ url: AppConfig.MapLayers[1].url, layers: [AppConfig.MapLayers[1].layers], pane: 'sandresources' }).addTo($scope.map);
        sandResources = $scope.sandResources;
        $scope.map.createPane("ocsblocks");
        $scope.ocsBlocks = L.esri.dynamicMapLayer({ url: AppConfig.MapLayers[0].url, layers: [AppConfig.MapLayers[0].layers], pane: 'ocsblocks' }).addTo($scope.map);
        ocsBlocks = $scope.ocsBlocks;
        $scope.map.createPane("selectedblocks");

    }
    else {
        AppConfig = $scope.AppConfig;
        //Add basemap
        $scope.baseMap = L.esri.basemapLayer(AppConfig.BaseMap).addTo($scope.map);

        //Add dynamic layers

        $scope.sandResources = L.esri.dynamicMapLayer({ url: AppConfig.MapLayers[1].url, layers: [AppConfig.MapLayers[1].layers] }).addTo($scope.map);
        $scope.ocsBlocks = L.esri.dynamicMapLayer({ url: AppConfig.MapLayers[0].url, layers: [AppConfig.MapLayers[0].layers] }).addTo($scope.map);
    }
    return true;
}
function BuildLegend($scope) {
    var opts = {
        listTemplate: '<ul>{layers}</ul>',
        layerTemplate: '<li><strong>{layerName}</strong><ul>{legends}</ul></li>',
        listRowTemplate: '<li><img width="{width}" height="{height}" src="data:{contentType};base64,{imageData}"><span>{label}</span></li>',
        emptyLabel: '<all values>',
        container: null
    };
    //bind layers to legend control
    L.esri.legendControl($scope.ocsBlocks, opts).addTo($scope.map);
    L.esri.legendControl($scope.sandResources, opts).addTo($scope.map);

    //$(".leaflet-right").append("<div style='text-align:center;'>Legend</div>").addClass("legend-grip").click(function () {
    //    $(".leaflet-right").slideToggle("slow");
    //});
    //$("<p>Test</p>").insertAfter(".inner");
}
function BuildStep1Content() {
    var contentheader = document.getElementById("ContentHeader");
    var contentinstructionsheader = document.getElementById("ContentInstructionsHeader");
    var contentinstructions = document.getElementById("ContentInstructions");
    var contentfooter = document.getElementById("ContentFooter");
    var contentfooterlinksheader = document.getElementById("ContentFooterLinksHeader");
    var contentfooterlinks = document.getElementById("ContentFooterLinks");
    contentheader.innerHTML = AppConfig.Header;
    contentinstructionsheader.innerHTML = AppConfig.InstructionsHeader;

    contentinstructions.innerHTML = "";
    var listitems = [];
    for (var i = 0; i < AppConfig.Instructions.length; i++) {
        var listitem = document.createElement("li");
        listitem.appendChild(document.createTextNode(AppConfig.Instructions[i]));
        contentinstructions.appendChild(listitem);
    }

    contentfooter.innerHTML = AppConfig.Footer;
    contentfooterlinksheader.innerHTML = AppConfig.LinksHeader;
    for (var i = 0; i < AppConfig.Links.length; i++) {
        var aitem = document.createElement("a");
        var linkText = document.createTextNode(AppConfig.Links[i].label);
        aitem.appendChild(linkText);
        aitem.title = AppConfig.Links[i].label;
        aitem.href = AppConfig.Links[i].url;
        aitem.tabIndex = 0;
        aitem.target = "_blank";
        contentfooterlinks.appendChild(aitem);
        var br = document.createElement("br");
        contentfooterlinks.appendChild(br);
    }

}
function NewReportClick() {
    if (!test) {
        BuildStep1Content();
    }

    var intro = document.getElementById("right-pane");
    var step1 = document.getElementById("step-1-container");

    return true;
}
function SelectAOIComplete(map) {
    if (hasTool == 0) {
        map.addLayer(drawnItems);

        // create a new Leaflet Draw control
        //var drawControl = new L.Control.Draw({
        //    edit: {
        //        featureGroup: drawnItems // allow editing/deleting of features in this group
        //    },
        //    draw: {
        //        circle: false, // disable circles
        //        marker: false, // disable polylines
        //        polyline: false, // disable polylines
        //        polygon: {
        //            allowIntersection: true, // polygons cannot intersect thenselves
        //            drawError: {
        //                color: 'red', // color the shape will turn when intersects
        //                message: '<strong>Oh snap!<strong> you can\'t draw that!' // message that will show when intersect
        //            },
        //        }
        //    }
        //});
        poly = new L.Draw.Polygon(map);
        //drawcontrol = drawControl;
        // listen to the draw created event
        map.on('draw:created', function (e) {
            // add the feature as GeoJSON (feature will be converted to ArcGIS JSON internally)

            drawnItems.clearLayers();
            drawnItems.addLayer(e.layer);
            enableButton();
            $("#selectocsblocks").click(function () {
                QueryOCSBlocks(e.layer, map);
            });
            //poly.enable();
        });

        // add our drawing controls to the map
        //map.addControl(drawControl);

        poly.enable();
        hasTool = 1;
    }
    poly.enable();

    return true;
}
function QueryOCSBlocks(polygon, map) {
    // query the service executing the selected relation with the selected input geometry
    ocsBlocks.query().layer(0).intersects(polygon).run(function (error, featureCollection, response) {

        selectedOCSBlocks = featureCollection;

        if (geojson != null) {
            if (map.hasLayer(geojson)) {
                map.removeLayer(geojson);
            }
        }
        geojson = L.geoJSON(featureCollection, { pane: "selectedblocks" }).addTo(map);



    });
    drawnItems.clearLayers();
    return true;
}
function TimeOfYearChange(map) {
    var timeofyear = document.getElementById("timeofyear");
    var val = timeofyear.value;
    if (hasTool == 1) {
        //poly.enable();
    }
    SelectAOIComplete(map);
    //if (val == "Select time period") {
    //    if (test != true) {
    //        //alert("You must choose a time of year.  Try again.");
    //    }
    //}
    //else {
    //    var ocsblocksselector = document.getElementById("selectocsblocks");
    //    ocsblocksselector.disabled = false;
    //}
    return true;
}
