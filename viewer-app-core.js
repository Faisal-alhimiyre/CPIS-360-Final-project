/**
 * viewer-app-core.js
 * ------------------
 * Building block (2 apts + hall + stairs) ↔ single-apartment cutaway layout.
 */

(function () {
  'use strict';

  var savedSpec = null;
  var state = { mode: 'building', aptIndex: null };

  function setHint(text) {
    var el = document.getElementById('viewer-hint');
    if (el) el.textContent = text;
  }

  function setBackVisible(show) {
    var btn = document.getElementById('btn-back-building');
    if (btn) btn.style.display = show ? 'inline-block' : 'none';
  }

  function rebuild() {
    var mount = document.getElementById('building-mount');
    if (!mount || !savedSpec) return 'Scene not ready.';

    var buildSpec = Object.assign({}, savedSpec, {
      useFixedApartmentTemplate: true,
      previewCutaway: true,
      apartments: Math.max(2, clampMin(savedSpec.apartments, 1)),
    });
    delete buildSpec.apartmentLayout;

    if (state.mode === 'apartment' && state.aptIndex != null) {
      buildSpec.viewerMode = 'apartment';
      buildSpec.selectedApartmentIndex = state.aptIndex;
    } else {
      buildSpec.viewerMode = 'building';
      delete buildSpec.selectedApartmentIndex;
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
      window.ViewerNavigation.detachBuildingPick();
      if (state.mode === 'building') {
        window.ViewerNavigation.attachBuildingPick(mount, function (idx) {
          showApartment(idx);
        });
      }
    }

    if (state.mode === 'building') {
      setHint('Drag to spin 360° · scroll/pinch zoom · tap Apartment 1 or 2 to open its layout');
      setBackVisible(false);
    } else {
      setHint(
        'Apartment ' +
          (state.aptIndex + 1) +
          ' — drag for 360° view · tap a room, then the floor to move it'
      );
      setBackVisible(true);
    }

    return null;
  }

  function clampMin(n, min) {
    return n < min ? min : n;
  }

  function showBuilding() {
    state.mode = 'building';
    state.aptIndex = null;
    return rebuild();
  }

  function showApartment(index) {
    state.mode = 'apartment';
    state.aptIndex = index;
    return rebuild();
  }

  function initFromSpec(spec) {
    savedSpec = spec;
    state.mode = 'building';
    state.aptIndex = null;
    return showBuilding();
  }

  window.ViewerAppCore = {
    initFromSpec: initFromSpec,
    showBuilding: showBuilding,
    showApartment: showApartment,
    getState: function () {
      return { mode: state.mode, aptIndex: state.aptIndex };
    },
  };
})();
