/**
 * viewer-orbit.js — orbit arm around pivot; drag / pinch / buttons / wheel.
 */

(function () {
  'use strict';

  if (typeof AFRAME === 'undefined') return;

  function isUiTarget(el) {
    if (!el || !el.closest) return false;
    return !!(
      el.closest('.pick-btn') ||
      el.closest('.viewer-bar') ||
      el.closest('.orbit-pad') ||
      el.closest('a') ||
      el.closest('button')
    );
  }

  AFRAME.registerComponent('cpis-touch-orbit', {
    schema: {
      minDistance: { type: 'number', default: 1.2 },
      maxDistance: { type: 'number', default: 28 },
    },

    init: function () {
      var self = this;
      this._T = AFRAME.THREE;
      this._look = new this._T.Vector3();
      this._targetY = 1.2;
      this.theta = 0.72;
      this.phi = 0.76;
      this.distance = 7.5;

      this._dragging = false;
      this._pinching = false;
      this._lastX = 0;
      this._lastY = 0;
      this._pinchDist = 0;

      this._onDown = function (e) {
        self._pointerDown(e);
      };
      this._onMove = function (e) {
        self._pointerMove(e);
      };
      this._onUp = function () {
        self._pointerUp();
      };
      this._onWheel = function (e) {
        self._wheel(e);
      };

      var opts = { passive: false, capture: true };
      window.addEventListener('mousedown', this._onDown, opts);
      window.addEventListener('mousemove', this._onMove, opts);
      window.addEventListener('mouseup', this._onUp, opts);
      window.addEventListener('wheel', this._onWheel, opts);
      window.addEventListener('touchstart', this._onDown, opts);
      window.addEventListener('touchmove', this._onMove, opts);
      window.addEventListener('touchend', this._onUp, opts);
      window.addEventListener('touchcancel', this._onUp, opts);

      var canvas = this.el.sceneEl && this.el.sceneEl.canvas;
      if (canvas) canvas.style.touchAction = 'none';

      window.CpisViewerOrbit = {
        isDragging: function () {
          return self._dragging || self._pinching;
        },
        rotateLeft: function () {
          self.theta += 0.32;
        },
        rotateRight: function () {
          self.theta -= 0.32;
        },
        zoomIn: function () {
          self.distance *= 0.78;
          self._clampDist();
        },
        zoomOut: function () {
          self.distance *= 1.25;
          self._clampDist();
        },
        setView: function (dist, phi, theta, targetY) {
          self.distance = dist;
          if (typeof phi === 'number') self.phi = phi;
          if (typeof theta === 'number') self.theta = theta;
          if (typeof targetY === 'number') {
            self._targetY = targetY;
            var pivot = self._pivot();
            if (pivot) {
              pivot.setAttribute('position', '0 ' + targetY + ' 0');
            }
          }
          self._clampDist();
        },
      };

      this._applyOrbit();
    },

    _pivot: function () {
      return this.el.parentEl;
    },

    _clampDist: function () {
      this.distance = Math.min(
        this.data.maxDistance,
        Math.max(this.data.minDistance, this.distance)
      );
    },

    _applyOrbit: function () {
      var pivot = this._pivot();
      if (!pivot) return;

      var sinP = Math.sin(this.phi);
      var dx = this.distance * sinP * Math.sin(this.theta);
      var dy = this.distance * Math.cos(this.phi);
      var dz = this.distance * sinP * Math.cos(this.theta);

      this.el.object3D.position.set(dx, dy, dz);
      this._look.set(0, this._targetY, 0);
      this.el.object3D.lookAt(this._look);
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
      var t0 = e.touches[0];
      var t1 = e.touches[1];
      return Math.hypot(t0.clientX - t1.clientX, t0.clientY - t1.clientY);
    },

    _pointerDown: function (e) {
      if (isUiTarget(e.target)) return;
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

    _pointerMove: function (e) {
      if (e.touches && e.touches.length === 2 && this._pinching) {
        var d = this._pinchLength(e);
        if (this._pinchDist > 0) {
          this.distance *= this._pinchDist / d;
          this._clampDist();
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
      this.theta -= dx * 0.014;
      this.phi -= dy * 0.014;
      this.phi = Math.max(0.28, Math.min(1.05, this.phi));
      e.preventDefault();
    },

    _pointerUp: function () {
      this._dragging = false;
      this._pinching = false;
      this._pinchDist = 0;
    },

    _wheel: function (e) {
      if (isUiTarget(e.target)) return;
      this.distance += e.deltaY * 0.012;
      this._clampDist();
      e.preventDefault();
    },

    tick: function () {
      this._applyOrbit();
    },

    remove: function () {
      window.removeEventListener('mousedown', this._onDown, true);
      window.removeEventListener('mousemove', this._onMove, true);
      window.removeEventListener('mouseup', this._onUp, true);
      window.removeEventListener('wheel', this._onWheel, true);
      window.removeEventListener('touchstart', this._onDown, true);
      window.removeEventListener('touchmove', this._onMove, true);
      window.removeEventListener('touchend', this._onUp, true);
      window.removeEventListener('touchcancel', this._onUp, true);
    },
  });
})();
