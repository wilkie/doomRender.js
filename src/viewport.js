function initDoomRenderViewport(context) {
  /**
   * Constructor
   */

  var Viewport = context.DoomRender.Viewport = function(type, world, canvas, x, y, width, height) {
    var self = this;

    self._type = type;
    self._world = world;
    self._width = width;
    self._height = height;
    self.reset();

    if (type === "canvas") {
      self._renderer = new context.DoomRender.Canvas.Renderer();
    }
    else if (type === "orthographic") {
      self._renderer = new context.DoomRender.Orthographic.Renderer();
    }

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

  Viewport.prototype.reset = function() {
    self._worldX = 0;
    self._worldY = 0;
    self._scale = 1.0;
  };

  Viewport.prototype.resize = function(canvas, width, height) {
    this._width  = width  || canvas.clientWidth;
    this._height = height || canvas.clientHeight;

    if (this._renderer && this._context) {
      this._renderer.resize(this._context, canvas, width, height)
    }

    return this;
  };

  Viewport.prototype.x = function(x) {
    if (x === undefined) {
      return this._worldX;// + (this._width  * (1 / this._scale)) / 2;
    }

    this._worldX = x;// - (this._width  * (1 / this._scale)) / 2;

    return this;
  };

  Viewport.prototype.y = function(y) {
    if (y === undefined) {
      return this._worldY;// + (this._height  * (1 / this._scale)) / 2;
    }

    this._worldY = y;// - (this._height  * (1 / this._scale)) / 2;

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
  
  Viewport.prototype.prepare = function(canvas, x, y) {
    var self = this;

    if (self._world) {
      self._context = self._renderer.getContext(canvas);

      self._renderer.lookAt(self._context, self._worldX, self._worldY, self._scale);

      // Clear
      self._renderer.fill(self._context, 'black', 0, 0, self._width, self._height);

      // Draw Sectors (floors/ceilings)
      var boundingBox = self._world.level().boundingBox();
      var sectors  = self._world.level().sectors();
      var sectorCount = 0;
      //sectors = [sectors[1]]; //[sectors[55], sectors[58]];
      sectors.forEach(function(sector) {
        //if (self.isVisible(sector)) {
          sectorCount += 1;
          self._renderer.drawSector(self._context, sector, boundingBox, self._worldX, self._worldY, self._scale);
        //}
      });

      // Draw Walls
      var lineDefs = self._world.level().lineDefs();
      lineDefs.forEach(function(lineDef) {
        //if (self.isVisible(sector)) {
          self._renderer.drawWall(self._context, lineDef, self._worldX, self._worldY, self._scale);
        //}
      });

      self._prepared = true;

      // Render
      self._renderer.render(self._context);
    }

    return this;
  };

  Viewport.prototype.render = function(canvas, x, y) {
    if (!this._prepared) {
      this.prepare(canvas, x, y);
    }

    if (this._prepared && this._renderer && this._context) {
      this._renderer.lookAt(this._context, this._worldX, this._worldY, this._scale);
      this._renderer.render(this._context);
    }

    return this;
  };

  Viewport.prototype.world = function(world) {
    var self = this;

    if (world === undefined) {
      return self._world;
    }

    self._world = world;

    this._renderer.clear();
    this._prepared = false;

    // Load Sectors (floors/ceilings)
    var sectors  = self._world.level().sectors();
    var sectorCount = 0;
    //var sectors = [sectors[58]];
    sectors.forEach(function(sector) {
    
      sectorCount += 1;
      self._renderer.loadSector(sector);
    
    });

    // Load Walls
    var lineDefs = self._world.level().lineDefs();
    lineDefs.forEach(function(lineDef) {
      self._renderer.loadWall(lineDef);
    });

    return self;
  };
}
