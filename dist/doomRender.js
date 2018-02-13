/*! lib-doomRender - v0.1.0 - 2018-02-13 - wilkie */
;(function (global) {

/*jslint browser: true*/
/*global $*/

// Compiler directive for UglifyJS.  See DoomRender.const.js for more info.
if (typeof DEBUG === 'undefined') {
  DEBUG = true;
}

// Library-Global Constants

// GLOBAL is a reference to the global Object.
var Fn = Function, GLOBAL = new Fn('return this')();

/**
 * Init wrapper for the core module.
 * @param {Object} The Object that the library gets attached to in
 * DoomRender.init.js. If the library was not loaded with an AMD loader such as
 * require.js, this is the global Object.
 */
function initDoomRenderCore (context) {
  'use strict';

  // Private-Module Constants

  // var CORE_CONSTANT = true;

  // Private-Module Methods

  /**
   * This is the constructor for the DoomRender Object.
   * Note that the constructor is also being
   * attached to the context that the library was loaded in.
   * @param {Object} opt_config Contains any properties that should be used to
   * configure this instance of the library.
   * @constructor
   */
  var DoomRender = context.DoomRender = function(level, canvas) {
    var self = this;

    self._canvas = canvas;

    return self;
  };

  // Library-Public Methods

  /**
   * Returns the filename of the opened WAD file.
   * @returns {string}
   */
  DoomRender.prototype.filename = function() {
    return this._filename;
  };

  // DEBUG CODE
  //
  // With compiler directives, you can wrap code in a conditional check to
  // ensure that it does not get included in the compiled binaries.  This is
  // useful for exposing certain properties and methods that are needed during
  // development and testing, but should be private in the compiled binaries.
  if (DEBUG) {
  }

  DoomRender.loadScript = function(url, callback) {
    var rootPath = "/";
    var scriptElements = document.getElementsByTagName('script');
    for (var i = 0; i < scriptElements.length; i++) {
      var src = scriptElements[i].src;
      if (src.match('doomRender[.](min[.])?js$')) {
        rootPath = src;
        rootPath = rootPath.replace('doomRender.js', '');
        rootPath = rootPath.replace('doomRender.min.js', '');
        break;
      }
    }
    url = rootPath + url;

    var head = document.getElementsByTagName('head')[0];

    var script  = document.createElement('script');
    script.type = 'text/javascript';
    script.src  = url;

    // Then bind the event to the callback function.
    // There are several events for cross browser compatibility.
    script.onreadystatechange = callback;
    script.onload = callback;

    // Fire the loading
    head.appendChild(script);
  };
}

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

function initDoomRenderCanvasRenderer(context) {
  /**
   * Constructor
   */

  var Renderer = context.DoomRender.Canvas.Renderer = function() {
    var self = this;

    // create a render cache
    self._cache = new context.DoomRender.Canvas.RenderCache();

    // And a flat sheet
    self._flatSheet = new context.DoomRender.Canvas.TextureSheet(1024, 1024);

    return self;
  };

  Renderer.prototype.getContext = function(canvas) {
    return canvas.getContext('2d');
  };

  Renderer.prototype.loadSector = function(sector) {
  };

  Renderer.prototype.loadWall = function(lineDef) {
  };

  Renderer.prototype.fill = function(context, fillStyle, x, y, width, height) {
    context.beginPath();
    context.fillStyle = fillStyle;
    context.fillRect(x, y, width, height);
    return this;
  };

  Renderer.prototype.drawWall = function(context, lineDef, x, y, scale) {
  };

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

function initDoomRenderCanvasTextureSheet(context) {
  /**
   * Constructor
   */

  var TextureSheet = context.DoomRender.Canvas.TextureSheet = function(width, height) {
    var self = this;

    self._canvas = document.createElement('canvas');
    self._canvas.width = width;
    self._canvas.height = height;
    self._width = width;
    self._height = height;
    self._lookup = {};

    self._count = 0;
    self._curX = 0;
    self._curY = 0;
    self._curHeight = 0;

    return self;
  };

  TextureSheet.prototype.storeTexture = function(texture) {
    if (this.textureExists(texture)) {
      return this.textureInfo(texture);
    }

    var rgbaBuffer = texture.rgbaBuffer();

    var context = this._canvas.getContext('2d');

    if (this._curX + (texture.width() + 7) > this._width) {
      if (this._curHeight == 0) {
        return;
      }

      this._curX = 0;
      this._curY += this._curHeight;
      this._curHeight = 0;
    }

    var imageData = context.getImageData(this._curX, this._curY, texture.width(), texture.height());

    var data = imageData.data;

    for (var i = 0; i < data.length; i += 4) {
      data[i + 0] = rgbaBuffer[i + 0];
      data[i + 1] = rgbaBuffer[i + 1];
      data[i + 2] = rgbaBuffer[i + 2];
      data[i + 3] = 255; //rgbaBuffer[i + 3];
    }

    // Texture
    context.putImageData(imageData, this._curX, this._curY);

    // Right Edge
    context.putImageData(imageData, this._curX + texture.width(), this._curY, 0, 0, 5, texture.height());

    // Bottom-right Corner
    context.putImageData(imageData, this._curX + texture.width(), this._curY + texture.height(), 0, 0, 5, 5);

    // Bottom Edge
    context.putImageData(imageData, this._curX, this._curY + texture.height(), 0, 0, texture.width(), 5);

    ret = {
      "x": this._curX,
      "y": this._curY,
      "width": texture.width(),
      "height": texture.height()
    };
    if (!(texture.namespace() in this._lookup)) {
      this._lookup[texture.namespace()] = {};
    }
    this._lookup[texture.namespace()][texture.name()] = ret;

    this._curX += texture.width() + 7;
    if (texture.height() + 7 > this._curHeight) {
      this._curHeight = texture.height() + 7;
    }

    return ret;
  };

  TextureSheet.prototype.textureExists = function(texture) {
    return (texture.namespace() in this._lookup) &&
           (texture.name() in this._lookup[texture.namespace()]);
  };

  TextureSheet.prototype.textureInfo = function(texture) {
    if (this.textureExists(texture)) {
      return this._lookup[texture.namespace()][texture.name()];
    }

    return undefined;
  };

  TextureSheet.prototype.drawTexture = function(context, texture, x, y, scale) {
    var info = this.storeTexture(texture);
    context.drawImage(this._canvas, info.x, info.y, info.width, info.height, x, y, info.width * scale, info.height * scale);
    return this;
  };

  TextureSheet.prototype.drawTextureX2 = function(context, texture, x, y, scale) {
    var info = this.storeTexture(texture);
    context.drawImage(this._canvas, info.x, info.y, (info.width+5), (info.height+5), x, y, (info.width+5) * scale, (info.height+5) * scale);
    return this;
  };
}

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
  initDoomRenderWorld(context);
  initDoomRenderViewport(context);
  initDoomRenderOrthographic(context);
  initDoomRenderVendor(context);

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

// Your library may have many modules.  How you organize the modules is up to
// you, but generally speaking it's best if each module addresses a specific
// concern.  No module should need to know about the implementation details of
// any other module.

// Note:  You must name this function something unique.  If you end up
// copy/pasting this file, the last function defined will clobber the previous
// one.
function initDoomWadModule (context) {
  'use strict';

  var initDoomRender = context.initDoomRender;

  // PRIVATE MODULE CONSTANTS
  var MODULE_CONSTANT = true;

  if (DEBUG) {
  }
}

function initDoomRenderVendor(context) {
  var Vendor = context.DoomRender.Vendor = {"hello": "hi"};
  (function (global) {
  	var window=global;
  	var exports=global;

  } (context.DoomRender.Vendor));
}

function initDoomRenderOrthographic(context) {

  /**
   * Constructor
   */

  var Orthographic = context.DoomRender.Orthographic = function() {
    var self = this;

    return self;
  };

  initDoomRenderOrthographicRenderer(context);
}

// TEXTURE ALIGNMENT / PEGGING (done for lower textures!)
// MIDDLE TEXTURE GEOMETRY

function initDoomRenderOrthographicRenderer(context) {
  var Renderer = context.DoomRender.Orthographic.Renderer = function() {
    var self = this;
    return self;
  };

  Renderer.prototype.lookAt = function(gl, x, y, scale) {
    // Isometric rotation
    this._camera.position.set( 20, 20, 20 );
    this._camera.lookAt( 0, 0, 0 );

    /*
    this._camera.rotation.order = 'YXZ';
    this._camera.rotation.y = - Math.PI / 4;
    this._camera.rotation.x = Math.atan( - 1 / Math.sqrt( 2 ) );
    */

    this._camera.position.x = x;
    this._camera.position.z = y;
    this._camera.position.y = 2400;

    scale = scale / 0.1;

    this._camera.left   = (canvas.clientWidth  * scale) / -2;
    this._camera.right  = (canvas.clientWidth  * scale) /  2;
    this._camera.top    = (canvas.clientHeight * scale) /  2;
    this._camera.bottom = (canvas.clientHeight * scale) / -2;
    this._camera.updateProjectionMatrix();
  };

  Renderer.prototype.getContext = function(canvas) {
    var self = this;

    // Create a THREE.js context
    const renderer = new THREE.WebGLRenderer({canvas: canvas});

    renderer.setClearColor(0x000000, 1.0);

    self.resize(renderer, canvas);

    this.clear();

    return renderer;
  };

  Renderer.prototype.resize = function(context, canvas, width, height) {
    const renderer = context;

    width  = width  || canvas.clientWidth;
    height = height || canvas.clientHeight;

    // Explicitly set the size
    renderer.setSize(width, height);

    if (this._camera === undefined) {
      this._camera = new THREE.OrthographicCamera();
    }

    // Set up the camera
    this._camera.left   = width  / -2;
    this._camera.right  = width  /  2;
    this._camera.top    = height /  2;
    this._camera.bottom = height / -2;
    this._camera.near   = 0;
    this._camera.far    = 64000;
    this._camera.updateProjectionMatrix();
  };

  Renderer.prototype.fill = function(context, fillStyle, x, y, width, height) {
  };

  Renderer.prototype.drawWall = function(gl, lineDef, x, y, scale) {
  };

  Renderer.prototype.loadWall = function(lineDef) {
  };

  Renderer.prototype.render = function(context) {
    var self = this;
    context.render(self._scene, self._camera);
  };

  Renderer.prototype.drawSector = function(gl, sector, boundingBox, x, y, scale) {
    var self = this;

    console.log(boundingBox);

    if (sector._added) {
     // return;
    }
    sector._added = true;

    // Put/retrieve floor texture into/from texture sheet
    //var floorRegion = this._flatSheet.storeTexture(sector.textureFloor());

    // Gather sector vertices
    var polygons = sector.polygons();

    var moveX = 0;
    var moveY = 0;

    // Render sector geometry as a clipping region
    polygons.forEach(function(info) {
      var textureMap = function(lower, geo) {
        // Get FLAT for floor/ceiling
        var texture = sector.textureFloor();
        if (!lower) {
          texture = sector.textureCeiling();
        }
        const texFlat = new THREE.DataTexture(texture.rgbaBuffer(),    // data
                                              texture.width(),         // width
                                              texture.height(),        // height
                                              THREE.RGBAFormat,        // format
                                              THREE.UnsignedByteType,  // type
                                              THREE.UVMapping,         // mapping
                                              THREE.RepeatWrapping,    // wrapS
                                              THREE.RepeatWrapping);   // wrapT
        texFlat.repeat.set(1.0/64.0, 1.0/64.0);
        texFlat.needsUpdate = true;

        const matFlat = new THREE.MeshLambertMaterial({
          map:   texFlat
        });
        const matUnknown = new THREE.MeshLambertMaterial({
          color: 0xffffff
        });
        const matWireframe = new THREE.MeshBasicMaterial({
          color: 0xff0000,
          wireframe: true
        });

        // Go through each sidedef of the sector and apply the material required
        var mats = [matUnknown];
        mats.push(matFlat);
        mats.push(matWireframe);

        const unknownMaterial = (lower ? null : null);

        geo.faces.forEach(function(face, faceIndex) {
          face.materialIndex = null;

          if ((geo.vertices[face.a].z == geo.vertices[face.b].z) &&
              (geo.vertices[face.b].z == geo.vertices[face.c].z)) {
            if (lower) {
              face.materialIndex = 1;
            }
            else {
              face.materialIndex = null;
            }
          }
          else {
            // Get the LineDef here
            var x1 = 0;
            var y1 = 0;
            var x2 = 0;
            var y2 = 0;

            if (geo.vertices[face.a].z == geo.vertices[face.b].z) {
              x1 = geo.vertices[face.a].x;
              y1 = geo.vertices[face.a].y;

              x2 = geo.vertices[face.b].x;
              y2 = geo.vertices[face.b].y;
            }
            else if (geo.vertices[face.a].z == geo.vertices[face.c].z) {
              x1 = geo.vertices[face.a].x;
              y1 = geo.vertices[face.a].y;

              x2 = geo.vertices[face.c].x;
              y2 = geo.vertices[face.c].y;
            }
            else {
              x1 = geo.vertices[face.b].x;
              y1 = geo.vertices[face.b].y;

              x2 = geo.vertices[face.c].x;
              y2 = geo.vertices[face.c].y;
            }

            const lineDef = sector.lineDefAt(x1, y1, x2, y2);

            if (lineDef) {
              face.materialIndex = unknownMaterial;
              [lineDef.leftSideDef(), lineDef.rightSideDef()].forEach(function(sideDef, side) {
                const backSideDef = (side == 0 ? lineDef.rightSideDef() : lineDef.leftSideDef());
                if (sideDef) {
                  var texture = sideDef.textureLower();
                  if (!lower) {
                    texture = sideDef.textureUpper();
                  }
                  if (texture) {
                    const texSide = new THREE.DataTexture(texture.rgbaBuffer(),    // data
                                                          texture.width(),         // width
                                                          texture.height(),        // height
                                                          THREE.RGBAFormat,        // format
                                                          THREE.UnsignedByteType,  // type
                                                          THREE.UVMapping,         // mapping
                                                          THREE.RepeatWrapping,    // wrapS
                                                          THREE.RepeatWrapping);   // wrapT
                    texSide.repeat.set(1.0/texture.width(), 1.0/texture.height());
                    texSide.needsUpdate = true;

                    const matSide = new THREE.MeshLambertMaterial({
                      map: texSide
                    });

                    mats.push(matSide);
                    face.materialIndex = mats.length - 1;

                    geo.faceVertexUvs[0][faceIndex].forEach(function(coord, i) {
                      // Get the position on the line
                      const geoCoord = geo.vertices[[face.a, face.b, face.c][i]];

                      // Pin the texture to the left of the linedef
                      if ((lineDef.start().y != lineDef.end().y && geoCoord.y == lineDef.start().y) ||
                          (lineDef.start().y == lineDef.end().y && geoCoord.x == lineDef.start().x)) {
                        coord.x = 0;
                      }
                      else {
                        //coord.x = Math.sqrt((x2-x1) * (x2-x1) + (y2-y1) * (y2-y1));
                        coord.x = lineDef.magnitude();
                      }

                      // Pin the texture to the top of the face
                      var amount = boundingBox.floor - sector.floor();
                      if (lineDef.isLowerUnpegged() && lower) {
                        amount = boundingBox.floor - sector.ceiling();
                        amount = -sector.ceiling() + sector.floor();
                      }
                      else if (lineDef.isUpperUnpegged() && !lower) {
                        // Align to the owning ceiling
                        console.log("upper pegged", sideDef, backSideDef, lineDef);
                        if (backSideDef) {
                          amount = -sideDef.sector().ceiling() + backSideDef.sector().ceiling();
                        }
                      }

                      amount -= sideDef.textureY();

                      coord.y -= amount;

                      amount = 0;
                      amount += sideDef.textureX();
                      coord.x += amount;
                    });
                    geo.uvsNeedUpdate = true;
                  }
                }
              });
            }
          }
        });

        return mats;
      };

      var vertices = info.shape;
      const shape = new THREE.Shape();

      // We need to reverse the vertices since we are inverting the y axis.
      vertices = vertices.slice().reverse();
      shape.moveTo(vertices[0].x, vertices[0].y + moveY);
      vertices.slice(1).forEach(function(vertex) {
        shape.lineTo(vertex.x, vertex.y + moveY);
      });

      shape.holes = info.holes.map(function(holeVertices) {
        const holeShape = new THREE.Shape();
        holeShape.moveTo(holeVertices[0].x, holeVertices[0].y + moveY);
        holeVertices.slice(1).forEach(function(vertex) {
          holeShape.lineTo(vertex.x, vertex.y + moveY);
        });

        return holeShape;
      });

      const geo = new THREE.ExtrudeGeometry(shape, { amount: sector.floor() - boundingBox.floor, bevelEnabled: false });

      var mats = textureMap(true, geo);

      const mesh = new THREE.Mesh(geo, mats);
      mesh.rotation.x = -Math.PI/2;
      self._scene.add(mesh);

      var vertices = info.shape;
      const upperShape = new THREE.Shape();

      // We need to reverse the vertices since we are inverting the y axis.
      vertices = vertices.slice().reverse();
      upperShape.moveTo(vertices[0].x, vertices[0].y + moveY);
      vertices.slice(1).forEach(function(vertex) {
        upperShape.lineTo(vertex.x, vertex.y + moveY);
      });

      upperShape.holes = info.holes.map(function(holeVertices) {
        const holeShape = new THREE.Shape();
        holeShape.moveTo(holeVertices[0].x, holeVertices[0].y + moveY);
        holeVertices.slice(1).forEach(function(vertex) {
          holeShape.lineTo(vertex.x, vertex.y + moveY);
        });

        return holeShape;
      });

      const upperGeo = new THREE.ExtrudeGeometry(upperShape, { amount: boundingBox.ceiling - sector.ceiling(), bevelEnabled: false });

      var mats = textureMap(false, upperGeo);

      const upperMesh = new THREE.Mesh(upperGeo, mats);
      upperMesh.rotation.x = -Math.PI/2;
      upperMesh.position.y = (sector.ceiling() - sector.floor()) + (sector.floor() - boundingBox.floor);
      self._scene.add(upperMesh);

    });

    // "Middle" Walls
    // Go through each linedef and render the middle texture on a plane
    // Easy peasy.
    const lines = sector.lineDefs();

    lines.forEach(function(lineDef) {
      [lineDef.leftSideDef(), lineDef.rightSideDef()].forEach(function(sideDef, side) {
        const backSideDef = (side == 0 ? lineDef.rightSideDef() : lineDef.leftSideDef());
        if (sideDef && sideDef.sector() == sector) {
          // Create the mesh
          const shape = new THREE.Shape();

          // We need to reverse the vertices since we are inverting the y axis.
          const offsetX = 0;
          const offsetY = 0;
          shape.moveTo(lineDef.start().x, lineDef.start().y);
          shape.lineTo(lineDef.end().x,   lineDef.end().y);

          const wallGeo = new THREE.ExtrudeGeometry(shape, { amount: sector.ceiling() - sector.floor(), bevelEnabled: false });

          var mats = [];

          const texture = sideDef.textureMiddle();
          if (texture) {
            // Pull out the texture
            const texSide = new THREE.DataTexture(texture.rgbaBuffer(),    // data
                                                  texture.width(),         // width
                                                  texture.height(),        // height
                                                  THREE.RGBAFormat,        // format
                                                  THREE.UnsignedByteType,  // type
                                                  THREE.UVMapping,         // mapping
                                                  THREE.RepeatWrapping,    // wrapS
                                                  THREE.RepeatWrapping);   // wrapT
            texSide.repeat.set(1.0/texture.width(), 1.0/texture.height());
            texSide.needsUpdate = true;

            // Create the material
            const matSide = new THREE.MeshLambertMaterial({
              map: texSide,
              transparent: true
            });

            mats.push(matSide);

            wallGeo.faces.forEach(function(face, faceIndex) {
              wallGeo.faceVertexUvs[0][faceIndex].forEach(function(coord, i) {
                // Get the position on the line
                const geoCoord = wallGeo.vertices[[face.a, face.b, face.c][i]];

                // Pin the texture to the left of the linedef
                if ((lineDef.start().y != lineDef.end().y && geoCoord.y == lineDef.start().y) ||
                    (lineDef.start().y == lineDef.end().y && geoCoord.x == lineDef.start().x)) {
                  coord.x = 0;
                }
                else {
                  coord.x = lineDef.magnitude();
                }

                // Pin the texture to the bottom of the face
                var amount = -sector.ceiling() + sector.floor();
                amount -= sideDef.textureY();
                coord.y -= amount;

                amount = 0;
                amount += sideDef.textureX();
                coord.x += amount;
              });
            });

            wallGeo.uvsNeedUpdate = true;

            const wallMesh = new THREE.Mesh(wallGeo, mats[0]);
            wallMesh.rotation.x = -Math.PI/2;
            wallMesh.position.y = sector.floor() - boundingBox.floor;
            self._scene.add(wallMesh);
          }
        }
      });
    });
  };

  Renderer.prototype.loadSector = function(sector) {
  };

  Renderer.prototype.clear = function() {
    // Establish the scene
    if (!this._camera) {
      return;
    }

    const scene = new THREE.Scene();
    scene.add(this._camera);

    // Ambient Light
    scene.add( new THREE.AmbientLight( 0x444444 ) );

    var dirLight = new THREE.DirectionalLight();
    scene.add(dirLight);
    dirLight.position.set(-500, 200, 300);

    this._scene = scene;
  }
}


function initDoomRenderRender(context) {
  /**
   * Constructor
   */

  var Render = context.DoomRender.Render = function() {
    var self = this;

    return self;
  };
}

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
      var sector = sectors[31];
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
    var sector = sectors[0];
    //sectors.forEach(function(sector) {
    
      sectorCount += 1;
      self._renderer.loadSector(sector);
    
    //});

    // Load Walls
    var lineDefs = self._world.level().lineDefs();
    lineDefs.forEach(function(lineDef) {
      self._renderer.loadWall(lineDef);
    });

    return self;
  };
}

function initDoomRenderWorld(context) {
  /**
   * Constructor
   */

  var World = context.DoomRender.World = function(level) {
    var self = this;

    self._level = level;

    return self;
  };

  World.prototype.level = function() {
  	return this._level;
  }
}

} (this));
