var mapPanel;

var GoogleEarthPanel;

var viewport;

var layer;

google.load("earth", "1");

Ext.onReady(function() {

    var options;
    var center = new OpenLayers.LonLat(730909, 5863990);

    options = {
        projection: new OpenLayers.Projection("EPSG:900913"),
        units: "m",
        numZoomLevels: 18,
        maxResolution: 156543.0339,
        maxExtent: new OpenLayers.Bounds(-20037508, -20037508,
                20037508, 20037508.34)
    };

    layer = new OpenLayers.Layer.Google(
            "Google Street", {sphericalMercator: true});

    var map = new OpenLayers.Map(options);

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
                        GoogleEarthPanel.setSize('50%', 0);
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

    var googleEarthPanelItem = {
        xtype: 'gxux_googleearthpanel',
        id: 'googleEarthPanelItem',
        map: map,
        networkLinkUrl: 'http://epfl-carto-plan2.demo-camptocamp.com/epfl/trunk/kml/BATI3D_EPFL.kmz',
        altitude: 50,
        heading: 91,
        tilt: 70,
        range: 96
    };

    viewport = new Ext.Viewport({
        layout: "border",
        id: 'mainViewport',
        items: [
            {
                region: "center",
                id: "mappanel",
                title: "Google Map",
                xtype: "gx_mappanel",
                map: map,
                layers: [layer],
                center: center,
                zoom: 16,
                split: true,
                tbar: toolbar
            },
            {
                region: "east",
                layout: 'fit',
                width: '50%',
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
                html: '<p style="font-size:12pt;color:#15428B;font-weight:bold;margin:5">Google Earth Panel in action. Enjoy !</p>'
            }
        ]
    });

    mapPanel = Ext.getCmp("mappanel");
    GoogleEarthPanel = Ext.getCmp("googleearthpanel");
    GoogleEarthPanel.add(googleEarthPanelItem);
    GoogleEarthPanel.doLayout();
    viewport.doLayout();
});