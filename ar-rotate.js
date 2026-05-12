/**
 * ar-rotate.js
 * ------------
 * Extra yaw on #building-mount (geometry parent). #building-root only adds a fixed tilt so the entrance reads from phone height.
 */

(function () {
  'use strict';

  var STEP = 18;
  var DRAG_SCALE = 0.25; // deg per horizontal px

  function getRoot() {
    return document.getElementById('building-mount');
  }

  function readYaw(root) {
    if (!root) return 0;
    var d = root.dataset.yawDegrees;
    if (d != null && d !== '') {
      var n = parseFloat(d);
      if (isFinite(n)) return n;
    }
    var r = root.getAttribute('rotation');
    if (r && typeof r === 'object' && typeof r.y !== 'undefined') {
      var ry = parseFloat(r.y);
      if (isFinite(ry)) return ry;
    }
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

  function bindSwipeRotate() {
    var scene = document.getElementById('ar-scene');
    if (!scene) return;

    var dragging = false;
    var lastX = 0;

    function beginDrag(x) {
      dragging = true;
      lastX = x;
    }

    function moveDrag(x) {
      if (!dragging) return;
      var dx = x - lastX;
      lastX = x;
      if (Math.abs(dx) < 1) return;
      var r = getRoot();
      applyYaw(r, readYaw(r) + dx * DRAG_SCALE);
    }

    function endDrag() {
      dragging = false;
    }

    scene.addEventListener('touchstart', function (e) {
      if (!e.touches || e.touches.length !== 1) return;
      beginDrag(e.touches[0].clientX);
    });
    scene.addEventListener(
      'touchmove',
      function (e) {
        if (!e.touches || e.touches.length !== 1) return;
        moveDrag(e.touches[0].clientX);
      },
      { passive: true }
    );
    scene.addEventListener('touchend', endDrag);
    scene.addEventListener('touchcancel', endDrag);

    scene.addEventListener('mousedown', function (e) {
      beginDrag(e.clientX);
    });
    window.addEventListener('mousemove', function (e) {
      moveDrag(e.clientX);
    });
    window.addEventListener('mouseup', endDrag);
  }

  function bind() {
    var root = getRoot();
    var ccw = document.getElementById('btn-spin-ccw');
    var cw = document.getElementById('btn-spin-cw');
    if (!root) return;

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
    bindSwipeRotate();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }
})();
