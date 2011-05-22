/**
 * Copyright (c) 2008-2010 The Open Source Geospatial Foundation
 * 
 * Published under the BSD license.
 * See http://svn.geoext.org/core/trunk/geoext/license.txt for the full text
 * of the license.
 */

/*
 * @include App/Map.js
 * @include App/LayerTree.js
 * @include App/layers.js
 * @include App/utils.js
 * 
 * @include OpenLayers/Util.js
 * @include OpenLayers/Lang.js
 * @include OpenLayers/Map.js
 * @include OpenLayers/Format/JSON.js
 * 
 * @include GeoExt/widgets/MapPanel.js
 * @include GeoExt/widgets/tree/LayerContainer.js
 * @include GeoExt/widgets/tree/LayerLoader.js
 * @include GeoExt/state/PermalinkProvider.js
 * 
 * @include OpenLayers/Location.js
 * @include OpenLayers/Control/Navigation.js
 */

/*
 * This file represents the application's entry point. 
 * OpenLayers and Ext globals are set, and the page
 * layout is created.
 */

var code = (OpenLayers.Util.getBrowserName() == "msie") ? navigator.userLanguage : navigator.language;
var lang = code.substring(0, 2);
if (!contains(['en', 'fr'], lang)) {
    lang = "en";
}
document.write("<script type=\"text/javascript\" src=\"build/" + lang + ".js\"></script>");
document.write('<meta HTTP-EQUIV="Content-Language" CONTENT="' + lang + '" />');
delete code;

var mapPanel;

window.onload = function() {
    if (!OpenLayers.Lang[lang]) {
        OpenLayers.Lang[lang] = OpenLayers.Util.applyDefaults({});
    }
    OpenLayers.Lang.setCode(lang);
    delete lang;

    /*
     * Setting of OpenLayers global vars.
     */
    OpenLayers.Number.thousandsSeparator = ' ';
    OpenLayers.IMAGE_RELOAD_ATTEMPTS = 3;
	OpenLayers.ImgPath = "http://map.stephane-brunner.ch/app/images/oltheme/";

    if (isDev) {
        document.title = "Dev - " + OpenLayers.i18n("Various OSM map");
    }
    else {
        document.title = OpenLayers.i18n("Various OSM map");
    }

    /*
     * Setting of Ext global vars.
     */
    Ext.QuickTips.init();

    // set a permalink provider
    var indexQ = window.location.href.indexOf("?");
    var indexS = window.location.href.indexOf("#");
    if (indexQ > 0) {
        if (indexS > 0) {
            permalinkTitleBase = window.location.href.substring(0, indexS + 1);
        } else {
            permalinkTitleBase = window.location.href;
        }
        permalinkBase = permalinkTitleBase.substring(0, indexQ) + "#";
    }
    else if (indexS > 0) {
        permalinkTitleBase = window.location.href.substring(0, indexS + 1);
        permalinkBase = permalinkTitleBase.substring(0, indexS + 1);
    }
    else {
        permalinkTitleBase = window.location.href + "#";
        permalinkBase = permalinkTitleBase + "#";
    }
    
    GeoExt.state.PermalinkProvider.prototype.readURL = function(url) {
        var state = {};
        url = url || window.location.href; 
        var params = OpenLayers.Util.getParameters(url);

        // If we have an chchor in the url use it to split the url 
        var index = url.indexOf('#'); 
        if (index > 0) { 
            // create an url to parce on the getParameters 
            url = '?' + url.substring(index + 1, url.length); 
 
            OpenLayers.Util.extend(params, OpenLayers.Util.getParameters(url)); 
        }
        
        var k, split, stateId;
        for(k in params) {
            if(params.hasOwnProperty(k)) {
                split = k.split("_");
                if(split.length > 1) {
                    stateId = split[0];
                    state[stateId] = state[stateId] || {};
                    state[stateId][split.slice(1).join("_")] = this.encodeType ?
                        this.decodeValue(params[k]) : params[k];
                }
            }
        }
        return state;
    }
    permalinkProvider = new GeoExt.state.PermalinkProvider({encodeType: false });
    Ext.state.Manager.setProvider(permalinkProvider);

    permalinkProvider.on({statechange: onStatechange});
    
    /*
     * Initialize the application.
     */
    mapPanel = (new App.Map({
        region: "center"
    }));

    // the viewport
    Ext.get("waiting").hide();
    
    mainPanel = new Ext.Viewport({
        layout: "fit",
        hideBorders: true,
        items: [{
            layout: "border",
            deferredRender: false,
            items: [mapPanel]
        }]
    });

    mapPanel.map.addControl(new OpenLayers.Control.PermalinkLayer("permalink.potlatch", "http://www.openstreetmap.org/edit"));
    mapPanel.map.addControl(new OpenLayers.Control.PermalinkLayer("permalink.osm", "http://openstreetmap.org"));
    mapPanel.map.addControl(new OpenLayers.Control.PermalinkLayer("permalink.amenity.editor", " http://ae.osmsurround.org/"));
    mapPanel.map.addControl(new OpenLayers.Control.PermalinkLayer("permalink.keepright", "http://keepright.ipax.at/report_map.php"));
    mapPanel.map.addControl(new OpenLayers.Control.PermalinkLayer("permalink.osmose", "http://osmose.openstreetmap.fr/map/cgi-bin/index.py"));
    mapPanel.map.addControl(new OpenLayers.Control.PermalinkLayer("permalink.restrictions", "http://osm.virtuelle-loipe.de/restrictions/"));
    mapPanel.map.addControl(new OpenLayers.Control.PermalinkLayer("permalink.geofabrik", "http://tools.geofabrik.de/map/?type=Geofabrik"));
    mapPanel.map.addControl(new OpenLayers.Control.PermalinkLayer("permalink.osb", "http://openstreetbugs.schokokeks.org/"));
    mapPanel.map.addControl(new OpenLayers.Control.PermalinkLayer("permalink.qsm", "http://www.qualitystreetmap.org/osmqa/"));
    mapPanel.map.addControl(new OpenLayers.Control.PermalinkLayer("permalink.maxspeed", "http://maxspeed.osm.lab.rfc822.org/", "B0TF"));
    mapPanel.map.addControl(new OpenLayers.Control.PermalinkLayer("permalink.refuges", "http://refuges.info/nav.php?choix_layer=OSM"));
    mapPanel.map.addControl(new OpenLayers.Control.PermalinkLayer("permalink.browser", "http://www.openstreetbrowser.org/"));
    mapPanel.map.addControl(new OpenLayers.Control.PermalinkLayer("permalink.letuffe", "http://beta.letuffe.org/"));
    mapPanel.map.addControl(new OpenLayers.Control.PermalinkLayer("permalink.wheelmap", "http://wheelmap.org/"));
    mapPanel.map.addControl(new OpenLayers.Control.PermalinkLayer("permalink.kikebike", "http://hikebikemap.de/"));
    mapPanel.map.addControl(new OpenLayers.Control.PermalinkLayer("permalink.velo", "http://osm.t-i.ch/bicycle/map/"));
    mapPanel.map.addControl(new OpenLayers.Control.PermalinkLayer("permalink.osv", "http://openstreetview.org/"));
    mapPanel.map.addControl(new OpenLayers.Control.PermalinkLayer("permalink.ocm", "http://toolserver.org/~stephankn/cuisine/"));
    mapPanel.map.addControl(new OpenLayers.Control.PermalinkLayer('permalink.playground', 'http://toolserver.org/~stephankn/playground/?layers=BT'));
    mapPanel.map.addControl(new OpenLayers.Control.PermalinkLayer('permalink.rsr', 'http://www.rollstuhlrouting.de/routenplaner.html?layers=B0TTTTFFFF'));
    mapPanel.map.addControl(new OpenLayers.Control.PermalinkLayer('permalink.rsk', 'http://www.rollstuhlkarte.ch/?layers=B00000FFTTFFFFFFT'));
    mapPanel.map.addControl(new OpenLayers.Control.PermalinkLayer('permalink.hist', 'http://www.histosm.org/'));
    mapPanel.map.addControl(new OpenLayers.Control.PermalinkLayer('permalink.post', 'http://post.openstreetmap.de/?layers=BTTTT'));
};
