/**
 * ar-page.js
 * ----------
 * ar.html only: load spec, wait for A-Frame scene loaded, then build geometry + interactions.
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
      window.location.replace('index.html?v=markerfix-14');
      return;
    }

    var spec;
    try {
      spec = JSON.parse(raw);
    } catch (e) {
      sessionStorage.removeItem(STORAGE_KEY);
      window.location.replace('index.html?v=markerfix-14');
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
        setArError('Could not open AR scene.');
        return;
      }

      var scene = document.getElementById('ar-scene');
      if (!scene) {
        setArError('Scene missing.');
        return;
      }

      function build() {
        var buildErr = window.AppCore.rebuildFromSpec(spec);
        if (buildErr) {
          setArError(buildErr);
          return;
        }
        setArError('');
      }

      if (scene.hasLoaded) {
        build();
      } else {
        scene.addEventListener('loaded', function once() {
          scene.removeEventListener('loaded', once);
          build();
        });
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
