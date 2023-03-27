import * as THREE from '../../js/three/build/three.module.js';
import { OrbitControls } from '../../js/three/OrbitControls.js';
import { FlyControls } from '../../js/three/FlyControls.js';
import * as dat from '../../js/libs/lil-gui.module.min.js';

const isMobile = window.innerWidth < 703;

/**
 * Loaders
 */
const cubeTextureLoader = new THREE.CubeTextureLoader();
const textureLoader = new THREE.TextureLoader();

/**
 * Textures
 */

const texture = textureLoader.load('./assets/textures/antarcticloud.png');

/**
 * Debug
 */
const gui = new dat.GUI({ closed: true });
const parameters = {
  displacementScale: 0,
};
gui.hide();

/**
 * Base
 */
// Canvas
const canvas = document.querySelector('canvas.webgl');

// Scene
const scene = new THREE.Scene();

/**
 * Objects
 */

const geometry = new THREE.PlaneBufferGeometry(3, 1.96, 32, 32);

// Meshes
const objectsDistance = 2;
let index = 0;
let xOffset = 0;
const sectionMeshes = [];

const div = document.querySelector('.list');

/**
 * @description Fetch data
 * @param {string} url - file
 */
const getData = async (url) => {
  const response = fetch(url);

  const data = await (await response).json();

  return data;
};

const material = new THREE.MeshBasicMaterial({
  map: texture,
  color: 0xffffff,
  side: THREE.DoubleSide,
  transparent: true,
  depthTest: false,
});

// Mesh
const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);

/**
 * Lights
 */

var ambientLight = new THREE.AmbientLight(0xffffff);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight('#ffffff', 1);
directionalLight.position.set(1, 1, 0);
scene.add(directionalLight);

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

window.addEventListener('resize', () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.1,
  100
);
camera.position.set(0, 0, 1.3);

scene.add(camera);

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  alpha: true,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/**
 * Controls
 *
 */

// const controls = new OrbitControls(camera, canvas);
const controls = new FlyControls(camera, canvas);
controls.movementSpeed = 0.1;
controls.domElement = renderer.domElement;
controls.rollSpeed = Math.PI / 24;
controls.autoForward = false;
controls.dragToLook = false;

const clock = new THREE.Clock();

/**
 * Animate
 */

const tick = () => {
  // Render
  renderer.render(scene, camera);

  const delta = clock.getDelta();
  controls.update(delta);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
