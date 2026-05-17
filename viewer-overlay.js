/**
 * viewer-overlay.js — clear tap buttons (always visible when picking floor/apt).
 */

(function () {
  'use strict';

  function update(state) {
    var floors = document.getElementById('overlay-floors');
    var apts = document.getElementById('overlay-apts');
    if (floors) floors.hidden = state.mode !== 'building';
    if (apts) apts.hidden = state.mode !== 'floor';
  }

  function bind(handlers) {
    var f0 = document.getElementById('pick-floor-0');
    var f1 = document.getElementById('pick-floor-1');
    var a0 = document.getElementById('pick-apt-0');
    var a1 = document.getElementById('pick-apt-1');
    if (f0) f0.onclick = function () {
      if (handlers.onFloor) handlers.onFloor(0);
    };
    if (f1) f1.onclick = function () {
      if (handlers.onFloor) handlers.onFloor(1);
    };
    if (a0) a0.onclick = function () {
      if (handlers.onApt) handlers.onApt(0);
    };
    if (a1) a1.onclick = function () {
      if (handlers.onApt) handlers.onApt(1);
    };
  }

  window.ViewerOverlay = {
    update: update,
    bind: bind,
  };
})();
