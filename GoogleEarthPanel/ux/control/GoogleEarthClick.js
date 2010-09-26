/**
 * Copyright (c) 2008-2009 The Open Source Geospatial Foundation
 *
 * Published under the BSD license.
 * See http://svn.geoext.org/core/trunk/geoext/license.txt for the full text
 * of the license.
 */

/** api: (define)
 *  module = GeoExt.ux
 *  class = GoogleEarthClick
 */

Ext.namespace('GeoExt.ux');

/**
 * @requires OpenLayers/Control.js
 * @include OpenLayers/Projection.js
 * @include OpenLayers/Handler.js
 * @include OpenLayers/Util.js
 */

/** api: constructor
 *  .. class:: GoogleEarthClick(options)
 *
 *      Create a click control
 *      Extends ``OpenLayers.Control``
 */
GeoExt.ux.GoogleEarthClick = OpenLayers.Class(OpenLayers.Control, {

    /** api: property[defaultHandlerOptions]
     *  Default options.
     */
    defaultHandlerOptions: {
        'single': true,
        'double': false,
        'pixelTolerance': 0,
        'stopSingle': false,
        'stopDouble': false
    },

    /** private: method[initialize]
     *  Initializes the control
     */
    initialize: function(options) {
        this.handlerOptions = OpenLayers.Util.extend({}, this.defaultHandlerOptions);
        OpenLayers.Control.prototype.initialize.apply(this, arguments);
        this.handler = new OpenLayers.Handler.Click(this, {
            'click': this.onClick,
            'dblclick': this.onDblclick},
                this.handlerOptions
                );
    },

    /** private: method[onClick]
     *  Update the Google Earth Plugin according to the clicked poistion
     */
    onClick: function(evt) {
        var lonlat = this.gePanel.map.getLonLatFromViewPortPx(evt.xy);
        lonlat.transform(this.gePanel.map.getProjectionObject(), new OpenLayers.Projection("EPSG:4326"));
        this.gePanel.setLookAt(lonlat.lat,
                lonlat.lon,
                this.gePanel.altitude,
                this.gePanel.altitudeMode,
                this.gePanel.heading,
                this.gePanel.tilt,
                this.gePanel.range);
    },

    /** private: method[onDblclick]
     *  Not implemented
     */
    onDblclick: function(evt) {
        alert('doubleClick');
    }
});
