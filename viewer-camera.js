/**
 * viewer-camera.js — center small model in view; set orbit distance.
 */

(function () {
  'use strict';

  var PREVIEW_MAX = 2.6;

  function three() {
    if (typeof AFRAME !== 'undefined' && AFRAME.THREE) return AFRAME.THREE;
    return null;
  }

  /** Uniform scale so largest raw edge maps to PREVIEW_MAX scene units. */
  function previewScale(spec, viewerMode) {
    var perFloorH = spec.height / Math.max(spec.floors || 1, 1);
    var stackH = viewerMode === 'building' ? perFloorH * 2 : perFloorH;
    var raw = Math.max(spec.width || 1, spec.depth || 1, stackH, 0.5);
    return PREVIEW_MAX / raw;
  }

  function focusOnMount(mount, viewerMode) {
    var T = three();
    if (!T || !mount) return;

    mount.setAttribute('rotation', '0 0 0');
    mount.object3D.updateMatrixWorld(true);
    var box = new T.Box3().setFromObject(mount.object3D);
    if (box.isEmpty()) return;

    var center = box.getCenter(new T.Vector3());
    var size = box.getSize(new T.Vector3());
    mount.object3D.position.x -= center.x;
    mount.object3D.position.y -= center.y;
    mount.object3D.position.z -= center.z;

    mount.object3D.updateMatrixWorld(true);
    box.setFromObject(mount.object3D);
    center = box.getCenter(new T.Vector3());

    var maxDim = Math.max(size.x, size.y, size.z, 0.2);
    var dist = Math.max(maxDim * 3.6, 5.5);

    var focus = document.getElementById('orbit-focus');
    if (focus) {
      focus.object3D.position.copy(center);
    }

    if (window.CpisViewerOrbit && window.CpisViewerOrbit.setFrame) {
      window.CpisViewerOrbit.setFrame(center.x, center.y, center.z, dist);
      if (window.CpisViewerOrbit.resetView) {
        window.CpisViewerOrbit.resetView();
      }
    }
  }

  window.ViewerCamera = {
    focusOnMount: focusOnMount,
    previewScale: previewScale,
    PREVIEW_MAX: PREVIEW_MAX,
  };
})();
