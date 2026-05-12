/**
 * layout-page.js
 * ---------------
 * Between index and AR: paint apartment cells to match room counts from the form.
 */

(function () {
  'use strict';

  var STORAGE_KEY = 'cpis360BuildingSpec';
  var BRUSHES = [
    { id: 'bedroom', label: 'Bedroom' },
    { id: 'kitchen', label: 'Kitchen' },
    { id: 'bathroom', label: 'Bath' },
    { id: 'hallway', label: 'Hallway' },
    { id: 'erase', label: 'Erase' },
  ];

  function setMsg(text) {
    var el = document.getElementById('layout-message');
    if (el) el.textContent = text || '';
  }

  function quotasFromSpec(spec) {
    var a = spec.apartment || {};
    var h = typeof a.hallways === 'number' ? a.hallways : 0;
    return {
      bedroom: Math.max(0, Math.round(a.bedrooms || 0)),
      kitchen: Math.max(0, Math.round(a.kitchens || 0)),
      bathroom: Math.max(0, Math.round(a.bathrooms || 0)),
      hallway: Math.max(0, Math.round(h)),
    };
  }

  function countPlaced(cells, kind) {
    var n = 0;
    var r;
    var c;
    for (r = 0; r < cells.length; r++) {
      for (c = 0; c < cells[r].length; c++) {
        if (cells[r][c] === kind) n++;
      }
    }
    return n;
  }

  function gridDims(total) {
    var n = Math.max(1, total);
    var cols = Math.max(4, Math.ceil(Math.sqrt(n)));
    var rows = Math.ceil(n / cols);
    while (rows * cols < n) rows++;
    return { cols: cols, rows: rows };
  }

  function validatePainted(spec, cells) {
    var q = quotasFromSpec(spec);
    var kinds = ['bedroom', 'kitchen', 'bathroom', 'hallway'];
    var i;
    for (i = 0; i < kinds.length; i++) {
      var k = kinds[i];
      if (countPlaced(cells, k) !== q[k]) return false;
    }
    return true;
  }

  function start() {
    var raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      window.location.replace('index.html?v=realestate-2');
      return;
    }
    var spec;
    try {
      spec = JSON.parse(raw);
    } catch (e) {
      sessionStorage.removeItem(STORAGE_KEY);
      window.location.replace('index.html?v=realestate-2');
      return;
    }
    var err = window.Ui.validateSpec(spec);
    if (err) {
      setMsg(err);
      return;
    }

    var q = quotasFromSpec(spec);
    var total = q.bedroom + q.kitchen + q.bathroom + q.hallway;
    if (total < 1) {
      setMsg('Add at least one room on the form.');
      return;
    }

    var dims = gridDims(total);
    var cells = [];
    var r;
    var c;
    for (r = 0; r < dims.rows; r++) {
      var row = [];
      for (c = 0; c < dims.cols; c++) row.push('');
      cells.push(row);
    }

    var L = spec.apartmentLayout;
    if (L && L.cells && L.gridCols === dims.cols && L.gridRows === dims.rows) {
      cells = L.cells;
    }

    var currentBrush = 'bedroom';
    var gridEl = document.getElementById('layout-grid');
    var quotaEl = document.getElementById('layout-quotas');
    var brushEl = document.getElementById('layout-brushes');
    var btnAr = document.getElementById('btn-open-ar');

    function paintCell(el, kind) {
      el.dataset.kind = kind || '';
      el.className = 'layout-cell' + (kind ? ' kind-' + kind : '');
      el.setAttribute('aria-label', kind || 'empty');
    }

    function refreshQuotaText() {
      quotaEl.innerHTML =
        '<span>Bedrooms: ' +
        countPlaced(cells, 'bedroom') +
        '/' +
        q.bedroom +
        '</span>' +
        '<span>Kitchens: ' +
        countPlaced(cells, 'kitchen') +
        '/' +
        q.kitchen +
        '</span>' +
        '<span>Baths: ' +
        countPlaced(cells, 'bathroom') +
        '/' +
        q.bathroom +
        '</span>' +
        '<span>Hallways: ' +
        countPlaced(cells, 'hallway') +
        '/' +
        q.hallway +
        '</span>';
      var ok = validatePainted(spec, cells);
      btnAr.disabled = !ok;
      setMsg(ok ? '' : 'Place each room exactly once — counts must match.');
    }

    function renderGrid() {
      gridEl.innerHTML = '';
      gridEl.style.gridTemplateColumns = 'repeat(' + dims.cols + ', minmax(0, 1fr))';
      var r;
      var c;
      for (r = 0; r < dims.rows; r++) {
        for (c = 0; c < dims.cols; c++) {
          (function (row, col) {
            var cell = document.createElement('button');
            cell.type = 'button';
            cell.className = 'layout-cell' + (cells[row][col] ? ' kind-' + cells[row][col] : '');
            cell.dataset.kind = cells[row][col] || '';
            cell.setAttribute('aria-label', cells[row][col] || 'empty cell');
            cell.addEventListener('click', function () {
              var prev = cells[row][col];
              var next = currentBrush === 'erase' ? '' : currentBrush;
              if (prev === next) return;
              cells[row][col] = next;
              var over = false;
              var kinds = ['bedroom', 'kitchen', 'bathroom', 'hallway'];
              var i;
              for (i = 0; i < kinds.length; i++) {
                if (countPlaced(cells, kinds[i]) > q[kinds[i]]) over = true;
              }
              if (over) {
                cells[row][col] = prev;
                setMsg('That would exceed a room quota. Erase another cell first or pick a different brush.');
                return;
              }
              setMsg('');
              paintCell(cell, next);
              refreshQuotaText();
            });
            gridEl.appendChild(cell);
          })(r, c);
        }
      }
    }

    function buildBrushes() {
      brushEl.innerHTML = '';
      BRUSHES.forEach(function (b) {
        if (b.id === 'hallway' && q.hallway < 1) return;
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.dataset.brush = b.id;
        btn.textContent = b.label;
        if (b.id === currentBrush) btn.classList.add('is-active');
        btn.addEventListener('click', function () {
          currentBrush = b.id;
          var ch = brushEl.querySelectorAll('button');
          var j;
          for (j = 0; j < ch.length; j++) ch[j].classList.remove('is-active');
          btn.classList.add('is-active');
        });
        brushEl.appendChild(btn);
      });
    }

    buildBrushes();
    renderGrid();
    refreshQuotaText();

    btnAr.addEventListener('click', function () {
      if (!validatePainted(spec, cells)) return;
      spec.apartmentLayout = {
        gridCols: dims.cols,
        gridRows: dims.rows,
        cells: cells,
      };
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(spec));
      } catch (e) {
        setMsg('Could not save. Allow storage for this site.');
        return;
      }
      window.location.href = 'ar.html?v=markerfix-24&c=' + String(Date.now());
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
