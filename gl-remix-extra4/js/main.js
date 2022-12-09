// After https://www.shadertoy.com/view/7lfGzl

import * as THREE from '../../js/three/build/three.module.js';
import { ObjectControls } from '../../js/three/ObjectControls.js';
import { OrbitControls } from '../../js/three/OrbitControls.js';

import {
  App,
  VERTEX_SHADER,
  BUFFER_B_FRAG,
  BUFFER_A_FRAG,
  BUFFER_FINAL_FRAG,
  BufferManager,
  BufferShader,
} from './App.js';

import { interpolateColour, rgba2hex } from './lerp.js';

/** Constants */

const GLOBE_RADIUS = 0.2;

const mouse = new THREE.Vector2();

const isMobile = window.innerWidth < 703;
const shiftRightPercent = 0; //isMobile ? 0 : 0.4;
const shiftBottomPercent = 0; // isMobile ? 0.5 : 0.1;
const cameraZoom = isMobile ? 1 : 1;

const sections = document.querySelectorAll('.content--fixedPageContent');
gsap.to(sections[0], {
  duration: 3,
  opacity: 1,
  visibility: 'visible',
  ease: 'power2.inOut',
});

const title = document.querySelector('.content--contentWrapper h1');
let color = interpolateColour('#2523e8', '#ffd439', 0.5);

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

const channel0 = textureLoader.load('./assets/textures/channel1.png');

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

var light = new THREE.AmbientLight(0x404040, 0.002); // soft white light
scene.add(light);

// var directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
// scene.add(directionalLight);

// var pointLight = new THREE.PointLight(0xffffff);
// pointLight.position.set(0, 250, 0);
// scene.add(pointLight);

const dayLight = new THREE.DirectionalLight(0xffffff, 0.5);
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

const resolution = new THREE.Vector3(
  sizes.width,
  sizes.height,
  window.devicePixelRatio
);

const mousePosition = new THREE.Vector4();
let counter = 0;

document.addEventListener('mousedown', () => {
  mousePosition.setZ(1);
  counter = 0;
});

document.addEventListener('mouseup', () => {
  mousePosition.setZ(0);
});

document.addEventListener('mousemove', (event) => {
  mousePosition.setX(event.clientX);
  mousePosition.setY(sizes.height - event.clientY);
});

let bufferUniforms = {
  iTime: { value: 0 },

  c: { type: 'f', value: 1.0 },
  p: { type: 'f', value: 0.5 },
  glowColor: { type: 'c', value: new THREE.Color(0x5d85f4) },
  // viewVector: { type: 'v3', value: camera.position },

  iResolution: {
    value: resolution,
  },
  iMouse: {
    value: mousePosition,
  },
  iChannel0: {
    value: channel0,
  },
  iChannel1: {
    value: null,
  },
  iChannel2: {
    value: null,
  },
};

let bufferUniformsA = {
  iFrame: {
    value: 0,
  },
  iResolution: {
    value: resolution,
  },
  iMouse: {
    value: mousePosition,
  },
  iChannel0: {
    value: null,
  },
  iChannel1: {
    value: null,
  },
};

let bufferUniformsB = {
  iFrame: {
    value: 0,
  },
  iResolution: {
    value: resolution,
  },
  iMouse: {
    value: mousePosition,
  },
  iChannel0: {
    value: null,
  },
};

const targetA = new BufferManager(renderer, scene, {
  width: sizes.width,
  height: sizes.height,
});
const targetB = new BufferManager(renderer, scene, {
  width: sizes.width,
  height: sizes.height,
});
const targetC = new BufferManager(renderer, scene, {
  width: sizes.width,
  height: sizes.height,
});

// document.addEventListener('DOMContentLoaded', () => {
//   new App(renderer, camera, scene, canvas, sizes.width, sizes.height).start();
// });

// document.addEventListener('DOMContentLoaded', () => {
//   new App(canvas, sizes.width, sizes.height).start();
// });

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
// const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

scene.add(camera);

camera.position.set(0, 0, cameraZoom);

// camera.position.set(-100, 30, 7 * cameraZoom);

// gsap.to(camera.position, {
//   duration: 2,
//   x: 300,
//   y: 30,
//   z: 7 * cameraZoom,
//   // ease: 'power2.inOut',
// });

// gsap.to(camera.position, {
//   duration: 6,
//   x: 0,
//   y: 0,
//   z: cameraZoom,
//   // ease: 'power2.inOut',
// });

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
  displacementScale: 0, //0.02,
  shininess: 0.5,
});

if (!isMobile) {
  globeMaterial.bumpMap = bumpMap;
  globeMaterial.bumpScale = 0.1;
}

const earthGlobe = new THREE.Mesh(globeGeometry, globeMaterial);

earthGlobe.castShadow = true;
earthGlobe.receiveShadow = true;

meshGroup.add(earthGlobe);

/**
 * Buffer A
 */

// const materialA = new THREE.ShaderMaterial({
//   fragmentShader: fragmentShaderA,
//   vertexShader: bufferVertexShader,
//   uniforms: bufferUniformsA,
// });
// const sceneA = new THREE.Scene();
// sceneA.add(new THREE.Mesh(new THREE.PlaneBufferGeometry(2, 2), materialA));

const bufferA = new BufferShader(scene, BUFFER_A_FRAG, bufferUniformsA);

/**
 * Buffer B
 */

// const materialB = new THREE.ShaderMaterial({
//   fragmentShader: fragmentShaderB,
//   vertexShader: bufferVertexShader,
//   uniforms: bufferUniformsB,
// });
// const sceneB = new THREE.Scene();
// sceneB.add(new THREE.Mesh(new THREE.PlaneBufferGeometry(2, 2), materialB));

const bufferB = new BufferShader(scene, BUFFER_B_FRAG, bufferUniformsB);

/**
 * Buffer Image
 */

const bufferImage = new BufferShader(scene, BUFFER_FINAL_FRAG, bufferUniforms);

/**
 * Water
 */

normalMapWater.repeat.set(2, 1).multiplyScalar(4);

var geometry = new THREE.SphereGeometry(GLOBE_RADIUS, 128, 64);
// https://alteredqualia.com/xg/examples/earth_bathymetry.html
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
waterMesh.scale.multiplyScalar(1.0);
// waterMesh.scale.multiplyScalar(1.00025);

waterMesh.receiveShadow = true;

meshGroup.add(waterMesh);

// scene.fog = new THREE.Fog(new THREE.Color(0xffffff), 0.01, 1.2);

/**
 * Atmosphere
 */

var atmosphereMaterial = new THREE.ShaderMaterial({
  uniforms: bufferUniforms,
  vertexShader: VERTEX_SHADER, // document.getElementById('vertexShader').textContent,
  fragmentShader: BUFFER_FINAL_FRAG, // document.getElementById('fragmentShader').textContent,
  side: THREE.FrontSide,
  blending: THREE.AdditiveBlending,
  transparent: true,
});

const earthGlow = new THREE.Mesh(globeGeometry.clone(), atmosphereMaterial);
earthGlow.scale.x = earthGlow.scale.y = earthGlow.scale.z = 1.002;
meshGroup.add(earthGlow);

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

window.addEventListener('mousedown', () => {
  mouse.z = 1;
});

window.addEventListener('mouseup', () => {
  mouse.z = 0;
});

/**
 * Animate
 */
const clock = new THREE.Clock();
let time = 0;
let colorA = '#17cce9',
  colorB = '#492cdx6';

const tick = () => {
  const elapsedTime = clock.getElapsedTime();

  // Update material
  // time += 0.3;

  bufferUniformsA['iFrame'].value = counter++;

  bufferUniformsA['iChannel0'].value = targetA.readBuffer.texture;
  targetA.render(bufferA.scene, camera);

  bufferUniformsB['iChannel0'].value = targetB.readBuffer.texture;
  targetB.render(bufferB.scene, camera);

  bufferUniforms['iChannel1'].value = targetA.readBuffer.texture;
  bufferUniforms['iTime'].value = 0;
  targetC.render(bufferImage.scene, camera);

  // controls.update();

  meshGroup.rotation.y += 0.004;

  let pct = Math.abs(Math.sin(elapsedTime * 0.8));
  color = interpolateColour(colorA, colorB, pct);
  const hexColor = `#${rgba2hex(color)}`;
  title.style.color = hexColor;

  // Render
  renderer.render(scene, camera);

  // scene.rotation.y -= 0.0015;
  // camera.rotation.z += 0.005;

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();

const rotateBtn = document.querySelector('#rotate-globe');
const stopBtn = document.querySelector('#stop-globe');

// rotateBtn.addEventListener('click', (event) => {
//   rotateBtn.classList.add('hidden');
//   stopBtn.classList.remove('hidden');

//   meshGroup.rotation.y = 0;
//   bufferUniforms['iTime'].value = 0;

//   controls.autoRotate = true;
// });

// stopBtn.addEventListener('click', (event) => {
//   rotateBtn.classList.remove('hidden');
//   stopBtn.classList.add('hidden');
//   controls.autoRotate = false;
// });
