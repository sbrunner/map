/**
 * @requires commonstyle.js
 * @requires utils.js
 * 
 * @requires OpenLayers/Util.js
 * @requires OpenLayers/Lang.js
 * @requires OpenLayers/Map.js
 * @requires OpenLayers/Control/SelectFeature.js
 * @requires OpenLayers/Control/ZoomPanel.js
 * @requires OpenLayers/Control/PanZoom.js
 * @requires OpenLayers/Control/MousePosition.js
 * @requires OpenLayers/Control/KeyboardDefaults.js
 * @requires OpenLayers/Control/Attribution.js
 * @requires OpenLayers/Control/ScaleLine.js
 * @requires OpenLayers/Control/ArgParser.js
 * @requires OpenLayers/Strategy/Fixed.js
 * @requires OpenLayers/Protocol/HTTP.js
 * @requires OpenLayers/Format/GPX.js
 * @requires OpenLayers/Format/OSM.js
 * @requires OpenLayers/Layer/Vector.js
 * @requires OpenLayers/Layer/XYZ.js
 */


OpenLayers.IMAGE_RELOAD_ATTEMPTS = 2;
OpenLayers.Lang.defaultCode = 'fr';
OpenLayers.Lang.setCode('fr');

function init() {
    
    var map = new OpenLayers.Map({
        div: 'map',
        projection: epsg900913,
        displayProjection: epsg4326,
        units: "m",
        theme: null,
        numZoomLevels: 18,
        maxResolution: 156543.0339,
        maxExtent: new OpenLayers.Bounds(-20037508, -20037508, 20037508, 20037508.34)
    });

    map.addControl(new OpenLayers.Control.ZoomPanel());
    map.addControl(new OpenLayers.Control.MousePosition());
    map.addControl(new OpenLayers.Control.KeyboardDefaults());
    map.addControl(new OpenLayers.Control.Attribution());
    map.addControl(new OpenLayers.Control.ScaleLine({geodesic: true, maxWidth: 120}));

    map.addLayer(new OpenLayers.Layer.XYZ(OpenLayers.i18n("Mapnik"), "http://c.tile.openstreetmap.org/${z}/${x}/${y}.png", { numZoomLevels: 18, attribution: "<a href='http://www.osm.org/'>CC by-sa - OSM</a>", id: "mk" }));
    map.addLayer(new OpenLayers.Layer.XYZ(OpenLayers.i18n("Contours"), "http://map.stephane-brunner.ch/contours/${z}/${x}/${y}.png", 
            { numZoomLevels: 18, buffer: 1, isBaseLayer: false, attribution: "Data by <a href='ftp://e0srp01u.ecs.nasa.gov/srtm/version2/SRTM3/'>NASA</a>, <a href='http://asterweb.jpl.nasa.gov/gdem.asp'>ASTER</a>", id: "cont" }));

    var parameters = OpenLayers.Util.getParameters(window.location.href);
    var urlBase = 'http://www.lamargelle.ch/map/';
    if (parameters['base']) {
        urlBase = parameters['base'];
    }
    var gpx = parameters['gpx'];
    var osm = parameters['osm'];
    var styleMap = new OpenLayers.StyleMap({
        strokeColor: 'orange',
        strokeWidth: 5,
        strokeOpacity: 0.7, 
        fillColor: 'yellow',
        pointRadius: 12, 
        fillOpacity: 0.5
    });
    var layer;
    if (gpx) {
        var format = new OpenLayers.Format.GPX({
        });
        protocol = new OpenLayers.Protocol.HTTP({
            url: urlBase + gpx + ".gpx",
            format: format
        });
        strategies = [ new OpenLayers.Strategy.Fixed({ preload: true }) ]
        layer = new OpenLayers.Layer.Vector('gpx', {
            projection: epsg4326,
            strategies: strategies, 
            protocol: protocol,
            styleMap: styleMap,
        });
    }
    else if (osm) {
        var format = new OpenLayers.Format.OSM({ 
            checkTags: true,
            externalProjection: epsg4326
        });
        protocol = new OpenLayers.Protocol.HTTP({
            url: urlBase + osm + '.osm',
            format: format
        });
        strategies = [ new OpenLayers.Strategy.Fixed({ preload: true }) ]
        layer = new OpenLayers.Layer.Vector('course', {
            projection: epsg4326,
            strategies: strategies, 
            protocol: protocol,
            styleMap: styleMap,
        });
    }
    map.addLayer(layer);
    
    layer.events.register('featuresadded', null, function() {
        var bounds = new OpenLayers.Bounds();
        for (var i = 0 ; i < layer.features.length ; i++) {
            bounds.extend(layer.features[i].geometry.getBounds());
        }
        map.zoomToExtent(bounds);
    });
}
