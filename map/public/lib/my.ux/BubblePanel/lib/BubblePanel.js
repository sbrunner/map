/**
 * Copyright (c) 2008-2009 The Open Source Geospatial Foundation
 *
 * Published under the BSD license.
 * See http://svn.geoext.org/core/trunk/geoext/license.txt for the full text
 * of the license.
 */
 
Ext.namespace('My.ux');

/** api: constructor
 *  .. class:: LayerCatalogue(config)
 *
 *  A panel showing legends of all layers in a layer store.
 *  Depending on the layer type, a legend renderer will be chosen.
 */
My.ux.BubblePanel = Ext.extend(Ext.Panel, {

    /** private: method[constructor]
     *  Construct the component.
     */
    constructor: function(list, end) {
		My.ux.BubblePanel.superclass.constructor.call(this, this.buildElementsTree(list, end));
	},
	
	buildElementsTree: function(list, end) {
		if (list.length === 0) {
			end.region = "center";
			end.border = false;
			return end;
		}
		else {
			element = list[0];
			element.layout = 'fit';
			element.region = 'north';
			element.animCollapse = false;
			element.border = false;
			element.hideCollapseTool = true;
			element.collapseMode = "mini";
			element.collapsed = !getBooleanValue(permalinkProvider.state.a['o_' + element.name], false);

			title = element.title;
			delete element.title;
			list.shift();
			
			var content = new Ext.Panel(element);
			content.addListener('collapse', function() { 
				permalinkProvider.state.a['o_' + this.name] = false; 
				onStatechange(permalinkProvider); 
			}, element);
			content.addListener('expand', function() { 
				permalinkProvider.state.a['o_' + this.name] = true; 
				onStatechange(permalinkProvider); 
			}, element);
			var title = new Ext.Button({
				region: 'north',
				html: '<h2>' + title + '</h2>',
				style: "padding: 4px 8px;",
				enableToggle: true,
				handler: function() {
					if (this.collapsed) {
						this.expand();
					}
					else {
						this.collapse();
					}
				},
				scope: content
			});
			
			return {
				region: 'center',
				layout: 'border',
				border: false,
				style: "border-top: solid 1px #99BBE8;",
				items: [title,
				{
					region: 'center',
					layout: 'border',
					border: false,
					items: [content, this.buildElementsTree(list, end)]
				}]
			}
		}
	}
});
