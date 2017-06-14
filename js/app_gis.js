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
    buildMetaData();
    
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
        $scope.map.createPane("killshoal");
        killShoal = L.esri.dynamicMapLayer({ url: "http://dev-public.quantumspatial.com:6080/arcgis/rest/services/SeaTurtle/SeaTurtleDST_devData/MapServer", layers: ["0"], pane: 'killshoal' }).addTo($scope.map);

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

        $scope.sandResources = L.esri.dynamicMapLayer({ url: AppConfig.MapLayers[1].url, layers: [AppConfig.MapLayers[1].layers], }).addTo($scope.map);
        $scope.ocsBlocks = L.esri.dynamicMapLayer({ url: AppConfig.MapLayers[0].url, layers: [AppConfig.MapLayers[0].layers] }).addTo($scope.map);
    }
    return true;
}
var dropdownEntity = {
    "Title": "",
    "MapLayer": "",
    "Metadata": {},
    "ProjectedExtent": {}
}
var dropdownCount = { "Layers": [dropdownEntity] };
var buildCount = 0;
function buildMetaData() {
    for (var a = 0; a < AppConfig.Variables.length; a++) {
        if (AppConfig.Variables[a].ControlType == "Dropdown") {
            
            if (AppConfig.Variables[a].Title !== "") {
                var ddEntity = {
                    "Title": AppConfig.Variables[a].Title,
                    "MapLayer": AppConfig.Variables[a].MapLayer,
                    "Metadata": null,
                    "ProjectedExtent": null
                };
                dropdownCount.Layers.push(ddEntity);
            }
        }
    }
    var indx = -1;
    for (var b = 0; b < dropdownCount.Layers.length; b++) {
        if (dropdownCount.Layers[b].Title == "") {
            indx = b;
        }
    }
    if (b != -1) {
        dropdownCount.Layers.splice(indx, 1);
    }
    getMetaData();
}
function getMetaData() {
    if (buildCount < dropdownCount.Layers.length) {
        if (dropdownCount.Layers[buildCount].Title != "") {
            var lyr = L.esri.dynamicMapLayer({ url: dropdownCount.Layers[buildCount].MapLayer.url, layers: [dropdownCount.Layers[buildCount].MapLayer.Index] });
            lyr.metadata(function (error, metadata) {
                dropdownCount.Layers[buildCount].Metadata = metadata;
                projectMetadata(metadata);
            });
        }
    }
    
}
function projectMetadata(metadata) {
    var compjson = JSON.stringify(metadata.fullExtent);
    var projectService = L.esri.GP.service({ url: AppConfig.ProjectBoundsService, asyncInterval: 1 });
    var myprojectTask = projectService.createTask();
    myprojectTask.options.async = true;
    myprojectTask.options.path = "submitJob";
    myprojectTask.on('initialized', function () {
        myprojectTask.setParam("input", compjson);
        myprojectTask.setOutputParam("output");
        myprojectTask.run(function (error, response, raw) {
            if (response !== null) {
                dropdownCount.Layers[buildCount].ProjectedExtent = response.output;
            }
            buildCount++;
            getMetaData();
        });
    });
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
    if (timeselect) {
        timeselect.selectedIndex = 0;
    }

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
    killShoal.query().layer(0).intersects(polygon).run(function (error, featureCollection, response) {
        //ocsBlocks.query().layer(0).intersects(polygon).run(function (error, featureCollection, response) {

        selectedOCSBlocks = featureCollection;

        clearSelection(map);

        geojson = L.geoJSON(featureCollection, { pane: "selectedblocks" }).addTo(map);
        

        var selectocsblocksbutton = document.getElementById("selectocsblocks");
        selectocsblocksbutton.innerHTML = "Redraw Selection";
        selectocsblocksbutton.disabled = false;
        drawnItems.clearLayers();
        setSliders();
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
        if (colcount > 2) {
            colcount = 0;
        }
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
            gcol.id = "gcol" + i;
            rangewrap = document.createElement("div");
            rangewrap.className += "range-wrap";

            if (info.Variables[i].ControlType == "Slider") {
                variablecontrol = document.createElement("div");
                variablecontrol.id = "variable" + i;
                variablecontrol.title = info.Variables[i].Title;
                variableranges = buildVariableRanges(i);
                noUiSlider.create(variablecontrol, {
                    start: [4, 7],
                    connect: true,
                    range: {
                        'min': 0,
                        'max': 10
                    }
                });
                //variablecontrol.setAttribute("disabled", true);

            }
            else {
                variableranges = document.createElement("div");
                variablecontrol = document.createElement("select");
                variablecontrol.id = "variable" + i;
                variablecontrol.title = info.Variables[i].Title;
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

            //gcol.disabled = true;
            var nodes = gcol.getElementsByTagName("*");
            for (a = 0; a < nodes.length; a++) {
                //nodes[a].disabled = true;
            }
            grd.appendChild(gcol);

            colcount++;
        }
    }
    return true;
}
function enableSingleVariable(name, pos, enable) {
    var variablecontrol = document.getElementById("variable" + pos);
    variablecontrol.removeAttribute("disabled");

    variablecontrol.disable = enable;
    var gcol = document.getElementById("gcol" + pos);
    gcol.disabled = enable;

    var nodes = gcol.getElementsByTagName("*");

    for (a = 0; a < nodes.length; a++) {
        if (!enable) {
            if (nodes[a].hasAttribute("disabled")) {
                nodes[a].removeAttribute("disabled");
            }
            if (nodes[a].className == "question") {
                nodes[a].style.pointerEvents = "auto";
                nodes[a].style.cursor = "pointer";
            }
            nodes[a].removeAttribute("disabled");
        } else {

            nodes[a].setAttribute("disabled", true);
            if (nodes[a].className == "question") {
                nodes[a].style.pointerEvents = "";
                nodes[a].style.cursor = "default";
            }
        }

        var foo = "";
    }
}
function resetSlider() {
    var varscount = AppConfig.Variables.length;
    var varscontainer = document.getElementById("variables");

    for (i = 0; i < varscount; i++) {
        var variablecontrol = document.getElementById("variable" + i);
        variablecontrol.setAttribute("disabled", true);
        var gcol = document.getElementById("gcol" + i);
        gcol.disabled = true;
    }
    var nodes = gcol.getElementsByTagName("*");
    for (a = 0; a < nodes.length; a++) {
        nodes[a].disabled = true;
    }
    return true;
}
function setSliders() {
    var blocks = selectedOCSBlocks.features;
    var varscount = AppConfig.Variables.length;
    var varscontainer = document.getElementById("variables");
    for (b = 0; b < blocks.length; b++) {
        for (var props in blocks[b].properties) {
            for (i = 0; i < varscount; i++) {
                if (AppConfig.Variables[i].FieldName == props) {
                    if (AppConfig.Variables[i].ControlType == "Slider") {
                        if (blocks[b].properties[props] != null) {
                            enableSingleVariable(AppConfig.Variables[i].Title, i, false);
                        }
                    }
                    else {
                        intersectEnvelope(geojson, i);
                    }
                }
            }
        }
    }
    return true;
}
function buildInfoButton(info) {
    //build info button
    var quest = document.createElement("div");
    quest.className += "range-question";
    var questmodalbutton = document.createElement("a");
    //questmodalbutton.href = "#modal-text";
    questmodalbutton.title = "help";
    questmodalbutton.className += "question";
    questmodalbutton.rel = "modal:open";
    questmodalbutton.innerHTML = "?";
    questmodalbutton.style.pointerEvents = "none";
    questmodalbutton.style.cursor = "default";
    questmodalbutton.disable = true;
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
function intersectEnvelope(featureCollection, id) {
    var _rate = 0;
    var intersects = false;
    var bounds;
    featureCollection.eachLayer(function (pol) {
        bounds = pol.getBounds();
    });
    var variable = AppConfig.Variables[id];


    for (i = 0; i < dropdownCount.Layers.length; i++) {
        if (dropdownCount.Layers[i].Title == variable.Title) {
            if (bounds._northEast.lng >= dropdownCount.Layers[i].ProjectedExtent.xmin && bounds._southWest.lng <= dropdownCount.Layers[i].ProjectedExtent.xmax) {
                _rate++;
            }
            if (bounds._northEast.lat >= dropdownCount.Layers[i].ProjectedExtent.ymin && bounds._southWest.lat <= dropdownCount.Layers[i].ProjectedExtent.ymax) {
                _rate++;
            }
            if (_rate == 2) {
                enableSingleVariable(AppConfig.Variables[id].Title, id, false);
            }
        }
    }
}
