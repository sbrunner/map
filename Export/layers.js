
function getLayersTree(map) {
    var brutes = {
        text: OpenLayers.i18n("Raw"),
        leaf: false,
        children: []
    };
    var types = ['node', 'way', 'relation'];
    var cats = ["leisure", "amenity", "shop", "office", "tourism", "historic", "highway", "barrier", "cycleway", "tracktype", "railway", "aeroway", "power", "man_made", "landuse", "military", "natural", "route", "boundary", "sport", "abutters", "accessories", "place"];
    for (var i ; i < types.length ; i++) {
        type = types[i];
        var typeNode = {
            text: OpenLayers.i18n(toTitleCase(type + 's')),
            leaf: false,
            children: []
        };
        brutes.children.push(typeNode);
        for (var j = 0 ; j < cats.length ; j++) {
            cat = cats[j];
            var catNode = {
                text: OpenLayers.i18n(toTitleCase(cat)),
                map: map,
                leaf: true,
                handler: addXapiStyleLayer,
                style: null,
                id: type + "." + cat,
                element: type,
                predicate: cat
            }
            typeNode.children.push(catNode);
        }
    }

    var root = {
        expanded: true,
        children: [{
            text: OpenLayers.i18n("Base Layers"),
            leaf: false,
            expanded: true,
            children: [{
                text: OpenLayers.i18n("All features"),
                map: map,
                leaf: true,
                handler: addOsmStyleLayer,
                style: getOSMStyle(),
                id: 'all'
            },
            {
                text: OpenLayers.i18n("Raw"),
                map: map,
                leaf: true,
                handler: addOsmStyleLayer,
                style: null,
                id: 'raw'
            },
            {
                text: OpenLayers.i18n("Osmarender"),
                map: map,
                leaf: true,
                handler: addLayer,
                url: "http://b.tah.openstreetmap.org/Tiles/tile/${z}/${x}/${y}.png",
                numZoomLevels: 18,
                attribution: "<a href='http://www.osm.org/'>CC by-sa - OSM</a>", 
                id: "osma" 
            },
            {
                text: OpenLayers.i18n("OpenCycleMap"),
                map: map,
                leaf: true,
                handler: addLayer,
                url: "http://b.tile.opencyclemap.org/cycle/${z}/${x}/${y}.png",
                numZoomLevels: 17,
                attribution: "<a href='http://www.osm.org/'>CC by-sa - OSM</a>", 
                id: "bike" 
            },
            {
                text: OpenLayers.i18n("OpenPisteMap"),
                map: map,
                leaf: true,
                handler: addLayer,
                url: "http://tiles.openpistemap.org/contours/${z}/${x}/${y}.png",
                numZoomLevels: 18,
                attribution: "<a href='http://www.osm.org/'>CC by-sa - OSM</a>", 
                id: "sky" 
            },
            {
                text: OpenLayers.i18n("Public transport"),
                map: map,
                leaf: true,
                handler: addLayer,
                url: "http://tile.xn--pnvkarte-m4a.de/tilegen/${z}/${x}/${y}.png",
                numZoomLevels: 17,
                attribution: "<a href='http://www.osm.org/'>CC by-sa - OSM</a>", 
                id: "pt" 
            },
            {
                text: OpenLayers.i18n("Hiking Tails"),
                map: map,
                leaf: true,
                handler: addLayer,
                url: "http://osm.lonvia.de/hiking/${z}/${x}/${y}.png",
                numZoomLevels: 15,
                attribution: "<a href='http://www.osm.org/'>CC by-sa - OSM</a>", 
                id: "hiking" 
            }]
        },
        {
            text: OpenLayers.i18n("Dem"),
            leaf: false,
            expanded: true,
            children: [{
                text: OpenLayers.i18n("Hill shade"),
                map: map,
                leaf: true,
                handler: addLayer,
                url: "http://map.stephane-brunner.ch/topo/${z}/${x}/${y}.png",
                numZoomLevels: 18,
                attribution: "Data by <a href='ftp://e0srp01u.ecs.nasa.gov/srtm/version2/SRTM3/'>NASA</a>, <a href='http://asterweb.jpl.nasa.gov/gdem.asp'>ASTER</a>, <a href='http://www.gebco.net/'>GEBCO</a> and <a href='http://www.osm.org/'>OSM</a>", 
                id: "topo" 
            },
            {
                text: OpenLayers.i18n("Contours"),
                map: map,
                leaf: true,
                handler: addLayer,
                url: "http://map.stephane-brunner.ch/contours/${z}/${x}/${y}.png",
                numZoomLevels: 18,
                attribution: "Data by <a href='ftp://e0srp01u.ecs.nasa.gov/srtm/version2/SRTM3/'>NASA</a>, <a href='http://asterweb.jpl.nasa.gov/gdem.asp'>ASTER</a>, <a href='http://www.gebco.net/'>GEBCO</a> and <a href='http://www.osm.org/'>OSM</a>", 
                id: "cont" 
            }]
        },
        {
            text: OpenLayers.i18n("Outdoor"),
            expanded: false,
            leaf: false,
            children: [{
                text: OpenLayers.i18n("Peak"),
                map: map,
                leaf: true,
                handler: addXapiStyleLayer,
                style: getHikkingStyle(),
                id: 'peak',
                element: 'node',
                predicate: "natural=peak"
            },
            {
                text: OpenLayers.i18n("Mountain pass"),
                map: map,
                leaf: true,
                handler: addXapiStyleLayer,
                style: getHikkingStyle(),
                id: 'pass',
                element: 'node',
                predicate: "mountain_pass=yes"
            },
            {
                text: OpenLayers.i18n("Informations"),
                map: map,
                leaf: true,
                handler: addXapiStyleLayer,
                style: getHikkingStyle(),
                id: 'info',
                element: 'node',
                predicate: "tourism"
            },
            {
                text: OpenLayers.i18n("Hiking (scale)"),
                map: map,
                leaf: true,
                handler: addXapiStyleLayer,
                style: getHikkingStyle(),
                id: 'sac',
                element: 'way',
                predicate: "sac_scale"
            },
            {
                text: OpenLayers.i18n("Hiking (path)"),
                map: map,
                leaf: true,
                handler: addXapiStyleLayer,
                style: getHikkingStyle(),
                id: 'path',
                element: 'way',
                predicate: "highway=path"
            },
            {
                text: OpenLayers.i18n("MTB (scale)"),
                map: map,
                leaf: true,
                handler: addXapiStyleLayer,
                style: getMTBStyle(),
                id: 'mtbs',
                element: 'way',
                predicate: "mtb:scale=*"
            },
            {
                text: OpenLayers.i18n("MTB (route)"),
                map: map,
                leaf: true,
                handler: addXapiStyleLayer,
                style: getMTBStyle(),
                id: 'mtbr',
                element: 'relation',
                predicate: "route=mtb"
            },
            {
                text: OpenLayers.i18n("Bicycle"),
                map: map,
                leaf: true,
                handler: addXapiStyleLayer,
                style: getMTBStyle(),
                id: 'velo',
                element: 'relation',
                predicate: "route=bicycle"
            },
            {
                text: OpenLayers.i18n("Sled"),
                map: map,
                leaf: true,
                handler: addXapiStyleLayer,
                style: getSledStyle(),
                id: 'sled',
                element: 'way',
                predicate: "piste:type=sled"
            },
            {
                text: OpenLayers.i18n("Snows shoe"),
                map: map,
                leaf: true,
                handler: addXapiStyleLayer,
                style: getSnowShoeStyle(),
                id: 'xx',
                element: 'relation',
                predicate: "route=snowshoe"
            },
            {
                text: OpenLayers.i18n("Nordic"),
                map: map,
                leaf: true,
                handler: addXapiStyleLayer,
                style: getNordicStyle(),
                id: 'nordic',
                element: 'way',
                predicate: "piste:type=nordic"
            },
            {
                text: OpenLayers.i18n("Down hill"),
                map: map,
                leaf: true,
                handler: addXapiStyleLayer,
                style: getSkyStyle(),
                id: 'dh',
                element: 'way',
                predicate: "piste:type=downhill"
            },
            {
                text: OpenLayers.i18n("Winter Walks"),
                map: map,
                leaf: true,
                handler: addXapiStyleLayer,
                style: getWinterWalksStyle(),
                id: 'ww',
                element: 'relation',
                predicate: "route=winterwalks"
            },
            {
                text: OpenLayers.i18n("Fitness trail"),
                map: map,
                leaf: true,
                handler: addXapiStyleLayer,
                style: getHikkingStyle(),
                id: 'ft',
                element: 'relation',
                predicate: "route=fitness_trail"
            }]
        },
        {
            text: OpenLayers.i18n("Utils"),
            leaf: false,
            children: [{
                text: OpenLayers.i18n("Max"),
                leaf: false,
                children: [{
                    text: OpenLayers.i18n("Speed"),
                    map: map,
                    leaf: true,
                    handler: addXapiStyleLayer,
                    style: getMaxSpeedStyle(),
                    id: 'speed',
                    element: 'way',
                    predicate: "maxspeed"
                },
                {
                    text: OpenLayers.i18n("Weight"),
                    map: map,
                    leaf: true,
                    handler: addXapiStyleLayer,
                    style: null,
                    id: 'weight',
                    element: 'way',
                    predicate: "maxweight"
                },
                {
                    text: OpenLayers.i18n("Height"),
                    map: map,
                    leaf: true,
                    handler: addXapiStyleLayer,
                    style: null,
                    id: 'height',
                    element: 'way',
                    predicate: "maxheight"
                },
                {
                    text: OpenLayers.i18n("Width"),
                    map: map,
                    leaf: true,
                    handler: addXapiStyleLayer,
                    style: null,
                    id: 'width',
                    element: 'way',
                    predicate: "maxwidth"
                },
                {
                    text: OpenLayers.i18n("Length"),
                    map: map,
                    leaf: true,
                    handler: addXapiStyleLayer,
                    style: null,
                    id: 'length',
                    element: 'way',
                    predicate: "maxlength"
                }]
            }]
        },
        {
            text: OpenLayers.i18n("Debug"),
            leaf: false,
            children: [{
                text: OpenLayers.i18n("CloudMade nonames"),
                map: map,
                leaf: true,
                handler: addLayer,
                url: "http://tile.cloudmade.com/D563D910896D4B67B22BC1088920C483/3/256/${z}/${x}/${y}.png",
                displayOutsideMaxExtent: true,
                numZoomLevels: 18,
                attribution: "<a href='http://www.openstreetmap.org/'>CC-BY-SA OpenStreetMap &amp; Contributors</a> -- tiles from <a href='http://www.cloudmade.com/'>CloudMade</a>",
                id: "non"
            },
            {
                text: OpenLayers.i18n("Text of fixme and note"),
                map: map,
                leaf: true,
                handler: addLayer,
                url: "http://beta.letuffe.org/tiles/renderer.py/fixme-text/${z}/${x}/${y}.png",
                displayOutsideMaxExtent: true, 
                buffer: 1, 
                attribution: "<a href='http://www.osm.org/'>CC by-sa - OSM</a>", 
                id: "fn"
            },
            {
                text: OpenLayers.i18n("Duplicates nodes"),
                map: map,
                leaf: true,
                handler: addLayer,
                url: "http://matt.dev.openstreetmap.org/dupe_nodes/tiles/renderer.py/1.0.0/dupe_nodes/${z}/${x}/${y}.png",
                numZoomLevels: 18,
                attribution: "<a href='http://www.osm.org/'>CC by-sa - OSM</a>", 
                id: "dbl"
            },
            {
                text: OpenLayers.i18n("Swiss history"),
                leaf: false,
                children: [{
                    text: OpenLayers.i18n("September 2008"),
                    map: map,
                    leaf: true,
                    handler: addLayer,
                    url: "lausanne-20080926/${z}/${x}/${y}.png",
                    numZoomLevels: 18,
                    attribution: "<a href='http://www.osm.org/'>CC by-sa - OSM</a>", 
                    id: "20080926"
                },
                {
                    text: OpenLayers.i18n("June 2009"),
                    map: map,
                    leaf: true,
                    handler: addLayer,
                    url: "lausanne-20090606/${z}/${x}/${y}.png",
                    numZoomLevels: 18,
                    attribution: "<a href='http://www.osm.org/'>CC by-sa - OSM</a>", 
                    id: "20080926"
                },
                {
                    text: OpenLayers.i18n("June 2010"),
                    map: map,
                    leaf: true,
                    handler: addLayer,
                    url: "lausanne-20100622/${z}/${x}/${y}.png",
                    numZoomLevels: 18,
                    attribution: "<a href='http://www.osm.org/'>CC by-sa - OSM</a>", 
                    id: "20080926"
                }]
            }]
        },
        brutes]
    };
        
    return root;
}
