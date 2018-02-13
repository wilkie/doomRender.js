function initDoomRenderCanvasRenderCache(context) {
  /**
   * Constructor
   */

  var RenderCache = context.DoomRender.Canvas.RenderCache = function(width, height) {
    var self = this;

    self._cache = {};
    self._canvases = [];

    return self;
  };

  RenderCache.prototype.createCanvas = function(width, height, key) {
    var canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    this._cache[key] = canvas;
    this._canvases.push(canvas);

    return canvas;
  };

  RenderCache.prototype.canvasExists = function(key) {
    return (key in this._cache);
  };

  RenderCache.prototype.lookupCanvas = function(key) {
    return this._cache[key];
  }
}
