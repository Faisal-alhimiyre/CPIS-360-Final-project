/**
 * ar-scene.js
 * -----------
 * Mounts the <a-scene> from the HTML template once the user taps Generate.
 * Patches AR.js webcam sizing for split layouts (see patchArSourceForEmbeddedPanel).
 */

(function () {
  'use strict';

  function whenSceneReady(sceneId, callback) {
    var scene = document.getElementById(sceneId);
    if (!scene) {
      console.error('AR scene not found:', sceneId);
      return;
    }
    if (scene.hasLoaded) {
      callback();
      return;
    }
    scene.addEventListener('loaded', function onLoaded() {
      scene.removeEventListener('loaded', onLoaded);
      callback();
    });
  }

  function getArHandles() {
    var scene = document.getElementById('ar-scene');
    var marker = document.getElementById('hiro-marker');
    var buildingRoot = document.getElementById('building-root');
    if (!scene || !marker || !buildingRoot) return null;
    return { scene: scene, marker: marker, buildingRoot: buildingRoot };
  }

  function arContainerBox() {
    var box = document.getElementById('ar-container');
    if (!box) return { w: window.innerWidth, h: window.innerHeight };
    return {
      w: Math.max(2, box.clientWidth),
      h: Math.max(2, box.clientHeight),
    };
  }

  /**
   * AR.js sizes the webcam + processing canvas from window.innerWidth/Height and copies
   * sizes to document.body (see aframe system-arjs + threex/arjs-source). That breaks a
   * split UI where the scene lives in #ar-container only → black panel. We patch the
   * live ArToolkitSource after the video is ready.
   */
  function patchArSourceForEmbeddedPanel(arSource) {
    if (!arSource || arSource.__cpisEmbeddedPatch) return;
    arSource.__cpisEmbeddedPatch = true;

    arSource.onResizeElement = function () {
      var b = arContainerBox();
      var screenWidth = b.w;
      var screenHeight = b.h;
      var sourceWidth;
      var sourceHeight;
      if (this.domElement.nodeName === 'IMG') {
        sourceWidth = this.domElement.naturalWidth;
        sourceHeight = this.domElement.naturalHeight;
      } else if (this.domElement.nodeName === 'VIDEO') {
        sourceWidth = this.domElement.videoWidth;
        sourceHeight = this.domElement.videoHeight;
        if (!sourceWidth || !sourceHeight) {
          sourceWidth = this.domElement.clientWidth || 640;
          sourceHeight = this.domElement.clientHeight || 480;
        }
      } else {
        return;
      }
      if (!sourceWidth || !sourceHeight) return;
      var sourceAspect = sourceWidth / sourceHeight;
      var screenAspect = screenWidth / screenHeight;
      if (screenAspect < sourceAspect) {
        var newWidth = sourceAspect * screenHeight;
        this.domElement.style.width = newWidth + 'px';
        this.domElement.style.marginLeft = -(newWidth - screenWidth) / 2 + 'px';
        this.domElement.style.height = screenHeight + 'px';
        this.domElement.style.marginTop = '0px';
      } else {
        var newHeight = 1 / (sourceAspect / screenWidth);
        this.domElement.style.height = newHeight + 'px';
        this.domElement.style.marginTop = -(newHeight - screenHeight) / 2 + 'px';
        this.domElement.style.width = screenWidth + 'px';
        this.domElement.style.marginLeft = '0px';
      }
    };

    arSource.copyElementSizeTo = function (otherElement) {
      var target = otherElement === document.body ? document.getElementById('ar-container') || otherElement : otherElement;
      var b = arContainerBox();
      var cw = b.w;
      var ch = b.h;
      var landscape = cw > ch;
      if (landscape) {
        target.style.width = this.domElement.style.width;
        target.style.height = this.domElement.style.height;
        target.style.marginLeft = this.domElement.style.marginLeft;
        target.style.marginTop = this.domElement.style.marginTop;
      } else {
        target.style.height = this.domElement.style.height;
        var hNum = parseInt(target.style.height, 10);
        if (!hNum || hNum < 1) hNum = ch;
        target.style.width = (hNum * 4) / 3 + 'px';
        var wNum = parseInt(target.style.width, 10);
        target.style.marginLeft = (cw - wNum) / 2 + 'px';
        target.style.marginTop = '0';
      }
    };
  }

  function forceArPipelineResize(scene) {
    try {
      var ar = scene.systems && scene.systems.arjs;
      if (!ar || !ar._arSession || !ar._arSession.arSource) return;
      var sess = ar._arSession;
      if (!sess.arContext || !scene.renderer || !scene.camera) return;
      sess.arSource.onResize(sess.arContext, scene.renderer, scene.camera);
    } catch (e) {
      /* AR context still booting */
    }
  }

  function bindVideoMetadataResize(scene, arSource) {
    var v = arSource.domElement;
    if (!v || v.nodeName !== 'VIDEO' || v.dataset.cpisMetaBound === '1') return;
    v.dataset.cpisMetaBound = '1';
    function kick() {
      forceArPipelineResize(scene);
      forceLayoutFromViewport();
    }
    v.addEventListener('loadedmetadata', kick);
  }

  function ensureEmbeddedArPatch(scene) {
    if (scene.dataset.cpisArPatch === '1') return;
    if (scene.dataset.cpisArPatchPending === '1') return;
    scene.dataset.cpisArPatchPending = '1';
    var tries = 0;
    var id = setInterval(function () {
      tries += 1;
      var ar = scene.systems && scene.systems.arjs;
      if (!ar || !ar._arSession || !ar._arSession.arSource) {
        if (tries > 100) {
          clearInterval(id);
          scene.dataset.cpisArPatchPending = '0';
        }
        return;
      }
      var src = ar._arSession.arSource;
      if (!src.ready && tries < 100) return;
      clearInterval(id);
      scene.dataset.cpisArPatchPending = '0';
      if (scene.dataset.cpisArPatch === '1') return;
      scene.dataset.cpisArPatch = '1';
      patchArSourceForEmbeddedPanel(src);
      bindVideoMetadataResize(scene, src);
      forceArPipelineResize(scene);
    }, 40);
  }

  function wireRenderstartSync(scene) {
    if (scene.dataset.cpisRenderstartWired === '1') return;
    scene.dataset.cpisRenderstartWired = '1';

    function kick() {
      ensureEmbeddedArPatch(scene);
      requestAnimationFrame(function () {
        forceLayoutFromViewport();
      });
    }

    if (scene.hasLoaded && scene.renderer) {
      kick();
      return;
    }
    scene.addEventListener(
      'renderstart',
      function onRs() {
        scene.removeEventListener('renderstart', onRs);
        kick();
      },
      { once: true }
    );
  }

  /**
   * Pin #ar-container + a-scene to the visual viewport in px. Embedded A-Frame + AR.js
   * otherwise sometimes resolve height:100% to a tiny strip when the chain is ambiguous.
   */
  function forceLayoutFromViewport() {
    var box = document.getElementById('ar-container');
    var scene = document.getElementById('ar-scene');
    if (!box || !scene) return;
    var w = Math.max(2, window.innerWidth);
    var h = Math.max(2, window.innerHeight);
    box.style.width = w + 'px';
    box.style.height = h + 'px';
    box.style.minHeight = h + 'px';
    scene.style.width = '100%';
    scene.style.height = h + 'px';
    scene.style.minHeight = h + 'px';
    syncArDisplayToContainer();
  }

  function bindArContainerResizeObserver() {
    var box = document.getElementById('ar-container');
    if (!box || box.dataset.cpisRo === '1' || typeof ResizeObserver === 'undefined') return;
    box.dataset.cpisRo = '1';
    var ro = new ResizeObserver(function () {
      forceLayoutFromViewport();
    });
    ro.observe(box);
  }

  /**
   * Push #ar-container size into arjs schema + trigger resize (still helps initial profile).
   */
  function syncArDisplayToContainer() {
    var scene = document.getElementById('ar-scene');
    var box = document.getElementById('ar-container');
    if (!scene || !box) return;
    var r = box.getBoundingClientRect();
    var w = Math.floor(Math.max(2, r.width));
    var h = Math.floor(Math.max(2, r.height));
    if (w < 8 || h < 8) return;
    scene.setAttribute(
      'arjs',
      'sourceType: webcam; trackingMethod: best; debugUIEnabled: false; displayWidth: ' +
        w +
        '; displayHeight: ' +
        h +
        '; canvasWidth: ' +
        w +
        '; canvasHeight: ' +
        h +
        ';'
    );
    window.dispatchEvent(new Event('resize'));
    forceArPipelineResize(scene);
  }

  var resizeTimer = null;
  function onWindowResize() {
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      forceLayoutFromViewport();
    }, 120);
  }

  /**
   * @param {(err: Error|null) => void} onReady
   */
  function mountSceneIfNeeded(onReady) {
    var scene = document.getElementById('ar-scene');
    if (scene) {
      wireRenderstartSync(scene);
      function fire() {
        try {
          ensureEmbeddedArPatch(scene);
          forceLayoutFromViewport();
          onReady(null);
        } catch (e) {
          onReady(e);
        }
      }
      if (scene.hasLoaded) fire();
      else {
        scene.addEventListener('loaded', function once() {
          scene.removeEventListener('loaded', once);
          fire();
        });
      }
      if (!document.body.dataset.arResizeBound) {
        document.body.dataset.arResizeBound = '1';
        window.addEventListener('resize', onWindowResize);
        window.addEventListener('orientationchange', onWindowResize);
      }
      bindArContainerResizeObserver();
      forceLayoutFromViewport();
      return;
    }

    var tpl = document.getElementById('ar-scene-template');
    var container = document.getElementById('ar-container');
    if (!tpl || !container) {
      onReady(new Error('Missing #ar-scene-template or #ar-container'));
      return;
    }

    var ph = document.getElementById('ar-placeholder');
    if (ph) ph.remove();

    container.appendChild(tpl.content.cloneNode(true));
    document.body.classList.add('ar-mounted');

    scene = document.getElementById('ar-scene');
    if (!scene) {
      onReady(new Error('Scene failed to mount'));
      return;
    }

    wireRenderstartSync(scene);

    function fire() {
      try {
        ensureEmbeddedArPatch(scene);
        forceLayoutFromViewport();
        setTimeout(forceLayoutFromViewport, 80);
        setTimeout(forceLayoutFromViewport, 350);
        setTimeout(forceLayoutFromViewport, 800);
        onReady(null);
      } catch (e) {
        onReady(e);
      }
    }
    if (scene.hasLoaded) fire();
    else {
      scene.addEventListener('loaded', function once() {
        scene.removeEventListener('loaded', once);
        fire();
      });
    }

    if (!document.body.dataset.arResizeBound) {
      document.body.dataset.arResizeBound = '1';
      window.addEventListener('resize', onWindowResize);
      window.addEventListener('orientationchange', onWindowResize);
    }

    bindArContainerResizeObserver();
    forceLayoutFromViewport();
  }

  window.ArScene = {
    whenSceneReady: whenSceneReady,
    getArHandles: getArHandles,
    mountSceneIfNeeded: mountSceneIfNeeded,
    syncArDisplayToContainer: syncArDisplayToContainer,
    forceLayoutFromViewport: forceLayoutFromViewport,
  };
})();
