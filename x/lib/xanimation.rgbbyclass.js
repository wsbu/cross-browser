// xAnimation.rgbByClass, Copyright 2009 Michael Foster (Cross-Browser.com)
// Part of X, a Cross-Browser Javascript Library, Distributed under the terms of the GNU LGPL
xAnimation.prototype.rgbByClass = function(cls,p,v,t,a,b,oe)
{
  var i = this, co, ea;
  ea = xGetElementsByClassName(cls);
  co = xParseColor(xGetComputedStyle(ea[0],p));
  i.x1 = co.r; i.y1 = co.g; i.z1 = co.b; // initial colors
  co = xParseColor(v);
  i.x2 = co.r; i.y2 = co.g; i.z2 = co.b; // target colors
  i.prop = xCamelize(p);
  i.init(ea,t,h,h,oe,a,b);
  i.run();
  function h(i) { // onRun and onTarget
    // In this function i.e == ea
    for (var j = 0; j < i.e.length; ++j) {
      i.e[j].style[i.prop] = xRgbToHex(Math.round(i.x),Math.round(i.y),Math.round(i.z));
    }
  }
};
