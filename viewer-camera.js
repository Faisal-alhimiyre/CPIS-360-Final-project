/**
 * viewer-camera.js — frame the model in the center of the screen (dollhouse view).
 */

(function () {
  'use strict';

  /** Larger = bigger model on screen */
  var PREVIEW_MAX = 5.5;

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

  function applyFocus(mount) {
    var T = three();
    if (!T || !mount) return false;

    mount.setAttribute('rotation', '0 0 0');
    mount.object3D.updateMatrixWorld(true);
    var box = new T.Box3().setFromObject(mount.object3D);
    if (box.isEmpty()) return false;

    var center = box.getCenter(new T.Vector3());
    var size = box.getSize(new T.Vector3());

    /* Put model on a "pedestal" in the upper half of the scene */
    var pedestalY = 2.4 + size.y * 0.35;
    mount.setAttribute(
      'position',
      -center.x + ' ' + (-center.y + pedestalY) + ' ' + -center.z
    );

    mount.object3D.updateMatrixWorld(true);
    box.setFromObject(mount.object3D);
    center = box.getCenter(new T.Vector3());
    size = box.getSize(new T.Vector3());

    var maxDim = Math.max(size.x, size.y, size.z, 0.25);
    /* Closer camera = model fills the viewport */
    var dist = Math.max(maxDim * 1.45, 4);
    dist = Math.min(dist, 12);

    /*
     * Aim slightly below the model center so the building sits higher on screen
     * (fixes flat floor plans hugging the bottom edge).
     */
    var aimY = center.y - Math.max(size.y * 0.55, 0.35);

    var focus = document.getElementById('orbit-focus');
    if (focus) {
      focus.object3D.position.set(center.x, aimY, center.z);
    }

    if (window.CpisViewerOrbit && window.CpisViewerOrbit.setFrame) {
      window.CpisViewerOrbit.setFrame(center.x, aimY, center.z, dist, 0.45, 0.82);
    }
    return true;
  }

  function focusOnMount(mount) {
    if (!mount) return;

    var tries = 0;
    function attempt() {
      if (applyFocus(mount)) return;
      tries += 1;
      if (tries < 80) {
        requestAnimationFrame(attempt);
      } else if (window.CpisViewerOrbit && window.CpisViewerOrbit.setFrame) {
        window.CpisViewerOrbit.setFrame(0, 2, 0, 5, 0.45, 0.82);
      }
    }
    attempt();
    setTimeout(function () {
      applyFocus(mount);
    }, 250);
    setTimeout(function () {
      applyFocus(mount);
    }, 600);
  }

  window.ViewerCamera = {
    focusOnMount: focusOnMount,
    previewScale: previewScale,
    PREVIEW_MAX: PREVIEW_MAX,
  };
})();
