/**
 * viewer-camera.js — center model at origin, isometric orbit (reference-style).
 */

(function () {
  'use strict';

  var PREVIEW_MAX = 4.2;

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

  /** Isometric-style orbit (like reference dollhouse image). */
  function frameCamera(dist) {
    var pivot = document.getElementById('orbit-pivot');
    if (pivot) {
      pivot.setAttribute('position', '0 0 0');
    }
    var focus = document.getElementById('orbit-focus');
    if (focus) {
      focus.setAttribute('position', '0 0 0');
    }
    if (window.CpisViewerOrbit && window.CpisViewerOrbit.setView) {
      window.CpisViewerOrbit.setView(dist, 0.84, 0.72);
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

    mount.setAttribute(
      'position',
      -center.x + ' ' + -center.y + ' ' + -center.z
    );

    mount.object3D.updateMatrixWorld(true);
    box.setFromObject(mount.object3D);
    size = box.getSize(new T.Vector3());

    var maxDim = Math.max(size.x, size.y, size.z, 0.35);
    var dist = Math.max(maxDim * 2.05, 5);
    dist = Math.min(dist, 13);
    frameCamera(dist);
    return true;
  }

  function focusOnMount(mount) {
    if (!mount) return;
    frameCamera(7);

    var tries = 0;
    function attempt() {
      if (applyFocus(mount)) return;
      tries += 1;
      if (tries < 100) {
        requestAnimationFrame(attempt);
      } else {
        frameCamera(7);
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
  };
})();
