Ext.onReady(function() {
    new My.ux.BubblePanel([{
            baseCls: "x-plane",
            title: "First bubble",
            height: 100,
            html: "some text"
        },
        {
            baseCls: "x-plane",
            title: "Segond bubble",
            height: 100,
            html: "close by default",
            collapsed: true
        }],
        {
            baseCls: "x-plane",
            html: "a footer"
        },
        {
            renderTo: "bubble",
            cls: "bubble-panel",
            height: 400,
            width: 200
        });
});
