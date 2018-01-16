// xTableHeaderFixed r7, Copyright 2006-2009 Michael Foster (Cross-Browser.com)
// Part of X, a Cross-Browser Javascript Library, Distributed under the terms of the GNU LGPL
function xTableHeaderFixed(tclass, tcon, w)
{
  // Public Method
  this.init = function(tclass, tcon, w)
  {
    _dtor();
    return _ctor(tclass, tcon, w);
  };
  // Constructor Code
  var _i = this, con, tbl, win, cbl = 0, cbt = 0, fc = 'xthf-fix-tbl', ac = 'xthf-abs-tbl'; // private properties
  if (tclass) {
    _ctor(tclass, tcon, w);
  }
  // Private Methods
  function _ctor(tclass, tcon, w)
  {
    var i, h, t, htc = (w ? fc : ac);
    tbl = xGetElementsByClassName(tclass, document, 'table');
    con = xGetElementById(tcon);
    if (!tbl || !tbl.length || !con) {
      //alert('xTableHeaderFixed._ctor failed\ntclass: ' + tclass + '\ntcon: ' + tcon); // comment-out after debug
      return false;
    }
    if (!(win = w)) {
      con.scrollTop = 0;
    }
    // Create a header table for each table with tclass.
    for (i = 0; i < tbl.length; ++i) {
      h = tbl[i].tHead;
      if (h) {
        t = document.createElement('table');
        t.className = tclass + ' ' + htc;
        if (tbl[i].cellSpacing !== '') {
          t.cellSpacing = tbl[i].cellSpacing;
        }
        t.appendChild(h.cloneNode(true));
        t.id = tbl[i].xthfHdrTblId = 'xthf-' + tclass + '-' + i;
        document.body.appendChild(t);
      }
      else {
        tbl[i] = null;
      }
    }
    if (!w && !window.opera) { // yuck
      cbl = xGetComputedStyle(con, 'border-left-width', true),
      cbt = xGetComputedStyle(con, 'border-top-width', true);
    }
    _event({type:'resize'});
    xAddEventListener(con, 'scroll', _event, false);
    xAddEventListener(window, 'resize', _event, false);
    xAddEventListener(window, 'unload', _dtor, false);
    return true;
  }
  function _dtor()
  {
    var i, ht;
    if (con) {
      xRemoveEventListener(con, 'scroll', _event);
      xRemoveEventListener(window, 'resize', _event);
      xRemoveEventListener(window, 'unload', _dtor);
      // Remove the header tables from the DOM.
      for (i = 0; i < tbl.length; ++i) {
        ht = xGetElementById(tbl[i].xthfHdrTblId);
        if (ht) {
          document.body.removeChild(ht);
        }
        tbl[i] = null;
      }
      tbl = null;
      con = null;
    }
  }
  function _event(e) // handles scroll and resize events
  {
    var i, r;
    e = e || window.event;
    r = e.type == 'resize';
    for (i = 0; i < tbl.length; ++i) {
      _paint(tbl[i], r);
    }
  }
  function _paint(t, r)
  {
    var i, ht, th1, th2, st, ty, thy;
    if (!t) { return; }
    ht = xGetElementById(t.xthfHdrTblId);
    // Position and resize the header table.
    xLeft(ht, xPageX(t) - xScrollLeft(con, win) + cbl); // TODO - I think adding cbl is not needed in IE8
    if (!win) {
      xTop(ht, xPageY(con) + cbt);
    }
    if (r) {
      xWidth(ht, t.offsetWidth + xGetComputedStyle(t, 'border-left-width', true));
      // Resize the header table THs.
      th1 = xGetElementsByTagName('th', t.tHead);
      th2 = xGetElementsByTagName('th', ht.tHead);
      for (i = 0; i < th1.length; ++i) {
        xWidth(th2[i], th1[i].offsetWidth);
      }
    }
    // Hide or show the header table.
    st = xScrollTop(con, win);
    if (win) {
      ty = xPageY(t);
    }
    else {
      ty = t.offsetTop;
    }
    thy = ty + t.rows[0].offsetTop;
    //alert(ht.id + "\nhide if (st <= thy || st > ty + t.offsetHeight - ht.offsetHeight)\n" +
    //  st + ' <= ' + thy + ' || ' + st + ' > ' + (ty + t.offsetHeight - ht.offsetHeight) + ' (' + ty + ' + ' + t.offsetHeight + ' - ' + ht.offsetHeight + ')');
    if (st <= thy || st > ty + t.offsetHeight - ht.offsetHeight) {
      ht.style.visibility = 'hidden';
    }
    else {
      ht.style.visibility = 'visible';
    }
  }
} // end xTableHeaderFixed
