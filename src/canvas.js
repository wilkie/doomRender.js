function initDoomRenderCanvas(context) {
  /**
   * Constructor
   */

  var Canvas = context.DoomRender.Canvas = function() {
    var self = this;

    return self;
  };

  // Initialize subclasses
  initDoomRenderCanvasRenderer(context);
  initDoomRenderCanvasTextureSheet(context);
  initDoomRenderCanvasRenderCache(context);
}
