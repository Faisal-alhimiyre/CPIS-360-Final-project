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
   * One fixed floor-plan template (professor MVP): five labeled rooms, thin floor tints,
   * vertical partition walls + perimeter (no furniture). Full building shell is skipped for this path.
   * @param {Element} parent
   * @param {BuildingSpec} spec
   */
  function addFixedSingleApartmentTemplate(parent, spec) {
    var floorH = spec.height / clampMin(spec.floors, 1);
    var aptCount = clampMin(spec.apartments, 1);
    var aptWidthOuter = spec.width / aptCount;
    var wt = WALL_T;
    var wallH = Math.max(0.35, floorH * 0.9);
    var slabT = 0.025;
    var floorY = 0;
    var wallCenterY = floorY + 0.02 + wallH / 2;
    var facadeBase = /^#[0-9a-fA-F]{6}$/.test(spec.facadeColor || '') ? spec.facadeColor : '#64748b';

    /** @type {Array<{ key: string, label: string, x0: number, x1: number, z0: number, z1: number }>} */
    var rooms = [
      { key: 'kitchen', label: 'Kitchen', x0: 0, x1: 0.36, z0: 0, z1: 0.32 },
      { key: 'entrance', label: 'Entrance', x0: 0.36, x1: 0.5, z0: 0, z1: 0.32 },
      { key: 'bathroom', label: 'Bathroom', x0: 0.5, x1: 1, z0: 0, z1: 0.32 },
      { key: 'living', label: 'Living room', x0: 0, x1: 0.66, z0: 0.32, z1: 1 },
      { key: 'bedroom', label: 'Bedroom', x0: 0.66, x1: 1, z0: 0.32, z1: 1 },
    ];

    function addIntWall(w, h, d, cx, cy, cz) {
      var wall = el('a-box', {
        width: w,
        height: h,
        depth: d,
        position: cx + ' ' + cy + ' ' + cz,
        material:
          'color: #bae6fd; shader: flat; opacity: 0.32; transparent: true; side: double',
      });
      wall.classList.add('int-wall');
      parent.appendChild(wall);
    }

    var f;
    var a;
    for (f = 0; f < spec.floors; f++) {
      var floorBaseY = f * floorH;
      floorY = floorBaseY + 0.01;
      wallCenterY = floorY + 0.02 + wallH / 2;
      var labelY = floorBaseY + wallH + 0.12;

      for (a = 0; a < aptCount; a++) {
        var aptX0 = -spec.width / 2 + a * aptWidthOuter + wt;
        var aptX1 = -spec.width / 2 + (a + 1) * aptWidthOuter - wt;
        var usableW = aptX1 - aptX0;
        var z0 = -spec.depth / 2 + wt;
        var z1 = spec.depth / 2 - wt;
        var usableD = z1 - z0;

        var xLine1 = aptX0 + 0.36 * usableW;
        var xLine2 = aptX0 + 0.5 * usableW;
        var xLine3 = aptX0 + 0.66 * usableW;
        var zLine1 = z0 + 0.32 * usableD;

        var innerX0 = aptX0 + wt / 2;
        var innerX1 = aptX1 - wt / 2;
        var innerZ0 = z0 + wt / 2;
        var innerZ1 = z1 - wt / 2;

        var baseSlab = el('a-box', {
          width: usableW,
          height: slabT,
          depth: usableD,
          position: (aptX0 + aptX1) / 2 + ' ' + (floorY + slabT / 2) + ' ' + (z0 + z1) / 2,
          material:
            'color: #f8fafc; shader: flat; opacity: 0.28; transparent: true; side: double',
        });
        parent.appendChild(baseSlab);

        var ri;
        for (ri = 0; ri < rooms.length; ri++) {
          var rm = rooms[ri];
          var xL = aptX0 + rm.x0 * usableW + wt * 0.35;
          var xR = aptX0 + rm.x1 * usableW - wt * 0.35;
          var zB = z0 + rm.z0 * usableD + wt * 0.35;
          var zF = z0 + rm.z1 * usableD - wt * 0.35;
          var bw = Math.max(0.08, xR - xL);
          var bd = Math.max(0.08, zF - zB);
          var cx = (xL + xR) / 2;
          var cz = (zB + zF) / 2;
          var col = COLORS[rm.key] || '#cbd5e1';

          var slab = el('a-box', {
            width: bw,
            height: slabT,
            depth: bd,
            position: cx + ' ' + (floorY + slabT * 1.1) + ' ' + cz,
            material:
              'color: ' +
              col +
              '; opacity: 0.82; transparent: true; shader: flat; side: double',
            'data-room': rm.key,
          });
          parent.appendChild(slab);

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

        var topZ0 = innerZ0;
        var topZ1 = zLine1 - wt / 2;
        var dTop = Math.max(0.05, topZ1 - topZ0);
        var czTop = (topZ0 + topZ1) / 2;
        addIntWall(wt, wallH, dTop, xLine1, wallCenterY, czTop);
        addIntWall(wt, wallH, dTop, xLine2, wallCenterY, czTop);

        var botZ0 = zLine1 + wt / 2;
        var botZ1 = innerZ1;
        var dBot = Math.max(0.05, botZ1 - botZ0);
        var czBot = (botZ0 + botZ1) / 2;
        addIntWall(wt, wallH, dBot, xLine3, wallCenterY, czBot);

        var partW = Math.max(0.05, innerX1 - innerX0);
        var partX = (innerX0 + innerX1) / 2;
        addIntWall(partW, wallH, wt, partX, wallCenterY, zLine1);

        var backWall = el('a-box', {
          width: usableW,
          height: wallH,
          depth: wt,
          position: (aptX0 + aptX1) / 2 + ' ' + wallCenterY + ' ' + (z0 + wt / 2),
          shader: 'flat',
        });
        markExtWallGlass(backWall, facadeBase);
        parent.appendChild(backWall);

        var leftWall = el('a-box', {
          width: wt,
          height: wallH,
          depth: usableD,
          position: aptX0 + wt / 2 + ' ' + wallCenterY + ' ' + (z0 + z1) / 2,
          shader: 'flat',
        });
        markExtWallGlass(leftWall, tintHex(facadeBase, 0.08));
        parent.appendChild(leftWall);

        var rightWall = el('a-box', {
          width: wt,
          height: wallH,
          depth: usableD,
          position: aptX1 - wt / 2 + ' ' + wallCenterY + ' ' + (z0 + z1) / 2,
          shader: 'flat',
        });
        markExtWallGlass(rightWall, tintHex(facadeBase, 0.08));
        parent.appendChild(rightWall);

        var doorW = Math.min(1.05, Math.max(0.45, usableW * 0.16));
        var midX = (aptX0 + aptX1) / 2;
        var xDoorL = midX - doorW / 2;
        var xDoorR = midX + doorW / 2;
        var frontZ = z1 - wt / 2;
        var segLeftW = Math.max(0.05, xDoorL - aptX0 - wt);
        var segRightW = Math.max(0.05, aptX1 - wt - xDoorR);
        var segLX = aptX0 + wt / 2 + segLeftW / 2;
        var segRX = xDoorR + segRightW / 2;

        var frontL = el('a-box', {
          width: segLeftW,
          height: wallH,
          depth: wt,
          position: segLX + ' ' + wallCenterY + ' ' + frontZ,
          shader: 'flat',
        });
        markExtWallGlass(frontL, tintHex(facadeBase, -0.08));
        frontL.classList.add('cutaway-hide');
        frontL.dataset.apartmentFront = 'true';
        parent.appendChild(frontL);

        var frontR = el('a-box', {
          width: segRightW,
          height: wallH,
          depth: wt,
          position: segRX + ' ' + wallCenterY + ' ' + frontZ,
          shader: 'flat',
        });
        markExtWallGlass(frontR, tintHex(facadeBase, -0.08));
        frontR.classList.add('cutaway-hide');
        frontR.dataset.apartmentFront = 'true';
        parent.appendChild(frontR);

        var roofAttrs = {
          width: usableW + wt,
          height: wt * 1.2,
          depth: usableD + wt,
          position: (aptX0 + aptX1) / 2 + ' ' + (floorBaseY + wallH + wt * 0.65) + ' ' + (z0 + z1) / 2,
          material:
            'color: ' +
            tintHex(facadeBase, -0.35) +
            '; shader: flat; opacity: 0.14; transparent: true; side: double',
        };
        if (a === 0 && f === 0) roofAttrs.id = 'roof-cap';
        var roofCap = el('a-box', roofAttrs);
        roofCap.classList.add('cutaway-hide');
        parent.appendChild(roofCap);

        var doorH = Math.min(wallH * 0.88, 1.05);
        var doorY = floorY + 0.02 + doorH / 2;
        var doorZOut = z1 + wt * 0.85;
        var doorAttrs = {
          class: 'clickable door-hot',
          'data-door-toggle': '1',
          width: doorW,
          height: doorH,
          depth: wt * 1.4,
          position: midX + ' ' + doorY + ' ' + doorZOut,
          color: '#ea580c',
          shader: 'flat',
        };
        if (a === 0 && f === 0) doorAttrs.id = 'door-visual';
        var door = el('a-box', doorAttrs);
        parent.appendChild(door);

        var hitAttrs = {
          class: 'clickable door-hot',
          'data-door-toggle': '1',
          width: Math.max(doorW * 2.5, 0.7),
          height: Math.max(doorH * 2.2, 0.85),
          position: midX + ' ' + doorY + ' ' + (doorZOut + 0.12),
          rotation: '-90 0 0',
          material: 'opacity: 0.001; transparent: true; shader: flat; side: double',
        };
        if (a === 0 && f === 0) hitAttrs.id = 'door-hit';
        var hitPad = el('a-plane', hitAttrs);
        parent.appendChild(hitPad);

        var frontHitZ = z1 + wt * 1.35;
        var fhAttrs = {
          class: 'clickable door-hot',
          'data-door-toggle': '1',
          width: usableW * 0.95,
          height: wallH * 0.95,
          position: (aptX0 + aptX1) / 2 + ' ' + wallCenterY + ' ' + frontHitZ,
          rotation: '-90 0 0',
          material: 'opacity: 0.04; transparent: true; shader: flat; side: double',
        };
        if (a === 0 && f === 0) fhAttrs.id = 'front-facade-hit';
        var frontHit = el('a-plane', fhAttrs);
        frontHit.classList.add('cutaway-hide');
        parent.appendChild(frontHit);
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
   * Translucent shell for fixed-template AR (dollhouse / glass box).
   * @param {Element} node
   * @param {string} hex
   */
  function markExtWallGlass(node, hex) {
    node.classList.add('ext-wall');
    node.dataset.extColor = hex;
    node.setAttribute(
      'material',
      'color: ' + hex + '; shader: flat; opacity: 0.24; transparent: true; side: double'
    );
    node.dataset.wallMode = 'glass';
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
    var buildSpec = spec;

    if (spec.useFixedApartmentTemplate) {
      // One floor in AR for now: same template footprint, height = one storey (total height / floors).
      var perFloorH = spec.height / clampMin(spec.floors, 1);
      buildSpec = Object.assign({}, spec, {
        floors: 1,
        height: perFloorH,
      });
      addFixedSingleApartmentTemplate(buildingRoot, buildSpec);
      /*
       * Full-building shell (façades, marker-scale box) paused while we perfect one apartment unit.
       * Restore later: addShell(buildingRoot, spec);
       */
    } else if (spec.apartmentLayout && layoutGridValid(spec.apartmentLayout)) {
      addInteriorRoomsFromLayout(buildingRoot, spec, spec.apartmentLayout);
      addShell(buildingRoot, spec);
    } else {
      addInteriorRooms(buildingRoot, spec);
      addShell(buildingRoot, spec);
    }

    // Fit inside ~2.3×2.3×2.3 virtual units on the marker. Per-axis scale keeps width/depth readable when
    // total height is large (uniform scale used to crush the footprint into a grey pillar).
    var AR_MAX = 2.3;
    var gw = Math.max(buildSpec.width, 0.2);
    var gh = Math.max(buildSpec.height, 0.2);
    var gd = Math.max(buildSpec.depth, 0.2);
    buildingRoot.setAttribute('scale', AR_MAX / gw + ' ' + AR_MAX / gh + ' ' + AR_MAX / gd);
  }

  window.BuildingGenerator = {
    generateBuilding: generateBuilding,
    COLORS: COLORS,
    WALL_T: WALL_T,
  };
})();
