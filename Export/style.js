
function addPoint(styleMap, property, value, image, width, height) {
    styleMap.styles["default"].addRules([new OpenLayers.Rule({
        symbolizer: { externalGraphic: image, graphicWidth: width ? width : 16, graphicHeight: height ? height : 16, graphicOpacity: 1 },
        filter: new OpenLayers.Filter.Comparison({
            type: OpenLayers.Filter.Comparison.LIKE,
            property: property,
            value: value
        })
    })]);
    styleMap.styles["select"].addRules([new OpenLayers.Rule({
        symbolizer: { externalGraphic: image, graphicWidth: width ? width : 16, graphicHeight: height ? height : 16, graphicOpacity: 1 },
        filter: new OpenLayers.Filter.Comparison({
            type: OpenLayers.Filter.Comparison.LIKE,
            property: property,
            value: value
        })
    })]);
}
function addStroke(styleMap, property, value, strokeColor, strokeWidth, strokeDashstyle) {
    styleMap.styles["default"].addRules([new OpenLayers.Rule({
        symbolizer: { strokeColor: strokeColor, strokeWidth: strokeWidth, strokeDashstyle: strokeDashstyle ? strokeDashstyle : "solid" },
        filter: new OpenLayers.Filter.Comparison({
            type: OpenLayers.Filter.Comparison.LIKE,
            property: property,
            value: value
        })
    })]);
    styleMap.styles["select"].addRules([new OpenLayers.Rule({
        symbolizer: { strokeWidth: strokeWidth },
        filter: new OpenLayers.Filter.Comparison({
            type: OpenLayers.Filter.Comparison.LIKE,
            property: property,
            value: value
        })
    })]);
}
function addArea(styleMap, property, value, fillColor, fillOpacity) {
    styleMap.styles["default"].addRules([new OpenLayers.Rule({
        symbolizer: { fillColor: fillColor, fillOpacity: fillOpacity ? fillOpacity : 0.5, stroke: false },
        filter: new OpenLayers.Filter.Comparison({
            type: OpenLayers.Filter.Comparison.LIKE,
            property: property,
            value: value
        })
    })]);
}
function addStrokeArea(styleMap, property, value, color, strokeWidth) {
    styleMap.styles["default"].addRules([new OpenLayers.Rule({
        symbolizer: { strokeColor: color, strokeWidth: strokeWidth, fillColor: color, fillOpacity: 0.8, stroke: true },
        filter: new OpenLayers.Filter.Comparison({
            type: OpenLayers.Filter.Comparison.LIKE,
            property: property,
            value: value
        })
    })]);
    styleMap.styles["select"].addRules([new OpenLayers.Rule({
        symbolizer: { strokeWidth: strokeWidth },
        filter: new OpenLayers.Filter.Comparison({
            type: OpenLayers.Filter.Comparison.LIKE,
            property: property,
            value: value
        })
    })]);
}

function getEventListener() {
    return {
        "featureselected": function(o) {
            var html = null;
            for (a in o.feature.attributes) {
              if (html == null) {
                html = '';
              }
              else {
                html += '<br />'
              }
              if (a == 'url') {
                var href = o.feature.attributes[a];
                html += a + ': <a href="' + href + '">' + href + '</a>';
              }
              else if (a == 'wikipedia') {
                var href = 'http://en.wikipedia.org/wiki/' + o.feature.attributes[a];
                html += a + ': <a href="' + href + '">' + o.feature.attributes[a] + '</a>';
              }
              else if (a.match('^wikipedia:')) {
                var lang = a.substring('wikipedia:'.length, a.length);
                var href = 'http://' + lang + '.wikipedia.org/wiki/' + o.feature.attributes[a];
                html += a + ': <a href="' + href + '">' + o.feature.attributes[a] + '</a>';
              }
              if (a == 'OSM user') {
                var href = "http://www.openstreetmap.org/user/" + o.feature.attributes[a];
                html += '<a href="' + href + '">Last edit by ' + o.feature.attributes[a] + '</a>';
              }
              
              else {                  
                html += a + ": " + o.feature.attributes[a];
              }

            }
            var href = "http://www.openstreetmap.org/browse/" + o.feature.type + "/" + o.feature.osm_id + "/history";
            html += '<br /><a href="' + href + '">History</a>';
            
            OpenLayers.Util.getElement('featureData').innerHTML = "<p>" + html + "</p>";
        },
        scope: this
    }
}
function addXapiStyleLayer(map, name, styleMap, type, id, element, predicate) {
    layer = new OpenLayers.Layer.Vector(name, {
        id: id,
        projection: epsg4326,
        strategies: [ new OpenLayers.Strategy.BBOX({ ratio: 1.2 }) ], 
        protocol: new OpenLayers.Protocol.XAPI({
            element: element,
            predicate: predicate,
            format: new OpenLayers.Format.OSM({ 
                checkTags: true,
                externalProjection: epsg4326
            })
        }),
        eventListeners: getEventListener(),
        styleMap: styleMap,
        visibility: false,
        type: type,
        numZoomLevels: 22,
        attribution: "<a href='http://www.osm.org/'>CC by-sa - OSM</a>"
    });
    map.addLayer(layer);
    var sf = new OpenLayers.Control.SelectFeature(layer, {
      autoActivate: true,
      hover: true
    });
    map.addControl(sf);
}
function addOsmStyleLayer(map, name, styleMap, type, id) {
    layer = new OpenLayers.Layer.Vector(name, {
        id: id,
        projection: epsg4326,
        maxResolution: 1.5,
        strategies: [ new OpenLayers.Strategy.BBOX({ ratio: 1.2 }) ],
        protocol: new OpenLayers.Protocol.HTTP({
//            url: "http://localhost/ol/osm.osm",
            url: "http://api.openstreetmap.org/api/0.6/map?",
            format: new OpenLayers.Format.OSM({ 
                checkTags: true,
                externalProjection: epsg4326
            })
        }),
        eventListeners: getEventListener(),
        styleMap: styleMap,
        visibility: false,
        type: type,
        numZoomLevels: 22,
        attribution: "<a href='http://www.osm.org/'>CC by-sa - OSM</a>"
    });
    map.addLayer(layer);
    var sf = new OpenLayers.Control.SelectFeature(layer, {
      autoActivate: true,
      hover: true
    });
    map.addControl(sf);
}

function getMaxSpeedStyle() {
    var styleMap = new OpenLayers.StyleMap();
    styleMap.addUniqueValueRules("default", "maxspeed", {
      '10': { strokeColor: '#00da8b', strokeWidth: 3 },
      '20': { strokeColor: '#00da8b', strokeWidth: 3 },
      '30': { strokeColor: '#4d4dff', strokeWidth: 3 },
      '40': { strokeColor: '#4d4dff', strokeWidth: 3 },
      '50': { strokeColor: '#07f807', strokeWidth: 3 },
      '60': { strokeColor: '#9f9fff', strokeWidth: 3 },
      '70': { strokeColor: '#eec600', strokeWidth: 3 },
      '80': { strokeColor: '#f90808', strokeWidth: 3 },
      '90': { strokeColor: '#07f8f8', strokeWidth: 3 },
      '100': { strokeColor: '#f807f8', strokeWidth: 3 },
      '110': { strokeColor: '#f6f807', strokeWidth: 3 },
      '120': { strokeColor: '#f6f807', strokeWidth: 3 },
      '130': { strokeColor: '#c0f100', strokeWidth: 3 },
      '140': { strokeColor: '#fe4503', strokeWidth: 3 }
    });
    return styleMap;
}

function getMountainStyle() {
  // http://dev.openlayers.org/releases/OpenLayers-2.10/doc/apidocs/files/OpenLayers/Feature/Vector-js.html#OpenLayers.Feature.Vector.OpenLayers.Feature.Vector.style
  var styleMap = new OpenLayers.StyleMap();
  /*styleMap.addUniqueValueRules("default", "landuse", {
    'forest': {fillColor: 'green', fillOpacity: 0.8, strokeColor: '#88ff88'}
  });*/
  styleMap.addUniqueValueRules("default", "trail_visibility", {
    'excellent': { strokeOpacity: 1 },
    'good': { strokeOpacity: .85 },
    'intermediate': { strokeOpacity: .7 },
    'bad': { strokeOpacity: .55 },
    'horrible': { strokeOpacity: .4 },
    'no': { strokeOpacity: .25 },
  });
  styleMap.addUniqueValueRules("default", "tourism", {
    'alpine_hut': { externalGraphic: 'symbols/alpinehut.p.16.png', graphicWidth: 16, graphicHeight: 16, graphicOpacity: 1 },
    'information': { externalGraphic: 'symbols/information.png', graphicWidth: 16, graphicHeight: 16, graphicOpacity: 1 },
    'viewpoint': { externalGraphic: 'symbols/view_point.p.16.png', graphicWidth: 16, graphicHeight: 16, graphicOpacity: 1 }
  });
  styleMap.addUniqueValueRules("default", "information", {
    'guidepost': { externalGraphic: 'symbols/guidepost.png', graphicWidth: 16, graphicHeight: 16, graphicOpacity: 1 }
  });
  styleMap.addUniqueValueRules("default", "natural", {
    'peak': { externalGraphic: 'symbols/peak.png', graphicWidth: 8, graphicHeight: 8, graphicOpacity: 1 }
  });
  styleMap.addUniqueValueRules("default", "mountain_pass", {
    'yes': { externalGraphic: 'symbols/pass.png', graphicWidth: 16, graphicHeight: 16, graphicOpacity: 1 }
  });
  styleMap.addUniqueValueRules("default", "aerialway", {
      'cable_car': { strokeColor: 'black', strokeWidth: 1.5, strokeDashstyle: 'longdashdot' },
      'gondola': { strokeColor: 'black', strokeWidth: 1.5, strokeDashstyle: 'longdashdot' },
      'chair_lift': { strokeColor: 'black', strokeWidth: 1.5, strokeDashstyle: 'longdashdot' },
      'mixed_lift': { strokeColor: 'black', strokeWidth: 1.5, strokeDashstyle: 'longdashdot' },
      'drag_lift': { strokeColor: 'black', strokeWidth: 1.5, strokeDashstyle: 'longdashdot' },
      'station': { pointRadius: 6, fillColor: 'black' },
      'pylon': { pointRadius: 2.5, fillColor: 'black' },
      'platter': { strokeColor: 'black', strokeWidth: 1.5, strokeDashstyle: 'longdashdot' },
      't-bar': { strokeColor: 'black', strokeWidth: 1.5, strokeDashstyle: 'longdashdot' },
      'j-bar': { strokeColor: 'black', strokeWidth: 1.5, strokeDashstyle: 'longdashdot' },
      'rope_tow ': { strokeColor: 'black', strokeWidth: 1.5, strokeDashstyle: 'longdashdot' },
      'magic_carpet': { strokeColor: 'black', strokeWidth: 1.5, strokeDashstyle: 'longdashdot' }
  });
  return styleMap;
}

function getHikkingStyle() {
    var styleMap = getMountainStyle();
    addStroke(styleMap, 'highway', 'path', 'green', 3);

    styleMap.addUniqueValueRules("default", "sac_scale", {
      'hiking': { strokeColor: 'red', strokeWidth: 2 },
      'mountain_hiking': { strokeColor: 'red', strokeDashstyle: 'longdash', strokeWidth: 2 },
      'demanding_mountain_hiking': { strokeColor: 'red', strokeDashstyle: 'dash', strokeWidth: 2 },
      'alpine_hiking': { strokeColor: 'blue', strokeWidth: 2 },
      'demanding_alpine_hiking': { strokeColor: 'blue', strokeDashstyle: 'longdash', strokeWidth: 2 },
      'difficult_alpine_hiking': { strokeColor: 'blue', strokeDashstyle: 'dash', strokeWidth: 2 }
    });
    return styleMap;
}
function getMTBStyle() {
    var styleMap = getMountainStyle();
    styleMap.addUniqueValueRules("default", "mtb:scale", {
      '0': { strokeColor: 'blue', strokeWidth: 2 },
      '1': { strokeColor: 'blue', strokeDashstyle: 'dash', strokeWidth: 2 },
      '2': { strokeColor: 'red', strokeWidth: 2 },
      '3': { strokeColor: 'red', strokeDashstyle: 'dash', strokeWidth: 2 },
      '4': { strokeColor: 'black', strokeWidth: 2 },
      '5': { strokeColor: 'black', strokeDashstyle: 'dash', strokeWidth: 2 }
    });
    styleMap.addUniqueValueRules("default", "route", {
      'bicycle': { strokeColor: 'blue', strokeWidth: 6, strokeOpacity: 0.3 },
      'mtb': { strokeColor: 'yellow', strokeWidth: 6, strokeOpacity: 0.3 }
    });
    return styleMap;
}
function getPisteStyle() {
    var styleMap = getMountainStyle();
    styleMap.addUniqueValueRules("default", "piste:difficulty", {
      'novice': { strokeColor: 'green', strokeWidth: 0 },
      'easy': { strokeColor: 'blue', strokeWidth: 0 },
      'intermediate': { strokeColor: 'red', strokeWidth: 0 },
      'advanced': { strokeColor: 'black', strokeWidth: 0 },
      'freestyle': { strokeColor: 'yellow', strokeWidth: 0 }
    });
    return styleMap;
}
function getSledStyle() {
    var styleMap = getPisteStyle();
    styleMap.addUniqueValueRules("default", "piste:type", {
      'sled': { strokeWidth: 4 },
    });
    return styleMap;
}
function getNordicStyle() {
    var styleMap = getPisteStyle();
    styleMap.addUniqueValueRules("default", "piste:type", {
      'nordic': { strokeWidth: 4 },
    });
    return styleMap;
}
function getSkyStyle() {
    var styleMap = getPisteStyle();
    styleMap.addUniqueValueRules("default", "piste:type", {
      'downhill': { strokeWidth: 4 },
    });
    return styleMap;
}
function getSnowShoeStyle() {
    var styleMap = getMountainStyle();
    styleMap.addUniqueValueRules("default", "route", {
      'snowshoe': { strokeColor: 'blue', strokeWidth: 3 }
    });
    return styleMap;
}
function getWinterWalksStyle() {
    var styleMap = getMountainStyle();
    styleMap.addUniqueValueRules("default", "route", {
      'winterwalks': { strokeColor: 'blue', strokeWidth: 3 },
    });
    return styleMap;
}
function getVitaStyle() {
    var styleMap = new OpenLayers.StyleMap();
    styleMap.addUniqueValueRules("default", "route", {
      'fitness_trail': { strokeColor: 'red', strokeWidth: 2 },
    });
    styleMap.addUniqueValueRules("default", "leisure", {
      'fitness_station': { pointRadius: 3, fillColor: 'orange' },
    });
    return styleMap;
}
function getOSMStyle() {
    var styleMap = getJOSMLikeStyleMap();
    addPoint(styleMap, 'religion', 'bahai', 'josm/religion/bahai.png');
    addPoint(styleMap, 'religion', 'buddhist', 'josm/religion/buddhism.png');
    addPoint(styleMap, 'religion', 'christian', 'josm/religion/church.png');
    addPoint(styleMap, 'religion', 'hindu', 'josm/religion/hinduism.png');
    addPoint(styleMap, 'religion', 'jain', 'josm/religion/jainism.png');
    addPoint(styleMap, 'religion', 'jewish', 'josm/religion/jewish.png');
    addPoint(styleMap, 'religion', 'muslim', 'josm/religion/muslim.png');
    addPoint(styleMap, 'religion', 'sikh', 'josm/religion/sikhism.png');
    addPoint(styleMap, 'religion', 'shinto', 'josm/religion/shinto.png');
    addPoint(styleMap, 'religion', 'spiritualist', 'josm/misc/no_icon.png');
    addPoint(styleMap, 'religion', 'taoist', 'josm/religion/taoism.png');
    addPoint(styleMap, 'religion', 'unitarian', 'josm/misc/no_icon.png');
    addPoint(styleMap, 'religion', 'zoroastrian', 'josm/misc/no_icon.png');

    styleMap.addUniqueValueRules("default", "tunnel", {
        'yes': { strokeDashstyle: 'dash' }
    });

    styleMap.addUniqueValueRules("default", "bridge", {
        'yes': { strokeOpacity: 0.5 }
    });

    addStroke(styleMap, 'highway', 'path', 'green', 3);

    addStroke(styleMap, 'highway', 'motorway', '#808bc0', 27);
    addStroke(styleMap, 'highway', 'motorway_link', '#808bc0', 21);
    addStroke(styleMap, 'highway', 'trunk', '#7fc97f', 24);
    addStroke(styleMap, 'highway', 'trunk_link', '#7fc97f', 18);
    addStroke(styleMap, 'highway', 'primary', '#e46d71', 21);
    addStroke(styleMap, 'highway', 'primary_link', '#e46d71', 15);
    addStroke(styleMap, 'highway', 'secondary', '#fdbf6f', 18);
    addStroke(styleMap, 'highway', 'secondary_link', '#fdbf6f', 15);
    addStroke(styleMap, 'highway', 'tertiary', '#fefeb3', 15);
    addStroke(styleMap, 'highway', 'unclassified', '#dddddd', 12);
    addStroke(styleMap, 'highway', 'road', '#dddddd', 12);
    addStroke(styleMap, 'highway', 'residential', '#dddddd', 12);
    addStroke(styleMap, 'highway', 'living_street', '#cccccc', 9);
    addStroke(styleMap, 'highway', 'service', '#dddddd', 9);
    addStroke(styleMap, 'highway', 'track', '#c39947', 6);
    addStrokeArea(styleMap, 'highway', 'pedestrian', '#999999', 6);
    addStroke(styleMap, 'highway', 'raceway', '#dddddd', 6);
    addStroke(styleMap, 'highway', 'services', '#dddddd', 6);
    addStroke(styleMap, 'highway', 'path', '#222222', 3);
    addStroke(styleMap, 'highway', 'cycleway', '#222222', 3);
    addStroke(styleMap, 'highway', 'footway', '#222222', 3);
    addStroke(styleMap, 'highway', 'bridleway', '#222222', 3);
    addStroke(styleMap, 'highway', 'byway', '#222222', 3);
    addStroke(styleMap, 'highway', 'steps', '#222222', 5, 'dot');

    styleMap.addUniqueValueRules("default", "area", {
      'yes': { stroke: false }
    });

    styleMap.addUniqueValueRules("default", "landuse", {
      'allotments': { fillColor: '#bde3cb', fillOpacity: 0.5, stroke: false },
      'basin': { fillColor: '#b4d5f0', fillOpacity: 0.5, stroke: false },
      'brownfield': { fillColor: '#ebd7fe', fillOpacity: 0.5, stroke: false },
      'cemetery': { fillColor: '#b4b4b4', fillOpacity: 0.5, stroke: false },
      'commercial': { fillColor: '#fbfec8', fillOpacity: 0.5, stroke: false },
      'construction': { fillColor: '#9d9d6c', fillOpacity: 0.5, stroke: false },
      'farm': { fillColor: '#ead88d', fillOpacity: 0.5, stroke: false },
      'farmland': { fillColor: '#ead88d', fillOpacity: 0.5, stroke: false },
      'farmyard': { fillColor: '#ead88d', fillOpacity: 0.5, stroke: false },
      'forest': { fillColor: '#71be80', fillOpacity: 0.5, stroke: false },
      'garages': { fillColor: '#dddddd', fillOpacity: 0.5, stroke: false },
      'grass': { fillColor: '#c5f0c5', fillOpacity: 0.5, stroke: false },
      'greenfield': { fillColor: '#c5f0c5', fillOpacity: 0.5, stroke: false },
      'greenhouse_horticulture': { fillColor: '#dceaee', fillOpacity: 0.5, stroke: false },
      'industrial': { fillColor: '#ebd7fe', fillOpacity: 0.5, stroke: false },
      'landfill': { fillColor: '#9d9c6c', fillOpacity: 0.5, stroke: false },
      'meadow': { fillColor: '#c5f0c5', fillOpacity: 0.5, stroke: false },
      'military': { fillColor: '#cdc0a2', fillOpacity: 0.5, stroke: false },
      'orchard': { fillColor: '#c2c2c2', fillOpacity: 0.5, stroke: false },
      'quarry': { fillColor: '#ded0d5', fillOpacity: 0.5, stroke: false },
      'railway': { fillColor: '#bde3cb', fillOpacity: 0.5, stroke: false },
      'recreation_ground': { fillColor: '#c5f0c5', fillOpacity: 0.5, stroke: false },
      'reservoir': { fillColor: '#b4d5f0', fillOpacity: 0.5, stroke: false },
      'residential': { fillColor: '#f3f3f3', fillOpacity: 0.5, stroke: false },
      'retail': { fillColor: '#feeaea', fillOpacity: 0.5, stroke: false },
      'salt_pond': { fillColor: '#dddddd', fillOpacity: 0.5, stroke: false },
      'village_green': { fillColor: '#c5f0c5', fillOpacity: 0.5, stroke: false },
      'vineyard': { fillColor: '#b3e2a8', fillOpacity: 0.5, stroke: false }
    });
    styleMap.addUniqueValueRules("default", "natural", {
      'bay': { fillColor: '#dddddd', fillOpacity: 0.5, stroke: false },
      'beach': { fillColor: '#efce54', fillOpacity: 0.5, stroke: false },
      'cave_entrance': { fillColor: '#dddddd', fillOpacity: 0.5, stroke: false },
      'cliff': { fillColor: '#aaaaaa', fillOpacity: 0.5, stroke: false },
      'coastline': { fillColor: '#b7d7f2', fillOpacity: 0.5, stroke: false },
      'fell': { fillColor: '#dddddd', fillOpacity: 0.5, stroke: false },
      'glacier': { fillColor: '#ddecec', fillOpacity: 0.5, stroke: false },
      'heath': { fillColor: '#ffffc0', fillOpacity: 0.5, stroke: false },
      'land': { fillColor: '#ffffc0', fillOpacity: 0.5, stroke: false },
      'mud': { fillColor: '#e5dbd0', fillOpacity: 0.5, stroke: false },
      'peak': { externalGraphic: 'symbols/peak.png', graphicWidth: 8, graphicHeight: 8, graphicOpacity: 1 },
      'sand': { fillColor: '#dddddd', fillOpacity: 0.5, stroke: false },
      'scree': { fillColor: '#dddddd', fillOpacity: 0.5, stroke: false },
      'scrub': { fillColor: '#73c182', fillOpacity: 0.5, stroke: false },
      'spring': { fillColor: '#b7d7f2', fillOpacity: 0.8, stroke: false },
      'stone': { fillColor: '#aaaaaa', fillOpacity: 0.8, stroke: false },
      'tree': { fillColor: '#73c182', fillOpacity: 0.8, stroke: false },
      'volcano': { fillColor: 'red', fillOpacity: 0.8, stroke: false },
      'water': { fillColor: '#b7d7f2', fillOpacity: 0.5, stroke: false },
      'wetland': { fillColor: '#dddddd', fillOpacity: 0.5, stroke: false },
      'wood': { fillColor: '#73c182', fillOpacity: 0.5, stroke: false }
    });
    addStrokeArea(styleMap, 'building', '.+', '#bca9a9', 1);
    
    addStroke(styleMap, 'waterway', 'river', 'blue', 15);
    addStroke(styleMap, 'waterway', 'stream', 'blue', 6);
    addStroke(styleMap, 'waterway', 'canal', 'blue', 10);
    addStroke(styleMap, 'waterway', 'ditch', 'blue', 6);
    addStroke(styleMap, 'waterway', 'drain', 'blue', 6);

    return styleMap;
}
