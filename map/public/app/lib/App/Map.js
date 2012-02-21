/**
 * Copyright (c) 2010-2011 The Open Source Geospatial Foundation
 *
 * Published under the BSD license.
 * See http://svn.geoext.org/core/trunk/geoext/license.txt for the full text
 * of the license.
 */

/*
 * @requires GeoExt/widgets/MapPanel.js
 * @include GeoExt/widgets/Popup.js
 * @include OpenLayers/Projection.js
 * @include OpenLayers/Layer/SphericalMercator.js
 * @include OpenLayers/Map.js
 * @include OpenLayers/Layer/OSM.js
 * @include OpenLayers/Control/Navigation.js
 * @include OpenLayers/Kinetic.js
 * @include OpenLayers/Control/PanZoomBar.js
 * @include OpenLayers/Control/ZoomPanel.js
 * @include OpenLayers/Control/ArgParser.js
 * @include OpenLayers/Control/Attribution.js
 * @include OpenLayers/Control/ScaleLine.js
 * @include OpenLayers/Control/LoadingPanel.js
 * @include OpenLayers/Control/MousePosition.js
 * @include OpenLayers/Control/KeyboardDefaults.js
 * @include OpenLayers/Control/OverviewMap.js
 * @include OpenLayers/Control/SelectFeature.js
 * @include OpenLayers/Control/Permalink.js
 * @include App/Tools.js
 */

Ext.namespace('App');

/**
 * Constructor: App.Map
 * Creates a {GeoExt.MapPanel} internally. Use the "mapPanel" property
 * to get a reference to the map panel.
 *
 * Parameters:
 * options - {Object} Options passed to the {GeoExt.MapPanel}.
 */
App.Map = Ext.extend(GeoExt.MapPanel, {

    /** private: method[constructor]
     *  Construct the component.
     */
    constructor: function(options) {

        // create map
        var mapOptions = {
            projection: new OpenLayers.Projection("EPSG:900913"),
            displayProjection: new OpenLayers.Projection("EPSG:4326"),
            units: "m",
            theme: null,
            numZoomLevels: 19,
            maxResolution: 156543.0339,
            maxExtent: new OpenLayers.Bounds(-20037508, -20037508, 20037508, 20037508.34),
            controls: [
                new OpenLayers.Control.PanZoomBar({panIcons: false}),
                new OpenLayers.Control.MousePosition(),
                new OpenLayers.Control.Navigation(),
                new OpenLayers.Control.ArgParser(),
                new OpenLayers.Control.Attribution(),
                new OpenLayers.Control.KeyboardDefaults(),
                new OpenLayers.Control.ScaleLine({geodesic: true, maxWidth: 120}),
                new OpenLayers.Control.LoadingPanel(),
                new OpenLayers.Control.OverviewMap({
                    minRatio: 64,
                    maxRatio: 64,
                    mapOptions: {theme: null},
                    layers: [new OpenLayers.Layer.OSM()]
                })
            ]
        };

        var map = new OpenLayers.Map(mapOptions);
        map.addLayers([new OpenLayers.Layer.OSM("back", "http://map.stephane-brunner.ch/white.png", {
            numZoomLevels: 19,
            displayInLayerSwitcher: false,
            attribution: ""
        })]);

        var selectFeatureControl = null;
        var hoverFeatureControl = null;
        var featureLayers = null;
        map.events.register('addlayer', map, function(arg) {
            if (arg.layer instanceof OpenLayers.Layer.Vector && (arg.layer.ref || arg.layer.name == "Routing")) {
                if (selectFeatureControl) {
                    featureLayers.push(arg.layer);
                    hoverFeatureControl.setLayer(featureLayers);
                    selectFeatureControl.setLayer(featureLayers);
                }
                else {
                    featureLayers = [arg.layer];
                    hoverFeatureControl = new OpenLayers.Control.SelectFeature(featureLayers, {
                        autoActivate: true,
                        hover: true,
                        highlightOnly: true
                    });
                    this.addControl(hoverFeatureControl);
                    selectFeatureControl = new OpenLayers.Control.SelectFeature(featureLayers, {
                        autoActivate: true,
                        hover: false,
                        clickout: true,
                        toggle: false
                    });
                    this.addControl(selectFeatureControl);
                }

                arg.layer.events.register('featureselected', this, function(o) {
                    var html = null;
                    for (var a in o.feature.attributes) {
                        var add = true;
                        if (a == 'units' && typeof(o.feature.attributes.units) == 'object') {
                            add = false;
                        }

                        if (html === null) {
                            html = '';
                        }
                        else if (add) {
                            html += '<br />';
                        }
                        if (!add) {
                        }
                        else if (a == 'website') {
                            var href = o.feature.attributes[a];
                            html += a + ':&nbsp;<a href="' + href + '">' + href + '</a>';
                        }
                        else if (a == 'url') {
                            var href = o.feature.attributes[a];
                            html += a + ':&nbsp;<a href="' + href + '">' + href + '</a>';
                        }
                        else if (a == 'wikipedia') {
                            var href = 'http://en.wikipedia.org/wiki/' + o.feature.attributes[a];
                            html += a + ':&nbsp;<a href="' + href + '">' + o.feature.attributes[a].replace(/ /g, '&nbsp;') + '</a>';
                        }
                        else if (a.match('^wikipedia:')) {
                            var lang = a.substring('wikipedia:'.length, a.length);
                            var href = 'http://' + lang + '.wikipedia.org/wiki/' + o.feature.attributes[a];
                            html += a + ':&nbsp;<a href="' + href + '">' + o.feature.attributes[a].replace(/ /g, '&nbsp;') + '</a>';
                        }
                        else if (a == 'OSM user') {
                            var href = "http://www.openstreetmap.org/user/" + o.feature.attributes[a];
                            html += '<a href="' + href + '">Last edit by ' + o.feature.attributes[a] + '</a>';
                        }
                        else if (a == 'time') {
                            var time = o.feature.attributes[a];
                            var minutes = Math.floor(time / 60);
                            var seg = Math.round(time % 60);
                            if (seg < 10) {
                                seg = '0' + seg;
                            }
                            html += a + ":&nbsp;" + minutes + ':' + seg + '&nbsp;min:s';
                        }
                        else if (a == 'units' && typeof(o.feature.attributes.units) == 'object') {
                        }
                        else if (o.feature.attributes.units && o.feature.attributes.units[a]) {
                            html += a + ":&nbsp;" + o.feature.attributes[a] + "&nbsp;" + o.feature.attributes.units[a];
                        }
                        else if (o.feature.attributes[a].replace) {
                            html += a + ":&nbsp;" + o.feature.attributes[a].replace(/ /g, '&nbsp;');
                        }
                        else {
                            html += a + ":&nbsp;" + o.feature.attributes[a];
                        }
                    }
                    if (o.feature.osm_id) {
                        var href = "http://www.openstreetmap.org/browse/" + o.feature.type + "/" + o.feature.osm_id + "/history";
                        html += '<br /><a href="' + href + '">History</a>';
                    }

                    var popup = new GeoExt.Popup({
                        title: o.feature.attributes.name,
                        location: o.feature,
                        width: 200,
                        html: html,
                        collapsible: true
                    });
                    popup.show();
                });
            }

            if (arg.layer.displayInLayerSwitcher !== false) {
                var layers = map.getLayersBy('displayInLayerSwitcher', false);
                for (var i = 0, len = layers.length ; i < len ; i++) {
                    if (layers[i].name != "back") {
                        map.setLayerIndex(layers[i], map.layers.length - 1);
                    }
                }
            }
        });

        // create map panel
        var tools = new App.Tools(map);
        options = Ext.apply({
            map: map,
            tbar: tools.tbar,
            extent: new OpenLayers.Bounds(5, 45.5, 11, 48).transform(map.displayProjection, map.projection),
            border: true,
            stateId: "m",
            prettyStateKeys: true
        }, options);
        GeoExt.LayerCatalogue.superclass.constructor.call(this, options);

        this.getTopToolbar().addButton(tools.getAdditionalButtons(map));
    },

    applyState: function(state) {

        // if we get strings for state.x, state.y or state.zoom
        // OpenLayers will take care of converting them to the
        // appropriate types so we don't bother with that
        this.center = new OpenLayers.LonLat(state.x, state.y).transform(this.map.displayProjection, this.map.getProjectionObject());
        this.zoom = state.z;

        // set layer visibility and opacity
        var i, l, layer, layerId, visibility, opacity;
        var layers = this.map.layers;
        for (i=0, l=layers.length; i<l; i++) {
            layer = layers[i];
            if (layer.ref) {
                layerId = layer.ref;
                visibility = state["v_" + layerId];
                if(visibility !== undefined) {
                    // convert to boolean
                    visibility = (/^true$/i).test(visibility);
                    if(layer.isBaseLayer) {
                        if(visibility) {
                            this.map.setBaseLayer(layer);
                        }
                    } else {
                        layer.setVisibility(visibility);
                    }
                }
                opacity = state["o_" + layerId];
                if(opacity !== undefined) {
                    layer.setOpacity(opacity);
                }
            }
        }
    },

    /** private: method[getState]
     *  :return:  ``Object`` The state.
     *
     *  Returns the current state for the map panel.
     */
    getState: function() {
        var state;

        // Ext delays the call to getState when a state event
        // occurs, so the MapPanel may have been destroyed
        // between the time the event occurred and the time
        // getState is called
        if(!this.map) {
            return;
        }

        // record location and zoom level
        var center = this.map.getCenter().clone().transform(this.map.getProjectionObject(), this.map.displayProjection);
        state = {
            x: Math.round(center.lon * 100000) / 100000,
            y: Math.round(center.lat * 100000) / 100000,
            z: this.map.getZoom()
        };

        // record layer visibility and opacity
        var i, l, layer, layerId, layers = this.map.layers;
        for(i=0, l=layers.length; i<l; i++) {
            layer = layers[i];
            if (layer.ref) {
                layerId = layer.ref;
                state["v_" + layerId] = layer.getVisibility();
                state["o_" + layerId] = layer.opacity === null ? 1 : layer.opacity;
            }
        }

        return state;
    }
});
