/**
 * ar-display-fix.js (markerfix-22)
 * -------------------------------
 * AR.js keeps #arjs-video under the WebGL canvas. The canvas must clear transparent.
 * setClearColor in component tick can run at the wrong point vs Three’s render pass.
 * Wrapping renderer.render forces transparent clear immediately before each draw.
 */

(function () {
  'use strict';

  if (typeof AFRAME === 'undefined') return;

  AFRAME.registerComponent('cpis-transparent-clear', {
    init: function () {
      var root = this.el;

      function wire() {
        var sceneEl = root;
        var r = sceneEl.renderer;
        if (!r || r._cpisPreRenderBound) return;
        r._cpisPreRenderBound = true;
        var orig = r.render.bind(r);
        r.render = function (sceneObj, camera) {
          r.setClearColor(0x000000, 0);
          if (sceneObj && sceneObj.isScene) sceneObj.background = null;
          return orig(sceneObj, camera);
        };
      }

      root.addEventListener('renderstart', wire);
      root.addEventListener('loaded', function () {
        setTimeout(wire, 0);
        setTimeout(wire, 400);
      });
    },
  });

  function deployBar() {
    var sen = document.createElement('div');
    sen.textContent =
      'markerfix-22 — render() wrapped for transparent clear + URL sync. (4s)';
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
