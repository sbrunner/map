/*
 * @include OpenLayers/Projection.js
 * @include OpenLayers/Map.js
 * @include OpenLayers/Layer/XYZ.js
 * @include OpenLayers/Control/Navigation.js
 * @include OpenLayers/Control/PanPanel.js
 * @include OpenLayers/Control/ZoomPanel.js
 * @include OpenLayers/Control/ArgParser.js
 * @include OpenLayers/Control/Attribution.js
 * @include OpenLayers/Control/ScaleLine.js
 * @include OpenLayers/Control/OverviewMap.js
 * @include GeoExt/widgets/MapPanel.js
 * @include App/Tools.js
 */

Ext.namespace('App');

/**
 * Constructor: App.Map
 * Creates a {GeoExt.MapPanel} internally. Use the "mapPanel" property
 * to get a reference to the map panel.
 *
 * Parameters:
 * options - {Object} Options passed to the {GeoExt.MapPanel}.
 */
App.Map = function(options) {

    // Private

    /**
     * Method: getLayers
     * Returns the list of layers.
     *
     * Returns:
     * {Array({OpenLayers.Layer})} An array of OpenLayers.Layer objects.
     */
    var getLayers = function() {
        return [new OpenLayers.Layer.OSM(OpenLayers.i18n("White background"), "http://map.stephane-brunner.ch/white.png", { 
            numZoomLevels: 20, 
            ref: "w", 
            displayInLayerSwitcher: false
        })];
    };

    // Public

    Ext.apply(this, {

        /**
         * APIProperty: mapPanel
         * The {GeoExt.MapPanel} instance. Read-only.
         */
        mapPanel: null
    });

    // Main

    // create map
    var mapOptions = {
        projection: new OpenLayers.Projection("EPSG:900913"),
        displayProjection: new OpenLayers.Projection("EPSG:4326"),
        units: "m",
        theme: null,
        numZoomLevels: 18,
        maxResolution: 156543.0339,
        maxExtent: new OpenLayers.Bounds(-20037508, -20037508, 20037508, 20037508.34),
        controls: [
            new OpenLayers.Control.PanZoomBar(),
            new OpenLayers.Control.MousePosition(),
            new OpenLayers.Control.Navigation(),
            new OpenLayers.Control.ArgParser(),
            new OpenLayers.Control.Attribution(),
            new OpenLayers.Control.KeyboardDefaults(),
            new OpenLayers.Control.ScaleLine({geodesic: true, maxWidth: 120}),
        ]
    }
    
    var map = new OpenLayers.Map(mapOptions);
    map.addLayers(getLayers());

    // create map panel
    var tools = new App.Tools(map);
    options = Ext.apply({
        map: map,
//        tbar: tools.tbar,
        border: true,
        stateId: "m",
        prettyStateKeys: true
    }, options);

	this.mapPanel = new GeoExt.MapPanel(options);
};
