/**
 * viewer-orbit.js — orbit camera rig; window-level touch + button API.
 */

(function () {
  'use strict';

  if (typeof AFRAME === 'undefined') return;

  var activeOrbit = null;

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
      maxDistance: { type: 'number', default: 24 },
    },

    init: function () {
      var self = this;
      activeOrbit = this;
      this._T = AFRAME.THREE;
      this._target = new this._T.Vector3(0, 0.6, 0);
      this.theta = 0.72;
      this.phi = 0.88;
      this.distance = 10;
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

      var canvas = this.el.sceneEl.canvas;
      if (canvas) canvas.style.touchAction = 'none';

      window.CpisViewerOrbit = {
        isDragging: function () {
          return self._dragging || self._pinching;
        },
        rotateLeft: function () {
          self.theta += 0.28;
        },
        rotateRight: function () {
          self.theta -= 0.28;
        },
        zoomIn: function () {
          self.distance *= 0.82;
          self._clampDist();
        },
        zoomOut: function () {
          self.distance *= 1.2;
          self._clampDist();
        },
        resetView: function () {
          self.theta = 0.72;
          self.phi = 0.88;
          if (self._lastDist) self.distance = self._lastDist;
          self._clampDist();
        },
        setFrame: function (x, y, z, dist) {
          self._target.set(x, y, z);
          self.distance = dist;
          self._lastDist = dist;
          self._clampDist();
        },
      };
    },

    _clampDist: function () {
      this.distance = Math.min(this.data.maxDistance, Math.max(this.data.minDistance, this.distance));
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
      this.theta -= dx * 0.009;
      this.phi -= dy * 0.009;
      this.phi = Math.max(0.4, Math.min(1.25, this.phi));
      e.preventDefault();
    },

    _pointerUp: function () {
      this._dragging = false;
      this._pinching = false;
      this._pinchDist = 0;
    },

    _wheel: function (e) {
      if (isUiTarget(e.target)) return;
      this.distance += e.deltaY * 0.008;
      this._clampDist();
      e.preventDefault();
    },

    tick: function () {
      var sinP = Math.sin(this.phi);
      var px = this._target.x + this.distance * sinP * Math.sin(this.theta);
      var py = this._target.y + this.distance * Math.cos(this.phi);
      var pz = this._target.z + this.distance * sinP * Math.cos(this.theta);
      this.el.object3D.position.set(px, py, pz);

      var camEl = this._camEl;
      if (!camEl) {
        camEl = this.el.querySelector('a-camera');
        this._camEl = camEl;
      }
      if (camEl) {
        camEl.object3D.lookAt(this._target);
      }

      var focus = document.getElementById('orbit-focus');
      if (focus) {
        focus.object3D.position.copy(this._target);
      }
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
      if (activeOrbit === this) activeOrbit = null;
    },
  });
})();
