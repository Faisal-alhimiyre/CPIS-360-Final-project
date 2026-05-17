/**
 * form-app.js
 * -----------
 * index.html only: valid submit → save spec → 3D viewer (cutaway apartment).
 */

(function () {
  'use strict';

  var STORAGE_KEY = 'cpis360BuildingSpec';

  function start() {
    window.Ui.bindForm(function (spec) {
      try {
        spec.useFixedApartmentTemplate = true;
        spec.previewCutaway = true;
        spec.apartments = Math.max(2, spec.apartments || 2);
        spec.floors = Math.max(2, spec.floors || 2);
        delete spec.apartmentLayout;
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(spec));
      } catch (e) {
        window.Ui.setMessage('Could not save your inputs. Allow site storage or try another browser.');
        return;
      }
      window.location.href = 'viewer.html?v=preview-1&c=' + String(Date.now());
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
