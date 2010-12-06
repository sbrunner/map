/**
 * Copyright (c) 2008-2010 The Open Source Geospatial Foundation
 * 
 * Published under the BSD license.
 * See http://svn.geoext.org/core/trunk/geoext/license.txt for the full text
 * of the license.
 */
/*
 * @requires OpenLayers/Protocol.js
 */

OpenLayers.Protocol.OSMAPI = OpenLayers.Class(OpenLayers.Protocol, {
    
    map: null, 

    initialize: function(map, options) {
        this.map = map;
        options = options || {};
        options.url = options.url || "http://api.openstreetmap.org/api/0.6/map?";
        OpenLayers.Protocol.prototype.initialize.apply(this, arguments);
    },

/*    read: function(options) {
        var area = (options.filter.value.top - options.filter.value.bottom) 
            * (options.filter.value.right - options.filter.value.left);
        if (area > 1) {
            throw "Too low zoom !";
        }
        return OpenLayers.Protocol.HTTP.prototype.read.apply(this, arguments);
    },*/
    
    CLASS_NAME: "OpenLayers.Protocol.OSMAPI" 
});
