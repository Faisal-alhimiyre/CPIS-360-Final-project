/**
 * ui.js
 * -----
 * Reads the HTML form, validates inputs, and shows short status messages.
 * Keeps beginner-friendly plain DOM — no frameworks.
 */

(function () {
  'use strict';

  /**
   * @returns {HTMLFormElement|null}
   */
  function getForm() {
    return document.getElementById('building-form');
  }

  /**
   * @param {string} text
   */
  function setMessage(text) {
    var el = document.getElementById('form-message');
    if (el) el.textContent = text || '';
  }

  /**
   * Parse numbers safely; fallback to default if blank/invalid.
   * @param {HTMLInputElement|null} input
   * @param {number} fallback
   * @returns {number}
   */
  function readNumber(input, fallback) {
    if (!input) return fallback;
    var v = parseFloat(input.value);
    return isFinite(v) ? v : fallback;
  }

  /**
   * @param {HTMLInputElement|null} input
   * @param {string} fallback
   * @returns {string}
   */
  function readHexColor(input, fallback) {
    if (!input || typeof input.value !== 'string') return fallback;
    var v = input.value.trim();
    return /^#[0-9a-fA-F]{6}$/.test(v) ? v : fallback;
  }

  /**
   * Updates live summaries and the readonly total height field (floors × ceiling).
   */
  function syncFootprintMath() {
    var form = getForm();
    if (!form) return;

    var w = readNumber(form.querySelector('#width'), 20);
    var d = readNumber(form.querySelector('#depth'), 20);
    var floors = Math.round(readNumber(form.querySelector('#floors'), 5));
    var ceiling = readNumber(form.querySelector('#ceiling'), 3);

    var area = w * d;
    var totalH = Math.max(0.5, floors * ceiling);

    var areaEl = document.getElementById('floor-area-summary');
    var hEl = document.getElementById('building-height-summary');
    var heightInput = form.querySelector('#height');

    if (areaEl) {
      areaEl.textContent =
        'One floor covers ' +
        area.toLocaleString(undefined, { maximumFractionDigits: 2 }) +
        ' m² (width × depth: ' +
        w +
        ' m × ' +
        d +
        ' m).';
    }
    if (hEl) {
      hEl.textContent =
        'Total building height: ' +
        floors +
        ' floors × ' +
        ceiling +
        ' m per floor = ' +
        totalH.toLocaleString(undefined, { maximumFractionDigits: 2 }) +
        ' m.';
    }
    if (heightInput) {
      heightInput.value = String(totalH.toFixed(2));
    }
  }

  /**
   * Reads current numeric inputs into a plain object consumed by BuildingGenerator.
   * @returns {object|null}
   */
  function readBuildingSpecFromForm() {
    var form = getForm();
    if (!form) return null;

    var width = readNumber(form.querySelector('#width'), 20);
    var depth = readNumber(form.querySelector('#depth'), 20);
    var floors = Math.round(readNumber(form.querySelector('#floors'), 5));
    var ceiling = readNumber(form.querySelector('#ceiling'), 3);
    var height = Math.max(0.5, floors * ceiling);
    var apartments = Math.round(readNumber(form.querySelector('#apartments'), 1));
    var bedrooms = Math.round(readNumber(form.querySelector('#bedrooms'), 2));
    var kitchens = Math.round(readNumber(form.querySelector('#kitchens'), 1));
    var bathrooms = Math.round(readNumber(form.querySelector('#bathrooms'), 1));
    var hallways = Math.round(readNumber(form.querySelector('#hallways'), 1));
    var facadeColor = readHexColor(form.querySelector('#facadeColor'), '#64748b');

    return {
      width: width,
      depth: depth,
      height: height,
      floors: floors,
      ceiling: ceiling,
      apartments: apartments,
      facadeColor: facadeColor,
      apartment: {
        bedrooms: bedrooms,
        kitchens: kitchens,
        bathrooms: bathrooms,
        hallways: hallways,
      },
    };
  }

  /**
   * @param {ReturnType<typeof readBuildingSpecFromForm>} spec
   * @returns {string|null} error message or null if OK
   */
  function validateSpec(spec) {
    if (!spec) return 'Missing form.';
    if (!(spec.width > 0.15)) return 'Floor width must be greater than 0.15 m.';
    if (!(spec.depth > 0.15)) return 'Floor depth must be greater than 0.15 m.';
    if (!(spec.height > 0.2)) return 'Total height must be greater than 0.2 m.';
    if (!(spec.floors >= 1)) return 'Floors must be at least 1.';
    if (!(spec.apartments >= 1)) return 'Apartments must be at least 1.';
    if (!/^#[0-9a-fA-F]{6}$/.test(spec.facadeColor || '')) return 'Choose a valid building color.';
    var floorsN = Math.max(1, spec.floors);
    var ceil =
      typeof spec.ceiling === 'number' && isFinite(spec.ceiling)
        ? spec.ceiling
        : spec.height / floorsN;
    if (!(ceil >= 2)) return 'Ceiling height per floor should be at least 2 m (or lower the floor count).';
    if (!(ceil <= 30)) return 'Ceiling height per floor looks unrealistically high; use a value under 30 m.';
    var apt = spec.apartment;
    var hw = typeof apt.hallways === 'number' ? apt.hallways : 0;
    if (apt.bedrooms < 0 || apt.kitchens < 0 || apt.bathrooms < 0 || hw < 0) {
      return 'Room counts cannot be negative.';
    }
    if (apt.bedrooms + apt.kitchens + apt.bathrooms + hw < 1 && !spec.useFixedApartmentTemplate) {
      return 'Add at least one room or hallway so the floor-plan step has something to place.';
    }
    return null;
  }

  /**
   * @param {(spec: object) => void} onSubmitValid
   */
  function bindForm(onSubmitValid) {
    var form = getForm();
    if (!form) return;

    function onInput() {
      syncFootprintMath();
    }
    form.addEventListener('input', onInput);
    form.addEventListener('change', onInput);
    syncFootprintMath();

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      syncFootprintMath();
      var spec = readBuildingSpecFromForm();
      var err = validateSpec(spec);
      if (err) {
        setMessage(err);
        return;
      }
      setMessage('Saved — opening the camera…');
      onSubmitValid(spec);
    });
  }

  window.Ui = {
    bindForm: bindForm,
    setMessage: setMessage,
    readBuildingSpecFromForm: readBuildingSpecFromForm,
    validateSpec: validateSpec,
    syncFootprintMath: syncFootprintMath,
  };
})();
