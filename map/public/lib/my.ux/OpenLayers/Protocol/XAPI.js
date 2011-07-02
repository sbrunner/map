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

OpenLayers.Protocol.XAPI = OpenLayers.Class(OpenLayers.Protocol, {

    /**
     * APIProperty: url
     * {String} Service URL, read-only, set through the options
     *     passed to constructor. Defaults to "http://xapi.openstreetmap.org/api/0.6/"
     */
    url: null,

    /**
     * APIProperty: headers
     * {Object} HTTP request headers, read-only, set through the options
     *     passed to the constructor,
     *     Example: {'Content-Type': 'plain/text'}
     */
    headers: null,
    
    /**
     * APIProperty: element
     * {String} Requested elements
     *     One of "node", "way", "relation", "map", "*" (defaults to "node")
     *     See http://wiki.openstreetmap.org/wiki/Xapi for details
     */
    element: null,
    
    /**
     * APIProperty: predicate
     * {String} "key=value" tag to query (eg: "amenity=hospital")
     */
    predicate: null, 
    
    /**
     * APIProperty: callback
     * {Object} Function to be called when the <read> operation completes, 
     *     read-only, set through the options passed to the constructor.
     */
    callback: null,

    /**
     * APIProperty: scope
     * {Object} Callback execution scope, read-only, set through the
     *     options passed to the constructor.
     */
    scope: null,

    /**
     * Constructor: OpenLayers.Protocol.HTTP
     * A class for giving layers generic HTTP protocol.
     *
     * Parameters:
     * options - {Object} Optional object whose properties will be set on the
     *     instance.
     *
     * Valid options include:
     * url - {String} (defaults to "http://xapi.openstreetmap.org/api/0.6/")
     * headers - {Object} 
     * predicate - {String}
     * format - {<OpenLayers.Format>} (defaults to OpenLayers.Format.OSM)
     * callback - {Function}
     * scope - {Object}
     */
    initialize: function(options) {
        options = options || {};
        this.element = 'node';
        this.url = "http://open.mapquestapi.com/xapi/api/0.6/";
//        this.url = "http://jxapi.openstreetmap.org/xapi/api/0.6";
//        this.url = "http://xapi.openstreetmap.org/api/0.6/";
//        this.url = "http://www.informationfreeway.org/api/0.6/";
        this.format = options.format || new OpenLayers.Format.OSM();
        OpenLayers.Protocol.prototype.initialize.apply(this, arguments);
    },
    
    /**
     * APIMethod: destroy
     * Clean up the protocol.
     */
    destroy: function() {
        this.headers = null;
        OpenLayers.Protocol.prototype.destroy.apply(this);
    },
   
    /**
     * APIMethod: read
     * Construct a request for reading new features.
     *
     * Parameters:
     * options - {Object} Optional object for configuring the request.
     *     This object is modified and should not be reused.
     *
     * Valid options:
     * url - {String} Url for the request.
     * predicate - {String} Predicate on OSM feature attributes.
     * headers - {Object} Headers to be set on the request.
     * filter - {<OpenLayers.Filter>} Filter to get serialized as a
     *     query string.
     *
     * Returns:
     * {<OpenLayers.Protocol.Response>} A response object, whose "priv" property
     *     references the HTTP request, this object is also passed to the
     *     callback function when the request completes, its "features" property
     *     is then populated with the the features received from the server.
     */
    read: function(options) {
        OpenLayers.Protocol.prototype.read.apply(this, arguments);
        options = OpenLayers.Util.applyDefaults(options, this.options);
        
        var resp = new OpenLayers.Protocol.Response({requestType: "read"});
        resp.priv = OpenLayers.Request.GET({
            url: this.toURL(options),
            callback: this.createCallback(this.handleRead, resp, options),
            headers: options.headers || {}
        });
        return resp;
    },

    /**
     * Method: handleRead
     * Individual callbacks are created for read, create and update, should
     *     a subclass need to override each one separately.
     *
     * Parameters:
     * resp - {<OpenLayers.Protocol.Response>} The response object to pass to
     *     the user callback.
     * options - {Object} The user options passed to the read call.
     */
    handleRead: function(resp, options) {
        this.handleResponse(resp, options);
    },

    /**
     * Method: toURL
     * Convert an <OpenLayers.Filter> object and predicate string to parameters.
     *
     * Valid options:
     * filter - {OpenLayers.Filter} filter to convert.
     * predicate - {String} The predicate string.
     *
     * Returns:
     * {String} The resulting url string
     */
    toURL: function(options) {
        var url = this.url + this.element;
        url += (options.predicate) ? "["+options.predicate+"]" : "";
        
        var filter = options.filter;        
        var className = filter.CLASS_NAME;
        var filterType = className.substring(className.lastIndexOf(".") + 1);
        if (filterType == "Spatial") {
            if (filter.type == OpenLayers.Filter.Spatial.BBOX) {
                var bbox = filter.value;
                if (filter.projection.projCode != "EPSG:4326") {
                    bbox.transform(filter.projection, 
                        new OpenLayers.Projection("EPSG:4326"));
                }
                url += "[bbox="+bbox.left+","+bbox.bottom+","+bbox.right+","+bbox.top+"]";
            }
            else {
                OpenLayers.Console.warn("Unknown spatial filter type " + filter.type);
            }
        }
        else {
            OpenLayers.Console.warn("Unknown filter type " + filterType);
        }
        return url;
    },

    /**
     * Method: handleResponse
     * Called by CRUD specific handlers.
     *
     * Parameters:
     * resp - {<OpenLayers.Protocol.Response>} The response object to pass to
     *     any user callback.
     * options - {Object} The user options passed to the read call.
     */
    handleResponse: function(resp, options) {
        var request = resp.priv;
        if(options.callback) {
            if(request.status >= 200 && request.status < 300) {
                // success
                resp.features = this.parseFeatures(request);
                resp.code = OpenLayers.Protocol.Response.SUCCESS;
            } else {
                // failure
                resp.code = OpenLayers.Protocol.Response.FAILURE;
            }
            options.callback.call(options.scope, resp);
        }
    },

    /**
     * Method: parseFeatures
     * Read HTTP response body and return features.
     *
     * Parameters:
     * request - {XMLHttpRequest} The request object
     *
     * Returns:
     * {Array({<OpenLayers.Feature.Vector>})} or
     *     {<OpenLayers.Feature.Vector>} Array of features or a single feature.
     */
    parseFeatures: function(request) {
        var doc = request.responseXML;
        if (!doc || !doc.documentElement) {
            doc = request.responseText;
        }
        if (!doc || doc.length <= 0) {
            return null;
        }
        return this.format.read(doc);
    },

    /**
     * APIMethod: abort
     * Abort an ongoing request, the response object passed to
     * this method must come from this HTTP protocol (as a result
     * of a create, read, update, delete or commit operation).
     *
     * Parameters:
     * response - {<OpenLayers.Protocol.Response>}
     */
    abort: function(response) {
        if (response) {
            response.priv.abort();
        }
    },

    CLASS_NAME: "OpenLayers.Protocol.XAPI" 
});
