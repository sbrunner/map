/**
 * Copyright (c) 2008-2010 The Open Source Geospatial Foundation
 * 
 * Published under the BSD license.
 * See http://svn.geoext.org/core/trunk/geoext/license.txt for the full text
 * of the license.
 */

function getLayersTree(map) {
    var brutes = {
        text: OpenLayers.i18n("Raw (XAPI)"),
        leaf: false,
        children: []
    };
    var types = ['node', 'way', 'relation'];
    var cats = ["leisure", "amenity", "shop", "office", "tourism", "historic", "highway", "barrier", "cycleway", "tracktype", "railway", "aeroway", "power", "man_made", "landuse", "military", "natural", "route", "boundary", "sport", "abutters", "accessories", "place"];
    for (var i = 0 ; i < types.length ; i++) {
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
                ref: type + "-" + cat,
                element: type,
                predicate: cat
            };
            typeNode.children.push(catNode);
        }
    }

    var wikipediam = [{
        text: OpenLayers.i18n("OSM no label"),
        leaf: true,
        handler: addLayer,
        url: "http://a.www.toolserver.org/tiles/osm-no-labels/${z}/${x}/${y}.png",
        displayOutsideMaxExtent: true,
        numZoomLevels: 18,
        attribution: "<a href='http://www.openstreetmap.org/'>CC-BY-SA OpenStreetMap &amp; Contributors</a> -- tiles from <a href='http://www.cloudmade.com/'>CloudMade</a>",
        ref: "nolabel"
    }];
    var wikipedia = [];
    var languagesm = ['en', 'de', 'fr', 'it', 'pl', 'ja', 'es', 'ru', 'pt', 'nl'];
    var languages = ['aa', 'ab', 'ace', 'af', 'ak', 'als', 'am', 'an', 'ang', 'ar', 'arc', 'arz', 'as', 'ast', 'av', 'ay', 'az', 'ba', 'bar',
            'bat-smg', 'bcl', 'be', 'be-x-old', 'bg', 'bh', 'bi', 'bjn', 'bm', 'bn', 'bo', 'bpy', 'br', 'bs', 'bug', 'bxr', 'ca', 'cbk-zam',
            'cdo', 'ce', 'ceb', 'ch', 'cho', 'chr', 'chy', 'ckb', 'co', 'cr', 'crh', 'cs', 'csb', 'cu', 'cv', 'cy', 'da', 'diq', 'dsb', 'dv',
            'dz', 'ee', 'el', 'eml', 'eo', 'et', 'eu', 'ext', 'fa', 'ff', 'fi', 'fiu-vro', 'fj', 'fo', 'frp', 'frr', 'fur', 'fy',
            'ga', 'gan', 'gd', 'gl', 'glk', 'gn', 'got', 'gu', 'gv', 'ha', 'hak', 'haw', 'he', 'hi', 'hif', 'ho', 'hr', 'hsb', 'ht', 'hu',
            'hy', 'hz', 'ia', 'id', 'ie', 'ig', 'ii', 'ik', 'ilo', 'io', 'is', 'iu', 'jbo', 'jv', 'ka', 'kaa', 'kab', 'kg',
            'ki', 'kj', 'kk', 'kl', 'km', 'kn', 'ko', 'koi', 'kr', 'krc', 'ks', 'ksh', 'ku', 'kv', 'kw', 'ky', 'la', 'lad', 'lb', 'lbe',
            'lg', 'li', 'lij', 'lmo', 'ln', 'lo', 'lt', 'lv', 'map-bms', 'mdf', 'mg', 'mh', 'mhr', 'mi', 'mk', 'ml', 'mn', 'mo', 'mr',
            'mrj', 'ms', 'mt', 'mus', 'mwl', 'my', 'myv', 'mzn', 'na', 'nah', 'nap', 'nds', 'nds-nl', 'ne', 'new', 'ng', 'nn', 'no',
            'nov', 'nrm', 'nv', 'ny', 'oc', 'om', 'or', 'os', 'pa', 'pag', 'pam', 'pap', 'pcd', 'pdc', 'pi', 'pih', 'pms', 'pnb',
            'pnt', 'ps', 'qu', 'rm', 'rmy', 'rn', 'ro', 'roa-rup', 'roa-tara', 'rw', 'sa', 'sah', 'sc', 'scn', 'sco', 'sd',
            'se', 'sg', 'sh', 'si', 'simple', 'sk', 'sl', 'sm', 'sn', 'so', 'sq', 'sr', 'srn', 'ss', 'st', 'stq', 'su', 'sv', 'sw', 'szl',
            'ta', 'te', 'tet', 'tg', 'th', 'ti', 'tk', 'tl', 'tn', 'to', 'tpi', 'tr', 'ts', 'tt', 'tum', 'tw', 'ty', 'udm', 'ug', 'uk',
            'ur', 'uz', 've', 'vec', 'vi', 'vls', 'vo', 'wa', 'war', 'wo', 'wuu', 'xal', 'xh', 'yi', 'yo', 'za', 'zea', 'zh',
            'zh-classical', 'zh-min-nan', 'zh-yue', 'zu'];
    for (var i = 0 , len = languagesm.length ; i < len ; i++) {
        var l = languagesm[i];
        wikipediam.push({
            text: OpenLayers.i18n(l),
            leaf: true,
            handler: addLayer,
            url: [
                "http://a.www.toolserver.org/tiles/osm-labels-" + l + "/${z}/${x}/${y}.png", 
                "http://b.www.toolserver.org/tiles/osm-labels-" + l + "/${z}/${x}/${y}.png", 
                "http://c.www.toolserver.org/tiles/osm-labels-" + l + "/${z}/${x}/${y}.png"
            ],
            displayOutsideMaxExtent: true,
            numZoomLevels: 18,
            attribution: "<a href='http://www.openstreetmap.org/'>CC-BY-SA OpenStreetMap &amp; Contributors</a>",
            ref: l
        });
    }

    for (var i = 0 , len = languages.length ; i < len ; i++) {
        var l = languages[i];
        wikipedia.push({
            text: OpenLayers.i18n(l),
            leaf: true,
            handler: addLayer,
            url: [
                "http://a.www.toolserver.org/tiles/osm-labels-" + l + "/${z}/${x}/${y}.png", 
                "http://b.www.toolserver.org/tiles/osm-labels-" + l + "/${z}/${x}/${y}.png", 
                "http://c.www.toolserver.org/tiles/osm-labels-" + l + "/${z}/${x}/${y}.png"
            ],
            displayOutsideMaxExtent: true,
            numZoomLevels: 18,
            attribution: "<a href='http://www.openstreetmap.org/'>CC-BY-SA OpenStreetMap &amp; Contributors</a>",
            ref: l
        });
    }
    wikipediam.push({
        text: OpenLayers.i18n("Others"),
        leaf: false,
        children: wikipedia
    });

            
    var root = {
		text: OpenLayers.i18n("All layers"),
        expanded: true,
        children: [{
            text: OpenLayers.i18n("Base Layers"),
            leaf: false,
            expanded: true,
            children: [{
                text: OpenLayers.i18n("Generalist"),
                leaf: false,
                expanded: false,
                children: [{
                    text: OpenLayers.i18n("All features"),
                    leaf: true,
                    handler: addOsmStyleLayer,
                    style: getOSMStyle,
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
                    url: [
                        "http://a.tile.openstreetmap.org/${z}/${x}/${y}.png",
                        "http://b.tile.openstreetmap.org/${z}/${x}/${y}.png",
                        "http://c.tile.openstreetmap.org/${z}/${x}/${y}.png"
                    ],
                    numZoomLevels: 18,
                    attribution: "<a href='http://www.osm.org/'>CC by-sa - OSM</a>", 
                    ref: "mk" 
                },
                {
                    text: OpenLayers.i18n("Mapnik black an white"),
                    leaf: true,
                    handler: addLayer,
                    url: [
                        "http://a.www.toolserver.org/tiles/bw-mapnik/${z}/${x}/${y}.png",
                        "http://b.www.toolserver.org/tiles/bw-mapnik/${z}/${x}/${y}.png",
                        "http://c.www.toolserver.org/tiles/bw-mapnik/${z}/${x}/${y}.png"
                    ],
                    numZoomLevels: 18,
                    attribution: "<a href='http://www.osm.org/'>CC by-sa - OSM</a>", 
                    ref: "mkbw" 
                },
                {
                    text: OpenLayers.i18n("MapQuest"),
                    leaf: true,
                    handler: addLayer,
                    url: [
                        "http://otile1.mqcdn.com/tiles/1.0.0/osm/${z}/${x}/${y}.png",
                        "http://otile2.mqcdn.com/tiles/1.0.0/osm/${z}/${x}/${y}.png",
                        "http://otile3.mqcdn.com/tiles/1.0.0/osm/${z}/${x}/${y}.png",
                        "http://otile4.mqcdn.com/tiles/1.0.0/osm/${z}/${x}/${y}.png"
                    ],
                    numZoomLevels: 18,
                    attribution: "<a href='http://www.osm.org/'>CC by-sa - OSM</a>", 
                    ref: "mapquest" 
                },
                {
                    text: OpenLayers.i18n("Osmarender"),
                    leaf: true,
                    handler: addLayer,
                    url: [
                        "http://a.tah.openstreetmap.org/Tiles/tile/${z}/${x}/${y}.png",
                        "http://b.tah.openstreetmap.org/Tiles/tile/${z}/${x}/${y}.png",
                        "http://c.tah.openstreetmap.org/Tiles/tile/${z}/${x}/${y}.png"
                    ],
                    numZoomLevels: 17,
                    attribution: "<a href='http://www.osm.org/'>CC by-sa - OSM</a>", 
                    ref: "osma" 
                },
                {
                    text: OpenLayers.i18n("CloudMade"),
                    leaf: true,
                    handler: addLayer,
                    url: [
                        "http://a.tile.cloudmade.com/BC9A493B41014CAABB98F0471D759707/1/256/${z}/${x}/${y}.png",
                        "http://b.tile.cloudmade.com/BC9A493B41014CAABB98F0471D759707/1/256/${z}/${x}/${y}.png",
                        "http://c.tile.cloudmade.com/BC9A493B41014CAABB98F0471D759707/1/256/${z}/${x}/${y}.png"
                    ],
                    numZoomLevels: 18,
                    attribution: "<a href='http://www.osm.org/'>CC by-sa - OSM</a>", 
                    ref: "cloudmade" 
                },
                {
                    text: OpenLayers.i18n("Germany"),
                    leaf: true,
                    handler: addLayer,
                    url: [
                        "http://a.www.toolserver.org/tiles/germany/${z}/${x}/${y}.png",
                        "http://b.www.toolserver.org/tiles/germany/${z}/${x}/${y}.png",
                        "http://c.www.toolserver.org/tiles/germany/${z}/${x}/${y}.png"
                    ],
                    numZoomLevels: 18,
                    attribution: "<a href='http://www.osm.org/'>CC by-sa - OSM</a>", 
                    ref: "germany" 
                },
                {
                    text: OpenLayers.i18n("Shape-names"),
                    leaf: true,
                    handler: addLayer,
                    url: [
                        "http://a.www.toolserver.org/tiles/shape-names/${z}/${x}/${y}.png",
                        "http://b.www.toolserver.org/tiles/shape-names/${z}/${x}/${y}.png",
                        "http://c.www.toolserver.org/tiles/shape-names/${z}/${x}/${y}.png"
                    ],
                    numZoomLevels: 18,
                    attribution: "<a href='http://www.osm.org/'>CC by-sa - OSM</a>", 
                    ref: "shape" 
                }]
            },
            {
                text: OpenLayers.i18n("Outdoor"),
                expanded: false,
                leaf: false,
                children: [{
                    text: OpenLayers.i18n("OpenCycleMap"),
                    leaf: true,
                    handler: addLayer,
                    url: [
                        "http://a.tile.opencyclemap.org/cycle/${z}/${x}/${y}.png",
                        "http://b.tile.opencyclemap.org/cycle/${z}/${x}/${y}.png",
                        "http://c.tile.opencyclemap.org/cycle/${z}/${x}/${y}.png"
                    ],
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
                    text: OpenLayers.i18n("Hiking"),
                    leaf: true,
                    handler: addLayer,
                    url: "http://toolserver.org/tiles/hikebike/${z}/${x}/${y}.png",
                    numZoomLevels: 18,
                    attribution: "<a href='http://www.osm.org/'>CC by-sa - OSM</a>", 
                    ref: "hiking2" 
                },
                {
                    text: OpenLayers.i18n("Refuge.info"),
                    leaf: true,
                    handler: addLayer,
                    url: "http://maps.refuges.info/tiles/renderer.py/hiking_without_contours/${z}/${x}/${y}.png",
                    numZoomLevels: 18,
                    attribution: "Data by <a href='http://www.osm.org/'>OSM</a>", 
                    ref: "refuge" 
                },
                {
                    text: OpenLayers.i18n("Orientation"),
                    expanded: false,
                    leaf: false,
                    children: [{
                        text: OpenLayers.i18n("Street-O Map"),
                        numZoomLevels: 18,
                        leaf: true,
                        handler: addLayer,
                        url: "http://tiler1.censusprofiler.org/streeto/${z}/${x}/${y}.png",
                        ref: 'streetomap'
                    },
                    {
                        text: OpenLayers.i18n("Pseud-O Map"),
                        numZoomLevels: 18,
                        leaf: true,
                        handler: addLayer,
                        url: "http://tiler1.censusprofiler.org/oterrain/${z}/${x}/${y}.png",
                        ref: 'pseudomap'
                    }]
                }]
            },
            {
                text: OpenLayers.i18n("Public transport"),
                leaf: true,
                handler: addLayer,
                url: "http://tile.xn--pnvkarte-m4a.de/tilegen/${z}/${x}/${y}.png",
                numZoomLevels: 17,
                attribution: "<a href='http://www.osm.org/'>CC by-sa - OSM</a>", 
                ref: "pt" 
            }]
        },
        {
            text: OpenLayers.i18n("Specific"),
            leaf: false,
            expanded: false,
            children: [{
                text: OpenLayers.i18n("ODLB"),
                leaf: true,
                handler: addLayer,
                url: "http://osm.informatik.uni-leipzig.de/osm_tiles2/${z}/${x}/${y}.png",
                numZoomLevels: 18,
                attribution: "<a href='http://www.osm.org/'>CC by-sa - OSM</a>", 
                ref: "odlb" 
            }]
        },
        {
            text: OpenLayers.i18n("Dem"),
            leaf: false,
            expanded: true,
            children: [{
                text: OpenLayers.i18n("Color hill shade"),
                leaf: true,
                handler: addLayer,
                url: "http://map.stephane-brunner.ch/topo/${z}/${x}/${y}.png",
                numZoomLevels: 18,
                attribution: "Data by <a href='ftp://e0srp01u.ecs.nasa.gov/srtm/version2/SRTM3/'>NASA</a>, <a href='http://asterweb.jpl.nasa.gov/gdem.asp'>ASTER</a>, <a href='http://www.gebco.net/'>GEBCO</a> and <a href='http://www.osm.org/'>OSM</a>", 
                ref: "topo" 
            }/*,
            {
                text: OpenLayers.i18n("Contours"),
                leaf: true,
                handler: addLayer,
                url: "http://map.stephane-brunner.ch/contours/${z}/${x}/${y}.png",
                numZoomLevels: 18,
                attribution: "Data by <a href='ftp://e0srp01u.ecs.nasa.gov/srtm/version2/SRTM3/'>NASA</a>, <a href='http://asterweb.jpl.nasa.gov/gdem.asp'>ASTER</a>, <a href='http://www.gebco.net/'>GEBCO</a> and <a href='http://www.osm.org/'>OSM</a>", 
                ref: "cont" 
            }*/,
            {
                text: OpenLayers.i18n("Hill shade"),
                leaf: true,
                handler: addLayer,
                url: "http://toolserver.org/~cmarqu/hill/${z}/${x}/${y}.png",
                numZoomLevels: 16,
                attribution: "Data by <a href='ftp://e0srp01u.ecs.nasa.gov/srtm/version2/SRTM3/'>NASA</a>", 
                ref: "hill" 
            },
            {
                text: OpenLayers.i18n("Relief Refuge.info"),
                leaf: true,
                handler: addLayer,
                url: "http://maps.refuges.info/tiles/renderer.py/relief/${z}/${x}/${y}.jpeg",
                numZoomLevels: 18,
                attribution: "Data by <a href='ftp://e0srp01u.ecs.nasa.gov/srtm/version2/SRTM3/'>NASA</a>", 
                ref: "relief" 
            }]
        },
        {
            text: OpenLayers.i18n("Outdoor"),
            expanded: false,
            leaf: false,
            children: [{
                text: OpenLayers.i18n("Hiking"),
                numZoomLevels: 18,
                leaf: true,
                handler: addLayer,
                url: "http://osm.lonvia.de/hiking/${z}/${x}/${y}.png",
                ref: 'hike'
            },
            {
                text: OpenLayers.i18n("Velo access"),
                numZoomLevels: 18,
                leaf: true,
                handler: addLayer,
                url: [
                    "http://a.www.toolserver.org/tiles/bicycle/${z}/${x}/${y}.png",
                    "http://b.www.toolserver.org/tiles/bicycle/${z}/${x}/${y}.png",
                    "http://c.www.toolserver.org/tiles/bicycle/${z}/${x}/${y}.png"
                ],
                ref: 'bicycle'
            },
            {
                text: OpenLayers.i18n("Montainbike"),
                numZoomLevels: 18,
                leaf: true,
                handler: addLayer,
                url: [
                    "http://a.www.toolserver.org/tiles/mtb-overlay/${z}/${x}/${y}.png",
                    "http://b.www.toolserver.org/tiles/mtb-overlay/${z}/${x}/${y}.png",
                    "http://c.www.toolserver.org/tiles/mtb-overlay/${z}/${x}/${y}.png"
                ],
                ref: 'mtb-overlay'
            },
            {
                text: OpenLayers.i18n("Vector (XAPI)"),
                expanded: false,
                leaf: false,
                children: [{
                    text: OpenLayers.i18n("Peak"),
                    leaf: true,
                    handler: addXapiStyleLayer,
                    style: getHikkingStyle,
                    ref: 'peak',
                    element: 'node',
                    predicate: "natural=peak"
                },
                {
                    text: OpenLayers.i18n("Mountain pass"),
                    leaf: true,
                    handler: addXapiStyleLayer,
                    style: getHikkingStyle,
                    ref: 'pass',
                    element: 'node',
                    predicate: "mountain_pass=yes"
                },
                {
                    text: OpenLayers.i18n("Informations"),
                    leaf: true,
                    handler: addXapiStyleLayer,
                    style: getHikkingStyle,
                    ref: 'info',
                    element: 'node',
                    predicate: "tourism"
                },
                {
                    text: OpenLayers.i18n("Hiking (scale)"),
                    leaf: true,
                    handler: addXapiStyleLayer,
                    style: getHikkingStyle,
                    ref: 'sac',
                    element: 'way',
                    predicate: "sac_scale"
                },
                {
                    text: OpenLayers.i18n("Hiking (path)"),
                    leaf: true,
                    handler: addXapiStyleLayer,
                    style: getHikkingStyle,
                    ref: 'path',
                    element: 'way',
                    predicate: "highway=path"
                },
                {
                    text: OpenLayers.i18n("MTB (scale)"),
                    leaf: true,
                    handler: addXapiStyleLayer,
                    style: getMTBStyle,
                    ref: 'mtbs',
                    element: 'way',
                    predicate: "mtb:scale=*"
                },
                {
                    text: OpenLayers.i18n("MTB (route)"),
                    leaf: true,
                    handler: addXapiStyleLayer,
                    style: getMTBStyle,
                    ref: 'mtbr',
                    element: 'relation',
                    predicate: "route=mtb"
                },
                {
                    text: OpenLayers.i18n("Bicycle"),
                    leaf: true,
                    handler: addXapiStyleLayer,
                    style: getMTBStyle,
                    ref: 'velo',
                    element: 'relation',
                    predicate: "route=bicycle"
                },
                {
                    text: OpenLayers.i18n("Sled"),
                    leaf: true,
                    handler: addXapiStyleLayer,
                    style: getSledStyle,
                    ref: 'sled',
                    element: 'way',
                    predicate: "piste:type=sled"
                },
                {
                    text: OpenLayers.i18n("Snows shoe"),
                    leaf: true,
                    handler: addXapiStyleLayer,
                    style: getSnowShoeStyle,
                    ref: 'xx',
                    element: 'relation',
                    predicate: "route=snowshoe"
                },
                {
                    text: OpenLayers.i18n("Nordic"),
                    leaf: true,
                    handler: addXapiStyleLayer,
                    style: getNordicStyle,
                    ref: 'nordic',
                    element: 'way',
                    predicate: "piste:type=nordic"
                },
                {
                    text: OpenLayers.i18n("Down hill"),
                    leaf: true,
                    handler: addXapiStyleLayer,
                    style: getSkyStyle,
                    ref: 'dh',
                    element: 'way',
                    predicate: "piste:type=downhill"
                },
                {
                    text: OpenLayers.i18n("Winter Walks"),
                    leaf: true,
                    handler: addXapiStyleLayer,
                    style: getWinterWalksStyle,
                    ref: 'ww',
                    element: 'relation',
                    predicate: "route=winterwalks"
                },
                {
                    text: OpenLayers.i18n("Fitness trail"),
                    leaf: true,
                    handler: addXapiStyleLayer,
                    style: getHikkingStyle,
                    ref: 'ft',
                    element: 'relation',
                    predicate: "route=fitness_trail"
                }]
            }]
        },
        {
            text: OpenLayers.i18n("Utils"),
            leaf: false,
            children: [{
                text: OpenLayers.i18n("Max (XAPI)"),
                leaf: false,
                children: [{
                    text: OpenLayers.i18n("Speed"),
                    leaf: true,
                    handler: addXapiStyleLayer,
                    style: getMaxSpeedStyle,
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
            },
            {
                text: OpenLayers.i18n("Lignting"),
                leaf: true,
                handler: addLayer,
                url: [
                    "http://a.www.toolserver.org/tiles/lighting/${z}/${x}/${y}.png",
                    "http://b.www.toolserver.org/tiles/lighting/${z}/${x}/${y}.png",
                    "http://c.www.toolserver.org/tiles/lighting/${z}/${x}/${y}.png"
                ],
                numZoomLevels: 16,
                attribution: "<a href='http://www.openstreetmap.org/'>CC-BY-SA OpenStreetMap &amp; Contributors</a>",
                ref: 'lignt'
            },
            {
                text: OpenLayers.i18n("Surveillance"),
                leaf: true,
                handler: addLayer,
                url: [
                    "http://a.www.toolserver.org/tiles/surveillance/${z}/${x}/${y}.png",
                    "http://b.www.toolserver.org/tiles/surveillance/${z}/${x}/${y}.png",
                    "http://c.www.toolserver.org/tiles/surveillance/${z}/${x}/${y}.png"
                ],
                numZoomLevels: 18,
                attribution: "<a href='http://www.openstreetmap.org/'>CC-BY-SA OpenStreetMap &amp; Contributors</a>",
                ref: 'surveillance'
            }]
        },
        {
            text: OpenLayers.i18n("Debug"),
            leaf: false,
            children: [{
                text: OpenLayers.i18n("CloudMade nonames"),
                leaf: true,
                handler: addLayer,
                url: [
                    "http://a.tile.cloudmade.com/D563D910896D4B67B22BC1088920C483/3/256/${z}/${x}/${y}.png",
                    "http://b.tile.cloudmade.com/D563D910896D4B67B22BC1088920C483/3/256/${z}/${x}/${y}.png"
                ],
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
                text: OpenLayers.i18n("Cloudmade navdebug"),
                leaf: true,
                handler: addLayer,
                url: "http://ec2-184-73-15-218.compute-1.amazonaws.com/6700/256/${z}/${x}/${y}.png",
                numZoomLevels: 18,
                attribution: "<a href='http://www.osm.org/'>CC by-sa - OSM</a>", 
                ref: "navdebug"
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
        {
            text: OpenLayers.i18n("Localized (Wikipedia)"),
            leaf: false,
            children: wikipediam
        },
        brutes]
    };
        
    return root;
}
