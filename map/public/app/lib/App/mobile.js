/*
 * @requires OpenLayers/Projection.js
 * @include OpenLayers/Layer/SphericalMercator.js
 * @include OpenLayers/Layer/Vector.js
 * @include OpenLayers/Layer/XYZ.js
 * @include OpenLayers/Control/Geolocate.js
 * @include OpenLayers/Control/Attribution.js
 * @include OpenLayers/Control/Permalink.js
 * @include OpenLayers/Control/TouchNavigation.js
 * @include OpenLayers/Control/KeyboardDefaults.js
 * @include OpenLayers/Control/ScaleLine.js
 * @include OpenLayers/Kinetic.js
 * @include LayerCatalogue/lib/CatalogueModel.js
 * @include App/layers.js
 */

var code = (OpenLayers.Util.getBrowserName() == "msie") ? navigator.userLanguage : navigator.language;
var lang = code.substring(0, 2);
if (!contains(['en', 'fr'], lang)) {
    lang = "en";
}
document.write("<script type=\"text/javascript\" src=\"build/" + lang + "-m.js\"></script>");
document.write('<meta HTTP-EQUIV="Content-Language" CONTENT="' + lang + '" />');
delete code;

// initialize map when page ready
var map;
var gg = new OpenLayers.Projection("EPSG:4326");
var sm = new OpenLayers.Projection("EPSG:900913");

var initialysed = false;

var init = function () {
    if (initialysed) {
        return;
    }
    else {
        initialysed = true;
    }
    
    if (!OpenLayers.Lang[lang]) {
        OpenLayers.Lang[lang] = OpenLayers.Util.applyDefaults({});
    }
    OpenLayers.Lang.setCode(lang);
    delete lang;

/*    OpenLayers.Util.getElement("search-btn").inner_html = OpenLayers.i18n("Search");
    OpenLayers.Util.getElement("locate").inner_html = OpenLayers.i18n("Locate");
    OpenLayers.Util.getElement("layers-btn").inner_html = OpenLayers.i18n("Layers");*/
    OpenLayers.Util.getElement("search-title").inner_html = OpenLayers.i18n("Search");
    OpenLayers.Util.getElement("layers-title").inner_html = OpenLayers.i18n("Layers");
    OpenLayers.Util.getElement("details-title").inner_html = OpenLayers.i18n("Details");
    
    /*
     * Setting of OpenLayers global vars.
     */
    OpenLayers.Number.thousandsSeparator = ' ';
    OpenLayers.IMAGE_RELOAD_ATTEMPTS = 3;
    OpenLayers.ProxyHost = "proxy.php?url="; 

    document.title = OpenLayers.i18n("Various OSM map - mobile");

    var vector = new OpenLayers.Layer.Vector("Vector Layer", {});

    var geolocate = new OpenLayers.Control.Geolocate({
        id: 'locate-control',
        geolocationOptions: {
            enableHighAccuracy: false,
            maximumAge: 0,
            timeout: 7000
        }
    });

    var permalink = new OpenLayers.Control.Permalink({anchor: true, base: window.initial_href});
    permalink.createParams = function(center, zoom, layers) {
        center = center || this.map.getCenter();
        var params = OpenLayers.Util.getParameters(this.base);
        if (center) { 
            //zoom
            params.m_z = zoom || this.map.getZoom(); 

            //lon,lat
            var lat = center.lat;
            var lon = center.lon;
            if (this.displayProjection && this.map.getProjectionObject()) {
                var mapPosition = OpenLayers.Projection.transform(
                  { x: lon, y: lat }, 
                  this.map.getProjectionObject(), this.displayProjection);
                lon = mapPosition.x;  
                lat = mapPosition.y;  
                params.m_y = Math.round(lat*100000)/100000;
                params.m_x = Math.round(lon*100000)/100000;
            }
        }
        return params;
    };
    var argparser = new OpenLayers.Control.ArgParser();
    argparser.setMap = function(map) {
        OpenLayers.Control.prototype.setMap.apply(this, arguments);

        var args = this.getParameters(window.initial_href);
        // Be careful to set layer first, to not trigger unnecessary layer loads
        if (args.c_layers) {
            var model = new Geo.CatalogueModel({
                map: map,
                root: getLayersTree(map)
            });
            for (var i = 0, len = args.c_layers.length; i < len; i++) {
                var layer = model.getLayerNodeByRef(args.c_layers[i]);
                if (args['m_o_' + args.c_layers[i]]) {
                    layer.opacity = args['m_o_' + args.c_layers[i]];
                }
                model.addLayer(layer);
            }
        }
        else {
            map.addLayer(new OpenLayers.Layer.OSM(OpenLayers.i18n("OpenStreetMap"), null, {
                transitionEffect: 'resize', isBaseLayer: false
            }));
        }
        if (args.m_x && args.m_x) {
            this.center = new OpenLayers.LonLat(parseFloat(args.m_x),
                                                parseFloat(args.m_y));
            if (args.m_z) {
                this.zoom = parseInt(args.m_z);
            }
            this.setCenter();
        }
    },
    
    // create map
    map = new OpenLayers.Map({
        div: "map",
        theme: null,
        projection: sm,
        displayProjection: gg,
        units: "m",
        numZoomLevels: 18,
        maxResolution: 156543.0339,
        maxExtent: new OpenLayers.Bounds(
            -20037508.34, -20037508.34, 20037508.34, 20037508.34
        ),
        controls: [
            permalink, argparser,
            new OpenLayers.Control.Attribution(),
            new OpenLayers.Control.KeyboardDefaults(),
            new OpenLayers.Control.ScaleLine({geodesic: true, maxWidth: 120}),
            new OpenLayers.Control.TouchNavigation({
                dragPanOptions: {
                    interval: 100,
                    enableKinetic: true
                }
            }),
            geolocate
        ],
        layers: [
            new OpenLayers.Layer.OSM("back", "http://map.stephane-brunner.ch/white.png", {
                numZoomLevels: 20, 
                displayInLayerSwitcher: false,
                attribution: "",
                projection: sm
            }),
            vector
        ]
    });
    if (argparser.center) {
        argparser.center.transform(map.displayProjection,
                map.getProjectionObject());
        map.setCenter(argparser.center, argparser.zoom); 
    }
    else {
        map.zoomToMaxExtent();
    }

    var overlayLayers = map.getLayersBy("isBaseLayer", false);
    $.each(overlayLayers, function() {
        addLayerToList(this);
    });

    var style = {
        fillOpacity: 0.1,
        fillColor: '#000',
        strokeColor: '#f00',
        strokeOpacity: 0.6
    };
    geolocate.events.register("locationupdated", this, function(e) {
        vector.removeAllFeatures();
        vector.addFeatures([
            new OpenLayers.Feature.Vector(
                e.point,
                {},
                {
                    graphicName: 'cross',
                    strokeColor: '#f00',
                    strokeWidth: 2,
                    fillOpacity: 0,
                    pointRadius: 10
                }
            ),
            new OpenLayers.Feature.Vector(
                OpenLayers.Geometry.Polygon.createRegularPolygon(
                    new OpenLayers.Geometry.Point(e.point.x, e.point.y),
                    e.position.coords.accuracy / 2,
                    50,
                    0
                ),
                {},
                style
            )
        ]);
        map.zoomToExtent(vector.getDataExtent());
    });
};


var selectedFeature = null;

$(document).ready(function() {

    var index = window.location.href.indexOf('#');
    if (index != -1) {
        window.initial_href = window.location.href;
        window.location.href = window.location.href.substring(0, index + 1);
    }

    // fix height of content
    function fixContentHeight() {
        var footer = $("div[data-role='footer']:visible"),
        content = $("div[data-role='content']:visible:visible"),
        viewHeight = $(window).height(),
        contentHeight = viewHeight - footer.outerHeight();

        if ((content.outerHeight() + footer.outerHeight()) !== viewHeight) {
            contentHeight -= (content.outerHeight() - content.height());
            content.height(contentHeight);
        }
        if (window.map) {
            map.updateSize();
        } else {
            // initialize map
            setTimeout(init, 100);
        }
    }
    $(window).bind("orientationchange resize pageshow", fixContentHeight);
    fixContentHeight(); 

    // Map zoom  
    $("#plus").click(function(){
        map.zoomIn();
    });
    $("#minus").click(function(){
        map.zoomOut();
    });
    $("#locate").click(function(){
        var control = map.getControlsBy("id", "locate-control")[0];
        if (control.active) {
            control.getCurrentLocation();
        } else {
            control.activate();
        }
    });
    
    $('div#popup').live('pageshow',function(event, ui){
        var li = "";
        for(var attr in selectedFeature.attributes){
            li += "<li><div style='width:25%;float:left'>" + attr + "</div><div style='width:75%;float:right'>" 
            + selectedFeature.attributes[attr] + "</div></li>";
        }
        $("ul#details-list").empty().append(li).listview("refresh");
    });

    $('#searchpage').live('pageshow',function(event, ui){
        $('#query').bind('change', function(e){
            $('#search_results').empty();
            if ($('#query')[0].value === '') {
                return;
            }
            $.mobile.pageLoading();

            // Prevent form send
            e.preventDefault();

            var searchUrl = 'http://ws.geonames.org/searchJSON?featureClass=P&maxRows=10';
            searchUrl += '&name_startsWith=' + $('#query')[0].value;
            $.getJSON(searchUrl, function(data) {
                $.each(data.geonames, function() {
                    var place = this;
                    $('<li>')
                        .hide()
                        .append($('<h2 />', {
                            text: place.name
                        }))
                        .append($('<p />', {
                            html: '<b>' + place.countryName + '</b> ' + place.fcodeName
                        }))
                        .appendTo('#search_results')
                        .click(function() {
                            $.mobile.changePage('mappage');
                            var lonlat = new OpenLayers.LonLat(place.lng, place.lat);
                            map.setCenter(lonlat.transform(gg, sm), 10);
                        }).show();
                });
                $('#search_results').listview('refresh');
                $.mobile.pageLoading(true);
            });
        });
        // only listen to the first event triggered
        $('#searchpage').die('pageshow', arguments.callee);
    });

    $('#layerslist').listview();
    $('<li>', {
        "data-role": "list-divider",
        text: OpenLayers.i18n("Layers")
    }).appendTo('#layerslist');
    $('#layerslist').listview('refresh');
});

function addLayerToList(layer) {
    var item = $('<li>', {
            "data-icon": "check",
            "class": layer.visibility ? "checked" : ""
        })
        .append($('<a />', {
            text: layer.name
        })
            .click(function() {
                $.mobile.changePage('mappage');
                if (layer.isBaseLayer) {
                    layer.map.setBaseLayer(layer);
                } else {
                    layer.setVisibility(!layer.getVisibility());
                }
            })
        )
        .appendTo('#layerslist');
    layer.events.on({
        'visibilitychanged': function() {
            $(item).toggleClass('checked');
        }
    });
}
