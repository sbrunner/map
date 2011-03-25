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
OpenLayers.CatalogueModel = OpenLayers.Class({

    EVENT_TYPES: ["addlayer"],

    /** api: config[map]
     *  ``Map`` the map object.
     */
    /** private: property[map]
     */
    map: null,

    /** api: config[map]
     *  ``Node`` the root node.
     */
    /** private: property[root]
     */
    root: null,

    /**
     * APIProperty: events
     * {<OpenLayers.Events>} An events object that handles all 
     *                       events on the map
     */
    events: null,
    
    /** private: method[initialize]
     *  Construct the component.
     */
    initialize: function(config) {
        OpenLayers.Util.extend(this, config);
        
        this.events = new OpenLayers.Events(this, 
                                            null, 
                                            this.EVENT_TYPES);
    },
    
    /**
     * APIMethod: destroy
     * Destroy this map
     */
    destroy: function() {
        this.events.destroy();
        this.events = null;
    },
    
    /** public: method[addLayer]
     *  add a layer to the map.
     */
    addLayer: function (options) {
        if (!options) {
            return;
        }
        var allreadyAdded = this.map.getLayersBy('ref', options.ref);
        if (allreadyAdded.length == 0 && (options.builder || options.handler)) {
            this.map.addLayer(this.getLayer(options));
            this.events.triggerEvent("addlayer", options);
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

    CLASS_NAME: "OpenLayers.CatalogueModel"
});

