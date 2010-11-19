Ext.onReady(function() {
    var mapPanel = new GeoExt.MapPanel({
        title: "Map",
        renderTo: "map",
        height: 400,
        width: 600
    });
    mapPanel.map.addLayer(new OpenLayers.Layer.OSM("Background", "http://map.stephane-brunner.ch/white.png", {displayInLayerSwitcher: false}));
    mapPanel.map.zoomTo(4);
    mapPanel.map.setCenter(new OpenLayers.LonLat(736265, 5862765));

    var tree = new Ext.tree.TreePanel({
        title: "Layers tree",
        renderTo: "tree",
        root: new GeoExt.tree.LayerContainer({ expanded: true }),
        width: 170,
        height: 200,
        rootVisible: false
    });
    var catalogue = new GeoExt.LayerCatalogue({
        title: "Layers catalogue",
        renderTo: "store",
        mapPanel: mapPanel,
        root: {
            text: "All the store",
            expanded: true,
            children: [{
                text: "Mapnik",
                ref: 'mapnik',
                leaf: true,
                builder: OpenLayers.Layer.OSM,
                url: "http://c.tile.openstreetmap.org/${z}/${x}/${y}.png",
                layerOptions: {}
            }, {
                text: "Osmarender",
                ref: 'osmarender',
                leaf: true,
                handler: function(layerNode) {
                    return new OpenLayers.Layer.OSM(layerNode.text, "http://b.tah.openstreetmap.org/Tiles/tile/${z}/${x}/${y}.png");
                }
            }]
        },
        width: 170,
        height: 200
    });    
});
