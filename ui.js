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
   * @param {HTMLInputElement} input
   * @param {number} fallback
   * @returns {number}
   */
  function readNumber(input, fallback) {
    if (!input) return fallback;
    var v = parseFloat(input.value);
    return isFinite(v) ? v : fallback;
  }

  /**
   * Reads current numeric inputs into a plain object consumed by BuildingGenerator.
   * @returns {object|null}
   */
  function readBuildingSpecFromForm() {
    var form = getForm();
    if (!form) return null;

    var width = readNumber(form.querySelector('#width'), 2);
    var depth = readNumber(form.querySelector('#depth'), 1.5);
    var height = readNumber(form.querySelector('#height'), 2);
    var floors = Math.round(readNumber(form.querySelector('#floors'), 2));
    var apartments = Math.round(readNumber(form.querySelector('#apartments'), 2));
    var bedrooms = Math.round(readNumber(form.querySelector('#bedrooms'), 2));
    var kitchens = Math.round(readNumber(form.querySelector('#kitchens'), 1));
    var bathrooms = Math.round(readNumber(form.querySelector('#bathrooms'), 1));

    return {
      width: width,
      depth: depth,
      height: height,
      floors: floors,
      apartments: apartments,
      apartment: {
        bedrooms: bedrooms,
        kitchens: kitchens,
        bathrooms: bathrooms,
      },
    };
  }

  /**
   * @param {ReturnType<typeof readBuildingSpecFromForm>} spec
   * @returns {string|null} error message or null if OK
   */
  function validateSpec(spec) {
    if (!spec) return 'Missing form.';
    if (!(spec.width > 0.15)) return 'Width must be greater than 0.15 m.';
    if (!(spec.depth > 0.15)) return 'Depth must be greater than 0.15 m.';
    if (!(spec.height > 0.2)) return 'Height must be greater than 0.2 m.';
    if (!(spec.floors >= 1)) return 'Floors must be at least 1.';
    if (!(spec.apartments >= 1)) return 'Apartments must be at least 1.';
    if (spec.apartment.bedrooms < 0 || spec.apartment.kitchens < 0 || spec.apartment.bathrooms < 0) {
      return 'Room counts cannot be negative.';
    }
    return null;
  }

  /**
   * @param {(spec: object) => void} onSubmitValid
   */
  function bindForm(onSubmitValid) {
    var form = getForm();
    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var spec = readBuildingSpecFromForm();
      var err = validateSpec(spec);
      if (err) {
        setMessage(err);
        return;
      }
      setMessage('Model ready — point at the HIRO marker. Tip: keep the marker flat and well lit.');
      onSubmitValid(spec);
    });

    var btnHide = document.getElementById('btn-toggle-ui');
    var uiLayer = document.getElementById('ui-layer');
    if (btnHide && uiLayer) {
      btnHide.addEventListener('click', function () {
        var hidden = uiLayer.classList.toggle('hidden');
        document.body.classList.toggle('ui-fullscreen', hidden);
        btnHide.textContent = hidden ? 'Show form' : 'Hide form';
      });
    }
  }

  window.Ui = {
    bindForm: bindForm,
    setMessage: setMessage,
    readBuildingSpecFromForm: readBuildingSpecFromForm,
    validateSpec: validateSpec,
  };
})();
