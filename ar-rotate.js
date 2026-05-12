/**
 * ar-rotate.js
 * ------------
 * Extra yaw on #building-root. Marker tracking still fixes position; this only spins the model in place.
 */

(function () {
  'use strict';

  var STEP = 18;

  function getRoot() {
    return document.getElementById('building-root');
  }

  function readYaw(root) {
    if (!root) return 0;
    var d = root.dataset.yawDegrees;
    if (d != null && d !== '') {
      var n = parseFloat(d);
      if (isFinite(n)) return n;
    }
    var r = root.getAttribute('rotation');
    if (typeof r === 'string') {
      var parts = r.trim().split(/\s+/);
      if (parts.length >= 2) {
        var yy = parseFloat(parts[1]);
        return isFinite(yy) ? yy : 0;
      }
    }
    return 0;
  }

  function applyYaw(root, deg) {
    if (!root) return;
    root.setAttribute('rotation', '0 ' + deg + ' 0');
    root.dataset.yawDegrees = String(deg);
  }

  function bind() {
    var root = getRoot();
    var ccw = document.getElementById('btn-spin-ccw');
    var cw = document.getElementById('btn-spin-cw');
    if (!root || (!ccw && !cw)) return;

    if (ccw) {
      ccw.addEventListener('click', function () {
        var r = getRoot();
        applyYaw(r, readYaw(r) - STEP);
      });
    }
    if (cw) {
      cw.addEventListener('click', function () {
        var r = getRoot();
        applyYaw(r, readYaw(r) + STEP);
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }
})();
