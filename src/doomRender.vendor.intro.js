function initDoomRenderVendor(context) {
  var Vendor = context.DoomRender.Vendor = {"hello": "hi"};
  (function (global) {
  	var window=global;
  	var exports=global;
