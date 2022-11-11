import { Buildings } from './models/Buildings.js';

import * as THREE from '../../js/three/build/three.module.js';

const apiKey = 'wSVUkjoWKTD8fUSyzJd5';

const longitude = 4.898925241368147,
  latitude = 52.37334858407121;

let styles = {
  day: './styles/maptiler3d.json',
  night: './styles/dark.json',
};
let selectedStyle = styles.night;

const map = (window.map = new maplibregl.Map({
  container: 'map',
  style: selectedStyle,
  center: [longitude, latitude],
  zoom: 15,
  pitch: 0,
  bearing: 0,
  antialias: true,
}));

// map.addControl(new maplibregl.NavigationControl());

/**
 * Debug
 */

const parameters = {
  animate: false,
  // materialColor: '#409ebf',
  materialColor: '#ef2929',
  materialOpacity: 1,
  materialAmbientTerm: 1,
  materialSpecularTerm: 0,
  materialShininess: 2.8,

  lightColor: '#e3e0df',
  ambientTerm: 0.3,
  specularTerm: 1,
  lightPosition: {
    x: 3900,
    y: 20000,
    z: 600,
  },
  lightDirection: {
    x: 930,
    y: 6300,
    z: 15000,
  },
  lightCutOff: 0.95,
  // lightDirection: {
  //   x: 1,
  //   y: -0.5,
  //   z: 0.3,
  // },
  wireframe: false,
  lightSource: false,
  fixedLight: false,
  uTime: null,
  date: new Date(),
  initialTime: null,
  directionalLight: new THREE.DirectionalLight(0xffffff, 0.5),
  spherePosition: -2,
  dxSphere: 0.01,
  frequency: 5,
  elapsedTime: null,
  longitude: longitude,
  latitude: latitude,

  preWave: 200.1,
  hWave: 300,
  postWave: 400.1,
  opacity: 1,

  center: {
    meters: maplibregl.MercatorCoordinate.fromLngLat([longitude, latitude], 0),
  },
  zoom: map.getZoom(),

  resolution: [window.innerWidth / 2, window.innerHeight / 2],
};

// The 'building' layer in the streets vector source contains building-height
// data from OpenStreetMap.
map.on('load', function () {
  // Insert the layer beneath any symbol layer.
  const layers = map.getStyle().layers;
  const labelLayerId = layers.find(
    (layer) => layer.type === 'symbol' && layer.layout['text-field']
  ).id;

  if (map.getLayer('building-3d')) {
    map.removeLayer('building-3d');
  }

  if (map.getSource('openmaptiles')) {
    map.addLayer(
      {
        id: 'building-3d',
        type: 'fill-extrusion',
        source: 'openmaptiles',
        'source-layer': 'building',
        filter: ['all', ['!has', 'hide_3d']],
        paint: {
          'fill-extrusion-base': {
            property: 'render_min_height',
            type: 'identity',
          },
          'fill-extrusion-color': [
            'case',
            ['has', 'colour'],
            ['get', 'colour'],
            'hsl(39, 41%, 86%)',
          ],
          'fill-extrusion-height': {
            property: 'render_height',
            type: 'identity',
          },
          'fill-extrusion-opacity': 0.0,
        },
      },
      labelLayerId
    );

    map.addLayer(
      new Buildings(
        'building-apartments',
        'building-3d-apartments',
        1,
        parameters
      ),
      'building-3d-apartments'
    );

    map.addLayer(
      new Buildings('building-offices', 'building-3d-offices', 2, parameters),
      'building-3d-apartments'
    );

    // Start the animation.
    animate(0);

    parameters.initialTime = new Date().getTime();
    // setInterval(onFrame, parameters.frequency / 1000);

    map.easeTo({
      zoom: 18,
      pitch: 75,
      bearing: -20,
      duration: 14000,
      delay: 0,
    });

    class searchControl {
      onAdd(map) {
        this._map = map;
        this._container = document.createElement('div');
        this._container.className = 'maplibregl-ctrl';
        const _input = document.createElement('input');
        this._container.appendChild(_input);
        const geocoder = new maptiler.Geocoder({
          input: _input,
          key: apiKey,
        });
        geocoder.on('select', function (item) {
          map.fitBounds(item.bbox);
        });
        return this._container;
      }

      onRemove() {
        this._container.parentNode.removeChild(this._container);
        this._map = undefined;
      }
    }
    // map.addControl(new searchControl(), 'top-right');
  }
});

// Time
let time = Date.now();

function onFrame() {
  parameters.elapsedTime = new Date().getTime() - parameters.initialTime;
  if (parameters.elapsedTime < parameters.frequency) return;

  let steps = Math.floor(parameters.elapsedTime / parameters.frequency);
  while (steps > 0) {
    animate();
    steps -= 1;
  }

  parameters.initialTime = new Date().getTime();
}

function animate(timestamp) {
  parameters.uTime = timestamp;

  // // clamp the rotation between 0 -360 degrees
  // // Divide timestamp by 100 to slow rotation to ~10 degrees / sec
  // map.rotateTo((timestamp / 300) % 360, { duration: 0 });

  // Request the next frame of the animation.
  requestAnimationFrame(animate);
}

let popup;
let buildingId = 200;

function showInfo(event) {
  map.getCanvas().style.cursor = 'pointer';

  let feature = event.features[0];

  if (popup) popup.remove();

  if (feature.id) {
    // Set constants equal to the current feature's magnitude, location, and time
    const properties = feature.properties.render_height;

    // Check whether features exist
    if (event.features.length === 0) return;

    // If buildingId for the hovered feature is not null,
    // use removeFeatureState to reset to the default behavior
    if (buildingId) {
      map.removeFeatureState({
        source: 'openmaptiles',
        sourceLayer: 'building',
        id: buildingId,
      });
    }

    const geometry = feature.geometry;
    const centroid = turf.centroid(geometry);

    // let center = [];
    // let coords = tb.getFeatureCenter(feature, null, 0);
    // center.push([coords[0], coords[1]]);

    popup = new maplibregl.Popup({ offset: 0 })
      .setLngLat(centroid.geometry.coordinates)
      // .setLngLat(center[0].slice())

      .setHTML(
        `<strong>${
          feature.properties.name_int || feature.properties.name_int || ''
        } </strong></br>
        ${feature.properties.class}
        `
      )
      .addTo(map);

    buildingId = feature.id;

    // When the mouse moves over the earthquakes-viz layer, update the
    // feature state for the feature under the mouse
    map.setFeatureState(
      {
        source: 'openmaptiles',
        sourceLayer: 'building',
        id: buildingId,
      },
      {
        hover: true,
      }
    );
  }
}

map.on('click', 'poi_z16', (event) => showInfo(event));
map.on('mouseover', 'poi_z16', (event) => {
  document.body.classList.add('grabbable');
});
map.on('mouseout', 'poi_z16', (event) => {
  document.body.classList.remove('grabbable');
});
