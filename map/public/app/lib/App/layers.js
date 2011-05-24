/**
 * Copyright (c) 2010-2011 The Open Source Geospatial Foundation
 * 
 * Published under the BSD license.
 * See http://svn.geoext.org/core/trunk/geoext/license.txt for the full text
 * of the license.
 */

/*
 * @include App/style.js
 * @include App/utils-mobile.js
 * 
 * @include OpenLayers/Protocol/XAPI.js
 * @include OpenLayers/Protocol/OSMAPI.js
 * 
 * @include OpenLayers/Strategy/Fixed.js
 * @include OpenLayers/Strategy/BBOX.js
 * @include OpenLayers/Protocol/HTTP.js
 * 
 * @include OpenLayers/Layer/Vector.js
 * @include OpenLayers/Layer/XYZ.js
 * @include OpenLayers/Layer/WMS.js
 * @include OpenLayers/Format/OSM.js
 */
function getLayersTree(map) {
    var brutes = {
        text: OpenLayers.i18n("Raw (XAPI)"),
        leaf: false,
        children: [],
        tags: "xapi"
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
        children: wikipedia,
        tags: ""
    });

            
    var root = {
		text: OpenLayers.i18n("All layers"),
        tags: "",
        expanded: true,
        children: [{
            text: OpenLayers.i18n("Base Layers"),
            tags: OpenLayers.i18n("Base"),
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
                },
                {
                    text: OpenLayers.i18n("OSM-WMS"),
                    leaf: true,
                    ref: "osm-wms",
                    handler: addWmsLayer,
                    url: 'http://129.206.229.158/cached/osm',
                    attribution: "<a href='http://www.osm.org/'>CC by-sa - OSM</a>",
                    layers: 'osm_auto'
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
            },
            {
                text: OpenLayers.i18n("Public Transport Lines"),
                leaf: true,
                handler: addLayer,
                url: "http://openptmap.de/tiles/${z}/${x}/${y}.png",
                numZoomLevels: 15,
                attribution: "<a href='http://www.osm.org/'>CC by-sa - OSM</a>", 
                ref: "ptl" 
            },
            {
                text: OpenLayers.i18n("Trolley Bus (XAPI)"),
                leaf: true,
                handler: addXapiStyleLayer,
                style: getBusStyle,
                ref: 'bus',
                element: 'relation',
                predicate: "route=trolleybus"
            },
            {
                text: OpenLayers.i18n("OpenSeaMap"),
                leaf: true,
                handler: addLayer,
                url: "http://tiles.openseamap.org/seamark/${z}/${x}/${y}.png",
                numZoomLevels: 18,
                attribution: "Data by <a href='http://www.osm.org/'>OSM</a>", 
                ref: "openseamap" 
            }
            ]
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
            },
            {
                text: OpenLayers.i18n("Historic"),
                leaf: true,
                ref: "osm-wms",
                handler: addWmsLayer,
                url: 'http://129.206.229.158/histosm-wms',
                attribution: "<a href='http://www.osm.org/'>CC by-sa - OSM</a>", 
                layers: 'osm_auto:histosm_points'
            }]
        },
        {
            text: OpenLayers.i18n("Dem"),
            tags: OpenLayers.i18n("dem srtm"),
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
                text: OpenLayers.i18n("Contours"),
                leaf: true,
                ref: "cont",
                handler: addWmsLayer,
                url: "http://map.stephane-brunner.ch/contours/${z}/${x}/${y}.png",
                attribution: "Data by <a href='ftp://e0srp01u.ecs.nasa.gov/srtm/version2/SRTM3/'>NASA</a>", 
                layers: '' 
            },
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
            },
            {
                text: OpenLayers.i18n("Hillshade of Europe"),
                leaf: true,
                ref: "osm-wms",
                handler: addWmsLayer,
                url: 'http://129.206.229.158/cached/hillshade',
                attribution: "<a href='http://www.osm.org/'>CC by-sa - OSM</a>",
                layers: 'europe_wms:hs_srtm_europa'
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
            text: OpenLayers.i18n("Orthophotos"),
            leaf: false,
            children: [{
                text: OpenLayers.i18n("Landsat"),
                leaf: true,
                handler: addWmsLayer,
                ref: 'landsat',
                url: 'http://onearth.jpl.nasa.gov/wms.cgi',
                layers: 'global_mosaic',
                attribution: 'Landsat'
            }, {
                text: OpenLayers.i18n("Landsat (mirror)"),
                leaf: true,
                handler: addWmsLayer,
                ref: 'landsatmir',
                url: 'http://irs.gis-lab.info/',
                layers: 'landsat',
                attribution: 'Landsat'
            }, {
                text: OpenLayers.i18n("Lausanne"),
                leaf: true,
                handler: addWmsLayer,
                ref: 'lausanne',
                url: 'http://plan.epfl.ch/lausanne-epfl-osm',
                layers: 'lausanne',
                attribution: "<a href='http://wiki.openstreetmap.org/wiki/Lausanne'>Orthophoto Ville de Lausanne 2008</a>"
            }, {
                text: OpenLayers.i18n("EPFL"),
                leaf: true,
                handler: addWmsLayer,
                ref: 'epfl',
                url: 'http://plan.epfl.ch/lausanne-epfl-osm',
                layers: 'epfl',
                attribution: "<a href='http://wiki.openstreetmap.org/wiki/EPFL_WMS'>plan.epfl.ch Orthophoto 2009</a>"
            }, {
                text: OpenLayers.i18n("EPFL plan"),
                leaf: true,
                handler: addWmsLayer,
                ref: 'epflplan',
                url: 'http://plan.epfl.ch/wms',
                layers: 'epfl_surface,unil_surface,circulation2,surface_foret,unil_batiments',
                attribution: "<a href='http://wiki.openstreetmap.org/wiki/EPFL_WMS'>plan.epfl.ch</a>"
            }/*, {
                text: OpenLayers.i18n("Genf"),
                leaf: true,
                handler: addWmsLayer,
                ref: 'genf',
                url: 'http://etat.geneve.ch/ags2/services/Orthophotos_2005/MapServer/WMSServer',
                layers: '0',
                attribution: "<a href='http://wiki.openstreetmap.org/wiki/SITG_WMS'>Orthophotos du SITG 2005 (Système d'Information du Territoire Genevois)</a>"
            }*/, {
                text: OpenLayers.i18n("Yverdon"),
                leaf: true,
                handler: addWmsLayer,
                ref: 'yverdon',
                url: 'http://ogc.heig-vd.ch/mapserver/wms',
                layers: 'orthophoto_yverdon',
                attribution: "<a href='http://wiki.openstreetmap.org/wiki/HEIG-VD_WMS'>Orthophoto Yverdon 2007 / HEIG-VD</a>"
            }, {
                text: OpenLayers.i18n("Yverdon cessnov"),
                leaf: true,
                handler: addWmsLayer,
                ref: 'yverdoncessnov',
                url: 'http://ogc.heig-vd.ch/mapserver/wms',
                layers: 'r-pod_yverdon_cessnov',
                attribution: "<a href='http://wiki.openstreetmap.org/wiki/HEIG-VD_WMS'>Orthophoto Yverdon 2010 / R-Pod @ HEIG-VD</a>"
            }, {
                text: OpenLayers.i18n("Yverdon Y-Parc"),
                leaf: true,
                handler: addWmsLayer,
                ref: 'yverdonyparc',
                url: 'http://ogc.heig-vd.ch/mapserver/wms',
                layers: 'r-pod_yverdon_y-parc',
                attribution: "<a href='http://wiki.openstreetmap.org/wiki/HEIG-VD_WMS'>Orthophoto Yverdon 2010 / R-Pod @ HEIG-VD</a>"
            }, {
                text: OpenLayers.i18n("Yverdon Bellevue"),
                leaf: true,
                handler: addWmsLayer,
                ref: 'yverdonbellevue',
                url: 'http://ogc.heig-vd.ch/mapserver/wms',
                layers: 'r-pod_yverdon_bellevue',
                attribution: "<a href='http://wiki.openstreetmap.org/wiki/HEIG-VD_WMS'>Orthophoto Yverdon 2010 / R-Pod @ HEIG-VD</a>"
            }/*, {
                text: OpenLayers.i18n("Neuchatel"),
                leaf: true,
                handler: addWmsLayer,
                ref: 'neuchatel',
                url: 'http://sitn.ne.ch/ogc-sitn-open/wms',
                layers: 'ortho',
                attribution: "<a href='http://wiki.openstreetmap.org/wiki/SITN_WMS'>orthophotos2006sitn50cm</a>"
            }*/, {
                text: OpenLayers.i18n("Jura"),
                leaf: true,
                handler: addWmsLayer,
                ref: 'jura',
                url: 'http://sitn.ne.ch/ogc-sitj-ortho/wms',
                layers: 'ortho1998',
                attribution: "<a href='http://wiki.openstreetmap.org/wiki/Switzerland:Jura'>Orthophotos 1998 RCJU 50cm</a>"
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
                text: OpenLayers.i18n("ITO"),
                leaf: false,
                children: [{
                    text: OpenLayers.i18n("Barriers"),
                    leaf: true,
                    handler: addLayer,
                    numZoomLevels: 18,
                    ref: "ito-barriers",
                    attribution: "<a href='http://www.osm.org/'>CC by-sa - OSM</a> -- tiles from <a href='http://www.itoworld.com/product/data/ito_map/'>ITO</a>",
                    url: ['http://t0.itoworld.com/osm_script/wms?TILE=${z}/${x}/${y}&LAYERS=49&STYLES=&SRS=EPSG:900913&FORMAT=image%2Fpng&TRANSPARENT=on&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&WIDTH=256&HEIGHT=256',
                        'http://t0.itoworld.com/osm_script/wms?TILE=${z}/${x}/${y}&LAYERS=49&STYLES=&SRS=EPSG:900913&FORMAT=image%2Fpng&TRANSPARENT=on&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&WIDTH=256&HEIGHT=256',
                        'http://t0.itoworld.com/osm_script/wms?TILE=${z}/${x}/${y}&LAYERS=49&STYLES=&SRS=EPSG:900913&FORMAT=image%2Fpng&TRANSPARENT=on&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&WIDTH=256&HEIGHT=256',
                        'http://t0.itoworld.com/osm_script/wms?TILE=${z}/${x}/${y}&LAYERS=49&STYLES=&SRS=EPSG:900913&FORMAT=image%2Fpng&TRANSPARENT=on&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&WIDTH=256&HEIGHT=256']
                },
                {
                    text: OpenLayers.i18n("Building heights"),
                    leaf: true,
                    handler: addLayer,
                    numZoomLevels: 18,
                    ref: "ito-bh",
                    attribution: "<a href='http://www.osm.org/'>CC by-sa - OSM</a> -- tiles from <a href='http://www.itoworld.com/product/data/ito_map/'>ITO</a>",
                    url: ['http://t0.itoworld.com/osm_script/wms?TILE=${z}/${x}/${y}&LAYERS=85&STYLES=&SRS=EPSG:900913&FORMAT=image%2Fpng&TRANSPARENT=on&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&WIDTH=256&HEIGHT=256',
                        'http://t0.itoworld.com/osm_script/wms?TILE=${z}/${x}/${y}&LAYERS=85&STYLES=&SRS=EPSG:900913&FORMAT=image%2Fpng&TRANSPARENT=on&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&WIDTH=256&HEIGHT=256',
                        'http://t0.itoworld.com/osm_script/wms?TILE=${z}/${x}/${y}&LAYERS=85&STYLES=&SRS=EPSG:900913&FORMAT=image%2Fpng&TRANSPARENT=on&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&WIDTH=256&HEIGHT=256',
                        'http://t0.itoworld.com/osm_script/wms?TILE=${z}/${x}/${y}&LAYERS=85&STYLES=&SRS=EPSG:900913&FORMAT=image%2Fpng&TRANSPARENT=on&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&WIDTH=256&HEIGHT=256']
                },
                {
                    text: OpenLayers.i18n("Buildings and addresses"),
                    leaf: true,
                    handler: addLayer,
                    numZoomLevels: 18,
                    ref: "ito-ba",
                    attribution: "<a href='http://www.osm.org/'>CC by-sa - OSM</a> -- tiles from <a href='http://www.itoworld.com/product/data/ito_map/'>ITO</a>",
                    url: ['http://t0.itoworld.com/osm_script/wms?TILE=${z}/${x}/${y}&LAYERS=9&STYLES=&SRS=EPSG:900913&FORMAT=image%2Fpng&TRANSPARENT=on&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&WIDTH=256&HEIGHT=256',
                        'http://t0.itoworld.com/osm_script/wms?TILE=${z}/${x}/${y}&LAYERS=9&STYLES=&SRS=EPSG:900913&FORMAT=image%2Fpng&TRANSPARENT=on&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&WIDTH=256&HEIGHT=256',
                        'http://t0.itoworld.com/osm_script/wms?TILE=${z}/${x}/${y}&LAYERS=9&STYLES=&SRS=EPSG:900913&FORMAT=image%2Fpng&TRANSPARENT=on&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&WIDTH=256&HEIGHT=256',
                        'http://t0.itoworld.com/osm_script/wms?TILE=${z}/${x}/${y}&LAYERS=9&STYLES=&SRS=EPSG:900913&FORMAT=image%2Fpng&TRANSPARENT=on&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&WIDTH=256&HEIGHT=256']
                },
                {
                    text: OpenLayers.i18n("Car parks"),
                    leaf: true,
                    handler: addLayer,
                    numZoomLevels: 18,
                    ref: "ito-cp",
                    attribution: "<a href='http://www.osm.org/'>CC by-sa - OSM</a> -- tiles from <a href='http://www.itoworld.com/product/data/ito_map/'>ITO</a>",
                    url: ['http://t0.itoworld.com/osm_script/wms?TILE=${z}/${x}/${y}&LAYERS=7&STYLES=&SRS=EPSG:900913&FORMAT=image%2Fpng&TRANSPARENT=on&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&WIDTH=256&HEIGHT=256',
                        'http://t0.itoworld.com/osm_script/wms?TILE=${z}/${x}/${y}&LAYERS=7&STYLES=&SRS=EPSG:900913&FORMAT=image%2Fpng&TRANSPARENT=on&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&WIDTH=256&HEIGHT=256',
                        'http://t0.itoworld.com/osm_script/wms?TILE=${z}/${x}/${y}&LAYERS=7&STYLES=&SRS=EPSG:900913&FORMAT=image%2Fpng&TRANSPARENT=on&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&WIDTH=256&HEIGHT=256',
                        'http://t0.itoworld.com/osm_script/wms?TILE=${z}/${x}/${y}&LAYERS=7&STYLES=&SRS=EPSG:900913&FORMAT=image%2Fpng&TRANSPARENT=on&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&WIDTH=256&HEIGHT=256']
                },
                {
                    text: OpenLayers.i18n("Electricity"),
                    leaf: true,
                    handler: addLayer,
                    numZoomLevels: 18,
                    ref: "ito-elec",
                    attribution: "<a href='http://www.osm.org/'>CC by-sa - OSM</a> -- tiles from <a href='http://www.itoworld.com/product/data/ito_map/'>ITO</a>",
                    url: ['http://t0.itoworld.com/osm_script/wms?TILE=${z}/${x}/${y}&LAYERS=4&STYLES=&SRS=EPSG:900913&FORMAT=image%2Fpng&TRANSPARENT=on&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&WIDTH=256&HEIGHT=256',
                        'http://t0.itoworld.com/osm_script/wms?TILE=${z}/${x}/${y}&LAYERS=4&STYLES=&SRS=EPSG:900913&FORMAT=image%2Fpng&TRANSPARENT=on&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&WIDTH=256&HEIGHT=256',
                        'http://t0.itoworld.com/osm_script/wms?TILE=${z}/${x}/${y}&LAYERS=4&STYLES=&SRS=EPSG:900913&FORMAT=image%2Fpng&TRANSPARENT=on&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&WIDTH=256&HEIGHT=256',
                        'http://t0.itoworld.com/osm_script/wms?TILE=${z}/${x}/${y}&LAYERS=4&STYLES=&SRS=EPSG:900913&FORMAT=image%2Fpng&TRANSPARENT=on&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&WIDTH=256&HEIGHT=256']
                },
                {
                    text: OpenLayers.i18n("FIXME"),
                    leaf: true,
                    handler: addLayer,
                    numZoomLevels: 18,
                    ref: "ito-fixme",
                    attribution: "<a href='http://www.osm.org/'>CC by-sa - OSM</a> -- tiles from <a href='http://www.itoworld.com/product/data/ito_map/'>ITO</a>",
                    url: ['http://t0.itoworld.com/osm_script/wms?TILE=${z}/${x}/${y}&LAYERS=12&STYLES=&SRS=EPSG:900913&FORMAT=image%2Fpng&TRANSPARENT=on&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&WIDTH=256&HEIGHT=256',
                        'http://t0.itoworld.com/osm_script/wms?TILE=${z}/${x}/${y}&LAYERS=12&STYLES=&SRS=EPSG:900913&FORMAT=image%2Fpng&TRANSPARENT=on&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&WIDTH=256&HEIGHT=256',
                        'http://t0.itoworld.com/osm_script/wms?TILE=${z}/${x}/${y}&LAYERS=12&STYLES=&SRS=EPSG:900913&FORMAT=image%2Fpng&TRANSPARENT=on&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&WIDTH=256&HEIGHT=256',
                        'http://t0.itoworld.com/osm_script/wms?TILE=${z}/${x}/${y}&LAYERS=12&STYLES=&SRS=EPSG:900913&FORMAT=image%2Fpng&TRANSPARENT=on&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&WIDTH=256&HEIGHT=256']
                },
                {
                    text: OpenLayers.i18n("Former railways"),
                    leaf: true,
                    handler: addLayer,
                    numZoomLevels: 18,
                    ref: "ito-fora",
                    attribution: "<a href='http://www.osm.org/'>CC by-sa - OSM</a> -- tiles from <a href='http://www.itoworld.com/product/data/ito_map/'>ITO</a>",
                    url: ['http://t0.itoworld.com/osm_script/wms?TILE=${z}/${x}/${y}&LAYERS=26&STYLES=&SRS=EPSG:900913&FORMAT=image%2Fpng&TRANSPARENT=on&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&WIDTH=256&HEIGHT=256',
                        'http://t0.itoworld.com/osm_script/wms?TILE=${z}/${x}/${y}&LAYERS=26&STYLES=&SRS=EPSG:900913&FORMAT=image%2Fpng&TRANSPARENT=on&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&WIDTH=256&HEIGHT=256',
                        'http://t0.itoworld.com/osm_script/wms?TILE=${z}/${x}/${y}&LAYERS=26&STYLES=&SRS=EPSG:900913&FORMAT=image%2Fpng&TRANSPARENT=on&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&WIDTH=256&HEIGHT=256',
                        'http://t0.itoworld.com/osm_script/wms?TILE=${z}/${x}/${y}&LAYERS=26&STYLES=&SRS=EPSG:900913&FORMAT=image%2Fpng&TRANSPARENT=on&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&WIDTH=256&HEIGHT=256']
                },
                {
                    text: OpenLayers.i18n("Highway lanes"),
                    leaf: true,
                    handler: addLayer,
                    numZoomLevels: 18,
                    ref: "ito-hila",
                    attribution: "<a href='http://www.osm.org/'>CC by-sa - OSM</a> -- tiles from <a href='http://www.itoworld.com/product/data/ito_map/'>ITO</a>",
                    url: ['http://t0.itoworld.com/osm_script/wms?TILE=${z}/${x}/${y}&LAYERS=56&STYLES=&SRS=EPSG:900913&FORMAT=image%2Fpng&TRANSPARENT=on&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&WIDTH=256&HEIGHT=256',
                        'http://t0.itoworld.com/osm_script/wms?TILE=${z}/${x}/${y}&LAYERS=56&STYLES=&SRS=EPSG:900913&FORMAT=image%2Fpng&TRANSPARENT=on&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&WIDTH=256&HEIGHT=256',
                        'http://t0.itoworld.com/osm_script/wms?TILE=${z}/${x}/${y}&LAYERS=56&STYLES=&SRS=EPSG:900913&FORMAT=image%2Fpng&TRANSPARENT=on&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&WIDTH=256&HEIGHT=256',
                        'http://t0.itoworld.com/osm_script/wms?TILE=${z}/${x}/${y}&LAYERS=56&STYLES=&SRS=EPSG:900913&FORMAT=image%2Fpng&TRANSPARENT=on&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&WIDTH=256&HEIGHT=256']
                },
                {
                    text: OpenLayers.i18n("Highway lighting"),
                    leaf: true,
                    handler: addLayer,
                    numZoomLevels: 18,
                    ref: "ito-hili",
                    attribution: "<a href='http://www.osm.org/'>CC by-sa - OSM</a> -- tiles from <a href='http://www.itoworld.com/product/data/ito_map/'>ITO</a>",
                    url: ['http://t0.itoworld.com/osm_script/wms?TILE=${z}/${x}/${y}&LAYERS=69&STYLES=&SRS=EPSG:900913&FORMAT=image%2Fpng&TRANSPARENT=on&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&WIDTH=256&HEIGHT=256',
                        'http://t0.itoworld.com/osm_script/wms?TILE=${z}/${x}/${y}&LAYERS=69&STYLES=&SRS=EPSG:900913&FORMAT=image%2Fpng&TRANSPARENT=on&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&WIDTH=256&HEIGHT=256',
                        'http://t0.itoworld.com/osm_script/wms?TILE=${z}/${x}/${y}&LAYERS=69&STYLES=&SRS=EPSG:900913&FORMAT=image%2Fpng&TRANSPARENT=on&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&WIDTH=256&HEIGHT=256',
                        'http://t0.itoworld.com/osm_script/wms?TILE=${z}/${x}/${y}&LAYERS=69&STYLES=&SRS=EPSG:900913&FORMAT=image%2Fpng&TRANSPARENT=on&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&WIDTH=256&HEIGHT=256']
                },
                {
                    text: OpenLayers.i18n("Layers"),
                    leaf: true,
                    handler: addLayer,
                    numZoomLevels: 18,
                    ref: "ito-layers",
                    attribution: "<a href='http://www.osm.org/'>CC by-sa - OSM</a> -- tiles from <a href='http://www.itoworld.com/product/data/ito_map/'>ITO</a>",
                    url: ['http://t0.itoworld.com/osm_script/wms?TILE=${z}/${x}/${y}&LAYERS=22&STYLES=&SRS=EPSG:900913&FORMAT=image%2Fpng&TRANSPARENT=on&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&WIDTH=256&HEIGHT=256',
                        'http://t0.itoworld.com/osm_script/wms?TILE=${z}/${x}/${y}&LAYERS=22&STYLES=&SRS=EPSG:900913&FORMAT=image%2Fpng&TRANSPARENT=on&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&WIDTH=256&HEIGHT=256',
                        'http://t0.itoworld.com/osm_script/wms?TILE=${z}/${x}/${y}&LAYERS=22&STYLES=&SRS=EPSG:900913&FORMAT=image%2Fpng&TRANSPARENT=on&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&WIDTH=256&HEIGHT=256',
                        'http://t0.itoworld.com/osm_script/wms?TILE=${z}/${x}/${y}&LAYERS=22&STYLES=&SRS=EPSG:900913&FORMAT=image%2Fpng&TRANSPARENT=on&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&WIDTH=256&HEIGHT=256']
                },
                {
                    text: OpenLayers.i18n("Metro"),
                    leaf: true,
                    handler: addLayer,
                    numZoomLevels: 18,
                    ref: "ito-metro",
                    attribution: "<a href='http://www.osm.org/'>CC by-sa - OSM</a> -- tiles from <a href='http://www.itoworld.com/product/data/ito_map/'>ITO</a>",
                    url: ['http://t0.itoworld.com/osm_script/wms?TILE=${z}/${x}/${y}&LAYERS=18&STYLES=&SRS=EPSG:900913&FORMAT=image%2Fpng&TRANSPARENT=on&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&WIDTH=256&HEIGHT=256',
                        'http://t0.itoworld.com/osm_script/wms?TILE=${z}/${x}/${y}&LAYERS=18&STYLES=&SRS=EPSG:900913&FORMAT=image%2Fpng&TRANSPARENT=on&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&WIDTH=256&HEIGHT=256',
                        'http://t0.itoworld.com/osm_script/wms?TILE=${z}/${x}/${y}&LAYERS=18&STYLES=&SRS=EPSG:900913&FORMAT=image%2Fpng&TRANSPARENT=on&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&WIDTH=256&HEIGHT=256',
                        'http://t0.itoworld.com/osm_script/wms?TILE=${z}/${x}/${y}&LAYERS=18&STYLES=&SRS=EPSG:900913&FORMAT=image%2Fpng&TRANSPARENT=on&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&WIDTH=256&HEIGHT=256']
                },
                {
                    text: OpenLayers.i18n("Navigable waterways"),
                    leaf: true,
                    handler: addLayer,
                    numZoomLevels: 18,
                    ref: "ito-navwa",
                    attribution: "<a href='http://www.osm.org/'>CC by-sa - OSM</a> -- tiles from <a href='http://www.itoworld.com/product/data/ito_map/'>ITO</a>",
                    url: ['http://t0.itoworld.com/osm_script/wms?TILE=${z}/${x}/${y}&LAYERS=24&STYLES=&SRS=EPSG:900913&FORMAT=image%2Fpng&TRANSPARENT=on&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&WIDTH=256&HEIGHT=256',
                        'http://t0.itoworld.com/osm_script/wms?TILE=${z}/${x}/${y}&LAYERS=24&STYLES=&SRS=EPSG:900913&FORMAT=image%2Fpng&TRANSPARENT=on&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&WIDTH=256&HEIGHT=256',
                        'http://t0.itoworld.com/osm_script/wms?TILE=${z}/${x}/${y}&LAYERS=24&STYLES=&SRS=EPSG:900913&FORMAT=image%2Fpng&TRANSPARENT=on&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&WIDTH=256&HEIGHT=256',
                        'http://t0.itoworld.com/osm_script/wms?TILE=${z}/${x}/${y}&LAYERS=24&STYLES=&SRS=EPSG:900913&FORMAT=image%2Fpng&TRANSPARENT=on&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&WIDTH=256&HEIGHT=256']
                },
                {
                    text: OpenLayers.i18n("Railway electrification"),
                    leaf: true,
                    handler: addLayer,
                    numZoomLevels: 18,
                    ref: "ito-raelec",
                    attribution: "<a href='http://www.osm.org/'>CC by-sa - OSM</a> -- tiles from <a href='http://www.itoworld.com/product/data/ito_map/'>ITO</a>",
                    url: ['http://t0.itoworld.com/osm_script/wms?TILE=${z}/${x}/${y}&LAYERS=68&STYLES=&SRS=EPSG:900913&FORMAT=image%2Fpng&TRANSPARENT=on&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&WIDTH=256&HEIGHT=256',
                        'http://t0.itoworld.com/osm_script/wms?TILE=${z}/${x}/${y}&LAYERS=68&STYLES=&SRS=EPSG:900913&FORMAT=image%2Fpng&TRANSPARENT=on&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&WIDTH=256&HEIGHT=256',
                        'http://t0.itoworld.com/osm_script/wms?TILE=${z}/${x}/${y}&LAYERS=68&STYLES=&SRS=EPSG:900913&FORMAT=image%2Fpng&TRANSPARENT=on&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&WIDTH=256&HEIGHT=256',
                        'http://t0.itoworld.com/osm_script/wms?TILE=${z}/${x}/${y}&LAYERS=68&STYLES=&SRS=EPSG:900913&FORMAT=image%2Fpng&TRANSPARENT=on&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&WIDTH=256&HEIGHT=256']
                },
                {
                    text: OpenLayers.i18n("Railway engineering"),
                    leaf: true,
                    handler: addLayer,
                    numZoomLevels: 18,
                    ref: "ito-raeng",
                    attribution: "<a href='http://www.osm.org/'>CC by-sa - OSM</a> -- tiles from <a href='http://www.itoworld.com/product/data/ito_map/'>ITO</a>",
                    url: ['http://t0.itoworld.com/osm_script/wms?TILE=${z}/${x}/${y}&LAYERS=55&STYLES=&SRS=EPSG:900913&FORMAT=image%2Fpng&TRANSPARENT=on&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&WIDTH=256&HEIGHT=256',
                        'http://t0.itoworld.com/osm_script/wms?TILE=${z}/${x}/${y}&LAYERS=55&STYLES=&SRS=EPSG:900913&FORMAT=image%2Fpng&TRANSPARENT=on&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&WIDTH=256&HEIGHT=256',
                        'http://t0.itoworld.com/osm_script/wms?TILE=${z}/${x}/${y}&LAYERS=55&STYLES=&SRS=EPSG:900913&FORMAT=image%2Fpng&TRANSPARENT=on&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&WIDTH=256&HEIGHT=256',
                        'http://t0.itoworld.com/osm_script/wms?TILE=${z}/${x}/${y}&LAYERS=55&STYLES=&SRS=EPSG:900913&FORMAT=image%2Fpng&TRANSPARENT=on&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&WIDTH=256&HEIGHT=256']
                },
                {
                    text: OpenLayers.i18n("Railway freight"),
                    leaf: true,
                    handler: addLayer,
                    numZoomLevels: 18,
                    ref: "ito-rafrei",
                    attribution: "<a href='http://www.osm.org/'>CC by-sa - OSM</a> -- tiles from <a href='http://www.itoworld.com/product/data/ito_map/'>ITO</a>",
                    url: ['http://t0.itoworld.com/osm_script/wms?TILE=${z}/${x}/${y}&LAYERS=71&STYLES=&SRS=EPSG:900913&FORMAT=image%2Fpng&TRANSPARENT=on&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&WIDTH=256&HEIGHT=256',
                        'http://t0.itoworld.com/osm_script/wms?TILE=${z}/${x}/${y}&LAYERS=71&STYLES=&SRS=EPSG:900913&FORMAT=image%2Fpng&TRANSPARENT=on&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&WIDTH=256&HEIGHT=256',
                        'http://t0.itoworld.com/osm_script/wms?TILE=${z}/${x}/${y}&LAYERS=71&STYLES=&SRS=EPSG:900913&FORMAT=image%2Fpng&TRANSPARENT=on&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&WIDTH=256&HEIGHT=256',
                        'http://t0.itoworld.com/osm_script/wms?TILE=${z}/${x}/${y}&LAYERS=71&STYLES=&SRS=EPSG:900913&FORMAT=image%2Fpng&TRANSPARENT=on&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&WIDTH=256&HEIGHT=256']
                },
                {
                    text: OpenLayers.i18n("Railway stations"),
                    leaf: true,
                    handler: addLayer,
                    numZoomLevels: 18,
                    ref: "ito-rasta",
                    attribution: "<a href='http://www.osm.org/'>CC by-sa - OSM</a> -- tiles from <a href='http://www.itoworld.com/product/data/ito_map/'>ITO</a>",
                    url: ['http://t0.itoworld.com/osm_script/wms?TILE=${z}/${x}/${y}&LAYERS=79&STYLES=&SRS=EPSG:900913&FORMAT=image%2Fpng&TRANSPARENT=on&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&WIDTH=256&HEIGHT=256',
                        'http://t0.itoworld.com/osm_script/wms?TILE=${z}/${x}/${y}&LAYERS=79&STYLES=&SRS=EPSG:900913&FORMAT=image%2Fpng&TRANSPARENT=on&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&WIDTH=256&HEIGHT=256',
                        'http://t0.itoworld.com/osm_script/wms?TILE=${z}/${x}/${y}&LAYERS=79&STYLES=&SRS=EPSG:900913&FORMAT=image%2Fpng&TRANSPARENT=on&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&WIDTH=256&HEIGHT=256',
                        'http://t0.itoworld.com/osm_script/wms?TILE=${z}/${x}/${y}&LAYERS=79&STYLES=&SRS=EPSG:900913&FORMAT=image%2Fpng&TRANSPARENT=on&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&WIDTH=256&HEIGHT=256']
                },
                {
                    text: OpenLayers.i18n("Railway tracks"),
                    leaf: true,
                    handler: addLayer,
                    numZoomLevels: 18,
                    ref: "ito-ratra",
                    attribution: "<a href='http://www.osm.org/'>CC by-sa - OSM</a> -- tiles from <a href='http://www.itoworld.com/product/data/ito_map/'>ITO</a>",
                    url: ['http://t0.itoworld.com/osm_script/wms?TILE=${z}/${x}/${y}&LAYERS=14&STYLES=&SRS=EPSG:900913&FORMAT=image%2Fpng&TRANSPARENT=on&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&WIDTH=256&HEIGHT=256',
                        'http://t0.itoworld.com/osm_script/wms?TILE=${z}/${x}/${y}&LAYERS=14&STYLES=&SRS=EPSG:900913&FORMAT=image%2Fpng&TRANSPARENT=on&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&WIDTH=256&HEIGHT=256',
                        'http://t0.itoworld.com/osm_script/wms?TILE=${z}/${x}/${y}&LAYERS=14&STYLES=&SRS=EPSG:900913&FORMAT=image%2Fpng&TRANSPARENT=on&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&WIDTH=256&HEIGHT=256',
                        'http://t0.itoworld.com/osm_script/wms?TILE=${z}/${x}/${y}&LAYERS=14&STYLES=&SRS=EPSG:900913&FORMAT=image%2Fpng&TRANSPARENT=on&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&WIDTH=256&HEIGHT=256']
                },
                {
                    text: OpenLayers.i18n("Railways"),
                    leaf: true,
                    handler: addLayer,
                    numZoomLevels: 18,
                    ref: "ito-ra",
                    attribution: "<a href='http://www.osm.org/'>CC by-sa - OSM</a> -- tiles from <a href='http://www.itoworld.com/product/data/ito_map/'>ITO</a>",
                    url: ['http://t0.itoworld.com/osm_script/wms?TILE=${z}/${x}/${y}&LAYERS=15&STYLES=&SRS=EPSG:900913&FORMAT=image%2Fpng&TRANSPARENT=on&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&WIDTH=256&HEIGHT=256',
                        'http://t0.itoworld.com/osm_script/wms?TILE=${z}/${x}/${y}&LAYERS=15&STYLES=&SRS=EPSG:900913&FORMAT=image%2Fpng&TRANSPARENT=on&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&WIDTH=256&HEIGHT=256',
                        'http://t0.itoworld.com/osm_script/wms?TILE=${z}/${x}/${y}&LAYERS=15&STYLES=&SRS=EPSG:900913&FORMAT=image%2Fpng&TRANSPARENT=on&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&WIDTH=256&HEIGHT=256',
                        'http://t0.itoworld.com/osm_script/wms?TILE=${z}/${x}/${y}&LAYERS=15&STYLES=&SRS=EPSG:900913&FORMAT=image%2Fpng&TRANSPARENT=on&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&WIDTH=256&HEIGHT=256']
                },
                {
                    text: OpenLayers.i18n("Schools"),
                    leaf: true,
                    handler: addLayer,
                    numZoomLevels: 18,
                    ref: "ito-sch",
                    attribution: "<a href='http://www.osm.org/'>CC by-sa - OSM</a> -- tiles from <a href='http://www.itoworld.com/product/data/ito_map/'>ITO</a>",
                    url: ['http://t0.itoworld.com/osm_script/wms?TILE=${z}/${x}/${y}&LAYERS=6&STYLES=&SRS=EPSG:900913&FORMAT=image%2Fpng&TRANSPARENT=on&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&WIDTH=256&HEIGHT=256',
                        'http://t0.itoworld.com/osm_script/wms?TILE=${z}/${x}/${y}&LAYERS=6&STYLES=&SRS=EPSG:900913&FORMAT=image%2Fpng&TRANSPARENT=on&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&WIDTH=256&HEIGHT=256',
                        'http://t0.itoworld.com/osm_script/wms?TILE=${z}/${x}/${y}&LAYERS=6&STYLES=&SRS=EPSG:900913&FORMAT=image%2Fpng&TRANSPARENT=on&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&WIDTH=256&HEIGHT=256',
                        'http://t0.itoworld.com/osm_script/wms?TILE=${z}/${x}/${y}&LAYERS=6&STYLES=&SRS=EPSG:900913&FORMAT=image%2Fpng&TRANSPARENT=on&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&WIDTH=256&HEIGHT=256']
                },
                {
                    text: OpenLayers.i18n("Speed limits km/h"),
                    leaf: true,
                    handler: addLayer,
                    numZoomLevels: 18,
                    ref: "ito-speed",
                    attribution: "<a href='http://www.osm.org/'>CC by-sa - OSM</a> -- tiles from <a href='http://www.itoworld.com/product/data/ito_map/'>ITO</a>",
                    url: ['http://t0.itoworld.com/osm_script/wms?TILE=${z}/${x}/${y}&LAYERS=25&STYLES=&SRS=EPSG:900913&FORMAT=image%2Fpng&TRANSPARENT=on&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&WIDTH=256&HEIGHT=256',
                        'http://t0.itoworld.com/osm_script/wms?TILE=${z}/${x}/${y}&LAYERS=25&STYLES=&SRS=EPSG:900913&FORMAT=image%2Fpng&TRANSPARENT=on&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&WIDTH=256&HEIGHT=256',
                        'http://t0.itoworld.com/osm_script/wms?TILE=${z}/${x}/${y}&LAYERS=25&STYLES=&SRS=EPSG:900913&FORMAT=image%2Fpng&TRANSPARENT=on&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&WIDTH=256&HEIGHT=256',
                        'http://t0.itoworld.com/osm_script/wms?TILE=${z}/${x}/${y}&LAYERS=25&STYLES=&SRS=EPSG:900913&FORMAT=image%2Fpng&TRANSPARENT=on&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&WIDTH=256&HEIGHT=256']
                },
                {
                    text: OpenLayers.i18n("Speed limits km/h: major roads"),
                    leaf: true,
                    handler: addLayer,
                    numZoomLevels: 18,
                    ref: "ito-speedmaj",
                    attribution: "<a href='http://www.osm.org/'>CC by-sa - OSM</a> -- tiles from <a href='http://www.itoworld.com/product/data/ito_map/'>ITO</a>",
                    url: ['http://t0.itoworld.com/osm_script/wms?TILE=${z}/${x}/${y}&LAYERS=42&STYLES=&SRS=EPSG:900913&FORMAT=image%2Fpng&TRANSPARENT=on&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&WIDTH=256&HEIGHT=256',
                        'http://t0.itoworld.com/osm_script/wms?TILE=${z}/${x}/${y}&LAYERS=42&STYLES=&SRS=EPSG:900913&FORMAT=image%2Fpng&TRANSPARENT=on&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&WIDTH=256&HEIGHT=256',
                        'http://t0.itoworld.com/osm_script/wms?TILE=${z}/${x}/${y}&LAYERS=42&STYLES=&SRS=EPSG:900913&FORMAT=image%2Fpng&TRANSPARENT=on&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&WIDTH=256&HEIGHT=256',
                        'http://t0.itoworld.com/osm_script/wms?TILE=${z}/${x}/${y}&LAYERS=42&STYLES=&SRS=EPSG:900913&FORMAT=image%2Fpng&TRANSPARENT=on&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&WIDTH=256&HEIGHT=256']
                },
                {
                    text: OpenLayers.i18n("Speed limits mph"),
                    leaf: true,
                    handler: addLayer,
                    numZoomLevels: 18,
                    ref: "ito-speedmph",
                    attribution: "<a href='http://www.osm.org/'>CC by-sa - OSM</a> -- tiles from <a href='http://www.itoworld.com/product/data/ito_map/'>ITO</a>",
                    url: ['http://t0.itoworld.com/osm_script/wms?TILE=${z}/${x}/${y}&LAYERS=5&STYLES=&SRS=EPSG:900913&FORMAT=image%2Fpng&TRANSPARENT=on&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&WIDTH=256&HEIGHT=256',
                        'http://t0.itoworld.com/osm_script/wms?TILE=${z}/${x}/${y}&LAYERS=5&STYLES=&SRS=EPSG:900913&FORMAT=image%2Fpng&TRANSPARENT=on&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&WIDTH=256&HEIGHT=256',
                        'http://t0.itoworld.com/osm_script/wms?TILE=${z}/${x}/${y}&LAYERS=5&STYLES=&SRS=EPSG:900913&FORMAT=image%2Fpng&TRANSPARENT=on&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&WIDTH=256&HEIGHT=256',
                        'http://t0.itoworld.com/osm_script/wms?TILE=${z}/${x}/${y}&LAYERS=5&STYLES=&SRS=EPSG:900913&FORMAT=image%2Fpng&TRANSPARENT=on&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&WIDTH=256&HEIGHT=256']
                },
                {
                    text: OpenLayers.i18n("Speed limits mph: major roads"),
                    leaf: true,
                    handler: addLayer,
                    numZoomLevels: 18,
                    ref: "ito-speedmphmaj",
                    attribution: "<a href='http://www.osm.org/'>CC by-sa - OSM</a> -- tiles from <a href='http://www.itoworld.com/product/data/ito_map/'>ITO</a>",
                    url: ['http://t0.itoworld.com/osm_script/wms?TILE=${z}/${x}/${y}&LAYERS=41&STYLES=&SRS=EPSG:900913&FORMAT=image%2Fpng&TRANSPARENT=on&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&WIDTH=256&HEIGHT=256',
                        'http://t0.itoworld.com/osm_script/wms?TILE=${z}/${x}/${y}&LAYERS=41&STYLES=&SRS=EPSG:900913&FORMAT=image%2Fpng&TRANSPARENT=on&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&WIDTH=256&HEIGHT=256',
                        'http://t0.itoworld.com/osm_script/wms?TILE=${z}/${x}/${y}&LAYERS=41&STYLES=&SRS=EPSG:900913&FORMAT=image%2Fpng&TRANSPARENT=on&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&WIDTH=256&HEIGHT=256',
                        'http://t0.itoworld.com/osm_script/wms?TILE=${z}/${x}/${y}&LAYERS=41&STYLES=&SRS=EPSG:900913&FORMAT=image%2Fpng&TRANSPARENT=on&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&WIDTH=256&HEIGHT=256']
                },
                {
                    text: OpenLayers.i18n("Surfaces"),
                    leaf: true,
                    handler: addLayer,
                    numZoomLevels: 18,
                    ref: "ito-surfaces",
                    attribution: "<a href='http://www.osm.org/'>CC by-sa - OSM</a> -- tiles from <a href='http://www.itoworld.com/product/data/ito_map/'>ITO</a>",
                    url: ['http://t0.itoworld.com/osm_script/wms?TILE=${z}/${x}/${y}&LAYERS=25&STYLES=&SRS=EPSG:900913&FORMAT=image%2Fpng&TRANSPARENT=on&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&WIDTH=256&HEIGHT=256',
                        'http://t0.itoworld.com/osm_script/wms?TILE=${z}/${x}/${y}&LAYERS=25&STYLES=&SRS=EPSG:900913&FORMAT=image%2Fpng&TRANSPARENT=on&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&WIDTH=256&HEIGHT=256',
                        'http://t0.itoworld.com/osm_script/wms?TILE=${z}/${x}/${y}&LAYERS=25&STYLES=&SRS=EPSG:900913&FORMAT=image%2Fpng&TRANSPARENT=on&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&WIDTH=256&HEIGHT=256',
                        'http://t0.itoworld.com/osm_script/wms?TILE=${z}/${x}/${y}&LAYERS=25&STYLES=&SRS=EPSG:900913&FORMAT=image%2Fpng&TRANSPARENT=on&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&WIDTH=256&HEIGHT=256']
                },
                {
                    text: OpenLayers.i18n("Unknown roads"),
                    leaf: true,
                    handler: addLayer,
                    numZoomLevels: 18,
                    ref: "ito-unro",
                    attribution: "<a href='http://www.osm.org/'>CC by-sa - OSM</a> -- tiles from <a href='http://www.itoworld.com/product/data/ito_map/'>ITO</a>",
                    url: ['http://t0.itoworld.com/osm_script/wms?TILE=${z}/${x}/${y}&LAYERS=21&STYLES=&SRS=EPSG:900913&FORMAT=image%2Fpng&TRANSPARENT=on&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&WIDTH=256&HEIGHT=256',
                        'http://t0.itoworld.com/osm_script/wms?TILE=${z}/${x}/${y}&LAYERS=21&STYLES=&SRS=EPSG:900913&FORMAT=image%2Fpng&TRANSPARENT=on&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&WIDTH=256&HEIGHT=256',
                        'http://t0.itoworld.com/osm_script/wms?TILE=${z}/${x}/${y}&LAYERS=21&STYLES=&SRS=EPSG:900913&FORMAT=image%2Fpng&TRANSPARENT=on&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&WIDTH=256&HEIGHT=256',
                        'http://t0.itoworld.com/osm_script/wms?TILE=${z}/${x}/${y}&LAYERS=21&STYLES=&SRS=EPSG:900913&FORMAT=image%2Fpng&TRANSPARENT=on&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&WIDTH=256&HEIGHT=256']
                },
                {
                    text: OpenLayers.i18n("Water"),
                    leaf: true,
                    handler: addLayer,
                    numZoomLevels: 18,
                    ref: "ito-water",
                    attribution: "<a href='http://www.osm.org/'>CC by-sa - OSM</a> -- tiles from <a href='http://www.itoworld.com/product/data/ito_map/'>ITO</a>",
                    url: ['http://t0.itoworld.com/osm_script/wms?TILE=${z}/${x}/${y}&LAYERS=3&STYLES=&SRS=EPSG:900913&FORMAT=image%2Fpng&TRANSPARENT=on&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&WIDTH=256&HEIGHT=256',
                        'http://t0.itoworld.com/osm_script/wms?TILE=${z}/${x}/${y}&LAYERS=3&STYLES=&SRS=EPSG:900913&FORMAT=image%2Fpng&TRANSPARENT=on&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&WIDTH=256&HEIGHT=256',
                        'http://t0.itoworld.com/osm_script/wms?TILE=${z}/${x}/${y}&LAYERS=3&STYLES=&SRS=EPSG:900913&FORMAT=image%2Fpng&TRANSPARENT=on&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&WIDTH=256&HEIGHT=256',
                        'http://t0.itoworld.com/osm_script/wms?TILE=${z}/${x}/${y}&LAYERS=3&STYLES=&SRS=EPSG:900913&FORMAT=image%2Fpng&TRANSPARENT=on&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&WIDTH=256&HEIGHT=256']
                }]
            },
            {
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
                text: OpenLayers.i18n("Incomplete adresses, services"),
                leaf: true,
                handler: addLayer,
                url: "http://map.stephane-brunner.ch/tiles/adrs/${z}/${x}/${y}.png",
                numZoomLevels: 18,
                attribution: "<a href='http://www.osm.org/'>CC by-sa - OSM</a>", 
                ref: "adrs"
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

    propagateTags = function(element, tags) {
        if (element.tags === undefined) {
            if (tags != "") { tags += " "; }
            tags += element.text;
        }
        else if (element.tags != "") {
            if (tags != "") { tags += " "; }
            tags += element.tags;
        }
        element.tags = tags;
        if (element.children) {
            for (var i = 0, len = element.children.length; i < len ; i++) {
                propagateTags(element.children[i], tags);
            }
        }
    }
    propagateTags(root, "");
    
    return root;
}
