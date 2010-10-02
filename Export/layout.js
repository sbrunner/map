/**
 * @requires commonstyle.js
 * @requires josmstyle.js
 * @requires osmstyle.js
 * @requires style.js
 * @requires protocole.js
 * @requires utils.js
 * 
 * @requires OpenLayers/Util.js
 * @requires OpenLayers/Lang.js
 * @requires OpenLayers/Map.js
 * @requires OpenLayers/Control/SelectFeature.js
 * @requires OpenLayers/Control/PanZoomBar.js
 * @requires OpenLayers/Control/MousePosition.js
 * @requires OpenLayers/Control/KeyboardDefaults.js
 * @requires OpenLayers/Control/Attribution.js
 * @requires OpenLayers/Control/ScaleLine.js
 * @requires OpenLayers/Control/Permalink.js
 * @requires OpenLayers/Control/ArgParser.js
 * @requires OpenLayers/Strategy/Fixed.js
 * @requires OpenLayers/Strategy/BBOX.js
 * @requires OpenLayers/Protocol/HTTP.js
 * @requires OpenLayers/Format/JSON.js
 * @requires OpenLayers/Format/OSM.js
 * @requires OpenLayers/Layer/Vector.js
 * @requires OpenLayers/Layer/XYZ.js
 * 
 * @requires GeoExt/widgets/MapPanel.js
 * @requires GeoExt/widgets/tree/LayerContainer.js
 * @requires GeoExt/widgets/tree/LayerLoader.js
 * @requires GeoExt/state/PermalinkProvider.js
 * 
 * @requires OpenLayers/Control/Measure.js
 * @requires OpenLayers/Handler/Path.js
 * @requires OpenLayers/Handler/Polygon.js
 * @requires GeoExt.ux/MeasureLength.js
 * @requires GeoExt.ux/MeasureArea.js
 * 
 * @requires GeoExt.ux/GeoNamesSearchCombo.js
 * @requires widgets/RoutingPanel.js
 */


if (!OpenLayers.OSM_URL) {
    OpenLayers.ProxyHost = "proxy.php?url="; // proxy is required here
}
OpenLayers.IMAGE_RELOAD_ATTEMPTS = 2;

var lang = 'en';
if (navigator.language) {
    lang = navigator.language.substring(0, 2);
}
if (['en', 'fr'].contains(lang)) {
    document.write("<script type=\"text/javascript\" src=\"" + lang + ".js\"></script>");
    document.write("<meta HTTP-EQUIV=\"Content-Language\" CONTENT=\"" + lang + "\" />");

}
OpenLayers.Lang.defaultCode = lang;
OpenLayers.Lang.setCode(lang);

var mainPanel;
var mapPanel;
var permalinkProvider;
var permalinkBase;
var permalinkTitleBase;
var tree;

Ext.onReady(function() {
    
    var width = 300;

    document.title += " " + OpenLayers.i18n("Various OSM map");
    Ext.QuickTips.init();
    
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
    map.addControl(new OpenLayers.Control.ScaleLine({geodesic: true, maxWidth: 120}));

    map.addLayer(new OpenLayers.Layer.XYZ(OpenLayers.i18n("White background"), "http://map.stephane-brunner.ch/white.png", { numZoomLevels: 22, id: "w", displayInLayerSwitcher: false, id: "white" }));
    map.addLayer(new OpenLayers.Layer.XYZ(OpenLayers.i18n("Mapnik"), "http://c.tile.openstreetmap.org/${z}/${x}/${y}.png", { numZoomLevels: 18, isBaseLayer: false, attribution: "<a href='http://www.osm.org/'>CC by-sa - OSM</a>", id: "mk" }));
    //map.addLayer(new OpenLayers.Layer.XYZ(OpenLayers.i18n("Black background"), "http://map.stephane-brunner.ch/black.png", { numZoomLevels: 22, type: typeDebugs, visibility: false, id: "b" }));
    //map.addLayer(new OpenLayers.Layer.OSM("OpenAerialMap","http://tile.openaerialmap.org/tiles/1.0.0/openaerialmap-900913/${z}/${x}/${y}.png"));


    var brutes = {
        text: OpenLayers.i18n("Raw"),
        leaf: false,
        children: []
    };
    var types = ['node', 'way', 'relation'];
    var cats = ["leisure", "amenity", "shop", "office", "tourism", "historic", "highway", "barrier", "cycleway", "tracktype", "railway", "aeroway", "power", "man_made", "landuse", "military", "natural", "route", "boundary", "sport", "abutters", "accessories", "place"];
    for (var i in types) {
        type = types[i];
        var typeNode = {
            text: OpenLayers.i18n(toTitleCase(type + 's')),
            leaf: false,
            children: []
        };
        brutes.children.push(typeNode);
        for (var j = 0 ; j < cats.length ; j++) {
            cat = cats[j];
            var catNode = {
                text: OpenLayers.i18n(toTitleCase(cat)),
                map: map,
                leaf: true,
                handler: addXapiStyleLayer,
                style: null,
                id: type + "." + cat,
                element: type,
                predicate: cat
            }
            typeNode.children.push(catNode);
        }
    }
    
    var rootNode = {
            expanded: true,
            children: [{
                text: OpenLayers.i18n("Base Layers"),
                leaf: false,
                expanded: true,
                children: [{
                    text: OpenLayers.i18n("All features"),
                    map: map,
                    leaf: true,
                    handler: addOsmStyleLayer,
                    style: getOSMStyle(),
                    id: 'all'
                },
                {
                    text: OpenLayers.i18n("Raw"),
                    map: map,
                    leaf: true,
                    handler: addOsmStyleLayer,
                    style: null,
                    id: 'raw'
                },
                {
                    text: OpenLayers.i18n("Osmarender"),
                    map: map,
                    leaf: true,
                    handler: addLayer,
                    url: "http://b.tah.openstreetmap.org/Tiles/tile/${z}/${x}/${y}.png",
                    numZoomLevels: 18,
                    attribution: "<a href='http://www.osm.org/'>CC by-sa - OSM</a>", 
                    id: "osma" 
                },
                {
                    text: OpenLayers.i18n("OpenCycleMap"),
                    map: map,
                    leaf: true,
                    handler: addLayer,
                    url: "http://b.tile.opencyclemap.org/cycle/${z}/${x}/${y}.png",
                    numZoomLevels: 17,
                    attribution: "<a href='http://www.osm.org/'>CC by-sa - OSM</a>", 
                    id: "bike" 
                },
                {
                    text: OpenLayers.i18n("OpenPisteMap"),
                    map: map,
                    leaf: true,
                    handler: addLayer,
                    url: "http://tiles.openpistemap.org/contours/${z}/${x}/${y}.png",
                    numZoomLevels: 18,
                    attribution: "<a href='http://www.osm.org/'>CC by-sa - OSM</a>", 
                    id: "sky" 
                },
                {
                    text: OpenLayers.i18n("Public transport"),
                    map: map,
                    leaf: true,
                    handler: addLayer,
                    url: "http://tile.xn--pnvkarte-m4a.de/tilegen/${z}/${x}/${y}.png",
                    numZoomLevels: 17,
                    attribution: "<a href='http://www.osm.org/'>CC by-sa - OSM</a>", 
                    id: "pt" 
                },
                {
                    text: OpenLayers.i18n("Hiking Tails"),
                    map: map,
                    leaf: true,
                    handler: addLayer,
                    url: "http://osm.lonvia.de/hiking/${z}/${x}/${y}.png",
                    numZoomLevels: 15,
                    attribution: "<a href='http://www.osm.org/'>CC by-sa - OSM</a>", 
                    id: "hiking" 
                }]
            },
            {
                text: OpenLayers.i18n("Dem"),
                leaf: false,
                expanded: true,
                children: [{
                    text: OpenLayers.i18n("Hill shade"),
                    map: map,
                    leaf: true,
                    handler: addLayer,
                    url: "http://map.stephane-brunner.ch/topo/${z}/${x}/${y}.png",
                    numZoomLevels: 18,
                    attribution: "Data by <a href='ftp://e0srp01u.ecs.nasa.gov/srtm/version2/SRTM3/'>NASA</a>, <a href='http://asterweb.jpl.nasa.gov/gdem.asp'>ASTER</a>, <a href='http://www.gebco.net/'>GEBCO</a> and <a href='http://www.osm.org/'>OSM</a>", 
                    id: "topo" 
                },
                {
                    text: OpenLayers.i18n("Contours"),
                    map: map,
                    leaf: true,
                    handler: addLayer,
                    url: "http://map.stephane-brunner.ch/contours/${z}/${x}/${y}.png",
                    numZoomLevels: 18,
                    attribution: "Data by <a href='ftp://e0srp01u.ecs.nasa.gov/srtm/version2/SRTM3/'>NASA</a>, <a href='http://asterweb.jpl.nasa.gov/gdem.asp'>ASTER</a>, <a href='http://www.gebco.net/'>GEBCO</a> and <a href='http://www.osm.org/'>OSM</a>", 
                    id: "cont" 
                }]
            },
            {
                text: OpenLayers.i18n("Outdoor"),
                expanded: false,
                leaf: false,
                children: [{
                    text: OpenLayers.i18n("Peak"),
                    map: map,
                    leaf: true,
                    handler: addXapiStyleLayer,
                    style: getHikkingStyle(),
                    id: 'peak',
                    element: 'node',
                    predicate: "natural=peak"
                },
                {
                    text: OpenLayers.i18n("Mountain pass"),
                    map: map,
                    leaf: true,
                    handler: addXapiStyleLayer,
                    style: getHikkingStyle(),
                    id: 'pass',
                    element: 'node',
                    predicate: "mountain_pass=yes"
                },
                {
                    text: OpenLayers.i18n("Informations"),
                    map: map,
                    leaf: true,
                    handler: addXapiStyleLayer,
                    style: getHikkingStyle(),
                    id: 'info',
                    element: 'node',
                    predicate: "tourism"
                },
                {
                    text: OpenLayers.i18n("Hiking (scale)"),
                    map: map,
                    leaf: true,
                    handler: addXapiStyleLayer,
                    style: getHikkingStyle(),
                    id: 'sac',
                    element: 'way',
                    predicate: "sac_scale"
                },
                {
                    text: OpenLayers.i18n("Hiking (path)"),
                    map: map,
                    leaf: true,
                    handler: addXapiStyleLayer,
                    style: getHikkingStyle(),
                    id: 'path',
                    element: 'way',
                    predicate: "highway=path"
                },
                {
                    text: OpenLayers.i18n("MTB (scale)"),
                    map: map,
                    leaf: true,
                    handler: addXapiStyleLayer,
                    style: getMTBStyle(),
                    id: 'mtbs',
                    element: 'way',
                    predicate: "mtb:scale=*"
                },
                {
                    text: OpenLayers.i18n("MTB (route)"),
                    map: map,
                    leaf: true,
                    handler: addXapiStyleLayer,
                    style: getMTBStyle(),
                    id: 'mtbr',
                    element: 'relation',
                    predicate: "route=mtb"
                },
                {
                    text: OpenLayers.i18n("Bicycle"),
                    map: map,
                    leaf: true,
                    handler: addXapiStyleLayer,
                    style: getMTBStyle(),
                    id: 'velo',
                    element: 'relation',
                    predicate: "route=bicycle"
                },
                {
                    text: OpenLayers.i18n("Sled"),
                    map: map,
                    leaf: true,
                    handler: addXapiStyleLayer,
                    style: getSledStyle(),
                    id: 'sled',
                    element: 'way',
                    predicate: "piste:type=sled"
                },
                {
                    text: OpenLayers.i18n("Snows shoe"),
                    map: map,
                    leaf: true,
                    handler: addXapiStyleLayer,
                    style: getSnowShoeStyle(),
                    id: 'xx',
                    element: 'relation',
                    predicate: "route=snowshoe"
                },
                {
                    text: OpenLayers.i18n("Nordic"),
                    map: map,
                    leaf: true,
                    handler: addXapiStyleLayer,
                    style: getNordicStyle(),
                    id: 'nordic',
                    element: 'way',
                    predicate: "piste:type=nordic"
                },
                {
                    text: OpenLayers.i18n("Down hill"),
                    map: map,
                    leaf: true,
                    handler: addXapiStyleLayer,
                    style: getSkyStyle(),
                    id: 'dh',
                    element: 'way',
                    predicate: "piste:type=downhill"
                },
                {
                    text: OpenLayers.i18n("Winter Walks"),
                    map: map,
                    leaf: true,
                    handler: addXapiStyleLayer,
                    style: getWinterWalksStyle(),
                    id: 'ww',
                    element: 'relation',
                    predicate: "route=winterwalks"
                },
                {
                    text: OpenLayers.i18n("Fitness trail"),
                    map: map,
                    leaf: true,
                    handler: addXapiStyleLayer,
                    style: getHikkingStyle(),
                    id: 'ft',
                    element: 'relation',
                    predicate: "route=fitness_trail"
                }]
            },
            {
                text: OpenLayers.i18n("Utils"),
                leaf: false,
                children: [{
                    text: OpenLayers.i18n("Max"),
                    leaf: false,
                    children: [{
                        text: OpenLayers.i18n("Speed"),
                        map: map,
                        leaf: true,
                        handler: addXapiStyleLayer,
                        style: getMaxSpeedStyle(),
                        id: 'speed',
                        element: 'way',
                        predicate: "maxspeed"
                    },
                    {
                        text: OpenLayers.i18n("Weight"),
                        map: map,
                        leaf: true,
                        handler: addXapiStyleLayer,
                        style: null,
                        id: 'weight',
                        element: 'way',
                        predicate: "maxweight"
                    },
                    {
                        text: OpenLayers.i18n("Height"),
                        map: map,
                        leaf: true,
                        handler: addXapiStyleLayer,
                        style: null,
                        id: 'height',
                        element: 'way',
                        predicate: "maxheight"
                    },
                    {
                        text: OpenLayers.i18n("Width"),
                        map: map,
                        leaf: true,
                        handler: addXapiStyleLayer,
                        style: null,
                        id: 'width',
                        element: 'way',
                        predicate: "maxwidth"
                    },
                    {
                        text: OpenLayers.i18n("Length"),
                        map: map,
                        leaf: true,
                        handler: addXapiStyleLayer,
                        style: null,
                        id: 'length',
                        element: 'way',
                        predicate: "maxlength"
                    }]
                }]
            },
            {
                text: OpenLayers.i18n("Debug"),
                leaf: false,
                children: [{
                    text: OpenLayers.i18n("CloudMade nonames"),
                    map: map,
                    leaf: true,
                    handler: addLayer,
                    url: "http://tile.cloudmade.com/D563D910896D4B67B22BC1088920C483/3/256/${z}/${x}/${y}.png",
                    displayOutsideMaxExtent: true,
                    numZoomLevels: 18,
                    attribution: "<a href='http://www.openstreetmap.org/'>CC-BY-SA OpenStreetMap &amp; Contributors</a> -- tiles from <a href='http://www.cloudmade.com/'>CloudMade</a>",
                    id: "non"
                },
                {
                    text: OpenLayers.i18n("Text of fixme and note"),
                    map: map,
                    leaf: true,
                    handler: addLayer,
                    url: "http://beta.letuffe.org/tiles/renderer.py/fixme-text/${z}/${x}/${y}.png",
                    displayOutsideMaxExtent: true, 
                    buffer: 1, 
                    attribution: "<a href='http://www.osm.org/'>CC by-sa - OSM</a>", 
                    id: "fn"
                },
                {
                    text: OpenLayers.i18n("Duplicates nodes"),
                    map: map,
                    leaf: true,
                    handler: addLayer,
                    url: "http://matt.dev.openstreetmap.org/dupe_nodes/tiles/renderer.py/1.0.0/dupe_nodes/${z}/${x}/${y}.png",
                    numZoomLevels: 18,
                    attribution: "<a href='http://www.osm.org/'>CC by-sa - OSM</a>", 
                    id: "dbl"
                },
                {
                    text: OpenLayers.i18n("Swiss history"),
                    leaf: false,
                    children: [{
                        text: OpenLayers.i18n("September 2008"),
                        map: map,
                        leaf: true,
                        handler: addLayer,
                        url: "lausanne-20080926/${z}/${x}/${y}.png",
                        numZoomLevels: 18,
                        attribution: "<a href='http://www.osm.org/'>CC by-sa - OSM</a>", 
                        id: "20080926"
                    },
                    {
                        text: OpenLayers.i18n("June 2009"),
                        map: map,
                        leaf: true,
                        handler: addLayer,
                        url: "lausanne-20090606/${z}/${x}/${y}.png",
                        numZoomLevels: 18,
                        attribution: "<a href='http://www.osm.org/'>CC by-sa - OSM</a>", 
                        id: "20080926"
                    },
                    {
                        text: OpenLayers.i18n("June 2010"),
                        map: map,
                        leaf: true,
                        handler: addLayer,
                        url: "lausanne-20100622/${z}/${x}/${y}.png",
                        numZoomLevels: 18,
                        attribution: "<a href='http://www.osm.org/'>CC by-sa - OSM</a>", 
                        id: "20080926"
                    }]
                }]
            },
            brutes]
        };
        
    var layersList = {};
    function fill(node) {
        if (node.id) {
            layersList[node.id] = node;
        }
        if (node.children) {
            for (var i = 0 ; i < node.children.length ; i++) {
                child = node.children[i];
                fill(child);
            }
        }
    }
    fill(rootNode);

    if (permalinkProvider.state.m.layers) {
        var layers = permalinkProvider.state.m.layers;
        if (layers instanceof Array) {
            for(var i = 0 ; i < layers.length ; ++i) {
                var layer = layersList[layers[i]];
                if (layer.handler) {
                    var handler = layer.handler;
                    var map = layer.map;
                    delete layer.handler;
                    delete layer.map;
                    handler(map, layer);
                }
            }
        }
        else {
            var layer = layersList[layers];
            if (layer && layer.handler) {
                var handler = layer.handler;
                var map = layer.map;
                delete layer.handler;
                delete layer.map;
                handler(map, layer);
            }
        }
    }
    

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
    
    permalinkProvider.on({statechange: onStatechange});

    function addLayerFull(options) {
        if (options.handler) {
            var layers = permalinkProvider.state.m.layers;
            if (layers) {
                if (layers instanceof Array) {
                    layers.push(options.id);
                }
                else {
                    layers = [layers, options.id];
                }
            }
            else {
                layers = [options.id];
            }
            permalinkProvider.state.m.layers = layers;
            onStatechange(permalinkProvider);
            
            var handler = options.handler;
            var map = options.map;
            delete options.handler;
            delete options.map;
            handler(map, options);
        }
    }
    
    tree = new Ext.tree.TreePanel({
        autoScroll: true,
        tbar: [{
            xtype: 'tbfill'
        }, new Ext.Action({
            text: 'Add',
            handler: function() {
                var options = tree.getSelectionModel().getSelectedNode().attributes;
                addLayerFull(options);
            }
        })],
        loader: new Ext.tree.TreeLoader({
            applyLoader: false,
        }),
        root: new Ext.tree.AsyncTreeNode(rootNode),
        rootVisible: false,
        lines: false,
        listeners: {
            dblclick: {
                fn: function(node) {
                    addLayerFull(node.attributes);
                }
            }
        }
    });
    
    var layerList = new GeoExt.tree.LayerContainer({
//        text: 'All Layers',
//        layerStore: mapPanel.layers,
//        leaf: false,
//        expanded: true
//        loader: {
//            baseAttrs: {
//                radioGroup: "active"
//            }
//        }
    });
/*    var registerRadio = function(node)
        if(!node.hasListener("radiochange")) {
            node.on("radiochange", function(node){
            });
        }
    }*/
    var layerTree = new Ext.tree.TreePanel({
        rootVisible: false,
        lines: false,
//        title: 'Map Layers',
//        renderTo: 'layerTree',
        root: layerList,
//        listeners: {
//            append: registerRadio,
//            insert: registerRadio
//        }
    });



    Ext.get("waiting").hide();
    
    mainPanel = new Ext.Viewport({
        layout: "fit",
        hideBorders: true,
        items: [{
            layout: "border",
            deferredRender: false,
            items: [mapPanel, {
                layout: "fit",
                region: "east",
                collapseMode: "mini",
                split: true,
                width: width,
                minWidth: width,
                maxWidth: width,
                autoScroll: true,
                tbar: [
                    new GeoExt.Action({
                        control: new OpenLayers.Control.DragPan(), 
                        toggleGroup: 'tools', 
                        iconCls: 'drag-icon', 
                        tooltip: OpenLayers.i18n("Drag the map"),
                        pressed: true,
                        enableToggle: true
                    }),
                    new GeoExt.ux.MeasureLength({
                        map: map,
                        controlOptions: {
                            geodesic: true
                        },
                        toggleGroup: 'tools'
                    }), 
                    new GeoExt.ux.MeasureArea({
                        map: map,
                        decimals: 0,
                        toggleGroup: 'tools'
                    }),
                    GeoExt.ux.CloudmadeSearchCombo({
                        map: map, 
                        zoom: 14
                    })
                ],
                items: [getEllements([{
                        baseCls: "x-plane",
                        title: OpenLayers.i18n("Selected feature"),
                        collapsed: !getBooleanValue(permalinkProvider.state.m.open_sf, false),
                        name: 'sf',
                        autoScroll: true,
                        height: 150,
                        html: "<div id='featureData'></div>"
                    },
                    {
                        title: OpenLayers.i18n("Selected layers"),
                        layout: 'fit',
                        collapsed: !getBooleanValue(permalinkProvider.state.m.open_sl, false),
                        name: 'sl',
                        height: 80,
                        items: [layerTree]
                    },
                    {
                        title: OpenLayers.i18n("Available layers"),
                        layout: 'fit',
                        collapsed: !getBooleanValue(permalinkProvider.state.m.open_al, true),
                        name: 'al',
                        height: 200,
                        items: [tree]
                    },
                    {
                        baseCls: "x-plane",
                        collapsed: !getBooleanValue(permalinkProvider.state.m.open_pl, false),
                        name: 'pl',
                        title: OpenLayers.i18n("Permalink"),
                        style: "padding: 0 0 8px 8px;",
                        html: "<ul>"
                            + "<li><div id='permalink'><a href=''>" + OpenLayers.i18n("Permalink") + "</a></div></li>"
                            + "<li><a id='permalink.potlatch' href=''>" + OpenLayers.i18n("Edit on Potlatch") + "</a></li>"
                            + "<li><div id='josm'><a href=''>" + OpenLayers.i18n("Edit with JOSM") + "</a></div></li>"
                            + "</ul>"
                    },
                    {
                        baseCls: "x-plane",
                        collapsed: !getBooleanValue(permalinkProvider.state.m.open_ul, false),
                        name: 'ul',
                        title: OpenLayers.i18n("Utilities links"),
                        style: "padding: 0 0 8px 8px;",
                        html: "<ul>"
                            + "<li><a id='permalink.amenity.editor' href='http://ae.osmsurround.org/'>" + OpenLayers.i18n("Amenity (POI) Editor") + "</a></li>"
                            + "<li><a id='permalink.keepright' href='http://keepright.ipax.at/report_map.php'>" + OpenLayers.i18n("Keep right!") + "</a></li>"
                            + "<li><a id='permalink.restrictions' href='http://osm.virtuelle-loipe.de/restrictions/'>" + OpenLayers.i18n("Restrictions") + "</a></li>"
                            + "<li><a id='permalink.maxspeed' href='http://maxspeed.osm.lab.rfc822.org/?layers=B0TF'>" + OpenLayers.i18n("Max speed") + "</a></li>"
                            + "<li><a id='permalink.refuges' href='http://refuges.info/nav.php?choix_layer=OSM'>" + OpenLayers.i18n("Refuges.info") + "</a></li>"
                            + "<li><a id='permalink.browser' href='http://www.openstreetbrowser.org/'>" + OpenLayers.i18n("OpenStreetBrowser") + "</a></li>"
                            + "<li><a id='permalink.letuffe' href='http://beta.letuffe.org/'>" + OpenLayers.i18n("Other test site") + "</a></li>"
                            + "</ul>"
                    },
                    {
                        baseCls: "x-panel",
                        title: OpenLayers.i18n("Routing"),
                        collapsed: !getBooleanValue(permalinkProvider.state.m.open_r, false),
                        name: 'r',
                        tbar: [
                        {
                            xtype: 'tbfill'
                        },
                        {
                            text: OpenLayers.i18n('Clear'),
                            enableToggle: false,
                            handler: function() {
                                var routingPanelItem = Ext.getCmp("routingPanelItem");
                                if (routingPanelItem) {
                                    routingPanelItem.clearItinerary();
                                }
                            }
                        }],
                        items: [{
                            xtype: 'gxux_routingpanel',
                            id: 'routingPanelItem',
                            border: false,
                            width: width,
                            height: 500,
                            autoScroll: true,
                            map: map,
                            // Key for dev.geoext.org: 187a9f341f70406a8064d07a30e5695c
                            // Key for localhost: BC9A493B41014CAABB98F0471D759707
                            // Key for map.stephane-brunner.ch: 60a6b92afa824cc985331da088d3225c
                            cloudmadeKey: cloudmadeKey,
                            geocodingType: 'cloudmade'
                        }]
                    }], {html: ""})]
                //}]
            }]
        }]
    });

    map.addControl(new OpenLayers.Control.PermalinkLayer("permalink.potlatch", "http://www.openstreetmap.org/edit"));
    map.addControl(new OpenLayers.Control.PermalinkLayer("permalink.amenity.editor", " http://ae.osmsurround.org/"));
    map.addControl(new OpenLayers.Control.PermalinkLayer("permalink.keepright", "http://keepright.ipax.at/report_map.php"));
    map.addControl(new OpenLayers.Control.PermalinkLayer("permalink.restrictions", "http://osm.virtuelle-loipe.de/restrictions/"));
    map.addControl(new OpenLayers.Control.PermalinkLayer("permalink.maxspeed", "http://maxspeed.osm.lab.rfc822.org/", "B0TF"));
    map.addControl(new OpenLayers.Control.PermalinkLayer("permalink.refuges", "http://refuges.info/nav.php?choix_layer=OSM"));
    map.addControl(new OpenLayers.Control.PermalinkLayer("permalink.letuffe", "http://beta.letuffe.org/"));
    map.addControl(new OpenLayers.Control.PermalinkLayer("permalink.browser", "http://www.openstreetbrowser.org/"));

});
