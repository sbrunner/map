/**
 * Copyright (c) 2010-2011 The Open Source Geospatial Foundation
 * 
 * Published under the BSD license.
 * See http://svn.geoext.org/core/trunk/geoext/license.txt for the full text
 * of the license.
 */
/*
 * @include Ext/src/ext-core/examples/jsonp/jsonp.js
 * @include OpenLayers/Format/GeoJSON.js
 * @include App/Map.js
 */

Ext.namespace('map');

/**
 * Note to developers: to use Ext.ux.JSONP the
 * ext/src/ext-core/examples/jsonp/jsonp.js script must be
 * loaded in the page.
 */

/**
 * Class: map.Map
 *
 * Usage example:
 * (code)
<html>
<head>
<link rel='stylesheet' type='text/css' href='build/app.css' />
<script type="text/javascript" src='build/api.js'></script>
<script type='text/javascript'>
    window.onload = function() {
        OpenLayers.ImgPath = 'lib/openlayers/img/';
        Ext.BLANK_IMAGE_URL = 'lib/ext/Ext/resources/images/default/s.gif';
        var map = new MyProject.Map({
            div: 'map',
            zoom: 10,
            easting: 500000,
            northing: 5800000,
            height: 400,
            width: 600
        });
    };
</script>
</head>
<body>
<div id='map'></div>
</body>
</html>
 * (end)
 */
map.Map = function(options) {

    // Private

    /**
     * Method: recenterCb
     * The recenter callback function.
     *
     * Parameters:
     * geojson - {String} The GeoJSON string.
     */
    var recenterCb = function(geojson) {
        var format = new OpenLayers.Format.GeoJSON();
        var feature = format.read(geojson, "Feature");
        this.mapPanel.map.zoomToExtent(feature.bounds);
    };

    // Public

    Ext.apply(this, {

        /**
         * APIProperty: mapPanel
         * {GeoExt.MapPanel} The map panel.
         */
        mapPanel: null,

        /**
         * APIMethod: recenter
         * Center the map on a specific feature.
         *
         * Parameters:
         * fid - {String} The id of the feature.
         */
        recenter: function(fid) {
            var url = 'changeme/' + fid + '.json';
            Ext.ux.JSONP.request(url, {
                callbackKey: "cb",
                params: {
                    no_geom: true
                },
                callback: recenterCb,
                scope: this
            });
        }
    });

    // Main

    var center = null;
    if (options.easting && options.northing) {
        center = new OpenLayers.LonLat(
            options.easting, options.northing
        );
        delete options.easting;
        delete options.northing;
    }

    var renderTo = options.div;
    delete options.div;

    var map = new App.Map(Ext.apply({
        renderTo: renderTo,
        center: center
    }, options));

    this.mapPanel = map.mapPanel;
};
