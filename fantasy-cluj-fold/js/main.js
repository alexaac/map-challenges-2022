import * as THREE from '../../js/three/build/three.module.js';
import { OrbitControls } from '../../js/three/OrbitControls.js';
import * as dat from '../../js/libs/lil-gui.module.min.js';

import { GLTFLoader } from '../../js/three/GLTFLoader.js';

import dVertexShader from './shaders/displacement/vertex.js';
import dFragmentShader from './shaders/displacement/fragment.js';

var clock,
  mixers = [],
  actions = [],
  mode;

const isMobile = window.innerWidth < 703;
const shiftRightPercent = isMobile ? 0 : 0;
const shiftBottomPercent = isMobile ? 0.5 : 0.1;

/**
 * Loaders
 */
const cubeTextureLoader = new THREE.CubeTextureLoader();
const textureLoader = new THREE.TextureLoader();

/**
 * Textures
 */
// const height1 = textureLoader.load('./assets/textures/ro_height.png');
// const height2 = textureLoader.load('./assets/textures/ro_height2.png');
// const height3 = textureLoader.load('./assets/textures/ro_height3.png');
const tex1 = textureLoader.load('./assets/textures/ro_texture.png');
const tex2 = textureLoader.load('./assets/textures/ro_texture2.png');
const tex3 = textureLoader.load('./assets/textures/ro_texture3.png');

/**
 * Debug
 */
const gui = new dat.GUI({ closed: true });

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

var loader = new GLTFLoader();
loader.setPath('./assets/models/');
loader.load('foldMap.glb', function (object) {
  console.log(object.scene);
  let mixer = new THREE.AnimationMixer(object.scene.children[1]);
  let action = mixer.clipAction(object.animations[0]);

  console.log(object.animations[0]);
  console.log(action);
  action.loop = THREE.LoopOnce;
  action.clampWhenFinished = true;
  mixers.push(mixer);
  actions.push(action);

  actions[0].play();

  const meshGroup = new THREE.Group();
  meshGroup.position.set(1, 0, 0);
  meshGroup.add(object.scene);
  scene.add(meshGroup);
});

/**
 * Update all materials
 */
const updateAllMaterials = () => {
  scene.traverse((child) => {
    if (
      child instanceof THREE.Mesh &&
      child.material instanceof THREE.MeshStandardMaterial
    ) {
      // child.material.envMap = environmentMap
      child.material.envMapIntensity = 5.5;
      child.material.needsUpdate = true;
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
};

/**
 * Lights
 */
const ambientLight = new THREE.AmbientLight(0xf1f1f1, 0.3);
// const ambientLight = new THREE.AmbientLight('#b9d5ff', 0.3);
gui.add(ambientLight, 'intensity').min(0).max(1).step(0.001);
scene.add(ambientLight);

const pointLight = new THREE.PointLight('#ffffff', 3);
// const pointLight = new THREE.PointLight('#00b3ff', 3);
pointLight.position.x = -1.629;
pointLight.position.y = 3.288;
pointLight.position.z = -0.4;
pointLight.intensity = 0.8;
scene.add(pointLight);

gui.add(pointLight.position, 'x').min(-50).max(50).step(0.001);
gui.add(pointLight.position, 'y').min(-50).max(50).step(0.001);
gui.add(pointLight.position, 'z').min(-50).max(50).step(0.001);
gui.add(pointLight, 'intensity').min(0).max(1).step(0.001);

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth - shiftRightPercent * window.innerWidth, // offset globe
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

const cameraZoom = isMobile ? 25 : 2;
camera.position.set(0, 11, cameraZoom);

scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.autoRotate = false;
controls.autoRotateSpeed *= -1;

controls.target.set(0, 0, 0);
controls.update();

// mode = 'open';
// const btn = document.getElementById('btn');
// btn.addEventListener('click', function (e) {
//   if (actions !== undefined && actions.length == 2) {
//     const btn = document.getElementById('btn');
//     if (mode == 'open') {
//       actions.forEach((action) => {
//         action.timeScale = 1;
//         action.reset();
//         action.play();
//       });
//       mode = 'close';
//       btn.innerHTML = 'Close Gates';
//     } else {
//       actions.forEach((action) => {
//         action.timeScale = -1;
//         const clip = action.getClip();
//         action.reset();
//         action.time = clip.duration;
//         action.play();
//       });
//       mode = 'open';
//       btn.innerHTML = 'Open Gates';
//     }
//   }
// });

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  alpha: true,
  antialias: true,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;

/**
 * Animate
 */

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

clock = new THREE.Clock();

const tick = () => {
  // Render
  renderer.render(scene, camera);

  const dt = clock.getDelta();
  mixers.forEach((mixer) => mixer.update(dt));

  controls.update();

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
