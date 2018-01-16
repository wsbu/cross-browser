// xSetCookie r4, Copyright 2001-2008 Michael Foster (Cross-Browser.com)
// Part of X, a Cross-Browser Javascript Library, Distributed under the terms of the GNU LGPL

function xSetCookie(name, value, expire, path, domain)
{
  document.cookie = name + "=" + escape(value)
    + ((!expire) ? "" : ("; expires=" + expire.toGMTString()))
    + "; path=" + ((!path) ? "/" : path)
    + ((!domain) ? "" : ("; domain=" + domain));
}
