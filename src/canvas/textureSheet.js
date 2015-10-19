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

    if (this._curX + (texture.width()*2) + 2 > this._width) {
      if (this._curHeight == 0) {
        return;
      }

      this._curX = 0;
      this._curY += this._curHeight + 2;
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

    context.putImageData(imageData, this._curX, this._curY);
    context.putImageData(imageData, this._curX + texture.width(), this._curY);
    context.putImageData(imageData, this._curX + texture.width(), this._curY + texture.height());
    context.putImageData(imageData, this._curX, this._curY + texture.height());

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

    this._curX += (texture.width() * 2) + 2;
    if (texture.height() * 2 > this._curHeight) {
      this._curHeight = texture.height() * 2;
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