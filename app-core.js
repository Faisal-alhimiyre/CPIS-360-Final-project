/**
 * app-core.js
 * ------------
 * Shared AR build step (used on ar.html). Form page does not load this file.
 */

(function () {
  'use strict';

  function resetExteriorWalls() {
    var walls = document.querySelectorAll('.ext-wall');
    var i;
    for (i = 0; i < walls.length; i++) {
      var w = walls[i];
      var c = w.dataset.extColor || '#64748b';
      w.dataset.wallMode = 'opaque';
      w.setAttribute('material', {
        color: c,
        shader: 'flat',
        opacity: 1,
        transparent: true,
        side: 'double',
      });
    }
  }

  function rebuildFromSpec(spec) {
    var handles = window.ArScene.getArHandles();
    if (!handles) {
      return 'AR handles missing (scene HTML changed?).';
    }

    window.Interactions.setupDoorToggle(handles.scene, handles.buildingRoot);

    window.BuildingGenerator.generateBuilding(handles.buildingRoot, spec);

    resetExteriorWalls();
    return null;
  }

  window.AppCore = {
    rebuildFromSpec: rebuildFromSpec,
  };
})();
