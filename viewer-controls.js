/**
 * viewer-controls.js — on-screen rotate / zoom (works when touch drag fails).
 */

(function () {
  'use strict';

  function run(fn) {
    if (window.CpisViewerOrbit && fn) fn();
  }

  function bindHold(btnId, action) {
    var btn = document.getElementById(btnId);
    if (!btn) return;
    var timer = null;

    function stop() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    }

    function start(e) {
      e.preventDefault();
      action();
      stop();
      timer = setInterval(action, 120);
    }

    btn.addEventListener('click', function (e) {
      e.preventDefault();
      action();
    });
    btn.addEventListener('mousedown', start);
    btn.addEventListener('mouseup', stop);
    btn.addEventListener('mouseleave', stop);
    btn.addEventListener('touchstart', start, { passive: false });
    btn.addEventListener('touchend', stop);
    btn.addEventListener('touchcancel', stop);
  }

  function bind() {
    bindHold('orb-left', function () {
      run(function () {
        window.CpisViewerOrbit.rotateLeft();
      });
    });
    bindHold('orb-right', function () {
      run(function () {
        window.CpisViewerOrbit.rotateRight();
      });
    });
    bindHold('orb-zoom-in', function () {
      run(function () {
        window.CpisViewerOrbit.zoomIn();
      });
    });
    bindHold('orb-zoom-out', function () {
      run(function () {
        window.CpisViewerOrbit.zoomOut();
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }
})();
