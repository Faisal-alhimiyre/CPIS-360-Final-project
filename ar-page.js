/**
 * ar-page.js
 * ----------
 * ar.html: wait until the AR webcam pipeline is up BEFORE injecting lots of geometry.
 * Building immediately on a-scene "loaded" caused a visible flash then a black screen.
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
      window.location.replace('index.html?v=markerfix-20');
      return;
    }

    var spec;
    try {
      spec = JSON.parse(raw);
    } catch (e) {
      sessionStorage.removeItem(STORAGE_KEY);
      window.location.replace('index.html?v=markerfix-20');
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
            'HIRO seen — building should sit on the marker. Tap the door for a transparent front wall.';
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
        window.dispatchEvent(new Event('resize'));
      }

      // Best: AR.js fires this when #arjs-video exists and the stream is attached.
      window.addEventListener(
        'arjs-video-loaded',
        function onVideo() {
          window.removeEventListener('arjs-video-loaded', onVideo);
          setTimeout(tryBuild, 300);
        },
        { once: true }
      );

      // If the event already fired before we subscribed, poll for the video element.
      var pollId = setInterval(function () {
        var v = document.querySelector('#arjs-video');
        if (v && v.srcObject && v.readyState >= 2) {
          clearInterval(pollId);
          setTimeout(tryBuild, 300);
        }
      }, 100);
      setTimeout(function () {
        clearInterval(pollId);
      }, 8000);

      // A-Frame scene graph is ready (may still be before webcam is fully wired).
      function afterSceneLoaded() {
        setTimeout(tryBuild, 1400);
      }
      if (scene.hasLoaded) {
        afterSceneLoaded();
      } else {
        scene.addEventListener(
          'loaded',
          function once() {
            scene.removeEventListener('loaded', once);
            afterSceneLoaded();
          },
          { once: true }
        );
      }

      // Last resort if neither path fired (very slow devices).
      setTimeout(tryBuild, 4000);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
