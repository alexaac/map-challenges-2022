import * as THREE from '../../js/three/build/three.module.js';
import { OrbitControls } from '../../js/three/OrbitControls.js';
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
const texture = textureLoader.load('./assets/textures/earth.jpg');
const alpha = textureLoader.load('./assets/textures/alpha.png');

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

// https://svs.gsfc.nasa.gov/3895
const stars = './assets/textures/starmap_4k.jpg';

const backgroundMap = textureLoader.load(stars);
backgroundMap.mapping = THREE.EquirectangularReflectionMapping;
backgroundMap.encoding = THREE.sRGBEncoding;

scene.background = backgroundMap;

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
 * Objects
 */

// var fgeometry = new THREE.BoxGeometry(0.1, 4, 0.1);
// var material = new THREE.MeshPhongMaterial({ color: 0x6a6962 });
// var cube = new THREE.Mesh(fgeometry, material);
// cube.position.set(-2, 0, 0);
// cube.rotation.set(0, Math.PI / 2, 0);
// scene.add(cube);

// cube = cube.clone();
// cube.position.set(2, 0, 0);
// scene.add(cube);

// cube = cube.clone();
// cube.position.set(0, 2, 0);
// cube.rotation.set(Math.PI / 2, 0, Math.PI / 2);
// scene.add(cube);

// cube = cube.clone();
// cube.position.set(0, -2, 0);
// scene.add(cube);

const geometry = new THREE.PlaneBufferGeometry(3, 2.12, 32, 32);

// Meshes
let index = 0;
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

// Get the data
const data = await getData('data/categories.json');

data.forEach((elem, i) => {
  if (elem.parent) {
    const demoImg = textureLoader.load(
      `./assets/textures/${elem.name}_texture.png`
    );

    const section = document.createElement('section');
    section.className = 'section';
    section.id = `section-${index}`;
    div.appendChild(section);

    const material = new THREE.MeshStandardMaterial({
      color: 'gray',
      map: texture,
      // displacementMap: height,
      // displacementScale: parameters.displacementScale,
      alphaMap: alpha,
      transparent: true,
      depthTest: false,
    });

    // Mesh
    const mesh = new THREE.Mesh(geometry, material);
    mesh.material.side = THREE.DoubleSide;

    mesh.properties = elem;
    mesh.properties.demoImg = demoImg;
    mesh.index = index;

    scene.add(mesh);

    sectionMeshes.push(mesh);
  }
});

sectionMeshes[0].visible = false;
// Animate overlay
gsap.to(sectionMeshes[0], {
  delay: 1,
  duration: 4,
  visible: true,
});

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
camera.position.x = 0;
camera.position.y = 0;
camera.position.z = 2;

scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);

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
    var touch = event.touches[0];

    mouseX = touch.pageX;
  } else {
    mouseX = sizes.width - event.clientX;
  }
}

const clock = new THREE.Clock();

let previousTime = 0;

const tick = () => {
  const elapsedTime = clock.getElapsedTime();

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
