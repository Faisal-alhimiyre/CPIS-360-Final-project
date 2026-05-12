/**
 * ar-scene.js
 * -----------
 * Minimal: scene is static in ar.html. No AR.js monkey-patching (that path caused black screens).
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
    var buildingMount = document.getElementById('building-mount');
    if (!scene || !marker || !buildingMount) return null;
    return { scene: scene, marker: marker, buildingRoot: buildingMount };
  }

  /**
   * @param {(err: Error|null) => void} onReady
   */
  function mountSceneIfNeeded(onReady) {
    var scene = document.getElementById('ar-scene');
    if (!scene) {
      onReady(new Error('Missing #ar-scene'));
      return;
    }
    try {
      onReady(null);
    } catch (e) {
      onReady(e);
    }
  }

  window.ArScene = {
    whenSceneReady: whenSceneReady,
    getArHandles: getArHandles,
    mountSceneIfNeeded: mountSceneIfNeeded,
  };
})();
