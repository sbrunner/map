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

    /** api: config[mapPanel]
     *  ``Panel`` the map panel object.
     */
    /** private: property[mapPanel]
     */
    mapPanel: null,
    
    /** private: property[stateEvents]
     *  ``Array(String)`` Array of state events
     */
    stateEvents: ["addlayer", "ordererlayer", "removelayer"],
    
    /** private: property[model]
     *  ``Geo.CatalogueModel`` the model
     */
    model: null,

    /** api: config[tree]
     *  ``Tree`` the tree object configuration.
     */
    /** private: property[tree]
     *  ``Tree`` the tree object.
     */
    tree: null,
    
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
            width: config.width,
            loader: new Ext.tree.TreeLoader({
                   preloadChildren: true
            }),
            listeners: {
                dblclick: {
                    fn: function(node) {
                        this.model.addLayer(node.attributes);
                    },
                    scope: this
                }
            }
        }, config.tree);
        
        this.model = new Geo.CatalogueModel({
            map: config.mapPanel.map,
            root: config.tree.root
        });

        var tree = new Ext.tree.TreePanel(treeConfig);

        var filter = function (record, exp) {
            if (record.isLeaf()) {
                var found = true;
                for (var i = 0, len = exp.length; i < len; i++) {
                    if (found) {
                        found = found && exp[i].test(record.text) ||
                            record.attributes.tags != undefined && exp[i].test(record.attributes.tags);
                    }
                }
                record.attributes.hidden = !found;
            }
            else {
                var hidden = true;
                for (var i = 0, len = record.childNodes.length ; i < len ; i++) {
                    filter(record.childNodes[i], exp);
                    hidden = hidden && record.childNodes[i].attributes.hidden;
                }
                record.attributes.hidden = hidden;
            }
            if (record.ui.wrap) {
                record.ui.wrap.hidden = record.attributes.hidden;
            }
        }
        var getExp = function(value) {
            if (value == "" || value == null) {
                return [];
            }
            else {
                var exp = [], values = value.split(" ");
                for (var i = 0, len = values.length; i < len; i++) {
                    exp.push(new RegExp(values[i], 'i'));
                }
                return exp;
            }
        }
        var fieldConfig = Ext.apply({
            xtype: 'combo',
            hideTrigger: true,
            emptyText: OpenLayers.i18n('Search'),
            listeners: {
                keyup: {
                    fn: function(field, event) {
                        var value = field.getValue();
                        filter(tree.getRootNode(), getExp(value));
                    },
                    scope: this
                }
            },
            findRecord: function(){},
            minChars: 99999 // to desable store !
        }, config.searchConfig);

        if (config.displaySearch) {
            config.items = [fieldConfig, tree];
        }
        else {
            this.fieldConfig = fieldConfig;
            config.items = [tree];
        }

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
        this.tree = tree;
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
