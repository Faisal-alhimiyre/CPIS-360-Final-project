/**
 * viewer-page.js
 * --------------
 * Load form spec and show 3D cutaway on grey background.
 */

(function () {
  'use strict';

  var STORAGE_KEY = 'cpis360BuildingSpec';

  function setError(msg) {
    var el = document.getElementById('viewer-error');
    if (el) el.textContent = msg || '';
  }

  function start() {
    var raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      window.location.replace('index.html?v=realestate-3');
      return;
    }

    var spec;
    try {
      spec = JSON.parse(raw);
    } catch (e) {
      sessionStorage.removeItem(STORAGE_KEY);
      window.location.replace('index.html?v=realestate-3');
      return;
    }

    if (window.Ui) {
      var err = window.Ui.validateSpec(spec);
      if (err) {
        setError(err);
        return;
      }
    }

    var scene = document.getElementById('viewer-scene');
    if (!scene) {
      setError('Scene missing.');
      return;
    }

    function build() {
      var buildErr = window.ViewerAppCore.rebuildFromSpec(spec);
      if (buildErr) {
        setError(buildErr);
        return;
      }
      setError('');
    }

    if (scene.hasLoaded) {
      build();
    } else {
      scene.addEventListener('loaded', build, { once: true });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
