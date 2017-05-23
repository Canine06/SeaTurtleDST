var map;
var AppConfig;
var ocsBlocks, sandResources, poly, elayer;
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
        $scope.map.addLayer(drawnItems);
        var ocsb_feats = L.esri.featureLayer({
            url: AppConfig.MapLayers[2].url
        });

        zoomToFullExtent($scope);
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
function zoomToFullExtent($scope) {
    var ocsb_feats = L.esri.featureLayer({
        url: AppConfig.MapLayers[2].url
    });

    ocsb_feats.query().bounds(function (error, latlngbounds) {
        $scope.map.fitBounds(latlngbounds);
    });
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

    //var intro = document.getElementById("right-pane");
    //var step1 = document.getElementById("step-1-container");

    return true;
}
function resetTimeSelect() {
    var timeselect = document.getElementById("timeofyear");
    timeselect.selectedIndex = 0;
}
function SelectAOIComplete(map) {

    poly = new L.Draw.Polygon(map);

    // listen to the draw created event
    map.on('draw:created', function (e) {
        // add the feature as GeoJSON (feature will be converted to ArcGIS JSON internally)

        drawnItems.clearLayers();
        drawnItems.addLayer(e.layer);
        elayer = e.layer;
        enableButton();
        var applyquerybutton = document.getElementById("selectocsblocks");

        applyquerybutton.disabled = false;

    });
    poly.enable();
    return true;
}
function QueryOCSBlocks(polygon, map) {
    // query the service executing the selected relation with the selected input geometry
    ocsBlocks.query().layer(0).intersects(polygon).run(function (error, featureCollection, response) {

        selectedOCSBlocks = featureCollection;

        clearSelection(map);
        
        geojson = L.geoJSON(featureCollection, { pane: "selectedblocks" }).addTo(map);

        var selectocsblocksbutton = document.getElementById("selectocsblocks");
        selectocsblocksbutton.innerHTML = "Redraw Selection";
        selectocsblocksbutton.disabled = false;
        drawnItems.clearLayers();
    });

    return true;
}
function clearSelection(map) {
    if (geojson != null) {
        if (map.hasLayer(geojson)) {
            map.removeLayer(geojson);
        }
    }
}
function disableDraw() {
    if (poly) {
        poly.disable();
    }
    
}
function TimeOfYearChange(map) {
    var timeofyear = document.getElementById("timeofyear");

    //val needs to be a global variable
    var val = timeofyear.value;

    SelectAOIComplete(map);

    return true;
}
function buildSlider(info) {
    var varscount = info.Variables.length;
    var colcount = 0;
    var grd, gcol, rangewrap, variablecontrol, variableranges;
    var varscontainer = document.getElementById("variables");
    for (i = 0; i < varscount; i++) {
        if (colcount == 0) {
            grd = document.createElement("div")
            grd.className += "grid";
            varscontainer.appendChild(grd);
        }
        if (colcount < 3) {
            var chkbox = buildLabel(info.Variables[i]);
            var infobutton = buildInfoButton(info.Variables[i]);
            var header = buildCheckBoxQuestionContainer(chkbox, infobutton);
            gcol = document.createElement("div");
            gcol.className += "gcol";
            gcol.style.width = "33%";
            rangewrap = document.createElement("div");
            rangewrap.className += "range-wrap";

            if (info.Variables[i].ControlType == "Slider") {
                variablecontrol = document.createElement("div");
                variablecontrol.id = "slider" + i;
                variableranges = buildVariableRanges(i);
                noUiSlider.create(variablecontrol, {
                    start: [4, 7],
                    connect: true,
                    range: {
                        'min': 0,
                        'max': 10
                    }
                });
                variablecontrol.setAttribute("disabled", true);
                
            }
            else {
                variableranges = document.createElement("div");
                variablecontrol = document.createElement("select");
                for (b = 0; b < info.Variables[i].Values.length; b++) {
                    var opt = document.createElement("option");
                    opt.value = info.Variables[i].Values[b];
                    opt.text = info.Variables[i].Values[b];
                    variablecontrol.appendChild(opt);
                }
            }
            
            rangewrap.appendChild(header);
            rangewrap.appendChild(variablecontrol);
            rangewrap.appendChild(variableranges);
            gcol.appendChild(rangewrap);
            
            gcol.disabled = true;
            var nodes = gcol.getElementsByTagName("*");
            for (a = 0; a < nodes.length; a++) {
                nodes[a].disabled = true;
            }
            grd.appendChild(gcol);

            colcount++;
        }
        else {
            colcount = 0;
        }
    }
    return true;
}
function buildInfoButton(info) {
    //build info button
    var quest = document.createElement("div");
    quest.className += "range-question";
    var questmodalbutton = document.createElement("a");
    questmodalbutton.href = "#modal-text";
    questmodalbutton.className += "question";
    questmodalbutton.innerHTML = "?";
    questmodalbutton.style.pointerEvents = "none";
    questmodalbutton.style.cursor = "default";
    quest.appendChild(questmodalbutton);
    return quest;
}
function buildLabel(info) {
    var chkboxcontaner = document.createElement("div");
    chkboxcontaner.className += "range-checkbox";
    var label = document.createElement("label");
    var chkbx = document.createElement("input");
    chkbx.type = "checkbox";
    label.for = "";
    label.appendChild(chkbx);
    label.innerHTML += info.Title;
    chkboxcontaner.appendChild(label);
    return chkboxcontaner;
}
function buildCheckBoxQuestionContainer(checkbox, question) {
    var wrapper = document.createElement("div");
    wrapper.appendChild(checkbox);
    wrapper.appendChild(question);
    wrapper.className += "range-checkbox-question-wrap";
    return wrapper;
}
function buildVariableRanges(elementID) {
    var vRanges = document.createElement("div");
    vRanges.className += "grid";
    var lowlabel = document.createElement("div");
    lowlabel.className += "gcol";
    var lowP = document.createElement("p");
    lowP.className += "small muted";
    lowP.id = "lowlabel" + elementID;
    lowP.innerHTML = "Low:  0-29";
    lowlabel.appendChild(lowP);
    vRanges.appendChild(lowlabel);
    var medlabel = document.createElement("div");
    medlabel.className += "gcol";
    var medP = document.createElement("p");
    medP.className += "small muted";
    medP.id = "medlabel" + elementID;
    medP.innerHTML = "Med:  0-29";
    medlabel.appendChild(medP);
    vRanges.appendChild(medlabel);
    var hilabel = document.createElement("div");
    hilabel.className += "gcol";
    var hiP = document.createElement("p");
    hiP.className += "small muted";
    hiP.id = "hidlabel" + elementID;
    hiP.innerHTML = "High:  0-29";
    hilabel.appendChild(hiP);
    vRanges.appendChild(hilabel);
    return vRanges;
}
