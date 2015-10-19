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