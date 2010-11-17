
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
            };
            typeNode.children.push(catNode);
        }
    }

    var root = {
		text: OpenLayers.i18n("All layers"),
        expanded: true,
        ref: 'allLayers',
        children: [{
            text: OpenLayers.i18n("Base Layers"),
            leaf: false,
            expanded: true,
            children: [{
                text: OpenLayers.i18n("All features"),
                leaf: true,
                handler: addOsmStyleLayer,
                style: getOSMStyle(),
                ref: 'all'
            },
            {
                text: OpenLayers.i18n("Raw"),
                leaf: true,
                handler: addOsmStyleLayer,
                style: null,
                ref: 'raw'
            },
            {
                text: OpenLayers.i18n("Mapnik"),
                leaf: true,
                handler: addLayer,
                url: "http://c.tile.openstreetmap.org/${z}/${x}/${y}.png",
                numZoomLevels: 18,
                attribution: "<a href='http://www.osm.org/'>CC by-sa - OSM</a>", 
                ref: "mk" 
            },
            {
                text: OpenLayers.i18n("Osmarender"),
                leaf: true,
                handler: addLayer,
                url: "http://b.tah.openstreetmap.org/Tiles/tile/${z}/${x}/${y}.png",
                numZoomLevels: 17,
                attribution: "<a href='http://www.osm.org/'>CC by-sa - OSM</a>", 
                ref: "osma" 
            },
            {
                text: OpenLayers.i18n("OpenCycleMap"),
                leaf: true,
                handler: addLayer,
                url: "http://b.tile.opencyclemap.org/cycle/${z}/${x}/${y}.png",
                numZoomLevels: 17,
                attribution: "<a href='http://www.osm.org/'>CC by-sa - OSM</a>", 
                ref: "bike" 
            },
            {
                text: OpenLayers.i18n("OpenPisteMap"),
                leaf: true,
                handler: addLayer,
                url: "http://tiles.openpistemap.org/contours/${z}/${x}/${y}.png",
                numZoomLevels: 18,
                attribution: "<a href='http://www.osm.org/'>CC by-sa - OSM</a>", 
                ref: "sky" 
            },
            {
                text: OpenLayers.i18n("Public transport"),
                leaf: true,
                handler: addLayer,
                url: "http://tile.xn--pnvkarte-m4a.de/tilegen/${z}/${x}/${y}.png",
                numZoomLevels: 17,
                attribution: "<a href='http://www.osm.org/'>CC by-sa - OSM</a>", 
                ref: "pt" 
            },
            {
                text: OpenLayers.i18n("Hiking Tails"),
                leaf: true,
                handler: addLayer,
                url: "http://osm.lonvia.de/hiking/${z}/${x}/${y}.png",
                numZoomLevels: 15,
                attribution: "<a href='http://www.osm.org/'>CC by-sa - OSM</a>", 
                ref: "hiking" 
            }]
        },
        {
            text: OpenLayers.i18n("Dem"),
            leaf: false,
            expanded: true,
            children: [{
                text: OpenLayers.i18n("Hill shade"),
                leaf: true,
                handler: addLayer,
                url: "http://map.stephane-brunner.ch/topo/${z}/${x}/${y}.png",
                numZoomLevels: 18,
                attribution: "Data by <a href='ftp://e0srp01u.ecs.nasa.gov/srtm/version2/SRTM3/'>NASA</a>, <a href='http://asterweb.jpl.nasa.gov/gdem.asp'>ASTER</a>, <a href='http://www.gebco.net/'>GEBCO</a> and <a href='http://www.osm.org/'>OSM</a>", 
                ref: "topo" 
            },
            {
                text: OpenLayers.i18n("Contours"),
                leaf: true,
                handler: addLayer,
                url: "http://map.stephane-brunner.ch/contours/${z}/${x}/${y}.png",
                numZoomLevels: 18,
                attribution: "Data by <a href='ftp://e0srp01u.ecs.nasa.gov/srtm/version2/SRTM3/'>NASA</a>, <a href='http://asterweb.jpl.nasa.gov/gdem.asp'>ASTER</a>, <a href='http://www.gebco.net/'>GEBCO</a> and <a href='http://www.osm.org/'>OSM</a>", 
                ref: "cont" 
            }]
        },
        {
            text: OpenLayers.i18n("Outdoor"),
            expanded: false,
            leaf: false,
            children: [{
                text: OpenLayers.i18n("Peak"),
                leaf: true,
                handler: addXapiStyleLayer,
                style: getHikkingStyle(),
                ref: 'peak',
                element: 'node',
                predicate: "natural=peak"
            },
            {
                text: OpenLayers.i18n("Mountain pass"),
                leaf: true,
                handler: addXapiStyleLayer,
                style: getHikkingStyle(),
                ref: 'pass',
                element: 'node',
                predicate: "mountain_pass=yes"
            },
            {
                text: OpenLayers.i18n("Informations"),
                leaf: true,
                handler: addXapiStyleLayer,
                style: getHikkingStyle(),
                ref: 'info',
                element: 'node',
                predicate: "tourism"
            },
            {
                text: OpenLayers.i18n("Hiking (scale)"),
                leaf: true,
                handler: addXapiStyleLayer,
                style: getHikkingStyle(),
                ref: 'sac',
                element: 'way',
                predicate: "sac_scale"
            },
            {
                text: OpenLayers.i18n("Hiking (path)"),
                leaf: true,
                handler: addXapiStyleLayer,
                style: getHikkingStyle(),
                ref: 'path',
                element: 'way',
                predicate: "highway=path"
            },
            {
                text: OpenLayers.i18n("MTB (scale)"),
                leaf: true,
                handler: addXapiStyleLayer,
                style: getMTBStyle(),
                ref: 'mtbs',
                element: 'way',
                predicate: "mtb:scale=*"
            },
            {
                text: OpenLayers.i18n("MTB (route)"),
                leaf: true,
                handler: addXapiStyleLayer,
                style: getMTBStyle(),
                ref: 'mtbr',
                element: 'relation',
                predicate: "route=mtb"
            },
            {
                text: OpenLayers.i18n("Bicycle"),
                leaf: true,
                handler: addXapiStyleLayer,
                style: getMTBStyle(),
                ref: 'velo',
                element: 'relation',
                predicate: "route=bicycle"
            },
            {
                text: OpenLayers.i18n("Sled"),
                leaf: true,
                handler: addXapiStyleLayer,
                style: getSledStyle(),
                ref: 'sled',
                element: 'way',
                predicate: "piste:type=sled"
            },
            {
                text: OpenLayers.i18n("Snows shoe"),
                leaf: true,
                handler: addXapiStyleLayer,
                style: getSnowShoeStyle(),
                ref: 'xx',
                element: 'relation',
                predicate: "route=snowshoe"
            },
            {
                text: OpenLayers.i18n("Nordic"),
                leaf: true,
                handler: addXapiStyleLayer,
                style: getNordicStyle(),
                ref: 'nordic',
                element: 'way',
                predicate: "piste:type=nordic"
            },
            {
                text: OpenLayers.i18n("Down hill"),
                leaf: true,
                handler: addXapiStyleLayer,
                style: getSkyStyle(),
                ref: 'dh',
                element: 'way',
                predicate: "piste:type=downhill"
            },
            {
                text: OpenLayers.i18n("Winter Walks"),
                leaf: true,
                handler: addXapiStyleLayer,
                style: getWinterWalksStyle(),
                ref: 'ww',
                element: 'relation',
                predicate: "route=winterwalks"
            },
            {
                text: OpenLayers.i18n("Fitness trail"),
                leaf: true,
                handler: addXapiStyleLayer,
                style: getHikkingStyle(),
                ref: 'ft',
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
                    leaf: true,
                    handler: addXapiStyleLayer,
                    style: getMaxSpeedStyle(),
                    ref: 'speed',
                    element: 'way',
                    predicate: "maxspeed"
                },
                {
                    text: OpenLayers.i18n("Weight"),
                    leaf: true,
                    handler: addXapiStyleLayer,
                    style: null,
                    ref: 'weight',
                    element: 'way',
                    predicate: "maxweight"
                },
                {
                    text: OpenLayers.i18n("Height"),
                    leaf: true,
                    handler: addXapiStyleLayer,
                    style: null,
                    ref: 'height',
                    element: 'way',
                    predicate: "maxheight"
                },
                {
                    text: OpenLayers.i18n("Width"),
                    leaf: true,
                    handler: addXapiStyleLayer,
                    style: null,
                    ref: 'width',
                    element: 'way',
                    predicate: "maxwidth"
                },
                {
                    text: OpenLayers.i18n("Length"),
                    leaf: true,
                    handler: addXapiStyleLayer,
                    style: null,
                    ref: 'length',
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
                leaf: true,
                handler: addLayer,
                url: "http://tile.cloudmade.com/D563D910896D4B67B22BC1088920C483/3/256/${z}/${x}/${y}.png",
                displayOutsideMaxExtent: true,
                numZoomLevels: 18,
                attribution: "<a href='http://www.openstreetmap.org/'>CC-BY-SA OpenStreetMap &amp; Contributors</a> -- tiles from <a href='http://www.cloudmade.com/'>CloudMade</a>",
                ref: "non"
            },
            {
                text: OpenLayers.i18n("Text of fixme and note"),
                leaf: true,
                handler: addLayer,
                url: "http://beta.letuffe.org/tiles/renderer.py/fixme-text/${z}/${x}/${y}.png",
                displayOutsideMaxExtent: true, 
                buffer: 1, 
                attribution: "<a href='http://www.osm.org/'>CC by-sa - OSM</a>", 
                ref: "fn"
            },
            {
                text: OpenLayers.i18n("Duplicates nodes"),
                leaf: true,
                handler: addLayer,
                url: "http://matt.dev.openstreetmap.org/dupe_nodes/tiles/renderer.py/1.0.0/dupe_nodes/${z}/${x}/${y}.png",
                numZoomLevels: 18,
                attribution: "<a href='http://www.osm.org/'>CC by-sa - OSM</a>", 
                ref: "dbl"
            },
            {
                text: OpenLayers.i18n("Swiss history"),
                leaf: false,
                children: [{
                    text: OpenLayers.i18n("September 2008"),
                    leaf: true,
                    handler: addLayer,
                    url: "lausanne/lausanne-20080926/${z}/${x}/${y}.png",
                    numZoomLevels: 18,
                    attribution: "<a href='http://www.osm.org/'>CC by-sa - OSM</a>", 
                    ref: "20080926"
                },
                {
                    text: OpenLayers.i18n("June 2009"),
                    leaf: true,
                    handler: addLayer,
                    url: "lausanne/lausanne-20090606/${z}/${x}/${y}.png",
                    numZoomLevels: 18,
                    attribution: "<a href='http://www.osm.org/'>CC by-sa - OSM</a>", 
                    ref: "20090606"
                },
                {
                    text: OpenLayers.i18n("June 2010"),
                    leaf: true,
                    handler: addLayer,
                    url: "lausanne/lausanne-20100622/${z}/${x}/${y}.png",
                    numZoomLevels: 18,
                    attribution: "<a href='http://www.osm.org/'>CC by-sa - OSM</a>", 
                    ref: "20100622"
                }]
            }]
        },
        brutes]
    };
        
    return root;
}
