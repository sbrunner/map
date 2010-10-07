/**
 * @requires OpenLayers/Projection.js
 * @requires OpenLayers/Control.js
 */

Array.prototype.contains = function (needle) {
   for (i in this) {
       if (this[i] == needle) return true;
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

function displayFeature(o)
{
    var html = null;
    for (a in o.feature.attributes) {
        if (html == null) {
            html = '';
        }
        else {
            html += '<br />'
        }
        if (a == 'website') {
            var href = o.feature.attributes[a];
            html += a + ': <a href="' + href + '">' + href + '</a>';
        }
        else if (a == 'url') {
            var href = o.feature.attributes[a];
            html += a + ': <a href="' + href + '">' + href + '</a>';
        }
        else if (a == 'wikipedia') {
            var href = 'http://en.wikipedia.org/wiki/' + o.feature.attributes[a];
            html += a + ': <a href="' + href + '">' + o.feature.attributes[a] + '</a>';
        }
        else if (a.match('^wikipedia:')) {
            var lang = a.substring('wikipedia:'.length, a.length);
            var href = 'http://' + lang + '.wikipedia.org/wiki/' + o.feature.attributes[a];
            html += a + ': <a href="' + href + '">' + o.feature.attributes[a] + '</a>';
        }
        else if (a == 'OSM user') {
            var href = "http://www.openstreetmap.org/user/" + o.feature.attributes[a];
            html += '<a href="' + href + '">Last edit by ' + o.feature.attributes[a] + '</a>';
        }
        else {                  
            html += a + ": " + o.feature.attributes[a];
        }
    }
    var href = "http://www.openstreetmap.org/browse/" + o.feature.type + "/" + o.feature.osm_id + "/history";
    html += '<br /><a href="' + href + '">History</a>';
    
    OpenLayers.Util.getElement('featureData').innerHTML = "<p>" + html + "</p>";
//    mainPanel.doLayout();
}

function getEventListener() {
    return {
        "featureselected": function(o) {
            displayFeature(o);
        },
        scope: this
    }
}
function addLayer(map, options) {
    options.isBaseLayer = false;
    map.addLayer(new OpenLayers.Layer.XYZ(options.text, options.url, options));
}
function addXapiStyleLayer(map, options) {
    var name = options.text;
    var styleMap = options.style;
    var id = options.id;
    var element = options.element;
    var predicate = options.predicate;

    var format = new OpenLayers.Format.OSM({ 
        checkTags: true,
        externalProjection: epsg4326
    });
    var protocol;
    var strategies = null;
    if (OpenLayers.OSM_URL) {
        protocol = new OpenLayers.Protocol.HTTP({
            url: OpenLayers.OSM_URL,
            format: format
        });
        strategies = [ new OpenLayers.Strategy.Fixed({ preload: false }) ]
    }
    else {
        protocol = new OpenLayers.Protocol.XAPI({
            element: element,
            predicate: predicate,
            format: format
        });
        strategies = [ new OpenLayers.Strategy.BBOX({ ratio: 1.2 }) ]
    }

    layer = new OpenLayers.Layer.Vector(name, {
        id: id,
        projection: epsg4326,
        strategies: strategies, 
        protocol: protocol,
        eventListeners: getEventListener(),
        styleMap: styleMap,
        numZoomLevels: 22,
        attribution: "<a href='http://www.osm.org/'>CC by-sa - OSM</a>"
    });
    map.addLayer(layer);
    var sf = new OpenLayers.Control.SelectFeature(layer, {
      autoActivate: true,
      hover: true
    });
    map.addControl(sf);
}
function addOsmStyleLayer(map, options) {
    var name = options.text;
    var styleMap = options.style;
    var id = options.id;

    var url = "http://api.openstreetmap.org/api/0.6/map?";
    var strategies = [];
    if (OpenLayers.OSM_URL) {
        url = OpenLayers.OSM_URL;
        strategies = [ new OpenLayers.Strategy.Fixed({ preload: false }) ]
    }
    else {
        strategies = [ new OpenLayers.Strategy.BBOX({ ratio: 1.2 }) ];
    }
    layer = new OpenLayers.Layer.Vector(name, {
        id: id,
        projection: epsg4326,
        maxResolution: 1.5,
        strategies: strategies,
        protocol: new OpenLayers.Protocol.HTTP({
//            url: "http://localhost/ol/osm.osm",
            url: url,
            format: new OpenLayers.Format.OSM({ 
                checkTags: true,
                externalProjection: epsg4326
            })
        }),
        eventListeners: getEventListener(),
        styleMap: styleMap,
        numZoomLevels: 22,
        attribution: "<a href='http://www.osm.org/'>CC by-sa - OSM</a>"
    });
    map.addLayer(layer);
    var sf = new OpenLayers.Control.SelectFeature(layer, {
      autoActivate: true,
      hover: true
    });
    map.addControl(sf);
}

OpenLayers.Control.PermalinkLayer = OpenLayers.Class(OpenLayers.Control.Permalink, {
    my_layers: null,
    
    initialize: function(element, base, my_layers) {
        this.my_layers = my_layers;
        this.element = OpenLayers.Util.getElement(element);
        this.base = base || document.location.href;
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
    l = l.replace("#\?", "#");
    if (Ext.get("permalink")) {
        Ext.get("permalink").update("<a href=" + l + ">" + OpenLayers.i18n("Permalink") + "</a>");
    
        var l = provider.getLink(permalinkTitleBase);
        l = l.replace("#\?", "#");
        window.location.href = l;
        
        var bounds = mapPanel.map.getExtent();
        bounds = bounds.transform(mapPanel.map.getProjectionObject(), mapPanel.map.displayProjection);

        if (bounds) {
            Ext.get("josm").update("<a href='http://127.0.0.1:8111/load_and_zoom?"
                + "left=" + bounds.left + "&right=" + bounds.right
                + "&top=" + bounds.top + "&bottom=" + bounds.bottom + "'>" + OpenLayers.i18n("Edit with JOSM") + "</a>");
        }
    }    
};

function getEllements(list, end) {
    if (list.length == 0) {
        end.region = "center";
        end.border = false;
        return end;
    }
    else {
        element = list[0];
        element.layout = 'fit';
        element.region = 'north';
        element.animCollapse = false;
        element.border = false;
        element.hideCollapseTool = true;
        element.collapseMode = "mini";
        element.collapsed = !getBooleanValue(permalinkProvider.state.a['open_' + element.name], false);

        title = element.title;
        delete element.title;
        list.shift();
        
        var content = new Ext.Panel(element);
        content.addListener('collapse', function() { 
            permalinkProvider.state.a['open_' + this.name] = false; 
            onStatechange(permalinkProvider); 
        }, element);
        content.addListener('expand', function() { 
            permalinkProvider.state.a['open_' + this.name] = true; 
            onStatechange(permalinkProvider); 
        }, element);
        var title = new Ext.Button({
            region: 'north',
            html: '<h2>' + title + '</h2>',
            style: "padding: 4px 8px;",
            enableToggle: true,
            handler: function() {
                if (this.collapsed) {
                    this.expand();
                }
                else {
                    this.collapse();
                }
            },
            scope: content
        });
        
        return {
            region: 'center',
            layout: 'border',
            border: false,
            style: "border-top: solid 1px #99BBE8;",
            items: [title,
            {
                region: 'center',
                layout: 'border',
                border: false,
                items: [content, getEllements(list, end)]
            }]
        }
    }
};
