/**
 * ar-canvas-sync.js (markerfix-19)
 * --------------------------------
 * AR.js: copyElementSizeTo(canvas) matches the webcam element to the WebGL canvas.
 * Do NOT call setSize(w,h,false) here — that updates the drawing buffer but skips
 * updating canvas CSS (Three.js), which often yields a black or wrong-sized view.
 * Fullscreen a-scene (no embedded) matches what AR.js artoolkit expects on resize.
 */

(function () {
  'use strict';

  var sentinel = document.createElement('div');
  sentinel.id = 'cpis-deploy-sentinel';
  sentinel.textContent =
    'markerfix-19 — fullscreen AR + fixed canvas sizing. (5s)';
  sentinel.style.cssText =
    'position:fixed;bottom:0;left:0;right:0;z-index:2147483647;background:#ffef00;color:#000;font:700 14px system-ui,sans-serif;padding:10px;text-align:center;border-top:3px solid red;';
  function mountSentinel() {
    if (document.body) document.body.appendChild(sentinel);
  }
  if (document.body) mountSentinel();
  else document.addEventListener('DOMContentLoaded', mountSentinel);
  setTimeout(function () {
    if (sentinel.parentNode) sentinel.parentNode.removeChild(sentinel);
  }, 5000);

  function syncMainCanvas(scene) {
    try {
      var ar = scene.systems && scene.systems.arjs;
      if (!ar || !ar._arSession || !ar._arSession.arSource || !scene.renderer) return false;
      var arSource = ar._arSession.arSource;
      var canvas = scene.renderer.domElement;
      if (typeof arSource.onResizeElement === 'function') {
        arSource.onResizeElement();
      }
      arSource.copyElementSizeTo(canvas);
      window.dispatchEvent(new Event('resize'));
      return true;
    } catch (e) {
      return false;
    }
  }

  function scheduleSyncAttempts(scene) {
    var delays = [0, 120, 400, 1000, 2200, 4500];
    var i;
    for (i = 0; i < delays.length; i++) {
      (function (ms) {
        setTimeout(function () {
          syncMainCanvas(scene);
        }, ms);
      })(delays[i]);
    }
  }

  function bindResize(scene) {
    var t;
    function fire() {
      clearTimeout(t);
      t = setTimeout(function () {
        syncMainCanvas(scene);
      }, 80);
    }
    window.addEventListener('resize', fire);
    window.addEventListener('orientationchange', fire);
  }

  function kick() {
    var scene = document.getElementById('ar-scene');
    if (!scene) return;
    function arm() {
      scheduleSyncAttempts(scene);
      bindResize(scene);
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
    setTimeout(arm, 2000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', kick);
  } else {
    kick();
  }
})();
