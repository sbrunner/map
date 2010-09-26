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

GeoExt.ux.RoutingPanel = Ext.extend(Ext.form.FormPanel, {

    /** api: config[map]
     *  ``OpenLayers.Map``  A configured map
     */
    /** private: property[map]
     *  ``OpenLayers.Map``  The map object
     */
    map: null,

    /** api: config[startLocationCombo]
     *  ``Ext.form.ComboBox``  The combo box used for searching the start point
     *  In order to work, the combo needs to have a propoerty locationString: lat,lon (WGS 84, example: locationString: '47.25976,9.58423') assigned depending of the searched position
     *  See geocoding_type for the proposed combo.
     */
    /** private: property[startLocationCombo]
     *  ``Ext.form.ComboBox``  The combo box used for searching the start point
     */
    startLocationCombo: null,

    /** api: config[endLocationCombo]
     *  ``Ext.form.ComboBox``  The combo box used for searching the end point
     *  In order to work, the combo needs to have a propoerty locationString: lat,lon (WGS 84, example: locationString: '47.25976,9.58423') assigned depending of the searched position
     *  See geocoding_type for the proposed combo.
     */
    /** private: property[endLocationCombo]
     *  ``Ext.form.ComboBox``  The combo box used for searching the end point
     */
    endLocationCombo: null,

    /** private: property[proxy]
     *  ``Ext.data.ScriptTagProxy``  Proxy to make the search request
     */
    proxy: null,

    /** private: property[proxy]
     *  ``Ext.data.Store``  Store for toring the routing results
     */
    routingStore: null,

    /** api: config[routingServiceType]
     *  Type of routing service used for the computation. Per default: 'cloudmade'
     */
    /** private: property[routingServiceType]
     *  Type of routing service used for the computation
     */
    routingServiceType: 'cloudmade',

    /** property[routingVersionCloudmade]
     *  Routing version of the routing service, available after an itinerary computation
     *  See http://developers.cloudmade.com/wiki/routing-http-api/Response_structure
     *  Cloudmade specific
     */
    routingVersionCloudmade: null,

    /** property[routingStatusCloudmade]
     *  Routing status of the routing service, available after an itinerary computation
     *  See http://developers.cloudmade.com/wiki/routing-http-api/Response_structure
     *  Cloudmade specific
     */
    routingStatusCloudmade: null,

    /** property[routingStatusMessageCloudmade]
     *  Routing status message of the routing service, available after an itinerary computation
     *  See http://developers.cloudmade.com/wiki/routing-http-api/Response_structure
     *  Cloudmade specific
     */
    routingStatusMessageCloudmade: null,

    /** property[routingRouteSummaryCloudmade]
     *  Routing route summary of the routing service, available after an itinerary computation
     *  See http://developers.cloudmade.com/wiki/routing-http-api/Response_structure
     *  Cloudmade specific
     */
    routingRouteSummaryCloudmade: null,

    /** property[routingRouteGeometryCloudmade]
     *  Routing route geometry of the routing service, available after an itinerary computation
     *  See http://developers.cloudmade.com/wiki/routing-http-api/Response_structure
     *  Cloudmade specific
     */
    routingRouteGeometryCloudmade: null,

    /** property[routingRouteInstructionsCloudmade]
     *  Routing route instruction of the routing service, available after an itinerary computation
     *  See http://developers.cloudmade.com/wiki/routing-http-api/Response_structure
     *  Cloudmade specific
     */
    routingRouteInstructionsCloudmade: null,

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

    /** api: config[cloudmadeKey]
     *  Cloudmade key used for the routing and geocoding services
     *  Cloudmade specific
     */
    cloudmadeKey: null,

    /** api: config[geocodingType]
     *  Geocoding type. Per default: 'cloudmade'. Can also be 'geonames' or 'openaddresses'.
     */
    /** private: property[geocodingType]
     *  Geocoding type. Per default: 'cloudmade'. Can also be 'geonames' or 'openaddresses'.
     */
    geocodingType: 'cloudmade',

    /** private: property[geocodingQueryParam]
     *  Geocoding query param used for cloudmade geocoding service. Per default: 'query'
     */
    geocodingQueryParam: 'query',

    /** api: config[geocodingMaxRows]
     *  Maximum number of rows returned by the cloudmade geocoding service. Per default: 20
     */
    /** private: property[geocodingMaxRows]
     *  Maximum number of rows returned by the cloudmade geocoding service. Per default: 20
     */
    geocodingMaxRows: 20,

    /** private: property[geocodingUrl]
     *  Geocoding url of the cloudmade geocoding service.
     */
    geocodingUrl: null,

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
        "default": new OpenLayers.Style({
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

    /** api: config[readPermalink]
     *  ``Boolean``  Read the permalink in the url if presents
     */
    /** private: property[readPermalink]
     *  ``Boolean``  Read the permalink in the url if presents
     */
    readPermalink: true,

    /** private: method[initComponent]
     *  Private initComponent override.
     *  Create two events:
     *  - routingcomputed
     *  - beforeroutingcomputed
     */
    initComponent : function() {
        var defConfig = {
            plain: true,
            border: false
        };

        Ext.applyIf(this, defConfig);

        // Create cloudmade geocoding serach combo
        if (this.geocodingType == 'cloudmade') {
            this.geocodingUrl = 'http://geocoding.cloudmade.com/' + this.cloudmadeKey + '/geocoding/v2/find.js?results=' + this.geocodingMaxRows + '&return_geometry=false';
            this.startLocationCombo = new Ext.form.ComboBox({
                fieldLabel: OpenLayers.i18n('A'),
                name: 'startLocationCombo',
                emptyText: OpenLayers.i18n('Search start...'),
                minChars: 1,
                queryDelay: 50,
                hideTrigger: true,
                charset: 'UTF8',
                forceSelection: true,
                displayField: 'name',
                queryParam: this.geocodingQueryParam,
                tpl: '<tpl for="."><div class="x-combo-list-item"><h1>{name}</h1></div></tpl>',
                store: new Ext.data.Store({
                    proxy: new Ext.data.ScriptTagProxy({
                        url: this.geocodingUrl,
                        method: 'GET'
                    }),
                    reader: new Ext.data.JsonReader({
                        totalProperty: "found",
                        root: "features",
                        fields: [
                            {
                                name: 'name',
                                mapping: 'properties.name'
                            },
                            {
                                name: 'centroid'
                            }
                        ]
                    })
                }),
                listeners: {
                    "select": function(combo, record, index) {
                        if (this.routingStartFeature) {
                            this.routingLayer.removeFeatures([this.routingStartFeature]);
                        }
                        this.startLocationCombo.locationString = record.data.centroid.coordinates[0] + ',' + record.data.centroid.coordinates[1];
                    },
                    scope: this
                }
            });

            this.endLocationCombo = new Ext.form.ComboBox({
                fieldLabel: OpenLayers.i18n('B'),
                name: 'endLocationCombo',
                emptyText: OpenLayers.i18n('Search end...'),
                minChars: 1,
                queryDelay: 50,
                hideTrigger: true,
                charset: 'UTF8',
                forceSelection: true,
                displayField: 'name',
                queryParam: this.geocodingQueryParam,
                tpl: '<tpl for="."><div class="x-combo-list-item"><h1>{name}</h1></div></tpl>',
                store: new Ext.data.Store({
                    proxy: new Ext.data.ScriptTagProxy({
                        url: this.geocodingUrl,
                        method: 'GET'
                    }),
                    reader: new Ext.data.JsonReader({
                        totalProperty: "found",
                        root: "features",
                        fields: [
                            {
                                name: 'name',
                                mapping: 'properties.name'
                            },
                            {
                                name: 'centroid'
                            }
                        ]
                    })
                }),
                listeners: {
                    "select": function(combo, record, index) {
                        if (this.routingEndFeature) {
                            this.routingLayer.removeFeatures([this.routingEndFeature]);
                        }
                        this.endLocationCombo.locationString = record.data.centroid.coordinates[0] + ',' + record.data.centroid.coordinates[1];
                    },
                    scope: this
                }
            });
        }

        // Create geonames search combo
        if (this.geocodingType == 'geonames') {
            this.startLocationCombo = new GeoExt.ux.GeoNamesSearchCombo({
                fieldLabel: OpenLayers.i18n('A'),
                emptyText: OpenLayers.i18n('Search location in Geonames'),
                loadingText: OpenLayers.i18n('Search in Geonames...'),
                map: this.map,
                zoom: 15,
                width: 150
            });
            this.startLocationCombo.on(
                    "select", function(combo, record, index) {
                if (this.routingStartFeature) {
                    this.routingLayer.removeFeatures([this.routingStartFeature]);
                }
                this.startLocationCombo.locationString = record.data.lat + ',' + record.data.lng;
            }, this
                    );


            this.endLocationCombo = new GeoExt.ux.GeoNamesSearchCombo({
                fieldLabel: OpenLayers.i18n('B'),
                emptyText: OpenLayers.i18n('Search location in Geonames'),
                loadingText: OpenLayers.i18n('Search in Geonames...'),
                map: this.map,
                zoom: 15,
                width: 150
            });
            this.endLocationCombo.on("select", function(combo, record, index) {
                if (this.routingEndFeature) {
                    this.routingLayer.removeFeatures([this.routingEndFeature]);
                }
                this.endLocationCombo.locationString = record.data.lat + ',' + record.data.lng;
            }, this);
        }

        // Create openaddresses search combo
        if (this.geocodingType == 'openaddresses') {
            this.startLocationCombo = new GeoExt.ux.OpenAddressesSearchCombo({
                fieldLabel: OpenLayers.i18n('A'),
                map: this.map,
                zoom: 18
            });
            this.startLocationCombo.on(
                    "select", function(combo, record, index) {
                if (this.routingStartFeature) {
                    this.routingLayer.removeFeatures([this.routingStartFeature]);
                }
                this.startLocationCombo.locationString = record.data.geometry.coordinates[1] + ',' + record.data.geometry.coordinates[0];
            }, this
                    );


            this.endLocationCombo = new GeoExt.ux.OpenAddressesSearchCombo({
                fieldLabel: OpenLayers.i18n('B'),
                map: this.map,
                zoom: 18
            });
            this.endLocationCombo.on("select", function(combo, record, index) {
                if (this.routingEndFeature) {
                    this.routingLayer.removeFeatures([this.routingEndFeature]);
                }
                this.endLocationCombo.locationString = record.data.geometry.coordinates[1] + ',' + record.data.geometry.coordinates[0];
            }, this);
        }

        // Create routing result panel
        this.routingResultPanel = new Ext.Panel({
            border: false,
            html: '',
            bodyStyle: 'padding: 5px;'
        });

        // Set default location string
        if (!this.startLocationCombo.locationString) {
            this.startLocationCombo.locationString = '47.25976,9.58423';
        }
        if (!this.endLocationCombo.locationString) {
            this.endLocationCombo.locationString = '47.26117,9.59882';
        }

        // Create items of routing panel
        this.items = [
            {
                layout: 'form',
                border: false,
                labelWidth: 10,
                items: [
                    {
                        layout: 'column',
                        border: false,
                        defaults: {
                            layout: 'form',
                            border: false,
                            labelWidth: 10,
                            bodyStyle: 'padding: 5px 0 0 5px'
                        },
                        items: [
                            {
                                columnWidth: 0.75,
                                defaults: {
                                    anchor: '100%'
                                },
                                items: [
                                    this.startLocationCombo
                                ]
                            },
                            {
                                columnWidth: 0.25,
                                items: [
                                    {
                                        xtype: 'button',
                                        text: OpenLayers.i18n('Get Point'),
                                        handler: function(button, event) {
                                            this.routingPointDrawControl.type = 'GetStartPoint';
                                            this.routingPointDrawControl.activate();
                                        },
                                        scope: this
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        layout: 'column',
                        border: false,
                        defaults: {
                            layout: 'form',
                            border: false,
                            labelWidth: 10,
                            bodyStyle: 'padding: 0 0 0 5px;'
                        },
                        items: [
                            {
                                columnWidth:0.75,
                                defaults:{
                                    anchor: '100%'
                                },
                                items: [
                                    this.endLocationCombo
                                ]
                            },
                            {
                                columnWidth:0.25,
                                items: [
                                    {
                                        xtype: 'button',
                                        text: OpenLayers.i18n('Get Point'),
                                        handler: function(button, event) {
                                            this.routingPointDrawControl.type = 'GetEndPoint';
                                            this.routingPointDrawControl.activate();
                                        },
                                        scope: this
                                    }
                                ]
                            }
                        ]
                    }
                ]
            },
            {
                layout: 'column',
                border: false,
                items: [
                    {
                        columnWidth: 1,
                        layout: 'column',
                        border: false,
                        bodyCfg: {tag: 'center'},
                        defaults: {
                            bodyStyle: 'padding: 0 5px 0 0'
                        },
                        items: [
                            {
                                baseCls: 'x-plane',
                                html: OpenLayers.i18n('Compute itinerary: ')
                            },
                            {
                                xtype: 'button',
                                text: OpenLayers.i18n('By car'),
                                handler: function() {
                                    this.getItinerary('car');
                                },
                                scope: this
                            },
                            {
                                xtype: 'button',
                                text: OpenLayers.i18n('By foot'),
                                handler: function() {
                                    this.getItinerary('foot');
                                },
                                scope: this
                            },
                            {
                                xtype: 'button',
                                text: OpenLayers.i18n('By bicycle'),
                                handler: function() {
                                    this.getItinerary('bicycle');
                                },
                                scope: this
                            }
                        ]
                    }
                ]

            },
            {
                border: false,
                items: [
                    this.routingResultPanel
                ]
            }

        ];

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


        GeoExt.ux.RoutingPanel.superclass.initComponent.call(this);
    },

    /** private: method[afterRender]
     *  Private afterRender override.
     */
    afterRender: function() {
        GeoExt.ux.RoutingPanel.superclass.afterRender.call(this);

        // Create routing layer
        if (!this.routingLayer) {
            this.routingLayer = new OpenLayers.Layer.Vector("Routing", {styleMap: this.vectorStyle});
        }
        this.map.addLayer(this.routingLayer);

        // Create point draw control
        this.routingPointDrawControl = new OpenLayers.Control.DrawFeature(this.routingLayer, OpenLayers.Handler.Point);
        this.map.addControl(this.routingPointDrawControl);
        this.routingPointDrawControl.events.on({ "featureadded": function(events) {
            var featureLocation = null;
            if (this.routingPointDrawControl.type == 'GetStartPoint') {
                if (this.routingStartFeature) {
                    this.routingLayer.removeFeatures([this.routingStartFeature]);
                    this.routingStartFeature = null;
                }
                this.routingStartFeature = events.feature;
                featureLocation = this.routingStartFeature.geometry.clone();
                featureLocation.transform(this.map.getProjectionObject(), this.routingProjection);
                this.startLocationCombo.locationString = featureLocation.y + ',' + featureLocation.x;
                this.startLocationCombo.emptyText = OpenLayers.i18n('Position: ') + Math.round(featureLocation.y * 100000) / 100000 + ',' + Math.round(featureLocation.x * 100000) / 100000;
                this.startLocationCombo.clearValue();
            }
            if (this.routingPointDrawControl.type == 'GetEndPoint') {
                if (this.routingEndFeature) {
                    this.routingLayer.removeFeatures([this.routingEndFeature]);
                    this.routingEndFeature = null;
                }
                this.routingEndFeature = events.feature;
                featureLocation = this.routingEndFeature.geometry.clone();
                featureLocation.transform(this.map.getProjectionObject(), this.routingProjection);
                this.endLocationCombo.locationString = featureLocation.y + ',' + featureLocation.x;
                this.endLocationCombo.emptyText = OpenLayers.i18n('Position: ') + Math.round(featureLocation.y * 100000) / 100000 + ',' + Math.round(featureLocation.x * 100000) / 100000;
                this.endLocationCombo.clearValue();
            }
            this.routingPointDrawControl.deactivate();
        },
            scope: this
        });
        // Use the permalink
        if (this.readPermalink) {
            var parameters = OpenLayers.Util.getParameters();
            this.setPermalink(parameters);
        }
    }
    ,

    /** method[getPermalink]
     *  Create the permalink
     *
     * :param complete ``Boolean`` Defines if the complete URL is generated or only the parameters KVP
     */
    getPermalink: function(complete) {
        var permalink;
        if (complete) {
            permalink = window.location.href;
            if (OpenLayers.String.contains(permalink, '?')) {
                var end = permalink.indexOf('?');
                permalink = permalink.substring(0, end);
            }
            permalink = permalink + "?";
        } else {
            permalink = '';
        }

        permalink = permalink + "routingReadPermalink=" + this.readPermalink;
        permalink = permalink + "&routingRecenterMap=" + this.routingRecenterMap;

        if (this.startLocationCombo.locationString && this.routingPathFeature) {
            permalink = permalink + "&routingStartLocationString=" + this.startLocationCombo.locationString;
        }
        if (this.endLocationCombo.locationString && this.routingPathFeature) {
            permalink = permalink + "&routingEndLocationString=" + this.endLocationCombo.locationString;
        }
        if (this.startLocationCombo.value) {
            permalink = permalink + "&routingStartLocationValue=" + this.startLocationCombo.value;
        }
        if (this.endLocationCombo.value) {
            permalink = permalink + "&routingEndLocationValue=" + this.endLocationCombo.value;
        }
        if (this.startLocationCombo.emptyText.indexOf(OpenLayers.i18n('Position: ')) > -1) {
            permalink = permalink + "&routingStartLocationEmptyText=" + this.startLocationCombo.emptyText;
        }
        if (this.endLocationCombo.emptyText.indexOf(OpenLayers.i18n('Position: ')) > -1) {
            permalink = permalink + "&routingEndLocationEmptyText=" + this.endLocationCombo.emptyText;
        }
        if (this.map && !this.routingRecenterMap) {
            permalink = permalink + "&routingeasting=" + this.map.getCenter().lon;
            permalink = permalink + "&routingnorthing=" + this.map.getCenter().lat;
            permalink = permalink + "&routingzoom=" + this.map.getZoom();
        }
        return permalink;
    }
    ,

    /** private: method[setPermalink]
     *  Set the permalink according to the url parameters
     *
     * :param parameters URL paramaters
     */
    setPermalink: function(parameters) {
        if (parameters.routingReadPermalink) {
            this.readPermalink = this.stringToBoolean(parameters.routingReadPermalink);
        }
        if (parameters.routingRecenterMap) {
            this.routingRecenterMap = this.stringToBoolean(parameters.routingRecenterMap);
        }
        if (parameters.routingStartLocationString) {
            this.startLocationCombo.locationString = parameters.routingStartLocationString[0] + "," + parameters.routingStartLocationString[1];
        }
        if (parameters.routingEndLocationString) {
            this.endLocationCombo.locationString = parameters.routingEndLocationString[0] + "," + parameters.routingEndLocationString[1];
        }
        if (parameters.routingStartLocationString && parameters.routingEndLocationString) {
            this.getItinerary();
        }
        if (parameters.routingeasting && parameters.routingnorthing) {
            var position = new OpenLayers.LonLat(parseFloat(parameters.routingeasting), parseFloat(parameters.routingnorthing));
            if (this.map) {
                this.map.setCenter(position);
            }
        }
        if (parameters.routingzoom) {
            if (this.map) {
                this.map.zoomTo(parseInt(parameters.routingzoom, 10));
            }
        }
        if (parameters.routingStartLocationValue) {
            this.startLocationCombo.setValue(parameters.routingStartLocationValue);
        }
        if (parameters.routingEndLocationValue) {
            this.endLocationCombo.setValue(parameters.routingEndLocationValue);
        }
        if (parameters.routingStartLocationEmptyText) {
            this.startLocationCombo.emptyText = parameters.routingStartLocationEmptyText.toString();
        }
        if (parameters.routingEndLocationEmptyText) {
            this.endLocationCombo.emptyText = parameters.routingEndLocationEmptyText.toString();
        }
    },

    /** private: method[stringToBoolean]
     *  Transform a string (true, false, yes, no 1 or 0) to a boolean
     *
     * :param string
     */
    stringToBoolean: function(string) {
        switch (string.toLowerCase()) {
            case "true": case "yes": case "1": return true;
            case "false": case "no": case "0": case null: return false;
            default: return Boolean(string);
        }
    },

    /** private: method[getItinerary]
     *  Compute the itinerary and assign the results
     */
    getItinerary: function(route_typeCloudmade) {
        if (this.routingServiceType == 'cloudmade') {
            
            this.fireEvent('beforeroutingcomputed', this);
            this.routingResultPanel.html = OpenLayers.i18n('Computation ongoing....');
            if (this.routingResultPanel.body) {
                this.routingResultPanel.body.update(this.routingResultPanel.html);
            }
            //http://routes.cloudmade.com/BC9A493B41014CAABB98F0471D759707/api/0.3/47.25976,9.58423,47.26117,9.59882/car/shortest.js
            var newUrl = this.startLocationCombo.locationString + ',' + this.endLocationCombo.locationString;
            newUrl = newUrl + "/" + route_typeCloudmade + ".js?lang=" + OpenLayers.Lang.getCode();
            this.proxy = new Ext.data.ScriptTagProxy({
                url: "http://routes.cloudmade.com/" + this.cloudmadeKey + "/api/0.3/" + newUrl,
                nocache: false
            });
            this.routingStore = new Ext.data.Store({
                proxy: this.proxy,
                reader: new Ext.data.JsonReader({
                    root: 'version',
                    fields: [
                        {
                            name: 'total_length'
                        }
                    ]

                })
            });

            this.routingStore.on(
                    'load', function(store) {
                this.routingVersionCloudmade = store.reader.jsonData.version;
                this.routingStatusCloudmade = store.reader.jsonData.status;
                if (store.reader.jsonData.status_message) {
                    this.routingStatusMessageCloudmade = store.reader.jsonData.status_message;
                }
                if (store.reader.jsonData.route_summary) {
                    this.routingRouteSummaryCloudmade = store.reader.jsonData.route_summary;
                }
                if (store.reader.jsonData.route_geometry) {
                    this.routingRouteGeometryCloudmade = store.reader.jsonData.route_geometry;
                }
                if (store.reader.jsonData.route_instructions) {
                    this.routingRouteInstructionsCloudmade = store.reader.jsonData.route_instructions;
                }
                if (this.routingStatusCloudmade == '0') {
                    this.drawRoute();
                    
                    var instructions = '';
                    var first = true;
                    for (var i = 0 ; i < this.routingRouteInstructionsCloudmade.length ; i++) {
                        if (first) { first = false }
                        else { instructions += '<br />' }
                        instructions += this.routingRouteInstructionsCloudmade[i][0] + ' (' + this.routingRouteInstructionsCloudmade[i][4] + ').';
                    }
                    
                    var googleLinks = ''
                    if (this.showGoogleItinerary) {
                        var googleLinks = '<a href="http://maps.google.com/maps?source=s_d&saddr=' + this.startLocationCombo.locationString + '&daddr=' + this.endLocationCombo.locationString + '&dirflg=a" target="new">' + OpenLayers.i18n('Google Itinerary by car') + '</a><br><a href="http://maps.google.com/maps?source=s_d&saddr=' + this.startLocationCombo.locationString + '&daddr=' + this.endLocationCombo.locationString + '&dirflg=r" target="new">' + OpenLayers.i18n('Google Itinerary by public transport') + '</a><br><a href="http://maps.google.com/maps?source=s_d&saddr=' + this.startLocationCombo.locationString + '&daddr=' + this.endLocationCombo.locationString + '&dirflg=w" target="new">' + OpenLayers.i18n('Google Itinerary on foot') + '</a>';
                    }
                    
                    this.routingResultPanel.html = '<p>' + instructions + '</p><p>' + OpenLayers.i18n('Total length: ') + Math.round(this.routingRouteSummaryCloudmade.total_distance / 1000) + ' [km]</p><p>' + googleLinks + '</p>';
                    if (this.routingResultPanel.body) {
                        this.routingResultPanel.body.update(this.routingResultPanel.html);
                    }
                } else {
                    this.routingResultPanel.html = this.routingStatusMessageCloudmade;
                    if (this.routingResultPanel.body) {
                        this.routingResultPanel.body.update(this.routingResultPanel.html);
                    }
                }
                this.fireEvent('routingcomputed', this);
            }, this);
            this.routingStore.load();
        } else {
            alert('Routing service: ' + this.routingServiceType + ' not supported. Patch welcome !');
        }
    },

    /** private: method[clearItinerary]
     *  Clear the itinerary the itinerary and assign the results
     */
    clearItinerary: function() {
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
    drawRoute: function() {
        var pointList = [];

        if (this.routingServiceType == 'cloudmade') {
            var newPoint = null;
            for (var i = 0; i < this.routingRouteGeometryCloudmade.length; i++) {
                newPoint = new OpenLayers.Geometry.Point(this.routingRouteGeometryCloudmade[i][1],
                        this.routingRouteGeometryCloudmade[i][0]);
                newPoint.transform(this.routingProjection,
                        this.map.getProjectionObject());
                pointList.push(newPoint);
            }
        }

        if (this.routingPathFeature) {
            this.routingLayer.removeFeatures([this.routingPathFeature]);
        }
        this.routingPathFeature = new OpenLayers.Feature.Vector(
                new OpenLayers.Geometry.LineString(pointList), null, this.routingStyle);

        this.routingLayer.addFeatures([this.routingPathFeature]);
        if (this.routingRecenterMap) {
            this.map.zoomToExtent(this.routingPathFeature.geometry.bounds);
        }
    }
});

/** api: xtype = gxux_routingpanel */
Ext.reg('gxux_routingpanel', GeoExt.ux.RoutingPanel);
