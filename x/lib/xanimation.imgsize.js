// xAnimation.imgSize r1, Copyright 2007 Michael Foster (Cross-Browser.com)
// Part of X, a Cross-Browser Javascript Library, Distributed under the terms of the GNU LGPL
xAnimation.prototype.imgSize = function(e,w,h,t,a,b,oe)
{
  var i = this;
  i.x1 = e.width; i.y1 = e.height; // start size
  i.x2 = Math.round(w); i.y2 = Math.round(h); // target size
  i.init(e,t,o,o,oe,a,b);
  i.run();
  function o(i) { i.e.width = Math.round(i.x); i.e.height = Math.round(i.y); } // onRun and onTarget
};
