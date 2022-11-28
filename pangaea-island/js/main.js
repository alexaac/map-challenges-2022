import * as THREE from '../../js/three/build/three.module.js';
import { OrbitControls } from '../../js/three/OrbitControls.js';
import * as dat from '../../js/libs/lil-gui.module.min.js';

import { EffectComposer } from '../../js/three/EffectComposer.js';
import { RenderPass } from '../../js/three/RenderPass.js';
import { ShaderPass } from '../../js/three/ShaderPass.js';

import { FXAAShader } from '../../js/three/shaders/FXAAShader.js';

import atmosphereVertexShader from './shaders/atmosphere/vertex.js';
import atmosphereFragmentShader from './shaders/atmosphere/fragment.js';

/** Constants */
const GLOBE_RADIUS = 5;

const isMobile = window.innerWidth < 703;
const cameraZoom = isMobile ? 25 : 16;

/**
 * Loaders
 */
const cubeTextureLoader = new THREE.CubeTextureLoader();
const textureLoader = new THREE.TextureLoader();

/**
 * Textures
 */

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

// https://svs.gsfc.nasa.gov/3895
const stars = './assets/textures/starmap_4k.jpg';

const backgroundMap = textureLoader.load(stars);
backgroundMap.mapping = THREE.EquirectangularReflectionMapping;
backgroundMap.encoding = THREE.sRGBEncoding;

scene.background = backgroundMap;

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
  45,
  sizes.width / sizes.height,
  0.1,
  100
);
scene.add(camera);

camera.position.set(-100, 0, 7 * cameraZoom);

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
// renderer.toneMapping = THREE.ACESFilmicToneMapping;

/**
 * Objects
 */
const meshGroup1 = new THREE.Group();
meshGroup1.position.set(-12, 0, 0);
meshGroup1.rotation.y += 2.5;
scene.add(meshGroup1);

const meshGroup2 = new THREE.Group();
meshGroup1.position.set(12, 0, 0);

meshGroup2.rotation.y += 2.5;
scene.add(meshGroup2);

/**
 * Globe
 */
const createGlobe = (group, bumpMap, globeTexture, waterLevel) => {
  bumpMap.wrapS = bumpMap.wrapT = THREE.RepeatWrapping;

  const globeGeometry = new THREE.SphereGeometry(GLOBE_RADIUS, 512, 256);
  const globeMaterial = new THREE.MeshPhongMaterial({
    map: globeTexture,
    displacementMap: bumpMap,
    displacementScale: 0.1,
    bumpMap: bumpMap,
    bumpScale: 0.1,
    shininess: 0.7,
  });

  if (!isMobile) {
    globeMaterial.bumpMap = bumpMap;
    globeMaterial.bumpScale = 0.5;
  }

  const earthGlobe = new THREE.Mesh(globeGeometry, globeMaterial);
  earthGlobe.rotation.y = 11;
  group.add(earthGlobe);

  /**
   * Water
   */
  const normalMapWater = textureLoader.load(
    './assets/textures/water_normals.jpg'
  );
  normalMapWater.wrapS = normalMapWater.wrapT = THREE.RepeatWrapping;
  normalMapWater.repeat.set(2, 1).multiplyScalar(4);

  const geometry = new THREE.SphereGeometry(GLOBE_RADIUS - waterLevel, 128, 64);
  // https://alteredqualia.com/xg/examples/earth_bathymetry.html
  const waterMaterial = new THREE.MeshPhongMaterial({
    color: 0x000000,
    specular: 0x111111,
    normalMap: normalMapWater,
    shininess: 1024,
    transparent: true,
    opacity: 1,
  });
  waterMaterial.color.setHSL(0.51, 0.75, 0.25);

  const waterMesh = new THREE.Mesh(geometry, waterMaterial);
  waterMesh.scale.multiplyScalar(1.11);
  waterMesh.receiveShadow = true;

  group.add(waterMesh);

  //Clouds
  const cloudGeometry = new THREE.SphereGeometry(GLOBE_RADIUS + 0.15, 32, 32);
  const cloudMaterial = new THREE.MeshPhongMaterial({
    map: textureLoader.load('./assets/textures/clouds.png'),
    transparent: true,
    opacity: 0.8,
  });
  const clouds = new THREE.Mesh(cloudGeometry, cloudMaterial);
  clouds.rotation.y = 11;
  group.add(clouds);

  /**
   * Post processing
   */

  // Render target
  const renderTarget = new THREE.WebGLRenderTarget(800, 600, {
    samples: renderer.getPixelRatio === 1 ? 2 : 0,
  });
  renderTarget.texture.format = THREE.RGBFormat;
  renderTarget.texture.minFilter = THREE.NearestFilter;
  renderTarget.texture.magFilter = THREE.NearestFilter;
  renderTarget.texture.generateMipmaps = false;
  renderTarget.stencilBuffer = false;
  renderTarget.depthBuffer = true;
  const depthTexture = new THREE.DepthTexture();
  depthTexture.format = THREE.DepthFormat;
  depthTexture.type = THREE.FloatType;

  // Effect composer
  const effectComposer = new EffectComposer(renderer, renderTarget);
  effectComposer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  effectComposer.setSize(sizes.width, sizes.height);

  // Render pass
  const renderPass = new RenderPass(scene, camera);
  // effectComposer.addPass(renderPass);
  const fxaaPass = new ShaderPass(FXAAShader);
  // effectComposer.addPass(fxaaPass);

  /**
   * Atmosphere
   */
  // const atmoTexture = textureLoader.load('./assets/textures/atmo.png');
  const customMaterial = new THREE.ShaderMaterial({
    uniforms: {
      // glowColor: { type: 'c', value: new THREE.Color(0x9dc8d5) },
      // cameraPosition: { type: 'v3', value: camera.position },
      // planetRadius: { value: GLOBE_RADIUS + 0.045 },
      // planetPosition: { value: new THREE.Vector3(0, 0, 0) },
      // atmosphereRadius: { value: GLOBE_RADIUS + 0.1 },
      // inverseProjection: { value: camera.projectionMatrixInverse },
      // inverseView: { value: camera.matrixWorld },
      // tDiffuse: { value: globeTexture },
      // tDepth: { value: depthTexture },

      c: { type: 'f', value: 1 },
      p: { type: 'f', value: 0.02 },
      glowColor: { type: 'c', value: new THREE.Color(0x5d85f4) },
      viewVector: { type: 'v3', value: camera.position },
    },
    vertexShader: document.getElementById('vertexShader').textContent,
    // vertexShader: atmosphereVertexShader,
    fragmentShader: document.getElementById('fragmentShader').textContent,
    // fragmentShader: atmosphereFragmentShader,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    transparent: true,
  });

  const earthGlow = new THREE.Mesh(globeGeometry.clone(), customMaterial);
  earthGlow.scale.x = earthGlow.scale.y = earthGlow.scale.z = 1.03;
  // earthGlow.rotation.y -= 1.55;

  group.add(earthGlow);
};

const globeTexture1 = textureLoader.load('./assets/textures/000present.jpg');
const bumpMap1 = textureLoader.load('./assets/textures/000presentd.jpg');
const waterLevel1 = 0.47;
createGlobe(meshGroup1, globeTexture1, bumpMap1, waterLevel1);

const globeTexture2 = textureLoader.load('./assets/textures/600Marect.jpg');
const bumpMap2 = textureLoader.load('./assets/textures/600Marectd.jpg');
const waterLevel2 = 0.45;
createGlobe(meshGroup2, globeTexture2, bumpMap2, waterLevel2);

/**
 * Lights
 */
// scene.add(new THREE.AmbientLight(0x666666));

// const light = new THREE.DirectionalLight(0xffffff, 1);
// light.position.set(5, 3, 5);
// scene.add(light);

let light = new THREE.AmbientLight(0x404040, 0.3); // soft white light
scene.add(light);

// const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
// scene.add(directionalLight);

// const pointLight = new THREE.PointLight(0xffffff);
// pointLight.position.set(0, 250, 0);
// scene.add(pointLight);

const dayLight = new THREE.DirectionalLight(0xffffff, 0.5);
dayLight.position.set(0, 0.5, 1).multiplyScalar(30);
dayLight.castShadow = true;
scene.add(dayLight);

const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.2);
hemiLight.color.setHSL(0, 0, 1);
hemiLight.groundColor.setHSL(0, 0, 1);
scene.add(hemiLight);

light = new THREE.DirectionalLight(0xffffff, 0.5);
light.position.set(100, 100, -100);
light.target.position.set(0, 0, 0);
light.castShadow = false;
scene.add(light);

light = new THREE.DirectionalLight(0x404040, 0.5);
light.position.set(100, 100, -100);
light.target.position.set(0, 0, 0);
light.castShadow = false;
scene.add(light);

light = new THREE.DirectionalLight(0x404040, 0.5);
light.position.set(100, 100, -100);
light.target.position.set(0, 0, 0);
light.castShadow = false;
scene.add(light);

light = new THREE.DirectionalLight(0x202040, 0.5);
light.position.set(100, -100, 100);
light.target.position.set(0, 0, 0);
light.castShadow = false;
scene.add(light);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.minDistance = 15;
controls.maxDistance = 35;
controls.noKeys = true;
controls.rotateSpeed = 1.4;

/**
 * Animate
 */
if (isMobile) {
  window.addEventListener('touchstart', animateTerrain);
  window.addEventListener('touchmove', animateTerrain);
} else {
  window.addEventListener('mousemove', animateTerrain);
}

let mouseX = 0;
function animateTerrain(event) {
  if (isMobile) {
    const touch = event.touches[0];

    mouseX = touch.pageX;
  } else {
    mouseX = sizes.width - event.clientX;
  }
}

const clock = new THREE.Clock();

let previousTime = 0;

const tick = () => {
  const elapsedTime = clock.getElapsedTime();

  meshGroup1.rotation.y += 0.01;
  meshGroup2.rotation.y += 0.01;

  controls.update();

  // Render
  renderer.render(scene, camera);
  // effectComposer.render();

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
