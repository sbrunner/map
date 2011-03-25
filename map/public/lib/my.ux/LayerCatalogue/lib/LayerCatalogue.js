/**
 * Copyright (c) 2008-2010 The Open Source Geospatial Foundation
 * 
 * Published under the BSD license.
 * See http://svn.geoext.org/core/trunk/geoext/license.txt for the full text
 * of the license.
 */

/*
 * @include LayerCatalogue/lib/CatalogueModel.js
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
    
    /** private: property[model]
     *  ``Object`` the model
     */
    model: null,

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
                        this.model.addLayer(node.attributes);
                    }
                }
            }
        }, config);
        
        this.model = new OpenLayers.CatalogueModel({
            map: config.mapPanel.map,
            root: config.root
        });

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
        this.loader.load(this.model.root);
        
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
        this.model.events.register("alllayer", this, function(arg) {
            this.fireEvent("alllayer", arg.layer);
		});
    },
    
    /** private: method[initComponent]
     *  Initializes the Layers catalogue panel.
     */
    initComponent: function() {
        GeoExt.LayerCatalogue.superclass.initComponent.call(this);
    },

    /** private: method[applyState]
     *  :param state: ``Object`` The state to apply.
     *
     *  Apply the state provided as an argument.
     */
    applyState: function(state) {
        if (this.model.root.childNodes.length > 0) { // initialysed ?
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
    
 	addLayerByRef: function (ref) {
        this.model.addLayerByRef(ref);
    }

});

/** api: xtype = gx_layercatalogue */
Ext.reg('gx_layercatalogue', GeoExt.LayerCatalogue);
