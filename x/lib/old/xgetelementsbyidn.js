// xGetElementsByIdN r2, Copyright 2009 Michael Foster (Cross-Browser.com)
// Part of X, a Cross-Browser Javascript Library, Distributed under the terms of the GNU LGPL
function xGetElementsByIdN(p,i,f,d)
{
  var e, r = [];
  i = i || 0;
  e = xGetElementById(p + i);
  while (e) {
    if (f) {
      f(e, i, d);
    }
    r[r.length] = e;
    e = xGetElementById(p + (++i));
  }
  return r;
}
