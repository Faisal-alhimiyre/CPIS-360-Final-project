/**
 * app.js
 * ------
 * Application entry: waits for A-Frame, wires UI → generator → interactions.
 *
 * Presentation tip:
 * - Start with the on-page "How to test" section when you demo marker tracking.
 * - Then walk through generator.js (geometry) and interactions.js (opacity toggle).
 */

(function () {
  'use strict';

  function rebuildFromSpec(spec) {
    var handles = window.ArScene.getArHandles();
    if (!handles) {
      window.Ui.setMessage('AR handles missing (scene HTML changed?).');
      return;
    }

    // Ensure the delegated click handler exists once (bound to the scene for reliable bubbling).
    window.Interactions.setupDoorToggle(handles.scene, handles.buildingRoot);

    window.BuildingGenerator.generateBuilding(handles.buildingRoot, spec);

    // After regeneration, front wall starts opaque again (new DOM).
    var front = document.querySelector('#front-wall');
    if (front) {
      front.dataset.wallMode = 'opaque';
      front.setAttribute('material', {
        color: '#5c6a80',
        shader: 'flat',
        opacity: 1,
        transparent: true,
        side: 'double',
      });
    }
  }

  function startApp() {
    // Camera + WebGL start only after a valid Generate (see mountSceneIfNeeded).
    window.Ui.bindForm(function (spec) {
      window.ArScene.mountSceneIfNeeded(function (err) {
        if (err) {
          console.error(err);
          window.Ui.setMessage('Could not start AR scene. Check console / try another browser.');
          return;
        }
        rebuildFromSpec(spec);
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startApp);
  } else {
    startApp();
  }
})();
