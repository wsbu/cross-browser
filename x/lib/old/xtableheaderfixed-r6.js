// xTableHeaderFixed r6, Copyright 2006-2009 Michael Foster (Cross-Browser.com)
// Part of X, a Cross-Browser Javascript Library, Distributed under the terms of the GNU LGPL
function xTableHeaderFixed(tableClass, container, isWin)
{
  // Private Properties
  var _i = this, con, tables, cbl = 0, cbt = 0;
  // Private Methods
  function onEvent(e) // handles scroll and resize events
  {
    var i, r;
    e = e || window.event;
    r = e.type == 'resize';
    for (i = 0; i < tables.length; ++i) {
      scroll(tables[i], r);
    }
  }
  function scroll(t, r)
  {
    var i, ht, th1, th2, st, ty, thy;
    if (!t) { return; }
    ht = xGetElementById(t.xthfHdrTblId);
    // Position and resize the header table.
    xLeft(ht, xPageX(t) - xScrollLeft(con, isWin) + cbl);
    if (!isWin) {
      xTop(ht, xPageY(con) + cbt); // I think adding cbt is not needed in IE8
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
    st = xScrollTop(con, isWin);
    if (isWin) {
      ty = xPageY(t);
    }
    else {
      ty = t.offsetTop;
    }
    thy = ty + t.rows[0].offsetTop;
    if (st <= thy || st > ty + t.offsetHeight - ht.offsetHeight) {
      ht.style.visibility = 'hidden';
    }
    else {
      ht.style.visibility = 'visible';
    }
  }
  function unload()
  {
    xRemoveEventListener(con, 'scroll', onEvent);
    xRemoveEventListener(window, 'resize', onEvent);
    xRemoveEventListener(window, 'unload', unload);
    for (var i = 0; i < tables.length; ++i) {
      tables[i] = null;
    }
    con = null;
    _i = null;
  }
  function init()
  {
    var i, h, t, htc = isWin ? 'xthf-fix-tbl' : 'xthf-abs-tbl';
    tables = xGetElementsByClassName(tableClass, document, 'table');
    con = xGetElementById(container);
    if (!tables || !tables.length || !con) { return false; }
    // Create a header table for each table with tableClass.
    for (i = 0; i < tables.length; ++i) {
      h = tables[i].tHead;
      if (h) {
        t = document.createElement('table');
        t.className = tableClass + ' ' + htc;
        if (tables[i].cellSpacing !== '') {
          t.cellSpacing = tables[i].cellSpacing;
        }
        t.appendChild(h.cloneNode(true));
        t.id = tables[i].xthfHdrTblId = 'xthf-' + tableClass + '-' + i;
        document.body.appendChild(t);
      }
      else {
        tables[i] = null;
      }
    }
    if (!isWin && !window.opera) { // yuck
      cbl = xGetComputedStyle(con, 'border-left-width', true),
      cbt = xGetComputedStyle(con, 'border-top-width', true);
    }
    return true;
  }
  // Constructor Code
  if (init()) {
    onEvent({type:'resize'});
    xAddEventListener(con, 'scroll', onEvent, false);
    xAddEventListener(window, 'resize', onEvent, false);
    xAddEventListener(window, 'unload', unload, false);
  }
} // end xTableHeaderFixed
