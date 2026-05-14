/**
 * interactions.js
 * ---------------
 * Tap door/front façade -> cutaway mode:
 * - hide front shell segments (no roof mesh in fixed template)
 * - make side/back walls extra clear when open
 * Tap again to restore translucent shell.
 */

(function () {
  'use strict';

  /** Shell when cutaway is closed (front segments visible). */
  var SHELL_GLASS = 0.78;
  /** Side/back walls when cutaway is open (still readable, less video bleed-through). */
  var GLASSY = 0.55;

  function isCutawayOpen(scene) {
    return scene && scene.dataset && scene.dataset.cutawayOpen === '1';
  }

  function applyExtWallMaterial(wall, opacity, modeLabel) {
    if (!wall) return;
    var c = wall.dataset.extColor || '#64748b';
    var mat =
      'color: ' +
      c +
      '; shader: flat; opacity: ' +
      opacity +
      '; transparent: true; side: double';
    wall.setAttribute('material', mat);
    wall.dataset.wallMode = modeLabel;
  }

  function setAllExterior(scene, opacity, modeLabel) {
    var walls = scene.querySelectorAll('.ext-wall');
    var i;
    for (i = 0; i < walls.length; i++) {
      applyExtWallMaterial(walls[i], opacity, modeLabel);
    }
  }

  function setCutawayVisibility(scene, visible) {
    var parts = scene.querySelectorAll('.cutaway-hide');
    var i;
    for (i = 0; i < parts.length; i++) {
      parts[i].setAttribute('visible', visible ? 'true' : 'false');
    }
  }

  function setCutawayMode(scene, open) {
    scene.dataset.cutawayOpen = open ? '1' : '0';
    setCutawayVisibility(scene, !open);

    if (open) {
      var walls = scene.querySelectorAll('.ext-wall');
      var i;
      for (i = 0; i < walls.length; i++) {
        var w = walls[i];
        if (w.id === 'front-wall' || (w.dataset && w.dataset.apartmentFront === 'true')) continue;
        applyExtWallMaterial(w, GLASSY, 'glass');
      }
    } else {
      setAllExterior(scene, SHELL_GLASS, 'glass');
    }
  }

  function isUnder(node, ancestor) {
    var cur = node;
    while (cur) {
      if (cur === ancestor) return true;
      cur = cur.parentElement || cur.parentEl || null;
    }
    return false;
  }

  function intersectedFromEvent(evt) {
    var d = evt.detail || {};
    if (d.intersectedEl) return d.intersectedEl;
    if (d.els && d.els.length) return d.els[0];
    return null;
  }

  function setupDoorToggle(scene, buildingRoot) {
    if (!scene || !buildingRoot) return;

    function toggleCutaway() {
      setCutawayMode(scene, !isCutawayOpen(scene));
    }

    var lastDoorToggleMs = 0;
    function doDoorToggle() {
      var t = Date.now();
      if (t - lastDoorToggleMs < 380) return;
      lastDoorToggleMs = t;
      toggleCutaway();
    }

    function tryToggle(evt) {
      var start = intersectedFromEvent(evt) || evt.target;
      var node = start;
      var hit = null;
      while (node) {
        if (node.dataset && node.dataset.doorToggle === '1') {
          hit = node;
          break;
        }
        if (node.classList && node.classList.contains('door-hot')) {
          hit = node;
          break;
        }
        node = node.parentElement || node.parentEl || null;
      }
      if (!hit) return;
      if (!isUnder(hit, buildingRoot)) return;

      doDoorToggle();
    }

    if (scene.dataset.doorToggleBound !== '1') {
      scene.dataset.doorToggleBound = '1';
      scene.addEventListener('click', tryToggle, true);
    }

    function tryToggleTouch(e) {
      var t = e.changedTouches && e.changedTouches[0];
      if (!t || !window.CpisArPick) return;
      var r = window.CpisArPick.pick(buildingRoot, scene, t.clientX, t.clientY);
      if (!r || r.type !== 'door') return;
      doDoorToggle();
    }

    if (scene.dataset.doorTouchBound !== '1') {
      scene.dataset.doorTouchBound = '1';
      scene.addEventListener('touchend', tryToggleTouch, { capture: true, passive: false });
    }

    setCutawayMode(scene, true);
  }

  window.Interactions = {
    setupDoorToggle: setupDoorToggle,
  };
})();
