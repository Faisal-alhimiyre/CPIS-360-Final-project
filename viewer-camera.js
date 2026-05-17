/**
 * viewer-camera.js
 * Model lives on a fixed-height stage (center of screen). Camera always looks at the stage.
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

  function frameCamera(dist) {
    if (window.CpisViewerOrbit && window.CpisViewerOrbit.setFrame) {
      window.CpisViewerOrbit.setFrame(0, STAGE_Y, 0, dist, 0.52, 0.85);
    }
    var focus = document.getElementById('orbit-focus');
    if (focus) {
      focus.setAttribute('position', '0 ' + STAGE_Y + ' 0');
    }
  }

  function applyFocus(mount) {
    var T = three();
    if (!T || !mount) return false;

    mount.setAttribute('rotation', '0 0 0');
    mount.setAttribute('position', '0 0 0');
    mount.object3D.updateMatrixWorld(true);

    var box = new T.Box3().setFromObject(mount.object3D);
    if (box.isEmpty()) return false;

    var center = box.getCenter(new T.Vector3());
    var size = box.getSize(new T.Vector3());

    mount.setAttribute('position', -center.x + ' 0 ' + -center.z);

    var maxDim = Math.max(size.x, size.y, size.z, 0.3);
    var dist = Math.max(maxDim * 1.35, 4.2);
    dist = Math.min(dist, 11);
    frameCamera(dist);
    return true;
  }

  function focusOnMount(mount) {
    if (!mount) return;

    frameCamera(6);

    var tries = 0;
    function attempt() {
      if (applyFocus(mount)) return;
      tries += 1;
      if (tries < 100) {
        requestAnimationFrame(attempt);
      } else {
        frameCamera(6);
      }
    }
    attempt();

    setTimeout(function () {
      applyFocus(mount);
    }, 200);
    setTimeout(function () {
      applyFocus(mount);
    }, 500);
    setTimeout(function () {
      applyFocus(mount);
    }, 1000);
  }

  window.ViewerCamera = {
    focusOnMount: focusOnMount,
    previewScale: previewScale,
    PREVIEW_MAX: PREVIEW_MAX,
    STAGE_Y: STAGE_Y,
  };
})();
