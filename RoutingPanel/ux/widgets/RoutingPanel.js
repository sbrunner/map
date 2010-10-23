/**
 * Copyright (c) 2008-2009 The Open Source Geospatial Foundation
 *
 * Published under the BSD license.
 * See http://svn.geoext.org/core/trunk/geoext/license.txt for the full text
 * of the license.
 */

/** api: (define)
 *  module = GeoExt.ux
 *  class = RoutingPanel
 *  base_link = `Ext.Panel <http://extjs.com/deploy/dev/docs/?class=Ext.Panel>`_
 */

/*
 * @include OpenLayers/Control/DrawFeature.js
 * @include OpenLayers/StyleMap.js
 * @include OpenLayers/Projection.js
 * @include OpenLayers/Layer/Vector.js
 * @include OpenLayers/BaseTypes/LonLat.js
 * @include OpenLayers/Geometry/Point.js
 * @include OpenLayers/Geometry/LineString.js
 * @include OpenLayers/Handler/Point.js
 */

Ext.namespace('GeoExt.ux');


/**
 * Converts an RGB color value to HSL. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
 * Assumes r, g, and b are contained in the set [0, 255] and
 * returns h, s, and l in the set [0, 1].
 *
 * @param   Number  r       The red color value
 * @param   Number  g       The green color value
 * @param   Number  b       The blue color value
 * @return  Array           The HSL representation
 */
function rgbToHsl(r, g, b){
    r /= 255, g /= 255, b /= 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, l = (max + min) / 2;

    if(max == min){
        h = s = 0; // achromatic
    }else{
        var d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch(max){
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    return [h, s, l];
}

/**
 * Converts an HSL color value to RGB. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
 * Assumes h, s, and l are contained in the set [0, 1] and
 * returns r, g, and b in the set [0, 255].
 *
 * @param   Number  h       The hue
 * @param   Number  s       The saturation
 * @param   Number  l       The lightness
 * @return  Array           The RGB representation
 */
function hslToRgb(h, s, l){
    var r, g, b;

    if(s == 0){
        r = g = b = l; // achromatic
    }else{
        function hue2rgb(p, q, t){
            if(t < 0) t += 1;
            if(t > 1) t -= 1;
            if(t < 1/6) return p + (q - p) * 6 * t;
            if(t < 1/2) return q;
            if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        }

        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }

    return [r * 255, g * 255, b * 255];
}

function toHexColor(rgb) {
    hr = Math.round(rgb[0]).toString(16);
    hg = Math.round(rgb[1]).toString(16);
    hb = Math.round(rgb[2]).toString(16);
    if (hr.length < 2) {
        hr = '0' + hr;
    }
    if (hg.length < 2) {
        hg = '0' + hg;
    }
    if (hb.length < 2) {
        hb = '0' + hb;
    }
    return '#'+hr+hg+hb;
}

function urlencode(str) {
    str = encodeURIComponent(str);
    str = str.replace(/!/g, '%21');
    str = str.replace(/'/g, '%27');
    str = str.replace(/\(/g, '%28');
    str = str.replace(/\)/g, '%29');
    str = str.replace(/\*/g, '%2A');  
    return str;
}

GeoExt.ux.cyclingRoutingService = function (options, type, start, end, catchResult, scope) {
    //Ext.decode(json)
    start = start.clone().transform(this.map.getProjectionObject(), this.routingProjection);
    end = end.clone().transform(this.map.getProjectionObject(), this.routingProjection);
    var newUrl = "source=" + start + "&target=" + end + "&lang=" + OpenLayers.Lang.getCode();
    var proxy = new Ext.data.ScriptTagProxy({
//    var proxy = new Ext.data.HttpProxy({
        url: "http://localhost:5000/routing?" + newUrl,
//        url: "http://localhost/map/Export/proxy.php?url=" + urlencode("http://localhost:5000/routing?" + newUrl),
        nocache: false
    });
    
    var reader = new Ext.data.DataReader();
    reader.geojsonReader = new OpenLayers.Format.GeoJSON();
    reader.readResponse = function(action, response) {
        var data = this.geojsonReader.read(response);
        
        var distance = null;
        var time = null;
        var hours = null;
        var minutes = null;
        var instructions = '';
        var features = data.pop().data
        
        if (features.distance) {
            distance = features.distance;
        }
        var first = true;
        for (var i = 0 ; i < data.length ; i++) {
            var d = data[i].attributes;
            if (first) { 
                first = false;
//                instructions += '<hr /><p>';
            }
            else { 
//                instructions += '<br />';
            }
            d.speed = d.waylength / d.time * 3600;
            d.elevation = Math.abs(d.elevation);
            d.decinivite = Math.round(d.elevation / d.waylength / 10) + "&nbsp;%";
            d.elevation = Math.round(d.elevation) + "&nbsp;m";
            d.waylength = (Math.round(d.waylength * 100) / 100) + "&nbsp;km";
            
            time = d.time;
            minutes = Math.floor(time / 60);
            seg = Math.round(time % 60);
            if (seg < 10) {
                seg = '0'+seg;
            }
            d.time = minutes+'.'+seg+'&nbsp;min.s';

//            d.denivele = d.elevation / d.waylength / 10;
            var instruction = d.name + ' (' + /*d.time + ', ' 
                    + d.waylength + ', ' 
                    + d.elevation + ', ' */
                    + Math.round(d.speed) + "&nbsp;km/h" + ')';
            d.instruction = instruction;
//            instructions += instruction;
        }
//        instructions += '</p>';

        if (features.time) {
            time = features.time;
            hours = Math.floor(time / 3600);
            minutes = Math.round((time / 60) % 60);
            if (minutes < 10) {
                minutes = '0'+minutes;
            }
        }
        
        var html = '<p>' + OpenLayers.i18n('Total length: ') + Math.round(distance * 100) / 100 + ' km</p>'
                + '<p>' + OpenLayers.i18n('Total time: ') + hours + 'h' + minutes + '</p>'
                + instructions + '<hr />';

        catchResult.call(scope, true, html, data);
    }


    proxy.doRequest('', null, {}, reader);
}
    
    
GeoExt.ux.cloudmadeRoutingService = function (options, type, start, end, catchResult, scope) {
    start = start.clone().transform(this.map.getProjectionObject(), this.routingProjection);
    end = end.clone().transform(this.map.getProjectionObject(), this.routingProjection);
    var newUrl = start.y + ',' + start.x + ',' + end.y + ',' + end.x + "/" + type + ".js?lang=" + OpenLayers.Lang.getCode();
    var proxy = new Ext.data.ScriptTagProxy({
        url: "http://routes.cloudmade.com/" + options.cloudmadeKey + "/api/0.3/" + newUrl,
        nocache: false
    });
    var routingStore = new Ext.data.Store({
        proxy: proxy,
        reader: new Ext.data.JsonReader({
            root: 'version',
            fields: [
                {
                    name: 'total_length'
                }
            ]

        })
    });

    routingStore.on('load', function (store) {
        var version = store.reader.jsonData.version;
        var status = store.reader.jsonData.status;
        
        var statusMessage = null;
        var routeSummary = null;
        var routeGeometry = null;
        var routeInstructions = null;
        
        if (store.reader.jsonData.status_message) {
            statusMessage = store.reader.jsonData.status_message;
        }
        if (store.reader.jsonData.route_summary) {
            routeSummary = store.reader.jsonData.route_summary;
        }
        if (store.reader.jsonData.route_geometry) {
            routeGeometry = store.reader.jsonData.route_geometry;
        }
        if (store.reader.jsonData.route_instructions) {
            routeInstructions = store.reader.jsonData.route_instructions;
        }
        if (status == '0') {
            var instructions = '';
            var first = true;
            for (var i = 0 ; i < routeInstructions.length ; i++) {
                if (first) { 
                    first = false;
                }
                else { 
                    instructions += '<br />';
                }
                instructions += routeInstructions[i][0] + ' (' + routeInstructions[i][4] + ').';
            }
            
            var html = '<p>' + instructions + '</p><p>' + OpenLayers.i18n('Total length: ') + Math.round(routeSummary.total_distance / 1000) + ' km</p>';

            var pointList = [];
            for (var i = 0; i < routeGeometry.length; i++) {
                var newPoint = new OpenLayers.Geometry.Point(routeGeometry[i][1],
                        routeGeometry[i][0]);
                pointList.push(newPoint);
            }
            var geometry = new OpenLayers.Geometry.LineString(pointList);

            catchResult.call(scope, true, html, [new OpenLayers.Feature.Vector(geometry)]);
        } 
        else {
            catchResult.call(scope, false, statusMessage, null);
        }
    }, this);
    routingStore.load();
}

GeoExt.ux.RoutingPanel = Ext.extend(Ext.Panel, {

    /** api: config[map]
     *  ``OpenLayers.Map``  A configured map
     */
    /** private: property[map]
     *  ``OpenLayers.Map``  The map object
     */
    map: null,

    /** api: config[startLocationCombo]
     *  ``Ext.form.ComboBox``  The combo box used for searching the start point
     */
    /** private: property[startLocationCombo]
     *  ``Ext.form.ComboBox``  The combo box used for searching the start point
     */
    startLocationCombo: null,

    /** api: config[endLocationCombo]
     *  ``Ext.form.ComboBox``  The combo box used for searching the end point
     */
    /** private: property[endLocationCombo]
     *  ``Ext.form.ComboBox``  The combo box used for searching the end point
     */
    endLocationCombo: null,

    /** api: config[routingService]
     *  function with the arguments (options <Object>, type <String>, start <String>, end <String>, catchResult <Function>)
     *  used to calculate the routing.
     */
    routingService: GeoExt.ux.cloudmadeRoutingService,
    
    /** api: config[routingOptions]
     *  options givent to the routingService function.
     */
    routingOptions: { 
        /** api: config[cloudmadeKey]
         *  Cloudmade key used for the routing and geocoding services
         *  Cloudmade specific
         */
        cloudmadeKey: null,
    },

    /** api: config[routingLayer]
     *  ``OpenLayers.Layer.Vector``  Layer presenting the routing result geometry. Per default, a layer named "Routing" will be created.
     */
    /** private: property[routingLayer]
     *  ``OpenLayers.Layer.Vector``  Layer presenting the routing result geometry. Per default, a layer named "Routing" will be created.
     */
    routingLayer: null,

    /** api: config[routingRecenterMap]
     *  ``Boolean``  Defines if the map is recentered after routing computation. Per default, yes.
     */
    /** private: property[routingRecenterMap]
     *  ``Boolean``  Defines if the map is recentered after routing computation. Per default, yes.
     */
    routingRecenterMap: true,

    /** property[routingPathFeatures]
     *  ``OpenLayers.Feature.Vector`` Line feature storing the routing path.
     */
    routingPathFeatures: null,

    /** property[routingStartFeature]
     *  ``OpenLayers.Feature.Vector`` Point feature storing the start point, if digitized by the user.
     */
    routingStartFeature: null,

    /** property[routingEndFeature]
     *  ``OpenLayers.Feature.Vector`` Point feature storing the end point, if digitized by the user.
     */
    routingEndFeature: null,

    /** private: property[routingPointDrawControl]
     *  ``OpenLayers.Control.DrawFeature`` Control to get start and end feature
     */
    routingPointDrawControl: null,

    /** property[routingResultPanel]
     *  ``Ext.Panel`` Panel presenting the computation result
     */
    routingResultPanel: null,


    /** api: config[geocodingBuilder]
     *  Geocoding builder, a function that build a geocodding field.
     */
    geocodingBuilder: null,

    /** api: config[geocodingOptions]
     *  Geocoding options given to the builder.
     */
    geocodingOptions: {},

    /** api: config[showGoogleItinerary]
     *  Define if the google itinerary links are shown in the result panel
     */
    /** private: property[showGoogleItinerary]
     *  Define if the google itinerary links are shown in the result panel
     */
    showGoogleItinerary: true,

    /** api: config[vectorStyle]
     *  ``OpenLayers.StyleMap`` Vector style of routing layer
     */
    /** private: property[vectorStyle]
     *  ``OpenLayers.StyleMap`` Vector style of routing layer
     */
    vectorStyle: new OpenLayers.StyleMap(),

    /** private: property[routingProjection]
     *  ``OpenLayers.Projection`` Projection of routing system.
     */
    routingProjection: new OpenLayers.Projection("EPSG:4326"),

    /** api: config[usePermalink]
     *  ``Boolean``  Read the permalink in the url if presents
     */
    /** private: property[readPermalink]
     *  ``Boolean``  Read the permalink in the url if presents
     */
    usePermalink: true,
    
    /** private: property[sermalinkState]
     *  ``Objext`` the permalink state of the rooting panel
     */
    permalinkState: {},

    /** private: method[initComponent]
     *  Private initComponent override.
     *  Create two events:
     *  - routingcomputed
     *  - beforeroutingcomputed
     */
    initComponent: function () {
        this.vectorStyle.createSymbolizer = function(feature) {
            var symbolizer = OpenLayers.StyleMap.prototype.createSymbolizer.apply(this, arguments);
            if (feature.attributes.speed) {
                rgb = hslToRgb(feature.attributes.speed / 50, 1, 0.5);
//                symbolizer.strokeColor = "rgb("+rgb[0]+", "+rgb[1]+", "+rgb[2]+")";
                symbolizer.strokeColor = toHexColor(rgb);
            }
            return symbolizer;
        };
        
        this.vectorStyle.styles["default"].addRules([new OpenLayers.Rule({
            symbolizer: {
                pointRadius: "8",
                fillColor: "#FF0000",
                fillOpacity: 0.5,
                strokeColor: "#FF0000",
                strokeOpacity: 1,
                strokeWidth: 1
            },
            filter: new OpenLayers.Filter.Comparison({ type: "==", property: 'type', value: 'point' })
        })]);
        this.vectorStyle.styles["default"].addRules([new OpenLayers.Rule({
            symbolizer: {
                strokeColor: "#0000FF",
                strokeOpacity: .8,
                strokeWidth: 3
            },
            filter: new OpenLayers.Filter.Comparison({ type: "==", property: 'type', value: 'route' })
        })]);
        this.vectorStyle.styles["select"].addRules([new OpenLayers.Rule({
            symbolizer: {
                pointRadius: "8",
                fillColor: "yellow",
                fillOpacity: 0.5,
                strokeColor: "yellow",
                strokeOpacity: 1,
                strokeWidth: 1
            },
            filter: new OpenLayers.Filter.Comparison({ type: "==", property: 'type', value: 'point' })
        })]);
        this.vectorStyle.styles["select"].addRules([new OpenLayers.Rule({
            symbolizer: {
                strokeColor: "yellow",
                strokeOpacity: .6,
                strokeWidth: 5
            },
            filter: new OpenLayers.Filter.Comparison({ type: "==", property: 'type', value: 'route' })
        })]);
        
        var permalinkProvider = Ext.state.Manager.getProvider();
        if (!permalinkProvider.state.r) {
            permalinkProvider.state.r = this.permalinkState;
        }
        else {
            this.permalinkState = permalinkProvider.state.r;
        }

        this.startLocationCombo = this.geocodingBuilder(Ext.apply({
            name: 'startLocationCombo',
            emptyText: OpenLayers.i18n('Search start...'),
            width: 195,
            listeners: {
                select: function (combo, record, index) {
                    if (this.routingStartFeature) {
                        this.routingLayer.removeFeatures([this.routingStartFeature]);
                        this.routingStartFeature = null;
                    }
                    var geometry = new OpenLayers.Geometry.Point(record.data.centroid.coordinates[1], record.data.centroid.coordinates[0]);
                    geometry = geometry.transform(this.routingProjection, this.map.getProjectionObject());
                    this.routingStartFeature = new OpenLayers.Feature.Vector(geometry, {type: 'point'});
                    this.routingLayer.addFeatures([this.routingStartFeature]);
                    if (this.usePermalink) {
                        this.permalinkState.start_lon = Math.round(record.data.centroid.coordinates[1] * 100000) / 100000;
                        this.permalinkState.start_lat = Math.round(record.data.centroid.coordinates[0] * 100000) / 100000;
                        this.permalinkState.start_text = this.startLocationCombo.getValue();
                    }
                },
                scope: this
            }
        }, this.geocodingOptions));
        this.endLocationCombo = this.geocodingBuilder(Ext.apply({
            name: 'endLocationCombo',
            emptyText: OpenLayers.i18n('Search end...'),
            width: 195,
            listeners: {
                select: function (combo, record, index) {
                    if (this.routingEndFeature) {
                        this.routingLayer.removeFeatures([this.routingEndFeature]);
                    }
                    var geometry = new OpenLayers.Geometry.Point(record.data.centroid.coordinates[1], record.data.centroid.coordinates[0]);
                    geometry = geometry.transform(this.routingProjection, this.map.getProjectionObject());
                    this.routingEndFeature = new OpenLayers.Feature.Vector(geometry, {type: 'point'});
                    this.routingLayer.addFeatures([this.routingEndFeature]);
                    if (this.usePermalink) {
                        this.permalinkState.end_lon = Math.round(record.data.centroid.coordinates[1] * 100000) / 100000;
                        this.permalinkState.end_lat = Math.round(record.data.centroid.coordinates[0] * 100000) / 100000;
                        this.permalinkState.end_text = this.startLocationCombo.getValue();
                    }
                },
                scope: this
            }
        }, this.geocodingOptions));

        this.routingResultPanel = new Ext.Panel({
            border: false,
            autoScroll: true,
            height: 400
        });

        Ext.apply(this, {
            plain: true,
            border: false,
            bodyStyle: 'padding: 5px 0 5px 5px;',
            items: [{
                layout: 'form',
                layoutConfig: {
                    labelSeparator: ""
                },
                border: false,
                labelWidth: 40,
                items: [{
                        layout: 'column',
                        border: false,
                        fieldLabel: OpenLayers.i18n('From'),
                        items: [
                            this.startLocationCombo,
                            {
                                xtype: 'button',
                                text: OpenLayers.i18n('Get Point'),
                                handler: function (button, event) {
                                    this.routingPointDrawControl.type = 'GetStartPoint';
                                    this.routingPointDrawControl.activate();
                                },
                                scope: this
                            }
                        ]
                    },
                    {
                        layout: 'column',
                        border: false,
                        fieldLabel: OpenLayers.i18n('To'),
                        items: [
                            this.endLocationCombo,
                            {
                                xtype: 'button',
                                text: OpenLayers.i18n('Get Point'),
                                handler: function (button, event) {
                                    this.routingPointDrawControl.type = 'GetEndPoint';
                                    this.routingPointDrawControl.activate();
                                },
                                scope: this
                            }
                        ]
                    },
                    {
                        layout: 'column',
                        border: false,
                        bodyStyle: 'padding: 3px 0 10px 0;',
                        items: [{
                            baseCls: 'x-plane',
                            html: OpenLayers.i18n('Compute itinerary: '),
                            bodyStyle: 'padding: 2px 5px 0 0;',
                        },
                        {
                            xtype: 'button',
                            text: OpenLayers.i18n('By car'),
                            handler: function () {
                                this.getItinerary('car');
                            },
                            scope: this
                        },
                        {
                            xtype: 'button',
                            text: OpenLayers.i18n('By foot'),
                            handler: function () {
                                this.getItinerary('foot');
                            },
                            scope: this
                        },
                        {
                            xtype: 'button',
                            text: OpenLayers.i18n('By bicycle'),
                            handler: function () {
                                this.getItinerary('bicycle');
                            },
                            scope: this
                        }]
                    },
                    this.routingResultPanel
                ]}
            ]}
        );
        GeoExt.ux.RoutingPanel.superclass.initComponent.apply(this, arguments);

        // Create routing layer
        this.routingLayer = new OpenLayers.Layer.Vector("Routing", {styleMap: this.vectorStyle, displayInLayerSwitcher: false, id: 'routing'});
        this.map.addLayer(this.routingLayer);

        this.addEvents(
            /** api: event[routingcomputed]
             *  Fires when a routing has been computed
             *
             *  Listener arguments:
             *  * comp - :class:`GeoExt.ux.RoutingPanel`` This component.
             */
                'routingcomputed',

            /** api: event[beforeroutingcomputed]
             *  Fires when before a routing is computed
             *
             *  Listener arguments:
             *  * comp - :class:`GeoExt.ux.RoutingPanel`` This component.
             */
                'beforeroutingcomputed');


    },

    /** private: method[afterRender]
     *  Private afterRender override.
     */
    afterRender: function () {
        GeoExt.ux.RoutingPanel.superclass.afterRender.call(this);

        // Create point draw control
        this.routingPointDrawControl = new OpenLayers.Control.DrawFeature(this.routingLayer, OpenLayers.Handler.Point);
        this.map.addControl(this.routingPointDrawControl);
        this.routingPointDrawControl.events.on({ featureadded: function (events) {
            var featureLocation = null;
            var combo = null;
            var permalinkPrefix = null;
            var featureName = null;
            if (this.routingPointDrawControl.type == 'GetStartPoint') {
                combo = this.startLocationCombo;
                permalinkPrefix = 'start_';
                featureName = 'routingStartFeature';
                events.feature.attributes.type = 'point';
                events.feature.layer.drawFeature(events.feature);
            }
            else if (this.routingPointDrawControl.type == 'GetEndPoint') {
                combo = this.endLocationCombo;
                permalinkPrefix = 'end_';
                featureName = 'routingEndFeature';
                events.feature.attributes.type = 'point';
                events.feature.layer.drawFeature(events.feature);
            }
            this.routingPointDrawControl.type = null;
            
            if (this[featureName]) {
                this.routingLayer.removeFeatures([this[featureName]]);
                this[featureName] = null;
            }
            this[featureName] = events.feature;
            featureLocation = this[featureName].geometry.clone();
            featureLocation.transform(this.map.getProjectionObject(), this.routingProjection);
            combo.emptyText = OpenLayers.i18n('Position: ') + Math.round(featureLocation.x * 100000) / 100000 + ',' + Math.round(featureLocation.y * 100000) / 100000;
            combo.clearValue();
            if (this.usePermalink) {
                this.permalinkState[permalinkPrefix+'lon'] = Math.round(featureLocation.x * 100000) / 100000;
                this.permalinkState[permalinkPrefix+'lat'] = Math.round(featureLocation.y * 100000) / 100000;
                this.permalinkState[permalinkPrefix+'text'] = null;
            }
            this.routingPointDrawControl.deactivate();
        },
            scope: this
        });
        // Use the permalink
        if (this.usePermalink) {
            this.readPermalink();
        }
    },

    /** private: method[setPermalink]
     *  Set the permalink according to the url parameters
     *
     * :param parameters URL paramaters
     */
    readPermalink: function () {
        if (this.permalinkState.start_lon && this.permalinkState.start_lat) {
            var geometry = new OpenLayers.Geometry.Point(this.permalinkState.start_lon, this.permalinkState.start_lat);
            geometry = geometry.transform(this.routingProjection, this.map.getProjectionObject());
            this.routingStartFeature = new OpenLayers.Feature.Vector(geometry, {type: 'point'});
            this.routingLayer.addFeatures([this.routingStartFeature]);

            this.startLocationCombo.emptyText = OpenLayers.i18n('Position: ') + this.permalinkState.start_lon + ',' + this.permalinkState.start_lat;
            this.startLocationCombo.clearValue();
        }
        if (this.permalinkState.end_lon && this.permalinkState.end_lat) {
            var geometry = new OpenLayers.Geometry.Point(this.permalinkState.end_lon, this.permalinkState.end_lat);
            geometry = geometry.transform(this.routingProjection, this.map.getProjectionObject());
            this.routingEndFeature = new OpenLayers.Feature.Vector(geometry, {type: 'point'});
            this.routingLayer.addFeatures([this.routingEndFeature]);
            
            this.endLocationCombo.emptyText = OpenLayers.i18n('Position: ') + this.permalinkState.end_lon + ',' + this.permalinkState.end_lat;
            this.endLocationCombo.clearValue();
        }
        if (this.permalinkState.start_lon && this.permalinkState.start_lat && this.permalinkState.end_lon && this.permalinkState.end_lat) {
            this.getItinerary('cat'); // should be stored in permalink
        }
        if (this.permalinkState.start_text) {
            this.startLocationCombo.setValue(this.permalinkState.start_text);
        }
        if (this.permalinkState.end_text) {
            this.endLocationCombo.setValue(this.permalinkState.end_text);
        }
    },

    /** private: method[stringToBoolean]
     *  Transform a string (true, false, yes, no 1 or 0) to a boolean
     *
     * :param string
     */
    stringToBoolean: function (string) {
        switch (string.toLowerCase()) {
            case "true": 
            case "yes": 
            case "1": 
                return true;
            case "false": 
            case "no": 
            case "0": 
            case null: 
                return false;
            default: 
                return Boolean(string);
        }
    },

    /** private: method[getItinerary]
     *  Compute the itinerary and assign the results
     */
    getItinerary: function (type) {
        this.fireEvent('beforeroutingcomputed', this);
        this.routingResultPanel.html = OpenLayers.i18n('Computation ongoing....');
        if (this.routingResultPanel.body) {
            this.routingResultPanel.body.update(this.routingResultPanel.html);
        }
        this.routingService(this.routingOptions, type, this.routingStartFeature.geometry, this.routingEndFeature.geometry, 
            function (succed, html, features) {
                if (succed) {
                    this.drawRoute(features);
                    var googleLinks = '';
                    if (this.showGoogleItinerary) {
                        var start = this.routingStartFeature.geometry.clone().transform(this.map.getProjectionObject(), this.routingProjection);
                        var end = this.routingEndFeature.geometry.clone().transform(this.map.getProjectionObject(), this.routingProjection);
                        var baseURL = 'http://maps.google.com/maps?source=s_d&saddr=' + start.y + ',' + start.x + '&daddr=' + end.y + ',' + end.x;
                        googleLinks = '<p><a href="' + baseURL + '&dirflg=a" target="new">' + OpenLayers.i18n('Google Itinerary by car') + '</a><br />'
                            + '<a href="' + baseURL + '&dirflg=r" target="new">' + OpenLayers.i18n('Google Itinerary by public transport') + '</a><br />'
                            + '<a href="' + baseURL + '&dirflg=w" target="new">' + OpenLayers.i18n('Google Itinerary on foot') + '</a></p>';
                    }                    
                    this.routingResultPanel.html = html + googleLinks;
                }
                else {
                    this.routingResultPanel.html = html;
                }
                if (this.routingResultPanel.body) {
                    this.routingResultPanel.body.update(this.routingResultPanel.html);
                }
                this.fireEvent('routingcomputed', this);
            }, this
        );
    },

    /** private: method[clearItinerary]
     *  Clear the itinerary the itinerary and assign the results
     */
    clearItinerary: function () {
        if (this.routingPathFeatures) {
            this.routingLayer.removeFeatures(this.routingPathFeatures);
        }
        this.startLocationCombo.clearValue();
        this.endLocationCombo.clearValue();
        if (this.routingStartFeature) {
            this.routingLayer.removeFeatures([this.routingStartFeature]);
            this.routingStartFeature = null;
        }
        if (this.routingEndFeature) {
            this.routingLayer.removeFeatures([this.routingEndFeature]);
            this.routingEndFeature = null;
        }
        this.routingResultPanel.html = '';
        this.routingResultPanel.body.update(this.routingResultPanel.html);
    },

    /** private: method[drawRoute]
     *  Draw the route in the map
     */
    drawRoute: function (features) {
        extent = null;
        for (var i = 0 ; i < features.length ; i++) {
            features[i].geometry.transform(this.routingProjection, this.map.getProjectionObject());
            features[i].attributes.type = 'route';

            if (this.routingRecenterMap) {
                if (extent) {
                    extent.extend(features[i].geometry.getBounds());
                }
                else {
                    extent = features[i].geometry.getBounds();
                }
            }
        }
        if (this.routingPathFeatures) {
            this.routingLayer.removeFeatures(this.routingPathFeatures);
        }
        this.routingPathFeatures = features;

        this.routingLayer.addFeatures(this.routingPathFeatures);
        this.map.zoomToExtent(extent);
    }
});

/** api: xtype = gxux_routingpanel */
Ext.reg('gxux_routingpanel', GeoExt.ux.RoutingPanel);
