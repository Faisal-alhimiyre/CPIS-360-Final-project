/**
 * app-core.js
 * ------------
 * Shared AR build step (used on ar.html). Form page does not load this file.
 */

(function () {
  'use strict';

  function rebuildFromSpec(spec) {
    var handles = window.ArScene.getArHandles();
    if (!handles) {
      return 'AR handles missing (scene HTML changed?).';
    }

    window.Interactions.setupDoorToggle(handles.scene, handles.buildingRoot);

    window.BuildingGenerator.generateBuilding(handles.buildingRoot, spec);

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
    return null;
  }

  window.AppCore = {
    rebuildFromSpec: rebuildFromSpec,
  };
})();
