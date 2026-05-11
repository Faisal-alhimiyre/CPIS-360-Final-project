/**
 * ar-scene.js
 * -----------
 * Small helpers around the A-Frame / AR.js scene so the rest of the app
 * does not scatter DOM queries everywhere.
 *
 * AR.js drives the camera; we only read the scene + marker + building root.
 */

(function () {
  'use strict';

  /**
   * Waits until A-Frame has finished initializing the scene graph.
   * @param {string} sceneId
   * @param {() => void} callback
   */
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

  /**
   * @returns {{ scene: Element, marker: Element, buildingRoot: Element } | null}
   */
  function getArHandles() {
    var scene = document.getElementById('ar-scene');
    var marker = document.getElementById('hiro-marker');
    var buildingRoot = document.getElementById('building-root');
    if (!scene || !marker || !buildingRoot) return null;
    return { scene: scene, marker: marker, buildingRoot: buildingRoot };
  }

  // Expose on window so other plain scripts can call without a bundler.
  window.ArScene = {
    whenSceneReady: whenSceneReady,
    getArHandles: getArHandles,
  };
})();
