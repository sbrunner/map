/**
 * Copyright (c) 2008-2009 The Open Source Geospatial Foundation
 *
 * Published under the BSD license.
 * See http://svn.geoext.org/core/trunk/geoext/license.txt for the full text
 * of the license.
 */

/** api: (define)
 *  module = GeoExt.ux
 *  class = GoogleEarthPanel
 *  base_link = `Ext.Panel <http://extjs.com/deploy/dev/docs/?class=Ext.Panel>`_
 */
Ext.namespace('GeoExt.ux');

/**
 * @requires OpenLayers/Projection.js
 * @include OpenLayers/Layer/Vector.js
 * @include OpenLayers/Util.js
 * @include OpenLayers/Control/DragFeature.js
 * @include OpenLayers/BaseTypes/LonLat.js
 * @include OpenLayers/Geometry/LineString.js
 * @include OpenLayers/Geometry/Point.js
 * @include GoogleEarthPanel/ux/control/GoogleEarthClick.js
 */

/** private: property[scriptSourceGoogleEarth]
 *  ``String``  Source of this script: complete URL
 */
var scriptSourceGoogleEarth = (function() {
    var scripts = document.getElementsByTagName('script'),
            script = scripts[scripts.length - 1];

    if (script.getAttribute.length !== undefined) {
        return script.src;
    }

    return script.getAttribute('src', -1);
}());

GeoExt.ux.GoogleEarthPanel = Ext.extend(Ext.Panel, {

    /** api: config[map]
     *  ``OpenLayers.Map``  A configured map
     */
    /** private: property[map]
     *  ``OpenLayers.Map``  The map object.
     */
    map: null,

    /** private: property[ge]
     *  Google earth instance
     */
    ge: null,

    /** private: property[geProjection]
     *  Google earth projection
     */
    geProjection: new OpenLayers.Projection("EPSG:4326"),

    /** api: config[showBordersLayer]
     *  Show GE borders layer
     */
    showBordersLayer: false,

    /** api: config[showTerrainLayer]
     *  Show GE terrain layer
     */
    showTerrainLayer: true,

    /** api: config[showRoadsLayer]
     *  Show GE road layer
     */
    showRoadsLayer: false,

    /** api: config[showBuildings]
     *  Show GE building layer
     */
    showBuildingsLayer: true,

    /** api: config[showBuildingsLowResolution]
     *  Show GE building low resolution layer
     */
    showBuildingsLowResolutionLayer: false,

    /** api: config[show2DNavigationTool]
     *  This mode will show a 2D navigation that allows the user to manage the range and the heading of the Google Earth Instance.
     *  This requires a map.
     */
    show2DNavigationTool: true,

    /** api: config[navigationMode2D]
     *  This mode will synchronize the center of the 2D map with the lookAt point of the Google Earth Instance
     *  This requires a map.
     */
    navigationMode2D: false,

    /** api: config[navigationMode3D]
     *  This mode will synchronize the lookAt of the of the Google Earth Instance with the center of the 2D map
     *  This requires a map.
     */
    navigationMode3D: false,

    /** api: config[clickMode]
     *  This mode will allow the user to click in the 2D map. The clicked point is then the lookAt point of the Google Earth Instance
     *  This requires a map.
     */
    clickMode: true,

    /** property[earthAvailable]
     *  Defines if Google Earth is available
     */
    earthAvailable: true,

    /** api: config[lookAt]
     *  `` OpenLayers.LonLat``  Initial camera position (default: 0,0)
     *  Take the map center if nothing is defined
     */
    /** private: property[lookAt]
     *  ``OpenLayers.LonLat``  Initial camera position
     */
    lookAt: null,

    /** api: config[altitude]
     *  Initial altitude (default: 100)
     */
    /** private: property[altitude]
     *  Initial altitude
     */
    altitude: 100,

    /** api: config[altitudeMode]
     *  Initial altitude mode (default: 1 ALTITUDE_RELATIVE_TO_GROUND)
     */
    /** private: property[altitudeMode]
     *  Initial altitude mode
     */
    altitudeMode: 1,

    /** api: config[heading]
     *  Initial heading in degrees (default: 0)
     */
    /** private: property[heading]
     *  Initial heading in degrees
     */
    heading: 0,

    /** api: config[tilt]
     *  Initial tilt in degrees (default: o)
     */
    /** private: property[tilt]
     *  Initial tilt in degrees
     */
    tilt: 0,

    /** api: config[range]
     *  Initial range in meters (default: 100)
     */
    /** private: property[range]
     *  Initial range in meters
     */
    range: 100,

    /** api: config[kmlUrl]
     *  KML Url (default: null)
     */
    /** private: property[kmlUrl]
     *  KML Url
     */
    kmlUrl: null,

    /** api: config[networkLinkUrl]
     *  `` String`` or `` Array `` Url for network link (default: null)
     */
    /** private: property[networkLinkUrl]
     *  `` String`` or `` Array `` Url for network link
     */
    networkLinkUrl: null,

    /** api: config[layers]
     *  WMS Layers that are visible in Google Earth
     *  Required: a cartographic server that provide KML content
     */
    /** private: property[layers]
     *  Array of ``OpenLayers.Layer.WMS``
     *  Visibility is synchronized with map visibility
     */
    layers: null,

    /** private: property[layerCache]
     *  Layer cache for Google Earth PlugIn
     */
    layerCache: {},

    /** api: config[readPermalink]
     *  ``Boolean``  Read the permalink in the url if presents
     */
    /** private: property[readPermalink]
     *  ``Boolean``  Read the permalink in the url if presents
     */
    readPermalink: true,

    /** api: config[baseUrl]
     *  ``Boolean``  base url of this directory resources necessary to get the images (directory containing resources). Has to be set if this file is integrated in a JS build.
     */
    /** private: property[baseUrl]
     *  ``String``  base url of this directory resources necessary to get the images
     */
    baseUrl: scriptSourceGoogleEarth.replace('/ux/widgets/GoogleEarthPanel.js', ''),

    /** private: method[initComponent]
     *  Private initComponent override.
     */
    initComponent: function() {
        var defConfig = {
            border: true
        };
        Ext.applyIf(this, defConfig);

        GeoExt.ux.GoogleEarthPanel.superclass.initComponent.call(this);
    },

    /** private: method[afterRender]
     *  Private afterRender override.
     *  Creates a Google Earth Instance if no available.
     */
    afterRender: function() {
        if (this.ownerCt) {
            var wh = this.ownerCt.getSize();
            Ext.applyIf(this, wh);
        }
        GeoExt.ux.GoogleEarthPanel.superclass.afterRender.call(this);

        // Use the permalink
        if (this.readPermalink) {
            var parameters = OpenLayers.Util.getParameters();
            this.setPermalink(parameters);
        }

        // http://code.google.com/apis/earth/documentation/reference/google_earth_namespace.html
        if (!this.ge) {
            google.earth.createInstance(this.body.dom, this.initCallback.createDelegate(this), this.failureCallback.createDelegate(this));
        }
    },

    /** method[setLookAt]
     *  Set the lookAt position.
     *  More documentation in http://code.google.com/apis/earth/documentation/reference/interface_g_e_view.html
     *  :param lat: ``Number`` The latitude of the lookAt position in EPSG:4326
     *  :param lon: ``Number`` The longitude of the lookAt position in EPSG:4326
     *  :param altitude: ``Number`` The altitude of the lookAt position
     *  :param altitudeMode: ``Number`` The altitudeMode to use
     *  :param heading: ``Number`` The heading of the lookAt position
     *  :param tilt: ``Number`` The tfilt of the lookAt position
     *  :param range: ``Number`` The range of the lookAt position
     */
    setLookAt: function (lat, lon, altitude, altitudeMode, heading, tilt, range) {
        if (this.ge) {
            var lookAt = this.ge.createLookAt('');
            lookAt.set(lat,
                    lon,
                    altitude,
                    altitudeMode,
                    heading,
                    tilt,
                    range);
            this.ge.getView().setAbstractView(lookAt);
        }
    },

    /** method[initCallback]
     *  Callback for the creation of the Google Earth Instance
     *  More documentation in http://code.google.com/apis/earth/documentation/reference/google_earth_namespace.html
     *  :param object: ``Object`` The Google Earth Instance
     */
    initCallback: function(object) {
        this.ge = object;

        // Set Google Earth Properties
        this.ge.getWindow().setVisibility(true);

        if (!this.lookAt) {
            this.lookAt = this.map.getCenter();
            this.transformToGE(this.lookAt);
        }

        this.setLookAt(this.lookAt.lat,
                this.lookAt.lon,
                this.altitude,
                this.altitudeMode,
                this.heading,
                this.tilt,
                this.range);

        this.ge.getNavigationControl().setVisibility(this.ge.VISIBILITY_SHOW);
        this.ge.getOptions().setFlyToSpeed(this.ge.SPEED_TELEPORT);
        this.manageLayers();

        // Set the 2D navigation tool
        this.setShow2DNavigationTool(this.show2DNavigationTool);
        this.setClickMode(this.clickMode);
        this.setNavigationMode2D(this.navigationMode2D);

        // Downloads KML
        if (this.kmlUrl) {
            google.earth.fetchKml(this.ge, this.kmlUrl, function(obj) {
                this.ge.getFeatures().appendChild(obj);
            });
        }

        // Use network link
        if (this.networkLinkUrl) {
            if (this.networkLinkUrl.constructor.toString().indexOf("Array") != -1) {
                for (var i = 0; i < this.networkLinkUrl.length; i++) {
                    this.addNetwokLink(this.networkLinkUrl[i]);
                }
            } else {
                this.addNetwokLink(this.networkLinkUrl);
            }
        }

        if (this.layers) {
            for (i = 0; i < this.layers.length; i++) {
                var layer = this.layers[i];
                this.addLayer(layer);
                layer.events.on({
                    "visibilitychanged": this.updateVisibility,
                    scope: this
                });
            }
        }

        // Adds listener to refresh camera and lookAt points on 2D map
        var self = this;
        google.earth.addEventListener(this.ge, "frameend", function() {
            self.onFrameEnd();
        });
    },

    /** method[failureCallback]
     *  Failure callback for the creation of the Google Earth Instance
     *  More documentation in http://code.google.com/apis/earth/documentation/reference/google_earth_namespace.html
     */
    failureCallback: function(errorcode) {
        alert('Google Earth plug in not working: ' + errorcode);
        this.earthAvailable = false;
    },

    /** method[addNetwokLink]
     *  Add a network link to the google earth panel
     *  FIXME there's a typo in this method's name
     *  :param url: ``String`` the href of the kml to add
     */
    addNetwokLink: function(url) {
        var link = this.ge.createLink('');
        link.setHref(url);

        var networkLink = this.ge.createNetworkLink('');
        networkLink.set(link, true, false); // Sets the link, refreshVisibility, and flyToView
        this.ge.getFeatures().appendChild(networkLink);
    },

    /** method[removeNetworkLink]
     *  Remove a network link
     *  :param url: ``String`` the href of the kml to remove
     */
    removeNetworkLink: function(url) {
        var links = this.ge.getFeatures().getChildNodes();
        for (var i = 0; i < links.getLength(); i++) {
            if (links.item(i).getLink().getHref() == url) {
                this.ge.getFeatures().removeChild(links.item(i));
                break;
            }
        }
    },

    /** method[addLayer]
     *  Add a WMS layer supporting KML output format
     *  :param layer: ``OpenLayers.Layer.WMS`` OpenLayers WMS layer
     *  :param order: (optional) ``Number`` Layer order
     */
    addLayer: function(layer, order) {
        if (this.ge) {
            if (layer.CLASS_NAME == 'OpenLayers.Layer.WMS') {
                var name = layer.id;
                var networkLink = null;

                if (this.layerCache[name]) {
                    networkLink = this.layerCache[name];
                } else {
                    var link = this.ge.createLink('kl_' + name);
                    var ows = layer.url;
                    ows = ows.replace(/\?.*/, '');
                    var kmlPath = '/kml?mode=refresh&layers=' + layer.params.LAYERS;
                    link.setHref(ows + kmlPath);
                    networkLink = this.ge.createNetworkLink('nl_' + name);
                    networkLink.setName(name);
                    networkLink.setLink(link);
                    this.layerCache[name] = networkLink;
                }

                networkLink.setVisibility(layer.getVisibility());

                if (order !== undefined && order < this.ge.getFeatures().getChildNodes().getLength()) {
                    this.ge.getFeatures().insertBefore(this.ge.getFeatures().getChildNodes().item(order));
                } else {
                    this.ge.getFeatures().appendChild(networkLink);
                }
            }
        }
    },

    /** private: method[updateVisibility]
     *  Update the visibility of GE layers according to modification in 2D map
     *
     * :param event ``Event`` Event that fired this function
     */
    updateVisibility: function(event) {
        if (!this.ge) {
            return;
        }
        var layer = event.object;
        // Get the network link
        var networkLink = this.layerCache[layer.id];
        if (networkLink) {
            networkLink.setVisibility(layer.getVisibility());
        }
    },

    /** method[setShow2DNavigationTool]
     *  Setter to enable or disable the 2D navigation tool
     *
     * :param state ``Boolean`` New state of 2D navigation tool
     */
    setShow2DNavigationTool: function(state) {
        this.show2DNavigationTool = state;
        if (state) {
            if (this.map) {
                // Vector layer
                this.earthLayer = new OpenLayers.Layer.Vector("Google Earth Navigation");
                this.map.addLayer(this.earthLayer);
                // Camera and lookAt points to display
                this.features = [
                    new OpenLayers.Feature.Vector(null, {role: 'line'}, {strokeColor: '#ff0000',
                        strokeWidth: 3,
                        pointRadius: 6}),
                    new OpenLayers.Feature.Vector(null, {role: 'lookAt'}, {pointRadius: 8,
                        fillColor: '#ff0000'}),
                    new OpenLayers.Feature.Vector(null, {role: 'camera'}, {externalGraphic: this.baseUrl + '/resources/eye.png',
                        graphicHeight: 18,
                        graphicWidth: 31,
                        graphicYOffset: -3,
                        rotation: 0})];

                // Drag control to move camera ans lookAt points
                this.drag = new OpenLayers.Control.DragFeature(this.earthLayer, {
                    earth: this,
                    downFeature: function(pixel) {
                        this.lastPixel = pixel;
                        this.firstPixel = pixel;
                        this.firstGeom = this.feature.geometry;
                    },
                    moveFeature: function(pixel) {
                        if (this.feature === null) {
                            return;
                        }
                        if (this.feature.attributes.role != 'line') {
                            var res = this.map.getResolution();
                            var x = res * (pixel.x - this.firstPixel.x) + this.firstGeom.x;
                            var y = res * (this.firstPixel.y - pixel.y) + this.firstGeom.y;
                            var lonLat = new OpenLayers.LonLat(x, y);

                            if (this.feature.attributes.role == 'lookAt') {
                                this.earth.lookTo(lonLat);
                            } else if (this.feature.attributes.role == 'camera') {
                                this.earth.lookFrom(lonLat);
                            }
                        }
                        this.lastPixel = pixel;
                    }
                });
                this.map.addControl(this.drag);
                this.drag.activate();
            } else {
                this.show2DNavigationTool = false;
            }
        }
        else {
            if (this.map) {
                if (this.drag) {
                    this.drag.deactivate();
                    this.map.removeControl(this.drag);
                    this.map.removeLayer(this.earthLayer);
                    this.earthLayer.destroy();
                    this.features = null;
                }
            } else {
                this.show2DNavigationTool = false;
            }
        }
    },

    /** method[getshow2DNavigationTool]
     *  Getter to get the show2DNavigationTool property
     *
     */
    getshow2DNavigationTool: function() {
        return this.show2DNavigationTool;
    },

    /** method[setClickMode]
     *  Setter to enable or disable the click mode
     *
     * :param state ``Boolean`` New state of click mode
     */
    setClickMode: function(state) {
        this.clickMode = state;
        if (state) {
            if (this.map) {
                this.clickControl = new GeoExt.ux.GoogleEarthClick({
                    handlerOptions: {
                        "single": true
                    },
                    gePanel: this
                });
                this.map.addControl(this.clickControl);
                this.clickControl.activate();
            } else {
                this.clickMode = false;
            }
        } else {
            if (this.map) {
                if (this.clickControl) {
                    this.clickControl.deactivate();
                    this.map.removeControl(this.clickControl);
                }
            } else {
                this.clickMode = false;
            }
        }
    },

    /** method[getClickMode]
     *  Getter to get the clickMode property
     *
     */
    getClickMode: function() {
        return this.clickMode;
    },

    /** method[setNavigationMode2D]
     *  Setter to enable or disable the 2D navigation mode
     *
     * :param state ``Boolean`` New state of navigation mode
     */
    setNavigationMode2D: function(state) {
        this.navigationMode2D = state;
        if (state) {
            if (this.map) {
                this.map.events.on({
                    moveend: this.onMoveEnd,
                    scope: this
                });
            } else {
                this.navigationMode2D = false;
            }
        } else {
            if (this.map) {
                this.map.events.un({
                    move: this.onMoveEnd,
                    scope: this
                });
            } else {
                this.navigationMode2D = false;
            }
        }
    },

    /** method[getNavigationMode2D]
     *  Getter to get the navigationMode2D property
     *
     */
    getNavigationMode2D: function() {
        return this.navigationMode2D;
    },

    /** private:method[manageLayers]
     *  Enable or disable the GE layers
     *
     */
    manageLayers: function() {
        if (this.ge) {
            this.setBuildingsLayer(this.showBuildingsLayer);
            this.setBordersLayer(this.showBordersLayer);
            this.setTerrainLayer(this.showTerrainLayer);
            this.setRoadsLayer(this.showRoadsLayer);
            this.setBuildingsLowResolutionLayer(this.showBuildingsLowResolutionLayer);
        }
    },

    /** method[setBuildingsLayer]
     *  Setter to enable or disable the GE LAYER_BUILDINGS layer
     *
     * :param state ``Boolean`` New state of layer
     */
    setBuildingsLayer: function(state) {
        this.showBuildingsLayer = state;
        if (state) {
            this.ge.getLayerRoot().enableLayerById(this.ge.LAYER_BUILDINGS, true);
        } else {
            this.ge.getLayerRoot().enableLayerById(this.ge.LAYER_BUILDINGS, false);
        }
    },

    /** method[getBuildingsLayer]
     *  Getter to get the showBuildingsLayer property
     *
     */
    getBuildingsLayer: function() {
        return this.showBuildingsLayer;
    },

    /** method[setBordersLayer]
     *  Setter to enable or disable the GE LAYER_BORDERS layer
     *
     * :param state ``Boolean`` New state of layer
     */
    setBordersLayer: function(state) {
        this.showBordersLayer = state;
        if (state) {
            this.ge.getLayerRoot().enableLayerById(this.ge.LAYER_BORDERS, true);
        } else {
            this.ge.getLayerRoot().enableLayerById(this.ge.LAYER_BORDERS, false);
        }
    },

    /** method[getBordersLayer]
     *  Getter to get the showBordersLayer property
     *
     */
    getBordersLayer: function() {
        return this.showBordersLayer;
    },

    /** method[setTerrainLayer]
     *  Setter to enable or disable the GE LAYER_TERRAIN layer
     *
     * :param state ``Boolean`` New state of layer
     */
    setTerrainLayer: function(state) {
        this.showTerrainLayer = state;
        if (state) {
            this.ge.getLayerRoot().enableLayerById(this.ge.LAYER_TERRAIN, true);
        } else {
            this.ge.getLayerRoot().enableLayerById(this.ge.LAYER_TERRAIN, false);
        }
    },

    /** method[getTerrainLayer]
     *  Getter to get the showTerrainLayer property
     *
     */
    getTerrainLayer: function() {
        return this.showTerrainLayer;
    },


    /** method[setRoadsLayer]
     *  Setter to enable or disable the GE LAYER_ROADS layer
     *
     * :param state ``Boolean`` New state of layer
     */
    setRoadsLayer: function(state) {
        this.showRoadsLayer = state;
        if (state) {
            this.ge.getLayerRoot().enableLayerById(this.ge.LAYER_ROADS, true);
        } else {
            this.ge.getLayerRoot().enableLayerById(this.ge.LAYER_ROADS, false);
        }
    },

    /** method[getRoadsLayer]
     *  Getter to get the showRoadsLayer property
     *
     */
    getRoadsLayer: function() {
        return this.showRoadsLayer;
    },

    /** method[setBuildingsLowResolutionLayer]
     *  Setter to enable or disable the GE LAYER_BUILDINGS_LOW_RESOLUTION layer
     *
     * :param state ``Boolean`` New state of layer
     */
    setBuildingsLowResolutionLayer: function(state) {
        this.showBuildingsLowResolutionLayer = state;
        if (state) {
            this.ge.getLayerRoot().enableLayerById(this.ge.LAYER_BUILDINGS_LOW_RESOLUTION, true);
        } else {
            this.ge.getLayerRoot().enableLayerById(this.ge.LAYER_BUILDINGS_LOW_RESOLUTION, false);
        }
    },

    /** method[getBuildingsLowResolutionLayer]
     *  Getter to get the showBuildingsLowResolutionLayer property
     *
     */
    getBuildingsLowResolutionLayer: function() {
        return this.showBuildingsLowResolutionLayer;
    },

    /** private: method[transformToGE]
     *  Transform a map position to a GE position. Position is modified, no return value.
     *
     * :param geLonLat ``OpenLayers.LonLat`` Map position
     */
    transformToGE: function(lonLat) {
        lonLat.transform(this.map.getProjectionObject(),
                this.geProjection);
    },

    /** private: method[transformFromGE]
     *  Transform a GE position to a map position. Position is modified, no return value.
     *
     * :param geLonLat ``OpenLayers.LonLat`` GE position
     */
    transformFromGE: function(geLonLat) {
        geLonLat.transform(this.geProjection,
                this.map.getProjectionObject());
    },

    /** method[getPermalink]
     *  Create the permalink
     *
     * :param complete ``Boolean`` Defines if the complete URL is generated or only the parameters KVP
     */
    getPermalink: function(complete) {
        var permalink;
        if (complete) {
            permalink = window.location.href;
            if (OpenLayers.String.contains(permalink, '?')) {
                var end = permalink.indexOf('?');
                permalink = permalink.substring(0, end);
            }
            permalink = permalink + "?";
        } else {
            permalink = '';
        }
        var lookAt = this.ge.getView().copyAsLookAt(this.altitudeMode);

        permalink = permalink + "gelookAtLatitude=" + lookAt.getLatitude();
        permalink = permalink + "&gelookAtLongitude=" + lookAt.getLongitude();
        permalink = permalink + "&gerange=" + lookAt.getRange();
        permalink = permalink + "&getilt=" + lookAt.getTilt();
        permalink = permalink + "&geheading=" + lookAt.getHeading();
        permalink = permalink + "&gealtitude=" + lookAt.getAltitude();
        permalink = permalink + "&gealtitudeMode=" + lookAt.getAltitudeMode();
        permalink = permalink + "&geshowBordersLayer=" + this.showBordersLayer;
        permalink = permalink + "&geshowTerrainLayer=" + this.showTerrainLayer;
        permalink = permalink + "&geshowRoadsLayer=" + this.showRoadsLayer;
        permalink = permalink + "&geshowBuildingsLayer=" + this.showBuildingsLayer;
        permalink = permalink + "&geshowBuildingsLowResolutionLayer=" + this.showBuildingsLowResolutionLayer;
        permalink = permalink + "&geshow2DNavigationTool=" + this.show2DNavigationTool;
        permalink = permalink + "&genavigationMode2D=" + this.navigationMode2D;
        permalink = permalink + "&genavigationMode3D=" + this.navigationMode3D;
        permalink = permalink + "&geclickMode=" + this.clickMode;
        if (this.map) {
            permalink = permalink + "&geeasting=" + this.map.getCenter().lon;
            permalink = permalink + "&genorthing=" + this.map.getCenter().lat;
            permalink = permalink + "&gezoom=" + this.map.getZoom();
        }
        return permalink;
    },

    /** private: method[setPermalink]
     *  Set the permalink according to the url parameters
     *
     * :param parameters URL paramaters
     */
    setPermalink: function(parameters) {
        if (parameters.geeasting && parameters.genorthing) {
            var position = new OpenLayers.LonLat(parseFloat(parameters.geeasting), parseFloat(parameters.genorthing));
            if (this.map) {
                this.map.setCenter(position);
            }
        }
        if (parameters.gezoom) {
            if (this.map) {
                this.map.zoomTo(parseInt(parameters.gezoom, 10));
            }
        }
        if (parameters.gelookAtLatitude && parameters.gelookAtLongitude) {
            this.lookAt = new OpenLayers.LonLat(parseFloat(parameters.gelookAtLongitude), parseFloat(parameters.gelookAtLatitude));
        }
        if (parameters.gealtitude) {
            this.altitude = parseFloat(parameters.gealtitude);
        }
        if (parameters.geheading) {
            this.heading = parseFloat(parameters.geheading);
        }
        if (parameters.getilt) {
            this.tilt = parseFloat(parameters.getilt);
        }
        if (parameters.gerange) {
            this.range = parseFloat(parameters.gerange);
        }
        if (parameters.gealtitudeMode) {
            this.altitudeMode = parseInt(parameters.gealtitudeMode, 10);
        }
        if (parameters.geshowBordersLayer) {
            this.showBordersLayer = this.stringToBoolean(parameters.geshowBordersLayer);
        }
        if (parameters.geshowTerrainLayer) {
            this.showTerrainLayer = this.stringToBoolean(parameters.geshowTerrainLayer);
        }
        if (parameters.geshowRoadsLayer) {
            this.showRoadsLayer = this.stringToBoolean(parameters.geshowRoadsLayer);
        }
        if (parameters.geshowBuildingsLayer) {
            this.showBuildingsLayer = this.stringToBoolean(parameters.geshowBuildingsLayer);
        }
        if (parameters.geshowBuildingsLowResolutionLayer) {
            this.showBuildingsLowResolutionLayer = this.stringToBoolean(parameters.geshowBuildingsLowResolutionLayer);
        }
        if (parameters.geshow2DNavigationTool) {
            this.show2DNavigationTool = this.stringToBoolean(parameters.geshow2DNavigationTool);
        }
        if (parameters.genavigationMode2D) {
            this.navigationMode2D = this.stringToBoolean(parameters.genavigationMode2D);
        }
        if (parameters.genavigationMode3D) {
            this.navigationMode3D = this.stringToBoolean(parameters.genavigationMode3D);
        }
        if (parameters.geclickMode) {
            this.clickMode = this.stringToBoolean(parameters.geclickMode);
        }
        if (this.ge) {
            google.earth.createInstance(this.body.dom, this.initCallback.createDelegate(this), this.failureCallback.createDelegate(this));
        } else {
            if (this.lookAt) {
                this.setLookAt(this.lookAt.lat,
                        this.lookAt.lon,
                        this.altitude,
                        this.altitudeMode,
                        this.heading,
                        this.tilt,
                        this.range);
            }
        }
    },

    /** private: method[stringToBoolean]
     *  Transform a string (true, false, yes, no 1 or 0) to a boolean
     *
     * :param string
     */
    stringToBoolean: function(string) {
        switch (string.toLowerCase()) {
            case "true": case "yes": case "1": return true;
            case "false": case "no": case "0": case null: return false;
            default: return Boolean(string);
        }
    },

    /** private: method[beforeDestroy]
     *  Destroy GE and 2D tools
     *
     */
    beforeDestroy: function() {
        this.setShow2DNavigationTool(false);
        this.setClickMode(false);
        this.setNavigationMode2D(false);
        if (this.ge) {
            google.earth.removeEventListener(this.ge, "frameend", function() {
                self.onFrameEnd();
            });
            this.ge.getNavigationControl().setVisibility(this.ge.VISIBILITY_HIDE);
        }
        GeoExt.ux.GoogleEarthPanel.superclass.beforeDestroy.apply(this, arguments);
    },

    /** private: method[onMoveEnd]
     *  Update GE at the end of a 2D move
     *
     */
    onMoveEnd: function() {
        this.lookTo(this.map.getCenter());
    },

    /** private: method[onFrameEnd]
     *  Update 2D at the end of a GE move
     *
     */
    onFrameEnd: function() {
        var lookAt = this.ge.getView().copyAsLookAt(this.altitudeMode);
        this.lookAt = new OpenLayers.LonLat(lookAt.getLongitude(), lookAt.getLatitude());
        this.range = lookAt.getRange();
        this.til = lookAt.getTilt();
        this.heading = lookAt.getHeading();
        this.altitude = lookAt.getAltitude();
        this.altitudeMode = lookAt.getAltitudeMode();
        if (this.map && this.show2DNavigationTool) {
            this.refreshNavigation2DTool();
        }
        if (this.map && this.navigationMode3D) {
            this.transformFromGE(this.lookAt);
            this.map.setCenter(this.lookAt);
        }
    },

    /** private: method[lookFrom]
     *  Changes GE look at position
     *
     * :param lonlat ``OpenLayers.LonLat`` Look at position.
     */
    lookTo: function(lonLat) {
        if (!this.ge) {
            return;
        } else {
            if (this.ge.getNavigationControl().getVisibility() == this.ge.VISIBILITY_SHOW) {
                this.transformToGE(lonLat);
                var lookAt = this.ge.getView().copyAsLookAt(this.altitudeMode);
                lookAt.setLongitude(lonLat.lon);
                lookAt.setLatitude(lonLat.lat);
                this.ge.getView().setAbstractView(lookAt);
            }
        }
    },

    /** private: method[lookFrom]
     *  Changes GE position
     *
     * :param lonlat ``OpenLayers.LonLat`` Camera position.
     */
    lookFrom: function(lonLat) {
        if (!this.ge) {
            return;
        }

        // Gets current lookAt position
        var lookAt = this.ge.getView().copyAsLookAt(this.altitudeMode);
        var geLonLat = new OpenLayers.LonLat(lookAt.getLongitude(),
                lookAt.getLatitude());

        // Computes distance between lookAt and camera for range computation
        var lonLatTmp = lonLat.clone();
        this.transformToGE(lonLatTmp);
        var dist = OpenLayers.Util.distVincenty(lonLatTmp, geLonLat) * 1000;

        // Computes rotation
        this.transformFromGE(geLonLat);
        var rot = (180 / Math.PI) * Math.atan((geLonLat.lon - lonLat.lon) / (geLonLat.lat - lonLat.lat));
        if (geLonLat.lat < lonLat.lat) {
            rot = rot + 180;
        }
        lookAt.setHeading(rot);

        // Computes range
        var tilt = lookAt.getTilt();
        var range = dist / Math.sin(tilt / (180 / Math.PI));
        lookAt.setRange(range);

        this.ge.getView().setAbstractView(lookAt);
    },

    /** private: method[getCameraPosition]
     *  Get the Camera Position as ``OpenLayers.LonLat`` in Google Earth Coordinate System
     *
     *  :return: ``OpenLayers.LonLat`` Camera position.
     */
    getCameraPosition: function() {
        if (this.ge) {
            var camera = this.ge.getView().copyAsCamera(this.altitudeMode);
            return new OpenLayers.LonLat(camera.getLongitude(), camera.getLatitude());
        }
    },

    /** private: method[getLookAtPosition]
     *  Get the LookAt Position as ``OpenLayers.LonLat`` in Google Earth Coordinate System
     */
    getLookAtPosition: function() {
        if (this.ge) {
            var lookAt = this.ge.getView().copyAsLookAt(this.altitudeMode);
            return new OpenLayers.LonLat(lookAt.getLongitude(), lookAt.getLatitude());
        }
    },

    /** private: method[refreshNavigation2DTool]
     *  Refreshes navigation tool in 2D map.
     */
    refreshNavigation2DTool: function() {
        if (!this.ge) {
            return;
        }

        // Gets current camera and lookAt positions
        var pl = this.getLookAtPosition();
        this.transformFromGE(pl);
        var pc = this.getCameraPosition();
        this.transformFromGE(pc);

        // Refresh map only if camera has moved
        if (this.pl && this.pc) {
            if (this.pl.lat == pl.lat && this.pl.lon == pl.lon && this.pc.lat == pc.lat && this.pc.lon) {
                return;
            } else {
                this.pl = pl;
                this.pc = pc;
            }
        } else {
            this.pl = pl;
            this.pc = pc;
        }

        // Computes new features positions
        this.earthLayer.removeFeatures(this.features);
        this.features[0].geometry =
        new OpenLayers.Geometry.LineString([new OpenLayers.Geometry.Point(pl.lon, pl.lat),
            new OpenLayers.Geometry.Point(pc.lon, pc.lat)]);
        this.features[1].geometry = new OpenLayers.Geometry.Point(pl.lon, pl.lat);
        this.features[2].geometry = new OpenLayers.Geometry.Point(pc.lon, pc.lat);

        // Computes eye orientation
        if (pl.lon == pc.lon) {
            this.features[2].style.rotation = 0;
        } else {
            var rot = (180 / Math.PI) * Math.atan((pl.lon - pc.lon) / (pl.lat - pc.lat));
            if (pl.lat > pc.lat) {
                this.features[2].style.rotation = rot + 180;
            } else {
                this.features[2].style.rotation = rot;
            }
        }

        this.earthLayer.addFeatures(this.features);
    }
});

/** api: xtype = gxux_googleearthpanel */
Ext.reg('gxux_googleearthpanel', GeoExt.ux.GoogleEarthPanel);
