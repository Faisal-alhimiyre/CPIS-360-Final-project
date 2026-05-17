/**
 * viewer-orbit.js — touch/mouse orbit on #camera-rig (works with A-Frame; no OrbitControls fight).
 */

(function () {
  'use strict';

  if (typeof AFRAME === 'undefined') return;

  AFRAME.registerComponent('cpis-touch-orbit', {
    schema: {
      target: { type: 'vec3', default: { x: 0, y: 1, z: 0 } },
      minDistance: { type: 'number', default: 2 },
      maxDistance: { type: 'number', default: 55 },
    },

    init: function () {
      var self = this;
      var T = AFRAME.THREE;
      this._T = T;
      this._target = new T.Vector3();
      this._offset = new T.Vector3();
      this.theta = 0.75;
      this.phi = 1.05;
      this.distance = 14;
      this._dragging = false;
      this._pinching = false;
      this._lastX = 0;
      this._lastY = 0;
      this._pinchDist = 0;
      window.CpisViewerOrbit = {
        isDragging: function () {
          return self._dragging || self._pinching;
        },
      };

      this._onDown = function (e) {
        self._onPointerDown(e);
      };
      this._onMove = function (e) {
        self._onPointerMove(e);
      };
      this._onUp = function (e) {
        self._onPointerUp(e);
      };
      this._onWheel = function (e) {
        self._onWheelZoom(e);
      };

      var canvas = this.el.sceneEl.canvas;
      canvas.style.touchAction = 'none';
      canvas.addEventListener('mousedown', this._onDown);
      canvas.addEventListener('mousemove', this._onMove);
      canvas.addEventListener('mouseup', this._onUp);
      canvas.addEventListener('mouseleave', this._onUp);
      canvas.addEventListener('wheel', this._onWheel, { passive: false });
      canvas.addEventListener('touchstart', this._onDown, { passive: false });
      canvas.addEventListener('touchmove', this._onMove, { passive: false });
      canvas.addEventListener('touchend', this._onUp);
      canvas.addEventListener('touchcancel', this._onUp);
    },

    _pointer: function (e) {
      if (e.touches && e.touches.length) {
        return { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
      if (e.changedTouches && e.changedTouches.length) {
        return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
      }
      return { x: e.clientX, y: e.clientY };
    },

    _pinchLength: function (e) {
      if (!e.touches || e.touches.length < 2) return 0;
      var dx = e.touches[0].clientX - e.touches[1].clientX;
      var dy = e.touches[0].clientY - e.touches[1].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    },

    _onPointerDown: function (e) {
      if (e.target && e.target.closest && e.target.closest('.viewer-overlay')) return;
      if (e.touches && e.touches.length === 2) {
        this._pinching = true;
        this._pinchDist = this._pinchLength(e);
        e.preventDefault();
        return;
      }
      this._dragging = true;
      var p = this._pointer(e);
      this._lastX = p.x;
      this._lastY = p.y;
      e.preventDefault();
    },

    _onPointerMove: function (e) {
      if (e.touches && e.touches.length === 2 && this._pinching) {
        var d = this._pinchLength(e);
        if (this._pinchDist > 0) {
          this.distance *= this._pinchDist / d;
          this.distance = Math.min(
            this.data.maxDistance,
            Math.max(this.data.minDistance, this.distance)
          );
        }
        this._pinchDist = d;
        e.preventDefault();
        return;
      }
      if (!this._dragging) return;
      var p = this._pointer(e);
      var dx = p.x - this._lastX;
      var dy = p.y - this._lastY;
      this._lastX = p.x;
      this._lastY = p.y;
      this.theta -= dx * 0.008;
      this.phi -= dy * 0.008;
      this.phi = Math.max(0.15, Math.min(Math.PI - 0.15, this.phi));
      e.preventDefault();
    },

    _onPointerUp: function () {
      this._dragging = false;
      this._pinching = false;
      this._pinchDist = 0;
    },

    _onWheelZoom: function (e) {
      if (e.target && e.target.closest && e.target.closest('.viewer-overlay')) return;
      this.distance += e.deltaY * 0.012;
      this.distance = Math.min(
        this.data.maxDistance,
        Math.max(this.data.minDistance, this.distance)
      );
      e.preventDefault();
    },

    setDistance: function (d) {
      this.distance = Math.min(this.data.maxDistance, Math.max(this.data.minDistance, d));
    },

    setTarget: function (x, y, z) {
      this.data.target.x = x;
      this.data.target.y = y;
      this.data.target.z = z;
    },

    tick: function () {
      var T = this._T;
      this._target.set(this.data.target.x, this.data.target.y, this.data.target.z);
      var sinP = Math.sin(this.phi);
      this._offset.set(
        this.distance * sinP * Math.sin(this.theta),
        this.distance * Math.cos(this.phi),
        this.distance * sinP * Math.cos(this.theta)
      );
      var px = this._target.x + this._offset.x;
      var py = this._target.y + this._offset.y;
      var pz = this._target.z + this._offset.z;
      this.el.object3D.position.set(px, py, pz);
      this.el.object3D.lookAt(this._target);
    },

    remove: function () {
      var canvas = this.el.sceneEl.canvas;
      if (!canvas) return;
      canvas.removeEventListener('mousedown', this._onDown);
      canvas.removeEventListener('mousemove', this._onMove);
      canvas.removeEventListener('mouseup', this._onUp);
      canvas.removeEventListener('mouseleave', this._onUp);
      canvas.removeEventListener('wheel', this._onWheel);
      canvas.removeEventListener('touchstart', this._onDown);
      canvas.removeEventListener('touchmove', this._onMove);
      canvas.removeEventListener('touchend', this._onUp);
      canvas.removeEventListener('touchcancel', this._onUp);
    },
  });
})();
