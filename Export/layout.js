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

    typeBase = "base";
    typeSrtm = "srtm";
    typeExternals = "ext";
    typeUtils = "utils";
    typeDebugs = "debug";
    typeHist = "hist";
    typeBrutNodes = "node";
    typeBrutWays = "way";
    typeBrutRels = "relation";

    map.addLayer(new OpenLayers.Layer.XYZ(OpenLayers.i18n("Mapnik"), "http://c.tile.openstreetmap.org/${z}/${x}/${y}.png", { numZoomLevels: 18, type: typeBase, attribution: "<a href='http://www.osm.org/'>CC by-sa - OSM</a>", id: "mk" }));
    map.addLayer(new OpenLayers.Layer.XYZ(OpenLayers.i18n("White background"), "http://map.stephane-brunner.ch/white.png", { numZoomLevels: 22, type: typeDebugs, visibility: false, id: "w" }));
    map.addLayer(new OpenLayers.Layer.XYZ(OpenLayers.i18n("Black background"), "http://map.stephane-brunner.ch/black.png", { numZoomLevels: 22, type: typeDebugs, visibility: false, id: "b" }));
    map.addLayer(new OpenLayers.Layer.XYZ(OpenLayers.i18n("TopoMap"), "http://map.stephane-brunner.ch/topo/${z}/${x}/${y}.png", 
            { numZoomLevels: 18, type: typeSrtm, visibility: false, buffer:1, attribution: "Data by <a href='ftp://e0srp01u.ecs.nasa.gov/srtm/version2/SRTM3/'>NASA</a>, <a href='http://asterweb.jpl.nasa.gov/gdem.asp'>ASTER</a>, <a href='http://www.gebco.net/'>GEBCO</a> and <a href='http://www.osm.org/'>OSM</a>", id: "topo" }));
    map.addLayer(new OpenLayers.Layer.XYZ(OpenLayers.i18n("Osmarender"), "http://b.tah.openstreetmap.org/Tiles/tile/${z}/${x}/${y}.png", { numZoomLevels: 18, type: typeBase, visibility: false, attribution: "<a href='http://www.osm.org/'>CC by-sa - OSM</a>", id: "osma" }));
    map.addLayer(new OpenLayers.Layer.XYZ(OpenLayers.i18n("OpenCycleMap"), "http://b.tile.opencyclemap.org/cycle/${z}/${x}/${y}.png", { numZoomLevels: 18, type: typeBase, visibility: false, attribution: "<a href='http://www.osm.org/'>CC by-sa - OSM</a>", id: "bike" }));
    map.addLayer(new OpenLayers.Layer.XYZ(OpenLayers.i18n("OpenPisteMap"), "http://tiles.openpistemap.org/contours/${z}/${x}/${y}.png", { numZoomLevels: 18, type: typeBase, visibility: false, attribution: "<a href='http://www.osm.org/'>CC by-sa - OSM</a>", id: "sky" }));
    map.addLayer(new OpenLayers.Layer.XYZ(OpenLayers.i18n("Public transport"), "http://tile.xn--pnvkarte-m4a.de/tilegen/${z}/${x}/${y}.png", { numZoomLevels: 19, type: typeBase, visibility: false, attribution: "<a href='http://www.osm.org/'>CC by-sa - OSM</a>", id: "pt" }));
    map.addLayer(new OpenLayers.Layer.XYZ(OpenLayers.i18n("CloudMade nonames"), "http://tile.cloudmade.com/D563D910896D4B67B22BC1088920C483/3/256/${z}/${x}/${y}.png",
            {displayOutsideMaxExtent: true, numZoomLevels: 18, attribution: "<a href='http://www.openstreetmap.org/'>CC-BY-SA OpenStreetMap &amp; Contributors</a> -- tiles from <a href='http://www.cloudmade.com/'>CloudMade</a>", type: typeDebugs, visibility: false, id: "non" }));

    //map.addLayer(new OpenLayers.Layer.OSM("OpenAerialMap","http://tile.openaerialmap.org/tiles/1.0.0/openaerialmap-900913/${z}/${x}/${y}.png"));
    //map.addLayer(new OpenLayers.Layer.XYZ("OSM (semitransparent)", "http://c.tile.openstreetmap.org/${z}/${x}/${y}.png", { isBaseLayer: false, visibility: false, opacity: 0.4}));
    //map.addLayer(new OpenLayers.Layer.XYZ("OPM (semitransparent)", "http://openpistemap.org/tiles/nocontours/${z}/${x}/${y}.png", { isBaseLayer: false, visibility: false, opacity: 0.4}));

    map.addLayer(new OpenLayers.Layer.XYZ(OpenLayers.i18n("September 2008"), "lausanne-20080926/${z}/${x}/${y}.png", {numZoomLevels: 18, isBaseLayer: false, type: typeHist, attribution: "<a href='http://www.osm.org/'>CC by-sa - OSM</a>", id: "20080926", visibility: false, opacity: 0.5 }));
    /*map.addLayer(new OpenLayers.Layer.XYZ("Lausanne mai 2009", "lausanne-20090515/${z}/${x}/${y}.png", null));*/
    map.addLayer(new OpenLayers.Layer.XYZ(OpenLayers.i18n("June 2009"), "lausanne-20090606/${z}/${x}/${y}.png", {numZoomLevels: 18, isBaseLayer: false, type: typeHist, attribution: "<a href='http://www.osm.org/'>CC by-sa - OSM</a>", id: "20090606", visibility: false, opacity: 0.5 }));
    map.addLayer(new OpenLayers.Layer.XYZ(OpenLayers.i18n("June 2010"), "lausanne-20100622/${z}/${x}/${y}.png", {numZoomLevels: 18, isBaseLayer: false, type: typeHist, attribution: "<a href='http://www.osm.org/'>CC by-sa - OSM</a>", id: "20100622", visibility: false, opacity: 0.5 }));


    map.addLayer(new OpenLayers.Layer.XYZ(OpenLayers.i18n("Contours"), "http://map.stephane-brunner.ch/contours/${z}/${x}/${y}.png", 
            { numZoomLevels: 18, type: typeSrtm, visibility: false, buffer: 1, isBaseLayer: false, attribution: "Data by <a href='ftp://e0srp01u.ecs.nasa.gov/srtm/version2/SRTM3/'>NASA</a>, <a href='http://asterweb.jpl.nasa.gov/gdem.asp'>ASTER</a>", id: "cont" }));
    //map.addLayer(new OpenLayers.Layer.Error("Adresses incomplettes*"));

    addXapiStyleLayer(map, OpenLayers.i18n("Speed"), getMaxSpeedStyle(), typeUtils, "speed", "way", "maxspeed=*");
    addXapiStyleLayer(map, OpenLayers.i18n("Weight"), null, typeUtils, "weight", "way", "maxweight=*");
    addXapiStyleLayer(map, OpenLayers.i18n("Height"), null, typeUtils, "height", "way", "maxheight=*");
    addXapiStyleLayer(map, OpenLayers.i18n("Width"), null, typeUtils, "width", "way", "maxwidth=*");
    addXapiStyleLayer(map, OpenLayers.i18n("Length"), null, typeUtils, "length", "way", "maxlength=*");

    //addOsmStyleLayer(map, "Randonnée", getHikkingStyle(), typeExternals);
    addXapiStyleLayer(map, OpenLayers.i18n("Peak"), getHikkingStyle(), typeExternals, "peak", "node", "natural=peak");
    addXapiStyleLayer(map, OpenLayers.i18n("Mountain pass"), getHikkingStyle(), typeExternals, "pass", "node", "mountain_pass=yes");
    addXapiStyleLayer(map, OpenLayers.i18n("Informations"), getHikkingStyle(), typeExternals, "info", "node", "tourism");
    addXapiStyleLayer(map, OpenLayers.i18n("Hiking (scale)"), getHikkingStyle(), typeExternals, "sac.n", "way", "sac_scale");
    addXapiStyleLayer(map, OpenLayers.i18n("Hiking (path)"), getHikkingStyle(), typeExternals, "sac.n", "way", "highway=path");

    addXapiStyleLayer(map, OpenLayers.i18n("MTB (scale)"), getMTBStyle(), typeExternals, "mtbs", "way", "mtb:scale=*");
    addXapiStyleLayer(map, OpenLayers.i18n("MTB (route)"), getMTBStyle(), typeExternals, "mtbr", "relation", "route=mtb");
    addXapiStyleLayer(map, OpenLayers.i18n("Bicycle"), getMTBStyle(), typeExternals, "velo", "relation", "route=bicycle");
    addXapiStyleLayer(map, OpenLayers.i18n("Sled"), getSledStyle(), typeExternals, "sled", "way", "piste:type=sled");
    addXapiStyleLayer(map, OpenLayers.i18n("Snows shoe"), getSnowShoeStyle(), typeExternals, "ss", "relation", "route=snowshoe");
    addXapiStyleLayer(map, OpenLayers.i18n("Nordic"), getNordicStyle(), typeExternals, "nordic", "way", "piste:type=nordic");
    addXapiStyleLayer(map, OpenLayers.i18n("Down hill"), getSkyStyle(), "dh", "way", "piste:type=downhill");
    addXapiStyleLayer(map, OpenLayers.i18n("Winter Walks"), typeExternals, getWinterWalksStyle(), "ww", "relation", "route=winterwalks");
    addXapiStyleLayer(map, OpenLayers.i18n("Fitness trail"), getVitaStyle(), typeExternals, "ft", "relation", "route=fitness_trail");

    map.addLayer(new OpenLayers.Layer.XYZ(OpenLayers.i18n("Text of fixme and note"), "http://beta.letuffe.org/tiles/renderer.py/fixme-text/${z}/${x}/${y}.png",
              { displayOutsideMaxExtent: true , buffer:1, isBaseLayer: false, visibility: false, type: typeDebugs, attribution: "<a href='http://www.osm.org/'>CC by-sa - OSM</a>", id: "fn" }));

    //map.addLayer(new OpenLayers.Layer.TM("TopoMap* (semitransparent)", { isBaseLayer: false, visibility: false, opacity: 0.6, numZoomLevels: 17 }));

    map.addLayer(new OpenLayers.Layer.XYZ(OpenLayers.i18n("Duplicates nodes"), "http://matt.dev.openstreetmap.org/dupe_nodes/tiles/renderer.py/1.0.0/dupe_nodes/${z}/${x}/${y}.png", { isBaseLayer: false, visibility: false, numZoomLevels: 18, type: typeDebugs, attribution: "<a href='http://www.osm.org/'>CC by-sa - OSM</a>", id: "dbl" }));
    map.addLayer(new OpenLayers.Layer.XYZ(OpenLayers.i18n("Hiking Tails"), "http://osm.lonvia.de/hiking/${z}/${x}/${y}.png", { isBaseLayer: true, visibility: false, numZoomLevels: 17, type: typeBase, attribution: "<a href='http://www.osm.org/'>CC by-sa - OSM</a>", id: "hiking" }));

    
    var types = [typeBrutNodes, typeBrutWays, typeBrutRels];
    var cats = ["leisure", "amenity", "shop", "office", "tourism", "historic", "highway", "barrier", "cycleway", "tracktype", "railway", "aeroway", "power", "man_made", "landuse", "military", "natural", "route", "boundary", "sport", "abutters", "accessories", "place"];
    for (var i in types) {
        type = types[i];
        for (var j = 0 ; j < cats.length ; j++) {
            cat = cats[j];
//            addXapiStyleLayer(map, cat, null, type, type + "." + cat, type, cat + "=*");
        }
    }
    

    addOsmStyleLayer(map, OpenLayers.i18n("All features"), getOSMStyle(), typeBase, "osm");
    addOsmStyleLayer(map, OpenLayers.i18n("Raw"), null, typeDebugs, "brut");

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
        Ext.get("permalink").update("<a href=" + l + ">" + OpenLayers.i18n("Permalink") + "</a>");
        
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
                + "&top=" + bounds.top + "&bottom=" + bounds.bottom + "'>" + OpenLayers.i18n("Edit with JOSM") + "</a>");
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
                },
                onStoreAdd: function(store, records, index, node) {} 
            })
        });
    }

    layerContainerList = [
        createLayerContainer(OpenLayers.i18n("Base Layers"), typeBase, true),
        createLayerContainer(OpenLayers.i18n("Dem"), typeSrtm, true),
        createLayerContainer(OpenLayers.i18n("Outdoor"), typeExternals, true),
        new Ext.tree.TreeLoader({
            text: OpenLayers.i18n("Utils"),
            children: [
                createLayerContainer(OpenLayers.i18n("Max"), typeUtils, true)
            ]
        }),
        new Ext.tree.TreeLoader({
            text: OpenLayers.i18n("Debug"),
            children: [
                createLayerContainer(OpenLayers.i18n("Swiss history"), typeHist, false),
                createLayerContainer(OpenLayers.i18n("Other"), typeDebugs, false)
            ]
        }),
        new Ext.tree.TreeLoader({
            text: OpenLayers.i18n("Raw"),
            children: [
                createLayerContainer(OpenLayers.i18n("Nodes"), typeBrutNodes, false),
                createLayerContainer(OpenLayers.i18n("Ways"), typeBrutWays, false),
                createLayerContainer(OpenLayers.i18n("Relations"), typeBrutRels, false)
            ]
        })
    ];


    // create the tree with the configuration from above
    var tree = new Ext.tree.TreePanel({
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
                    new GeoExt.ux.GeoNamesSearchCombo({
                        map: map, 
                        zoom: 14,
                        loadingText: OpenLayers.i18n('Search in Geonames...'),
                        emptyText: OpenLayers.i18n('Search location in Geonames')
                    })
                ],
                items: [getEllements([{
                        baseCls: "x-plane",
                        title: OpenLayers.i18n("Selected feature"),
                        autoScroll: true,
                        height: 150,
                        html: "<div id='featureData'></div>"
                    },
                    {
                        title: OpenLayers.i18n("Layers"),
                        layout: 'fit',
                        height: 250,
                        items: [tree]
                    },
                    {
                        baseCls: "x-plane",
                        title: OpenLayers.i18n("Permalink"),
                        html: "<div>"
                            + "<ul>"
                            + "<li><div id='permalink'><a href=''>" + OpenLayers.i18n("Permalink") + "</a></div></li>"
                            + "<li><a id='permalink.potlatch' href=''>" + OpenLayers.i18n("Edit on Potlatch") + "</a></li>"
                            + "<li><div id='josm'><a href=''>" + OpenLayers.i18n("Edit with JOSM") + "</a></div></li>"
                            + "</ul>"
                            + "</div>"
                    },
                    {
                        baseCls: "x-plane",
                        title: OpenLayers.i18n("Utilities links"),
                        html: "<div>"
                            + "<ul>"
                            + "<li><a id='permalink.amenity.editor' href='http://ae.osmsurround.org/'>" + OpenLayers.i18n("Amenity (POI) Editor") + "</a></li>"
                            + "<li><a id='permalink.keepright' href='http://keepright.ipax.at/report_map.php'>" + OpenLayers.i18n("Keep right!") + "</a></li>"
                            + "<li><a id='permalink.restrictions' href='http://osm.virtuelle-loipe.de/restrictions/'>" + OpenLayers.i18n("Restrictions") + "</a></li>"
                            + "<li><a id='permalink.maxspeed' href='http://maxspeed.osm.lab.rfc822.org/?layers=B0TF'>" + OpenLayers.i18n("Max speed") + "</a></li>"
                            + "<li><a id='permalink.refuges' href='http://refuges.info/nav.php?choix_layer=OSM'>" + OpenLayers.i18n("Refuges.info") + "</a></li>"
                            + "<li><a id='permalink.browser' href='http://www.openstreetbrowser.org/'>" + OpenLayers.i18n("OpenStreetBrowser") + "</a></li>"
                            + "<li><a id='permalink.letuffe' href='http://beta.letuffe.org/'>" + OpenLayers.i18n("Other test site") + "</a></li>"
                            + "</ul>"
                            + "</div>"
                    },
                    {
                        baseCls: "x-panel",
                        title: OpenLayers.i18n("Routing"),
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
                            map: map,
                            // Key for dev.geoext.org: 187a9f341f70406a8064d07a30e5695c
                            // Key for localhost: BC9A493B41014CAABB98F0471D759707
                            // Key for map.stephane-brunner.ch: 60a6b92afa824cc985331da088d3225c
                            cloudmadeKey: cloudmadeKey,
                            geocodingType: 'geonames'
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
