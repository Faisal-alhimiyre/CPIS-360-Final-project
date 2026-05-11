/**
 * form-app.js
 * -----------
 * index.html only: valid submit → save spec → open dedicated camera page.
 */

(function () {
  'use strict';

  var STORAGE_KEY = 'cpis360BuildingSpec';

  function start() {
    window.Ui.bindForm(function (spec) {
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(spec));
      } catch (e) {
        window.Ui.setMessage('Could not save your inputs. Allow site storage or try another browser.');
        return;
      }
      window.location.href = 'ar.html?v=markerfix-22&c=' + String(Date.now());
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
