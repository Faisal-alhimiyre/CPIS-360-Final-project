/**
 * ar-display-fix.js (markerfix-20)
 * -------------------------------
 * AR.js stacks #arjs-video under the WebGL canvas (video z-index -2). A-Frame’s
 * default clear is opaque black, so the feed is running but invisible. We force
 * a transparent clear and no scene.background every frame while the scene runs.
 */

(function () {
  'use strict';

  function apply(scene) {
    if (!scene || !scene.renderer || !scene.object3D) return;
    scene.renderer.setClearColor(0x000000, 0);
    scene.object3D.background = null;
  }

  function startLoop(scene) {
    if (!scene || scene._cpisClearLoop) return;
    scene._cpisClearLoop = true;
    function loop() {
      apply(scene);
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  }

  function boot() {
    var scene = document.getElementById('ar-scene');
    if (!scene) return;
    if (scene.hasLoaded) {
      apply(scene);
      startLoop(scene);
    } else {
      scene.addEventListener(
        'loaded',
        function () {
          apply(scene);
          startLoop(scene);
        },
        { once: true }
      );
    }
    scene.addEventListener('renderstart', function () {
      apply(scene);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
