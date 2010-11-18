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
    stateEvents: ["afterlayeradd", "layerOrder"],

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
            /** private: event[afterlayeradd]
             *  Fires after a layer is added.
             */
            "afterlayeradd",
            
            /** private: event[afterlayeradd]
             *  Fires after the layer order has changed.
             */
            "layerOrder"
        )

        GeoExt.LayerCatalogue.superclass.constructor.call(this, config);
        this.loader.load(this.root);
        
        var state = Ext.state.Manager.get(this.getStateId());
        if (state) {
            this.applyState(state);
        }
        state = Ext.state.Manager.get(mapPanel.getStateId());
        if (state) {
            mapPanel.applyState(state);
        }
        
        mapPanel.map.events.register("changelayer", this, function(arguments) {
			if (arguments.property == "order") {
				this.fireEvent("layerOrder", arguments.layer);
			}
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
            this.fireEvent("afterlayeradd", options);
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
    },
});

/** api: xtype = gx_layercatalogue */
Ext.reg('gx_layercatalogue', GeoExt.LayerCatalogue);
