/**
 * ar-page.js
 * ----------
 * Inject building geometry once the AR webcam element is ready.
 * Avoid extra timers that dispatch resize and fight AR.js (flash then black).
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

      var hint = document.getElementById('ar-tracking-hint');
      var markerEl = document.getElementById('hiro-marker');
      if (markerEl && hint) {
        var baseHint = hint.textContent;
        markerEl.addEventListener('markerFound', function () {
          hint.textContent =
            'HIRO seen — model on marker. Tap door or front wall for glass façades; ⟲ ⟳ spins the building.';
          hint.style.color = '#15803d';
        });
        markerEl.addEventListener('markerLost', function () {
          hint.textContent = baseHint;
          hint.style.color = '';
        });
      }

      var built = false;
      function tryBuild() {
        if (built) return;
        built = true;
        var buildErr = window.AppCore.rebuildFromSpec(spec);
        if (buildErr) {
          setArError(buildErr);
          return;
        }
        setArError('');
      }

      window.addEventListener(
        'arjs-video-loaded',
        function onVideo() {
          window.removeEventListener('arjs-video-loaded', onVideo);
          setTimeout(tryBuild, 400);
        },
        { once: true }
      );

      var pollId = setInterval(function () {
        var v = document.querySelector('#arjs-video');
        if (v && v.srcObject && v.readyState >= 2) {
          clearInterval(pollId);
          setTimeout(tryBuild, 400);
        }
      }, 120);
      setTimeout(function () {
        clearInterval(pollId);
      }, 12000);

      setTimeout(function () {
        if (!built) tryBuild();
      }, 10000);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
