// xCen r1, Copyright 2009 Michael Foster (Cross-Browser.com)
// Part of X, a Cross-Browser Javascript Library, Distributed under the terms of the GNU LGPL
function xCen(e)
{
  e = xGetElementById(e);
  xMoveTo(e,
    xScrollLeft() + (xClientWidth() - e.offsetWidth) / 2,
    xScrollTop() + (xClientHeight() - e.offsetHeight) / 2
  );
}
