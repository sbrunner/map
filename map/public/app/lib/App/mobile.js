/**
 * Copyright (c) 2010-2011 The Open Source Geospatial Foundation
 *
 * Published under the BSD license.
 * See http://svn.geoext.org/core/trunk/geoext/license.txt for the full text
 * of the license.
 */
/*
 * @requires App/MobileClasses.js
 * @include OpenLayers/Control/Permalink.js
 * @include OpenLayers/Layer/OSM.js
 */

var init = function () {
    if (initialysed) {
        return;
    }
    else {
        initialysed = true;
    }

    if (!OpenLayers.Lang[lang]) {
        OpenLayers.Lang[lang] = OpenLayers.Util.applyDefaults({});
    }
    OpenLayers.Lang.setCode(lang);
    delete lang;

    /*
     * Setting of OpenLayers global vars.
     */
    OpenLayers.Number.thousandsSeparator = ' ';
    OpenLayers.IMAGE_RELOAD_ATTEMPTS = 3;
    OpenLayers.ProxyHost = "proxy.php?url=";

    document.title = OpenLayers.i18n("Various OSM map - mobile");

    var vector = new OpenLayers.Layer.Vector(OpenLayers.i18n("Location"), {});

    var geolocate = new OpenLayers.Control.Geolocate({
        id: 'locate-control',
        geolocationOptions: {
            enableHighAccuracy: false,
            maximumAge: 0,
            timeout: 7000
        }
    });

    var permalink = new OpenLayers.Control.Permalink({anchor: true, base: window.location.href});
    permalink.createParams = function(center, zoom, layers) {
        center = center || this.map.getCenter();
        var params = OpenLayers.Util.getParameters(this.base);
        if (center) {
            //zoom
            params.m_z = zoom || this.map.getZoom();

            //lon,lat
            var lat = center.lat;
            var lon = center.lon;
            if (this.displayProjection && this.map.getProjectionObject()) {
                var mapPosition = OpenLayers.Projection.transform(
                  { x: lon, y: lat },
                  this.map.getProjectionObject(), this.displayProjection);
                lon = mapPosition.x;
                lat = mapPosition.y;
                params.m_y = Math.round(lat*100000)/100000;
                params.m_x = Math.round(lon*100000)/100000;
            }
        }
        return params;
    };
    var href = window.location.href;
    var argparser = new OpenLayers.Control.ArgParser();
    argparser.setMap = function(map) {
        OpenLayers.Control.prototype.setMap.apply(this, arguments);

        var index = href.indexOf("=");
        if (index < 0) { // short version
            index = href.indexOf("#");
            if (index < 0) {
                return;
            }
            var args = href.substring(index + 1);
            args = args.split("-");

            this.center = new OpenLayers.LonLat(parseFloat(args[0]),
                                                parseFloat(args[1]));
            this.zoom = parseInt(args[2]);
            this.setCenter();

            var model = new Geo.CatalogueModel({
                map: map,
                root: getLayersTree(map)
            });
            for (var i = 3, len = args.length; i + 1 < len; i += 2) {
                var layer = model.getLayerNodeByRef(args[i]);
                if (layer) {
                    layer.opacity = parseInt(args[i + 1]) / 100.0;
                    model.addLayer(layer);
                }
            }

            var controls = map.getControlsByClass("OpenLayers.Control.Permalink");
            for (var i = 0, len = controls.length; i < len; i++) {
                controls[i].base = href.substring(0, index);
            }
            return;
        }

        var args = this.getParameters(window.location.href);
        // Be careful to set layer first, to not trigger unnecessary layer loads
        if (args.c_layers) {
            var model = new Geo.CatalogueModel({
                map: map,
                root: getLayersTree(map)
            });
            for (var i = 0, len = args.c_layers.length; i < len; i++) {
                var layer = model.getLayerNodeByRef(args.c_layers[i]);
                if (args['m_o_' + args.c_layers[i]]) {
                    layer.opacity = args['m_o_' + args.c_layers[i]];
                }
                model.addLayer(layer);
            }
        }
        else {
            map.addLayer(new OpenLayers.Layer.OSM(OpenLayers.i18n("OpenStreetMap"), null, {
                transitionEffect: 'resize', isBaseLayer: false
            }));
        }
        if (args.m_x && args.m_x) {
            this.center = new OpenLayers.LonLat(parseFloat(args.m_x),
                                                parseFloat(args.m_y));
            if (args.m_z) {
                this.zoom = parseInt(args.m_z);
            }
            this.setCenter();
        }
    },

    // create map
    map = new OpenLayers.Map({
        div: "map",
        theme: null,
        projection: sm,
        displayProjection: gg,
        units: "m",
        numZoomLevels: 18,
        maxResolution: 156543.0339,
        maxExtent: new OpenLayers.Bounds(
            -20037508.34, -20037508.34, 20037508.34, 20037508.34
        ),
        controls: [
            permalink, argparser,
            new OpenLayers.Control.Attribution(),
            new OpenLayers.Control.KeyboardDefaults(),
            new OpenLayers.Control.ScaleLine({geodesic: true, maxWidth: 120}),
            new OpenLayers.Control.TouchNavigation({
                dragPanOptions: {
                    interval: 100,
                    enableKinetic: true
                }
            }),
            geolocate
        ],
        layers: [
            new OpenLayers.Layer.OSM("back", "http://map.stephane-brunner.ch/white.png", {
                numZoomLevels: 18,
                displayInLayerSwitcher: false,
                attribution: "",
                projection: sm
            }),
            vector
        ]
    });
    if (argparser.center) {
        argparser.center.transform(map.displayProjection,
                map.getProjectionObject());
        map.setCenter(argparser.center, argparser.zoom);
    }
    else {
        map.zoomToMaxExtent();
    }

    var style = {
        fillOpacity: 0.1,
        fillColor: '#000',
        strokeColor: '#f00',
        strokeOpacity: 0.6
    };
    geolocate.events.register("locationupdated", this, function(e) {
        vector.removeAllFeatures();
        vector.addFeatures([
            new OpenLayers.Feature.Vector(
                e.point,
                {},
                {
                    graphicName: 'cross',
                    strokeColor: '#f00',
                    strokeWidth: 2,
                    fillOpacity: 0,
                    pointRadius: 10
                }
            ),
            new OpenLayers.Feature.Vector(
                OpenLayers.Geometry.Polygon.createRegularPolygon(
                    new OpenLayers.Geometry.Point(e.point.x, e.point.y),
                    e.position.coords.accuracy / 2,
                    50,
                    0
                ),
                {},
                style
            )
        ]);
        map.zoomToExtent(vector.getDataExtent());
    });
};

var app = new Ext.Application({
    name: "ol",
    launch: function() {
        this.viewport = new Ext.Panel({
            fullscreen: true,
            dockedItems: [{
                dock: "top",
                xtype: "toolbar",
                ui: "light",
                layout: {
                    pack: "center"
                },
                items: [{
                    iconCls: "search",
                    iconMask: true,
                    handler: function() {
                        // this is the app
                        if (!app.searchFormPopupPanel) {
                            app.searchFormPopupPanel = new App.SearchFormPopupPanel({
                                map: map
                            });
                        }
                        app.searchFormPopupPanel.show('pop');
                    }
                }, {
                    iconCls: "locate",
                    iconMask: true,
                    handler: function() {
                        var geolocate = map.getControlsBy("id", "locate-control")[0];
                        if (geolocate.active) {
                            geolocate.getCurrentLocation();
                        } else {
                            geolocate.activate();
                        }
                    }
                }, {
                    xtype: "spacer"
                }, {
                    iconMask: true,
                    iconCls: "add",
                    handler: function() {
                        map.zoomIn();
                    }
                }, {
                    iconMask: true,
                    iconCls: "minus",
                    handler: function() {
                        map.zoomOut();
                    }
                }, {
                    xtype: "spacer"
                }, {
                    iconMask: true,
                    iconCls: "layers",
                    handler: function() {
                        if (!app.popup) {
                            app.popup = new Ext.Panel({
                                floating: true,
                                modal: true,
                                centered: true,
                                hideOnMaskTap: true,
                                width: 240,
                                items: [{
                                    xtype: 'app_layerlist',
                                    map: map
                                }],
                                scroll: 'vertical'
                            });
                        }
                        app.popup.show('pop');
                    }
                }]
            }],
            items: [
                {
                    xtype: "component",
                    scroll: false,
                    monitorResize: true,
                    id: "map",
                    listeners: {
                        render: function() {
                            var self = this;
                            init(function(feature) {
                                var htmlContent = "";
                                for (var property in feature.data) {
                                    if (feature.data[property] != 'undefined') {
                                        htmlContent = htmlContent + feature.data[property] + "<br>";
                                    }
                                }
                                if (self.featurePopup) {
                                    self.featurePopup.destroy();
                                }
                                self.featurePopup = new Ext.Panel({
                                    floating: true,
                                    modal: true,
                                    centered: true,
                                    hideOnMaskTap: true,
                                    width: 240,
                                    html: htmlContent,
                                    scroll: 'vertical'
                                });
                                self.featurePopup.show();
                            })
                        },
                        resize: function() {
                            if (window.map) {
                                map.updateSize();
                            }
                        },
                        scope: {
                            featurePopup: null
                        }
                    }
                }
            ]
        });
    }
});

