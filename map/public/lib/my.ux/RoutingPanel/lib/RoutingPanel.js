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
 * @requires RoutingPanel/lib/Providers.js
 */

Ext.namespace('GeoExt.ux');


GeoExt.ux.RoutingPanel = Ext.extend(Ext.Panel, {
            
    /** api: config[map]
     *  ``OpenLayers.Map``  A configured map
     */
    /** private: property[map]
     *  ``OpenLayers.Map``  The map object
     */
    map: null,

    start: {
        /** api: config[start.locationCombo]
         *  ``Ext.form.ComboBox``  The combo box used for searching the start point
         */
        /** private: property[start.locationCombo]
         *  ``Ext.form.ComboBox``  The combo box used for searching the start point
         */
        locationCombo: null,

        /** property[start.feature]
         *  ``OpenLayers.Feature.Vector`` Point feature storing the start point, if digitized by the user.
         */
        feature: null
    },

    end: {
        /** api: config[end.locationCombo]
         *  ``Ext.form.ComboBox``  The combo box used for searching the end point
         */
        /** private: property[end.locationCombo]
         *  ``Ext.form.ComboBox``  The combo box used for searching the end point
         */
        locationCombo: null,

        /** property[end.feature]
         *  ``OpenLayers.Feature.Vector`` Point feature storing the end point, if digitized by the user.
         */
        feature: null
    },

    /** api: config[routingProviders]
     *  options givent to the routingService function.
     */
    routingProviders: null,

    /** api: config[routingProjection]
     *  zhe projection used for the display and the permalink.
     */
    routingProjection: new OpenLayers.Projection("EPSG:4326"),

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

    /** private: property[pointDrawControl]
     *  ``OpenLayers.Control.DrawFeature`` Control to get start and end feature
     */
    pointDrawControl: null,

    /**
     * property[resultPanel]
     * ``Ext.Panel`` Panel presenting the computation result
     */
    resultPanel: null,

    /**
     * private: property[stateEvents]
     * ``Array(String)`` Array of state events
     */
    stateEvents: ["routingcomputed", "pointadded"],

    /**
     * private: property[state]
     * ``Map`` Acctual routing state
     */
    state: {},

    /**
     * api: config[geocodingProvider]
     */
    geocodingProviders: null,

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

    /** private: method[constructor]
     *  Construct the component.
     */
    constructor: function(config) {
        GeoExt.ux.RoutingPanel.superclass.constructor.call(this, Ext.apply({stateId: 'routing'}, config));
    },

    /** private: method[initComponent]
     *  Private initComponent override.
     *  Create two events:
     *  - routingcomputed
     *  - beforeroutingcomputed
     */
    initComponent: function () {
        if (!this.routingProviders) {
            this.routingProviders = {
                yours: GeoExt.ux.RoutingProviders.getYOURSRoutingProvider()
            }
        }
        if (!this.geocodingProviders) {
            this.geocodingProviders = {
                builder: GeoExt.ux.RoutingProviders.nominatimSearchCombo,
                projection: new OpenLayers.Projection("EPSG:4326")
            }
        }

        this.start.locationCombo = this.geocodingProviders.builder(Ext.apply({
            name: 'startLocationCombo',
            emptyText: OpenLayers.i18n('Search start...'),
            width: 195,
            map: this.map,
            listeners: {
                select: function (combo, record, index) {
                    if (this.startFeature) {
                        this.layer.removeFeatures([this.startFeature]);
                        this.startFeature = null;
                    }
                    var geometry = combo.getCentroid(record.data);
                    this.startFeature = new OpenLayers.Feature.Vector(geometry, {type: 'point'});
                    this.layer.addFeatures([this.startFeature]);
                },
                scope: this
            }
        }, this.geocodingProviders));
        this.end.locationCombo = this.geocodingProviders.builder(Ext.apply({
            name: 'endLocationCombo',
            emptyText: OpenLayers.i18n('Search end...'),
            width: 195,
            map: this.map,
            listeners: {
                select: function (combo, record, index) {
                    if (this.endFeature) {
                        this.layer.removeFeatures([this.endFeature]);
                    }
                    var geometry = combo.getCentroid(record.data);
                    this.endFeature = new OpenLayers.Feature.Vector(geometry, {type: 'point'});
                    this.layer.addFeatures([this.endFeature]);
                },
                scope: this
            }
        }, this.geocodingProviders));

        this.resultPanel = new Ext.Panel({
            border: false,
            autoScroll: true,
            height: 400
        });

        var lanes = [{
            layout: 'column',
            border: false,
            fieldLabel: OpenLayers.i18n('From'),
            items: [
                this.start.locationCombo,
                {
                    xtype: 'button',
                    text: OpenLayers.i18n('Get Point'),
                    handler: function (button, event) {
                        this.createDrawFeature();
                        this.pointDrawControl.point = this.start;
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
                this.end.locationCombo,
                {
                    xtype: 'button',
                    text: OpenLayers.i18n('Get Point'),
                    handler: function (button, event) {
                        this.createDrawFeature();
                        this.pointDrawControl.point = this.end;
                        this.pointDrawControl.activate();
                    },
                    scope: this
                }
            ]
        }];
        lanes.push({
            baseCls: 'x-plane',
            html: '<h3>' + OpenLayers.i18n('Compute itinerary') + '</h3>',
            bodyStyle: 'padding: 2px 5px 0 0;'
        });
        for (var providerRef in this.routingProviders) {
            var itinaryItems = [];
            var provider = this.routingProviders[providerRef];
            provider.ref = providerRef;
            lanes.push({
                cls: 'x-plane',
                html: provider.name,
                style: 'clear: booth;',
                border: false
            });
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
            lanes.push({
                layout: 'column',
                border: false,
                bodyStyle: 'padding: 3px 0 10px 0;',
                items: itinaryItems
            });
        }
        lanes.push(this.resultPanel);
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
                items: lanes
            }]
        });
        GeoExt.ux.RoutingPanel.superclass.initComponent.apply(this, arguments);

        this.addEvents(
            /**
             * api: event[routingcomputed]
             * Fires when a routing has been computed
             *
             * Listener arguments:
             * * comp - :class:`GeoExt.ux.RoutingPanel`` This component.
             */
            'routingcomputed',

            /**
             * api: event[beforeroutingcomputed]
             * Fires when before a routing is computed
             *
             * Listener arguments:
             * * comp - :class:`GeoExt.ux.RoutingPanel`` This component.
             */
            'beforeroutingcomputed',

            /**
             * api: event[destinationadded]
             * Fires when a routing point is added.
             */
            'pointadded'
        );

    },

    /** private: method[afterRender]
     *  Private afterRender override.
     */
    afterRender: function () {
        GeoExt.ux.RoutingPanel.superclass.afterRender.call(this);

        this.readPermalink();
    },

    createDrawFeature: function() {
        if (!this.layer) {
            // Create routing layer
            this.layer = new OpenLayers.Layer.Vector("Routing", {styleMap: this.style, displayInLayerSwitcher: false});
            this.map.addLayer(this.layer);
        }

        if (!this.pointDrawControl) {
            // Create point draw control
            this.pointDrawControl = new OpenLayers.Control.DrawFeature(this.layer, OpenLayers.Handler.Point);
            this.map.addControl(this.pointDrawControl);
            this.pointDrawControl.events.on({
                featureadded: function (events) {
                    var featureLocation = null;
                    var point = this.pointDrawControl.point;
                    events.feature.attributes.type = 'point';
                    events.feature.layer.drawFeature(events.feature);
                    this.pointDrawControl.type = null;
                    
                    if (point.feature) {
                        this.layer.removeFeatures([point.feature]);
                    }
                    point.feature = events.feature;
                    featureLocation = point.feature.geometry.clone();
                    featureLocation.transform(this.map.getProjectionObject(), this.routingProjection);
                    point.locationCombo.emptyText = OpenLayers.i18n('Position: ') + Math.round(featureLocation.x * 100000) / 100000 + ',' + Math.round(featureLocation.y * 100000) / 100000;
                    point.locationCombo.clearValue();
                    this.pointDrawControl.deactivate();
                    this.fireEvent('pointadded', this);
                },
                scope: this
            });
        }
    },

    /** private: method[getItinerary]
     *  Compute the itinerary and assign the results
     */
    getItinerary: function (provider, type) {
        this.fireEvent('beforeroutingcomputed', this);
        this.resultPanel.html = OpenLayers.i18n('Computation ongoing....');

        this.state.provider = provider.ref;
        this.state.type = type;

        if (this.resultPanel.body) {
            this.resultPanel.body.update(this.resultPanel.html);
        }
        var start = this.start.feature.geometry.clone().transform(this.map.getProjectionObject(), provider.projection);
        var end = this.end.feature.geometry.clone().transform(this.map.getProjectionObject(), provider.projection);
        provider.service(provider, type, start, end,
            function (succed, html, features) {
                if (succed) {
                    this.drawRoute(features, provider.projection);
                    var googleLinks = '';
                    if (this.showGoogleItinerary) {
                        var start = this.start.feature.geometry.clone().transform(this.map.getProjectionObject(), this.routingProjection);
                        var end = this.end.feature.geometry.clone().transform(this.map.getProjectionObject(), this.routingProjection);
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
        this.start.locationCombo.clearValue();
        this.end.locationCombo.clearValue();
        if (this.start.feature) {
            this.layer.removeFeatures([this.start.feature]);
            this.start.feature = null;
        }
        if (this.end.feature) {
            this.layer.removeFeatures([this.end.feature]);
            this.end.feature = null;
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
    },

    /** private: method[setPermalink]
     *  Set the permalink according to the url parameters
     *
     * :param parameters URL paramaters
     */
    readPermalink: function () {
    },

    /** private: method[applyStatePoint]
     *
     *  Apply the state to a point.
     */
    applyStatePoint: function(point, lon, lat) {
        if (!this.layer) {
            // Create routing layer
            this.layer = new OpenLayers.Layer.Vector("Routing", {styleMap: this.style, displayInLayerSwitcher: false});
            this.map.addLayer(this.layer);
        }
        var geometry = new OpenLayers.Geometry.Point(lon, lat);
        geometry = geometry.transform(this.geocodingProviders.projection, this.map.getProjectionObject());
        point.feature = new OpenLayers.Feature.Vector(geometry, {type: 'point'});
        this.layer.addFeatures([point.feature]);

        point.locationCombo.emptyText = OpenLayers.i18n('Position: ') + lon + ', ' + lat;
        point.locationCombo.clearValue();
    },
    
    /** private: method[applyState]
     *  :param state: ``Object`` The state to apply.
     *
     *  Apply the state provided as an argument.
     */
    applyState: function(state) {
        var state = Ext.state.Manager.get(this.getStateId());
        if (!state) {
            return;
        }
        if (state.start_lon && state.start_lat) {
            this.applyStatePoint(this.start, state.start_lon, state.start_lat)
        }
        if (state.end_lon && state.end_lat) {
            this.applyStatePoint(this.end, state.end_lon, state.end_lat)
        }
        if (state.start_lon && state.start_lat && state.end_lon && state.end_lat
                && state.provider && state.type) {
            this.getItinerary(this.routingProviders[state.provider], state.type); // should be stored in permalink
        }
        if (state.start_text) {
            this.start.locationCombo.setValue(state.start_text);
        }
        if (state.end_text) {
            this.end.locationCombo.setValue(state.end_text);
        }
    },

    /** private: method[getState]
     *  :return:  ``Object`` The state.
     *
     *  Returns the current state for the map panel.
     */
    getState: function() {
        var state = {};

        if (this.start.feature) {
            var geometry = this.start.feature.geometry.clone().transform(this.map.getProjectionObject(), this.geocodingProviders.projection);
            state['start_lon'] = Math.round(geometry.x * 100000) / 100000;
            state['start_lat'] = Math.round(geometry.y * 100000) / 100000;
            state['start_text'] = this.start.locationCombo.getValue();
        }
        if (this.end.feature) {
            var geometry = this.end.feature.geometry.clone().transform(this.map.getProjectionObject(), this.geocodingProviders.projection);
            state['end_lon'] = Math.round(geometry.x * 100000) / 100000;
            state['end_lat'] = Math.round(geometry.y * 100000) / 100000;
            state['end_text'] = this.end.locationCombo.getValue();
        }
        state.provider = this.state.provider;
        state.type = this.state.type;

        return state;
    }
});

/** api: xtype = gxux_routingpanel */
Ext.reg('gxux_routingpanel', GeoExt.ux.RoutingPanel);
