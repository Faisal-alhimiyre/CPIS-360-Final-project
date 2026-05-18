/**
 * viewer-camera.js — aim at the real middle of the 3D boxes (fixes model at bottom).
 */

(function () {
  'use strict';

  var PREVIEW_MAX = 8;

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

  function modelMetrics(mount) {
    var T = three();
    if (!T || !mount) return null;

    mount.object3D.updateMatrixWorld(true);
    var box = new T.Box3();
    var hit = false;
    var nodes = mount.querySelectorAll('a-box');
    var i;

    for (i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      if (!el.object3D) continue;
      var b = new T.Box3().setFromObject(el.object3D);
      if (b.isEmpty()) continue;
      if (!hit) {
        box.copy(b);
        hit = true;
      } else {
        box.union(b);
      }
    }

    if (!hit) return null;

    var center = box.getCenter(new T.Vector3());
    var size = box.getSize(new T.Vector3());
    return { center: center, size: size };
  }

  function aimAtModel(mount) {
    var m = modelMetrics(mount);
    var pivot = document.getElementById('orbit-pivot');
    if (!m || !pivot) {
      if (pivot) pivot.setAttribute('position', '0 2.5 0');
      if (window.CpisViewerOrbit) {
        window.CpisViewerOrbit.setView(8, 0.95, 0.78, 2.5);
      }
      return false;
    }

    var cy = m.center.y;
    var maxDim = Math.max(m.size.x, m.size.y, m.size.z, 0.4);
    var dist = Math.max(maxDim * 1.65, 5);
    dist = Math.min(dist, 14);

    pivot.setAttribute('position', '0 ' + cy + ' 0');
    if (window.CpisViewerOrbit) {
      window.CpisViewerOrbit.setView(dist, 0.95, 0.78, cy);
    }
    return true;
  }

  function focusOnMount(mount) {
    if (!mount) return;
    mount.setAttribute('position', '0 0 0');
    mount.setAttribute('rotation', '0 0 0');

    var tries = 0;
    function attempt() {
      if (aimAtModel(mount)) return;
      tries += 1;
      if (tries < 150) {
        requestAnimationFrame(attempt);
      } else {
        aimAtModel(mount);
      }
    }
    attempt();
    [300, 700, 1500].forEach(function (ms) {
      setTimeout(function () {
        aimAtModel(mount);
      }, ms);
    });
  }

  window.ViewerCamera = {
    focusOnMount: focusOnMount,
    previewScale: previewScale,
    PREVIEW_MAX: PREVIEW_MAX,
  };
})();
