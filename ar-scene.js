/**
 * ar-scene.js
 * -----------
 * Mounts the <a-scene> from the HTML template once the user taps Generate.
 * Keep this file boring: no AR library hacks here — version pairing lives in index.html.
 */

(function () {
  'use strict';

  function whenSceneReady(sceneId, callback) {
    var scene = document.getElementById(sceneId);
    if (!scene) {
      console.error('AR scene not found:', sceneId);
      return;
    }
    if (scene.hasLoaded) {
      callback();
      return;
    }
    scene.addEventListener('loaded', function onLoaded() {
      scene.removeEventListener('loaded', onLoaded);
      callback();
    });
  }

  function getArHandles() {
    var scene = document.getElementById('ar-scene');
    var marker = document.getElementById('hiro-marker');
    var buildingRoot = document.getElementById('building-root');
    if (!scene || !marker || !buildingRoot) return null;
    return { scene: scene, marker: marker, buildingRoot: buildingRoot };
  }

  /**
   * Embedded AR.js often starts with wrong internal size → black “camera”. Push the real
   * #ar-container pixel size into arjs (display + processing canvas).
   */
  function syncArDisplayToContainer() {
    var scene = document.getElementById('ar-scene');
    var box = document.getElementById('ar-container');
    if (!scene || !box) return;
    var r = box.getBoundingClientRect();
    var w = Math.floor(Math.max(2, r.width));
    var h = Math.floor(Math.max(2, r.height));
    if (w < 8 || h < 8) return;
    scene.setAttribute(
      'arjs',
      'sourceType: webcam; trackingMethod: best; debugUIEnabled: false; displayWidth: ' +
        w +
        '; displayHeight: ' +
        h +
        '; canvasWidth: ' +
        w +
        '; canvasHeight: ' +
        h +
        ';'
    );
    window.dispatchEvent(new Event('resize'));
  }

  var resizeTimer = null;
  function onWindowResize() {
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      syncArDisplayToContainer();
    }, 120);
  }

  /**
   * @param {(err: Error|null) => void} onReady
   */
  function mountSceneIfNeeded(onReady) {
    var scene = document.getElementById('ar-scene');
    if (scene) {
      function fire() {
        try {
          syncArDisplayToContainer();
          onReady(null);
        } catch (e) {
          onReady(e);
        }
      }
      if (scene.hasLoaded) fire();
      else {
        scene.addEventListener('loaded', function once() {
          scene.removeEventListener('loaded', once);
          fire();
        });
      }
      if (!document.body.dataset.arResizeBound) {
        document.body.dataset.arResizeBound = '1';
        window.addEventListener('resize', onWindowResize);
        window.addEventListener('orientationchange', onWindowResize);
      }
      return;
    }

    var tpl = document.getElementById('ar-scene-template');
    var container = document.getElementById('ar-container');
    if (!tpl || !container) {
      onReady(new Error('Missing #ar-scene-template or #ar-container'));
      return;
    }

    var ph = document.getElementById('ar-placeholder');
    if (ph) ph.remove();

    container.appendChild(tpl.content.cloneNode(true));
    document.body.classList.add('ar-mounted');

    scene = document.getElementById('ar-scene');
    if (!scene) {
      onReady(new Error('Scene failed to mount'));
      return;
    }

    function fire() {
      try {
        syncArDisplayToContainer();
        setTimeout(syncArDisplayToContainer, 80);
        setTimeout(syncArDisplayToContainer, 350);
        setTimeout(syncArDisplayToContainer, 800);
        onReady(null);
      } catch (e) {
        onReady(e);
      }
    }
    if (scene.hasLoaded) fire();
    else {
      scene.addEventListener('loaded', function once() {
        scene.removeEventListener('loaded', once);
        fire();
      });
    }

    if (!document.body.dataset.arResizeBound) {
      document.body.dataset.arResizeBound = '1';
      window.addEventListener('resize', onWindowResize);
      window.addEventListener('orientationchange', onWindowResize);
    }
  }

  window.ArScene = {
    whenSceneReady: whenSceneReady,
    getArHandles: getArHandles,
    mountSceneIfNeeded: mountSceneIfNeeded,
    syncArDisplayToContainer: syncArDisplayToContainer,
  };
})();
