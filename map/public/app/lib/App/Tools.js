/**
 * Copyright (c) 2008-2010 The Open Source Geospatial Foundation
 * 
 * Published under the BSD license.
 * See http://svn.geoext.org/core/trunk/geoext/license.txt for the full text
 * of the license.
 */

/*
 * @include OpenLayers/Control/ZoomToMaxExtent.js
 * @include OpenLayers/Control/ZoomBox.js
 * @include OpenLayers/Control/ZoomOut.js
 * @include OpenLayers/Control/NavigationHistory.js
 * @include OpenLayers/Handler/Path.js
 * @include OpenLayers/Handler/Polygon.js
 * @include OpenLayers/Control/Measure.js
 * @include OpenLayers/Layer/Vector.js
 * @include OpenLayers/Renderer/SVG.js
 * @include OpenLayers/Renderer/VML.js
 * @include OpenLayers/StyleMap.js
 * @include OpenLayers/Style.js
 * @include OpenLayers/Rule.js
 * @include OpenLayers/Handler.js
 * @include OpenLayers/Handler/Path.js
 * @include OpenLayers/Handler/Polygon.js
 * 
 * @include GeoExt/widgets/Action.js
 * @include GeoExt.ux/MeasureLength.js
 * @include GeoExt.ux/MeasureArea.js
 * @include App/ToolPanel.js
 */

Ext.namespace('App');

/**
 * Constructor: App.Tools
 * Creates an {Ext.Toolbar} with tools. Use the "tbar" or "bbar" property
 * to get a reference to the top or bottom toolbar.
 *
 * Parameters:
 * map - {OpenLayers.Map} The map object.
 */
App.Tools = function(map) {

    // Private

    /**
     * Method: getTbarItems
     * Return the top toolbar items.
     *
     * Parameters:
     * map - {OpenLayers.Map} The map instance.
     *
     * Returns:
     * {Array} An array of toolbar items.
     */
    var getTbarItems = function(map) {
        var zoomToMaxExtent = new GeoExt.Action({
            control: new OpenLayers.Control.ZoomToMaxExtent(),
            map: map,
            iconCls: 'maxExtent',
            tooltip: OpenLayers.i18n("Tools.maxextentactiontooltip")
        });
        var zoomIn = new GeoExt.Action({
            control: new OpenLayers.Control.ZoomBox(),
            map: map,
            toggleGroup: map.id + '_tools',
            allowDepress: true,
            iconCls: 'mapZoomIn'
        });
        var zoomOut = new GeoExt.Action({
            control: new OpenLayers.Control.ZoomOut(),
            map: map,
            iconCls: 'mapZoomOut'
        });

        var history = new OpenLayers.Control.NavigationHistory();
        map.addControl(history);
        var historyPrevious = new GeoExt.Action({
            control: history.previous,
            disabled: true,
            iconCls: 'mapHistoryPrevious'
        });
        var historyNext = new GeoExt.Action({
            control: history.next,
            disabled: true,
            iconCls: 'mapHistoryNext'
        });

        var measureLength = new GeoExt.ux.MeasureLength({
            map: map,
            controlOptions: {
                geodesic: true
            },
            toggleGroup: map.id + '_tools',
            tooltip: OpenLayers.i18n("Tools.measurelengthactiontooltip")
        });
        var measureArea = new GeoExt.ux.MeasureArea({
            map: map,
            controlOptions: {
                geodesic: true
            },
            toggleGroup: map.id + '_tools',
            tooltip: OpenLayers.i18n("Tools.measureareaactiontooltip")
        });
        var drag = new GeoExt.Action({
            control: new OpenLayers.Control.DragPan(), 
            toggleGroup: map.id + '_tools',
            iconCls: 'drag-icon', 
            tooltip: OpenLayers.i18n("Drag the map"),
            pressed: true,
            enableToggle: true
        });
        var geocodder = GeoExt.ux.RoutingProviders.nominatimSearchCombo({
            map: map, 
            zoom: 14
        });

        return [
            drag, zoomToMaxExtent, zoomIn, zoomOut, '-',
            historyPrevious, historyNext, '-',
            measureLength, measureArea, '-', geocodder, '->'
        ];
    };

    // Public

    Ext.apply(this, {

        /**
         * APIProperty: tbar
         * {Ext.Toolbar} The top toolbar instance. Read-only.
         */
        tbar: null,

    });

    // Main
    this.tbar = new Ext.Toolbar({ 
        items: getTbarItems(map) 
    });

    this.getAdditionalButtons = function(map) {
        /*
         * Selected feature
         */
        var selection = toolBuilder(OpenLayers.i18n("Selected"), new Ext.Panel({
            id: 'featureData',
            style: "padding: 0 0 8px 8px;"
        }));

        /*
         * Layers
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
         * Catalogue 
         */
        var tree = new GeoExt.LayerCatalogue({
            mapPanel: GeoExt.MapPanel.guess(),
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
        })
        tree.getTopToolbar().insert(0, new Ext.Toolbar.TextItem(OpenLayers.i18n("Catalogue")));
        if (map.layers.length == 1) { // only the blank background
            tree.addLayerByRef('mk');
            tree.addLayerByRef('all');
        }
        
        /*
         * Layers
         */
        var layers = toolBuilder(OpenLayers.i18n("Layers"), new Ext.Panel({
            items: [layerTree, tree]
//            items: [layerTree, {text: OpenLayers.i18n("Catalogue"), cls: 'x-plain-tl'}, tree]
        }));


        /*
         * Routing
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
        var routing = toolBuilder(OpenLayers.i18n("Routing"), new GeoExt.ux.RoutingPanel({
            border: false,
            map: map,
            width: 300,
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
        }));

        var links = toolBuilder(OpenLayers.i18n("Links"), new Ext.Panel({
            autoScroll: true,
            width: 200,
            style: "padding: 0 0 8px 8px;",
            html: "<ul>"
                + "<li><div id='permalink'><a href=''>" + OpenLayers.i18n("Permalink") + "</a></div></li>"
                + "<li><div id='permalink.osm'><a href='http://openstreetmap.org'>" + OpenLayers.i18n("OpenStreetMap") + "</a></div></li>"
                + "</ul>"

                + "<hr /><ul>"
                + "<li><a id='permalink.potlatch' href=''>" + OpenLayers.i18n("Edit on Potlatch") + "</a></li>"
                + "<li><div id='josm'><a href=''>" + OpenLayers.i18n("Edit with JOSM") + "</a></div></li>"
                + "<li><div id='mapzen'><a href='http://mapzen.cloudmade.com/editor'>" + OpenLayers.i18n("Edit with Mapzen") + "</a></div></li>"
                + "</ul>"

                + "<hr /><ul>"
                + "<li><a id='permalink.keepright' href='http://keepright.ipax.at/report_map.php'>" + OpenLayers.i18n("Keep right!") + "</a></li>"
                + "<li><a id='permalink.osmose' href='http://osmose.openstreetmap.fr/map/cgi-bin/index.py?'>" + OpenLayers.i18n("Osmose") + "</a></li>"
                + "<li><a id='permalink.restrictions' href='http://osm.virtuelle-loipe.de/restrictions/'>" + OpenLayers.i18n("Restrictions") + "</a></li>"
                + "<li><a id='permalink.geofabrik' href='http://tools.geofabrik.de/map/?type=Geofabrik'>" + OpenLayers.i18n("Geofabrik") + "</a></li>"
                + "<li><a id='permalink.amenity.editor' href='http://ae.osmsurround.org/'>" + OpenLayers.i18n("Amenity (POI) Editor") + "</a></li>"
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
                + "<li><a id='permalink.playground' href='http://toolserver.org/~stephankn/playground/?layers=BT'>" + OpenLayers.i18n("OpenPlaygroundMap") + "</a></li>"
                + "<li><a id='permalink.rsr' href='http://www.rollstuhlrouting.de/routenplaner.html?layers=B0TTTTFFFF'>" + OpenLayers.i18n("Rollstuhlrouting.de") + "</a></li>"
                + "<li><a id='permalink.rsk' href='http://www.rollstuhlkarte.ch/?layers=B00000FFTTFFFFFFT'>" + OpenLayers.i18n("rollstuhlkarte.ch") + "</a></li>"
                + "<li><a id='permalink.hist' href='http://www.histosm.org/'>" + OpenLayers.i18n("Histo OSM") + "</a></li>"
                + "<li><a id='permalink.post' href='http://post.openstreetmap.de/?layers=BTTTT'>" + OpenLayers.i18n("Post- und Telefonkarte") + "</a></li>"
                + "</ul>"

                + "<hr /><ul>"
                + '<li><a href="http://www.geofabrik.de/">' + OpenLayers.i18n('Geofabrik') + "</a></li>"
                + '<li><a href="http://maps.cloudmade.com/">' + OpenLayers.i18n('CloudMade') + "</a></li>"
                + '<li><a href="http://dev-yves.dyndns.org/legend/page.html">' + OpenLayers.i18n('OSM Legend') + "</a></li>"
                + "</ul>"

                + '<hr /><p><b><a href="https://github.com/sbrunner/map">Sources du site</a></b></p>'
        }));
        
        return [selection, layers, routing, links];
    }
};
