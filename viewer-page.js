/**
 * viewer-page.js
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

    spec.apartments = Math.max(2, spec.apartments || 2);
    if (spec.floors < 2) spec.floors = 2;

    var backBtn = document.getElementById('btn-back-building');
    if (backBtn) {
      backBtn.addEventListener('click', function () {
        if (window.ViewerAppCore) {
          window.ViewerAppCore.goBack();
          setError('');
        }
      });
    }

    if (window.ViewerOverlay) {
      window.ViewerOverlay.bind({
        onFloor: function (fi) {
          if (window.ViewerAppCore) window.ViewerAppCore.showFloor(fi);
        },
        onApt: function (ai) {
          if (window.ViewerAppCore) window.ViewerAppCore.showApartment(ai);
        },
      });
    }

    var scene = document.getElementById('viewer-scene');
    if (!scene) {
      setError('Scene missing.');
      return;
    }

    function build() {
      if (!window.BuildingGenerator) {
        setError('3D generator failed to load. Hard-refresh the page.');
        return;
      }
      if (!window.ViewerAppCore) {
        setError('Viewer failed to load. Hard-refresh the page.');
        return;
      }
      var buildErr = window.ViewerAppCore.initFromSpec(spec);
      if (buildErr) setError(buildErr);
      else setError('');
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
