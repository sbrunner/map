var printProvider, printForm;

Ext.onReady(function() {

    printProvider = new GeoExt.data.PrintProvider({
        // using get for remote service access without same origin restriction.
        // For asynchronous requests, we would set method to "POST".
        method: "GET",
        //method: "POST",
        
        // capabilities from script tag in Printing.html. For asynchonous
        // loading, we would configure url (and autoLoad) instead of
        // capabilities.
        capabilities: printCapabilities
        //url: "/geoserver/pdf/",
        //autoLoad: true
    });
    
    var mapPanel = new GeoExt.MapPanel({
        region: "center",
        layers: [new OpenLayers.Layer.WMS("Global Imagery",
            "http://vmap0.tiles.osgeo.org/wms/vmap0",
            {layers: "basic"})],
        center: [16,48],
        zoom: 5
    });

    // create a vector layer, which will also be printed.
    var redline = new OpenLayers.Layer.Vector("vector", {
        styleMap: new OpenLayers.StyleMap({
            strokeColor: "red",
            fillColor: "red",
            fillOpacity: 0.7,
            strokeWidth: 2,
            pointRadius: 12,
            externalGraphic: "http://openlayers.org/dev/img/marker-blue.png"
        })
    });
    var geom = OpenLayers.Geometry.fromWKT, Vec = OpenLayers.Feature.Vector;
    redline.addFeatures([
        new Vec(geom("POLYGON(15 47, 15 46, 16 47, 16 48)")),
        new Vec(geom("LINESTRING(14 48, 14 47, 15 48, 14 49, 16 49)")),
        new Vec(geom("POINT(16 49)"))
    ]);
    mapPanel.map.addLayer(redline);
    
    // Create a vector layer for the print page extent and handles.
    // We only do this because we want fancy styles for the handles,
    // otherwise SimplePrint's PrintExtent would auto-create one for us.
    var extentLayer = new OpenLayers.Layer.Vector("print", {
        displayInLayerSwitcher: false,
        styleMap: new OpenLayers.StyleMap(new OpenLayers.Style(Ext.applyIf({
            pointRadius: 4,
            graphicName: "square",
            rotation: "${getRotation}",
            strokeColor: "${getStrokeColor}",
            fillOpacity: "${getFillOpacity}"
        }, OpenLayers.Feature.Vector.style["default"]), {
            context: {
                getRotation: function(feature) {
                    return printForm.printPage.rotation;
                },
                getStrokeColor: function(feature) {
                    return feature.geometry.CLASS_NAME == "OpenLayers.Geometry.Point" ?
                        "#000" : "#ee9900";
                },
                getFillOpacity: function(feature) {
                    return feature.geometry.CLASS_NAME == "OpenLayers.Geometry.Point" ?
                        0 : 0.4;
                }
            }
        })
    )});
    
    // a simple print form
    printForm = new GeoExt.ux.SimplePrint({
        mapPanel: mapPanel,
        layer: extentLayer, // optional
        autoFit: true,
        printProvider: printProvider,
        bodyStyle: {padding: "5px"},
        labelWidth: 65,
        defaults: {width: 115},
        region: "east",
        border: false,
        width: 200
    });

    // add custom fields to the form
    printForm.insert(0, {
        xtype: "textfield",
        name: "mapTitle",
        fieldLabel: "Title",
        value: "A custom title",
        plugins: new GeoExt.plugins.PrintPageField({
            printPage: printForm.printPage
        })
    });
    printForm.insert(1, {
        xtype: "textarea",
        fieldLabel: "Comment",
        name: "comment",
        value: "A custom comment",
        plugins: new GeoExt.plugins.PrintPageField({
            printPage: printForm.printPage
        })
    });
    
    var formCt = new Ext.Panel({
        layout: "fit",
        region: "east",
        width: 200
    });
    
    new Ext.Panel({
        renderTo: "content",
        layout: "border",
        width: 800,
        height: 350,
        items: [mapPanel, formCt]
    });
    
    /* add the print form to its container and make sure that the print page
     * fits the max extent
     */
    formCt.add(printForm);
    formCt.doLayout();

    /* use this code block instead of the above one if you configured the
     * printProvider with url instead of capabilities
    var myMask = new Ext.LoadMask(formCt.body, {msg:"Loading data..."});
    myMask.show();
    printProvider.on("loadcapabilities", function() {
        myMask.hide();
        formCt.add(printForm);
        formCt.doLayout();
    });
     */
    
});
