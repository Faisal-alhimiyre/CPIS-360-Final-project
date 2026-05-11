/**
 * ar-stack.js (markerfix-24)
 * Marker AR: DOM #arjs-video under transparent WebGL. Lifts video above body
 * background (AR.js sets z-index:-2 inline) and keeps a transparent clear.
 */

(function () {
  'use strict';

  if (typeof AFRAME === 'undefined') return;

  function liftArjsVideo() {
    var v = document.getElementById('arjs-video');
    if (!v) return;
    v.style.setProperty('position', 'fixed', 'important');
    v.style.setProperty('left', '0', 'important');
    v.style.setProperty('top', '0', 'important');
    v.style.setProperty('width', '100vw', 'important');
    v.style.setProperty('height', '100vh', 'important');
    v.style.setProperty('object-fit', 'cover', 'important');
    v.style.setProperty('opacity', '1', 'important');
    v.style.setProperty('visibility', 'visible', 'important');
    v.style.setProperty('z-index', '1', 'important');
  }

  AFRAME.registerComponent('cpis-ar-marker-stack', {
    init: function () {
      var scene = this.el;
      var applyClear = function () {
        var r = scene.renderer;
        if (!r) return;
        r.autoClear = true;
        r.setClearColor(0x000000, 0);
        if (scene.object3D) scene.object3D.background = null;
      };

      scene.addEventListener('loaded', applyClear);
      scene.addEventListener('renderstart', applyClear);
      this.tick = applyClear;

      window.addEventListener('arjs-video-loaded', liftArjsVideo);
      liftArjsVideo();

      var n = 0;
      var iv = setInterval(function () {
        liftArjsVideo();
        if (++n > 30) clearInterval(iv);
      }, 200);
    },
  });

  function attach() {
    var s = document.getElementById('ar-scene');
    if (s && !s.hasAttribute('cpis-ar-marker-stack')) {
      s.setAttribute('cpis-ar-marker-stack', '');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attach);
  } else {
    attach();
  }
})();
