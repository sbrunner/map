/**
 * Copyright (c) 2008-2010 The Open Source Geospatial Foundation
 * 
 * Published under the BSD license.
 * See http://svn.geoext.org/core/trunk/geoext/license.txt for the full text
 * of the license.
 */

/*
 * @requires GeoExt/widgets/tree/LayerNode.js
 *
 * @include OpenLayers/Projection.js
 * @include OpenLayers/Control.js
 * @include OpenLayers/Format/GeoJSON.js
 * @include OpenLayers/Control/Permalink.js
 * @include GeoExt/widgets/LayerOpacitySlider.js
 * @include OpenLayers/Layer/Vector.js
 * @include OpenLayers/Layer/XYZ.js
 * @include OpenLayers/Layer/WMS.js
 * @include OpenLayers/Format/OSM.js
 */

function contains(array, needle) {
   for (var i in array) {
       if (array[i] == needle) {
           return true;
       }
   }
   return false;
}

function toTitleCase(toTransform) {
  return toTransform.replace(/\b([a-z])/g, function (_, initial) {
      return initial.toUpperCase();
  });
}

function getValue(value, defaultValue) {
    if (typeof(value) == "undefined") {
        return defaultValue;
    } 
    else {
        return value;
    }
}

function getBooleanValue(value, defaultValue) {
    if (typeof(value) == "undefined") {
        return defaultValue;
    } 
    else {
        return value == 'true';
    }
}

var epsg900913 = new OpenLayers.Projection("EPSG:900913");
var epsg4326 = new OpenLayers.Projection("EPSG:4326");

function addLayer(options) {
    options.isBaseLayer = false;
    options.transitionEffect = "resize";
    delete options.id;
    return new OpenLayers.Layer.XYZ(options.text, options.url, options);
}
function addWmsLayer(options) {
    options.isBaseLayer = false;
    options.transitionEffect = "resize";
    delete options.id;
    var wmsOptions = options.wmsOptions ? options.wmsOptions : {layers: options.layers};
    return new OpenLayers.Layer.WMS(options.text, options.url, wmsOptions, options);
}
function addXapiStyleLayer(options) {
    var name = options.text;
    var styleMap = null;
    if (options.style) {
        styleMap = options.style();
    }
    var ref = options.ref;
    var element = options.element;
    var predicate = options.predicate;

    var format = new OpenLayers.Format.OSM({
        checkTags: true,
        externalProjection: epsg4326,
        relationsParsers: {
            multipolygon: OpenLayers.Format.OSM.multipolygonParser,
            boundary:     OpenLayers.Format.OSM.multipolygonParser,
            route:        OpenLayers.Format.OSM.routeParser
        }
    });
    var protocol;
    var strategies = null;
    if (OpenLayers.OSM_URL) {
        protocol = new OpenLayers.Protocol.HTTP({
            url: OpenLayers.OSM_URL,
            format: format
        });
        strategies = [ new OpenLayers.Strategy.Fixed({ preload: false }) ];
    }
    else {
        protocol = new OpenLayers.Protocol.XAPI({
            element: element,
            predicate: predicate,
            format: format
        });
        strategies = [ new OpenLayers.Strategy.BBOX({ ratio: 1.6 }) ];
    }

    layer = new OpenLayers.Layer.Vector(name, {
        ref: ref,
        projection: epsg4326,
        strategies: strategies, 
        protocol: protocol,
        styleMap: styleMap,
        numZoomLevels: 22,
        attribution: "Data CC-By-SA by <a href='http://openstreetmap.org/'>OpenStreetMap</a>"
    });
    return layer;
}
function addOsmStyleLayer(options) {
    var name = options.text;
    var styleMap = null;
    if (options.style) {
        styleMap = options.style();
    }
    var ref = options.ref;

    var url = "http://api.openstreetmap.org/api/0.6/map?";
    var strategies = [];
    if (OpenLayers.OSM_URL) {
        url = OpenLayers.OSM_URL;
        strategies = [ new OpenLayers.Strategy.Fixed({ preload: false }) ];
    }
    else {
        strategies = [ new OpenLayers.Strategy.BBOX({ ratio: 1.2 }) ];
    }
    layer = new OpenLayers.Layer.Vector(name, {
        ref: ref,
        projection: epsg4326,
        maxResolution: 1.5,
        strategies: strategies,
        protocol: new OpenLayers.Protocol.HTTP({
            url: url,
            format: new OpenLayers.Format.OSM({
                checkTags: true,
                externalProjection: epsg4326,
                relationsParsers: {
                    multipolygon: OpenLayers.Format.OSM.multipolygonParser,
                    boundary:     OpenLayers.Format.OSM.multipolygonParser,
                    route:        OpenLayers.Format.OSM.routeParser
                }
            })
        }),
        styleMap: styleMap,
        numZoomLevels: 22,
        attribution: "Data CC-By-SA by <a href='http://openstreetmap.org/'>OpenStreetMap</a>"
    });
    return layer;
}

OpenLayers.Control.PermalinkLayer = OpenLayers.Class(OpenLayers.Control.Permalink, {
    my_layers: null,
    
    initialize: function(element, base, my_layers) {
        OpenLayers.Control.Permalink.prototype.initialize.apply(this, arguments);
        this.my_layers = my_layers;
    },
    
    /**
     * Method: updateLink
     */
    updateLink: function() {
        var center = this.map.getCenter();

        // Map not initialized yet. Break out of this function.
        if (!center) {
            return;
        }

        var params = OpenLayers.Util.getParameters(this.base);

        params.zoom = this.map.getZoom();

        var lat = center.lat;
        var lon = center.lon;
        if (this.displayProjection) {
            var mapPosition = OpenLayers.Projection.transform(
              { x: lon, y: lat },
              this.map.getProjectionObject(),
              this.displayProjection );
            lon = mapPosition.x;
            lat = mapPosition.y;
        }
        params.lat = Math.round(lat*100000)/100000;
        params.lon = Math.round(lon*100000)/100000;

        if (this.my_layers) {
            params.layers = this.my_layers;
        }

        var href = this.base;
        if( href.indexOf('?') != -1 ){
            href = href.substring( 0, href.indexOf('?') );
        }

        href += '?' + OpenLayers.Util.getParameterString(params);
        this.element.href = href;
    },
    CLASS_NAME: "OpenLayers.Control.PermalinkLayer"
});

function onStatechange(provider) {
    var l = provider.getLink(permalinkBase);
    l = l.replace("#?", "#");
    if (Ext.get("permalink")) {
        Ext.get("permalink").update("<a href=" + l + ">" + OpenLayers.i18n("Permalink") + "</a>");
    
        l = provider.getLink(permalinkTitleBase);
        l = l.replace("#?", "#");
        if (window.location.href.indexOf("?") < 0) {
            window.location.href = l;
        }
        
        var bounds = mapPanel.map.getExtent();
        bounds = bounds.transform(mapPanel.map.getProjectionObject(), mapPanel.map.displayProjection);
	Ext.get("josm").update("<a target='hiddenIframe' href='http://127.0.0.1:8111/load_and_zoom?"
	    + "left=" + bounds.left + "&right=" + bounds.right
	    + "&top=" + bounds.top + "&bottom=" + bounds.bottom + "'>" + OpenLayers.i18n("Edit with JOSM") + "</a>");

	var center = mapPanel.map.getCenter();
        center = center.transform(mapPanel.map.getProjectionObject(), mapPanel.map.displayProjection);
	Ext.get("mapzen").update("<a href='http://mapzen.cloudmade.com/editor?lat=" + center.z + "&lng=" + center.x + "&zoom=" + mapPanel.map.getZoom() + "'>"
		+ OpenLayers.i18n("Edit with Mapzen") + "</a>");
    }
}


/**
 * Converts an RGB color value to HSL. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
 * Assumes r, g, and b are contained in the set [0, 255] and
 * returns h, s, and l in the set [0, 1].
 *
 * @param   Number  r       The red color value
 * @param   Number  g       The green color value
 * @param   Number  b       The blue color value
 * @return  Array           The HSL representation
 */
function rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, l = (max + min) / 2;

    if (max == min) {
        h = s = 0; // achromatic
    } else {
        var d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch(max){
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    return [h, s, l];
}

/**
 * Converts an HSL color value to RGB. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
 * Assumes h, s, and l are contained in the set [0, 1] and
 * returns r, g, and b in the set [0, 255].
 *
 * @param   Number  h       The hue
 * @param   Number  s       The saturation
 * @param   Number  l       The lightness
 * @return  Array           The RGB representation
 */
function hslToRgb(h, s, l) {
    var r, g, b;

    if (s == 0) {
        r = g = b = l; // achromatic
    } else {
        function hue2rgb(p, q, t) {
            if (t < 0) { t += 1 };
            if (t > 1) { t -= 1 };
            if (t < 1/6) { return p + (q - p) * 6 * t };
            if (t < 1/2) { return q };
            if (t < 2/3) { return p + (q - p) * (2/3 - t) * 6 };
            return p;
        }

        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }

    return [r * 255, g * 255, b * 255];
}

function toHexColor(rgb) {
    hr = Math.round(rgb[0]).toString(16);
    hg = Math.round(rgb[1]).toString(16);
    hb = Math.round(rgb[2]).toString(16);
    if (hr.length < 2) {
        hr = '0' + hr;
    }
    if (hg.length < 2) {
        hg = '0' + hg;
    }
    if (hb.length < 2) {
        hb = '0' + hb;
    }
    return '#'+hr+hg+hb;
}

function urlencode(str) {
    str = encodeURIComponent(str);
    str = str.replace(/!/g, '%21');
    str = str.replace(/'/g, '%27');
    str = str.replace(/\(/g, '%28');
    str = str.replace(/\)/g, '%29');
    str = str.replace(/\*/g, '%2A');  
    return str;
}

function stripHTML(text) {
    return text.replace(/<[^>]*>/g, "");  
}

StephaneNodesUI = Ext.extend(GeoExt.tree.LayerNodeUI, {
    render: function(bulkRender) {
		var a = this.node.attributes;
		if (a.checked === undefined) {
			a.checked = this.node.layer.getVisibility();
		}
		var rendered = this.rendered;
		GeoExt.tree.LayerNodeUI.superclass.render.apply(this, arguments);
		if(!rendered) {
			this.elNode.tooltip = this.node.layer.attribution;
		  
			// add div in the node
			var elt = Ext.DomHelper.append(this.elNode, [
				{"tag": "div"}//, "style": "position:relative;left:20"}
			]);
			var buttons = [];

			var cb = this.node.attributes.checkbox;
			var rg = a.radioGroup || this.radioGroup;
			var cg = a.checkedGroup || this.checkedGroup;

			if (rg && this.radio === null) {
				this.radio = Ext.DomHelper.insertAfter(cb,
					['<input type="radio" class="gx-tree-layer-radio" name="',
					rg, '_radio"></input>'].join(""));
			}
			if(cg) {
				// replace the checkbox with a radio button
				var radio = Ext.DomHelper.insertAfter(cb,
					['<input type="radio" name="', cg,
					'_checkbox" class="', cb.className,
					cb.checked ? '" checked="checked"' : '',
					'"></input>'].join(""));
				radio.defaultChecked = cb.defaultChecked;
				Ext.get(cb).remove();
				this.checkbox = radio;
			}
			this.enforceOneVisible();

			var component = a.component || this.component;
			var opacitySlider = a.opacitySlider || this.opacitySlider;
			if (opacitySlider) {
			    if (!this.node.layer.opacity) {
				this.node.layer.opacity = 1;
			    }
			    var slider = new GeoExt.LayerOpacitySlider({
				    layer: this.node.layer,
				    width: 200,
				    value: this.node.layer.opacity * 100,
				    maxValue: 100,
				    aggressive: true,
				    changeVisibility: true
			    });
			    buttons.push(slider)
			}

			buttons.push('->');

			var intoAction = true; //a.upAction || this.upAction;
			if (intoAction) {
				buttons.push(new Ext.Action({
					iconCls: 'info',
					handler: function() {
						var text = "";
						text += "Title: " + this.text + "<br />";
						text += "Reference: " + this.ref + "<br />";
						text += "Copyright: " + stripHTML(this.attribution) + "<br />";
						var url = this.url;
						if (url) {
						    if (url instanceof Array) {
							url = url[0];
						    }
						    var index = url.indexOf("/${z}/${x}/${y}.png");
						    if (index > 0) {
							    text += "Get from: " + url.substring(0, index);
						    }
						    else {
							    text += "Get from: " + url;
						    }
						}
						new Ext.Window({
							title: OpenLayers.i18n("Layer informations"),
							items: [{
								border: false,
								style: "padding: 7px; font-size: 120%;",
								cls: 'no-background',
								html: text
							}]
						}).show();
					},
					scope: this.node.layer
				}));
			}
			var upAction = a.upAction || this.upAction;
			if (upAction) {
				buttons.push(new Ext.Action({
					iconCls: 'up',
					tooltip: OpenLayers.i18n("Move the layer to the front"),
					handler: function() {
						var index = this.map.getLayerIndex(this);
						if (index == this.map.layers.length - 1) {
							return;
						}
						this.map.setLayerIndex(this, index + 1);
					},
					scope: this.node.layer
				}));
			}
			var downAction = a.downAction || this.downAction;
			if (downAction) {
				buttons.push(new Ext.Action({
					iconCls: 'down',
					tooltip: OpenLayers.i18n("Move the layer to the background"),
					handler: function() {
						var index = this.map.getLayerIndex(this);
						if (index == 0) {
							return;
						}
						this.map.setLayerIndex(this, index - 1);
					},
					scope: this.node.layer
				}));
			}

			var deleteAction = a.deleteAction || this.deleteAction;
			if (deleteAction) {
				buttons.push(new Ext.Button({
					iconCls: 'close',
					tooltip: OpenLayers.i18n("Remove the layer from the map"),
					handler: function() {
						this.map.removeLayer(this);
					},
					scope: this.node.layer
				}));
			}

			new Ext.Toolbar({
				renderTo: elt,
				cls: "gx-toolbar no-over",
				buttons: buttons,
				style: "background-color: transparent; background-image: none;"
			});
		}
    },

    renderElements : function(n, a, targetNode, bulkRender) {
        
        this.indentMarkup = n.parentNode ? n.parentNode.ui.getChildIndent() : '';

        var cb = Ext.isBoolean(a.checked),
            nel,
            href = a.href ? a.href : Ext.isGecko ? "" : "#",
            buf = ['<li class="x-tree-node"><div ext:tree-node-id="',n.id,'" class="x-tree-node-el x-tree-node-leaf x-unselectable ', a.cls,'" unselectable="on">',
            '<span class="x-tree-node-indent">',this.indentMarkup,"</span>",
            '<img style="display:none;" src="', this.emptyIcon, '" class="x-tree-ec-icon x-tree-elbow" />',
            '<img style="display:none;" src="', a.icon || this.emptyIcon, '" class="x-tree-node-icon',(a.icon ? " x-tree-node-inline-icon" : ""),(a.iconCls ? " "+a.iconCls : ""),'" unselectable="on" />',
            cb ? ('<input class="x-tree-node-cb" type="checkbox" ' + (a.checked ? 'checked="checked" />' : '/>')) : '',
            '<a hidefocus="on" class="x-tree-node-anchor" href="',href,'" tabIndex="1" ',
             a.hrefTarget ? ' target="'+a.hrefTarget+'"' : "", '><span unselectable="on">',n.text,"</span></a></div>",
            '<ul class="x-tree-node-ct" style="display:none;"></ul>',
            "</li>"].join('');

        if (bulkRender !== true && n.nextSibling && (nel = n.nextSibling.ui.getEl())) {
            this.wrap = Ext.DomHelper.insertHtml("beforeBegin", nel, buf);
        }
        else {
            this.wrap = Ext.DomHelper.insertHtml("beforeEnd", targetNode, buf);
        }

        this.elNode = this.wrap.childNodes[0];
        this.ctNode = this.wrap.childNodes[1];
        var cs = this.elNode.childNodes;
        this.indentNode = cs[0];
        this.ecNode = cs[1];
        this.iconNode = cs[2];
        var index = 3;
        if(cb){
            this.checkbox = cs[3];
            
            this.checkbox.defaultChecked = this.checkbox.checked;
            index++;
        }
        this.anchor = cs[index];
        this.textNode = cs[index].firstChild;
    }
});
