/**
 * generator.js
 * ------------
 * Builds a simple "shell + schematic rooms" model from user numbers.
 *
 * Design choices (MVP):
 * - Building sits on the marker plane; bottom at y = 0, centered on x/z.
 * - The face toward +Z is treated as the "front" (common when the phone looks at the marker).
 * - Every floor repeats the same apartment strip along +X / -X (even width slices).
 * - Rooms are colored blocks on a loose grid inside each apartment footprint.
 * - The front wall is its own mesh so we can change opacity without removing the building.
 */

(function () {
  'use strict';

  /** Wall thickness in meters — thin so the interior feels roomy. */
  var WALL_T = 0.04;

  /** Colors for room types (distinct for presentation). */
  var COLORS = {
    bedroom: '#6C8EBF',
    kitchen: '#F2C14E',
    bathroom: '#7BC96F',
  };

  /**
   * @typedef {Object} ApartmentTemplate
   * @property {number} bedrooms
   * @property {number} kitchens
   * @property {number} bathrooms
   */

  /**
   * @typedef {Object} BuildingSpec
   * @property {number} width
   * @property {number} depth
   * @property {number} height
   * @property {number} floors
   * @property {number} apartments
   * @property {ApartmentTemplate} apartment
   */

  /**
   * Remove every child under building-root (safe regenerate).
   * @param {Element} root
   */
  function clearChildren(root) {
    while (root.firstChild) {
      root.removeChild(root.firstChild);
    }
  }

  /**
   * @param {string} tag
   * @param {Object<string, string|number|boolean>} attrs
   * @returns {Element}
   */
  function el(tag, attrs) {
    var node = document.createElement(tag);
    if (!attrs) return node;
    Object.keys(attrs).forEach(function (key) {
      node.setAttribute(key, String(attrs[key]));
    });
    return node;
  }

  /**
   * @param {number} n
   * @returns {number}
   */
  function clampMin(n, min) {
    return n < min ? min : n;
  }

  /**
   * Build ordered list of room "slots" for one apartment on one floor.
   * @param {ApartmentTemplate} apt
   * @returns {Array<'bedroom'|'kitchen'|'bathroom'>}
   */
  function expandRoomTypes(apt) {
    var list = [];
    var i;
    for (i = 0; i < apt.bedrooms; i++) list.push('bedroom');
    for (i = 0; i < apt.kitchens; i++) list.push('kitchen');
    for (i = 0; i < apt.bathrooms; i++) list.push('bathroom');
    // If the user sets everything to 0, place one neutral "studio" kitchen cell so the interior is not empty.
    if (list.length === 0) list.push('kitchen');
    return list;
  }

  /**
   * Pick a modest grid for N boxes inside a 2D footprint.
   * @param {number} n
   * @returns {{ cols: number, rows: number }}
   */
  function gridShape(n) {
    var cols = Math.ceil(Math.sqrt(n));
    var rows = Math.ceil(n / clampMin(cols, 1));
    return { cols: cols, rows: rows };
  }

  /**
   * Creates interior blocks for all floors / apartments.
   * @param {Element} parent
   * @param {BuildingSpec} spec
   */
  function addInteriorRooms(parent, spec) {
    var floorH = spec.height / clampMin(spec.floors, 1);
    var aptCount = clampMin(spec.apartments, 1);
    var aptWidthOuter = spec.width / aptCount;
    var roomTypes = expandRoomTypes(spec.apartment);
    var nRooms = roomTypes.length;
    var shape = gridShape(nRooms);
    var pad = 0.04; // breathing room between cells

    var f;
    var a;
    for (f = 0; f < spec.floors; f++) {
      var floorBaseY = f * floorH;
      var midY = floorBaseY + floorH * 0.5;

      for (a = 0; a < aptCount; a++) {
        // Apartment strip along X on this floor.
        var aptX0 = -spec.width / 2 + a * aptWidthOuter + WALL_T;
        var aptX1 = -spec.width / 2 + (a + 1) * aptWidthOuter - WALL_T;
        var usableW = aptX1 - aptX0;
        var z0 = -spec.depth / 2 + WALL_T;
        var z1 = spec.depth / 2 - WALL_T;
        var usableD = z1 - z0;

        var cellW = (usableW - pad * (shape.cols + 1)) / shape.cols;
        var cellD = (usableD - pad * (shape.rows + 1)) / shape.rows;
        var cellH = Math.max(0.06, floorH * 0.55);

        var idx = 0;
        var r;
        var c;
        for (r = 0; r < shape.rows; r++) {
          for (c = 0; c < shape.cols; c++) {
            if (idx >= nRooms) break;
            var kind = roomTypes[idx];
            var cx = aptX0 + pad + (c + 0.5) * cellW + c * pad;
            var cz = z0 + pad + (r + 0.5) * cellD + r * pad;
            var czRoom = cz - 0.02; // nudge back from the inner front plane to reduce z-fighting with the glass wall
            var box = el('a-box', {
              width: Math.max(0.05, cellW),
              height: cellH,
              depth: Math.max(0.05, cellD),
              position: cx + ' ' + midY + ' ' + czRoom,
              color: COLORS[kind],
              shader: 'flat',
              'data-room': kind,
            });
            parent.appendChild(box);
            idx++;
          }
        }
      }
    }
  }

  /**
   * Shell: floor slab, roof, side/back walls, separate front wall + door + tap pad.
   * @param {Element} parent
   * @param {BuildingSpec} spec
   */
  function addShell(parent, spec) {
    var W = spec.width;
    var D = spec.depth;
    var H = spec.height;
    var t = WALL_T;

    // Floor slab (helps anchor the illusion of a building "on" the marker).
    parent.appendChild(
      el('a-box', {
        width: W,
        height: 0.02,
        depth: D,
        position: '0 0.01 0',
        color: '#2b2f36',
        shader: 'flat',
      })
    );

    // Roof
    parent.appendChild(
      el('a-box', {
        width: W + 0.02,
        height: t,
        depth: D + 0.02,
        position: '0 ' + (H - t / 2) + ' 0',
        color: '#3a4250',
        shader: 'flat',
      })
    );

    // Back wall (-Z)
    parent.appendChild(
      el('a-box', {
        width: W,
        height: H,
        depth: t,
        position: '0 ' + H / 2 + ' ' + (-D / 2 + t / 2),
        color: '#4b5568',
        shader: 'flat',
      })
    );

    // Left wall (-X)
    parent.appendChild(
      el('a-box', {
        width: t,
        height: H,
        depth: D,
        position: -W / 2 + t / 2 + ' ' + H / 2 + ' 0',
        color: '#4b5568',
        shader: 'flat',
      })
    );

    // Right wall (+X)
    parent.appendChild(
      el('a-box', {
        width: t,
        height: H,
        depth: D,
        position: W / 2 - t / 2 + ' ' + H / 2 + ' 0',
        color: '#4b5568',
        shader: 'flat',
      })
    );

    // Front wall (+Z) — separate entity for opacity toggle (MVP requirement).
    var front = el('a-box', {
      id: 'front-wall',
      width: W,
      height: H,
      depth: t,
      position: '0 ' + H / 2 + ' ' + (D / 2 - t / 2),
    });
    front.setAttribute('material', {
      color: '#5c6a80',
      shader: 'flat',
      opacity: 1,
      transparent: true,
      side: 'double',
    });
    parent.appendChild(front);

    // Door dimensions: readable at table scale, but capped so tiny buildings still look OK.
    var floorH = H / clampMin(spec.floors, 1);
    var doorH = Math.min(0.75, Math.max(0.35, floorH * 0.45));
    var doorW = Math.min(0.55, Math.max(0.22, W * 0.18));
    var doorY = doorH / 2 + 0.02;
    // Slight outward bias so the door sits clearly on the exterior face.
    var doorZ = D / 2 + t * 0.6;

    var door = el('a-box', {
      id: 'door-visual',
      class: 'clickable',
      width: doorW,
      height: doorH,
      depth: t * 1.2,
      position: '0 ' + doorY + ' ' + doorZ,
      color: '#8B5A2B',
      shader: 'flat',
    });
    parent.appendChild(door);

    // Big invisible hit pad in front of the door — easier to tap on phones than a thin strip.
    var hitW = Math.max(doorW * 2.2, 0.55);
    var hitH = Math.max(doorH * 2.0, 0.75);
    var hitZ = doorZ + 0.12;
    var hitPad = el('a-plane', {
      id: 'door-hit',
      class: 'clickable',
      width: hitW,
      height: hitH,
      position: '0 ' + doorY + ' ' + hitZ,
      rotation: '-90 0 0',
      material: 'opacity: 0.001; transparent: true; shader: flat; side: double',
    });
    parent.appendChild(hitPad);
  }

  /**
   * Public entry: rebuild everything under building-root.
   * @param {Element} buildingRoot
   * @param {BuildingSpec} spec
   */
  function generateBuilding(buildingRoot, spec) {
    clearChildren(buildingRoot);
    // Rooms first so the shell draws "on top" at equal depth? Actually order matters less with depth buffer.
    // We draw shell then rooms so interior exists; transparent front wall still shows interior.
    addShell(buildingRoot, spec);
    addInteriorRooms(buildingRoot, spec);
  }

  window.BuildingGenerator = {
    generateBuilding: generateBuilding,
    COLORS: COLORS,
    WALL_T: WALL_T,
  };
})();
