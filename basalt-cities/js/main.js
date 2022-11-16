import * as THREE from '../../js/three/build/three.module.js';
import { ObjectControls } from '../../js/three/ObjectControls.js';
import { OrbitControls } from '../../js/three/OrbitControls.js';
import { GLTFLoader } from '../../js/three/GLTFLoader.js';
import { RGBELoader } from '../../js/three/RGBELoader.js';
import { createBackground } from '../../js/three/three-vignette.js';

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
const cubeTextureLoader = new THREE.CubeTextureLoader(loadingManager);

/**
 * Base
 */

// Canvas
const canvas = document.querySelector('canvas.webgl');

// Scene
const scene = new THREE.Scene();

scene.background = new THREE.Color().setHSL(0.6, 0, 1);
scene.fog = new THREE.Fog(scene.background, 1, 5000);

/**
 * Overlay
 */
const overlayGeometry = new THREE.PlaneGeometry(2, 2, 1, 1);
const overlayMaterial = new THREE.ShaderMaterial({
  transparent: true,
  uniforms: {
    uAlpha: { value: 1 },
  },
  vertexShader: `
         void main()
         {
             gl_Position = vec4(position, 1.0);
         }
     `,
  fragmentShader: `
         uniform float uAlpha;

         void main()
         {
             gl_FragColor = vec4(0.0, 0.0, 0.0, uAlpha);
         }
     `,
});
const overlay = new THREE.Mesh(overlayGeometry, overlayMaterial);
scene.add(overlay);

// Animate overlay
gsap.to(overlayMaterial.uniforms.uAlpha, {
  duration: 10,
  value: 0,
  onComplete: removeOverlay,
});

function removeOverlay() {
  scene.remove(overlay);
}

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
      // child.castShadow = true;
      // child.receiveShadow = true;
    }
  });
};

/**
 * Lights
 */

// Ambient light
const ambientLight = new THREE.AmbientLight(0xffffff, 0.03);
gui.add(ambientLight, 'intensity').min(0).max(1).step(0.001);
// scene.add(ambientLight);

const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.6);
// hemiLight.color.setHSL(0, 1, 0.6);
hemiLight.color.setHex(0x6fb3e6);
hemiLight.groundColor.setHex(0x338b93);
hemiLight.position.set(0, 50, 0);
scene.add(hemiLight);

// const hemiLightHelper = new THREE.HemisphereLightHelper(hemiLight, 1);
// scene.add(hemiLightHelper);

//

const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.color.setHex(0xffffff);
dirLight.position.set(-300, 1200, -1500);
dirLight.position.multiplyScalar(1);
scene.add(dirLight);

gui.add(dirLight, 'intensity').min(0).max(1).step(0.001);
gui.add(dirLight.position, 'x').min(-1500).max(1500).step(0.001);
gui.add(dirLight.position, 'y').min(-1500).max(1500).step(0.001);
gui.add(dirLight.position, 'z').min(-1500).max(1500).step(0.001);

dirLight.castShadow = true;

dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;

const d = 50;

dirLight.shadow.camera.left = -d;
dirLight.shadow.camera.right = d;
dirLight.shadow.camera.top = d;
dirLight.shadow.camera.bottom = -d;

dirLight.shadow.camera.far = 3500;
dirLight.shadow.bias = -0.0001;

// const dirLightHelper = new THREE.DirectionalLightHelper(dirLight, 10);
// scene.add(dirLightHelper);

// GROUND

const groundGeo = new THREE.PlaneGeometry(10000, 10000);
const groundMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
groundMat.color.setHSL(0.095, 1, 0.75);

const ground = new THREE.Mesh(groundGeo, groundMat);
ground.position.y = -33;
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// SKYDOME

const vertexShader = document.getElementById('vertexShader').textContent;
const fragmentShader = document.getElementById('fragmentShader').textContent;
const uniforms = {
  topColor: { value: new THREE.Color(0x0077ff) },
  bottomColor: { value: new THREE.Color(0xffffff) },
  offset: { value: 33 },
  exponent: { value: 0.6 },
};
uniforms['topColor'].value.copy(hemiLight.color);

scene.fog.color.copy(uniforms['bottomColor'].value);

const skyGeo = new THREE.SphereGeometry(4000, 32, 15);
const skyMat = new THREE.ShaderMaterial({
  uniforms: uniforms,
  vertexShader: vertexShader,
  fragmentShader: fragmentShader,
  side: THREE.BackSide,
});

const sky = new THREE.Mesh(skyGeo, skyMat);
scene.add(sky);

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
// renderer.sortObjects = false; // Render in the order the objects were added to the scene
// renderer.setClearColor('#f6f9fc', 0);

renderer.outputEncoding = THREE.sRGBEncoding;
renderer.shadowMap.enabled = true;

/**
 * Environment map
 */
// const environmentMap = cubeTextureLoader.load([
//   './assets/environments/0/px.jpg',
//   './assets/environments/0/nx.jpg',
//   './assets/environments/0/py.jpg',
//   './assets/environments/0/ny.jpg',
//   './assets/environments/0/pz.jpg',
//   './assets/environments/0/nz.jpg',
// ]);

// environmentMap.encoding = THREE.sRGBEncoding;

// scene.background = environmentMap;
// scene.environment = environmentMap;

const pmremGenerator = new THREE.PMREMGenerator(renderer);
pmremGenerator.compileEquirectangularShader();

const getCubeMapTexture = (path, format) => {
  // no envmap
  if (!path) return Promise.resolve({ envMap: null, cubeMap: null });

  if (format === '.hdr') {
    return new Promise((resolve, reject) => {
      new RGBELoader().load(
        path,
        (texture) => {
          const envMap = pmremGenerator.fromEquirectangular(texture).texture;
          pmremGenerator.dispose();

          resolve(envMap);
        },
        undefined,
        reject
      );
    });
  }
};

// const path =
// './assets/environments/HDRi_v1/HDR/VizPeople_non_commercial_hdr_v1_07.hdr';

// getCubeMapTexture(path, '.hdr').then((envMap) => {
//   envMap.encoding = THREE.sRGBEncoding;

//   scene.background = envMap;
//   scene.environment = envMap;
// });

const vignette = createBackground({
  // aspect: camera.aspect,
  grainScale: 0.001, // mattdesl/three-vignette-background#1
  colors: ['#ffffff', '#353535'],
});
vignette.name = 'Vignette';
vignette.renderOrder = -100;
// scene.add(vignette);

/**
 * Objects
 */

var loader = new GLTFLoader();
loader.load('https://www.maptheclouds.com/data/heat.glb', function (gltf) {
  console.log(gltf.scene);
  scene.add(gltf.scene);

  updateAllMaterials();
});

/**
 * Camera
 */

// Base camera
// const camera = new THREE.PerspectiveCamera(
//   75,
//   window.innerWidth / window.innerHeight,
//   0.1,
//   100
// );
// camera.position.set(0, 2.5, 0.5);

const camera = new THREE.PerspectiveCamera(
  30,
  window.innerWidth / window.innerHeight,
  1,
  5000
);
camera.position.set(0, 5, 2);
scene.add(camera);

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

  controls.update();

  // Render
  renderer.render(scene, camera);

  // scene.rotation.y -= 0.0015;

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
