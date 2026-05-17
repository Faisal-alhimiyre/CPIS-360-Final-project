/**
 * viewer-orbit.js
 * ---------------
 * Full 360° orbit (horizontal + vertical) using THREE.OrbitControls on the viewer camera.
 */

(function () {
  'use strict';

  if (typeof AFRAME === 'undefined') return;

  AFRAME.registerComponent('cpis-orbit-controls', {
    schema: {
      target: { type: 'vec3', default: { x: 0, y: 0.5, z: 0 } },
      minDistance: { type: 'number', default: 3 },
      maxDistance: { type: 'number', default: 50 },
    },

    init: function () {
      var cam = this.el;
      var sceneEl = this.el.sceneEl;
      var T = AFRAME.THREE;
      this.controls = new T.OrbitControls(cam, sceneEl.canvas);
      this.controls.target.set(this.data.target.x, this.data.target.y, this.data.target.z);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.06;
      this.controls.enablePan = true;
      this.controls.enableZoom = true;
      this.controls.rotateSpeed = 0.65;
      this.controls.zoomSpeed = 0.9;
      this.controls.panSpeed = 0.55;
      this.controls.minDistance = this.data.minDistance;
      this.controls.maxDistance = this.data.maxDistance;
      this.controls.minPolarAngle = 0.08;
      this.controls.maxPolarAngle = Math.PI - 0.08;
      this.controls.minAzimuthAngle = -Infinity;
      this.controls.maxAzimuthAngle = Infinity;
      this.controls.screenSpacePanning = true;
    },

    update: function () {
      if (!this.controls) return;
      this.controls.target.set(this.data.target.x, this.data.target.y, this.data.target.z);
      this.controls.minDistance = this.data.minDistance;
      this.controls.maxDistance = this.data.maxDistance;
    },

    tick: function () {
      if (this.controls) this.controls.update();
    },

    remove: function () {
      if (this.controls) this.controls.dispose();
    },
  });
})();
