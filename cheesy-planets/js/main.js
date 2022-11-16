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
const shiftRightPercent = 0; //isMobile ? 0 : 0.4;
const shiftBottomPercent = 0; // isMobile ? 0.5 : 0.1;
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

/**
 * Base
 */

// Canvas
const canvas = document.querySelector('canvas.webgl');

// Scene
const scene = new THREE.Scene();

// https://svs.gsfc.nasa.gov/3895
const stars = '../..//assets/textures/starmap_4k.jpg';

const backgroundMap = textureLoader.load(stars);
backgroundMap.mapping = THREE.EquirectangularReflectionMapping;
backgroundMap.encoding = THREE.sRGBEncoding;

scene.background = backgroundMap;

/**
 * Lights
 */

// Ambient light
const ambientLight = new THREE.AmbientLight(0xf1f1f1, 0.3);
// const ambientLight = new THREE.AmbientLight('#b9d5ff', 0.3);
gui.add(ambientLight, 'intensity').min(0).max(1).step(0.001);
scene.add(ambientLight);

// // Directional light
// const moonLight = new THREE.DirectionalLight('#b9d5ff', 2);
// moonLight.position.set(-30, -1, -9);
// gui.add(moonLight, 'intensity').min(0).max(1).step(0.001);
// gui.add(moonLight.position, 'x').min(-50).max(50).step(0.001);
// gui.add(moonLight.position, 'y').min(-50).max(50).step(0.001);
// gui.add(moonLight.position, 'z').min(-50).max(50).step(0.001);
// scene.add(moonLight);

// var ambientLight = new THREE.AmbientLight(0xf1f1f1);
// scene.add(ambientLight);

var spotLight = new THREE.DirectionalLight(0xffffff, 0.6);
spotLight.position.set(50, 50, 50);
gui.add(spotLight, 'intensity').min(0).max(1).step(0.001);
gui.add(spotLight.position, 'x').min(-50).max(50).step(0.001);
gui.add(spotLight.position, 'y').min(-50).max(50).step(0.001);
gui.add(spotLight.position, 'z').min(-50).max(50).step(0.001);
scene.add(spotLight);

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

function pattern(texture) {
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.offset.set(1, 1);
  texture.repeat.set(3, 3);
}

const moonHeight = textureLoader.load(
  './assets/textures/Food_Cheese_height.jpg',
  (texture) => pattern(texture)
);
const moonNormal = textureLoader.load(
  './assets/textures/Food_Cheese_normal.jpg',
  (texture) => pattern(texture)
);

const moonMetalness = textureLoader.load(
  './assets/textures/Food_Cheese_metallic-roughness.png',
  (texture) => pattern(texture)
);
var moonTexture = textureLoader.load(
  './assets/textures/Food_Cheese_basecolor.jpg',
  (texture) => pattern(texture)
);

//Earth
var earthGeometry = new THREE.IcosahedronGeometry(10, 50, 50);
var earthMaterial = new THREE.MeshStandardMaterial({
  // map: textureLoader.load('./assets/textures/earth_texture.jpg'),

  map: moonTexture,
  color: 0xf2f2f2,
  specular: 0xbbbbbb,
  shininess: 2,
  metalnessMap: moonMetalness,
  metalness: 0.07,
  roughness: 1,
  normalMap: moonNormal,
  normalScale: new THREE.Vector2(0.2, 0.2),
  displacementMap: moonHeight,
  displacementScale: 5,
  bumpMap: moonHeight,
  bumpScale: 1,
});
var earth = new THREE.Mesh(earthGeometry, earthMaterial);

scene.add(earth);

//Clouds
var cloudGeometry = new THREE.SphereGeometry(10.3, 50, 50);
var cloudMaterial = new THREE.MeshPhongMaterial({
  map: textureLoader.load('./assets/textures/clouds_2.jpg'),
  transparent: true,
  opacity: 0.1,
});
var clouds = new THREE.Mesh(cloudGeometry, cloudMaterial);
// scene.add(clouds);

//Moon
var moonGeometry = new THREE.SphereGeometry(3.5, 50, 50);

var moonMaterial = new THREE.MeshStandardMaterial({
  map: moonTexture,
  color: 0xf2f2f2,
  specular: 0xbbbbbb,
  shininess: 0.5,
  metalnessMap: moonMetalness,
  metalness: 0.0007,
  roughness: 1,
  normalMap: moonNormal,
  normalScale: new THREE.Vector2(0.6, 0.6),
  displacementMap: moonHeight,
  displacementScale: 2,
  bumpMap: moonHeight,
  bumpScale: 1,
});
var moon = new THREE.Mesh(moonGeometry, moonMaterial);
moon.position.set(25, 0, 0);
scene.add(moon);

var r = 25;
var theta = 0;
var dTheta = (2 * Math.PI) / 1000;

/**
 * Camera
 */

// Base camera
const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  1,
  1000
);
scene.add(camera);
camera.position.set(0, 0, 50);

/**
 * Controls
 */

let controls = new OrbitControls(camera, canvas);

/**
 * Animate
 */
const clock = new THREE.Clock();

const tick = () => {
  const elapsedTime = clock.getElapsedTime();

  globalUniforms.uTime.value = elapsedTime;
  controls.update();

  earth.rotation.y += 0.0009;
  // clouds.rotation.y += 0.00005;

  //Moon orbit
  theta += dTheta;
  moon.position.x = r * Math.cos(theta);
  moon.position.z = r * Math.sin(theta);

  // Render
  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);

  // scene.rotation.y -= 0.0015;

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
