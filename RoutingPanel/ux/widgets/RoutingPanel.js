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



cloudmadeSearchCombo = function (options) {
    var maxRows = options.maxRows ? options.maxRows : 10; 
    var url = 'http://geocoding.cloudmade.com/' + options.cloudmadeKey + '/geocoding/v2/find.js?results=' + maxRows + '&return_geometry=false';
    
    options = Ext.apply({
        emptyText: OpenLayers.i18n('Search location in Cloudmade'),
        loadingText: OpenLayers.i18n('Search in Cloudmade...'),
        minChars: 1,
        queryDelay: 50,
        hideTrigger: true,
        charset: 'UTF8',
        forceSelection: true,
        displayField: 'name',
        queryParam: 'query',
        tpl: '<tpl for="."><div class="x-combo-list-item"><h3>{name}</h3>{is_in}</div></tpl>',
        store: new Ext.data.Store({
            proxy: new Ext.data.ScriptTagProxy({
                url: url,
                method: 'GET'
            }),
            reader: new Ext.data.JsonReader({
                totalProperty: "found",
                root: "features",
                fields: [{
                    name: 'is_in',
                    mapping: 'properties.is_in'
                },
                {
                    name: 'name',
                    mapping: 'properties.name'
                },
                {
                    name: 'centroid'
                }]
            })
        })
    }, options);
    var box =  new Ext.form.ComboBox(options);
    
    if (box.zoom > 0) {
        box.on("select", function (combo, record, index) {
            var coordinates = record.data.centroid.coordinates;
            var position = new OpenLayers.LonLat(coordinates[1], coordinates[0]);
            position.transform(
                new OpenLayers.Projection("EPSG:4326"),
                this.map.getProjectionObject()
            );
            this.map.setCenter(position, this.zoom);
        }, box);
    }
    
    return box;
};

GeoExt.ux.cloudmadeRoutingService = function (options, type, start, end, catchResult, scope) {
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

    /** api: config[routingProviders]
     *  options givent to the routingService function.
     */
    // Key for dev.geoext.org: 187a9f341f70406a8064d07a30e5695c
    // Key for localhost: BC9A493B41014CAABB98F0471D759707
    routingProviders: { 
        cloudmade : {
            service: GeoExt.ux.cloudmadeRoutingService,
            projection: new OpenLayers.Projection("EPSG:4326"),
            cloudmadeKey: cloudmadeKey,
            types: {
                car: { name: OpenLayers.i18n('By car') },
                foot: { name: OpenLayers.i18n('By foot') },
                bicycle: { name: OpenLayers.i18n('By bicycle') }
            }
        }
    },


    /** api: config[layer]
     *  ``OpenLayers.Layer.Vector``  Layer presenting the routing result geometry. Per default, a layer named "Routing" will be created.
     */
    /** private: property[layer]
     *  ``OpenLayers.Layer.Vector``  Layer presenting the routing result geometry. Per default, a layer named "Routing" will be created.
     */
    layer: null,

    /** api: config[recenterMap]
     *  ``Boolean``  Defines if the map is recentered after routing computation. Per default, yes.
     */
    /** private: property[recenterMap]
     *  ``Boolean``  Defines if the map is recentered after routing computation. Per default, yes.
     */
    recenterMap: true,

    /** property[routeFeatures]
     *  ``OpenLayers.Feature.Vector`` Line feature storing the routing path.
     */
    routeFeatures: null,

    /** property[startFeature]
     *  ``OpenLayers.Feature.Vector`` Point feature storing the start point, if digitized by the user.
     */
    startFeature: null,

    /** property[endFeature]
     *  ``OpenLayers.Feature.Vector`` Point feature storing the end point, if digitized by the user.
     */
    endFeature: null,

    /** private: property[pointDrawControl]
     *  ``OpenLayers.Control.DrawFeature`` Control to get start and end feature
     */
    pointDrawControl: null,

    /** property[resultPanel]
     *  ``Ext.Panel`` Panel presenting the computation result
     */
    resultPanel: null,


    /**
     * api: config[geocodingProvider]
     */
    geocodingProviders: {
        builder: cloudmadeSearchCombo,
        projection: new OpenLayers.Projection("EPSG:4326"),
        cloudmadeKey: cloudmadeKey,
        maxRows: 20,
        queryParam: 'query'
    },

    /** api: config[showGoogleItinerary]
     *  Define if the google itinerary links are shown in the result panel
     */
    /** private: property[showGoogleItinerary]
     *  Define if the google itinerary links are shown in the result panel
     */
    showGoogleItinerary: true,

    /** api: config[style]
     *  ``OpenLayers.StyleMap`` Vector style of routing layer
     */
    /** private: property[style]
     *  ``OpenLayers.StyleMap`` Vector style of routing layer
     */
    style: new OpenLayers.StyleMap({
        "default": {
            pointRadius: "8",
            fillColor: "#FF0000",
            fillOpacity: 0.5,
            strokeColor: "#FF0000",
            strokeOpacity: .8,
            strokeWidth: 3
        }
    }),

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

        this.startLocationCombo = this.geocodingProviders.builder(Ext.apply({
            name: 'startLocationCombo',
            emptyText: OpenLayers.i18n('Search start...'),
            width: 195,
            listeners: {
                select: function (combo, record, index) {
                    if (this.startFeature) {
                        this.layer.removeFeatures([this.startFeature]);
                        this.startFeature = null;
                    }
                    var geometry = new OpenLayers.Geometry.Point(record.data.centroid.coordinates[1], record.data.centroid.coordinates[0]);
                    geometry = geometry.transform(this.geocodingProviders.projection, this.map.getProjectionObject());
                    this.startFeature = new OpenLayers.Feature.Vector(geometry, {type: 'point'});
                    this.layer.addFeatures([this.startFeature]);
                    if (this.usePermalink) {
                        this.permalinkState.start_lon = Math.round(record.data.centroid.coordinates[1] * 100000) / 100000;
                        this.permalinkState.start_lat = Math.round(record.data.centroid.coordinates[0] * 100000) / 100000;
                        this.permalinkState.start_text = this.startLocationCombo.getValue();
                    }
                },
                scope: this
            }
        }, this.geocodingProviders));
        this.endLocationCombo = this.geocodingProviders.builder(Ext.apply({
            name: 'endLocationCombo',
            emptyText: OpenLayers.i18n('Search end...'),
            width: 195,
            listeners: {
                select: function (combo, record, index) {
                    if (this.endFeature) {
                        this.layer.removeFeatures([this.endFeature]);
                    }
                    var geometry = new OpenLayers.Geometry.Point(record.data.centroid.coordinates[1], record.data.centroid.coordinates[0]);
                    geometry = geometry.transform(this.geocodingProviders.projection, this.map.getProjectionObject());
                    this.endFeature = new OpenLayers.Feature.Vector(geometry, {type: 'point'});
                    this.layer.addFeatures([this.endFeature]);
                    if (this.usePermalink) {
                        this.permalinkState.end_lon = Math.round(record.data.centroid.coordinates[1] * 100000) / 100000;
                        this.permalinkState.end_lat = Math.round(record.data.centroid.coordinates[0] * 100000) / 100000;
                        this.permalinkState.end_text = this.endLocationCombo.getValue();
                    }
                },
                scope: this
            }
        }, this.geocodingProviders));

        this.resultPanel = new Ext.Panel({
            border: false,
            autoScroll: true,
            height: 400
        });

        var itinaryItems = [{
            baseCls: 'x-plane',
            html: OpenLayers.i18n('Compute itinerary: '),
            bodyStyle: 'padding: 2px 5px 0 0;'
        }]
        for (var providerRef in this.routingProviders) {
            var provider = this.routingProviders[providerRef];
            provider.ref = providerRef;
            for (var typeRef in provider.types) {
                var type = provider.types[typeRef];
                type.type = typeRef;
                itinaryItems.push({
                    xtype: 'button',
                    text: type.name,
                    provider: provider,
                    type: typeRef,
                    routing: this,
                    handler: function () {
                        this.routing.getItinerary(this.provider, this.type);
                    }
                });
            }
        }
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
                                    this.pointDrawControl.type = 'GetStartPoint';
                                    this.pointDrawControl.activate();
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
                                    this.pointDrawControl.type = 'GetEndPoint';
                                    this.pointDrawControl.activate();
                                },
                                scope: this
                            }
                        ]
                    },
                    {
                        layout: 'column',
                        border: false,
                        bodyStyle: 'padding: 3px 0 10px 0;',
                        items: [itinaryItems]
                    },
                    this.resultPanel
                ]}
            ]}
        );
        GeoExt.ux.RoutingPanel.superclass.initComponent.apply(this, arguments);

        // Create routing layer
        this.layer = new OpenLayers.Layer.Vector("Routing", {styleMap: this.style, displayInLayerSwitcher: false, id: 'routing'});
        this.map.addLayer(this.layer);

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
        this.pointDrawControl = new OpenLayers.Control.DrawFeature(this.layer, OpenLayers.Handler.Point);
        this.map.addControl(this.pointDrawControl);
        this.pointDrawControl.events.on({ featureadded: function (events) {
            var featureLocation = null;
            var combo = null;
            var permalinkPrefix = null;
            var featureName = null;
            if (this.pointDrawControl.type == 'GetStartPoint') {
                combo = this.startLocationCombo;
                permalinkPrefix = 'start_';
                featureName = 'startFeature';
                events.feature.attributes.type = 'point';
                events.feature.layer.drawFeature(events.feature);
            }
            else if (this.pointDrawControl.type == 'GetEndPoint') {
                combo = this.endLocationCombo;
                permalinkPrefix = 'end_';
                featureName = 'endFeature';
                events.feature.attributes.type = 'point';
                events.feature.layer.drawFeature(events.feature);
            }
            this.pointDrawControl.type = null;
            
            if (this[featureName]) {
                this.layer.removeFeatures([this[featureName]]);
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
            this.pointDrawControl.deactivate();
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
            geometry = geometry.transform(this.geocodingProviders.projection, this.map.getProjectionObject());
            this.startFeature = new OpenLayers.Feature.Vector(geometry, {type: 'point'});
            this.layer.addFeatures([this.startFeature]);

            this.startLocationCombo.emptyText = OpenLayers.i18n('Position: ') + this.permalinkState.start_lon + ',' + this.permalinkState.start_lat;
            this.startLocationCombo.clearValue();
        }
        if (this.permalinkState.end_lon && this.permalinkState.end_lat) {
            var geometry = new OpenLayers.Geometry.Point(this.permalinkState.end_lon, this.permalinkState.end_lat);
            geometry = geometry.transform(this.geocodingProviders.projection, this.map.getProjectionObject());
            this.endFeature = new OpenLayers.Feature.Vector(geometry, {type: 'point'});
            this.layer.addFeatures([this.endFeature]);
            
            this.endLocationCombo.emptyText = OpenLayers.i18n('Position: ') + this.permalinkState.end_lon + ',' + this.permalinkState.end_lat;
            this.endLocationCombo.clearValue();
        }
        if (this.permalinkState.start_lon && this.permalinkState.start_lat && this.permalinkState.end_lon && this.permalinkState.end_lat
                && this.permalinkState.provider && this.permalinkState.type) {
            this.getItinerary(this.routingProviders[this.permalinkState.provider], this.permalinkState.type); // should be stored in permalink
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
    getItinerary: function (provider, type) {
        this.fireEvent('beforeroutingcomputed', this);
        this.resultPanel.html = OpenLayers.i18n('Computation ongoing....');

        this.permalinkState.provider = provider.ref;
        this.permalinkState.type = type;

        if (this.resultPanel.body) {
            this.resultPanel.body.update(this.resultPanel.html);
        }
        var start = this.startFeature.geometry.clone().transform(this.map.getProjectionObject(), provider.projection);
        var end = this.endFeature.geometry.clone().transform(this.map.getProjectionObject(), provider.projection);
        provider.service(provider, type, start, end, function (succed, html, features) {
                if (succed) {
                    this.drawRoute(features, provider.projection);
                    var googleLinks = '';
                    if (this.showGoogleItinerary) {
                        var start = this.startFeature.geometry.clone().transform(this.map.getProjectionObject(), this.routingProjection);
                        var end = this.endFeature.geometry.clone().transform(this.map.getProjectionObject(), this.routingProjection);
                        var baseURL = 'http://maps.google.com/maps?source=s_d&saddr=' + start.y + ',' + start.x + '&daddr=' + end.y + ',' + end.x;
                        googleLinks = '<p><a href="' + baseURL + '&dirflg=a" target="new">' + OpenLayers.i18n('Google Itinerary by car') + '</a><br />'
                            + '<a href="' + baseURL + '&dirflg=r" target="new">' + OpenLayers.i18n('Google Itinerary by public transport') + '</a><br />'
                            + '<a href="' + baseURL + '&dirflg=w" target="new">' + OpenLayers.i18n('Google Itinerary on foot') + '</a></p>';
                    }                    
                    this.resultPanel.html = html + googleLinks;
                }
                else {
                    this.resultPanel.html = html;
                }
                if (this.resultPanel.body) {
                    this.resultPanel.body.update(this.resultPanel.html);
                }
                this.fireEvent('routingcomputed', this);
            }, this
        );
    },

    /** private: method[clearItinerary]
     *  Clear the itinerary the itinerary and assign the results
     */
    clearItinerary: function () {
        if (this.routeFeatures) {
            this.layer.removeFeatures(this.routeFeatures);
        }
        this.startLocationCombo.clearValue();
        this.endLocationCombo.clearValue();
        if (this.startFeature) {
            this.layer.removeFeatures([this.startFeature]);
            this.startFeature = null;
        }
        if (this.endFeature) {
            this.layer.removeFeatures([this.endFeature]);
            this.endFeature = null;
        }
        this.resultPanel.html = '';
        this.resultPanel.body.update(this.resultPanel.html);
    },

    /** private: method[drawRoute]
     *  Draw the route in the map
     */
    drawRoute: function (features, projection) {
        extent = null;
        for (var i = 0 ; i < features.length ; i++) {
            features[i].geometry.transform(projection, this.map.getProjectionObject());
            features[i].attributes.type = 'route';

            if (this.recenterMap) {
                if (extent) {
                    extent.extend(features[i].geometry.getBounds());
                }
                else {
                    extent = features[i].geometry.getBounds();
                }
            }
        }
        if (this.routeFeatures) {
            this.layer.removeFeatures(this.routeFeatures);
        }
        this.routeFeatures = features;

        this.layer.addFeatures(this.routeFeatures);
        this.map.zoomToExtent(extent);
    }
});

/** api: xtype = gxux_routingpanel */
Ext.reg('gxux_routingpanel', GeoExt.ux.RoutingPanel);
