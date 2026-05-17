/**
 * viewer-navigation.js
 * --------------------
 * Building floor: tap Apartment 1 or 2. Apartment view: handled by viewer-app-core back button.
 */

(function () {
  'use strict';

  var mount = null;
  var onPick = null;
  var sceneEl = null;

  function three() {
    if (typeof AFRAME !== 'undefined' && AFRAME.THREE) return AFRAME.THREE;
    return null;
  }

  function pickApt(scene, root, clientX, clientY) {
    var T = three();
    if (!T || !scene || !scene.camera || !root) return -1;
    var canvas = scene.canvas;
    if (!canvas) return -1;
    var rect = canvas.getBoundingClientRect();
    var nx = ((clientX - rect.left) / rect.width) * 2 - 1;
    var ny = -((clientY - rect.top) / rect.height) * 2 + 1;
    var ray = new T.Raycaster();
    ray.setFromCamera({ x: nx, y: ny }, scene.camera);
    root.object3D.updateMatrixWorld(true);
    var hits = ray.intersectObjects([root.object3D], true);
    var hi;
    for (hi = 0; hi < hits.length; hi++) {
      var walk = hits[hi].object;
      while (walk) {
        if (walk.el && walk.el.dataset && walk.el.dataset.aptIndex != null) {
          return parseInt(walk.el.dataset.aptIndex, 10);
        }
        walk = walk.parent;
      }
    }
    return -1;
  }

  function handlePointer(evt) {
    if (!mount || !sceneEl) return;
    var tch = evt.changedTouches && evt.changedTouches[0];
    var x = tch ? tch.clientX : evt.clientX;
    var y = tch ? tch.clientY : evt.clientY;
    var idx = pickApt(sceneEl, mount, x, y);
    if (idx >= 0 && onPick) onPick(idx);
  }

  window.ViewerNavigation = {
    attachBuildingPick: function (root, callback) {
      this.detachBuildingPick();
      mount = root;
      onPick = callback;
      sceneEl = document.getElementById('viewer-scene');
      if (!sceneEl) return;
      this._handler = handlePointer;
      sceneEl.addEventListener('click', this._handler);
      sceneEl.addEventListener('touchend', this._handler);
    },

    detachBuildingPick: function () {
      if (sceneEl && this._handler) {
        sceneEl.removeEventListener('click', this._handler);
        sceneEl.removeEventListener('touchend', this._handler);
      }
      mount = null;
      onPick = null;
      this._handler = null;
    },
  };
})();
