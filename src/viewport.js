function initDoomRenderViewport(context) {
  /**
   * Constructor
   */

  var Viewport = context.DoomRender.Viewport = function(world, width, height) {
    var self = this;

    self._world = world;
    self._width = width;
    self._height = height;
    self._worldX = 0;
    self._worldY = 0;
    self._scale = 1.0;

    self._renderer = new context.DoomRender.Canvas.Renderer();

    return self;
  };

  Viewport.prototype.boundingBox = function() {
    return {
           "x": this._worldX,
           "y": this._worldY,
       "width": this._width  * (1 / this._scale),
      "height": this._height * (1 / this._scale)
    };
  };

  Viewport.prototype.resize = function(width, height) {
    this._width  = width;
    this._height = height;

    return this;
  };

  Viewport.prototype.x = function(x) {
    if (x === undefined) {
      return this._worldX + (this._width  * (1 / this._scale)) / 2;
    }

    this._worldX = x - (this._width  * (1 / this._scale)) / 2;

    return this;
  };

  Viewport.prototype.y = function(y) {
    if (y === undefined) {
      return this._worldY + (this._height  * (1 / this._scale)) / 2;
    }

    this._worldY = y - (this._height  * (1 / this._scale)) / 2;

    return this;
  };

  Viewport.prototype.center = function(x, y) {
    if (x instanceof Object) {
      var boundingBox = x;
      boundingBox.y = -(boundingBox.y + boundingBox.height);
      return this.center(boundingBox.x + (boundingBox.width / 2), boundingBox.y + (boundingBox.height / 2));
    }
    else if (y === undefined) {
      return {
        "x": this.x(),
        "y": this.y()
      };
    }

    this.x(x);
    this.y(y);

    return this;
  };

  Viewport.prototype.zoom = function(factor) {
    if (factor === undefined) {
      return this._scale;
    }

    // Maintain center point
    var centerPoint = this.center();
    this._scale = factor;
    this.center(centerPoint.x, centerPoint.y);

    return this;
  };

  Viewport.prototype.isVisible = function(item) {
    // Detect collision between item bounding box and viewport bounding box
    var boundingBox = item.boundingBox();
    var viewportBox = this.boundingBox();

    boundingBox.y = -(boundingBox.y + boundingBox.height);

    function rectIntersect(r1, r2) {
      return !(r2.x               > (r1.x + r1.width) || 
               (r2.x + r2.width)  < r1.x              || 
               r2.y                > (r1.y + r1.height) ||
               (r2.y + r2.height)  < (r1.y));
    }

    return rectIntersect(boundingBox, viewportBox);
  };

  Viewport.prototype.render = function(canvas, x, y) {
    var self = this;

    var sectors  = this._world.level().sectors();
    var sectorCount = 0;
    var context = canvas.getContext('2d');
    self._renderer.fill(context, 'black', 0, 0, self._width, self._height);
    sectors.forEach(function(sector) {
      if (self.isVisible(sector)) {
        sectorCount += 1;
        self._renderer.drawSector(context, sector, self._worldX, self._worldY, self._scale);
      }
    });

    return this;
  };
}