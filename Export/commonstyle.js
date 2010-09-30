/**
 * @requires OpenLayers/Filter/Comparison.js
 * @requires OpenLayers/Rule.js
 */

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
function addPointNoImg(styleMap, property, value, color, radius, opacity) {
    styleMap.styles["default"].addRules([new OpenLayers.Rule({
        symbolizer: { fillColor: color, pointRadius: radius, fillOpacity: opacity },
        filter: new OpenLayers.Filter.Comparison({
            type: OpenLayers.Filter.Comparison.LIKE,
            property: property,
            value: value
        })
    })]);
    styleMap.styles["select"].addRules([new OpenLayers.Rule({
        symbolizer: { pointRadius: radius, fillOpacity: opacity },
        filter: new OpenLayers.Filter.Comparison({
            type: OpenLayers.Filter.Comparison.LIKE,
            property: property,
            value: value
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

function addStrokeOperator(styleMap, property, value, operator, strokeColor, strokeWidth, strokeDashstyle) {
    styleMap.styles["default"].addRules([new OpenLayers.Rule({
        symbolizer: { strokeColor: strokeColor, strokeWidth: strokeWidth, strokeDashstyle: strokeDashstyle ? strokeDashstyle : "solid" },
        filter: new OpenLayers.Filter.Comparison({
            type: operator,
            property: property,
            value: value
        })
    })]);
    styleMap.styles["select"].addRules([new OpenLayers.Rule({
        symbolizer: { strokeWidth: strokeWidth },
        filter: new OpenLayers.Filter.Comparison({
            type: operator,
            property: property,
            value: value
        })
    })]);
}
