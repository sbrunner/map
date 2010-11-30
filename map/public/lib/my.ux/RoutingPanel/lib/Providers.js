/**
 * Copyright (c) 2008-2009 The Open Source Geospatial Foundation
 *
 * Published under the BSD license.
 * See http://svn.geoext.org/core/trunk/geoext/license.txt for the full text
 * of the license.
 */
 
Ext.namespace('GeoExt.ux');

GeoExt.ux.cloudmadeRoutingService = function (options, type, start, end, catchResult, scope) {
    var newUrl = start.y + ',' + start.x + ',' + end.y + ',' + end.x + "/" + type + ".js?lang=" + OpenLayers.Lang.getCode();
    var proxy = new Ext.data.ScriptTagProxy({
        url: "http://routes.cloudmade.com/" + options.cloudmadeKey + "/api/0.3/" + newUrl,
        nocache: false
    });
    var routingStore = new Ext.data.Store({
        proxy: proxy,
        reader: new Ext.data.JsonReader({
            root: 'version',
            fields: [
                {
                    name: 'total_length'
                }
            ]

        })
    });

    routingStore.on('load', function (store) {
        var version = store.reader.jsonData.version;
        var status = store.reader.jsonData.status;
        
        var statusMessage = null;
        var routeSummary = null;
        var routeGeometry = null;
        var routeInstructions = null;
        
        if (store.reader.jsonData.status_message) {
            statusMessage = store.reader.jsonData.status_message;
        }
        if (store.reader.jsonData.route_summary) {
            routeSummary = store.reader.jsonData.route_summary;
        }
        if (store.reader.jsonData.route_geometry) {
            routeGeometry = store.reader.jsonData.route_geometry;
        }
        if (store.reader.jsonData.route_instructions) {
            routeInstructions = store.reader.jsonData.route_instructions;
        }
        if (status == '0') {
            var instructions = '';
            var first = true;
            for (var i = 0 ; i < routeInstructions.length ; i++) {
                if (first) { 
                    first = false;
                }
                else { 
                    instructions += '<br />';
                }
                instructions += routeInstructions[i][0] + ' (' + routeInstructions[i][4] + ').';
            }
            
            var html = '<p>' + instructions + '</p><p>' + OpenLayers.i18n('Total length: ') + Math.round(routeSummary.total_distance / 1000) + ' km</p>';

            var pointList = [];
            for (var i = 0; i < routeGeometry.length; i++) {
                var newPoint = new OpenLayers.Geometry.Point(routeGeometry[i][1],
                        routeGeometry[i][0]);
                pointList.push(newPoint);
            }
            var geometry = new OpenLayers.Geometry.LineString(pointList);

            catchResult.call(scope, true, html, [new OpenLayers.Feature.Vector(geometry)]);
        } 
        else {
            catchResult.call(scope, false, statusMessage, null);
        }
    }, this);
    routingStore.load();
}

GeoExt.ux.RoutingProviders = {
	cloudmadeSearchCombo: function (options) {
		var maxRows = options.maxRows ? options.maxRows : 10; 
		var url = 'http://geocoding.cloudmade.com/' + options.cloudmadeKey + '/geocoding/v2/find.js?results=' + maxRows + '&return_geometry=false';
		
		options = Ext.apply({
			emptyText: OpenLayers.i18n('Search location in Cloudmade'),
			loadingText: OpenLayers.i18n('Search in Cloudmade...'),
			minChars: 1,
			queryDelay: 50,
			hideTrigger: true,
			charset: 'UTF8',
			forceSelection: true,
			displayField: 'name',
			queryParam: 'query',
			tpl: '<tpl for="."><div class="x-combo-list-item"><h3>{name}</h3>{is_in}</div></tpl>',
			store: new Ext.data.Store({
				proxy: new Ext.data.ScriptTagProxy({
					url: url,
					method: 'GET'
				}),
				reader: new Ext.data.JsonReader({
					totalProperty: "found",
					root: "features",
					fields: [{
						name: 'is_in',
						mapping: 'properties.is_in'
					},
					{
						name: 'name',
						mapping: 'properties.name'
					},
					{
						name: 'centroid'
					}]
				})
			})
		}, options);
		var box =  new Ext.form.ComboBox(options);
		
		if (box.zoom > 0) {
			box.on("select", function (combo, record, index) {
				var coordinates = record.data.centroid.coordinates;
				var position = new OpenLayers.LonLat(coordinates[1], coordinates[0]);
				position.transform(
					new OpenLayers.Projection("EPSG:4326"),
					this.map.getProjectionObject()
				);
				this.map.setCenter(position, this.zoom);
			}, box);
		}
		
		return box;
	},

	getCloudmadeRoutingProvider: function(cloudmadeKey) {
		return {
			service: GeoExt.ux.cloudmadeRoutingService,
			cloudmadeKey: cloudmadeKey,
			projection: new OpenLayers.Projection("EPSG:4326"),
			types: {
				car: { name: OpenLayers.i18n('By car') },
				foot: { name: OpenLayers.i18n('By foot') },
				bicycle: { name: OpenLayers.i18n('By bicycle') }
			}
		}
	},
	
	getSbrunnerRoutingProvider: function() {
		return {
			service : GeoExt.ux.RoutingProviders.sbrunnerRoutingService,
			projection: new OpenLayers.Projection("EPSG:4326"),
			types: {citybike : { name: OpenLayers.i18n('Bike (ele)') } }
		};
	},
	
	sbrunnerRoutingService: function(options, type, start, end, catchResult, scope) {
		var newUrl = "source=" + start + "&target=" + end + "&lang=" + OpenLayers.Lang.getCode();
		var proxy = new Ext.data.ScriptTagProxy({
			url: "http://localhost:5000/routing?" + newUrl,
	//        url: isDev ? ("http://192.168.1.4/wsgi/routing?" + newUrl) : ("http://stephanebrunner.dyndns.org:5000/wsgi/routing?" + newUrl),
			nocache: false
		});
		
		var reader = new Ext.data.DataReader();
		reader.geojsonReader = new OpenLayers.Format.GeoJSON();
		reader.readResponse = function(action, response) {
			var data = this.geojsonReader.read(response);
			
			var distance = null;
			var time = null;
			var hours = null;
			var minutes = null;
			var instructions = '';
			var features = data.pop().data
			
			if (features.distance) {
				distance = features.distance;
			}
			var first = true;
			for (var i = 0 ; i < data.length ; i++) {
				var d = data[i].attributes;
				if (first) { 
					first = false;
	//                instructions += '<hr /><p>';
				}
				else { 
	//                instructions += '<br />';
				}
				d.speed = d.waylength / d.time * 3600;
				d.speed = Math.round(d.speed * 10) / 10;
				d.elevation = Math.abs(d.elevation);
				d.decinivite = Math.round(d.elevation / d.waylength / 10) + "&nbsp;%";
				d.elevation = Math.round(d.elevation) + "&nbsp;m";
				d.waylength = (Math.round(d.waylength * 100) / 100) + "&nbsp;km";
				
				time = d.time;
				minutes = Math.floor(time / 60);
				seg = Math.round(time % 60);
				if (seg < 10) {
					seg = '0'+seg;
				}
				d.time = minutes+'.'+seg+'&nbsp;min.s';

	//            d.denivele = d.elevation / d.waylength / 10;
				var instruction = d.name + ' (' + /*d.time + ', ' 
						+ d.waylength + ', ' 
						+ d.elevation + ', ' */
						+ d.speed + "&nbsp;km/h" + ')';
				d.instruction = instruction;
	//            instructions += instruction;
			}
	//        instructions += '</p>';

			if (features.time) {
				time = features.time;
				hours = Math.floor(time / 3600);
				minutes = Math.round((time / 60) % 60);
				if (minutes < 10) {
					minutes = '0'+minutes;
				}
			}
			
			var html = '<p>' + OpenLayers.i18n('Total length: ') + Math.round(distance * 100) / 100 + ' km</p>'
					+ '<p>' + OpenLayers.i18n('Total time: ') + hours + 'h' + minutes + '</p>'
					+ instructions + '<hr />';

			catchResult.call(scope, true, html, data);
		}

		proxy.doRequest('', null, {}, reader);
	}
} 
