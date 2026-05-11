/**
 * ar-display-fix.js (markerfix-21)
 * -------------------------------
 * Webcam sits under the WebGL canvas (AR.js). The canvas must clear transparent.
 * A separate requestAnimationFrame loop fought A-Frame’s own render pass — one
 * transparent frame then opaque black forever (“flash then black”). This uses
 * an A-Frame component tick so setClearColor runs in the same frame pipeline.
 */

(function () {
  'use strict';

  if (typeof AFRAME === 'undefined') return;

  AFRAME.registerComponent('cpis-transparent-clear', {
    tick: function () {
      var scene = this.el.sceneEl;
      if (!scene || !scene.renderer || !scene.object3D) return;
      scene.renderer.setClearColor(0x000000, 0);
      scene.object3D.background = null;
    },
  });

  function deployBar() {
    var sen = document.createElement('div');
    sen.textContent = 'markerfix-21 — transparent clear on A-Frame tick (fixes flash-then-black). (4s)';
    sen.style.cssText =
      'position:fixed;bottom:0;left:0;right:0;z-index:2147483647;background:#ffef00;color:#000;font:700 13px system-ui,sans-serif;padding:8px;text-align:center;';
    if (document.body) document.body.appendChild(sen);
    setTimeout(function () {
      if (sen.parentNode) sen.parentNode.removeChild(sen);
    }, 4000);
  }

  function attach() {
    var scene = document.getElementById('ar-scene');
    if (scene && !scene.hasAttribute('cpis-transparent-clear')) {
      scene.setAttribute('cpis-transparent-clear', '');
    }
    deployBar();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attach);
  } else {
    attach();
  }
})();
