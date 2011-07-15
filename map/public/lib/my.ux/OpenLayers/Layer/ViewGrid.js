/* Copyright (c) 2006-2008 MetaCarta, Inc., published under the Clear BSD
 * license.  See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */


/**
 * @requires OpenLayers/Tile.js
 */

/**
 * Class: OpenLayers.Tile.ViewGrid
 *
 * Used in OpenLayers.Layer.ViewGrid.
 *
 * Inherits from:
 *  - <OpenLayers.Tile>
 */
OpenLayers.Tile.ViewGrid = OpenLayers.Class(OpenLayers.Tile, {

    /**
     * Property: frame
     * {DOMElement}
     */ 
    frame: null, 
    
    /**
     * 
     * Constructor: OpenLayers.Tile.ViewGrid
     * Constructor for a new <OpenLayers.Tile.ViewGrid> instance.
     * 
     * Parameters:
     * layer - {<OpenLayers.Layer>} layer that the tile will go in.
     * position - {<OpenLayers.Pixel>}
     * bounds - {<OpenLayers.Bounds>}
     * size - {<OpenLayers.Size>}
     */   
    initialize: function(layer, position, bounds, size) {
        OpenLayers.Tile.prototype.initialize.apply(this, [layer, position, bounds, null, size]);

        this.frame = document.createElement('div'); 
        this.frame.style.overflow = 'hidden'; 
        this.frame.style.position = 'absolute'; 

        return this;
    },

    /** 
     * APIMethod: destroy
     * nullify references to prevent circular references and memory leaks
     */
    destroy: function() {
        if ((this.frame != null) && (this.frame.parentNode == this.layer.div)) { 
            this.layer.div.removeChild(this.frame); 
        }
        this.frame = null; 
        
        OpenLayers.Tile.prototype.destroy.apply(this, arguments);
    },

    /**
     * Method: clone
     *
     * Parameters:
     * obj - {<OpenLayers.Tile.ViewGrid>} The tile to be cloned
     *
     * Returns:
     * {<OpenLayers.Tile.ViewGrid>} An exact clone of this <OpenLayers.Tile.ViewGrid>
     */
    clone: function (obj) {
        if (obj == null) {
            obj = new OpenLayers.Tile.ViewGrid(this.layer, 
                                            this.position, 
                                            this.bounds, 
                                            this.size);        
        } 
        
        //pick up properties from superclass
        obj = OpenLayers.Tile.prototype.clone.apply(this, [obj]);
        
        return obj;
    },
    
    /**
     * Method: draw
     * Check that a tile should be drawn, and draw it.
     * 
     * Returns:
     * {Boolean} Always returns true.
     */
    draw: function() {
        var layer = this.layer;
        var bounds = layer.adjustBounds(this.bounds);
        var res = layer.map.getResolution();
        var z = layer.map.getZoom();
        var zpow = Math.pow(2, z);
        var x = Math.round((bounds.left - layer.tileOrigin.lon) / (res * layer.tileSize.w));
        var y = zpow - Math.round((bounds.bottom - layer.tileOrigin.lat) / (res * layer.tileSize.h)) - 1;

        if (this.layer.showAllTiles || (x >= 0 && y >= 0 && x < zpow && y < zpow)) {
            this.frame.innerHTML = this.layer.tileContent(x, y, z);
        } else {
            this.frame.innerHTML = '';
        }
        OpenLayers.Util.modifyDOMElement(this.frame, 
                                         null, this.position, this.size);   
        this.layer.div.appendChild(this.frame);

        return true;
    },
    
    /** 
     * Method: clear
     *  Clear the tile of any bounds/position-related data so that it can 
     *   be reused in a new location.
     */
    clear: function() {
        this.frame.innerHTML = '';
        this.hide();
    },

    /** 
     * Method: show
     * Show the tile by showing its frame.
     */
    show: function() {
        this.frame.style.display = '';
        // Force a reflow on gecko based browsers to actually show the element
        // before continuing execution.
        if (OpenLayers.Util.indexOf(this.layer.SUPPORTED_TRANSITIONS, 
                this.layer.transitionEffect) != -1) {
            if (navigator.userAgent.toLowerCase().indexOf("gecko") != -1) { 
                this.frame.scrollLeft = this.frame.scrollLeft; 
            } 
        }
    },
    
    /** 
     * Method: hide
     * Hide the tile by hiding its frame.
     */
    hide: function() {
        this.frame.style.display = 'none';
    },
    
    CLASS_NAME: "OpenLayers.Tile.ViewGrid"
  }
);
