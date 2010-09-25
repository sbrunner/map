

if (!OpenLayers.OSM_URL) {
    OpenLayers.ProxyHost = "proxy.php?url="; // proxy is required here
}

var epsg900913 = new OpenLayers.Projection("EPSG:900913");
var epsg4326 = new OpenLayers.Projection("EPSG:4326");

var mapPanel;
var permalinkProvider;
var permalinkBase;
var permalinkTitleBase;

function getEventListener() {
    return {
        "featureselected": function(o) {
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
        },
        scope: this
    }
}
function addXapiStyleLayer(map, name, styleMap, type, id, element, predicate) {
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
        visibility: false,
        type: type,
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
function addOsmStyleLayer(map, name, styleMap, type, id) {
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
        visibility: false,
        type: type,
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

Ext.onReady(function() {

    // set a permalink provider
    var index = window.location.href.indexOf("#");
    if (index > 0) {
        permalinkTitleBase = window.location.href.substring(0, index + 1);
    }
    else {
        permalinkTitleBase = window.location.href + "#";
    }
    var index = permalinkTitleBase.indexOf("#");
    if (index > 0) {
        permalinkBase = permalinkTitleBase.substring(0, index) + "#";
    }
    else {
        permalinkBase = permalinkTitleBase;
    }  
    
    permalinkProvider = new GeoExt.state.PermalinkProvider({encodeType: false });
    Ext.state.Manager.setProvider(permalinkProvider);

    var map = new OpenLayers.Map({
        projection: epsg900913,
        displayProjection: epsg4326,
        units: "m",
        theme: null,
        numZoomLevels: 18,
        maxResolution: 156543.0339,
        maxExtent: new OpenLayers.Bounds(-20037508, -20037508, 20037508, 20037508.34)
    });

    map.addControl(new OpenLayers.Control.PanZoomBar());
    map.addControl(new OpenLayers.Control.MousePosition());
    map.addControl(new OpenLayers.Control.KeyboardDefaults());
    map.addControl(new OpenLayers.Control.Attribution());
//            map.addControl(new OpenLayers.Control.MouseDefaults());
    map.addControl(new OpenLayers.Control.ScaleLine({geodesic: true}));

    map.addControl(new OpenLayers.Control.PermalinkLayer("permalink.potlatch", "http://www.openstreetmap.org/edit"));
    map.addControl(new OpenLayers.Control.PermalinkLayer("permalink.amenity.editor", " http://ae.osmsurround.org/"));
    map.addControl(new OpenLayers.Control.PermalinkLayer("permalink.keepright", "http://keepright.ipax.at/report_map.php"));
    map.addControl(new OpenLayers.Control.PermalinkLayer("permalink.restrictions", "http://osm.virtuelle-loipe.de/restrictions/"));
    map.addControl(new OpenLayers.Control.PermalinkLayer("permalink.maxspeed", "http://maxspeed.osm.lab.rfc822.org/", "B0TF"));
    map.addControl(new OpenLayers.Control.PermalinkLayer("permalink.refuges", "http://refuges.info/nav.php?choix_layer=OSM"));
    map.addControl(new OpenLayers.Control.PermalinkLayer("permalink.letuffe", "http://beta.letuffe.org/"));
    map.addControl(new OpenLayers.Control.PermalinkLayer("permalink.browser", "http://www.openstreetbrowser.org/"));

    typeBase = "base";
    typeSrtm = "srtm";
    typeExternals = "ext";
    typeUtils = "utils";
    typeDebugs = "debug";
    typeHist = "hist";
    typeBrutNodes = "node";
    typeBrutWays = "way";
    typeBrutRels = "relation";

    map.addLayer(new OpenLayers.Layer.XYZ("Mapnik", "http://c.tile.openstreetmap.org/${z}/${x}/${y}.png", { numZoomLevels: 18, type: typeBase, attribution: "<a href='http://www.osm.org/'>CC by-sa - OSM</a>", id: "mk" }));
    map.addLayer(new OpenLayers.Layer.XYZ("Fond blanc", "http://map.stephane-brunner.ch/white.png", { numZoomLevels: 22, type: typeDebugs, visibility: false, id: "w" }));
    map.addLayer(new OpenLayers.Layer.XYZ("Fond noire", "http://map.stephane-brunner.ch/black.png", { numZoomLevels: 22, type: typeDebugs, visibility: false, id: "b" }));
    map.addLayer(new OpenLayers.Layer.XYZ("TopoMap*", "http://map.stephane-brunner.ch/topo/${z}/${x}/${y}.png", 
            { numZoomLevels: 18, type: typeSrtm, visibility: false, buffer:1, attribution: "Data by <a href='ftp://e0srp01u.ecs.nasa.gov/srtm/version2/SRTM3/'>NASA</a>, <a href='http://asterweb.jpl.nasa.gov/gdem.asp'>ASTER</a>, <a href='http://www.gebco.net/'>GEBCO</a> and <a href='http://www.osm.org/'>OSM</a>", id: "topo" }));
    map.addLayer(new OpenLayers.Layer.XYZ("Osmarender", "http://b.tah.openstreetmap.org/Tiles/tile/${z}/${x}/${y}.png", { numZoomLevels: 18, type: typeBase, visibility: false, attribution: "<a href='http://www.osm.org/'>CC by-sa - OSM</a>", id: "osma" }));
    map.addLayer(new OpenLayers.Layer.XYZ("Cycliste", "http://b.tile.opencyclemap.org/cycle/${z}/${x}/${y}.png", { numZoomLevels: 18, type: typeBase, visibility: false, attribution: "<a href='http://www.osm.org/'>CC by-sa - OSM</a>", id: "bike" }));
    map.addLayer(new OpenLayers.Layer.XYZ("Piste", "http://tiles.openpistemap.org/contours/${z}/${x}/${y}.png", { numZoomLevels: 18, type: typeBase, visibility: false, attribution: "<a href='http://www.osm.org/'>CC by-sa - OSM</a>", id: "sky" }));
    map.addLayer(new OpenLayers.Layer.XYZ("Transport public", "http://tile.xn--pnvkarte-m4a.de/tilegen/${z}/${x}/${y}.png", { numZoomLevels: 19, type: typeBase, visibility: false, attribution: "<a href='http://www.osm.org/'>CC by-sa - OSM</a>", id: "pt" }));
    map.addLayer(new OpenLayers.Layer.XYZ("CloudMade Nonames", "http://tile.cloudmade.com/D563D910896D4B67B22BC1088920C483/3/256/${z}/${x}/${y}.png",
            {displayOutsideMaxExtent: true, numZoomLevels: 18, attribution: "<a href='http://www.openstreetmap.org/'>CC-BY-SA OpenStreetMap &amp; Contributors</a> -- tiles from <a href='http://www.cloudmade.com/'>CloudMade</a>", type: typeDebugs, visibility: false, id: "non" }));

    //map.addLayer(new OpenLayers.Layer.OSM("OpenAerialMap","http://tile.openaerialmap.org/tiles/1.0.0/openaerialmap-900913/${z}/${x}/${y}.png"));
    //map.addLayer(new OpenLayers.Layer.XYZ("OSM (semitransparent)", "http://c.tile.openstreetmap.org/${z}/${x}/${y}.png", { isBaseLayer: false, visibility: false, opacity: 0.4}));
    //map.addLayer(new OpenLayers.Layer.XYZ("OPM (semitransparent)", "http://openpistemap.org/tiles/nocontours/${z}/${x}/${y}.png", { isBaseLayer: false, visibility: false, opacity: 0.4}));

    map.addLayer(new OpenLayers.Layer.XYZ("Septembre 2008", "lausanne-20080926/${z}/${x}/${y}.png", {numZoomLevels: 18, isBaseLayer: false, type: typeHist, attribution: "<a href='http://www.osm.org/'>CC by-sa - OSM</a>", id: "20080926", visibility: false, opacity: 0.5 }));
    /*map.addLayer(new OpenLayers.Layer.XYZ("Lausanne mai 2009", "lausanne-20090515/${z}/${x}/${y}.png", null));*/
    map.addLayer(new OpenLayers.Layer.XYZ("Juin 2009", "lausanne-20090606/${z}/${x}/${y}.png", {numZoomLevels: 18, isBaseLayer: false, type: typeHist, attribution: "<a href='http://www.osm.org/'>CC by-sa - OSM</a>", id: "20090606", visibility: false, opacity: 0.5 }));
    map.addLayer(new OpenLayers.Layer.XYZ("Juin 2010", "lausanne-20100622/${z}/${x}/${y}.png", {numZoomLevels: 18, isBaseLayer: false, type: typeHist, attribution: "<a href='http://www.osm.org/'>CC by-sa - OSM</a>", id: "20100622", visibility: false, opacity: 0.5 }));


    map.addLayer(new OpenLayers.Layer.XYZ("Contours*", "http://map.stephane-brunner.ch/contours/${z}/${x}/${y}.png", 
            { numZoomLevels: 18, type: typeSrtm, visibility: false, buffer: 1, isBaseLayer: false, attribution: "Data by <a href='ftp://e0srp01u.ecs.nasa.gov/srtm/version2/SRTM3/'>NASA</a>, <a href='http://asterweb.jpl.nasa.gov/gdem.asp'>ASTER</a>", id: "cont" }));
    //map.addLayer(new OpenLayers.Layer.Error("Adresses incomplettes*"));

    addXapiStyleLayer(map, "Vitesses maximales", getMaxSpeedStyle(), typeUtils, "speed", "way", "maxspeed=*");
    addXapiStyleLayer(map, "Poid maximum", null, typeUtils, "weight", "way", "maxweight=*");
    addXapiStyleLayer(map, "Hauteur maximale", null, typeUtils, "height", "way", "maxheight=*");
    addXapiStyleLayer(map, "Largeur maximale", null, typeUtils, "width", "way", "maxwidth=*");
    addXapiStyleLayer(map, "Longueur maximale", null, typeUtils, "length", "way", "maxlength=*");

    //addOsmStyleLayer(map, "Randonnée", getHikkingStyle(), typeExternals);
    addXapiStyleLayer(map, "Randonnée (Ways)", getHikkingStyle(), typeExternals, "sac.w", "way", "natural=peak|mountain_pass=yes");
    addXapiStyleLayer(map, "Randonnée (Nodes)", getHikkingStyle(), typeExternals, "sac.n", "node", "sac_scale|highway=path");

    addXapiStyleLayer(map, "MTB", getMTBStyle(), typeExternals, "mtb", "way", "mtb:scale=*|route=mtb|route=bicycle");
    addXapiStyleLayer(map, "Luge", getSledStyle(), typeExternals, "sled", "way", "piste:type=sled");
    addXapiStyleLayer(map, "Raquette", getSnowShoeStyle(), typeExternals, "ss", "relation", "route=snowshoe");
    addXapiStyleLayer(map, "Fond", getNordicStyle(), typeExternals, "nordic", "way", "piste:type=nordic");
    addXapiStyleLayer(map, "Sky", getSkyStyle(), "dh", "way", "piste:type=downhill");
    addXapiStyleLayer(map, "Winter Walks", typeExternals, getWinterWalksStyle(), "ww", "relation", "route=winterwalks");
    addXapiStyleLayer(map, "Pourcours santé / PisteVita", getVitaStyle(), typeExternals, "ft", "relation", "route=fitness_trail");

    map.addLayer(new OpenLayers.Layer.XYZ("Text of fixme and note", "http://beta.letuffe.org/tiles/renderer.py/fixme-text/${z}/${x}/${y}.png",
              { displayOutsideMaxExtent: true , buffer:1, isBaseLayer: false, visibility: false, type: typeDebugs, attribution: "<a href='http://www.osm.org/'>CC by-sa - OSM</a>", id: "fn" }));

    //map.addLayer(new OpenLayers.Layer.TM("TopoMap* (semitransparent)", { isBaseLayer: false, visibility: false, opacity: 0.6, numZoomLevels: 17 }));

    map.addLayer(new OpenLayers.Layer.XYZ("Nœud dupliqué", "http://matt.dev.openstreetmap.org/dupe_nodes/tiles/renderer.py/1.0.0/dupe_nodes/${z}/${x}/${y}.png", { isBaseLayer: false, visibility: false, numZoomLevels: 18, type: typeDebugs, attribution: "<a href='http://www.osm.org/'>CC by-sa - OSM</a>", id: "dbl" }));
    map.addLayer(new OpenLayers.Layer.XYZ("Itinéraires de randonnées", "http://osm.lonvia.de/hiking/${z}/${x}/${y}.png", { isBaseLayer: true, visibility: false, numZoomLevels: 17, type: typeBase, attribution: "<a href='http://www.osm.org/'>CC by-sa - OSM</a>", id: "hiking" }));

    
    var types = [typeBrutNodes, typeBrutWays, typeBrutRels];
    var cats = ["leisure", "amenity", "shop", "office", "tourism", "historic", "highway", "barrier", "cycleway", "tracktype", "railway", "aeroway", "power", "man_made", "landuse", "military", "natural", "route", "boundary", "sport", "abutters", "accessories", "place"];
    for (var i in types) {
        type = types[i];
        for (var j in cats) {
            cat = cats[j];
            addXapiStyleLayer(map, cat, null, type, type + "." + cat, type, cat + "=*");
        }
    }
    

    addOsmStyleLayer(map, "All features", getOSMStyle(), typeBase, "osm");
    addOsmStyleLayer(map, "Brut", null, typeDebugs, "brut");

    if (map.getZoom() == 0) {
      if (navigator.geolocation) {
        try {
          navigator.geolocation.getCurrentPosition(usePosition);
        }
        catch (e) {
          map.zoomToMaxExtent();
        }
      }
      else {
        map.zoomToMaxExtent();
      }
    }


    mapPanel = new GeoExt.MapPanel({
        map: map,
        border: true,
        region: "center",
        stateId: "m"
    });
    
    // update link when state chnages
    var onStatechange = function(provider) {
        var l = provider.getLink(permalinkBase);
        l = l.replace("#\?", "#");
        Ext.get("permalink").update("<a href=" + l + ">Permalink</a>");
        
        var l = provider.getLink(permalinkTitleBase);
        l = l.replace("#\?", "#");
        window.location.href = l;
        
        var bounds = mapPanel.map.getExtent();

        var pos = OpenLayers.Projection.transform(
            { x: bounds.left, y: bounds.top },
            mapPanel.map.getProjectionObject(),
            mapPanel.map.displayProjection);
        bounds.left = pos.x;
        bounds.top = pos.y;

        var pos = OpenLayers.Projection.transform(
            { x: bounds.right, y: bounds.bottom },
            mapPanel.map.getProjectionObject(),
            mapPanel.map.displayProjection);
        bounds.right = pos.x;
        bounds.bottom = pos.y;

        if (bounds) {
            Ext.get("josm").update("<a href='http://127.0.0.1:8111/load_and_zoom?"
                + "left=" + bounds.left + "&right=" + bounds.right
                + "&top=" + bounds.top + "&bottom=" + bounds.bottom + "'>Edit with JOSM</a>");
        }
        
    };
    permalinkProvider.on({statechange: onStatechange});


    // using OpenLayers.Format.JSON to create a nice formatted string of the
    // configuration for editing it in the UI
    var treeConfig = new OpenLayers.Format.JSON().write([{
        nodeType: "gx_baselayercontainer"
    }, {
        nodeType: "gx_overlaylayercontainer",
        expanded: true,
    }], true);

    function createLayerContainer(title, type, open) {
        return new GeoExt.tree.LayerContainer({
            text: title,
            layerStore: mapPanel.layers,
            leaf: false,
            expanded: open,
            loader: new GeoExt.tree.LayerLoader({
                filter: function(record) {
                    var layer = record.data.layer;
//                    var layer = record.getLayer();
                    return layer.type === type;
                }
            })
        });
    }

    layerContainerList = [
        createLayerContainer("Base Layers", typeBase, true),
        createLayerContainer("Altitude", typeSrtm, true),
        createLayerContainer("Outdoor", typeExternals, true),
        createLayerContainer("Utils", typeUtils, true),
        new Ext.tree.TreeLoader({
            text: "Debug",
            children: [
                createLayerContainer("Swiss history", typeHist, false),
                createLayerContainer("Autre", typeDebugs, false)
            ]
        }),
        new Ext.tree.TreeLoader({
            text: "Affichage brut",
            children: [
                createLayerContainer("Nodes", typeBrutNodes, false),
                createLayerContainer("Ways", typeBrutWays, false),
                createLayerContainer("Relations", typeBrutRels, false)
            ]
        })
    ];


    // create the tree with the configuration from above
    var tree = new Ext.tree.TreePanel({
        border: true,
        region: "top",
        title: "Layers",
        width: 200,
        split: true,
        collapsible: true,
        collapseMode: "mini",
        autoScroll: true,
        loader: new Ext.tree.TreeLoader({
            // applyLoader has to be set to false to not interfer with loaders
            // of nodes further down the tree hierarchy
            applyLoader: false,
        }),
        root: {
            nodeType: "async",
            children: layerContainerList
        },
        rootVisible: false,
        lines: false
    });
    
    new Ext.Viewport({
        layout: "fit",
        hideBorders: true,
        items: [{
            layout: "border",
            deferredRender: false,
            items: [mapPanel, {
                layout: "accordion",
                region: "east",
                collapseMode: "mini",
                split: true,
                width: 200,
                items: [tree, {
                        contentEl: "desc",
                        region: "top",
                        title: "Infos"
                }]
            }]
        }]
    });
});


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
