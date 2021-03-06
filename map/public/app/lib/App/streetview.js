/*
 * @include streetviewpanel/ux/widgets/StreetViewPanel.js
 * @include streetviewpanel/ux/control/StreetViewClick.js
 * @include OpenLayers/Map.js
 * @include OpenLayers/Layer/OSM.js
 * @include OpenLayers/Layer/Google.js
 * @include OpenLayers/Control/MousePosition.js
 * @include OpenLayers/Control/PanZoom.js
 * @include OpenLayers/Control/ArgParser.js
 * @include OpenLayers/Control/Attribution.js
 * @include OpenLayers/Control/Navigation.js
 * @include OpenLayers/Layer/SphericalMercator.js
 * @include GeoExt/widgets/MapPanel.js
 */

Ext.onReady(function() {

    layer = new OpenLayers.Layer.OSM();
    var map = new OpenLayers.Map({
        projection: new OpenLayers.Projection("EPSG:900913"),
        displayProjection: new OpenLayers.Projection("EPSG:4326"),
        units: "m"
    });
    var mouse = new OpenLayers.Control.MousePosition();
    map.addControl(mouse);

    var toolbar = new Ext.Toolbar({
        items: [{
            xtype: 'tbfill'
        },
        {
            text: 'Permalink',
            enableToggle: false,
            handler: function() {
                var streetViewPanelItem = Ext.getCmp("streetViewPanelItem");
                if (streetViewPanelItem) {
                    window.open(streetViewPanelItem.panorama.getPermalink(true));
                }
            }
        }]
    });

    var positionPano = new OpenLayers.LonLat(739019.93169167, 5861792.5629019);
    positionPano.transform(map.projection, new OpenLayers.Projection("EPSG:4326"));
    var featurePosition = new GLatLng(positionPano.lat, positionPano.lon);

    var streetViewPanelItem = {
        xtype: 'gxux_streetviewpanel',
        id: 'streetViewPanelItem',
        map: map,
        baseUrl: 'lib/streetviewpanel',
        videoMode: true,
        showLinks: true,
        showTool: true
    };

    viewport = new Ext.Viewport({
        layout: "border",
        id: 'mainViewport',
        items: [
            {
                region: "center",
                id: "mappanel",
                xtype: "gx_mappanel",
                map: map,
                layers: [layer],
                split: true,
                border: false,
                tbar: toolbar
            },
            {
                region: "east",
                layout: 'fit',
                width: '50%',
                id: "streetviewpanel",
                split: true,
                border: false
            }
        ]
    });

    streetViewPanel = Ext.getCmp("streetviewpanel");
    streetViewPanel.add(streetViewPanelItem);
    streetViewPanel.doLayout();
    viewport.doLayout();
});
