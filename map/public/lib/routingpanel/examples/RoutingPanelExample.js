var mapPanel;

var treePanel;

var routingPanel;

var routingPanelOa;

var viewport;

var layer;

Ext.onReady(function() {

    var layer = new OpenLayers.Layer.OSM("OSM");

    var map = new OpenLayers.Map();

    var center = new OpenLayers.LonLat(738481, 5863900);

    var mouse = new OpenLayers.Control.MousePosition();

    map.addControl(mouse);
    mouse.activate();

    map.addLayers([layer]);

    var mapStore = new GeoExt.data.LayerStore({
        map: map,
        layers: [layer]
    });

    var toolbar = new Ext.Toolbar({
        items: [
            {
                xtype: 'tbfill'
            },
            {
                text: 'Clear route',
                enableToggle: false,
                handler: function() {
                    var routingPanelItem = Ext.getCmp("routingPanelItem");
                    if (routingPanelItem) {
                        routingPanelItem.clearItinerary();
                    }
                    var routingPanelItemOa = Ext.getCmp("routingPanelItemOa");
                    if (routingPanelItemOa) {
                        routingPanelItemOa.clearItinerary();
                    }
                }
            },
            {
                text: 'Permalink',
                enableToggle: false,
                handler: function() {
                    var routingPanelItemOa = Ext.getCmp("routingPanelItemOa");
                    if (routingPanelItemOa) {
                        window.open(routingPanelItemOa.getPermalink(true));
                    }
                }
            }
        ]});

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
                zoom: 14,
                split: true,
                tbar: toolbar
            },
            {
                layout:'accordion',
                region: "west",
                width: 350,
                items: [
                    {
                        id: "routingpaneloa",
                        title: "Routing Panel OpenAddresses",
                        listeners: {
                            'expand': function(panel) {
                                this.doLayout();
                            },
                            'collapse': function(panel) {
                                if (Ext.getCmp('routingPanelItemOa')) {
                                    Ext.getCmp('routingPanelItemOa').clearItinerary();
                                }
                            }
                        }
                    },
                    {
                        id: "routingpanel",
                        title: "Routing Panel GeoNames",
                        listeners: {
                            'expand': function(panel) {
                                this.doLayout();
                            },
                            'collapse': function(panel) {
                                if (Ext.getCmp('routingPanelItem')) {
                                    Ext.getCmp('routingPanelItem').clearItinerary();
                                }
                            }
                        }
                    },
                    {
                        id: "treepanel",
                        title: "Layer Tree"
                    }
                ]
            },
            {
                region: "south",
                layout: 'fit',
                id: "readme",
                title: 'README',
                margins: {left: 5,top: 5, bottom: 5, right: 5},
                html: '<p style="font-size:12pt;color:#15428B;font-weight:bold;margin:5">Routing Example. You can enter a location in the start or end text field or digitize coordinates in the map.</p>'
            }
        ]
    });

    var treePanelItem = new Ext.tree.TreePanel({
        root: new GeoExt.tree.LayerContainer({
            text: 'Map Layers',
            layerStore: mapStore,
            leaf: false,
            expanded: true
        }),
        enableDD: true
    });
    var routingPanelItemOa = {
        xtype: 'gxux_routingpanel',
        id: 'routingPanelItemOa',
        map: map,
        // Key for dev.geoext.org: 187a9f341f70406a8064d07a30e5695c
        // Key for localhost: BC9A493B41014CAABB98F0471D759707
        cloudmadeKey: '187a9f341f70406a8064d07a30e5695c',
        geocodingType: 'openaddresses',
        listeners:{
            routingcomputed: function() {
                //alert('Computation done');
            },
            beforeroutingcomputed: function() {
                //alert('Before computation');
            }
        }
    };
    var routingPanelItem = {
        xtype: 'gxux_routingpanel',
        id: 'routingPanelItem',
        map: map,
        // Key for dev.geoext.org: 187a9f341f70406a8064d07a30e5695c
        // Key for localhost: BC9A493B41014CAABB98F0471D759707
        cloudmadeKey: '187a9f341f70406a8064d07a30e5695c',
        geocodingType: 'geonames',
        listeners:{
            routingcomputed: function() {
                //alert('Computation done');
            },
            beforeroutingcomputed: function() {
                //alert('Before computation');
            }
        }
    };
    treePanel = Ext.getCmp("treepanel");
    treePanel.add(treePanelItem);
    routingPanelOa = Ext.getCmp("routingpaneloa");
    routingPanelOa.add(routingPanelItemOa);
    routingPanel = Ext.getCmp("routingpanel");
    routingPanel.add(routingPanelItem);
    routingPanelOa.doLayout();
    routingPanel.doLayout();
});