/**
 * Copyright (c) 2008-2010 The Open Source Geospatial Foundation
 * 
 * Published under the BSD license.
 * See http://svn.geoext.org/core/trunk/geoext/license.txt for the full text
 * of the license.
 */

/*
 * @include App/Map.js
 * @include App/LayerTree.js
 * @include App/layers.js
 * @include App/style.js
 * @include App/utils.js
 * 
 * @include OpenLayers/Protocol/XAPI.js
 * @include OpenLayers/Protocol/OSMAPI.js
 * 
 * @include OpenLayers/Util.js
 * @include OpenLayers/Lang.js
 * @include OpenLayers/Map.js
 * @include OpenLayers/Control/SelectFeature.js
 * @include OpenLayers/Control/PanZoomBar.js
 * @include OpenLayers/Control/MousePosition.js
 * @include OpenLayers/Control/KeyboardDefaults.js
 * @include OpenLayers/Control/Attribution.js
 * @include OpenLayers/Control/ScaleLine.js
 * @include OpenLayers/Control/Permalink.js
 * @include OpenLayers/Control/ArgParser.js
 * @include OpenLayers/Strategy/Fixed.js
 * @include OpenLayers/Strategy/BBOX.js
 * @include OpenLayers/Protocol/HTTP.js
 * @include OpenLayers/Format/JSON.js
 * @include OpenLayers/Format/OSM.js
 * 
 * @include GeoExt/widgets/MapPanel.js
 * @include GeoExt/widgets/tree/LayerContainer.js
 * @include GeoExt/widgets/tree/LayerLoader.js
 * @include GeoExt/state/PermalinkProvider.js
 * 
 * @include OpenLayers/Control/Measure.js
 * @include OpenLayers/Handler/Path.js
 * @include OpenLayers/Handler/Polygon.js
 * @include GeoExt.ux/MeasureLength.js
 * @include GeoExt.ux/MeasureArea.js
 * 
 * @include LayerCatalogue/lib/LayerCatalogue.js
 * @include RoutingPanel/lib/RoutingPanel.js
 * @include RoutingPanel/lib/Providers.js
 * @include BubblePanel/lib/BubblePanel.js
 */

/*
 * This file represents the application's entry point. 
 * OpenLayers and Ext globals are set, and the page
 * layout is created.
 */

var code = (OpenLayers.Util.getBrowserName() == "msie") ? navigator.userLanguage : navigator.language;
var lang = code.substring(0, 2);
if (!contains(['en', 'fr'], lang)) {
    lang = "en";
}
document.write("<script type=\"text/javascript\" src=\"build/" + lang + ".js\"></script>");
document.write('<meta HTTP-EQUIV="Content-Language" CONTENT="' + lang + '" />');
delete code;
delete lang;

var mapPanel;

window.onload = function() {
    if (!OpenLayers.Lang[lang]) {
        OpenLayers.Lang[lang] = OpenLayers.Util.applyDefaults({});
    }
    OpenLayers.Lang.setCode(lang);
    delete lang;

    /*
     * Setting of OpenLayers global vars.
     */
    OpenLayers.Number.thousandsSeparator = ' ';
    OpenLayers.IMAGE_RELOAD_ATTEMPTS = 3;
	OpenLayers.ImgPath = "http://map.stephane-brunner.ch/app/images/oltheme/";

    if (isDev) {
        document.title = "Dev - " + OpenLayers.i18n("Various OSM map");
    }
    else {
        document.title = OpenLayers.i18n("Various OSM map");
    }

    /*
     * Setting of Ext global vars.
     */
    Ext.QuickTips.init();

    // set a permalink provider
    var indexQ = window.location.href.indexOf("?");
    var indexS = window.location.href.indexOf("#");
    if (indexQ > 0) {
        if (indexS > 0) {
            permalinkTitleBase = window.location.href.substring(0, indexS + 1);
        } else {
            permalinkTitleBase = window.location.href;
        }
        permalinkBase = permalinkTitleBase.substring(0, indexQ) + "#";
    }
    else if (indexS > 0) {
        permalinkTitleBase = window.location.href.substring(0, indexS + 1);
        permalinkBase = permalinkTitleBase.substring(0, indexS + 1);
    }
    else {
        permalinkTitleBase = window.location.href + "#";
        permalinkBase = permalinkTitleBase + "#";
    }
    permalinkProvider = new GeoExt.state.PermalinkProvider({encodeType: false });
    Ext.state.Manager.setProvider(permalinkProvider);

    permalinkProvider.on({statechange: onStatechange});
    
    /*
     * Initialize the application.
     */
    mapPanel = (new App.Map({
        region: "center"
    }));

    if (mapPanel.map.getZoom() === 0) {
        if (navigator.geolocation) {
            try {
              navigator.geolocation.getCurrentPosition(usePosition);
            }
            catch (e) {
              mapPanel.map.zoomToMaxExtent();
            }
        }
        else {
            mapPanel.map.zoomToMaxExtent();
        }
    }


    /*
     * init the layer tree
     */
    var layerTree = new Ext.tree.TreePanel({
        autoScroll: true,
        rootVisible: false,
        lines: false,
        root: new GeoExt.tree.LayerContainer({ loader: new GeoExt.tree.LayerLoader({ baseAttrs: {
            uiProvider: StephaneNodesUI,
            deleteAction: true,
            upAction: true,
            downAction: true,
            opacitySlider: true
        }})})
    });

    
    /*
     * init the catalogue 
     */
    var tree = new GeoExt.LayerCatalogue({
        mapPanel: mapPanel,
        root: new Ext.tree.AsyncTreeNode(getLayersTree()),
        stateId: "c",
        tbar: [{
            xtype: 'tbfill'
        }, new Ext.Action({
            text: 'Add',
            handler: function() {
                tree.addLayer(this.getSelectionModel().getSelectedNode().attributes);
            },
            scope: this
        })]
    });
    if (mapPanel.map.layers.length == 1) { // only the blank background
        tree.addLayerByRef('mk');
    }


    /*
     * init the routing panel
     */
    var routingStyle = new OpenLayers.StyleMap();
    routingStyle.createSymbolizer = function(feature) {
        var symbolizer = OpenLayers.StyleMap.prototype.createSymbolizer.apply(this, arguments);
        if (feature.attributes.speed) {
            rgb = hslToRgb(feature.attributes.speed / 50, 1, 0.5);
            symbolizer.strokeColor = toHexColor(rgb);
        }
        return symbolizer;
    };
    
    routingStyle.styles["default"].addRules([new OpenLayers.Rule({
        symbolizer: {
            pointRadius: "8",
            fillColor: "#FF0000",
            fillOpacity: 0.5,
            strokeColor: "#FF0000",
            strokeOpacity: 1,
            strokeWidth: 1
        },
        filter: new OpenLayers.Filter.Comparison({ type: "==", property: 'type', value: 'point' })
    })]);
    routingStyle.styles["default"].addRules([new OpenLayers.Rule({
        symbolizer: {
            strokeColor: "#0000FF",
            strokeOpacity: 0.8,
            strokeWidth: 3
        },
        filter: new OpenLayers.Filter.Comparison({ type: "==", property: 'type', value: 'route' })
    })]);
    routingStyle.styles.select.addRules([new OpenLayers.Rule({
        symbolizer: {
            pointRadius: "8",
            fillColor: "yellow",
            fillOpacity: 0.5,
            strokeColor: "yellow",
            strokeOpacity: 1,
            strokeWidth: 1
        },
        filter: new OpenLayers.Filter.Comparison({ type: "==", property: 'type', value: 'point' })
    })]);
    routingStyle.styles.select.addRules([new OpenLayers.Rule({
        symbolizer: {
            strokeColor: "yellow",
            strokeOpacity: 0.6,
            strokeWidth: 5
        },
        filter: new OpenLayers.Filter.Comparison({ type: "==", property: 'type', value: 'route' })
    })]);
    var routingPanel = new GeoExt.ux.RoutingPanel({
        border: false,
        map: mapPanel.map,
        style: routingStyle,
        // Key for dev.geoext.org: 187a9f341f70406a8064d07a30e5695c
        // Key for localhost: BC9A493B41014CAABB98F0471D759707
        // Key for map.stephane-brunner.ch: 60a6b92afa824cc985331da088d3225c
        routingProviders: { 
            cloudmade : GeoExt.ux.RoutingProviders.getCloudmadeRoutingProvider(cloudmadeKey),
            sbrunner: GeoExt.ux.RoutingProviders.getSbrunnerRoutingProvider(),
//            ors: GeoExt.ux.RoutingProviders.getOpenRouteServiceProvider(),
            yours: GeoExt.ux.RoutingProviders.getYOURSRoutingProvider()
        },
        tbar: [
        {
            xtype: 'tbfill'
        },
        {
            text: OpenLayers.i18n('Clear'),
            enableToggle: false,
            handler: function() {
                if (routingPanel) {
                    routingPanel.clearItinerary();
                }
            }
        }]
    });
    
    
    // the viewport
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
                width: 300,
                minWidth: 300,
                maxWidth: 300,
                style: "overflow-x: hidden; overflow-y: auto;",
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
                        map: mapPanel.map,
                        controlOptions: {
                            geodesic: true
                        },
                        toggleGroup: 'tools'
                    }), 
                    new GeoExt.ux.MeasureArea({
                        map: mapPanel.map,
                        decimals: 0,
                        toggleGroup: 'tools'
                    }),
                    GeoExt.ux.RoutingProviders.nominatimSearchCombo({
                        map: mapPanel.map, 
                        zoom: 14
                    })
                ],
                items: [new My.ux.BubblePanel([{
                        title: OpenLayers.i18n("Layers"),
                        layout: 'fit',
                        name: 'sl',
                        height: 200,
                        items: [layerTree]
                    },
                    {
                        title: OpenLayers.i18n("Catalogue"),
                        layout: 'fit',
                        name: 'al',
                        height: 300,
                        items: [tree]
                    },
                    {
                        baseCls: "x-plane",
                        name: 'pl',
                        collapsed: true,
                        title: OpenLayers.i18n("Links"),
                        height: 300,
                        autoScroll: true,
                        style: "padding: 0 0 8px 8px;",
                        html: "<ul>"
                            + "<li><div id='permalink'><a href=''>" + OpenLayers.i18n("Permalink") + "</a></div></li>"
                            + "<li><a id='permalink.potlatch' href=''>" + OpenLayers.i18n("Edit on Potlatch") + "</a></li>"
                            + "<li><div id='josm'><a href=''>" + OpenLayers.i18n("Edit with JOSM") + "</a></div></li>"
                            + "<li><div id='mapzen'><a href='http://mapzen.cloudmade.com/editor'>" + OpenLayers.i18n("Edit with Mapzen") + "</a></div></li>"
                            + "</ul>"

                            + "<hr /><ul>"
                            + "<li><a id='permalink.amenity.editor' href='http://ae.osmsurround.org/'>" + OpenLayers.i18n("Amenity (POI) Editor") + "</a></li>"
                            + "<li><a id='permalink.keepright' href='http://keepright.ipax.at/report_map.php'>" + OpenLayers.i18n("Keep right!") + "</a></li>"
                            + "<li><a id='permalink.osmose' href='http://osmose.openstreetmap.fr/map/cgi-bin/index.py?'>" + OpenLayers.i18n("Osmose") + "</a></li>"
                            + "<li><a id='permalink.restrictions' href='http://osm.virtuelle-loipe.de/restrictions/'>" + OpenLayers.i18n("Restrictions") + "</a></li>"
                            + "<li><a id='permalink.geofabrik' href='http://tools.geofabrik.de/map/?type=Geofabrik'>" + OpenLayers.i18n("Geofabrik") + "</a></li>"
                            + "<li><a id='permalink.openrouteservice' href='http://www.openrouteservice.org'>" + OpenLayers.i18n("OpenRouteService.org") + "</a></li>"
                            + "<li><a id='permalink.osb' href='http://openstreetbugs.schokokeks.org/'>" + OpenLayers.i18n("OpenStreetBug") + "</a></li>"
                            + "<li><a id='permalink.qsm' href='http://www.qualitystreetmap.org/osmqa/'>" + OpenLayers.i18n("OSM QA Mpp") + "</a></li>"
                            + "<li><a id='permalink.maxspeed' href='http://maxspeed.osm.lab.rfc822.org/?layers=B0TF'>" + OpenLayers.i18n("Max speed") + "</a></li>"
                            + "<li><a id='permalink.refuges' href='http://refuges.info/nav.php?choix_layer=OSM'>" + OpenLayers.i18n("Refuges.info") + "</a></li>"
                            + "<li><a id='permalink.browser' href='http://www.openstreetbrowser.org/'>" + OpenLayers.i18n("OpenStreetBrowser") + "</a></li>"
                            + "<li><a id='permalink.letuffe' href='http://beta.letuffe.org/'>" + OpenLayers.i18n("Other test site") + "</a></li>"
                            + "<li><a id='permalink.wheelmap' href='http://wheelmap.org/'>" + OpenLayers.i18n("wheelmap.org") + "</a></li>"
                            + "<li><a id='permalink.kikebike' href='http://hikebikemap.de/'>" + OpenLayers.i18n("Hike bike map") + "</a></li>"
                            + "<li><a id='permalink.velo' href='http://osm.t-i.ch/bicycle/map/'>" + OpenLayers.i18n("Velo Access map") + "</a></li>"
                            + "<li><a id='permalink.osv' href='http://openstreetview.org/'>" + OpenLayers.i18n("OpenStreetView") + "</a></li>"
                            + "<li><a id='permalink.ocm' href='http://toolserver.org/~stephankn/cuisine/'>" + OpenLayers.i18n("OpenCuisineMap") + "</a></li>"
                            + "</ul>"

                            + "<hr /><ul>"
                            + '<li><a href="http://maps.cloudmade.com/">' + OpenLayers.i18n('CloudMade') + "</a></li>"
                            + '<li><a href="http://dev-yves.dyndns.org/legend/page.html">' + OpenLayers.i18n('OSM Legend') + "</a></li>"
                            + "</ul>"

                            + '<hr /><p><b><a href="https://github.com/sbrunner/map">Sources du site</a></b></p>'
                    },
                    {
                        title: OpenLayers.i18n("Routing"),
                        name: 'r',
                        collapsed: true,
                        layout: 'fit',
                        height: 520,
                        items: [routingPanel]
                    }], {html: ""}, {stateId: "b"})]
            }]
        }]
    });

    mapPanel.map.addControl(new OpenLayers.Control.PermalinkLayer("permalink.potlatch", "http://www.openstreetmap.org/edit"));
    mapPanel.map.addControl(new OpenLayers.Control.PermalinkLayer("permalink.amenity.editor", " http://ae.osmsurround.org/"));
    mapPanel.map.addControl(new OpenLayers.Control.PermalinkLayer("permalink.keepright", "http://keepright.ipax.at/report_map.php"));
    mapPanel.map.addControl(new OpenLayers.Control.PermalinkLayer("permalink.osmose", "http://osmose.openstreetmap.fr/map/cgi-bin/index.py"));
    mapPanel.map.addControl(new OpenLayers.Control.PermalinkLayer("permalink.restrictions", "http://osm.virtuelle-loipe.de/restrictions/"));
    mapPanel.map.addControl(new OpenLayers.Control.PermalinkLayer("permalink.geofabrik", "http://tools.geofabrik.de/map/?type=Geofabrik"));
    mapPanel.map.addControl(new OpenLayers.Control.PermalinkLayer("permalink.osb", "http://openstreetbugs.schokokeks.org/"));
    mapPanel.map.addControl(new OpenLayers.Control.PermalinkLayer("permalink.qsm", "http://www.qualitystreetmap.org/osmqa/"));
    mapPanel.map.addControl(new OpenLayers.Control.PermalinkLayer("permalink.maxspeed", "http://maxspeed.osm.lab.rfc822.org/", "B0TF"));
    mapPanel.map.addControl(new OpenLayers.Control.PermalinkLayer("permalink.refuges", "http://refuges.info/nav.php?choix_layer=OSM"));
    mapPanel.map.addControl(new OpenLayers.Control.PermalinkLayer("permalink.browser", "http://www.openstreetbrowser.org/"));
    mapPanel.map.addControl(new OpenLayers.Control.PermalinkLayer("permalink.letuffe", "http://beta.letuffe.org/"));
    mapPanel.map.addControl(new OpenLayers.Control.PermalinkLayer("permalink.wheelmap", "http://wheelmap.org/"));
    mapPanel.map.addControl(new OpenLayers.Control.PermalinkLayer("permalink.kikebike", "http://hikebikemap.de/"));
    mapPanel.map.addControl(new OpenLayers.Control.PermalinkLayer("permalink.velo", "http://osm.t-i.ch/bicycle/map/"));
    mapPanel.map.addControl(new OpenLayers.Control.PermalinkLayer("permalink.osv", "http://openstreetview.org/"));
    mapPanel.map.addControl(new OpenLayers.Control.PermalinkLayer("permalink.ocm", "http://toolserver.org/~stephankn/cuisine/"));
};
