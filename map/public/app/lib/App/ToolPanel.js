/**
 * Class ToolWindow
 * An {Ext.Window} with specific configuration
 */
Ext.namespace('App');
App.ToolWindow = function(config) {

    this.renderTo = Ext.getBody();
    this.closeAction = 'hide';
    this.unstyled = true;
    this.resizable = false;
    this.shadow = false;
    this.cls = 'toolwindow';
    // call parent constructor
    App.ToolWindow.superclass.constructor.call(this, config);
};
Ext.extend(App.ToolWindow, Ext.Window, {});

/**
 * Class ToolButton
 * An {Ext.Button} with specific configuration
 *
 * This type of button takes at least the following config options:
 * window : a {App.ToolButton} to show when the button is clicked.
 */
Ext.namespace('App');
App.ToolButton = function(config) {
    // call parent constructor
    App.ToolButton.superclass.constructor.call(this, config);
};
Ext.extend(App.ToolButton, Ext.Button, {
    initComponent: function() {
        App.ToolButton.superclass.initComponent.call(this, arguments);

        this.on('toggle', function(button) {
            if (button.pressed) {
                this.window.show();
                // we suppose the button is in a toolbar
                var toolbar = this.ownerCt;
                this.window.anchorTo(toolbar.getEl(), 'tr-br');
            } else {
                this.window.hide();
            }
        }, this);
        this.window.on('hide', function() {
            this.toggle(false);
        }, this);
    }
});

function toolBuilder(name, panel) {
    var window = new App.ToolWindow({
        title: name,
        items: [panel],
//        style: "left: auto; right: 0;"
        labelStyle: "padding: 2px;"
    });
    var button = new App.ToolButton(
        new Ext.Action({
            text: name,
            enableToggle: true,
            toggleGroup: 'mode',
            window: window,
            panel: panel
        })
    );
    return button;
}
