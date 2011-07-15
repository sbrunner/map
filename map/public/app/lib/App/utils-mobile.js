/**
 * Copyright (c) 2010-2011 The Open Source Geospatial Foundation
 * 
 * Published under the BSD license.
 * See http://svn.geoext.org/core/trunk/geoext/license.txt for the full text
 * of the license.
 */


var epsg900913 = new OpenLayers.Projection("EPSG:900913");
var epsg4326 = new OpenLayers.Projection("EPSG:4326");

function addLayer(options) {
    Ext.applyIf(options, {
        sphericalMercator: true,
        wrapDateLine: true,
        isBaseLayer: false,
        transitionEffect: "resize"
    });
    delete options.id;
    return new OpenLayers.Layer.XYZ(options.text, options.url, options);
}
function addCloudmadeLayer(options) {
    Ext.applyIf(options, {
        sphericalMercator: true,
        isBaseLayer: false,
        transitionEffect: "resize"
    });
    delete options.id;
    return new OpenLayers.Layer.CloudMade(options.text, options);
}
function addWmsLayer(options) {
    Ext.applyIf(options, {
        wrapDateLine: true,
        isBaseLayer: false,
        transitionEffect: "resize"
    });
    delete options.id;
    var wmsOptions = options.wmsOptions ? options.wmsOptions : {layers: options.layers};
    return new OpenLayers.Layer.WMS(options.text, options.url, wmsOptions, options);
}
function addXapiStyleLayer(options) {
    var name = options.text;
    var styleMap = null;
    if (options.style) {
        styleMap = options.style();
    }
    var ref = options.ref;
    var element = options.element;
    var predicate = options.predicate;

    var format = new OpenLayers.Format.OSM({
        checkTags: true,
        externalProjection: epsg4326,
        relationsParsers: {
            multipolygon: OpenLayers.Format.OSM.multipolygonParser,
            boundary:     OpenLayers.Format.OSM.multipolygonParser,
            route:        OpenLayers.Format.OSM.routeParser
        }
    });
    var protocol;
    var strategies = null;
    if (OpenLayers.OSM_URL) {
        protocol = new OpenLayers.Protocol.HTTP({
            url: OpenLayers.OSM_URL,
            format: format
        });
        strategies = [ new OpenLayers.Strategy.Fixed({ preload: false }) ];
    }
    else {
        protocol = new OpenLayers.Protocol.XAPI({
            element: element,
            predicate: predicate,
            format: format
        });
        strategies = [ new OpenLayers.Strategy.BBOX({ ratio: 1.6 }) ];
    }

    layer = new OpenLayers.Layer.Vector(name, {
        ref: ref,
        projection: epsg4326,
        strategies: strategies, 
        protocol: protocol,
        styleMap: styleMap,
        numZoomLevels: 22,
        wrapDateLine: true,
        attribution: "Data CC-By-SA by <a href='http://openstreetmap.org/'>OpenStreetMap</a>"
    });
    return layer;
}
function addOsmStyleLayer(options) {
    var name = options.text;
    var styleMap = null;
    if (options.style) {
        styleMap = options.style();
    }
    var ref = options.ref;

    var url = "http://api.openstreetmap.org/api/0.6/map?";
    var strategies = [];
    if (OpenLayers.OSM_URL) {
        url = OpenLayers.OSM_URL;
        strategies = [ new OpenLayers.Strategy.Fixed({ preload: false }) ];
    }
    else {
        strategies = [ new OpenLayers.Strategy.BBOX({ ratio: 1.2 }) ];
    }
    layer = new OpenLayers.Layer.Vector(name, {
        ref: ref,
        projection: epsg4326,
        maxResolution: 1.5,
        strategies: strategies,
        protocol: new OpenLayers.Protocol.HTTP({
            url: url,
            format: new OpenLayers.Format.OSM({
                checkTags: true,
                externalProjection: epsg4326,
                relationsParsers: {
                    multipolygon: OpenLayers.Format.OSM.multipolygonParser,
                    boundary:     OpenLayers.Format.OSM.multipolygonParser,
                    route:        OpenLayers.Format.OSM.routeParser
                }
            })
        }),
        styleMap: styleMap,
        numZoomLevels: 22,
        attribution: "Data CC-By-SA by <a href='http://openstreetmap.org/'>OpenStreetMap</a>"
    });
    return layer;
}

function contains(array, needle) {
   for (var i in array) {
       if (array[i] == needle) {
           return true;
       }
   }
   return false;
}

function toTitleCase(toTransform) {
  return toTransform.replace(/\b([a-z])/g, function (_, initial) {
      return initial.toUpperCase();
  });
}

