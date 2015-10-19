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
}
