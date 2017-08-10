var map;
var AppConfig;
var ocsBlocks, sandResources, poly, elayer;
var selectedOCSBlocks = null;
var drawnItems = new L.featureGroup();
var resultsLayer = new L.featureGroup();
var geojson = null;
var hasTool = 0;
var drawcontrol = null;
var test = false;

var AOIVariableValues = { variables: [], datasets: [] };


function initMap($scope) {
    AppConfig = $scope.AppConfig;
    BuildMap($scope);
    BuildLegend($scope);
    buildMetaData();
    buildModal();
    getDatasetValues();
}
function getDatasetValues() {
    ocsBlocks.query().layer(0).where("1=1").run(function (error, featureCollection, response) {
        for (a = 0; a < AppConfig.Variables.length; a++) {
            getValuesforDataset(featureCollection, AppConfig.Variables[a].FieldName, AppConfig.Variables[a].Title, AOIVariableValues.datasets, AppConfig.Variables[a].DataType, AppConfig.Variables[a].RasterLayers, AppConfig.Variables[a].FieldSuffix)
        }
        var boo = "";
    });

}
function buildModal() {
    modalTinyNoFooter = new tingle.modal({
        closeMethods: [],
        footer: true,
        stickyFooter: true
    });
    modalTinyNoFooter.addFooterBtn('Close', 'tingle-btn tingle-btn--primary tingle-btn--pull-right', function () {
        modalTinyNoFooter.close();
    });
    modalTinyNoFooter.setContent(document.querySelector(".tingle-demo-force-close").innerHTML);

}
function BuildMap($scope) {
    if (!test) {
        $scope.map = L.map("left-pane", { attributionControl: false }).setView([39, -97.5], 4);
        map = $scope.map;
        //Add basemap
        $scope.baseMap = L.esri.basemapLayer(AppConfig.BaseMap).addTo($scope.map);
        //var layers = [];
        //for (a = 0; a < 102; a++) {
        //    layers.push(a);
        //}
        //Add dynamic layers
        $scope.map.createPane("seaturtledst");
        $scope.seaTurtleDST = L.esri.dynamicMapLayer({ url: AppConfig.MapLayers[3].url, layers: [-1], pane: 'seaturtledst' }).addTo($scope.map);
        seaTurtleDST = $scope.seaTurtleDST;
        $scope.map.createPane("sandresources");
        $scope.sandResources = L.esri.dynamicMapLayer({ url: AppConfig.MapLayers[1].url, layers: [AppConfig.MapLayers[1].layers], pane: 'sandresources' }).addTo($scope.map);
        sandResources = $scope.sandResources;
        $scope.map.createPane("ocsblocks");
        $scope.ocsBlocks = L.esri.dynamicMapLayer({ url: AppConfig.MapLayers[0].url, layers: [AppConfig.MapLayers[0].layers], pane: 'ocsblocks' }).addTo($scope.map);
        ocsBlocks = $scope.ocsBlocks;
        //$scope.map.createPane("killshoal");
        //killShoal = L.esri.dynamicMapLayer({ url: "http://dev-public.quantumspatial.com:6080/arcgis/rest/services/SeaTurtle/SeaTurtleDST_devData/MapServer", layers: ["0"], pane: 'killshoal' }).addTo($scope.map);

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
function BuildLegend() {
    var opts = {
        listTemplate: '<ul>{layers}</ul>',
        layerTemplate: '<li><strong>{layerName}</strong><ul>{legends}</ul></li>',
        listRowTemplate: '<li><img width="{width}" height="{height}" src="data:{contentType};base64,{imageData}"><span>{label}</span></li>',
        emptyLabel: '<all values>',
        container: null
    };

    //bind layers to legend control
    legend = L.esri.legendControl(ocsBlocks, opts).addTo(map);
    //L.esri.legendControl($scope.sandResources, opts).addTo($scope.map);
    L.esri.legendControl(seaTurtleDST, opts).addTo(map);

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
    ocsBlocks.query().layer(0).intersects(polygon).run(function (error, featureCollection, response) {
        //ocsBlocks.query().layer(0).intersects(polygon).run(function (error, featureCollection, response) {

        selectedOCSBlocks = featureCollection;

        for (a = 0; a < AppConfig.Variables.length; a++) {

            var vals = [];
            if (AppConfig.Variables[a].DataType == "Raster" && AppConfig.Variables[a].RasterLayers == 12) {
                for (t = 1; t < (AppConfig.Variables[a].RasterLayers + 1) ; t++) {
                    for (b = 0; b < featureCollection.features.length; b++) {
                        vals.push(featureCollection.features[b].properties[AppConfig.Variables[a].FieldSuffix + t.toString()]);
                    }
                }
            }
            else {
                for (b = 0; b < featureCollection.features.length; b++) {
                    vals.push(featureCollection.features[b].properties[AppConfig.Variables[a].FieldName]);
                }
            }
            //vals = vals.sort();
            vals = vals.filter(function (element) {
                return element != null;
            });
            vals = vals.sort(function (a, b) { return a - b; });

            var startmed = null;
            var endmed = null;

            if (vals[0] != "undefined" | vals[0] != null) {
                if (vals[(vals.length - 1)] != "undefined" | vals[(vals.length - 1)] != null) {
                    if (vals[0] != vals[(vals.length - 1)]) {
                        var diffval = vals[(vals.length - 1)] - vals[0];
                        var fourthsval = (diffval / 4);
                        startmed = vals[0] + fourthsval;
                        endmed = vals[0] + fourthsval + fourthsval;
                    }

                }
            }

            var MinMaxValues = {
                variableName: AppConfig.Variables[a].FieldName,
                min: vals[0],
                startmed: startmed,
                endmed: endmed,
                max: vals[(vals.length - 1)],
                title: AppConfig.Variables[a].Title
            };
            AOIVariableValues.variables.push(MinMaxValues);
            var foo = "";
        }

        clearSelection(map);

        geojson = L.geoJSON(featureCollection, { pane: "selectedblocks" }).addTo(map);


        var selectocsblocksbutton = document.getElementById("selectocsblocks");
        selectocsblocksbutton.innerHTML = "Redraw AOI";
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
    timeofyearValue = timeofyear.value;
    resetSlider();
    disableButton();
    SelectAOIComplete(map);

    return true;
}
var sliders = [];
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
            var chkbox = buildLabel(info.Variables[i], i);
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
                variablecontrol.id = "variable_" + i;
                variablecontrol.title = info.Variables[i].Title;
                variableranges = buildVariableRanges(i);
                noUiSlider.create(variablecontrol, {
                    start: [4, 7],
                    range: {
                        'min': 0,
                        'max': 10
                    }
                });
                //sliders.push(variablecontrol);
                var foo = "";

            }
            else {
                variableranges = document.createElement("div");
                variablecontrol = document.createElement("select");
                variablecontrol.id = "variable_" + i;
                variablecontrol.className += "var";
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
    var variablecontrol = document.getElementById("variable_" + pos);


    var ele = variablecontrol.getElementsByTagName("*");


    variablecontrol.disable = enable;
    var gcol = document.getElementById("gcol" + pos);
    gcol.disabled = enable;

    var nodes = gcol.getElementsByTagName("*");

    for (a = 0; a < nodes.length; a++) {
        if (!enable) {
            //if (nodes[a].hasAttribute("disabled")) {
            //    nodes[a].removeAttribute("disabled");
            //}
            if (nodes[a].className == "question") {
                //nodes[a].style.pointerEvents = "auto";
                //nodes[a].style.cursor = "pointer";
            }
            if (nodes[a].tagName == "LABEL") {
                nodes[a].className -= "disabled";
                nodes[a].className += " selectedVariable";
            }
            nodes[a].removeAttribute("disabled");
            nodes[a].disabled = false;
            if (nodes[a].type == "checkbox") {
                nodes[a].removeAttribute("readOnly");
                //nodes[a].setAttribute("readonly", false);
                //nodes[a].readonly = false;
                //nodes[a].removeAttribute("disabled");
                nodes[a].disabled = false;
                var foo = "";
            }
        } else {

            //nodes[a].setAttribute("disabled", true);

            if (nodes[a].type == "checkbox") {
                nodes[a].setAttribute("readonly", true);
            }
        }

        var foo = "";
    }
    variablecontrol.setAttribute("disabled", true);
}
function resetSlider() {
    var varscount = AppConfig.Variables.length;
    var varscontainer = document.getElementById("variables");

    for (i = 0; i < varscount; i++) {
        var variablecontrol = document.getElementById("variable_" + i);
        if (variablecontrol != null) {
            variablecontrol.setAttribute("disabled", true);
        }

        var gcol = document.getElementById("gcol" + i);
        if (gcol != null) {
            gcol.disabled = true;
            var nodes = gcol.getElementsByTagName("*");
            for (a = 0; a < nodes.length; a++) {
                nodes[a].disabled = true;
                if (nodes[a].type == "checkbox") {
                    //nodes[a].setAttribute("readonly", true);
                    nodes[a].checked = false;
                }
                if (nodes[a].tagName == "LABEL") {
                    if (nodes[a].className != "disabled") {
                        nodes[a].className = "";
                        nodes[a].className += "disabled";
                        //nodes[a].className -= " selectedVariable";
                    }
                }
                if (nodes[a].className == "noUi-target noUi-ltr noUi-horizontal") {
                    var thisSlider = nodes[a];
                    var theObjects = thisSlider.noUiSlider;
                    var foo = "";
                    var sliders = thisSlider.getElementsByClassName("noUi-tooltip");
                    for (g = 0; g < sliders.length; g++) {
                        sliders[g].style.display = "none";
                    }
                }
                if (nodes[a].tagName == "SELECT") {
                    nodes[a].selectedIndex = 0;
                }
            }

        }

    }

    $("div.nicEdit-main").text("");
    $('#AnalyzeData').attr('disabled', true);
    $('#AnalyzeData').addClass('disabled');

    var layerIDs = [];
    layerIDs.push(-1);
    seaTurtleDST.setLayers(layerIDs);
    seaTurtleDST.redraw();
    return true;
}
function setSliders() {
    var blocks = selectedOCSBlocks.features;
    var varscount = AppConfig.Variables.length;
    //var varscontainer = document.getElementById("variables");
    if (document.getElementById("timeofyear").value == "Months") {
        for (b = 0; b < blocks.length; b++) {
            for (var props in blocks[b].properties) {
                for (i = 0; i < varscount; i++) {
                    if(AppConfig.Variables[i].SeasonOnly != true) {
                        if (AppConfig.Variables[i].FieldName == props) {
                            if (blocks[b].properties[props] != null) {
                                if (AppConfig.Variables[i].ControlType == "Slider") {
                                    enableSingleVariable(AppConfig.Variables[i].Title, i, false);
                                }
                                else {
                                    intersectEnvelope(geojson, i);
                                }
                            }
                            break;
                        }
                    }
                }
            }
        }
    }
    else {
        for (b = 0; b < blocks.length; b++) {
            for (var props in blocks[b].properties) {
                for (i = 0; i < varscount; i++) {
                    if (AppConfig.Variables[i].FieldName == props) {
                        if (blocks[b].properties[props] != null) {
                            if (AppConfig.Variables[i].ControlType == "Slider") {
                                enableSingleVariable(AppConfig.Variables[i].Title, i, false);
                            }
                            else {
                                intersectEnvelope(geojson, i);
                            }
                        }
                        break;
                    }
                }
            }
        }
    }
    //            && 
    

    return true;
}
function buildInfoButton(info) {
    //build info button
    var quest = document.createElement("div");
    quest.className += "range-question";
    quest.tabIndex = 0;
    quest.title = info.Title;

    quest.addEventListener("click", function () {
        var par = this.parentElement;
        var par2 = par.children;
        var quest = par2[0];
        var title = quest.innerText;
        buildModalContent(title.trim());
        modalTinyNoFooter.open();

    });
    quest.addEventListener("keyup", function (event) {
        event.preventDefault();
        if (event.keyCode == 13) {
            var par = this.parentElement;
            var par2 = par.children;
            var quest = par2[0];
            var title = quest.innerText;
            buildModalContent(title.trim());
            modalTinyNoFooter.open();
        }
    });
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
function buildLabel(info, pos) {
    var chkboxcontaner = document.createElement("div");
    chkboxcontaner.className += "range-checkbox";
    var label = document.createElement("label");
    label.className += "disabled";
    var chkbx = document.createElement("input");
    chkbx.type = "checkbox";
    chkbx.alt = info.Title;
    chkbx.title = info.Title;
    var thismap = map

    label.for = "";
    label.appendChild(chkbx);
    label.innerHTML += info.Title;
    label.addEventListener("click", function (e) {
        //var variablecontrol = document.getElementById("variable" + pos);
        var p1 = this.parentElement;
        var p2 = p1.parentElement;
        var p3 = p2.parentElement;
        var p4 = p3.parentElement;
        var vars = p4.getElementsByClassName("noUi-target");
        var vr = p4.getElementsByClassName("var");
        var thisSlider = vars[0];


        var title = p1.innerText.trim();


        if (vars.length == 0) {
            vars = p4.getElementsByClassName("var");
        }
        var variablecontrol = vars[0];
        var foo = "";
        var chld = this.childNodes[0];
        if (chld.type == "checkbox") {
            if (chld.checked == true) {
                buildModalContent(title);
                modalTinyNoFooter.open();
                if (typeof thisSlider != "undefined") {
                    var lowLabel = p4.childNodes[0].childNodes[2].childNodes[0].childNodes[0];
                    var medLabel = p4.childNodes[0].childNodes[2].childNodes[1].childNodes[0];
                    var highLabel = p4.childNodes[0].childNodes[2].childNodes[2].childNodes[0];

                    for (g = 0; g < AOIVariableValues.variables.length; g++) {
                        if (title == AOIVariableValues.variables[g].title) {
                            if (AOIVariableValues.variables[g].min != null) {
                                if (AOIVariableValues.variables[g].min == AOIVariableValues.variables[g].max) {
                                    var id = thisSlider.id;
                                    var indexOfUnder = id.indexOf("_");
                                    var locIndex = id.substr((indexOfUnder + 1), id.length);
                                    var parent = thisSlider.parentElement;
                                    thisSlider.noUiSlider.destroy();
                                    parent.removeChild(thisSlider);
                                    labelChild = parent.childNodes[1];
                                    parent.removeChild(labelChild);
                                    variableranges = document.createElement("div");
                                    variablecontrol = document.createElement("select");
                                    variablecontrol.id = "variable_" + locIndex;
                                    variablecontrol.className += "var";
                                    variablecontrol.title = AppConfig.Variables[parseInt(locIndex)].Title;
                                    AppConfig.Variables[parseInt(locIndex)].ControlType = "Dropdown";
                                    var opt = document.createElement("option");
                                    opt.value = "Presence";
                                    opt.text = "Presence";
                                    variablecontrol.appendChild(opt);

                                    var opt = document.createElement("option");
                                    opt.value = "Low";
                                    opt.text = "Low";
                                    variablecontrol.appendChild(opt);

                                    var opt = document.createElement("option");
                                    opt.value = "Medium";
                                    opt.text = "Medium";
                                    variablecontrol.appendChild(opt);

                                    var opt = document.createElement("option");
                                    opt.value = "High";
                                    opt.text = "High";
                                    variablecontrol.appendChild(opt);

                                    parent.appendChild(variablecontrol);

                                } else {
                                    if (AOIVariableValues.variables[g].startmed != null) {
                                        var opts = thisSlider.noUiSlider.options;

                                        if (opts.start[0] == 4 && opts.start[1] == 7) {
                                            thisSlider.noUiSlider.destroy();
                                            var min = getDecimalPlaces(AOIVariableValues.variables[g].min);
                                            var numbre = round(AOIVariableValues.variables[g].min, 3);
                                            noUiSlider.create(thisSlider, {
                                                start: [AOIVariableValues.variables[g].startmed, AOIVariableValues.variables[g].endmed],
                                                tooltips: true,
                                                format: {
                                                    from: function (value) {
                                                        return round(value, 3);
                                                    },
                                                    to: function (value) {
                                                        return round(value, 3);
                                                    }
                                                },
                                                range: {
                                                    'min': round(AOIVariableValues.variables[g].min, 3),
                                                    'max': round(AOIVariableValues.variables[g].max, 3)
                                                }
                                            });

                                            lowLabel.innerHTML = "Low: " + round(AOIVariableValues.variables[g].min, 3) + "-" + round((AOIVariableValues.variables[g].startmed - .0001), 3);
                                            medLabel.innerHTML = "Med: " + round(AOIVariableValues.variables[g].startmed, 3) + "-" + round(AOIVariableValues.variables[g].endmed, 3);
                                            highLabel.innerHTML = "High: " + round((AOIVariableValues.variables[g].startmed + .0001), 3) + "-" + round(AOIVariableValues.variables[g].max, 3);
                                            thisSlider.noUiSlider.on('slide', function (values, handle) {
                                                if (handle == 0) {
                                                    var lowContent = lowLabel.innerHTML;
                                                    lowLabel.innerHTML = "";
                                                    lowLabel.innerHTML = lowContent.substring(0, (lowContent.indexOf("-"))) + "-" + round(values[0], 3);
                                                    var medContent = medLabel.innerHTML;
                                                    medLabel.innerHTML = "";
                                                    medLabel.innerHTML = "Med: " + round(values[0], 3) + "-" + medContent.substring((medContent.indexOf("-") + 1), medContent.length);
                                                }
                                                if (handle == 1) {
                                                    var medContent = medLabel.innerHTML;
                                                    medLabel.innerHTML = "";
                                                    medLabel.innerHTML = medContent.substring(0, (medContent.indexOf("-"))) + "-" + round(values[1], 3);
                                                    var highContent = highLabel.innerHTML;
                                                    highLabel.innerHTML = "";
                                                    highLabel.innerHTML = "High: " + round(values[1], 3) + "-" + highContent.substring((highContent.indexOf("-") + 1), highContent.length);
                                                    var foo = "";
                                                }

                                                //highLabel.innerHTML = "High: " + (AOIVariableValues.variables[g].startmed + .0001) + "-" + AOIVariableValues.variables[g].max;
                                                var foo = "";
                                            });
                                        }
                                        else {
                                            var sliders = thisSlider.getElementsByClassName("noUi-tooltip");
                                            for (f = 0; f < sliders.length; f++) {
                                                sliders[f].style.display = "";
                                            }
                                        }
                                    }

                                    else {
                                        thisSlider.noUiSlider.destroy();
                                        noUiSlider.create(thisSlider, {
                                            start: [4, 7],
                                            tooltips: [true, true],
                                            range: {
                                                'min': 0,
                                                'max': 10
                                            }
                                        });
                                    }
                                }

                            }
                            else {
                                thisSlider.noUiSlider.destroy();
                                noUiSlider.create(thisSlider, {
                                    start: [4, 7],
                                    tooltips: [true, true],
                                    range: {
                                        'min': 0,
                                        'max': 10
                                    }
                                });
                            }

                        }
                    }
                }
                else {
                    vr[0].disabled = false;
                }



                var layerIDs = seaTurtleDST.getLayers();
                var neg = layerIDs.indexOf(-1);

                if (neg == 0) {
                    layerIDs.splice(neg, 1);
                }

                layerIDs.push(info.LayerID);
                seaTurtleDST.setLayers(layerIDs);
                seaTurtleDST.redraw();
                variablecontrol.removeAttribute("disabled");
            }
            else {
                //thisSlider.noUiSlider.destroy();
                //noUiSlider.create(thisSlider, {
                //    start: [4, 7],
                //    range: {
                //        'min': 0,
                //        'max': 10
                //    }
                //});
                var layerIDs = seaTurtleDST.getLayers();
                var pos = layerIDs.indexOf(info.LayerID);
                if (pos != -1) {
                    layerIDs.splice(pos, 1);
                }
                var layerIDsLength = layerIDs.length;
                if (layerIDsLength == 0) {
                    layerIDs.push(-1);
                }
                seaTurtleDST.setLayers(layerIDs);
                seaTurtleDST.redraw();
                if (typeof (thisSlider) != "undefined") {
                    var sliders = thisSlider.getElementsByClassName("noUi-tooltip");
                    for (g = 0; g < sliders.length; g++) {
                        sliders[g].style.display = "none";
                    }
                }

                variablecontrol.setAttribute("disabled", true);
            }
        }

    }, false);
    chkboxcontaner.appendChild(label);

    return chkboxcontaner;
}
function getDecimalPlaces(value) {
    if (Math.floor(value) === value) return 0;
    return value.toString().split(".")[1].length || 0;
}
function round(value, exp) {
    if (typeof exp === 'undefined' || +exp === 0)
        return Math.round(value);

    value = +value;
    exp = +exp;

    if (isNaN(value) || !(typeof exp === 'number' && exp % 1 === 0))
        return NaN;

    // Shift
    value = value.toString().split('e');
    value = Math.round(+(value[0] + 'e' + (value[1] ? (+value[1] + exp) : exp)));

    // Shift back
    value = value.toString().split('e');
    return +(value[0] + 'e' + (value[1] ? (+value[1] - exp) : -exp));
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
                break;
            }
        }
    }
}
function buildModalContent(title) {
    for (zz = 0; zz < AppConfig.Variables.length; zz++) {
        if (AppConfig.Variables[zz].Title == title.trim()) {
            var modalTitle = document.getElementById("ModalTitle");
            modalTitle.innerHTML = "";
            var modalDataRange = document.getElementById("ModalDataRange");
            modalDataRange.innerHTML = "";
            var modalHeaderContent = document.getElementById("ModalHeaderContent");
            modalHeaderContent.innerHTML = "";
            var modalBulletsContent = document.getElementById("ModalBulletsContent");
            modalBulletsContent.innerHTML = "";
            var modalLinksContent = document.getElementById("ModalLinksContent");
            modalLinksContent.innerHTML = "";

            modalTitle.innerHTML = AppConfig.Variables[zz].Title;
            modalTitle.title = AppConfig.Variables[zz].Title;
            modalTitle.setAttribute("alt", AppConfig.Variables[zz].Title);
            modalTitle.alt = AppConfig.Variables[zz].Title;

            modalHeaderContent.innerHTML = AppConfig.Variables[zz].HelpContent;
            if (AppConfig.Variables[zz].ControlType == "Slider") {
                for (a = 0; a < AOIVariableValues.datasets.length; a++) {
                    if (AOIVariableValues.datasets[a].title == title) {
                        if (AOIVariableValues.datasets[a].min != AOIVariableValues.datasets[a].max) {
                            if (AOIVariableValues.datasets[a].min != null || typeof (AOIVariableValues.datasets[a].min) != "undefined") {
                                modalDataRange.innerHTML = "Dataset value range: " + round(AOIVariableValues.datasets[a].min, 3) + " to " + round(AOIVariableValues.datasets[a].max, 3);
                            }
                            else {
                                modalDataRange.innerHTML = "There are no values in the system for this variable";
                            }
                        }
                    }
                }
            }




            var ahref = document.createElement("a");
            ahref.href = AppConfig.Variables[zz].SourceLink;
            ahref.text = AppConfig.Variables[zz].SourceTitle;
            ahref.target = "_blank";
            modalLinksContent.appendChild(ahref);

            for (yy = 0; yy < AppConfig.Variables[zz].HelpInstructions.length; yy++) {
                var li = document.createElement("li");
                li.innerHTML = AppConfig.Variables[zz].HelpInstructions[yy];
                modalBulletsContent.appendChild(li);
            }


        }
    }
}
function getValuesforDataset(featureCollection, fieldName, title, targetArray, dataType, rasterLayers, fieldSuffix) {
    var vals = [];

    if (dataType == "Raster" && rasterLayers == 12) {
        for (t = 1; t < (rasterLayers + 1) ; t++) {
            for (b = 0; b < featureCollection.features.length; b++) {
                vals.push(featureCollection.features[b].properties[fieldSuffix + t.toString()]);
            }
        }
    }
    else {
        for (b = 0; b < featureCollection.features.length; b++) {
            vals.push(featureCollection.features[b].properties[fieldName]);
        }
    }


    //vals = vals.sort();
    vals = vals.filter(function (element) {
        return element != null;
    });
    vals = vals.sort(function (a, b) { return a - b; });
    var startmed = null;
    var endmed = null;

    if (vals[0] != "undefined" | vals[0] != null) {
        if (vals[(vals.length - 1)] != "undefined" || vals[(vals.length - 1)] != null) {
            if (vals[0] != vals[(vals.length - 1)]) {
                var diffval = vals[(vals.length - 1)] - vals[0];
                var fourthsval = (diffval / 4);
                startmed = vals[0] + fourthsval;
                endmed = vals[0] + fourthsval + fourthsval;
            }

        }
    }
    var MinMaxValues = {
        variableName: fieldName,
        min: vals[0],
        startmed: startmed,
        endmed: endmed,
        max: vals[(vals.length - 1)],
        title: title
    };

    targetArray.push(MinMaxValues);
}