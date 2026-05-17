/**
 * viewer-camera.js — frame model and set orbit target / distance.
 */

(function () {
  'use strict';

  function three() {
    if (typeof AFRAME !== 'undefined' && AFRAME.THREE) return AFRAME.THREE;
    return null;
  }

  function getOrbitRig() {
    return document.getElementById('camera-rig');
  }

  function focusOnMount(mount) {
    var T = three();
    if (!T || !mount) return;

    mount.object3D.updateMatrixWorld(true);
    var box = new T.Box3().setFromObject(mount.object3D);
    if (box.isEmpty()) return;

    var center = box.getCenter(new T.Vector3());
    var size = box.getSize(new T.Vector3());
    var maxDim = Math.max(size.x, size.y, size.z, 0.15);
    var dist = maxDim * 2.2;

    var rig = getOrbitRig();
    if (rig && rig.components['cpis-touch-orbit']) {
      var orbit = rig.components['cpis-touch-orbit'];
      orbit.setTarget(center.x, center.y, center.z);
      orbit.setDistance(dist);
    }
  }

  window.ViewerCamera = {
    focusOnMount: focusOnMount,
  };
})();
