/**
 * viewer-camera.js — frame visible meshes only (a-text breaks Box3).
 */

(function () {
  'use strict';

  var PREVIEW_MAX = 5;
  var TARGET_Y = 1.35;

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

  /** Bounding box from boxes/planes only — labels must not move the model off-screen. */
  function meshBounds(mount, T) {
    var box = new T.Box3();
    var hit = false;
    var nodes = mount.querySelectorAll('a-box, a-plane');
    var i;
    for (i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      if (!el.object3D) continue;
      el.object3D.updateWorldMatrix(true, false);
      var b = new T.Box3().setFromObject(el.object3D);
      if (b.isEmpty()) continue;
      if (!hit) {
        box.copy(b);
        hit = true;
      } else {
        box.union(b);
      }
    }
    return hit ? box : null;
  }

  function setPivot(y) {
    var pivot = document.getElementById('orbit-pivot');
    if (pivot) {
      pivot.setAttribute('position', '0 ' + y + ' 0');
    }
  }

  function frameCamera(dist, targetY) {
    var y = typeof targetY === 'number' ? targetY : TARGET_Y;
    setPivot(y);
    if (window.CpisViewerOrbit && window.CpisViewerOrbit.setView) {
      window.CpisViewerOrbit.setView(dist, 0.78, 0.75, y);
    }
  }

  function applyFocus(mount) {
    var T = three();
    if (!T || !mount) return false;

    mount.setAttribute('rotation', '0 0 0');
    mount.setAttribute('position', '0 0 0');
    mount.object3D.updateMatrixWorld(true);

    var box = meshBounds(mount, T);
    if (!box) return false;

    var center = box.getCenter(new T.Vector3());
    var size = box.getSize(new T.Vector3());

    mount.setAttribute(
      'position',
      -center.x + ' ' + (TARGET_Y - center.y) + ' ' + -center.z
    );

    var maxDim = Math.max(size.x, size.y, size.z, 0.3);
    var dist = Math.max(maxDim * 1.75, 4.5);
    dist = Math.min(dist, 12);
    frameCamera(dist, TARGET_Y);
    return true;
  }

  function focusOnMount(mount) {
    if (!mount) return;
    frameCamera(6.5, TARGET_Y);

    var tries = 0;
    function attempt() {
      if (applyFocus(mount)) return;
      tries += 1;
      if (tries < 120) {
        requestAnimationFrame(attempt);
      } else {
        mount.setAttribute('position', '0 ' + TARGET_Y + ' 0');
        frameCamera(6.5, TARGET_Y);
      }
    }
    attempt();
    [250, 600, 1200].forEach(function (ms) {
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
