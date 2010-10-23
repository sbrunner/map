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
        "featureselected": displayFeature,
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
    if (list.length === 0) {
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
function rgbToHsl(r, g, b){
    r /= 255, g /= 255, b /= 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, l = (max + min) / 2;

    if(max == min){
        h = s = 0; // achromatic
    }else{
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
function hslToRgb(h, s, l){
    var r, g, b;

    if(s == 0){
        r = g = b = l; // achromatic
    }else{
        function hue2rgb(p, q, t){
            if(t < 0) t += 1;
            if(t > 1) t -= 1;
            if(t < 1/6) return p + (q - p) * 6 * t;
            if(t < 1/2) return q;
            if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
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

GeoExt.ux.cyclingRoutingService = function (options, type, start, end, catchResult, scope) {
    //Ext.decode(json)
    var newUrl = "source=" + start + "&target=" + end + "&lang=" + OpenLayers.Lang.getCode();
    var proxy = new Ext.data.ScriptTagProxy({
//    var proxy = new Ext.data.HttpProxy({
        url: "http://localhost:5000/routing?" + newUrl,
//        url: "http://localhost/map/Export/proxy.php?url=" + urlencode("http://localhost:5000/routing?" + newUrl),
        nocache: false
    });
    
    var reader = new Ext.data.DataReader();
    reader.geojsonReader = new OpenLayers.Format.GeoJSON();
    reader.readResponse = function(action, response) {
        var data = this.geojsonReader.read(response);
        
        var distance = null;
        var time = null;
        var hours = null;
        var minutes = null;
        var instructions = '';
        var features = data.pop().data
        
        if (features.distance) {
            distance = features.distance;
        }
        var first = true;
        for (var i = 0 ; i < data.length ; i++) {
            var d = data[i].attributes;
            if (first) { 
                first = false;
//                instructions += '<hr /><p>';
            }
            else { 
//                instructions += '<br />';
            }
            d.speed = d.waylength / d.time * 3600;
            d.elevation = Math.abs(d.elevation);
            d.decinivite = Math.round(d.elevation / d.waylength / 10) + "&nbsp;%";
            d.elevation = Math.round(d.elevation) + "&nbsp;m";
            d.waylength = (Math.round(d.waylength * 100) / 100) + "&nbsp;km";
            
            time = d.time;
            minutes = Math.floor(time / 60);
            seg = Math.round(time % 60);
            if (seg < 10) {
                seg = '0'+seg;
            }
            d.time = minutes+'.'+seg+'&nbsp;min.s';

//            d.denivele = d.elevation / d.waylength / 10;
            var instruction = d.name + ' (' + /*d.time + ', ' 
                    + d.waylength + ', ' 
                    + d.elevation + ', ' */
                    + Math.round(d.speed) + "&nbsp;km/h" + ')';
            d.instruction = instruction;
//            instructions += instruction;
        }
//        instructions += '</p>';

        if (features.time) {
            time = features.time;
            hours = Math.floor(time / 3600);
            minutes = Math.round((time / 60) % 60);
            if (minutes < 10) {
                minutes = '0'+minutes;
            }
        }
        
        var html = '<p>' + OpenLayers.i18n('Total length: ') + Math.round(distance * 100) / 100 + ' km</p>'
                + '<p>' + OpenLayers.i18n('Total time: ') + hours + 'h' + minutes + '</p>'
                + instructions + '<hr />';

        catchResult.call(scope, true, html, data);
    }


    proxy.doRequest('', null, {}, reader);
}

