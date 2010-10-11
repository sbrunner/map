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
            
            var html = '<p>' + instructions + '</p><p>' + OpenLayers.i18n('Total length: ') + Math.round(routeSummary.total_distance / 1000) + ' [km]</p>';

            var pointList = [];
            for (var i = 0; i < routeGeometry.length; i++) {
                var newPoint = new OpenLayers.Geometry.Point(routeGeometry[i][1],
                        routeGeometry[i][0]);
                pointList.push(newPoint);
            }
            var geometry = new OpenLayers.Geometry.LineString(pointList);

            catchResult.call(scope, true, html, geometry);
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

    /** property[routingPathFeature]
     *  ``OpenLayers.Feature.Vector`` Line feature storing the routing path.
     */
    routingPathFeature: null,

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

    /** api: config[routingStyle]
     *  Vector style of the routing path
     */
    /** private: property[routingStyle]
     *  Vector style of the routing path
     */
    routingStyle: {
        strokeColor: "#0000FF",
        strokeOpacity: 0.5,
        strokeWidth: 5
    },

    /** api: config[vectorStyle]
     *  ``OpenLayers.StyleMap`` Vector style of routing layer
     */
    /** private: property[vectorStyle]
     *  ``OpenLayers.StyleMap`` Vector style of routing layer
     */
    vectorStyle: new OpenLayers.StyleMap({
        'default': new OpenLayers.Style({
            pointRadius: "8",
            fillColor: "#FF0000",
            fillOpacity: 0.5,
            strokeColor: "#FF0000",
            strokeOpacity: 1,
            strokeWidth: 1
        })
    }),

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
                    this.routingStartFeature = new OpenLayers.Feature.Vector(geometry);
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
                    this.routingEndFeature = new OpenLayers.Feature.Vector(geometry);
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

        // Create routing layer
        if (!this.routingLayer) {
            this.routingLayer = new OpenLayers.Layer.Vector("Routing", {styleMap: this.vectorStyle, displayInLayerSwitcher: false, id: 'routing'});
        }
        this.map.addLayer(this.routingLayer);

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
            }
            else if (this.routingPointDrawControl.type == 'GetEndPoint') {
                combo = this.endLocationCombo;
                permalinkPrefix = 'end_';
                featureName = 'routingEndFeature';
            }
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
            this.routingStartFeature = new OpenLayers.Feature.Vector(geometry);
            this.routingLayer.addFeatures([this.routingStartFeature]);

            this.startLocationCombo.emptyText = OpenLayers.i18n('Position: ') + this.permalinkState.start_lon + ',' + this.permalinkState.start_lat;
            this.startLocationCombo.clearValue();
        }
        if (this.permalinkState.end_lon && this.permalinkState.end_lat) {
            var geometry = new OpenLayers.Geometry.Point(this.permalinkState.end_lon, this.permalinkState.end_lat);
            geometry = geometry.transform(this.routingProjection, this.map.getProjectionObject());
            this.routingEndFeature = new OpenLayers.Feature.Vector(geometry);
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
            function (succed, html, geometry) {
                if (succed) {
                    this.drawRoute(geometry);
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
        if (this.routingPathFeature) {
            this.routingLayer.removeFeatures([this.routingPathFeature]);
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
    drawRoute: function (geometry) {
        geometry = geometry.transform(this.routingProjection, this.map.getProjectionObject());

        if (this.routingPathFeature) {
            this.routingLayer.removeFeatures([this.routingPathFeature]);
        }
        this.routingPathFeature = new OpenLayers.Feature.Vector(geometry, null, this.routingStyle);

        this.routingLayer.addFeatures([this.routingPathFeature]);
        if (this.routingRecenterMap) {
            this.map.zoomToExtent(this.routingPathFeature.geometry.bounds);
        }
    }
});

/** api: xtype = gxux_routingpanel */
Ext.reg('gxux_routingpanel', GeoExt.ux.RoutingPanel);
