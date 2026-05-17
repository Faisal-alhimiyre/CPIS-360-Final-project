/**
 * viewer-camera.js — center and frame the model after each rebuild.
 */

(function () {
  'use strict';

  function three() {
    if (typeof AFRAME !== 'undefined' && AFRAME.THREE) return AFRAME.THREE;
    return null;
  }

  function getOrbitComp() {
    var cam = document.getElementById('viewer-camera');
    if (!cam || !cam.components['cpis-orbit-controls']) return null;
    return cam.components['cpis-orbit-controls'];
  }

  function focusOnMount(mount) {
    var T = three();
    var sceneEl = document.getElementById('viewer-scene');
    if (!T || !sceneEl || !sceneEl.camera || !mount) return;

    mount.object3D.updateMatrixWorld(true);
    var box = new T.Box3().setFromObject(mount.object3D);
    if (box.isEmpty()) return;

    var center = box.getCenter(new T.Vector3());
    var size = box.getSize(new T.Vector3());
    var maxDim = Math.max(size.x, size.y, size.z, 0.15);
    var dist = maxDim * 2.1;

    var orbit = getOrbitComp();
    if (orbit && orbit.getControls()) {
      orbit.setTarget(center.x, center.y, center.z);
      var c = orbit.getControls();
      c.minDistance = maxDim * 0.35;
      c.maxDistance = maxDim * 5;
    }

    var cam = sceneEl.camera;
    cam.position.set(center.x + dist * 0.55, center.y + dist * 0.65, center.z + dist * 0.75);
    cam.lookAt(center);
    cam.updateProjectionMatrix();

    if (orbit && orbit.getControls()) {
      orbit.getControls().update();
    }
  }

  window.ViewerCamera = {
    focusOnMount: focusOnMount,
  };
})();
