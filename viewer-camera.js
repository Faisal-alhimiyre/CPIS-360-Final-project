/**
 * viewer-camera.js — center model on stage; camera orbits the middle of the screen.
 */

(function () {
  'use strict';

  var PREVIEW_MAX = 5.5;
  var STAGE_Y = 2.75;

  function three() {
    if (typeof AFRAME !== 'undefined' && AFRAME.THREE) return AFRAME.THREE;
    return null;
  }

  function previewScale(spec, viewerMode) {
    var perFloorH = spec.height / Math.max(spec.floors || 1, 1);
    var stackH = viewerMode === 'building' ? perFloorH * 2 : perFloorH;
    var raw = Math.max(spec.width || 1, spec.depth || 1, stackH, 0.5);
    return PREVIEW_MAX / raw;
  }

  function frameCamera(dist, theta, phi) {
    if (window.CpisViewerOrbit && window.CpisViewerOrbit.setFrame) {
      window.CpisViewerOrbit.setFrame(
        0,
        STAGE_Y,
        0,
        dist,
        typeof phi === 'number' ? phi : 0.58,
        typeof theta === 'number' ? theta : 0.78
      );
    }
    var focus = document.getElementById('orbit-focus');
    if (focus) {
      focus.setAttribute('position', '0 ' + STAGE_Y + ' 0');
    }
  }

  function applyFocus(mount) {
    var T = three();
    var stage = document.getElementById('model-stage');
    if (!T || !mount || !stage) return false;

    mount.setAttribute('rotation', '0 0 0');
    mount.setAttribute('position', '0 0 0');
    mount.object3D.updateMatrixWorld(true);

    var box = new T.Box3().setFromObject(mount.object3D);
    if (box.isEmpty()) return false;

    var size = box.getSize(new T.Vector3());
    var centerWorld = box.getCenter(new T.Vector3());
    var stageWorld = new T.Vector3();
    stage.object3D.getWorldPosition(stageWorld);

    mount.setAttribute(
      'position',
      (stageWorld.x - centerWorld.x) + ' 0 ' + (stageWorld.z - centerWorld.z)
    );

    var maxDim = Math.max(size.x, size.y, size.z, 0.3);
    var dist = Math.max(maxDim * 1.22, 4);
    dist = Math.min(dist, 10);
    frameCamera(dist, 0.78, 0.58);
    return true;
  }

  function focusOnMount(mount) {
    if (!mount) return;

    frameCamera(5.5, 0.78, 0.58);

    var tries = 0;
    function attempt() {
      if (applyFocus(mount)) return;
      tries += 1;
      if (tries < 100) {
        requestAnimationFrame(attempt);
      } else {
        frameCamera(5.5, 0.78, 0.58);
      }
    }
    attempt();

    [200, 500, 1000].forEach(function (ms) {
      setTimeout(function () {
        applyFocus(mount);
      }, ms);
    });
  }

  window.ViewerCamera = {
    focusOnMount: focusOnMount,
    previewScale: previewScale,
    PREVIEW_MAX: PREVIEW_MAX,
    STAGE_Y: STAGE_Y,
  };
})();
