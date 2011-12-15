/**
 * Copyright (c) 2010-2011 The Open Source Geospatial Foundation
 * 
 * Published under the BSD license.
 * See http://svn.geoext.org/core/trunk/geoext/license.txt for the full text
 * of the license.
 */
/*
 * @include OpenLayers/Filter/Comparison.js
 * @include OpenLayers/Rule.js
 */
function addPointNoLabel(styleMap, property, value, image, width, height) {
    styleMap.styles["default"].addRules([new OpenLayers.Rule({
        symbolizer: { externalGraphic: image, graphicWidth: width ? width : 16, graphicHeight: height ? height : 16, graphicOpacity: 1 },
        filter: new OpenLayers.Filter.Comparison({
            type: OpenLayers.Filter.Comparison.LIKE,
            property: property,
            value: value
        })
    })]);
    styleMap.styles.select.addRules([new OpenLayers.Rule({
        symbolizer: { externalGraphic: image, graphicWidth: width ? width : 16, graphicHeight: height ? height : 16, graphicOpacity: 1 },
        filter: new OpenLayers.Filter.Comparison({
            type: OpenLayers.Filter.Comparison.LIKE,
            property: property,
            value: value
        })
    })]);
}
function addPoint(styleMap, property, value, image, width, height) {
    addPointNoLabel(styleMap, property, value, image, width, height);
    styleMap.styles["default"].addRules([new OpenLayers.Rule({
        symbolizer: { externalGraphic: image, graphicWidth: width ? width : 16, graphicHeight: height ? height : 16, graphicOpacity: 1, labelYOffset: -7 -height/2, label: '${name}' },
        filter: new OpenLayers.Filter.Logical({
            type: OpenLayers.Filter.Logical.AND,
            filters: [new OpenLayers.Filter.Comparison({
                type: OpenLayers.Filter.Comparison.LIKE,
                property: property,
                value: value
            }), new OpenLayers.Filter.Comparison({
                type: OpenLayers.Filter.Comparison.LIKE,
                property: 'name',
                value: '.+'
            })]
        })
    })]);
    styleMap.styles.select.addRules([new OpenLayers.Rule({
        symbolizer: { externalGraphic: image, graphicWidth: width ? width : 16, graphicHeight: height ? height : 16, graphicOpacity: 1, labelYOffset: -7 -height/2, label: '${name}' },
        filter: new OpenLayers.Filter.Logical({
            type: OpenLayers.Filter.Logical.AND,
            filters: [new OpenLayers.Filter.Comparison({
                type: OpenLayers.Filter.Comparison.LIKE,
                property: property,
                value: value
            }), new OpenLayers.Filter.Comparison({
                type: OpenLayers.Filter.Comparison.LIKE,
                property: 'name',
                value: '.+'
            })]
        })
    })]);
}
function addPointNoImg(styleMap, property, value, color, radius, opacity) {
    styleMap.styles["default"].addRules([new OpenLayers.Rule({
        symbolizer: { fillColor: color, pointRadius: radius, fillOpacity: opacity },
        filter: new OpenLayers.Filter.Comparison({
            type: OpenLayers.Filter.Comparison.LIKE,
            property: property,
            value: value
        })
    })]);
    styleMap.styles.select.addRules([new OpenLayers.Rule({
        symbolizer: { pointRadius: radius, fillOpacity: opacity },
        filter: new OpenLayers.Filter.Comparison({
            type: OpenLayers.Filter.Comparison.LIKE,
            property: property,
            value: value
        })
    })]);
    styleMap.styles["default"].addRules([new OpenLayers.Rule({
        symbolizer: { fillColor: color, pointRadius: radius, fillOpacity: opacity, labelYOffset: -10, label: '${name}' },
        filter: new OpenLayers.Filter.Logical({
            type: OpenLayers.Filter.Logical.AND,
            filters: [new OpenLayers.Filter.Comparison({
                type: OpenLayers.Filter.Comparison.LIKE,
                property: property,
                value: value
            }), new OpenLayers.Filter.Comparison({
                type: OpenLayers.Filter.Comparison.LIKE,
                property: 'name',
                value: '.+'
            })]
        })
    })]);
    styleMap.select.addRules([new OpenLayers.Rule({
        symbolizer: { fillColor: color, pointRadius: radius, fillOpacity: opacity, labelYOffset: -5, label: '${name}' },
        filter: new OpenLayers.Filter.Logical({
            type: OpenLayers.Filter.Logical.AND,
            filters: [new OpenLayers.Filter.Comparison({
                type: OpenLayers.Filter.Comparison.LIKE,
                property: property,
                value: value
            }), new OpenLayers.Filter.Comparison({
                type: OpenLayers.Filter.Comparison.LIKE,
                property: 'name',
                value: '.+'
            })]
        })
    })]);
}
function addStroke(styleMap, property, value, strokeColor, strokeWidth, strokeDashstyle, strokeOpacity) {
    styleMap.styles["default"].addRules([new OpenLayers.Rule({
        symbolizer: { strokeColor: strokeColor, strokeWidth: strokeWidth, 
            strokeDashstyle: strokeDashstyle ? strokeDashstyle : "solid" ,
            strokeOpacity: strokeOpacity ? strokeOpacity : 1 
        },
        filter: new OpenLayers.Filter.Comparison({
            type: OpenLayers.Filter.Comparison.LIKE,
            property: property,
            value: value
        })
    })]);
    styleMap.styles.select.addRules([new OpenLayers.Rule({
        symbolizer: { strokeWidth: strokeWidth },
        filter: new OpenLayers.Filter.Comparison({
            type: OpenLayers.Filter.Comparison.LIKE,
            property: property,
            value: value
        })
    })]);
}
function addAreaLabel(styleMap, property, value, fillColor, fillOpacity, label) {
    addArea(styleMap, property, value, fillColor, fillOpacity);
    styleMap.styles["default"].addRules([new OpenLayers.Rule({
        symbolizer: { fillColor: fillColor, fillOpacity: fillOpacity ? fillOpacity : 0.5, stroke: false, label: '${'+label+'}' },
        filter: new OpenLayers.Filter.Logical({
            type: OpenLayers.Filter.Logical.AND,
            filters: [new OpenLayers.Filter.Comparison({
                type: OpenLayers.Filter.Comparison.LIKE,
                property: property,
                value: value
            }), new OpenLayers.Filter.Comparison({
                type: OpenLayers.Filter.Comparison.LIKE,
                property: label,
                value: '.+'
            })]
        })
    })]);
    styleMap.styles.select.addRules([new OpenLayers.Rule({
        symbolizer: { label: '${'+label+'}' },
        filter: new OpenLayers.Filter.Logical({
            type: OpenLayers.Filter.Logical.AND,
            filters: [new OpenLayers.Filter.Comparison({
                type: OpenLayers.Filter.Comparison.LIKE,
                property: property,
                value: value
            }), new OpenLayers.Filter.Comparison({
                type: OpenLayers.Filter.Comparison.LIKE,
                property: label,
                value: '.+'
            })]
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
    styleMap.styles["default"].addRules([new OpenLayers.Rule({
        symbolizer: { fillColor: fillColor, fillOpacity: fillOpacity ? fillOpacity : 0.5, stroke: false, label: '${name}' },
        filter: new OpenLayers.Filter.Logical({
            type: OpenLayers.Filter.Logical.AND,
            filters: [new OpenLayers.Filter.Comparison({
                type: OpenLayers.Filter.Comparison.LIKE,
                property: property,
                value: value
            }), new OpenLayers.Filter.Comparison({
                type: OpenLayers.Filter.Comparison.LIKE,
                property: 'name',
                value: '.+'
            })]
        })
    })]);
    styleMap.styles.select.addRules([new OpenLayers.Rule({
        symbolizer: { label: '${name}' },
        filter: new OpenLayers.Filter.Logical({
            type: OpenLayers.Filter.Logical.AND,
            filters: [new OpenLayers.Filter.Comparison({
                type: OpenLayers.Filter.Comparison.LIKE,
                property: property,
                value: value
            }), new OpenLayers.Filter.Comparison({
                type: OpenLayers.Filter.Comparison.LIKE,
                property: 'name',
                value: '.+'
            })]
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
    styleMap.styles.select.addRules([new OpenLayers.Rule({
        symbolizer: { strokeWidth: strokeWidth },
        filter: new OpenLayers.Filter.Comparison({
            type: OpenLayers.Filter.Comparison.LIKE,
            property: property,
            value: value
        })
    })]);
}

function addStrokeOperator(styleMap, property, value, operator, strokeColor, strokeWidth, strokeDashstyle) {
    styleMap.styles["default"].addRules([new OpenLayers.Rule({
        symbolizer: { strokeColor: strokeColor, strokeWidth: strokeWidth, strokeDashstyle: strokeDashstyle ? strokeDashstyle : "solid" },
        filter: new OpenLayers.Filter.Comparison({
            type: operator,
            property: property,
            value: value
        })
    })]);
    styleMap.styles.select.addRules([new OpenLayers.Rule({
        symbolizer: { strokeWidth: strokeWidth },
        filter: new OpenLayers.Filter.Comparison({
            type: operator,
            property: property,
            value: value
        })
    })]);
}
