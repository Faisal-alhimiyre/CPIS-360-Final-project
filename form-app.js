/**
 * form-app.js
 * -----------
 * index.html only: valid submit → save spec → layout.html → user opens AR from there.
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
      window.location.href = 'layout.html?v=realestate-2';
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
