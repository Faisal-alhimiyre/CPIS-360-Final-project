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

    var err = window.Ui.validateSpec(spec);
    if (err) {
      sessionStorage.removeItem(STORAGE_KEY);
      setArError(err);
      return;
    }

    var scenePre = document.getElementById('ar-scene');
    if (scenePre) {
      try {
        var q = new URLSearchParams(window.location.search);
        if (q.get('ardebug') === '1') {
          var arjs = scenePre.getAttribute('arjs') || '';
          scenePre.setAttribute('arjs', arjs.replace('debugUIEnabled: false', 'debugUIEnabled: true'));
        }
      } catch (e2) {}
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
        var trackHelp =
          ' Use good light, hold the marker flat, fill most of the screen. Add ?ardebug=1 to the URL for AR.js debug.';
        markerEl.addEventListener('markerFound', function () {
          hint.textContent =
            'Marker found — model locked in place. Tap the orange door to remove front layer + roof and inspect inside.';
          hint.style.color = '#15803d';
        });
        markerEl.addEventListener('markerLost', function () {
          hint.textContent = baseHint + trackHelp;
          hint.style.color = '';
        });
        hint.textContent = baseHint + trackHelp;
      }

      function wireVideoErrors() {
        var v = document.querySelector('#arjs-video');
        if (!v || v.dataset.cpisVideoErr === '1') return;
        v.dataset.cpisVideoErr = '1';
        v.addEventListener('error', function () {
          setArError('Camera video failed. Check permissions, HTTPS, and that no other app is using the camera.');
        });
      }
      wireVideoErrors();
      setTimeout(wireVideoErrors, 800);
      setTimeout(wireVideoErrors, 3000);

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
