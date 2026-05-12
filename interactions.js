/**
 * interactions.js
 * ---------------
 * Tap door/front façade -> cutaway mode:
 * - hide front shell layer + roof cap
 * - make side/back walls glassy so interior blocks are visible
 * Tap again to restore normal shell.
 */

(function () {
  'use strict';

  var OPAQUE = 1;
  var GLASSY = 0.14;

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
        if (w.id === 'front-wall') continue;
        applyExtWallMaterial(w, GLASSY, 'glass');
      }
    } else {
      setAllExterior(scene, OPAQUE, 'opaque');
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

    function tryToggle(evt) {
      var start = intersectedFromEvent(evt) || evt.target;
      var node = start;
      var clickable = null;
      while (node) {
        if (node.classList && node.classList.contains('clickable')) {
          clickable = node;
          break;
        }
        node = node.parentElement || node.parentEl || null;
      }
      if (!clickable) return;
      if (!isUnder(clickable, buildingRoot)) return;

      toggleCutaway();
    }

    function bindDirectTargets() {
      var targets = scene.querySelectorAll('#door-visual, #door-hit, #front-wall, #front-facade-hit');
      var i;
      for (i = 0; i < targets.length; i++) {
        targets[i].addEventListener('click', function (evt) {
          evt.stopPropagation();
          toggleCutaway();
        });
      }
    }

    if (scene.dataset.doorToggleBound !== '1') {
      scene.dataset.doorToggleBound = '1';
      scene.addEventListener('click', tryToggle, true);
    }

    setCutawayMode(scene, false);
    bindDirectTargets();
  }

  window.Interactions = {
    setupDoorToggle: setupDoorToggle,
  };
})();
