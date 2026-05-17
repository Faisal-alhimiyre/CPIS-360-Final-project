/**
 * viewer-app-core.js
 * ------------------
 * Build cutaway apartment on viewer.html (no marker / no AR.js).
 */

(function () {
  'use strict';

  function rebuildFromSpec(spec) {
    var mount = document.getElementById('building-mount');
    var scene = document.getElementById('viewer-scene');
    if (!mount || !scene) {
      return '3D scene not found.';
    }

    var buildSpec = Object.assign({}, spec, {
      useFixedApartmentTemplate: true,
      previewCutaway: true,
    });
    delete buildSpec.apartmentLayout;

    window.BuildingGenerator.generateBuilding(mount, buildSpec);

    if (window.RoomRelocate) {
      window.RoomRelocate.attach(mount);
    }
    return null;
  }

  window.ViewerAppCore = {
    rebuildFromSpec: rebuildFromSpec,
  };
})();
