var mapPanel;

var GoogleEarthPanel;

var treePanel;

var viewport;

var layer;

google.load("earth", "1");

Ext.onReady(function() {

    var states = new OpenLayers.Layer.WMS(
            "States",
            "http://sigma.openplans.org/geoserver/wms?",
    {layers: 'topp:states', transparent: 'true'},
    {singleTile: true, isBaseLayer: false}
            );

    var bluemarble = new OpenLayers.Layer.WMS(
            "Bluemarble",
            "http://sigma.openplans.org/geoserver/wms?",
    {layers: 'bluemarble'},
    {singleTile: true}
            );

    var map = new OpenLayers.Map();

    var center = new OpenLayers.LonLat(-98.3, 39.9);

    var mouse = new OpenLayers.Control.MousePosition();

    map.addControl(mouse);
    mouse.activate();

    var toolbar = new Ext.Toolbar({
        items: [
            {
                xtype: 'tbfill'
            },
            {
                text: 'Google Earth',
                id: "googleToggle",
                enableToggle: true,
                pressed: true,
                handler: function() {
                    if (this.pressed) {
                        GoogleEarthPanel.add(googleEarthPanelItem);
                        GoogleEarthPanel.setSize('40%', 0);
                        GoogleEarthPanel.setVisible(true);
                        GoogleEarthPanel.doLayout();
                        viewport.doLayout();
                    } else {
                        GoogleEarthPanel.remove('googleEarthPanelItem');
                        GoogleEarthPanel.setWidth(0);
                        GoogleEarthPanel.setVisible(false);
                        GoogleEarthPanel.doLayout();
                        viewport.doLayout();
                    }
                }
            },
            {
                text: 'Permalink',
                enableToggle: false,
                handler: function() {
                    var googleEarthPanelItem = Ext.getCmp("googleEarthPanelItem");
                    if (googleEarthPanelItem) {
                        window.open(googleEarthPanelItem.getPermalink(true));
                    }
                }
            }
        ]});
    
    var mapStore = new GeoExt.data.LayerStore({
        map: map,
        layers: [bluemarble, states]
    });

    var googleEarthPanelItem = {
        xtype: 'gxux_googleearthpanel',
        id: 'googleEarthPanelItem',
        map: map,
        layers: [states],
        altitude: 50,
        heading: 21.5,
        tilt: 70,
        range: 1485370
    };

    var treeItem = new Ext.tree.TreePanel({
        root: new GeoExt.tree.LayerContainer({
            text: 'Map Layers',
            layerStore: mapStore,
            leaf: false,
            expanded: true
        }),
        enableDD: true
    });

    viewport = new Ext.Viewport({
        layout: "border",
        id: 'mainViewport',
        items: [
            {
                region: "center",
                id: "mappanel",
                title: "2D Map",
                xtype: "gx_mappanel",
                map: map,
                layers: mapStore,
                center: center,
                zoom: 3,
                split: true,
                tbar: toolbar
            },
            {
                region: "west",
                id: "treepanel",
                title: "Layer Tree",
                width: 200
            },
            {
                region: "east",
                layout: 'fit',
                width: '40%',
                id: "googleearthpanel",
                title: 'Google Earth Panel',
                closeAction: 'hide',
                split: true
            },
            {
                region: "south",
                layout: 'fit',
                id: "readme",
                title: 'README',
                margins: {left: 5,top: 5, bottom: 5, right: 5},
                html: '<p style="font-size:12pt;color:#15428B;font-weight:bold;margin:5">Google Earth Panel with WMS overlay. Enjoy !</p>'
            }
        ]
    });

    GoogleEarthPanel = Ext.getCmp("googleearthpanel");
    GoogleEarthPanel.add(googleEarthPanelItem);
    treePanel = Ext.getCmp("treepanel");
    treePanel.add(treeItem);
    treePanel.doLayout();
    GoogleEarthPanel.doLayout();
    viewport.doLayout();
});