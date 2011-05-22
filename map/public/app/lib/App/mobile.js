/*
 * @requires OpenLayers/Projection.js
 * @include OpenLayers/Layer/SphericalMercator.js
 * @include OpenLayers/Layer/Vector.js
 * @include OpenLayers/Layer/XYZ.js
 * @include OpenLayers/Control/Geolocate.js
 * @include OpenLayers/Control/Attribution.js
 * @include OpenLayers/Control/Permalink.js
 * @include OpenLayers/Control/TouchNavigation.js
 * @include OpenLayers/Control/KeyboardDefaults.js
 * @include OpenLayers/Control/ScaleLine.js
 * @include OpenLayers/Kinetic.js
 * @include LayerCatalogue/lib/CatalogueModel.js
 * @include App/layers.js
 */

Ext.supports.History = false;
var code = (OpenLayers.Util.getBrowserName() == "msie") ? navigator.userLanguage : navigator.language;
var lang = code.substring(0, 2);
if (!contains(['en', 'fr'], lang)) {
    lang = "en";
}
document.write("<script type=\"text/javascript\" src=\"build/" + lang + "-m.js\"></script>");
document.write('<meta HTTP-EQUIV="Content-Language" CONTENT="' + lang + '" />');
delete code;

// initialize map when page ready
var map;
var gg = new OpenLayers.Projection("EPSG:4326");
var sm = new OpenLayers.Projection("EPSG:900913");

var initialysed = false;

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

    var permalink = new OpenLayers.Control.Permalink({anchor: true, base: window.initial_href});
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
    var argparser = new OpenLayers.Control.ArgParser();
    argparser.setMap = function(map) {
        OpenLayers.Control.prototype.setMap.apply(this, arguments);

        var args = this.getParameters(window.initial_href);
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
                numZoomLevels: 20, 
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
                dock: "bottom",
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

Ext.ns('App');

/**
 * The model for the geonames records used in the search
 */
Ext.regModel('Geonames', {
    fields: ['countryName', 'toponymName', 'name', 'lat', 'lng']
});

/**
 * Custom class for the Search 
 */
App.SearchFormPopupPanel = Ext.extend(Ext.Panel, {
    map: null,
    floating: true,
    modal: true,
    centered: true,
    hideOnMaskTap: true,
    width: Ext.is.Phone ? undefined : 400,
    height: Ext.is.Phone ? undefined : 400,
    scroll: false,
    layout: 'fit',
    fullscreen: Ext.is.Phone ? true : undefined,
    url: 'http://ws.geonames.org/searchJSON?',
    errorText: 'Sorry, we had problems communicating with geonames.org. Please try again.',
    errorTitle: 'Communication error',
    maxResults: 6,
    featureClass: "P",
    
    createStore: function(){
        this.store = new Ext.data.Store({
            model: 'Geonames',
            proxy: {
                type: 'scripttag',
                timeout: 5000,
                listeners: {
                    exception: function(){
                        this.hide();
                        Ext.Msg.alert(this.errorTitle, this.errorText, Ext.emptyFn);
                    },
                    scope: this
                },
                url: this.url,
                reader: {
                    type: 'json',
                    root: 'geonames'
                }
            }
        });
    },
    
    doSearch: function(searchfield, evt){
        var q = searchfield.getValue();
        this.store.load({
            params: {
                featureClass: this.featureClass,
                maxRows: this.maxResults,
                name_startsWith: encodeURIComponent(q)
            }
        });
    },
    
    onItemTap: function(dataView, index, item, event){
        var record = this.store.getAt(index);
        var lon = record.get('lng');
        var lat = record.get('lat');
        var lonlat = new OpenLayers.LonLat(lon, lat);
        map.setCenter(lonlat.transform(gg, sm), 12);
        this.hide("pop");
    },
    
    initComponent: function(){
        this.createStore();
        this.resultList = new Ext.List({
            scroll: 'vertical',
            cls: 'searchList',
            loadingText: "Searching ...",
            store: this.store,
            itemTpl: '<div>{name} ({countryName})</div>',
            listeners: {
                itemtap: this.onItemTap,
                scope: this
            }
        });
        this.formContainer = new Ext.form.FormPanel({
            scroll: false,
            items: [{
                xtype: 'button',
                cls: 'close-btn',
                ui: 'decline-small',
                text: 'Close',
                handler: function(){
                    this.hide();
                },
                scope: this 
            }, {
                xtype: 'fieldset',
                scroll: false,
                title: 'Search for a place',
                items: [{
                    xtype: 'searchfield',
                    label: 'Search',
                    placeHolder: 'placename',
                    listeners: {
                        action: this.doSearch,
                        scope: this
                    }
                },
                    this.resultList
                ]
            }]
        });
        this.items = [{
            xtype: 'panel',
            layout: 'fit',
            items: [this.formContainer]
        }];
        App.SearchFormPopupPanel.superclass.initComponent.call(this);
    }
});

App.LayerList = Ext.extend(Ext.List, {
    
    map: null,
    
    createStore: function(){
        Ext.regModel('Layer', {
            fields: ['id', 'name', 'visibility', 'zindex']
        });
        var data = [];
        Ext.each(this.map.layers, function(layer){
            if (layer.displayInLayerSwitcher === true) {
                var visibility = layer.isBaseLayer ? (this.map.baseLayer == layer) : layer.getVisibility();
                data.push({
                    id: layer.id,
                    name: layer.name,
                    visibility: visibility,
                    zindex: layer.getZIndex()
                });
            }
        });
        return new Ext.data.Store({
            model: 'Layer',
            sorters: 'zindex',
            data: data
        });
    },
    
    initComponent: function(){
        this.store = this.createStore();
        this.itemTpl = new Ext.XTemplate(
            '<tpl if="visibility == true">', 
                '<img width="20" src="app/images/check-round-green.png">', 
            '</tpl>', 
            '<tpl if="visibility == false">', 
                '<img width="20" src="app/images/check-round-grey.png">', 
            '</tpl>', 
            '<span class="gx-layer-item">{name}</span>'
        );
        this.listeners = {
            itemtap: function(dataview, index, item, e){
                var record = dataview.getStore().getAt(index);
                var layer = this.map.getLayersBy("id", record.get("id"))[0];
                if (layer.isBaseLayer) {
                    this.map.setBaseLayer(layer);
                }
                else {
                    layer.setVisibility(!layer.getVisibility());
                }
                record.set("visibility", layer.getVisibility());
            }
        };
        this.map.events.on({
            "changelayer": this.onChangeLayer,
            scope: this
        });
        App.LayerList.superclass.initComponent.call(this);
    },

    findLayerRecord: function(layer){
        var found;
        this.store.each(function(record){
            if (record.get("id") === layer.id) {
                found = record;
            }
        }, this);
        return found;
    },
    
    onChangeLayer: function(evt){
        if (evt.property == "visibility") {
            var record = this.findLayerRecord(evt.layer);
            record.set("visibility", evt.layer.getVisibility());
        }
    }
    
});
Ext.reg('app_layerlist', App.LayerList);
