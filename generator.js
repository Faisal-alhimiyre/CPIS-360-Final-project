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
    hallway: '#94a3b8',
    living: '#e8dcc8',
    entrance: '#cbd5e1',
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
   * Lighten/darken a hex color by pct in range [-1..1].
   * @param {string} hex
   * @param {number} pct
   * @returns {string}
   */
  function tintHex(hex, pct) {
    if (!/^#[0-9a-fA-F]{6}$/.test(hex || '')) return '#64748b';
    var num = parseInt(hex.slice(1), 16);
    var r = (num >> 16) & 255;
    var g = (num >> 8) & 255;
    var b = num & 255;
    var target = pct >= 0 ? 255 : 0;
    var t = Math.abs(pct);
    var rr = Math.round(r + (target - r) * t);
    var gg = Math.round(g + (target - g) * t);
    var bb = Math.round(b + (target - b) * t);
    return (
      '#' +
      rr.toString(16).padStart(2, '0') +
      gg.toString(16).padStart(2, '0') +
      bb.toString(16).padStart(2, '0')
    );
  }

  /**
   * Build ordered list of room "slots" for one apartment on one floor.
   * @param {ApartmentTemplate} apt
   * @returns {Array<'bedroom'|'kitchen'|'bathroom'>}
   */
  function expandRoomTypes(apt) {
    var list = [];
    var i;
    var hw = typeof apt.hallways === 'number' ? apt.hallways : 0;
    for (i = 0; i < apt.bedrooms; i++) list.push('bedroom');
    for (i = 0; i < apt.kitchens; i++) list.push('kitchen');
    for (i = 0; i < apt.bathrooms; i++) list.push('bathroom');
    for (i = 0; i < hw; i++) list.push('hallway');
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
  function layoutGridValid(L) {
    if (!L || !L.cells || !L.gridCols || !L.gridRows) return false;
    if (L.cells.length !== L.gridRows) return false;
    var r;
    for (r = 0; r < L.cells.length; r++) {
      if (!L.cells[r] || L.cells[r].length !== L.gridCols) return false;
    }
    return true;
  }

  /**
   * @param {Element} parent
   * @param {BuildingSpec} spec
   * @param {{ gridCols: number, gridRows: number, cells: string[][] }} L
   */
  function addInteriorRoomsFromLayout(parent, spec, L) {
    var floorH = spec.height / clampMin(spec.floors, 1);
    var aptCount = clampMin(spec.apartments, 1);
    var aptWidthOuter = spec.width / aptCount;
    var cols = L.gridCols;
    var rows = L.gridRows;
    var pad = 0.04;

    var f;
    var a;
    for (f = 0; f < spec.floors; f++) {
      var floorBaseY = f * floorH;
      var midY = floorBaseY + floorH * 0.5;

      for (a = 0; a < aptCount; a++) {
        var aptX0 = -spec.width / 2 + a * aptWidthOuter + WALL_T;
        var aptX1 = -spec.width / 2 + (a + 1) * aptWidthOuter - WALL_T;
        var usableW = aptX1 - aptX0;
        var z0 = -spec.depth / 2 + WALL_T;
        var z1 = spec.depth / 2 - WALL_T;
        var usableD = z1 - z0;

        var cellW = (usableW - pad * (cols + 1)) / cols;
        var cellD = (usableD - pad * (rows + 1)) / rows;
        var cellH = Math.max(0.06, floorH * 0.55);

        var rr;
        var cc;
        for (rr = 0; rr < rows; rr++) {
          for (cc = 0; cc < cols; cc++) {
            var kind = L.cells[rr][cc];
            if (!kind) continue;
            var col = COLORS[kind] || '#cbd5e1';
            var cx = aptX0 + pad + (cc + 0.5) * cellW + cc * pad;
            var cz = z0 + pad + (rr + 0.5) * cellD + rr * pad;
            var czRoom = cz - 0.02;
            var box = el('a-box', {
              width: Math.max(0.05, cellW),
              height: cellH,
              depth: Math.max(0.05, cellD),
              position: cx + ' ' + midY + ' ' + czRoom,
              color: col,
              shader: 'flat',
              'data-room': kind,
            });
            parent.appendChild(box);
          }
        }
      }
    }
  }

  /**
   * One fixed floor-plan template (professor MVP): five labeled rooms, no furniture.
   * Approximates a small one-bedroom: kitchen + entrance + bath along the back row,
   * living + bedroom toward the front — like the reference plan, scaled to the footprint.
   * @param {Element} parent
   * @param {BuildingSpec} spec
   */
  function addFixedSingleApartmentTemplate(parent, spec) {
    var floorH = spec.height / clampMin(spec.floors, 1);
    var aptCount = clampMin(spec.apartments, 1);
    var aptWidthOuter = spec.width / aptCount;
    var pad = 0.04;
    var cellH = Math.max(0.08, floorH * 0.42);

    /** @type {Array<{ key: string, label: string, x0: number, x1: number, z0: number, z1: number }>} */
    var rooms = [
      { key: 'kitchen', label: 'Kitchen', x0: 0, x1: 0.36, z0: 0, z1: 0.32 },
      { key: 'entrance', label: 'Entrance', x0: 0.36, x1: 0.5, z0: 0, z1: 0.32 },
      { key: 'bathroom', label: 'Bathroom', x0: 0.5, x1: 1, z0: 0, z1: 0.32 },
      { key: 'living', label: 'Living room', x0: 0, x1: 0.66, z0: 0.32, z1: 1 },
      { key: 'bedroom', label: 'Bedroom', x0: 0.66, x1: 1, z0: 0.32, z1: 1 },
    ];

    var f;
    var a;
    for (f = 0; f < spec.floors; f++) {
      var floorBaseY = f * floorH;
      var midY = floorBaseY + floorH * 0.5;

      for (a = 0; a < aptCount; a++) {
        var aptX0 = -spec.width / 2 + a * aptWidthOuter + WALL_T;
        var aptX1 = -spec.width / 2 + (a + 1) * aptWidthOuter - WALL_T;
        var usableW = aptX1 - aptX0;
        var z0 = -spec.depth / 2 + WALL_T;
        var z1 = spec.depth / 2 - WALL_T;
        var usableD = z1 - z0;

        var ri;
        for (ri = 0; ri < rooms.length; ri++) {
          var rm = rooms[ri];
          var xL = aptX0 + rm.x0 * usableW + pad;
          var xR = aptX0 + rm.x1 * usableW - pad;
          var zB = z0 + rm.z0 * usableD + pad;
          var zF = z0 + rm.z1 * usableD - pad;
          var bw = Math.max(0.06, xR - xL);
          var bd = Math.max(0.06, zF - zB);
          var cx = (xL + xR) / 2;
          var cz = (zB + zF) / 2 - 0.02;
          var col = COLORS[rm.key] || '#cbd5e1';

          var box = el('a-box', {
            width: bw,
            height: cellH,
            depth: bd,
            position: cx + ' ' + midY + ' ' + cz,
            color: col,
            shader: 'flat',
            'data-room': rm.key,
            'data-room-label': rm.label,
          });
          parent.appendChild(box);

          var labelY = midY + cellH * 0.52 + 0.06;
          var tw = Math.min(Math.max(bw, bd) * 0.85, 3.2);
          var label = el('a-text', {
            value: rm.label,
            position: cx + ' ' + labelY + ' ' + cz,
            align: 'center',
            anchor: 'center',
            baseline: 'center',
            color: '#0f172a',
            width: tw,
            wrapCount: 18,
          });
          parent.appendChild(label);
        }
      }
    }
  }

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
   * Mark mesh as an exterior façade (toggled with the door for “glass” preview).
   * @param {Element} node
   * @param {string} hex
   */
  function markExtWall(node, hex) {
    node.classList.add('ext-wall');
    node.dataset.extColor = hex;
    node.setAttribute(
      'material',
      'color: ' + hex + '; shader: flat; opacity: 1; transparent: true; side: double'
    );
  }

  /**
   * Shell: floor slab, roof, façades, door + frame, window accents, hit pad.
   * @param {Element} parent
   * @param {BuildingSpec} spec
   */
  function addShell(parent, spec) {
    var W = spec.width;
    var D = spec.depth;
    var H = spec.height;
    var t = WALL_T;
    var faceZ = D / 2 - t / 2;
    var facadeBase = /^#[0-9a-fA-F]{6}$/.test(spec.facadeColor || '') ? spec.facadeColor : '#64748b';
    var facadeSide = tintHex(facadeBase, 0.08);
    var facadeFront = tintHex(facadeBase, -0.08);
    var roofColor = tintHex(facadeBase, -0.45);

    parent.appendChild(
      el('a-box', {
        width: W,
        height: 0.02,
        depth: D,
        position: '0 0.01 0',
        color: '#cbd5e1',
        shader: 'flat',
      })
    );

    var roofCap = el('a-box', {
      id: 'roof-cap',
      width: W + 0.04,
      height: t * 1.2,
      depth: D + 0.04,
      position: '0 ' + (H - t * 0.6) + ' 0',
      color: roofColor,
      shader: 'flat',
    });
    roofCap.classList.add('cutaway-hide');
    parent.appendChild(roofCap);

    var back = el('a-box', {
      width: W,
      height: H,
      depth: t,
      position: '0 ' + H / 2 + ' ' + (-D / 2 + t / 2),
    });
    markExtWall(back, facadeBase);
    parent.appendChild(back);

    var left = el('a-box', {
      width: t,
      height: H,
      depth: D,
      position: -W / 2 + t / 2 + ' ' + H / 2 + ' 0',
    });
    markExtWall(left, facadeSide);
    parent.appendChild(left);

    var right = el('a-box', {
      width: t,
      height: H,
      depth: D,
      position: W / 2 - t / 2 + ' ' + H / 2 + ' 0',
    });
    markExtWall(right, facadeSide);
    parent.appendChild(right);

    var front = el('a-box', {
      id: 'front-wall',
      width: W,
      height: H,
      depth: t,
      position: '0 ' + H / 2 + ' ' + faceZ,
    });
    markExtWall(front, facadeFront);
    front.classList.add('clickable', 'cutaway-hide');
    parent.appendChild(front);

    var frontHitZ = faceZ + t * 1.15;
    var frontHit = el('a-plane', {
      id: 'front-facade-hit',
      class: 'clickable',
      width: W * 0.98,
      height: H * 0.96,
      position: '0 ' + H / 2 + ' ' + frontHitZ,
      rotation: '-90 0 0',
      material: 'opacity: 0.04; transparent: true; shader: flat; side: double',
    });
    frontHit.classList.add('cutaway-hide');
    parent.appendChild(frontHit);

    var winY = H * 0.55;
    var winW = Math.min(0.22, W * 0.08);
    var winH = H * 0.22;
    var winZ = faceZ - t * 0.25;
    var wx;
    for (wx = -W * 0.28; wx <= W * 0.28 + 0.01; wx += W * 0.28) {
      var wn = el('a-box', {
        width: winW,
        height: winH,
        depth: t * 0.5,
        position: wx + ' ' + winY + ' ' + winZ,
        color: '#0f172a',
        shader: 'flat',
      });
      wn.classList.add('cutaway-hide');
      parent.appendChild(wn);
    }

    var floorH = H / clampMin(spec.floors, 1);
    var doorH = Math.min(1.15, Math.max(0.55, floorH * 0.72));
    var doorW = Math.min(1.05, Math.max(0.48, W * 0.38));
    var doorY = doorH / 2 + 0.04;
    var doorZ = D / 2 + t * 0.75;
    var frameT = Math.max(0.03, t * 1.1);
    var jambW = frameT;
    var jambD = t * 1.4;
    var lintelH = frameT * 1.2;

    var jambX = doorW / 2 + jambW / 2;
    var jamb = el('a-box', {
      width: jambW,
      height: doorH + lintelH * 0.5,
      depth: jambD,
      position: -jambX + ' ' + (doorY + lintelH * 0.15) + ' ' + doorZ,
      color: '#78350f',
      shader: 'flat',
    });
    parent.appendChild(jamb);
    var jambR = el('a-box', {
      width: jambW,
      height: doorH + lintelH * 0.5,
      depth: jambD,
      position: jambX + ' ' + (doorY + lintelH * 0.15) + ' ' + doorZ,
      color: '#78350f',
      shader: 'flat',
    });
    parent.appendChild(jambR);

    var lintel = el('a-box', {
      width: doorW + jambW * 2.6,
      height: lintelH,
      depth: jambD,
      position: '0 ' + (doorY + doorH / 2 + lintelH * 0.55) + ' ' + doorZ,
      color: '#92400e',
      shader: 'flat',
    });
    parent.appendChild(lintel);

    var door = el('a-box', {
      id: 'door-visual',
      class: 'clickable',
      width: doorW,
      height: doorH,
      depth: t * 1.35,
      position: '0 ' + doorY + ' ' + doorZ,
      color: '#ea580c',
      shader: 'flat',
    });
    parent.appendChild(door);

    var hitW = Math.max(doorW * 2.8, Math.min(W * 0.85, 1.4));
    var hitH = Math.max(doorH * 2.4, Math.min(H * 0.55, 1.35));
    var hitZ = doorZ + 0.14;
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
    if (spec.useFixedApartmentTemplate) {
      addFixedSingleApartmentTemplate(buildingRoot, spec);
    } else if (spec.apartmentLayout && layoutGridValid(spec.apartmentLayout)) {
      addInteriorRoomsFromLayout(buildingRoot, spec, spec.apartmentLayout);
    } else {
      addInteriorRooms(buildingRoot, spec);
    }
    addShell(buildingRoot, spec);

    // AR marker is only a few cm wide in the real world. If the user types "120 m" the raw model would be
    // enormous — you would be "inside" a solid wall and see nothing. Uniformly scale so the longest edge
    // fits roughly on the marker (~2.3 m in virtual space is a comfortable phone AR size).
    var maxDim = Math.max(spec.width, spec.depth, spec.height);
    var AR_MAX_EXTENT = 2.3;
    var s = maxDim > AR_MAX_EXTENT ? AR_MAX_EXTENT / maxDim : 1;
    buildingRoot.setAttribute('scale', s + ' ' + s + ' ' + s);
  }

  window.BuildingGenerator = {
    generateBuilding: generateBuilding,
    COLORS: COLORS,
    WALL_T: WALL_T,
  };
})();
