/**
 * interactions.js
 * ---------------
 * Tap door (or large hit pad) → all exterior façades (.ext-wall) become nearly transparent
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
    wall.setAttribute('material', {
      color: c,
      shader: 'flat',
      opacity: opacity,
      transparent: true,
      side: 'double',
    });
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

  function setupDoorToggle(scene, buildingRoot) {
    if (!scene || !buildingRoot) return;
    if (scene.dataset.doorToggleBound === '1') return;
    scene.dataset.doorToggleBound = '1';

    scene.addEventListener('click', function (evt) {
      var start = evt.detail && evt.detail.intersectedEl ? evt.detail.intersectedEl : evt.target;
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
    });
  }

  window.Interactions = {
    setupDoorToggle: setupDoorToggle,
  };
})();
