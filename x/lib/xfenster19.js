// xFenster r19.1, Copyright 2004-2009 Michael Foster (Cross-Browser.com)
// Part of X, a Cross-Browser Javascript Library, Distributed under the terms of the GNU LGPL
/*
s = string
i = integer
b = boolean
f = function reference

var xfArgs = {

  // Required

  clientId: s,
  iniW: i,
  iniH: i,

  // Optional with defaults

  iniTitle: s, // ''
  iniUrl: s,   // undefined
  iniX: i,     // 0
  iniY: i,     // 0
  conPad: i,   // 0
  conBor: i,   // 0
  cliBor: i,   // 0
  miniW: i,    // 200
  fenceId: s,  // undefined
  noMove: b, noResize: b, noMinimize: b, noMaximize: b, noClose: b, noStatus: b, noFixed: b, // false
  fnMove: f, fnResize: f, fnDragEnd: f, fnMinimize: f, fnMaximize: f, fnRestore: f, fnClose: f, fnFocus: f, fnLoad: f, // undefined
  clsCon: s, // 'xfCon'
  clsCli: s, // 'xfClient'
  clsTB: s,  // 'xfTBar'
  clsTBF: s, // 'xfTBarF'
  clsSB: s,  // 'xfSBar'
  clsSBF: s, // 'xfSBarF'
  clsRI: s,  // 'xfRIco'
  clsNI: s,  // 'xfNIco'
  clsMI: s,  // 'xfMIco'
  clsOI: s,  // 'xfOIco'
  clsCI: s,  // 'xfCIco'
  txtResize: s,  // 'Resize'
  txtMin: s,     // 'Minimize'
  txtMax: s,     // 'Maximize'
  txtRestore: s, // 'Restore'
  txtClose: s    // 'Close'
};

*/

function xFenster(a)
{
  var me = this;

  // Public Methods

  me.paint = function(dw, dh)
  {
    me.conW += dw;
    me.conH += dh;
    me.con.style.width = (me.conW - B2) + 'px';
    me.con.style.height = (me.conH - B2) + 'px';
    /*@cc_on
    @if (@_jscript)
      xWidth(me.tbar, me.conW - M2 - B2);
      if (!me.minimized && me.sbar) {
        xWidth(me.sbar, me.conW - M2 - B2);
        me.sbar.style.top = me.conH - me.sbar.offsetHeight - M - B2;
      }
    @end @*/
    if (!me.minimized) {
      me.client.style.top = (M + me.tbar.offsetHeight) + 'px';
      me.client.style.width = (me.conW - M2 - B2 - cB2) + 'px';
      me.client.style.height = (me.conH - me.tbar.offsetHeight - (me.sbar ? me.sbar.offsetHeight : 0) - M2 - B2 - cB2) + 'px';
    }
  };
  me.focus = function()
  {
    if (xFenster.focused != me && (!a.fnFocus || a.fnFocus(me))) {
      me.con.style.zIndex = xFenster.nextZ++;
      if (xFenster.focused) {
        xFenster.focused.tbar.className = xFenster.focused.clsTB;
        if (xFenster.focused.sbar) xFenster.focused.sbar.className = xFenster.focused.clsSB;
      }
      me.tbar.className = a.clsTBF || 'xfTBarF';
      if (me.sbar) me.sbar.className = a.clsSBF || 'xfSBarF';
      xFenster.focused = me;
    }
  };
  me.href = function(s)
  {
    var h = s;
    if (me.isIFrame) {
      if (me.client.contentWindow) {
        if (s) {me.client.contentWindow.location = s;}
        else h = me.client.contentWindow.location.href;
      }
      else if (typeof me.client.src == 'string') { // for Safari/Apollo/WebKit on Windows
        if (s) {me.client.src = s;}
        else h = me.client.src;
      }
    }
    return h;
  };
  me.hide = function(e)
  {
    var i, o = xFenster.instances, z = 0, hz = 0, f = null;
    if (!a.fnClose || a.fnClose(me)) {
      me.con.style.display = 'none';
      me.hidden = true;
      xStopPropagation(e);
      if (me == xFenster.focused) {
        for (i in o) { // find the next appropriate fenster to focus
          if (o.hasOwnProperty(i) && o[i] && !o[i].hidden && o[i] != me) {
            z = parseInt(o[i].con.style.zIndex);
            if (z > hz) {
              hz = z;
              f = o[i];
            }
          }
        }
        if (f) {f.focus();}
      }
    }
  };
  me.show = function()
  {
    me.con.style.display = 'block';
    me.hidden = false;
    me.focus();
  };
  me.status = function(s)
  {
    if (me.sbar) {
      if (s) {me.sbar.innerHTML = s;}
      else return me.sbar.innerHTML;
    }
  };
  me.title = function(s)
  {
    if (s) {me.tbar.innerHTML = s;}
    else return me.tbar.innerHTML;
  };
  me.destroy = function()
  {
    try {
      me.hide();
      xRemoveEventListener(window, 'unload', winUnload, false);
      xRemoveEventListener(window, 'resize', winResize, false);
      me.con.parentNode.removeChild(me.con);
      winUnload();
    }
    catch (e) {
      //alert('Error in destroy:\n\n' + e);////debug///////
    }
  };
  me.minimize = function()
  {
    if (!a.noMinimize && !me.minimized && !me.hidden) {
      minClick();
      return true;
    }
    return false;
  };
  me.maximize = function()
  {
    if (!a.noMaximize && !me.maximized && !me.hidden) {
      maxClick();
      return true;
    }
    return false;
  };
  me.restore = function()
  {
    var b, i, t;
    if (me.maximized) {
      b = me.mbtn;
      b.onclick = maxClick;
      i = a.clsMI || 'xfMIco';
      t = a.txtMax || 'Maximize';
      me.maximized = !me.maximized;
    }
    else if (me.minimized) {
      b = me.nbtn;
      b.onclick = minClick;
      i = a.clsNI || 'xfNIco';
      t = a.txtMin || 'Minimize';
      me.minimized = !me.minimized;
      me.client.style.display = 'block';
      if (me.sbar) me.sbar.style.display = 'block';
    }
    else {
      return false;
    }
    xMoveTo(me.con, rX, rY);
    b.className = i;
    b.title = t;
    if (me.rbtn) {me.rbtn.style.display = 'block';}
    me.conW = rW;
    me.conH = rH;
    me.paint(0, 0);
    if (a.fnRestore) a.fnRestore(me);
    return true;
  };

  // Private Event Listeners

  function dragStart()
  {
    var i, o = xFenster.instances;
    for (i in o) {
      if (o.hasOwnProperty(i) && o[i] && !o[i].minimized && o[i].isIFrame) {
        o[i].client.style.display = 'none';
      }
    }
  }
  function dragEnd()
  {
    var i, o = xFenster.instances;
    for (i in o) {
      if (o.hasOwnProperty(i) && o[i] && !o[i].minimized && o[i].isIFrame) {
        o[i].client.style.display = 'block';
      }
    }
    if (a.fnDragEnd) {
      a.fnDragEnd(me);
    }
  }
  function barDrag(e, mdx, mdy)
  {
    var x = me.con.offsetLeft + mdx;
    var y = me.con.offsetTop + mdy;
    if (!a.fnMove || a.fnMove(me, x, y)) {
      if (!a.fenceId || inFence(x, y, me.con.offsetWidth, me.con.offsetHeight)) {
        me.con.style.left = x + 'px';
        me.con.style.top = y + 'px';
      }
    }
  }
  function resDrag(e, mdx, mdy)
  {
    var w = me.con.offsetWidth + mdx;
    var h = me.con.offsetHeight + mdy;
    if (!a.fnResize || a.fnResize(me, w, h)) {
      if (!a.fenceId || inFence(me.con.offsetLeft, me.con.offsetTop, w, h)) {
        me.paint(mdx, mdy);
      }
    }
  }
  function maxClick()
  {
    var f, fx, fy, x = 0, y = 0, w, h, fx2, fy2;
    var sl = xScrollLeft(), st = xScrollTop();
    var cw = xClientWidth(), ch = xClientHeight();
    if (a.fenceId) {
      f = xGetElementById(a.fenceId);
      x = fx = xPageX(f);
      y = fy = xPageY(f);
      w = f.offsetWidth;
      h = f.offsetHeight;
      if (!a.noFixed) {
        x = fx - sl;
        if (x < 0) x = 0;
        y = fy - st;
        if (y < 0) y = 0;
        
        fx2 = fx + w;
        if (fx2 >= sl + cw) fx2 = cw;
        fy2 = fy + h;
        if (fy2 >= st + ch) fy2 = ch;

        w = fx2 - x;
        h = fy2 - y;
      }
    }
    else {
      if (a.noFixed) {
        x = sl;
        y = st;
      }
      w = cw;
      h = ch;
    }
    if (!a.fnMaximize || a.fnMaximize(me, w - M2 - B2, h - me.tbar.offsetHeight - (me.sbar ? me.sbar.offsetHeight : 0) - M2 - B2)) {
      me.restore();
      me.maximized = !me.maximized;
      minmax(me.mbtn, w, h, x, y);
    }
  }
  function minClick()
  {
    var r = 1, x = 2, y, h, i, o = xFenster.instances;
    if (!a.fnMinimize || a.fnMinimize(me)) {
////
      for (i in o) {
        if (o.hasOwnProperty(i) && o[i] && o[i].minimized) {
          x += o[i].con.offsetWidth + 2;
          if (x + a.miniW > xClientWidth()) {
            x = 2;
            ++r;
          }
        }
      }
      h = me.tbar.offsetHeight + M2 + B2;
      y = xClientHeight() - (r * (h + 2));
      if (a.noFixed) y += xScrollTop();
////
      me.restore();
      me.client.style.display = 'none';
      if (me.sbar) me.sbar.style.display = 'none';
      me.minimized = !me.minimized;
      minmax(me.nbtn, a.miniW, h, x, y);
    }
  }
  function winResize()
  {
    if (me.maximized) {
      xResizeTo(me.con, 100, 100); // ensure fenster isn't causing scrollbars
      if (a.noFixed) xMoveTo(me.con, xScrollLeft(), xScrollTop());
      me.conW = xClientWidth();
      me.conH = xClientHeight();
      me.paint(0, 0);
    }
  }
  function winUnload()
  {
    me.con.onmousedown = me.con.onclick = null;
    if (me.nbtn) me.nbtn.onclick = null;
    if (me.mbtn) me.mbtn.onclick = me.tbar.ondblclick = null;
    if (me.cbtn) me.cbtn.onclick = me.cbtn.onmousedown = null;
    xFenster.instances[a.clientId] = null;
    me = null;
  }

  // Private Functions

  function minmax(b, w, h, x, y)
  {
    rW = me.con.offsetWidth;
    rH = me.con.offsetHeight;
    rX = me.con.offsetLeft;
    rY = me.con.offsetTop;
    if (x != -1) {xMoveTo(me.con, x, y);}
    b.className = a.clsOI || 'xfOIco';
    b.title = a.txtRestore || 'Restore';
    b.onclick = me.restore;
    if (me.rbtn) {me.rbtn.style.display = 'none';}
    me.conW = w;
    me.conH = h;
    me.paint(0, 0);
  }
  function inFence(x, y, w, h)
  {
    var f = xGetElementById(a.fenceId);
    if (!a.noFixed) {
      x += xScrollLeft();
      y += xScrollTop();
    }
    return (!(x < f.offsetLeft || x + w > f.offsetLeft + f.offsetWidth || y < f.offsetTop || y + h > f.offsetTop + f.offsetHeight));
  }

  // Constructor Code

  xFenster.instances[a.clientId] = this;

  // public properties
  me.con = null;  // outermost container
  me.tbar = null; // title bar
  me.sbar = null; // status bar
  me.rbtn = null; // resize icon
  me.nbtn = null; // minimize icon
  me.mbtn = null; // maximize icon
  me.cbtn = null; // close icon
  me.minimized = false;
  me.maximized = false;
  me.hidden = false;
  me.isIFrame = ((typeof a.iniUrl == 'string') && a.iniUrl.length);
  me.client = xGetElementById(a.clientId); // the 'content' container
  me.clsSB = a.clsSB || 'xfSBar';
  me.clsTB = a.clsTB || 'xfTBar';
  me.conW = a.iniW;
  me.conH = a.iniH;

  // private properties
  var rX, rY, rW, rH; // "restore" values
  var M = a.conPad || 0, B = a.conBor || 0, cB = a.cliBor || 0;
  var M2 = 2*M, B2 = 2*B, cB2 = 2*cB;

  // create elements
  if (!me.client) {
    me.client = document.createElement( me.isIFrame ? 'iframe' : 'div');
    me.client.id = a.clientId;
  }
  me.client.className += ' ' + (a.clsCli || 'xfClient');
  me.con = document.createElement('div');
  me.con.className = a.clsCon || 'xfCon';
  if (!a.noResize) {
    me.rbtn = document.createElement('div');
    me.rbtn.className = a.clsRI || 'xfRIco';
    me.rbtn.title = a.txtResize || 'Resize';
  }
  if (!a.noMinimize) {
    me.nbtn = document.createElement('div');
    me.nbtn.className = a.clsNI || 'xfNIco';
    me.nbtn.title = a.txtMin || 'Minimize';
  }
  if (!a.noMaximize) {
    me.mbtn = document.createElement('div');
    me.mbtn.className = a.clsMI || 'xfMIco';
    me.mbtn.title = a.txtMax || 'Maximize';
  }
  if (!a.noClose) {
    me.cbtn = document.createElement('div');
    me.cbtn.className = a.clsCI || 'xfCIco';
    me.cbtn.title = a.txtClose || 'Close';
  }
  me.tbar = document.createElement('div');
  me.tbar.className = a.clsTB;
  me.title(a.iniTitle || '');
  if (!a.noStatus) {
    me.sbar = document.createElement('div');
    me.sbar.className = a.clsSB;
    me.status('&nbsp;');
  }
  // append elements
  me.con.appendChild(me.tbar);
  if (me.nbtn) me.con.appendChild(me.nbtn);
  if (me.mbtn) me.con.appendChild(me.mbtn);
  if (me.cbtn) me.con.appendChild(me.cbtn);
  me.con.appendChild(me.client);
  if (me.sbar) me.con.appendChild(me.sbar);
  if (me.rbtn) me.con.appendChild(me.rbtn);
  document.body.appendChild(me.con);
  // position and paint the fenster
  /*@cc_on
  @if (@_jscript_version <= 5.6) // IE6 or down
      a.noFixed = true;
    @else @*/
      if (!a.noFixed) me.con.style.position = 'fixed';
  /*@end @*/
  me.con.style.borderWidth = (a.conBor || 0) + 'px'; // r18
  me.client.style.borderWidth = (a.cliBor || 0) + 'px'; // r18
  me.client.style.display = 'block'; // do this before paint
  me.client.style.visibility = 'visible';
  me.tbar.style.left = me.tbar.style.right = me.tbar.style.top = M + 'px';
  if (me.sbar) {me.sbar.style.left = me.sbar.style.right = me.sbar.style.bottom = M + 'px';}
  me.client.style.left = M + 'px';
  xMoveTo(me.con, a.iniX || 0, a.iniY || 0);
  me.paint(0, 0);
  // position icons
  var t = M + B, r = t;
  if (me.cbtn) {
    me.cbtn.style.top = t + 'px';
    me.cbtn.style.right = r + 'px';
    r += me.cbtn.offsetWidth + 2;
  }
  if (me.mbtn) {
    me.mbtn.style.top = t + 'px';
    me.mbtn.style.right = r + 'px';
    r += me.mbtn.offsetWidth + 2;
  }
  if (me.nbtn) {
    me.nbtn.style.top = t + 'px';
    me.nbtn.style.right = r + 'px';
  }
  if (me.rbtn) {
    me.rbtn.style.right = me.rbtn.style.bottom = t + 'px';
  }
  // register event listeners
  if (me.isIFrame) {
    me.href(a.iniUrl);
    if (a.fnLoad) {xAddEventListener(me.client, 'load', function(){a.fnLoad(me);}, false);}
    me.client.name = a.clientId;
  }
  if (!a.noMove) xEnableDrag(me.tbar, dragStart, barDrag, dragEnd);
  if (!a.noResize) xEnableDrag(me.rbtn, dragStart, resDrag, dragEnd);
  me.con.onmousedown = me.focus;
  if (!a.noMinimize) me.nbtn.onclick = minClick;
  if (!a.noMaximize) me.mbtn.onclick = me.tbar.ondblclick = maxClick;
  if (!a.noClose) {
    me.cbtn.onclick = me.hide;
    me.cbtn.onmousedown = xStopPropagation;
  }
  xAddEventListener(window, 'unload', winUnload, false);
  xAddEventListener(window, 'resize', winResize, false);
  // show the fenster
  me.con.style.visibility = 'visible';
  me.focus();
  // default value for minW
  if (!a.miniW) { a.miniW = 200; }

} // end xFenster object prototype

// xFenster static properties
xFenster.nextZ = 100;
xFenster.focused = null;
xFenster.instances = {};


