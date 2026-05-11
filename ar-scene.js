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
   * @param {(err: Error|null) => void} onReady
   */
  function mountSceneIfNeeded(onReady) {
    var scene = document.getElementById('ar-scene');
    if (scene) {
      function fire() {
        try {
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

    // AR.js resize kludge (also used inside AR.js system) — helps embedded canvas pick up layout.
    setTimeout(function () {
      window.dispatchEvent(new Event('resize'));
    }, 100);
  }

  window.ArScene = {
    whenSceneReady: whenSceneReady,
    getArHandles: getArHandles,
    mountSceneIfNeeded: mountSceneIfNeeded,
  };
})();
