/**
 * ar-canvas-sync.js (markerfix-17)
 * --------------------------------
 * 1) Shows #arjs-video in a small PIP so you can SEE if getUserMedia works (green border).
 * 2) A few timed canvas syncs — NOT a tight loop (that fought A-Frame and kept the main view black).
 * 3) One renderer.setSize from the scene’s layout so WebGL buffer matches the CSS box.
 */

(function () {
  'use strict';

  var sentinel = document.createElement('div');
  sentinel.id = 'cpis-deploy-sentinel';
  sentinel.textContent =
    'markerfix-17 — green box = live webcam PIP. Main view should follow after sync. (9s)';
  sentinel.style.cssText =
    'position:fixed;bottom:0;left:0;right:0;z-index:2147483647;background:#ffef00;color:#000;font:700 15px system-ui,sans-serif;padding:12px;text-align:center;border-top:4px solid red;';
  function mountSentinel() {
    if (document.body) document.body.appendChild(sentinel);
  }
  if (document.body) mountSentinel();
  else document.addEventListener('DOMContentLoaded', mountSentinel);
  setTimeout(function () {
    if (sentinel.parentNode) sentinel.parentNode.removeChild(sentinel);
  }, 9000);

  function injectPipCss() {
    if (document.getElementById('cpis-arjs-video-pip-style')) return;
    var s = document.createElement('style');
    s.id = 'cpis-arjs-video-pip-style';
    s.textContent =
      '#arjs-video{position:fixed!important;bottom:88px!important;right:10px!important;width:min(200px,32vw)!important;height:auto!important;max-height:180px!important;z-index:60!important;opacity:0.92!important;object-fit:cover!important;pointer-events:none!important;border:4px solid #16a34a!important;box-sizing:border-box!important;margin:0!important;}';
    document.head.appendChild(s);
  }

  function watchVideoNode() {
    if (document.getElementById('arjs-video')) {
      injectPipCss();
      return;
    }
    var mo = new MutationObserver(function () {
      if (document.getElementById('arjs-video')) {
        mo.disconnect();
        injectPipCss();
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });
    setTimeout(function () {
      mo.disconnect();
    }, 15000);
  }

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
    watchVideoNode();
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
