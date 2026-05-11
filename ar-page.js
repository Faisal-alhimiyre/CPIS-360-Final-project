/**
 * ar-page.js
 * ----------
 * ar.html only: load spec from sessionStorage, start AR, build the model.
 */

(function () {
  'use strict';

  var STORAGE_KEY = 'cpis360BuildingSpec';

  function setArError(msg) {
    var el = document.getElementById('ar-page-error');
    if (el) el.textContent = msg || '';
  }

  function start() {
    var raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      window.location.replace('index.html?v=markerfix-11');
      return;
    }

    var spec;
    try {
      spec = JSON.parse(raw);
    } catch (e) {
      sessionStorage.removeItem(STORAGE_KEY);
      window.location.replace('index.html?v=markerfix-11');
      return;
    }

    var err = window.Ui.validateSpec(spec);
    if (err) {
      sessionStorage.removeItem(STORAGE_KEY);
      setArError(err);
      return;
    }

    window.ArScene.mountSceneIfNeeded(function (mountErr) {
      if (mountErr) {
        console.error(mountErr);
        setArError('Could not start the camera. Check permissions and try again.');
        return;
      }
      var buildErr = window.AppCore.rebuildFromSpec(spec);
      if (buildErr) {
        setArError(buildErr);
        return;
      }
      setArError('');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
