import * as THREE from '../../js/three/build/three.module.js';
import { ObjectControls } from '../../js/three/ObjectControls.js';
import { OrbitControls } from '../../js/three/OrbitControls.js';

/** Constants */

const GLOBE_RADIUS = 5;

const isMobile = window.innerWidth < 703;
const shiftRightPercent = 0; //isMobile ? 0 : 0.4;
const shiftBottomPercent = 0; // isMobile ? 0.5 : 0.1;
const cameraZoom = isMobile ? 15 : 12;

const sections = document.querySelectorAll('.content--fixedPageContent');
gsap.to(sections[0], {
  duration: 3,
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

/**
 * Textures
 */

const textureLoader = new THREE.TextureLoader(loadingManager);

const bumpMap = textureLoader.load(
  './assets/textures/bathymetry_bw_composite_4k.jpg'
);

// https://sos.noaa.gov/catalog/datasets/etopo2-topography-and-bathymetry-shaded-colors/
// ftp://public.sos.noaa.gov/land/etopo2/earth_shaded/
// https://sos.noaa.gov/catalog/datasets/etopo2-topography-and-bathymetry-natural-colors/
// ftp://public.sos.noaa.gov/land/etopo2/earth_topo/

// const diffuseMap = textureLoader.load('./assets/textures/4096_color.jpg');
// const diffuseMap = textureLoader.load('./assets/textures/4096.jpg');
const diffuseMap = textureLoader.load(
  './assets/textures/color_etopo1_ice_low.jpg'
);

const normalMapWater = textureLoader.load(
  './assets/textures/water_normals.jpg'
);
normalMapWater.wrapS = normalMapWater.wrapT = THREE.RepeatWrapping;
bumpMap.wrapS = bumpMap.wrapT = THREE.RepeatWrapping;
diffuseMap.wrapS = diffuseMap.wrapT = THREE.RepeatWrapping;
diffuseMap.anisotropy = 16;

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
// backgroundMap.encoding = THREE.sRGBEncoding;

scene.background = backgroundMap;

/**
 * Lights
 */

var light = new THREE.AmbientLight(0x404040, 0.02); // soft white light
scene.add(light);

// var directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
// scene.add(directionalLight);

// var pointLight = new THREE.PointLight(0xffffff);
// pointLight.position.set(0, 250, 0);
// scene.add(pointLight);

const dayLight = new THREE.DirectionalLight(0xffffff);
dayLight.position.set(0, 0.5, 1).multiplyScalar(30);
dayLight.castShadow = true;
scene.add(dayLight);

const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.3);
hemiLight.color.setHSL(0, 0, 1);
hemiLight.groundColor.setHSL(0, 0, 1);
scene.add(hemiLight);

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
renderer.sortObjects = false; // Render in the order the objects were added to the scene
renderer.setClearColor('#f6f9fc', 0);

let globalUniforms = {
  uTime: { value: 0 },

  uSize: { value: 0.005 * renderer.getPixelRatio() },

  color: { value: new THREE.Color(0xffffff) },
  opacity: { value: 0.9 },
};

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
scene.add(camera);

camera.position.set(-100, 30, 7 * cameraZoom);

// gsap.to(camera.position, {
//   duration: 2,
//   x: 300,
//   y: 30,
//   z: 7 * cameraZoom,
//   // ease: 'power2.inOut',
// });

gsap.to(camera.position, {
  duration: 6,
  x: 0,
  y: 0,
  z: cameraZoom,
  // ease: 'power2.inOut',
});

/**
 * Objects
 */

const meshGroup = new THREE.Group();
meshGroup.rotation.y += 3.8;
scene.add(meshGroup);

/**
 * Globe
 */

const globeGeometry = new THREE.SphereGeometry(GLOBE_RADIUS, 512, 256);
const globeMaterial = new THREE.MeshPhongMaterial({
  color: 0xffffff,
  map: diffuseMap,
  displacementMap: bumpMap,
  displacementScale: 1,
  shininess: 0.5,
});

if (!isMobile) {
  globeMaterial.bumpMap = bumpMap;
  globeMaterial.bumpScale = 0.5;
}

const earthGlobe = new THREE.Mesh(globeGeometry, globeMaterial);

earthGlobe.castShadow = true;
earthGlobe.receiveShadow = true;

meshGroup.add(earthGlobe);

/**
 * Water
 */

normalMapWater.repeat.set(2, 1).multiplyScalar(4);

var geometry = new THREE.SphereGeometry(GLOBE_RADIUS, 128, 64);

var waterMaterial = new THREE.MeshPhongMaterial({
  color: 0x000000,
  specular: 0x111111,
  normalMap: normalMapWater,
  shininess: 1024,
  transparent: true,
  opacity: 0.6,
});
waterMaterial.color.setHSL(0.51, 0.75, 0.25);

const waterMesh = new THREE.Mesh(geometry, waterMaterial);
waterMesh.scale.multiplyScalar(1.11);
waterMesh.receiveShadow = true;

meshGroup.add(waterMesh);

// scene.fog = new THREE.Fog(new THREE.Color(0xffaa44), 0.05, 1.3);

/**
 * Atmosphere
 */

var customMaterial = new THREE.ShaderMaterial({
  uniforms: {
    c: { type: 'f', value: 1.0 },
    p: { type: 'f', value: 0.5 },
    glowColor: { type: 'c', value: new THREE.Color(0x5d85f4) },
    viewVector: { type: 'v3', value: camera.position },
  },
  vertexShader: document.getElementById('vertexShader').textContent,
  fragmentShader: document.getElementById('fragmentShader').textContent,
  side: THREE.FrontSide,
  blending: THREE.AdditiveBlending,
  transparent: true,
});

const earthGlow = new THREE.Mesh(globeGeometry.clone(), customMaterial);
earthGlow.scale.x = earthGlow.scale.y = earthGlow.scale.z = 1.18;
scene.add(earthGlow);

/**
 * Controls
 */

let controls = new OrbitControls(camera, canvas);

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
  handleMove(event.clientX, event.clientY, 0);
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

const handleMove = (x, y, isClick) => {
  mouse.x = (x / sizes.width) * 2 - 1;
  mouse.y = -(y / sizes.height) * 2 + 1;

  /**
   * Raycaster
   */
  // Pick objects from view using normalized mouse coordinates

  raycaster.setFromCamera(mouse, camera);

  // const intersects = raycaster.intersectObjects([markers]);

  // if (intersects[0]) {
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
let time = 0;

const tick = () => {
  const elapsedTime = clock.getElapsedTime();

  // Update material
  time += 0.3;
  globalUniforms.uTime.value = time;
  // globalUniforms.color.value.offsetHSL(0.0005, 0, 0);

  controls.update();

  meshGroup.rotation.y += 0.005;

  // Render
  renderer.render(scene, camera);

  // scene.rotation.y -= 0.0015;

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
