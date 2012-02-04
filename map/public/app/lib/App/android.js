/**
 * Copyright (c) 2010-2011 The Open Source Geospatial Foundation
 *
 * Published under the BSD license.
 * See http://svn.geoext.org/core/trunk/geoext/license.txt for the full text
 * of the license.
 */
/*
 * @requires App/MobileClasses.js
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
            new OpenLayers.Control.Attribution(),
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
    map.zoomToMaxExtent();


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


    var model = new Geo.CatalogueModel({
        map: map,
        root: getLayersTree(map)
    });
    var visibility
     = true;
    ['mk','mapquest','germany'].forEach(function(layerref) {
        var layer = model.getLayerNodeByRef(layerref);
        if (layer) {
            layer.visibility = visibility;
            visibility = false;
            model.addLayer(layer);
        }
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

