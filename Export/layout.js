/**
 * @requires layers.js
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

    if (isDev) {
        document.title = "Dev - " + OpenLayers.i18n("Various OSM map");
    }
    else {
        document.title = OpenLayers.i18n("Various OSM map");
    }
    Ext.QuickTips.init();
    
    // set a permalink provider
    var indexQ = window.location.href.indexOf("?");
    var indexS = window.location.href.indexOf("#");
    if (indexQ > 0) {
        window.alert(window.location.href.replace("#", "&").replace("?", "#"));
        window.location.href = window.location.href.replace("#", "&").replace("?", "#");
    }
    if (indexS > 0) {
        permalinkTitleBase = window.location.href.substring(0, indexS + 1);
        permalinkBase = permalinkTitleBase.substring(0, indexS);
    }
    else {
        permalinkTitleBase = window.location.href + "#";
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

    
    var rootNode = getLayersTree(map);        
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

    if (!permalinkProvider.state.a) {
        permalinkProvider.state.a = {};
    }
    if (permalinkProvider.state.a.layers) {
        var layers = permalinkProvider.state.a.layers;
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
            var layers = permalinkProvider.state.a.layers;
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
            permalinkProvider.state.a.layers = layers;
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
                        cloudmadeKey: cloudmadeKey,
                        map: map, 
                        zoom: 14
                    })
                ],
                items: [getEllements([{
                        baseCls: "x-plane",
                        title: OpenLayers.i18n("Selected feature"),
                        name: 'sf',
                        autoScroll: true,
                        height: 150,
                        style: "padding: 0 0 8px 8px;",
                        html: "<div id='featureData'></div>"
                    },
                    {
                        title: OpenLayers.i18n("Selected layers"),
                        layout: 'fit',
                        name: 'sl',
                        height: 80,
                        items: [layerTree]
                    },
                    {
                        title: OpenLayers.i18n("Available layers"),
                        layout: 'fit',
                        name: 'al',
                        height: 200,
                        items: [tree]
                    },
                    {
                        baseCls: "x-plane",
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
