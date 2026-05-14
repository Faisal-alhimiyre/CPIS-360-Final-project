/**
 * room-relocate.js
 * ----------------
 * Fixed-template AR: tap a room pad to select, then tap the floor pad to move (XZ clamped).
 */

(function () {
  'use strict';

  var selected = null;
  var mount = null;

  function three() {
    if (typeof AFRAME !== 'undefined' && AFRAME.THREE) return AFRAME.THREE;
    if (typeof THREE !== 'undefined') return THREE;
    return null;
  }

  function findRoomCluster(node) {
    var cur = node;
    while (cur) {
      if (cur.classList && cur.classList.contains('room-cluster')) return cur;
      cur = cur.parentElement || cur.parentEl || null;
    }
    return null;
  }

  function clearSelect() {
    if (!selected) return;
    var slab = selected.querySelector('[data-slab="1"]');
    if (slab && slab.dataset.origMaterial) {
      slab.setAttribute('material', slab.dataset.origMaterial);
    }
    selected.setAttribute('scale', '1 1 1');
    selected = null;
  }

  function selectGroup(grp) {
    clearSelect();
    selected = grp;
    var slab = grp.querySelector('[data-slab="1"]');
    if (slab && slab.dataset.origMaterial) {
      slab.setAttribute(
        'material',
        slab.dataset.origMaterial.replace('opacity: 0.82', 'opacity: 0.98')
      );
    }
    grp.setAttribute('scale', '1.04 1.04 1.04');
  }

  function intersectPoint(evt) {
    var d = evt.detail || {};
    if (d.intersection && d.intersection.point) return d.intersection.point;
    if (d.intersections && d.intersections[0] && d.intersections[0].point) return d.intersections[0].point;
    return null;
  }

  function onRoomHitClick(evt) {
    if (!mount) return;
    var grp = findRoomCluster(evt.currentTarget);
    if (grp) selectGroup(grp);
  }

  function onFloorHitClick(evt) {
    if (!mount || !selected) return;
    var floorEl = evt.currentTarget;
    var T = three();
    if (!T) return;
    var pt = intersectPoint(evt);
    if (!pt || floorEl.dataset.innerX0 == null) return;

    var ix0 = parseFloat(floorEl.dataset.innerX0, 10);
    var ix1 = parseFloat(floorEl.dataset.innerX1, 10);
    var iz0 = parseFloat(floorEl.dataset.innerZ0, 10);
    var iz1 = parseFloat(floorEl.dataset.innerZ1, 10);
    var hw = parseFloat(selected.dataset.halfW, 10) || 0.05;
    var hd = parseFloat(selected.dataset.halfD, 10) || 0.05;

    var local = new T.Vector3();
    mount.object3D.worldToLocal(local.copy(pt));

    var ny = selected.object3D.position.y;
    var nx = Math.min(Math.max(local.x, ix0 + hw), ix1 - hw);
    var nz = Math.min(Math.max(local.z, iz0 + hd), iz1 - hd);
    selected.setAttribute('position', { x: nx, y: ny, z: nz });
  }

  function attach(root) {
    detach();
    mount = root;
    if (!mount) return;
    var rooms = mount.querySelectorAll('.room-select-hit');
    var floors = mount.querySelectorAll('.relocate-floor-hit');
    var i;
    for (i = 0; i < rooms.length; i++) {
      rooms[i].addEventListener('click', onRoomHitClick);
    }
    for (i = 0; i < floors.length; i++) {
      floors[i].addEventListener('click', onFloorHitClick);
    }
  }

  function detach() {
    if (mount) {
      var rooms = mount.querySelectorAll('.room-select-hit');
      var floors = mount.querySelectorAll('.relocate-floor-hit');
      var i;
      for (i = 0; i < rooms.length; i++) {
        rooms[i].removeEventListener('click', onRoomHitClick);
      }
      for (i = 0; i < floors.length; i++) {
        floors[i].removeEventListener('click', onFloorHitClick);
      }
    }
    mount = null;
    clearSelect();
  }

  window.RoomRelocate = {
    attach: attach,
    detach: detach,
  };
})();
