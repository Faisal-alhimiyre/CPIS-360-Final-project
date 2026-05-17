/**
 * viewer-camera.js — center model in the middle of the visible screen (not at the bottom).
 */

(function () {
  'use strict';

  var PREVIEW_MAX = 3.2;

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

  /** Extra Y lift so the model sits in the visual middle (above bottom buttons). */
  function screenCenterLift(sizeY) {
    var h = window.innerHeight || 640;
    var bar = document.querySelector('.viewer-bar');
    var topH = bar ? bar.offsetHeight : 48;
    var botH = 0;
    var overlays = document.querySelectorAll('.viewer-overlay');
    var i;
    for (i = 0; i < overlays.length; i++) {
      if (!overlays[i].hidden) {
        botH = Math.max(botH, overlays[i].offsetHeight);
      }
    }
    if (!botH) botH = 88;
    var usable = Math.max(h - topH - botH, h * 0.45);
    var bias = (usable / h) * 1.15;
    return Math.max(0.55, sizeY * 0.42 + bias);
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
    var lift = screenCenterLift(size.y);

    mount.setAttribute(
      'position',
      -center.x + ' ' + (-center.y + lift) + ' ' + -center.z
    );

    mount.object3D.updateMatrixWorld(true);
    box.setFromObject(mount.object3D);
    center = box.getCenter(new T.Vector3());

    var maxDim = Math.max(size.x, size.y, size.z, 0.2);
    var dist = Math.max(maxDim * 2.2, 3.5);
    dist = Math.min(dist, 14);

    var focus = document.getElementById('orbit-focus');
    if (focus) {
      focus.object3D.position.copy(center);
    }

    if (window.CpisViewerOrbit && window.CpisViewerOrbit.setFrame) {
      window.CpisViewerOrbit.setFrame(center.x, center.y, center.z, dist, 0.62, 0.78);
      if (window.CpisViewerOrbit.applyViewOffset) {
        window.CpisViewerOrbit.applyViewOffset();
      }
    }
    return true;
  }

  function focusOnMount(mount) {
    if (!mount) return;

    var tries = 0;
    function attempt() {
      if (applyFocus(mount)) return;
      tries += 1;
      if (tries < 60) {
        requestAnimationFrame(attempt);
      } else if (window.CpisViewerOrbit && window.CpisViewerOrbit.setFrame) {
        window.CpisViewerOrbit.setFrame(0, 1.2, 0, 6, 0.62, 0.78);
      }
    }
    attempt();
  }

  function reapplyViewOffset() {
    if (window.CpisViewerOrbit && window.CpisViewerOrbit.applyViewOffset) {
      window.CpisViewerOrbit.applyViewOffset();
    }
  }

  window.ViewerCamera = {
    focusOnMount: focusOnMount,
    reapplyViewOffset: reapplyViewOffset,
    previewScale: previewScale,
    PREVIEW_MAX: PREVIEW_MAX,
  };
})();
