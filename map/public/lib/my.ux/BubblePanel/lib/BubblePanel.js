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

    /** private: property[stateEvents]
     *  ``Array(String)`` Array of state events
     */
    stateEvents: ["collapse", "expand"],
    
    /** private property[bubbleList]
     *  ``Map(String, Panel)`` Map of bubble
     */
    bubbleList: {},

    /** private: method[constructor]
     *  Construct the component.
     */
    constructor: function(list, end, config) {
        config = config ? config : {};
        config = Ext.apply({stateId: "bubble"}, config);
		My.ux.BubblePanel.superclass.constructor.call(this, Ext.apply(
            this.buildElementsTree(list, end, config), config));

        this.addEvents(
            /** private: event[collapse]
             *  Fires after child will be collapsed.
             */
            "collapse",

            /** private: event[expand]
             *  Fires after child will be expanded.
             */
            "expand"
        );
	},
    
	buildElementsTree: function(list, end, config) {
		if (list.length === 0) {
			end.region = "center";
			end.border = false;
			return end;
		}
		else {
			element = Ext.apply({
				layout: 'fit',
				region: 'north',
				animCollapse: false,
				border: false,
				hideCollapseTool: true,
				collapseMode: "mini"
			}, list[0]);
			if (config.stateId && element.name) {
				var state = Ext.state.Manager.get(config.stateId);
				if (state && state[element.name]) {
					element.collapsed = state[element.name] == 'false';
				}
			}

			title = element.title;
			delete element.title;
			list.shift();
			
			var content = new Ext.Panel(element);
            this.bubbleList[element.name] = content;
			content.addListener('collapse', function(panel) { 
                this.fireEvent("collapse", panel);
			}, this);
			content.addListener('expand', function(panel) { 
                this.fireEvent("expand", panel);
			}, this);
			var title = new Ext.Button({
				region: 'north',
				text: title,
				cls: 'bubble',
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
					items: [content, this.buildElementsTree(list, end, config)]
				}]
			}
		}
	},

    /** private: method[getState]
     *  :return:  ``Object`` The state.
     *
     *  Returns the current state for the map panel.
     */
    getState: function() {
        var state = {};

        for (name in this.bubbleList) {
			if (this.bubbleList[name]) {
				state[name] = !this.bubbleList[name].collapsed;
			}
        }

        return state;
    }
});
