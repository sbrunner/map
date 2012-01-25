/**
 * Copyright (c) 2010-2011 The Open Source Geospatial Foundation
 *
 * Published under the BSD license.
 * See http://svn.geoext.org/core/trunk/geoext/license.txt for the full text
 * of the license.
 */
/*
 * @requires OpenLayers/Projection.js
 * @include OpenLayers/Layer/SphericalMercator.js
 * @include OpenLayers/Layer/Vector.js
 * @include OpenLayers/Layer/XYZ.js
 * @include OpenLayers/Control/Geolocate.js
 * @include OpenLayers/Control/Attribution.js
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


Ext.ns('App');

/**
 * The model for the nominatim records used in the search
 */
Ext.regModel('nominatim', {
    fields: ['display_name', 'boundingbox', 'lon', 'lat', 'polygonpoints']
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
    url: 'http://nominatim.openstreetmap.org/search?',
    errorText: OpenLayers.i18n('Sorry, we had problems communicating with openstreetmap.org. Please try again.'),
    errorTitle: OpenLayers.i18n('Communication error'),
    maxResults: 6,
    featureClass: "P",

    createStore: function(){
        this.store = new Ext.data.Store({
            model: 'nominatim',
            proxy: {
                type: 'scripttag',
                timeout: 5000,
                callbackParam: 'json_callback',
                listeners: {
                    exception: function() {
                        this.hide();
                        Ext.Msg.alert(this.errorTitle, this.errorText, Ext.emptyFn);
                    },
                    scope: this
                },
                url: this.url,
                reader: {
                    type: 'json'
                }
            }
        });
    },

    doSearch: function(searchfield, evt){
        var q = searchfield.getValue();
        this.store.load({
            params: {
                'format': 'json',
                'accept-language': OpenLayers.Lang.getCode(),
                'limit': 5,
                'q': encodeURIComponent(q)
            }
        });
    },

    onItemTap: function(dataView, index, item, event){
        var record = this.store.getAt(index);
        var bb = record.get('boundingbox');
        map.zoomToExtent(new OpenLayers.Bounds(bb[2], bb[0], bb[3], bb[1]).transform(gg, sm));
        this.hide("pop");
    },

    initComponent: function(){
        this.createStore();
        this.resultList = new Ext.List({
            scroll: 'vertical',
            cls: 'searchList',
            loadingText: OpenLayers.i18n("Searching..."),
            store: this.store,
            itemTpl: '<div>{display_name}</div>',
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
                text: OpenLayers.i18n('Close'),
                handler: function(){
                    this.hide();
                },
                scope: this
            }, {
                xtype: 'fieldset',
                scroll: false,
                title: OpenLayers.i18n('Search for a place'),
                items: [{
                    xtype: 'searchfield',
                    label: OpenLayers.i18n('Search'),
                    placeHolder: OpenLayers.i18n('placename'),
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
