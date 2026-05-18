/**
 * viewer-camera.js — simple fixed framing (no auto-center that hides the model).
 */

(function () {
  'use strict';

  var PREVIEW_MAX = 6;
  var PIVOT_Y = 1.2;

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
    var pivot = document.getElementById('orbit-pivot');
    if (pivot) {
      pivot.setAttribute('position', '0 ' + PIVOT_Y + ' 0');
    }
    if (window.CpisViewerOrbit && window.CpisViewerOrbit.setView) {
      window.CpisViewerOrbit.setView(dist, 0.76, 0.72, PIVOT_Y);
    }
  }

  function focusOnMount(mount) {
    if (!mount) return;
    mount.setAttribute('position', '0 0 0');
    mount.setAttribute('rotation', '0 0 0');
    frameCamera(7.5);
    setTimeout(function () {
      frameCamera(7.5);
    }, 400);
    setTimeout(function () {
      frameCamera(7.5);
    }, 1000);
  }

  window.ViewerCamera = {
    focusOnMount: focusOnMount,
    previewScale: previewScale,
    PREVIEW_MAX: PREVIEW_MAX,
  };
})();
