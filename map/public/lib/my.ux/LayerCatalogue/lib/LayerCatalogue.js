/**
 * Copyright (c) 2008-2010 The Open Source Geospatial Foundation
 * 
 * Published under the BSD license.
 * See http://svn.geoext.org/core/trunk/geoext/license.txt for the full text
 * of the license.
 */

/** api: (define)
 *  module = GeoExt
 *  class = LayerCatalogue
 *  base_link = `Ext.Panel <http://extjs.com/deploy/dev/docs/?class=Ext.tree.TreePanel>`_
 */

Ext.namespace('GeoExt');

/** api: constructor
 *  .. class:: LayerCatalogue(config)
 *
 *  A panel showing legends of all layers in a layer store.
 *  Depending on the layer type, a legend renderer will be chosen.
 */
GeoExt.LayerCatalogue = Ext.extend(Ext.tree.TreePanel, {

    /** api: config[map]
     *  ``Map`` the map object.
     */
    /** private: property[map]
     */
    mapPanel: null,
    
    /** private: property[stateEvents]
     *  ``Array(String)`` Array of state events
     */
    stateEvents: ["afterlayeradd"],

    /** private: method[constructor]
     *  Construct the component.
     */
    constructor: function(config) {
        config = Ext.apply({
            autoScroll: true,
            loader: new Ext.tree.TreeLoader({
                applyLoader: false
            }),
            rootVisible: false,
            lines: false,
            listeners: {
                dblclick: {
                    fn: function(node) {
                        this.addLayer(node.attributes);
                    }
                }
            }
        }, config);

        this.addEvents(
            /** private: event[afterlayeradd]
             *  Fires after a layer is added.
             */
            "afterlayeradd"
        )

        GeoExt.LayerCatalogue.superclass.constructor.call(this, config);
    },
    
    /** private: method[initComponent]
     *  Initializes the Layers catalogue panel.
     */
    initComponent: function() {
        GeoExt.LayerCatalogue.superclass.initComponent.call(this);
    },
    
    /** public: method[addLayer]
     *  add a layer to the map.
     */
    addLayer: function (options) {
        if ((options.builder || options.handler) && this.mapPanel.map.getLayersBy('ref', options.ref).length == 0) {
            if (options.handler) {
                var handler = options.handler;
                olLayer = handler.call(options.scope, options);
                olLayer.ref = options.ref;
                this.mapPanel.map.addLayer(olLayer);
                this.fireEvent("afterlayervisibilitychange");
            }
            else if (options.builder) {                
                var builder = options.builder;
                olLayer = null;
                if (options.url) {
                    olLayer = new builder(options.text, options.url, options.LayerOptions);
                }
                else {
                    olLayer = new builder(options.text, options.LayerOptions);
                }
                olLayer.ref = options.ref;
                this.mapPanel.map.addLayer(olLayer);
                this.fireEvent("afterlayervisibilitychange");
            }
        }
    }
});

/** api: xtype = gx_layercatalogue */
Ext.reg('gx_layercatalogue', GeoExt.LayerCatalogue);
