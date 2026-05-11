/**
 * ar-canvas-sync.js
 * -----------------
 * AR.js artoolkit path does NOT call copyElementSizeTo() on the A-Frame WebGL canvas
 * (it only sizes the hidden AR processing canvas). Without syncing, the main canvas
 * often stays wrong → permanent black. This file repeats the copy while the session boots.
 */

(function () {
  'use strict';

  var sentinel = document.createElement('div');
  sentinel.id = 'cpis-deploy-sentinel';
  sentinel.textContent =
    'markerfix-16 ACTIVE — if you never saw this yellow bar, your browser is running OLD cached JS.';
  sentinel.style.cssText =
    'position:fixed;bottom:0;left:0;right:0;z-index:2147483647;background:#ffef00;color:#000;font:700 16px system-ui,sans-serif;padding:14px 12px;text-align:center;border-top:5px solid red;';
  function mountSentinel() {
    if (document.body) document.body.appendChild(sentinel);
  }
  if (document.body) mountSentinel();
  else document.addEventListener('DOMContentLoaded', mountSentinel);
  setTimeout(function () {
    if (sentinel.parentNode) sentinel.parentNode.removeChild(sentinel);
  }, 9000);

  var armed = false;

  function beginInterval() {
    if (armed) return;
    armed = true;
    var scene = document.getElementById('ar-scene');
    if (!scene) return;
    var n = 0;
    var id = setInterval(function () {
      n += 1;
      if (n > 100) {
        clearInterval(id);
        return;
      }
      try {
        var ar = scene.systems && scene.systems.arjs;
        if (!ar || !ar._arSession || !ar._arSession.arSource || !scene.renderer) return;
        ar._arSession.arSource.copyElementSizeTo(scene.renderer.domElement);
      } catch (e) {
        /* session not ready yet */
      }
    }, 120);
  }

  function kick() {
    var scene = document.getElementById('ar-scene');
    if (!scene) return;
    if (scene.hasLoaded && scene.renderer) {
      beginInterval();
      return;
    }
    scene.addEventListener(
      'renderstart',
      function () {
        beginInterval();
      },
      { once: true }
    );
    setTimeout(beginInterval, 2200);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', kick);
  } else {
    kick();
  }
})();
