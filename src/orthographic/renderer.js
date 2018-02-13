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
