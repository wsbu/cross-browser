// xDeleteCookie r5, Copyright 2001-2008 Michael Foster (Cross-Browser.com)
// Part of X, a Cross-Browser Javascript Library, Distributed under the terms of the GNU LGPL

function xDeleteCookie(name, path, domain)
{
  if (xGetCookie(name)) {
    xSetCookie(name, '', new Date(0), path, domain);
  }
}
