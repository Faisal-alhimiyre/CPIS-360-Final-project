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

  /**
   * AR.js arjs-anchor reads scene.systems.arjs once in init(). If the marker is in the HTML
   * template as a sibling that upgrades too early, that reference is undefined forever → hundreds
   * of "isReady" / "startsWith" errors. Attach HIRO after the scene has fired "loaded".
   *
   * @param {Element} scene
   */
  function attachHiroMarkerIfNeeded(scene) {
    if (!scene || scene.querySelector('#hiro-marker')) return;
    var marker = document.createElement('a-marker');
    marker.setAttribute('preset', 'hiro');
    marker.id = 'hiro-marker';
    marker.setAttribute('emitevents', true);
    var root = document.createElement('a-entity');
    root.id = 'building-root';
    root.setAttribute('position', '0 0 0');
    marker.appendChild(root);
    var cam = scene.querySelector('#ar-camera');
    if (cam) scene.insertBefore(marker, cam);
    else scene.appendChild(marker);
  }

  /**
   * First successful form submit clones #ar-scene-template into #ar-container.
   * That is when the browser asks for camera permission (user gesture from the button).
   * Later submits reuse the same scene.
   *
   * @param {(err: Error|null) => void} onReady
   */
  function mountSceneIfNeeded(onReady) {
    var scene = document.getElementById('ar-scene');
    if (scene) {
      function fire() {
        requestAnimationFrame(function () {
          try {
            attachHiroMarkerIfNeeded(scene);
            onReady(null);
          } catch (e) {
            onReady(e);
          }
        });
      }
      if (scene.hasLoaded) fire();
      else scene.addEventListener('loaded', function once() {
        scene.removeEventListener('loaded', once);
        fire();
      });
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

    // Keep arjs= on <a-scene> in index.html (string). Do NOT set arjs here with a JS object on a
    // detached node — A-Frame 1.6 can fail to register scene.systems.arjs, and arjs-anchor then
    // throws endless "isReady" / "startsWith" errors.
    container.appendChild(tpl.content.cloneNode(true));
    document.body.classList.add('ar-mounted');

    scene = document.getElementById('ar-scene');
    if (!scene) {
      onReady(new Error('Scene failed to mount'));
      return;
    }

    function fire() {
      // One frame after "loaded" so scene.systems.arjs is guaranteed to exist before arjs-anchor init.
      requestAnimationFrame(function () {
        try {
          attachHiroMarkerIfNeeded(scene);
          onReady(null);
        } catch (e) {
          onReady(e);
        }
      });
    }
    if (scene.hasLoaded) fire();
    else scene.addEventListener('loaded', function once() {
      scene.removeEventListener('loaded', once);
      fire();
    });
  }

  // Expose on window so other plain scripts can call without a bundler.
  window.ArScene = {
    whenSceneReady: whenSceneReady,
    getArHandles: getArHandles,
    mountSceneIfNeeded: mountSceneIfNeeded,
  };
})();
