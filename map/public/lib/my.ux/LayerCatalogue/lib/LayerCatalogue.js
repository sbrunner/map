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
               	preloadChildren: true
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
        this.loader.load(this.root);
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
		if (!options) {
			return;
		}
        var allreadyAdded = this.mapPanel.map.getLayersBy('ref', options.ref);
        if (allreadyAdded.length > 0) {
            this.mapPanel.map.setBaseLayer(allreadyAdded[0]);
        }
        else if (options.builder || options.handler) {
            var olLayer = null;
            if (options.handler) {
                var handler = options.handler;
                olLayer = handler.call(options.scope, options);
            }
            else {                
                var builder = options.builder;
                olLayer = null;
                if (options.url) {
                    olLayer = new builder(options.text, options.url, options.layerOptions);
                }
                else {
                    olLayer = new builder(options.text, options.layerOptions);
                }
            }
            olLayer.ref = options.ref;
            options.layer = olLayer;
            this.mapPanel.map.addLayer(olLayer);
            this.fireEvent("afterlayervisibilitychange", options);
        }
    },
    
    /** public: method[getLayerNodeBy]
     *  get a layer by a attribute.
     */
    getLayerNodeBy: function (attribute, value) {
        var node = this.root.findChild(attribute, value, true);
        if (node) {
			return node.attributes;
		}
		else {
			return null;
		}
    },
    
    /** public: method[getLayerNodeByRef]
     *  get a layer by his ref.
     */
    getLayerNodeByRef: function (ref) {
        return this.getLayerNodeBy('ref', ref);
    }
});

/** api: xtype = gx_layercatalogue */
Ext.reg('gx_layercatalogue', GeoExt.LayerCatalogue);
