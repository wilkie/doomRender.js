function initDoomRenderCanvasRenderer(context) {
  /**
   * Constructor
   */

  var Renderer = context.DoomRender.Canvas.Renderer = function() {
    var self = this;

    // create a render cache
    self._cache = new context.DoomRender.Canvas.RenderCache();

    // And a flat sheet
    self._flatSheet = new context.DoomRender.Canvas.TextureSheet(640, 640);

    return self;
  };

  Renderer.prototype.fill = function(context, fillStyle, x, y, width, height) {
    context.beginPath();
    context.fillStyle = fillStyle;
    context.fillRect(x, y, width, height);
    return this;
  }

  Renderer.prototype.drawSector = function(context, sector, x, y, scale) {
    context.smoothingEnabled = false;

    // Put/retrieve floor texture into/from texture sheet
    var floorRegion = this._flatSheet.storeTexture(sector.textureFloor());

    // Gather sector vertices
    var polygons = sector.polygons();

    // Render sector geometry as a clipping region
    context.save();
    context.lineWidth = 1;
    context.beginPath();
    polygons.forEach(function(vertices) {
      // We need to reverse the vertices since we are inverting the y axis.
      vertices = vertices.slice().reverse();
      context.moveTo((vertices[0].x - x) * scale, (-vertices[0].y - y) * scale);
      vertices.slice(1).forEach(function(vertex) {
        context.lineTo((vertex.x - x) * scale, (-vertex.y - y) * scale);
      });
      context.lineJoin = 'miter';
      context.closePath();
    })
    context.clip();

    // Draw floor pattern:
    // - draw bounding box with floor texture
    // - ensure that bounding box is aligned to the 64x64 grid
    context.beginPath();

    // Get the bounding box for the sector
    var box = sector.boundingBox();

    // Invert on the y axis
    box.y = -(box.y + box.height);

    // Position the boundingBox such that the floor texture is aligned
    // on a 64x64 grid. That is, make the x and y a factor of 64

    if (box.x < 0) {
      var amount = (64 - (-box.x % 64))
      box.x -= amount;
      box.width += amount;
    }
    else {
      var amount = (box.x % 64)
      box.x -= amount;
      box.width += amount;
    }
    if (box.y < 0) {
      var amount = (64 - (-box.y % 64))
      box.y -= amount;
      box.height += amount;
    }
    else {
      var amount = (box.y % 64)
      box.y -= amount;
      box.height += amount;
    }

    // Draw the aligned bounding box
    for (var tileY = 0; tileY < box.height; tileY += 64) {
      for (var tileX = 0; tileX < box.width; tileX += 64) {
        this._flatSheet.drawTextureX2(context, sector.textureFloor(), (tileX + box.x - x) * scale, (tileY + box.y - y) * scale, scale);
      }
    }
    context.smoothingEnabled = true;

    context.restore();
    context.lineWidth = 1;
    context.beginPath();
    polygons.forEach(function(vertices) {
      // We need to reverse the vertices since we are inverting the y axis.
      vertices = vertices.slice().reverse();
      context.moveTo((vertices[0].x - x) * scale, (-vertices[0].y - y) * scale);
      vertices.slice(1).forEach(function(vertex) {
        context.lineTo((vertex.x - x) * scale, (-vertex.y - y) * scale);
      });
      context.lineJoin = 'miter';
      context.closePath();
    })
    context.strokeStyle = '#888888';
    context.stroke();
  };
}