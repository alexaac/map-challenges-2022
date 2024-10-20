import * as THREE from '../../js/three/build/three.module.js';
import { ObjectControls } from '../../js/three/ObjectControls.js';
import { OrbitControls } from '../../js/three/OrbitControls.js';

import {
  CSS2DRenderer,
  CSS2DObject,
} from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/renderers/CSS2DRenderer.js';

import { getData, formatData } from './helpers.js';

import quakeVertexShader from './shaders/quake/vertex.js';
import quakeFragmentShader from './shaders/quake/fragment.js';

/** Constants */
const isMobile = window.innerWidth < 703;
const shiftRightPercent = isMobile ? 0 : 0.4;
const shiftBottomPercent = isMobile ? 0.2 : 0.1;
const cameraZoom = isMobile ? 30 : 18;
const globeRadius = 5.5;
let markerCount = 2000000;

const sections = document.querySelectorAll('.content--fixedPageContent');
gsap.to(sections[0], {
  opacity: 1,
  visibility: 'visible',
  ease: 'power2.inOut',
});

/**
 * Loaders
 */

/**
 * Textures
 */
const loadingManager = new THREE.LoadingManager();

loadingManager.onStart = () => {
  console.log('onStart');
};
loadingManager.onLoaded = () => {
  console.log('onLoaded');
};
loadingManager.onProgress = () => {
  console.log('onProgress');
};
loadingManager.onError = (err) => {
  console.error('onError: ', err);
};

const textureLoader = new THREE.TextureLoader(loadingManager);
const dotTexture = textureLoader.load('./assets/textures/plane64teal.png');
const noiseTexture = textureLoader.load('./assets/textures/clouds.png');

/**
 * Base
 */

// Canvas
const canvas = document.querySelector('canvas.webgl');

// Scene
const scene = new THREE.Scene();

/**
 * Lights
 */
var light = new THREE.AmbientLight(0x404040, 3); // soft white light
scene.add(light);

var directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
scene.add(directionalLight);

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth + shiftRightPercent * window.innerWidth, // offset globe
  height: window.innerHeight + shiftBottomPercent * window.innerHeight,
};

window.addEventListener('resize', () => {
  // Update sizes
  sizes.width = window.innerWidth + shiftRightPercent * window.innerWidth;
  sizes.height = window.innerHeight + shiftBottomPercent * window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  labelRenderer.setSize(sizes.width, sizes.height);
});

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  alpha: true,
  antialias: false,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.sortObjects = false; // Render in the order the objects were added to the scene
renderer.setClearColor('#f6f9fc', 0);

let labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0px';
document.body.appendChild(labelRenderer.domElement);

/**
 * Objects
 */

/**
 * Group
 */
const cameraGroup = new THREE.Group();
scene.add(cameraGroup);

const group = new THREE.Group();
// group.rotation.set(0, -10, 0);
scene.add(group);

/**
 * Globe
 */

const globeGeometry = new THREE.IcosahedronGeometry(globeRadius, 32, 32);
const globeMaterial = new THREE.MeshPhongMaterial({
  map: textureLoader.load(
    './assets/textures/BlackMarble_2016_01deg.jpg' // https://svs.gsfc.nasa.gov/3895
  ),
  bumpMap: textureLoader.load('./assets/textures/earthbump1k.jpg'), // http://planetpixelemporium.com/earth.html
  bumpScale: 0.6,
  specularMap: textureLoader.load('./assets/textures/earthspec1k.jpg'),
  specular: new THREE.Color('grey'),
  shininess: 1,
  normalMap: textureLoader.load('./assets/textures/EarthNormal.png'),
  normalScale: new THREE.Vector2(6, 6),
});

const earthGlobe = new THREE.Mesh(globeGeometry, globeMaterial);
// earthGlobe.rotation.x += 0.7;
// earthGlobe.rotation.y += 0.7;
group.add(earthGlobe);

/**
 * Airports
 * */

// Get the data
const data = await getData('data/airports-extended.dat');
let airports = formatData(data);

// Get the data
const lastWeekEarthQuakes = await getData(
  'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.geojson',
  'json'
);
// console.log(lastWeekEarthQuakes.features[0]);
airports = lastWeekEarthQuakes.features;

document.querySelector('#airport-no').innerHTML = markerCount; // airports.length;
// console.log(airports[0]);
// console.log(airports.length);

// Particles

// function calcPosFromLatLonRad(lat, lon, radius) {
//   var phi = (90 - lat) * (Math.PI / 180);
//   var theta = (lon + 180) * (Math.PI / 180);

//   let x = -(radius * Math.sin(phi) * Math.cos(theta));
//   let z = radius * Math.sin(phi) * Math.sin(theta);
//   let y = radius * Math.cos(phi);

//   return [x, y, z];
// }

function calcPosFromLatLonRad(lat, lon, radius) {
  var phi = (90 - lat) * (Math.PI / 180);
  var theta = lon * (Math.PI / 180);

  // var phi = (90 - lat) * (Math.PI / 180);
  // var theta = (lon + 180) * (Math.PI / 180);

  let x = -(radius * Math.sin(phi) * Math.cos(theta));
  let z = radius * Math.sin(phi) * Math.sin(theta);
  let y = radius * Math.cos(phi);

  return [x, y, z];
}

// let globalUniforms = {
//   uPointTexture: {
//     value: dotTexture, //new THREE.TextureLoader().load('./assets/textures/spark1.png'),
//   },
//   uNoiseTexture: { value: noiseTexture },
//   uPointSize: { value: 20 },
//   uTime: { value: 0 },
// };

let globalUniforms = {
  uTime: { value: 0 },
  uDotTexture: { value: dotTexture },
  uNoiseTexture: { value: noiseTexture },
  uSize: { value: 5 * renderer.getPixelRatio() },
};

// let globalUniforms = {
//   uTime: { value: 0 },
//   // uDotTexture: { value: dotTexture },
//   // uNoiseTexture: { value: noiseTexture },
//   // uSize: { value: 0.005 * renderer.getPixelRatio() },

//   uPointTexture: {
//     value: new THREE.TextureLoader().load('./assets/textures/spark1.png'),
//   },
//   uPointSize: { value: 20 },
// };
// markerCount = airports.length;
// let markerInfo = []; // information on markers

// let gMarker = new THREE.PlaneGeometry(0.005, 0.005);

// // Material
// const mMarker = new THREE.MeshBasicMaterial({
//   color: 0x5ad0d0,
//   // onBeforeCompile: (shader) => {
//   //   shader.uniforms.uTime = globalUniforms.uTime;
//   //   shader.uniforms.uDotTexture = globalUniforms.uDotTexture;
//   //   shader.uniforms.uNoiseTexture = globalUniforms.uNoiseTexture;
//   //   shader.depthWrite = false;
//   //   shader.blending = THREE.AdditiveBlending;
//   //   shader.vertexShader = `
//   //     attribute float phase;
//   //     varying float vPhase;
//   //     ${shader.vertexShader}
//   //     `.replace(
//   //     `#include <begin_vertex>`,
//   //     `#include <begin_vertex>
//   //       vPhase = phase; // de-synch of ripples
//   //     `
//   //   );

//   //   shader.fragmentShader = `
//   //     uniform float uTime;
//   //     uniform sampler2D uDotTexture;
//   //     uniform sampler2D uNoiseTexture;

//   //     varying float vPhase;

//   //     ${shader.fragmentShader}
//   //     `.replace(
//   //     `vec4 diffuseColor = vec4( diffuse, opacity );`,
//   //     `
//   //       vec2 lUv = vUv;
//   //       // vec2 lUv = (vUv - 0.8) * 2.;

//   //       float val = 0.;
//   //       float lenUv = length(lUv);
//   //       // val = max(val, 1. - step(0.25, lenUv)); // central circle
//   //       // val = max(val, step(0.4, lenUv) - step(0.5, lenUv)); // outer circle

//   //       float tShift = fract(uTime * 0.2 + 2.0*vPhase);
//   //       val = max(val, step(0.4 + (tShift * 0.6), lenUv) - step(0.5 + (tShift * 0.5), lenUv)); // ripple

//   //       vec4 textureColor = texture2D(uDotTexture, lUv);
//   //       vec4 noiseColor = texture2D(uNoiseTexture, vec2(lUv.x + uTime, lUv.y));
//   //       float noiseAlpha = pow(noiseColor.r, 3.0);
//   //       vec4 finalColor = vec4(textureColor.rgb, (textureColor.a * 1.0 * 1.0) * 1.0);

//   //       vec4 diffuseColor = vec4( finalColor.rgb, opacity );
//   //       if (val > 0.5) {
//   //         diffuseColor =  vec4(1.,1.,1., 0.05);

//   //       }
//   //       `
//   //   );
//   // },
// });

// mMarker.defines = { USE_UV: ' ' }; // needed to be set to be able to work with UVs

// let markers = new THREE.InstancedMesh(gMarker, mMarker, markerCount);

// let flow = [];

// const generatePointsRandomly = (n) => {
//   let rad = 180;
//   var distance = 1000;
//   for (var i = 0; i < n; i++) {
//     var theta = THREE.MathUtils.randFloatSpread(100);
//     var phi = THREE.MathUtils.randFloatSpread(100);

//     const x = distance * Math.sin(theta) * Math.cos(phi);
//     const y = distance * Math.sin(theta) * Math.sin(phi);

//     const x1 = Math.floor(Math.random() * rad);
//     const y1 = Math.floor(Math.random() * rad);
//     // const x2 = Math.floor(Math.random() * rad);
//     // const y2 = Math.floor(Math.random() * rad);

//     let type;

//     var randomType = parseInt((Math.random() * 3) % 3);
//     if (randomType == 0) type = 'infection';
//     else if (randomType == 1) type = 'attack';
//     else type = 'spam';

//     // console.log(x1, y1, x, y);
//     flow.push({
//       x: airports[i] ? +airports[i].geometry.coordinates[0] : x,
//       y: airports[i] ? +airports[i].geometry.coordinates[1] : y,
//       z: 2,
//     });
//   }
// };
// generatePointsRandomly(markerCount);

const quakeCount = markerCount; // airports.length;
let quakeInfo = []; // information on quakes

let quakeGeometry = new THREE.BufferGeometry();

// Material
const quakeMaterial = new THREE.ShaderMaterial({
  uniforms: globalUniforms,
  vertexShader: quakeVertexShader,
  fragmentShader: quakeFragmentShader,
  blending: THREE.AdditiveBlending,
  depthTest: false,
  transparent: true,
});

// // Material
// const quakeMaterial = new THREE.MeshBasicMaterial({
//   color: 0x5ad0d0,
//   // onBeforeCompile: (shader) => {
//   //   shader.uniforms.uTime = globalUniforms.uTime;
//   //   shader.uniforms.uDotTexture = globalUniforms.uDotTexture;
//   //   shader.uniforms.uNoiseTexture = globalUniforms.uNoiseTexture;
//   //   shader.depthWrite = false;
//   //   shader.blending = THREE.AdditiveBlending;
//   //   shader.vertexShader = `
//   //     attribute float phase;
//   //     attribute float aMagnitude;
//   //     attribute float aSize;
//   //     varying float vPhase;
//   //     ${shader.vertexShader}
//   //     `.replace(
//   //     `#include <begin_vertex>`,
//   //     `#include <begin_vertex>
//   //       vPhase = phase; // de-synch of ripples

//   //     `
//   //   );

//   //   shader.fragmentShader = `
//   //     uniform float uTime;
//   //     uniform sampler2D uDotTexture;
//   //     uniform sampler2D uNoiseTexture;

//   //     varying float vPhase;

//   //     ${shader.fragmentShader}
//   //     `.replace(
//   //     `vec4 diffuseColor = vec4( diffuse, opacity );`,
//   //     `
//   //       vec2 lUv = vec2(0.98,0.98) * 0.5; //vUv;
//   //       // vec2 lUv = (vUv - 0.8) * 2.;

//   //       float val = 0.;
//   //       float lenUv = length(lUv);
//   //       // val = max(val, 1. - step(0.25, lenUv)); // central circle
//   //       // val = max(val, step(0.4, lenUv) - step(0.5, lenUv)); // outer circle

//   //       float tShift = fract(uTime * 0.2 + 2.0 * vPhase);
//   //       val = max(val, step(0.4 + (tShift * 0.6), lenUv) - step(0.5 + (tShift * 0.5), lenUv)); // ripple

//   //       vec4 textureColor = texture2D(uDotTexture, lUv);
//   //       vec4 noiseColor = texture2D(uNoiseTexture, vec2(lUv.x + uTime, lUv.y));
//   //       float noiseAlpha = pow(noiseColor.r, 3.0);
//   //       vec4 finalColor = vec4(textureColor.rgb, (textureColor.a * 1.0 * 1.0) * 1.0);

//   //       vec4 diffuseColor = vec4( finalColor.rgb, opacity );
//   //       if (val > 0.5) {
//   //         diffuseColor =  vec4(1.,1.,1., 0.05);
//   //       }
//   //       `
//   //   );
//   // },
// });

quakeMaterial.defines = { USE_UV: ' ' }; // needed to be set to be able to work with UVs

let quakes = new THREE.Points(quakeGeometry, quakeMaterial);

const positions = new Float32Array(quakeCount * 3);
const phases = new Float32Array(quakeCount * 1);
const magnitudes = new Float32Array(quakeCount * 1);
const qsizes = new Float32Array(quakeCount * 1);
var distance = 1000;
for (let i = 0; i < quakeCount; i++) {
  var theta = THREE.MathUtils.randFloatSpread(100);
  var phi = THREE.MathUtils.randFloatSpread(100);

  const x = distance * Math.sin(theta) * Math.cos(phi);
  const y = distance * Math.sin(theta) * Math.sin(phi);

  const i3 = i * 3;

  let pos = calcPosFromLatLonRad(
    airports[i] ? airports[i].geometry.coordinates[1] : y,
    airports[i] ? airports[i].geometry.coordinates[0] : x,
    globeRadius
  );

  // Set attributes
  positions[i3] = pos[0];
  positions[i3 + 1] = pos[1];
  positions[i3 + 2] = pos[2];
  phases[i] = 1; //Math.random();
  magnitudes[i] =
    airports[i] && airports[i].properties.mag
      ? airports[i].properties.mag
      : Math.floor(Math.random() * 2 + 1);
  qsizes[i] = 0.0001;

  let airportInfo = airports[i]
    ? airports[i].properties
    : { name: 'random', id: i };
  // airportInfo.crd = { x: pos[0], y: pos[1], z: pos[2] };
  quakeInfo.push(airportInfo);
}

let spherical = new THREE.Spherical();

function secondsToDhms(seconds) {
  let unix_timestamp = seconds;
  // Create a new JavaScript Date object based on the timestamp
  // multiplied by 1000 so that the argument is in milliseconds, not seconds.
  var date = new Date(unix_timestamp);
  // Hours part from the timestamp
  var hours = date.getHours();
  // Minutes part from the timestamp
  var minutes = '0' + date.getMinutes();
  // Seconds part from the timestamp
  var seconds = '0' + date.getSeconds();

  // Will display time in 10:30:23 format
  var formattedTime =
    hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);

  var options = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };

  return `${date.toLocaleDateString('en-US', options)} - ${formattedTime}`;
}

// console.log(flow);

// let airportPoint = new THREE.Object3D();
// let phase = [];
// for (let i = 0; i < markerCount; i++) {
//   let pos = calcPosFromLatLonRad(
//     // airports[i].geometry.coordinates[0],
//     // airports[i].geometry.coordinates[1],
//     flow[i].x,
//     flow[i].y,
//     globeRadius
//   );

//   airportPoint.position.set(pos[0], pos[1], pos[2]);
//   airportPoint.lookAt(airportPoint.position.clone().setLength(globeRadius + 1));
//   airportPoint.updateMatrix();
//   markers.setMatrixAt(i, airportPoint.matrix);
//   // phase.push(Math.random());
//   phase.push(1);

//   let airportInfo = airports[i]
//     ? airports[i].properties
//     : { name: 'random', id: i };
//   airportInfo.crd = airportPoint.position.clone();
//   markerInfo.push(airportInfo);
// }

// gMarker.setAttribute(
//   'phase',
//   new THREE.InstancedBufferAttribute(new Float32Array(phase), 1)
// );

// markers.rotation.x += 0.7;
// markers.rotation.y += 0.7;
// scene.add(markers);

quakeGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
quakeGeometry.setAttribute(
  'aPhase',
  new THREE.BufferAttribute(new Float32Array(phases), 1)
);
quakeGeometry.setAttribute(
  'aMagnitude',
  new THREE.BufferAttribute(new Float32Array(magnitudes), 1)
);
quakeGeometry.setAttribute('aSize', new THREE.BufferAttribute(qsizes, 1));
// quakeGeometry.setAttribute('size', new THREE.BufferAttribute(qsizes, 1));

// quakes.rotation.x += 0.7;
// quakes.rotation.y += 0.7;

// quakes.scale.set(0.99, 0.99, 0.99);
group.add(quakes);

// <Label>
let labelDiv = document.getElementById('markerLabel');
let closeBtn = document.getElementById('closeButton');

closeBtn.addEventListener('click', (event) => {
  labelDiv.classList.add('hidden');
});

let label = new CSS2DObject(labelDiv);
label.userData = {
  cNormal: new THREE.Vector3(),
  cPosition: new THREE.Vector3(),
  mat4: new THREE.Matrix4(),
  trackVisibility: () => {
    // the closer to the edge, the less opacity
    let ud = label.userData;
    ud.cNormal
      .copy(label.position)
      .normalize()
      .applyMatrix3(earthGlobe.normalMatrix);
    ud.cPosition
      .copy(label.position)
      .applyMatrix4(
        ud.mat4.multiplyMatrices(
          camera.matrixWorldInverse,
          earthGlobe.matrixWorld
        )
      );
    let d = ud.cPosition.negate().normalize().dot(ud.cNormal);
    d = smoothstep(0.2, 0.7, d);
    label.element.style.opacity = d;

    // https://github.com/gre/smoothstep/blob/master/index.js
    function smoothstep(min, max, value) {
      var x = Math.max(0, Math.min(1, (value - min) / (max - min)));
      return x * x * (3 - 2 * x);
    }
  },
};
scene.add(label);
// </Label>

/**
 * Camera
 */

// Base camera
const camera = new THREE.PerspectiveCamera(
  45,
  sizes.width / sizes.height,
  0.1,
  100
);
camera.position.set(0, 0, cameraZoom);
cameraGroup.add(camera);

/**
 * Controls
 */

let controls = new OrbitControls(camera, canvas);

// controls.enablePan = true;
// controls.enableZoom = true;
controls.minDistance = 9;
controls.maxDistance = 40;
controls.enableDamping = true;
controls.autoRotate = false;
controls.autoRotateSpeed *= 0.5;

// controls.enablePan = false;
// controls.minDistance = 6;
// controls.maxDistance = 15;
// controls.enableDamping = true;
// controls.autoRotate = true;
// controls.autoRotateSpeed *= 0.25;

const rotateBtn = document.querySelector('#rotate-globe');
const stopBtn = document.querySelector('#stop-globe');

rotateBtn.addEventListener('click', (event) => {
  rotateBtn.classList.add('hidden');
  stopBtn.classList.remove('hidden');
  controls.autoRotate = true;
});

stopBtn.addEventListener('click', (event) => {
  rotateBtn.classList.remove('hidden');
  stopBtn.classList.add('hidden');
  controls.autoRotate = false;
});

/**
 * Raycaster
 */
const raycaster = new THREE.Raycaster();

/**
 * Mouse
 */
const mouse = new THREE.Vector2();
let currentIntersect = null;

const handleMouseMove = (event) => {
  handleMove(event.clientX, event.clientY, 1);
  // handleMove(event.clientX, event.clientY, 0);
};

const handleClick = (event) => {
  handleMove(event.clientX, event.clientY, 1);
};

const handleTouchMove = (event) => {
  var touch = event.touches[0];
  var x = touch.clientX;
  var y = touch.clientY;

  handleMove(x, y, 1);
};
const infoEl1 = document.querySelector('#infoEl1'); //change
const infoEl2 = document.querySelector('#infoEl2'); //change

let divMag = document.getElementById('magnitude');
const handleMove = (x, y, isClick) => {
  mouse.x = (x / sizes.width) * 2 - 1;
  mouse.y = -(y / sizes.height) * 2 + 1;

  /**
   * Raycaster
   */
  // Pick objects from view using normalized mouse coordinates

  raycaster.setFromCamera(mouse, camera);

  // const intersects = raycaster.intersectObjects([quakes]);

  // if (intersects[0]) {
  //   currentIntersect = intersects[0];

  //   if (currentIntersect) {
  //     if (isClick) {
  //       console.log('click', isClick);
  //       // let iid = currentIntersect.instanceId;
  //       let iid = currentIntersect.index;
  //       let mi = quakeInfo[iid];
  //       // console.log(iid, mi);

  //       divMag.innerHTML = '';
  //       Object.keys(mi).forEach((key) => {
  //         if (key !== 'crd') {
  //           infoEl1.innerHTML = `
  //                 ${key}: ${mi[key]} <br/>
  //                 `;
  //         }
  //       });

  //       // label.position.copy(mi.crd);
  //       // infoEl1.innerHTML = mi.qtime; //change
  //       // infoEl2.innerHTML = mi.info; //change

  //       // label.element.animate(
  //       //   [
  //       //     { width: '0px', height: '0px', marginTop: '0px', marginLeft: '0px' },
  //       //     {
  //       //       width: '230px',
  //       //       height: '50px',
  //       //       marginTop: '-25px',
  //       //       maginLeft: '120px',
  //       //     },
  //       //   ],
  //       //   {
  //       //     duration: 250,
  //       //   }
  //       // );
  //       label.element.classList.remove('hidden');
  //     }
  //     document.body.classList.remove('grabbable');
  //     document.body.classList.add('pointer');
  //   }
  // } else {
  //   // console.log('----------------- no intersection');
  //   document.body.classList.remove('pointer');
  //   document.body.classList.add('grabbable');
  //   currentIntersect = null;
  //   // if (isMobile) {
  //   // label.element.classList.add('hidden');
  //   // }
  //   // scrollingArea.classList.remove('no-pointer-events');
  //   // document.elementFromPoint(x, y).click();
  // }
};

if (isMobile) {
  window.addEventListener('touchstart', handleTouchMove);
  window.addEventListener('touchmove', handleTouchMove);
} else {
  // window.addEventListener('click', (event) => {
  //   label.element.classList.add('hidden');
  // });
  window.addEventListener('click', handleClick);
  window.addEventListener('mousemove', handleMouseMove);
  // window.addEventListener('mousemove', handleMouseMove);
}

/**
 * Animate
 */
const clock = new THREE.Clock();

const tick = () => {
  const elapsedTime = clock.getElapsedTime();

  globalUniforms.uTime.value = elapsedTime;
  controls.update();
  label.userData.trackVisibility();

  const time = Date.now() * 0.005;

  // const geometry = quakes.geometry;
  // const attributes = geometry.attributes;

  // for (let i = 0; i < attributes.aSize.array.length; i++) {
  //   attributes.aSize.array[i] = Math.sin(0.01 * i + time);
  // }

  // attributes.aSize.needsUpdate = true;

  // Render
  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);

  // scene.rotation.y -= 0.0015;

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
