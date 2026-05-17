/**
 * viewer-orbit.js — 360° orbit + zoom (mobile-safe).
 */

(function () {
  'use strict';

  if (typeof AFRAME === 'undefined') return;

  AFRAME.registerComponent('cpis-orbit-controls', {
    schema: {
      target: { type: 'vec3', default: { x: 0, y: 1, z: 0 } },
      minDistance: { type: 'number', default: 2 },
      maxDistance: { type: 'number', default: 60 },
    },

    init: function () {
      var self = this;
      this._boundResize = function () {
        self._resize();
      };
      this.el.sceneEl.addEventListener('loaded', function () {
        self._setup();
      });
      if (this.el.sceneEl.hasLoaded) {
        this._setup();
      }
      window.addEventListener('resize', this._boundResize);
      window.addEventListener('orientationchange', this._boundResize);
    },

    _setup: function () {
      var sceneEl = this.el.sceneEl;
      var canvas = sceneEl.canvas;
      if (!canvas || !canvas.clientWidth) {
        var self = this;
        setTimeout(function () {
          self._setup();
        }, 80);
        return;
      }
      if (this.controls) {
        this.controls.dispose();
      }
      var T = AFRAME.THREE;
      var camObj = this.el.getObject3D('camera') || this.el.object3D;
      this.controls = new T.OrbitControls(camObj, canvas);
      this.controls.target.set(this.data.target.x, this.data.target.y, this.data.target.z);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.08;
      this.controls.enablePan = true;
      this.controls.enableZoom = true;
      this.controls.enableRotate = true;
      this.controls.rotateSpeed = 0.85;
      this.controls.zoomSpeed = 1.2;
      this.controls.panSpeed = 0.7;
      this.controls.minDistance = this.data.minDistance;
      this.controls.maxDistance = this.data.maxDistance;
      this.controls.minPolarAngle = 0.12;
      this.controls.maxPolarAngle = Math.PI - 0.12;
      this.controls.screenSpacePanning = true;
      canvas.style.touchAction = 'none';
      this._resize();
    },

    _resize: function () {
      var sceneEl = this.el.sceneEl;
      if (!sceneEl || !sceneEl.renderer || !sceneEl.canvas) return;
      var w = sceneEl.canvas.clientWidth;
      var h = sceneEl.canvas.clientHeight;
      if (w < 2 || h < 2) return;
      sceneEl.renderer.setSize(w, h, false);
      if (sceneEl.camera) {
        sceneEl.camera.aspect = w / h;
        sceneEl.camera.updateProjectionMatrix();
      }
      if (this.controls) this.controls.update();
    },

    getControls: function () {
      return this.controls;
    },

    setTarget: function (x, y, z) {
      if (!this.controls) return;
      this.controls.target.set(x, y, z);
    },

    tick: function () {
      if (this.controls) this.controls.update();
    },

    remove: function () {
      window.removeEventListener('resize', this._boundResize);
      window.removeEventListener('orientationchange', this._boundResize);
      if (this.controls) this.controls.dispose();
    },
  });
})();
