import * as dat from '../../js/libs/lil-gui.module.min.js';

import { Truck } from './models/Truck.js';

const nowDate = new Date(2022, 11, 10, 16);

if (!config)
  console.error(
    "Config not set! Make a copy of 'config_template.js', add in your access token, and save the file as 'config.js'."
  );
const latitude = 35.0725,
  longitude = -106.6517;

mapboxgl.accessToken = config.accessToken;

let minZoom = 12;
let mapConfig = {
  map: {
    center: [longitude, latitude],
    pitch: 20,
    bearing: 0,
    zoom: 12,
  },

  //  "Breaking Bad RV" (https://skfb.ly/orPKX) by HugoLandin is licensed under Creative Commons Attribution (http://creativecommons.org/licenses/by/4.0/).
  truck: {
    origin: [longitude, latitude, 0],
    type: 'gltf',
    model: './assets/models/breaking_bad_rv/scene',
    rotation: { x: 90, y: 0, z: 0 },
    scale: 400,
    startRotation: { x: 0, y: 0, z: -9 },
    date: nowDate,
  },
  names: {
    compositeSource: 'composite',
    compositeSourceLayer: 'building',
    compositeLayer: '3d-buildings',
  },
};

let api = {
  buildings: true,
  acceleration: 40,
  inertia: 3,
};

let map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/dark-v10',
  // style: 'mapbox://styles/mapbox/light-v10',
  zoom: mapConfig.map.zoom,
  center: mapConfig.map.center,
  pitch: mapConfig.map.pitch,
  bearing: mapConfig.map.bearing,
  antialias: true, // create the gl context with MSAA antialiasing, so custom layers are antialiased
});

window.tb = new Threebox(map, map.getCanvas().getContext('webgl'), {
  realSunlight: false,
  enableSelectingObjects: true,
  enableDraggingObjects: true,
  enableRotatingObjects: true,
  enableTooltips: true,
});

tb.setSunlight(nowDate, map.getCenter());

/**
 * Debug
 */
const gui = new dat.GUI({ closed: true });

gui.hide();

map.on('style.load', function () {
  let l = mapConfig.names.compositeLayer;
  if (api.buildings) {
    if (!map.getLayer(l)) {
      map.addLayer(createCompositeLayer(l));
    }
  }

  map.addLayer(
    new Truck(tb, map, '3d-model', mapConfig, gui, api),
    '3d-buildings'
  );

  // Add fog
  map.setFog({
    range: [2, 20],
    'horizon-blend': 0.03,
    color: '#242B4B',
    'high-color': '#add8e6',
    'space-color': '#0B1026',
    'star-intensity': 0.8,
  });

  map.getCanvas().focus();

  map.easeTo({
    pitch: 71,
    bearing: 10,
    zoom: 16,
    duration: 6000,
    delay: 0,
  });

  const truckLabel = document.querySelector('#labelCanvas');
  console.log(truckLabel);

  gsap.to(truckLabel, {
    delay: 0,
    duration: 20,
    display: 'none',
    ease: 'linear',

    onUpdate: () => {},
    onStart: () => {},
    onComplete: () => {},
  });
});

function createCompositeLayer(layerId) {
  let layer = {
    id: layerId,
    source: mapConfig.names.compositeSource,
    'source-layer': mapConfig.names.compositeSourceLayer,
    filter: ['==', 'extrude', 'true'],
    type: 'fill-extrusion',
    minzoom: minZoom,
    paint: {
      'fill-extrusion-color': [
        'case',
        ['boolean', ['feature-state', 'select'], false],
        'red',
        ['boolean', ['feature-state', 'hover'], false],
        'lightblue',
        '#aaa',
      ],

      // use an 'interpolate' expression to add a smooth transition effect to the
      // buildings as the user zooms in
      'fill-extrusion-height': [
        'interpolate',
        ['linear'],
        ['zoom'],
        minZoom,
        0,
        minZoom + 0.05,
        ['get', 'height'],
      ],
      'fill-extrusion-base': [
        'interpolate',
        ['linear'],
        ['zoom'],
        minZoom,
        0,
        minZoom + 0.05,
        ['get', 'min_height'],
      ],
      'fill-extrusion-opacity': 0.9,
    },
  };
  return layer;
}
