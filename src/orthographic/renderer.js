// TEXTURE ALIGNMENT / PEGGING (done for lower textures!)
// MIDDLE TEXTURE GEOMETRY
//
// REUSE TEXTURES

const cullWalls = false;

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

  Renderer.prototype.interpretBrightness = function(brightness) {
    brightness = Math.max(8, brightness - 64);
    brightness = 255 * (brightness / 160.0);
    brightness = Math.floor(Math.min(brightness / 2, 255));
    return brightness + brightness * 0x100 + brightness * 0x10000;
  };

  Renderer.prototype.drawSector = function(gl, sector, boundingBox, x, y, scale) {
    var self = this;

    if (sector._added) {
     // return;
    }
    sector._added = true;

    // Gather sector vertices
    var polygons = sector.polygons();

    var moveX = 0;
    var moveY = 0;

    polygons.forEach(function(info) {
      var textureMap = function(lower, geo) {
        // Get FLAT for floor/ceiling
        var texture = sector.textureFloor();
        if (!lower) {
          texture = sector.textureCeiling();
        }
        const texFlat = self.createTexture(texture);

        const brightness = self.interpretBrightness(sector.brightness());

        const matFlat = new THREE.MeshLambertMaterial({
          map:   texFlat,
          color: brightness
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
              const frontSideDef = [lineDef.leftSideDef(), lineDef.rightSideDef()].filter(function(sideDef) {
                return sideDef && sideDef.sector() !== sector;
              })[0];
              const backSideDef = [lineDef.leftSideDef(), lineDef.rightSideDef()].filter(function(sideDef) {
                return sideDef && sideDef.sector() === sector;
              })[0];
              if (frontSideDef) {
                var texture = frontSideDef.textureLower();
                if (!lower) {
                  texture = frontSideDef.textureUpper();
                }

                if (!lower && frontSideDef.sector().textureCeiling().name() == "F_SKY1" && backSideDef) {
                  // Do not render the upper parts of sectors that both have sky ceilings
                  if (backSideDef.sector().textureCeiling().name() == frontSideDef.sector().textureCeiling().name()) {
                    return;
                  }
                  // Render the walls with the ceiling texture other wise
                  else if (!texture) {
                    texture = sector.textureCeiling();
                  }
                }

                if (texture) {
                  const texSide = self.createTexture(texture);

                  const matSide = new THREE.MeshLambertMaterial({
                    map: texSide,
                    color: self.interpretBrightness(frontSideDef.sector().brightness())
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
                      coord.x = lineDef.magnitude();
                    }

                    // Pin the texture to the top of the face
                    var amount = sector.neighborFloor() - sector.floor();
                    if (!lower) {
                      if (lineDef.isUpperUnpegged()) {
                        // Align to the owning ceiling
                        if (backSideDef) {
                          amount = -frontSideDef.sector().ceiling() + backSideDef.sector().ceiling();
                        }
                      }
                      else {
                        // Align to sector ceiling (i have no idea why this is true)
                        amount = 1 + (128 - texture.height());
                      }
                    }
                    else {
                      if (lineDef.isLowerUnpegged()) {
                        amount = sector.neighborFloor() - frontSideDef.sector().ceiling();
                      }
                      else {
                        amount = sector.neighborFloor() - backSideDef.sector().floor();
                      }
                    }

                    amount -= frontSideDef.textureY();

                    coord.y -= amount;

                    amount = 0;
                    amount += frontSideDef.textureX();
                    coord.x += amount;
                  });
                  geo.uvsNeedUpdate = true;
                }
              }
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

      var holes = [];
      info.holes.forEach(function(holeVertices) {
        holeVertices = holeVertices.reverse();
        const holeShape = new THREE.Shape();
        holeShape.moveTo(holeVertices[0].x, holeVertices[0].y + moveY);
        holeVertices.slice(1).forEach(function(vertex) {
          holeShape.lineTo(vertex.x, vertex.y + moveY);
        });

        if (holeVertices.length > 2) {
          holes.push(holeShape);
        }
      });

      shape.holes = holes;

      const floorThickness = sector.floor() - sector.neighborFloor();
      const geo = new THREE.ExtrudeGeometry(shape, { amount: floorThickness, bevelEnabled: false });

      var mats = textureMap(true, geo);

      const mesh = new THREE.Mesh(geo, mats);
      mesh.rotation.x = -Math.PI/2;
      mesh.position.y = sector.neighborFloor();
      self._scene.add(mesh);

      // Adds wireframe
      /*const mesh2 = new THREE.Mesh(geo, mats[2]);
      mesh2.rotation.x = -Math.PI/2;
      self._scene.add(mesh2);*/

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

      const upperGeo = new THREE.ExtrudeGeometry(upperShape, { amount: sector.neighborCeiling() - sector.ceiling(), bevelEnabled: false });

      var mats = textureMap(false, upperGeo);

      const upperMesh = new THREE.Mesh(upperGeo, mats);
      upperMesh.rotation.x = -Math.PI/2;
      upperMesh.position.y = sector.ceiling();
      self._scene.add(upperMesh);

    });

    // "Middle" Walls
    // Go through each linedef and render the middle texture on a plane
    // Easy peasy.
    const lines = sector.lineDefs();

    lines.forEach(function(lineDef) {
      const frontSideDef = [lineDef.leftSideDef(), lineDef.rightSideDef()].filter(function(sideDef) {
        return sideDef && sideDef.sector() !== sector;
      })[0];
      const backSideDef = [lineDef.leftSideDef(), lineDef.rightSideDef()].filter(function(sideDef) {
        return sideDef && sideDef.sector() === sector;
      })[0];

      var doubleSided = frontSideDef && backSideDef;

      [frontSideDef, backSideDef].forEach(function(sideDef, side) {
        if (sideDef) {
          // Create the mesh
          const shape = new THREE.Shape();

          // We need to reverse the vertices since we are inverting the y axis.
          const offsetX = 0;
          const offsetY = 0;
          var start = side == (doubleSided ? 0 : 1) ? lineDef.start() : lineDef.end();
          var end   = side == (doubleSided ? 0 : 1) ? lineDef.end()   : lineDef.start();
          shape.moveTo(start.x, start.y);
          shape.lineTo(end.x,   end.y);

          const texture = sideDef.textureMiddle();
          var mats = [];

          if (texture) {
            // If the sidedef is double sided, the middle wall is only as high as the texture
            var height = sector.ceiling() - sector.floor();
            if (doubleSided) {
              height = Math.min(height, texture.height());
            }

            const wallGeo = new THREE.ExtrudeGeometry(shape, { amount: height, bevelEnabled: false });

            // Pull out the texture
            const texSide = self.createTexture(texture);

            const brightness = self.interpretBrightness(sideDef.sector().brightness());

            // Create the material
            const matSide = new THREE.MeshLambertMaterial({
              map: texSide,
              color: brightness,
              transparent: true
            });

            mats.push(matSide);

            wallGeo.faces.forEach(function(face, faceIndex) {
              face.materialIndex = null;
              if ((!cullWalls && !doubleSided) || faceIndex < 2) {
                if (!doubleSided && faceIndex >= 2) {
                  if (mats.length == 1) {
                    // Outer walls that aren't *actually* there should be the same brightness
                    // Therefore, we add a new material to the wall.
                    const matUnknownSide = new THREE.MeshLambertMaterial({
                      map: texSide,
                      color: self.interpretBrightness(128),
                      transparent: false
                    });
                    mats.push(matUnknownSide);
                  }
                  face.materialIndex = 1;
                }
                else {
                  face.materialIndex = 0;
                }
                wallGeo.faceVertexUvs[0][faceIndex].forEach(function(coord, i) {
                  // Get the position on the line
                  const geoCoord = wallGeo.vertices[[face.a, face.b, face.c][i]];

                  // Pin the texture to the left of the linedef
                  if ((start.y != end.y && geoCoord.y == start.y) ||
                      (start.y == end.y && geoCoord.x == start.x)) {
                    coord.x = 0;
                  }
                  else {
                    coord.x = lineDef.magnitude();
                  }

                  // Pin the texture to the bottom of the face
                  var amount = 0;

                  if (!lineDef.isLowerUnpegged()) {
                    amount = -height;
                    amount -= sideDef.textureY();
                  }

                  amount += sideDef.textureY();
                  coord.y -= amount;

                  amount = 0;
                  amount += sideDef.textureX();
                  coord.x += amount;
                });
              }
            });

            wallGeo.uvsNeedUpdate = true;

            const wallMesh = new THREE.Mesh(wallGeo, mats);
            wallMesh.rotation.x = -Math.PI/2;

            var wallY = sideDef.sector().floor();
            if (doubleSided) {
              wallY = Math.max(frontSideDef.sector().floor(), backSideDef.sector().floor());
            }
            wallMesh.position.y = wallY;
            self._scene.add(wallMesh);
          }
        };
      });
    });
  };

  Renderer.prototype.createTexture = function(texture) {
    this._textureCache = this._textureCache || {};

    if (!(texture.name() in this._textureCache)) {
      var textureWidth  = texture.width();
      var textureHeight = texture.height();

      var data = texture.rgbaBuffer();

      // If the texture is not a power of two, we need to create the texture
      // by expanding the texture to one that is a power of two and then tiling
      // it ourselves
      const isPowerOfTwo = function(n) {
        return n && (n & (n - 1)) === 0;
      };

      const nextPowerOfTwo = function(n) {
        n--;
        n |= n >> 1;
        n |= n >> 2;
        n |= n >> 4;
        n |= n >> 8;
        n |= n >> 16;
        n++;

        return n;
      };

      if (!isPowerOfTwo(textureWidth) || !isPowerOfTwo(textureHeight)) {
        textureWidth  = nextPowerOfTwo(textureWidth);
        textureHeight = nextPowerOfTwo(textureHeight);
      }

      // Recreate data if the texture is not a power of two
      if (textureWidth != texture.width() || textureHeight != texture.height()) {
        var newData = new Uint8Array(textureWidth * textureHeight * 4);
        for (var y = 0; y < textureHeight; y++) {
          const origY = y % texture.height();
          for (var x = 0; x < textureWidth; x++) {
            const origX = x % texture.width();
            for (var byteIndex = 0; byteIndex < 4; byteIndex++) {
              newData[((y * textureWidth + x) * 4) + byteIndex] = data[((origY * texture.width() + origX) * 4) + byteIndex];
            }
          }
        }

        data = newData;
      }

      var ret = new THREE.DataTexture(
        data,                    // data
        textureWidth,            // width
        textureHeight,           // height
        THREE.RGBAFormat,        // format
        THREE.UnsignedByteType,  // type
        THREE.UVMapping,         // mapping
        THREE.RepeatWrapping,    // wrapS
        THREE.RepeatWrapping     // wrapT
      );

      // Scale the texture to the appropriate relative size
      // and account for the non mapped area when the texture is not a power of 2
      ret.repeat.set(1.0/textureWidth, 1.0/textureHeight);

      // Allow this repeat setting to be propagated
      ret.needsUpdate = true;

      this._textureCache[texture.name()] = ret;
    }

    return this._textureCache[texture.name()];
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

    // Ambient Lights
    scene.add( new THREE.AmbientLight( 0xffffff ) );

    // This lets us oversaturate when the brightness of the textures > a certain amount
    scene.add( new THREE.AmbientLight( 0xffffff ) );

    var dirLight = new THREE.DirectionalLight();
    scene.add(dirLight);
    dirLight.position.set(-500, 200, 300);

    this._scene = scene;
  }
}
