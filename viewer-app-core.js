/**
 * viewer-app-core.js
 * ------------------
 * building → floor (x-ray) → apartment (room layout).
 */

(function () {
  'use strict';

  var savedSpec = null;
  var state = { mode: 'building', floorIndex: null, aptIndex: null };

  function setHint(text) {
    var el = document.getElementById('viewer-hint');
    if (el) el.textContent = text;
  }

  function setBackButton() {
    var btn = document.getElementById('btn-back-building');
    if (!btn) return;
    if (state.mode === 'building') {
      btn.style.display = 'none';
    } else {
      btn.style.display = 'inline-block';
      btn.textContent = state.mode === 'floor' ? '← Building' : '← Floor layout';
    }
  }

  function afterRebuild(mount) {
    if (window.ViewerCamera && mount) {
      var mode = state.mode;
      requestAnimationFrame(function () {
        window.ViewerCamera.focusOnMount(mount, mode);
        setTimeout(function () {
          window.ViewerCamera.focusOnMount(mount, mode);
        }, 120);
      });
    }
  }

  function rebuild() {
    var mount = document.getElementById('building-mount');
    if (!mount || !savedSpec) return 'Scene not ready.';
    mount.setAttribute('position', '0 0 0');

    var perFloorH = savedSpec.height / clampMin(savedSpec.floors, 1);
    var buildSpec = Object.assign({}, savedSpec, {
      useFixedApartmentTemplate: true,
      previewCutaway: true,
      apartments: Math.max(2, savedSpec.apartments || 2),
      floors: 1,
      height: perFloorH,
    });
    delete buildSpec.apartmentLayout;

    buildSpec.viewerMode = state.mode;
    if (state.mode === 'apartment' && state.aptIndex != null) {
      buildSpec.selectedApartmentIndex = state.aptIndex;
    } else {
      delete buildSpec.selectedApartmentIndex;
    }
    if (state.mode === 'floor' && state.floorIndex != null) {
      buildSpec.selectedFloorIndex = state.floorIndex;
    } else {
      delete buildSpec.selectedFloorIndex;
    }

    window.BuildingGenerator.generateBuilding(mount, buildSpec);

    if (window.RoomRelocate) {
      if (state.mode === 'apartment') {
        window.RoomRelocate.attach(mount);
      } else {
        window.RoomRelocate.detach();
      }
    }

    if (window.ViewerNavigation) {
      window.ViewerNavigation.detach();
      if (state.mode === 'building') {
        window.ViewerNavigation.attachFloorPick(mount, function (fi) {
          showFloor(fi);
        });
      } else if (state.mode === 'floor') {
        window.ViewerNavigation.attachAptPick(mount, function (ai) {
          showApartment(ai);
        });
      }
    }

    if (state.mode === 'building') {
      setHint('Tap 1st/2nd floor below · use ⟲ ⟳ + − to spin and zoom');
    } else if (state.mode === 'floor') {
      setHint(
        'Floor ' +
          (state.floorIndex + 1) +
          ' — tap Apartment 1 or 2 · use ⟲ ⟳ + − on the right'
      );
    } else {
      setHint(
        'Apt ' +
          (state.aptIndex + 1) +
          ' — tap room then floor to move · ⟲ ⟳ + − to spin/zoom'
      );
    }
    setBackButton();
    if (window.ViewerOverlay) {
      window.ViewerOverlay.update(state);
    }
    afterRebuild(mount);
    return null;
  }

  function clampMin(n, min) {
    return n < min ? min : n;
  }

  function showBuilding() {
    state.mode = 'building';
    state.floorIndex = null;
    state.aptIndex = null;
    return rebuild();
  }

  function showFloor(index) {
    state.mode = 'floor';
    state.floorIndex = index;
    state.aptIndex = null;
    return rebuild();
  }

  function showApartment(index) {
    state.mode = 'apartment';
    state.aptIndex = index;
    return rebuild();
  }

  function goBack() {
    if (state.mode === 'apartment') {
      return showFloor(state.floorIndex != null ? state.floorIndex : 0);
    }
    if (state.mode === 'floor') {
      return showBuilding();
    }
    return null;
  }

  function initFromSpec(spec) {
    savedSpec = spec;
    return showBuilding();
  }

  window.ViewerAppCore = {
    initFromSpec: initFromSpec,
    showBuilding: showBuilding,
    showFloor: showFloor,
    showApartment: showApartment,
    goBack: goBack,
    getState: function () {
      return {
        mode: state.mode,
        floorIndex: state.floorIndex,
        aptIndex: state.aptIndex,
      };
    },
  };
})();
