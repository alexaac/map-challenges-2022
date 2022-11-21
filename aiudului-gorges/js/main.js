import * as THREE from '../../js/three/build/three.module.js';
import { TrackballControls } from '../../js/three/TrackballControls.js';
import * as dat from '../../js/libs/lil-gui.module.min.js';

import {
  CSS3DObject,
  CSS3DRenderer,
} from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/renderers/CSS3DRenderer.js';

const isMobile = window.innerWidth < 703;

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
const cssScene = new THREE.Scene();

function removeOverlay() {
  scene.remove(overlay);
}

/**
 * Objects
 */

// https://adndevblog.typepad.com/cloud_and_mobile/2015/07/embedding-webpages-in-a-3d-threejs-scene.html
function create3dPage(w, h, position, rotation, url, opacity) {
  var material = new THREE.MeshBasicMaterial({
    color: 0x000000,
    opacity: 0,
    side: THREE.DoubleSide,
  });
  var geometry = new THREE.PlaneGeometry(w, h);
  var plane = new THREE.Mesh(geometry, material);
  plane.position.set(position);
  plane.rotation.set(rotation);
  scene.add(plane);

  var html = [
    `<div style="width: ${w}px; height: ${h}px; opacity: ${opacity}">
      <iframe src="${url}" width=${w} height=${h}></iframe>
    </div>`,
  ].join('\n');
  var div = document.createElement('div');
  div.innerHTML = html;

  var cssObject = new CSS3DObject(div);
  cssObject.position.x = position.x;
  cssObject.position.y = position.y;
  cssObject.position.z = position.z;

  cssObject.rotation.x = rotation.x;
  cssObject.rotation.y = rotation.y;
  cssObject.rotation.z = rotation.z;
  cssScene.add(cssObject);
}

create3dPage(
  700,
  1300,
  new THREE.Vector3(-1150, -200, 400),
  new THREE.Vector3(0, (45 * Math.PI) / 180, 0),
  'https://cheileaiudului.ro',
  0.9
);

create3dPage(
  1300,
  1300,
  new THREE.Vector3(0, -200, 0),
  new THREE.Vector3(0, 0, 0),
  'https://cheileaiudului.ro',
  0.8
);

create3dPage(
  700,
  1300,
  new THREE.Vector3(1150, -200, 400),
  new THREE.Vector3(0, (-45 * Math.PI) / 180, 0),
  'https://cheileaiudului.ro',
  0.9
);

/**
 * Lights
 */
// const directionalLight = new THREE.DirectionalLight('#ffffff', 1);
// directionalLight.position.set(1, 1, 0);
// scene.add(directionalLight);

const pointLight = new THREE.PointLight('#ffffff', 3);
// const pointLight = new THREE.PointLight('#00b3ff', 3);
pointLight.position.x = -1;
pointLight.position.y = 5;
pointLight.position.z = 4.5;
pointLight.intensity = 3.5;
scene.add(pointLight);

gui.add(pointLight.position, 'x');
gui.add(pointLight.position, 'y');
gui.add(pointLight.position, 'z');
gui.add(pointLight, 'intensity');

var ambientLight = new THREE.AmbientLight(0x555555);
scene.add(ambientLight);

var directionalLight = new THREE.DirectionalLight(0xffffff);
directionalLight.position.set(-0.5, 0.5, -1.5).normalize();
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

  cssRenderer.setSize(sizes.width, sizes.height);
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
  45,
  sizes.width / sizes.height,
  1,
  10000
);

camera.position.set(0, 100, 3000);

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
// renderer.setClearColor(0xecf8ff);
renderer.domElement.style.position = 'absolute';
renderer.domElement.style.zIndex = 1;
renderer.domElement.style.top = 0;

var cssRenderer = new CSS3DRenderer();
cssRenderer.setSize(sizes.width, sizes.height);
cssRenderer.domElement.style.position = 'absolute';
cssRenderer.domElement.style.zIndex = 0;
cssRenderer.domElement.style.top = 0;
cssRenderer.domElement.style.margin = 0;
cssRenderer.domElement.style.padding = 0;

document.body.appendChild(cssRenderer.domElement);
cssRenderer.domElement.appendChild(renderer.domElement);

// Controls
const controls = new TrackballControls(camera, canvas);

const clock = new THREE.Clock();

const tick = () => {
  // scene.rotation.y -= 0.015;

  controls.update();

  // Render
  renderer.render(scene, camera);
  cssRenderer.render(cssScene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
