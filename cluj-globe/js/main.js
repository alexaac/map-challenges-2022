import * as THREE from '../../js/three/build/three.module.js';
import { ObjectControls } from '../../js/three/ObjectControls.js';
import { OrbitControls } from '../../js/three/OrbitControls.js';

import * as dat from '../../js/libs/lil-gui.module.min.js';

import {
  CSS2DRenderer,
  CSS2DObject,
} from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/renderers/CSS2DRenderer.js';

/** Constants */
const globeRadius = 6;

const isMobile = window.innerWidth < 703;
const shiftRightPercent = isMobile ? 0 : 0.4;
const shiftBottomPercent = isMobile ? 0.5 : 0.1;
const cameraZoom = isMobile ? 25 : 7;

/**
 * Base
 */
// Debug
const gui = new dat.GUI();

const parameters = {
  displacementScale: 0,
};
gui.hide();

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
const height = textureLoader.load('./assets/textures/globe_cj_height3.png');
const texture = textureLoader.load('./assets/textures/globe_cj_texture3.png');

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

// Ambient light
const ambientLight = new THREE.AmbientLight('#b9d5ff', 0.2);
gui.add(ambientLight, 'intensity').min(0).max(1).step(0.001);
scene.add(ambientLight);

// Directional light
const moonLight = new THREE.DirectionalLight('#b9d5ff', 2);
moonLight.position.set(-30, -1, -9);
gui.add(moonLight, 'intensity').min(0).max(1).step(0.001);
gui.add(moonLight.position, 'x').min(-50).max(50).step(0.001);
gui.add(moonLight.position, 'y').min(-50).max(50).step(0.001);
gui.add(moonLight.position, 'z').min(-50).max(50).step(0.001);
scene.add(moonLight);

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

let globalUniforms = {
  uTime: { value: 0 },

  uSize: { value: 30 * renderer.getPixelRatio() },
  color: { value: new THREE.Color(0xffffff) },
  opacity: { value: 0.9 },
};

/**
 * Objects
 */

/**
 * Globe
 */

const globeGeometry = new THREE.IcosahedronGeometry(globeRadius, 32, 32);
const globeMaterial = new THREE.MeshStandardMaterial({
  color: 'gray',
  map: texture,
  displacementMap: height,
  displacementScale: 0.5,
  bumpMap: height,
  bumpScale: 1,
  // normalMap: texture,
  // normalScale: new THREE.Vector2(0.6, 0.6),
  // alphaMap: alpha,
  // transparent: true,
  // depthTest: false,
});

// const globeMaterial = new THREE.MeshPhongMaterial({
//   map: textureLoader.load(
//     './assets/textures/globe_cj_height.png' // https://svs.gsfc.nasa.gov/3895
//   ),
//   bumpMap: textureLoader.load('./assets/textures/globe_cj_height.png'), // http://planetpixelemporium.com/earth.html
//   bumpScale: 50,
//   // specularMap: textureLoader.load('./assets/textures/earthspec1k.jpg'),
//   // specular: new THREE.Color('grey'),
//   shininess: 1,
//   // normalMap: textureLoader.load('./assets/textures/EarthNormal.png'),
//   // normalScale: new THREE.Vector2(6, 6),
// });

const earthGlobe = new THREE.Mesh(globeGeometry, globeMaterial);
// earthGlobe.rotation.x += 0.7;
// earthGlobe.rotation.y += 0.7;
scene.add(earthGlobe);

/**
 * Camera
 */

// Base camera
const camera = new THREE.PerspectiveCamera(
  55,
  sizes.width / sizes.height,
  0.1,
  100
);
camera.position.set(-8, -3, 6);
scene.add(camera);

gui.add(camera.position, 'x').min(-20).max(20).step(1);
gui.add(camera.position, 'y').min(-20).max(20).step(1);
gui.add(camera.position, 'z').min(-20).max(20).step(1);

/**
 * Controls
 */

let controls = new OrbitControls(camera, canvas);

// controls.enablePan = true;
// controls.enableZoom = true;
controls.minDistance = -20;
controls.maxDistance = 20;
controls.enableDamping = true;
controls.autoRotate = false;
controls.autoRotateSpeed *= 0.5;

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
 * Animate
 */
const clock = new THREE.Clock();

const tick = () => {
  const elapsedTime = clock.getElapsedTime();

  globalUniforms.uTime.value = elapsedTime;
  controls.update();

  // Render
  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);

  // scene.rotation.y -= 0.0015;

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
