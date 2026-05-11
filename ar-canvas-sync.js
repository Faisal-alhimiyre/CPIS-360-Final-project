/**
 * ar-canvas-sync.js (markerfix-18)
 * --------------------------------
 * AR.js uses #arjs-video’s laid-out size when syncing the WebGL canvas. A “corner PIP”
 * shrinks that element and breaks tracking — do NOT restyle #arjs-video here.
 * Sparse sync only: copyElementSizeTo + setSize a few times after render starts.
 */

(function () {
  'use strict';

  var sentinel = document.createElement('div');
  sentinel.id = 'cpis-deploy-sentinel';
  sentinel.textContent =
    'markerfix-18 — full-frame camera (no PIP). Yellow bar = new JS. (6s)';
  sentinel.style.cssText =
    'position:fixed;bottom:0;left:0;right:0;z-index:2147483647;background:#ffef00;color:#000;font:700 14px system-ui,sans-serif;padding:10px;text-align:center;border-top:3px solid red;';
  function mountSentinel() {
    if (document.body) document.body.appendChild(sentinel);
  }
  if (document.body) mountSentinel();
  else document.addEventListener('DOMContentLoaded', mountSentinel);
  setTimeout(function () {
    if (sentinel.parentNode) sentinel.parentNode.removeChild(sentinel);
  }, 6000);

  function syncMainCanvas(scene) {
    try {
      var ar = scene.systems && scene.systems.arjs;
      if (!ar || !ar._arSession || !ar._arSession.arSource || !scene.renderer) return false;
      var arSource = ar._arSession.arSource;
      var canvas = scene.renderer.domElement;
      arSource.copyElementSizeTo(canvas);

      var host = canvas.closest('a-scene') || canvas.parentElement || canvas;
      var r = host.getBoundingClientRect();
      var w = Math.max(8, Math.floor(r.width));
      var h = Math.max(8, Math.floor(r.height));
      var pr = Math.min(window.devicePixelRatio || 1, 2);
      scene.renderer.setPixelRatio(pr);
      scene.renderer.setSize(w, h, false);
      window.dispatchEvent(new Event('resize'));
      return true;
    } catch (e) {
      return false;
    }
  }

  function scheduleSyncAttempts(scene) {
    var delays = [0, 250, 700, 1400, 2800];
    var i;
    for (i = 0; i < delays.length; i++) {
      (function (ms) {
        setTimeout(function () {
          syncMainCanvas(scene);
        }, ms);
      })(delays[i]);
    }
  }

  function kick() {
    var scene = document.getElementById('ar-scene');
    if (!scene) return;
    function arm() {
      scheduleSyncAttempts(scene);
    }
    if (scene.hasLoaded && scene.renderer) {
      arm();
      return;
    }
    scene.addEventListener(
      'renderstart',
      function () {
        arm();
      },
      { once: true }
    );
    setTimeout(arm, 2400);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', kick);
  } else {
    kick();
  }
})();
