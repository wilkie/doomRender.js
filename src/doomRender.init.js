/*globals initDoomRenderCore*/
/*globals initDoomRenderCanvas*/
/*globals initDoomRenderCanvasRenderer*/
/*globals initDoomRenderCanvasTextureSheet*/
/*globals initDoomRenderWorld*/
/*globals initDoomRenderViewport*/
/*globals initDoomRenderCanvasRenderCache*/

var initDoomRender = function (context) {
  initDoomRenderCore(context);
  initDoomRenderCanvas(context);
  initDoomRenderCanvasRenderer(context);
  initDoomRenderCanvasTextureSheet(context);
  initDoomRenderWorld(context);
  initDoomRenderViewport(context);
  initDoomRenderCanvasRenderCache(context);

  return context.initDoomRender;
};

if (typeof define === 'function' && define.amd) {
  // Expose initDoomRender as an AMD module if it's loaded with RequireJS or
  // similar.
  define(function () {
    return initDoomRender({});
  });
} else {
  // Load initDoomRender normally (creating a initDoomRender global) if not using an AMD
  // loader.
  initDoomRender(this);
}
