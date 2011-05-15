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
 */

Ext.namespace('GeoExt');

/** api: constructor
 *  .. class:: LayerCatalogue(config)
 *
 *  A panel showing legends of all layers in a layer store.
 *  Depending on the layer type, a legend renderer will be chosen.
 */
GeoExt.LayerCatalogue = Ext.extend(Ext.Panel, {

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
        var config = Ext.apply({
            stateId: "catalogue",
            layout: {
                type: 'vbox'
            }
        }, config);
        var treeConfig = Ext.apply({
            xtype: 'treepanel',
            loader: new Ext.tree.TreeLoader({
                   preloadChildren: true
            }),
            listeners: {
                dblclick: {
                    fn: function(node) {
                        this.model.addLayer(node.attributes);
                    }
                }
            }
        }, config.tree);
        
        this.model = new Geo.CatalogueModel({
            map: config.mapPanel.map,
            root: config.tree.root
        });

        tree = new Ext.tree.TreePanel(treeConfig);

        var filter = function (record, exp) {
            record.ui.wrap.hidden = false;
            if (record.isLeaf()) {
                if (exp != null) {
                    if (!(exp.test(record.text) || record.tags != undefined && exp.test(record.tags))) {
                        record.ui.wrap.hidden = true;
                    }
                }
            }
            else {
                visible = false;
                for (var i = 0, len = record.childNodes.length ; i < len ; i++) {
                    filter(record.childNodes[i], exp);
                    visible = visible || !record.childNodes[i].hidden;
                }
                if (!visible) {
                    record.ui.wrap.hidden = true;
                }
            }
        }
        
        var fieldConfig = Ext.apply({
            xtype: 'textfield',
            emptyText: OpenLayers.i18n('Search'),
            listeners: {
                change: function(field, newValue, oldValue) {
                    var exp = newValue == "" ? null : new RegExp(newValue, 'i');
                    filter(tree.getRootNode(), exp);
                },
                keyup: function(field, event) {
                    var value = getValue();
                    var exp = value == "" ? null : new RegExp(value, 'i');
                    filter(tree.getRootNode(), exp);
                }
            }
        }, config.searchConfig);

        config.items = [fieldConfig, tree];

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
        tree.loader.load(tree.root);
        
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
        this.mapPanel.map.events.register("addlayer", this, function(arg) {
            this.fireEvent("addlayer", arg.layer);
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
