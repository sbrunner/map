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
    stateEvents: ["addlayer", "ordererlayer", "removelayer"],

    /** private: method[constructor]
     *  Construct the component.
     */
    constructor: function(config) {
        config = Ext.apply({
            stateId: "catalogue",
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
            /** private: event[addlayer]
             *  Fires after a layer is added.
             */
            "addlayer",
            
            /** private: event[ordererlayer]
             *  Fires after the layer order has changed.
             */
            "ordererlayer",
            
            /** private: event[removelayer]
             *  Fires after a layer is removed.
             */
            "removelayer"
            
        )

        GeoExt.LayerCatalogue.superclass.constructor.call(this, config);
        this.loader.load(this.root);
        
        var state = Ext.state.Manager.get(this.getStateId());
        if (state) {
            this.applyState(state);
        }
        state = Ext.state.Manager.get(this.mapPanel.getStateId());
        if (state) {
            this.mapPanel.applyState(state);
        }
        
        this.mapPanel.map.events.register("changelayer", this, function(arg) {
			if (arg.property == "order") {
				this.fireEvent("ordererlayer", arg.layer);
			}
		});
        this.mapPanel.map.events.register("removelayer", this, function(arg) {
            this.fireEvent("removelayer", arg.layer);
		});
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
        if (allreadyAdded.length == 0 && (options.builder || options.handler)) {
            this.mapPanel.map.addLayer(this.getLayer(options));
            this.fireEvent("addlayer", options);
        }
    },

	addLayerByRef: function (ref) {
        this.addLayer(this.getLayerNodeByRef(ref));
	},

    /** public: method[getLayerNodeBy]
     *  get a layer by a attribute.
     */
    getLayerNodeBy: function (attribute, value) {
        var node = this.root.findChild(attribute, value, true);
        if (node) {
			delete node.attributes.id;
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
    },

    /** public: method[getLayerByRef]
     *  get a layer by his ref.
     */
    getLayerByRef: function (ref) {
        return this.getLayer(this.getLayerNodeByRef(ref));
    },

    /** public: method[getLayer]
     *  get a layer by his options.
     */
    getLayer: function (options) {
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
        return olLayer;
    },

    /** private: method[applyState]
     *  :param state: ``Object`` The state to apply.
     *
     *  Apply the state provided as an argument.
     */
    applyState: function(state) {
        if (this.root.childNodes.length > 0) { // initialysed ?
            if (state.layers) {
                if (state.layers instanceof Array) {
                    for(var i = 0 ; i < state.layers.length ; ++i) {
                        this.addLayerByRef(state.layers[i]);
                    }
                }
                else {
                    this.addLayerByRef(state.layers);
                }
            }
        }
    },

    /** private: method[getState]
     *  :return:  ``Object`` The state.
     *
     *  Returns the current state for the map panel.
     */
    getState: function() {
        var state;

        if (!this.mapPanel) {
            return;
        }

        state = {
            layers: []
        };

        for (i = 0, l = this.mapPanel.map.layers.length ; i < l ; i++) {
            layer = this.mapPanel.map.layers[i];
            if (layer.ref) {
                state.layers.push(layer.ref);
            }
        }

        return state;
    }
});

/** api: xtype = gx_layercatalogue */
Ext.reg('gx_layercatalogue', GeoExt.LayerCatalogue);
