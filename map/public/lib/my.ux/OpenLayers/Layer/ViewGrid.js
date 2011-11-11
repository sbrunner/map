/* Copyright (c) 2006-2008 MetaCarta, Inc., published under the Clear BSD
 * licence.  See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */


/**
 * @requires OpenLayers/Layer/Grid.js
 * @requires OpenLayers/Tile/ViewGrid.js
 */

/**
 * Class: OpenLayers.Layer.ViewGrid
 * 
 * Inherits from:
 *  - <OpenLayers.Layer.Grid>
 */
OpenLayers.Layer.ViewGrid = OpenLayers.Class(OpenLayers.Layer.Grid, {

    /**
     * APIProperty: isBaseLayer
     * {Boolean}
     */
    isBaseLayer: false,

    /**
     * APIProperty: tileOrigin
     * {<OpenLayers.Pixel>}
     */
    tileOrigin: null,

    /**
     * APIProperty: showAllTiles
     * 
     * Show all tiles, even those out of bounds.
     *
     * {Boolean}
     */
    showAllTiles: false,

    /**
     * Constructor: OpenLayers.Layer.ViewGrid
     * 
     * Parameters:
     * name - {String}
     * options - {Object} Hashtable of extra options to tag onto the layer
     */
    initialize: function(name, options) {
        var newArguments = [];
        newArguments.push(name, '', {}, options);
        OpenLayers.Layer.Grid.prototype.initialize.apply(this, newArguments);
    },    

    /**
     * APIMethod:destroy
     */
    destroy: function() {
        // for now, nothing special to do here. 
        OpenLayers.Layer.Grid.prototype.destroy.apply(this, arguments);  
    },
    
    /**
     * APIMethod: clone
     * 
     * Parameters:
     * obj - {Object}
     * 
     * Returns:
     * {<OpenLayers.Layer.ViewGrid>} An exact clone of this <OpenLayers.Layer.ViewGrid>
     */
    clone: function (obj) {
        
        if (obj == null) {
            obj = new OpenLayers.Layer.ViewGrid(this.name,
                                           this.options);
        }

        //get all additions from superclasses
        obj = OpenLayers.Layer.Grid.prototype.clone.apply(this, [obj]);

        // copy/set any non-init, non-simple values here

        return obj;
    },    
    
    /**
     * Method: addTile
     * addTile creates a tile, initializes it, and adds it to the layer div. 
     * 
     * Parameters:
     * bounds - {<OpenLayers.Bounds>}
     * position - {<OpenLayers.Pixel>}
     * 
     * Returns:
     * {<OpenLayers.Tile.Image>} The added OpenLayers.Tile.Image
     */
    addTile:function(bounds,position) {
        return new OpenLayers.Tile.ViewGrid(this, position, bounds, this.tileSize);
    },

    /** 
     * APIMethod: setMap
     * When the layer is added to a map, then we can fetch our origin 
     *    (if we don't have one.) 
     * 
     * Parameters:
     * map - {<OpenLayers.Map>}
     */
    setMap: function(map) {
        OpenLayers.Layer.Grid.prototype.setMap.apply(this, arguments);
        if (!this.tileOrigin) { 
            this.tileOrigin = new OpenLayers.LonLat(this.map.maxExtent.left,
                                                this.map.maxExtent.bottom);
        }                                       
    },

    /**
     * Method: tileContent
     *
     * Parameters:
     * x - {int} x coordinate of tile
     * y - {int} y coordinate of tile
     * z - {int} zoom level
     *
     * Returns:
     * {String} An HTML snippet which will be included in the tile frame.
     */
    tileContent: function(x, y, z) {
        return '<div class="olLayerViewGridTile olLayerViewGridTile' + this.tileSize.w + '"><span>x=' + x + ' y=' + y + ' z=' + z + '</span></div>';
    },

    CLASS_NAME: "OpenLayers.Layer.ViewGrid"
});
