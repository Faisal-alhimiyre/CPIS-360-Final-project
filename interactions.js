/**
 * interactions.js
 * ---------------
 * Handles the "tap the door → front wall becomes nearly transparent" interaction.
 *
 * How it works in A-Frame:
 * - The camera has an <a-cursor> with a raycaster limited to `.clickable` objects.
 * - The door + a large invisible plane are `.clickable`.
 * - When those fire `click`, we adjust ONLY the front wall material opacity.
 */

(function () {
  'use strict';

  /** Nearly clear but still slightly visible so you can see where the wall was. */
  var OPAQUE = 1;
  var GLASSY = 0.12;

  /**
   * Read current mode from the front wall entity (stored on the element for simplicity).
   * @param {Element} frontWall
   * @returns {boolean} true if currently "glass" / see-through mode
   */
  function isGlassMode(frontWall) {
    return frontWall && frontWall.dataset && frontWall.dataset.wallMode === 'glass';
  }

  /**
   * Apply opacity to the front wall while keeping it transparent-capable.
   * @param {Element} frontWall
   * @param {number} opacity
   * @param {string} modeLabel
   */
  function setFrontWallOpacity(frontWall, opacity, modeLabel) {
    if (!frontWall) return;
    frontWall.setAttribute('material', {
      color: '#5c6a80',
      shader: 'flat',
      opacity: opacity,
      transparent: true,
      side: 'double',
    });
    frontWall.dataset.wallMode = modeLabel;
  }

  /**
   * @param {Element} node
   * @param {Element} ancestor
   * @returns {boolean}
   */
  function isUnder(node, ancestor) {
    var cur = node;
    while (cur) {
      if (cur === ancestor) return true;
      cur = cur.parentElement || cur.parentEl || null;
    }
    return false;
  }

  /**
   * Wire click listeners once the scene exists. Safe to call on every rebuild:
   * we register ONCE on the <a-scene> because some mobile browsers are picky about
   * event bubbling from raycast hits.
   *
   * @param {Element} scene
   * @param {Element} buildingRoot
   */
  function setupDoorToggle(scene, buildingRoot) {
    if (!scene || !buildingRoot) return;
    if (scene.dataset.doorToggleBound === '1') return;
    scene.dataset.doorToggleBound = '1';

    scene.addEventListener('click', function (evt) {
      // Prefer the raycast pick (stable on mobile); fall back to DOM target + parent walk.
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
      if (!front) return;

      var nextGlass = !isGlassMode(front);
      if (nextGlass) {
        setFrontWallOpacity(front, GLASSY, 'glass');
      } else {
        setFrontWallOpacity(front, OPAQUE, 'opaque');
      }
    });
  }

  window.Interactions = {
    setupDoorToggle: setupDoorToggle,
  };
})();
