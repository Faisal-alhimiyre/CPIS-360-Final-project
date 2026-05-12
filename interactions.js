/**
 * interactions.js
 * ---------------
 * Tap door, hit pad, or any .clickable façade (e.g. front wall) → all exterior façades (.ext-wall) become nearly transparent
 * so the colored apartment layout inside is visible.
 */

(function () {
  'use strict';

  var OPAQUE = 1;
  var GLASSY = 0.14;

  function isGlassMode(frontWall) {
    return frontWall && frontWall.dataset && frontWall.dataset.wallMode === 'glass';
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
    if (scene.dataset.doorToggleBound === '1') return;
    scene.dataset.doorToggleBound = '1';

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

      var front = scene.querySelector('#front-wall');
      var nextGlass = !isGlassMode(front);
      if (nextGlass) {
        setAllExterior(scene, GLASSY, 'glass');
      } else {
        setAllExterior(scene, OPAQUE, 'opaque');
      }
    }

    scene.addEventListener('click', tryToggle, true);
  }

  window.Interactions = {
    setupDoorToggle: setupDoorToggle,
  };
})();
