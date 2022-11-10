import * as THREE from '../../js/three/build/three.module.js';
import { OrbitControls } from '../../js/three/OrbitControls.js';
import { TextGeometry } from './TextGeometry.js';
import { FontLoader } from './FontLoader.js';
import * as dat from '../../js/libs/lil-gui.module.min.js';

import {
  CSS2DRenderer,
  CSS2DObject,
} from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/renderers/CSS2DRenderer.js';

import { getD3Data, addLatLon, normalizeColor } from './helpers.js';

import galaxyVertexShader from './shaders/galaxy/vertex.js';
import galaxyFragmentShader from './shaders/galaxy/fragment.js';

/** Constants */
const globeRadius = 4;

/**
 * Base
 */
// Debug
const gui = new dat.GUI();
// gui.hide();

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
 * Fonts
 */
const fontLoader = new FontLoader();

// Canvas
const canvas = document.querySelector('canvas.webgl');

// Scene
const scene = new THREE.Scene();

const group = new THREE.Group();

scene.add(group);

/**
 * Objects
 */

/**
 * Globe
 */

const globeGeometry = new THREE.IcosahedronGeometry(globeRadius, 32, 32);
const globeMaterial = new THREE.MeshPhongMaterial({
  // map: textureLoader.load(
  //   './assets/textures/BlackMarble_2016_01deg.jpg' // https://svs.gsfc.nasa.gov/3895
  // ),
  // map: textureLoader.load('./assets/textures/earth-small.jpg'),
  // bumpMap: textureLoader.load('./assets/textures/earthbump1k.jpg'), // http://planetpixelemporium.com/earth.html
  // bumpScale: 0.6,
  // specularMap: textureLoader.load('./assets/textures/earthspec1k.jpg'),
  // specular: new THREE.Color('grey'),
  shininess: 1,
  transparent: true,
  opacity: 0.0,
  side: THREE.DoubleSide,
  // normalMap: textureLoader.load('./assets/textures/EarthNormal.png'),
  // normalScale: new THREE.Vector2(6, 6),
});

const earthGlobe = new THREE.Mesh(globeGeometry, globeMaterial);
// earthGlobe.rotation.x += 0.7;
// earthGlobe.rotation.y += 0.7;
// group.add(earthGlobe);
/**
 * Galaxy
 */

let geometry = null;
let material = null;
let points = null;
let labels;

let markerInfo = [];

const starsDataHyg = await getD3Data('./data/hygdata_v3.csv');

const cScale = d3
  .scaleLinear()
  .domain([-0.3, 0, 0.6, 0.8, 1.42])
  .range(['#6495ed', '#fff', '#fcff6c', '#ffb439', '#ff4039']);

// const sizeFactorScale = d3
//   .scaleLinear()
//   .domain([1, 2, 3, 5, 6, 7, 8, 9, 10, 11, 12, 14, 16, 30])
//   .range([30, 28, 26, 25, 22, 18, 14, 10, 8, 6, 4, 3, 2, 2]);

const sizeFactorScale = d3
  .scaleLinear()
  .domain([1, 2, 3, 5, 6, 7, 8, 30])
  .range([12, 10, 8, 6, 3, 2, 1, 1]);

let labelsGroup = new THREE.Group();
group.add(labelsGroup);

const cleanedStars = addLatLon(starsDataHyg, 30);

// console.log(cleanedStars.features[0]);
const stars = cleanedStars.features;
// const stars = cleanedStars.features.slice(0, 100);
const startCount = stars.length;

const generateGalaxy = () => {
  // console.log(labelsGroup);

  const to_remove = [];
  labelsGroup.traverse(function (child) {
    to_remove.push(child);
  });
  for (var i = 0; i < to_remove.length; i++) labelsGroup.remove(to_remove[i]);

  globalUniforms.uSizeFactor.value = sizeFactorScale(
    globalUniforms.uMagLimit.value
  );

  console.log(globalUniforms.uMagLimit.value);
  console.log(globalUniforms.uSizeFactor.value);

  const rScale = d3
    .scaleLinear()
    .domain(d3.extent(stars, (d) => d.properties.mag))
    .range([16, 0]);

  document.querySelector('#stars-no').innerHTML = startCount;

  if (points !== null) {
    geometry.dispose();
    material.dispose();
    group.remove(points);
  }
  // console.log(labelsGroup);

  function calcPosFromLatLonRad(lat, lon, radius) {
    var phi = (90 - lat) * (Math.PI / 180);
    var theta = lon * (Math.PI / 180);

    // let x = -(radius * Math.sin(phi) * Math.cos(theta));
    // let z = radius * Math.sin(phi) * Math.sin(theta);
    // let y = radius * Math.cos(phi);

    // return [x, y, z];

    return new THREE.Vector3(
      -radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.cos(phi),
      radius * Math.sin(phi) * Math.sin(theta)
    );
  }

  /**
   * Geometry
   */
  geometry = new THREE.BufferGeometry();

  const positions = new Float32Array(startCount * 3);
  const colors = new Float32Array(startCount * 3);
  const sizes = new Float32Array(startCount * 1);
  const scales = new Float32Array(startCount * 1);
  const magnitudes = new Float32Array(startCount * 1);

  for (let i = 0; i < startCount; i++) {
    const i3 = i * 3;

    // Position
    const radius = Math.random() * globeRadius;

    let pos = calcPosFromLatLonRad(
      stars[i].properties.lat,
      stars[i].properties.lon,
      globeRadius + 0.1
    );

    positions[i3] = pos.x;
    positions[i3 + 1] = pos.y;
    positions[i3 + 2] = pos.z;

    // positions[i3] = stars[i].geometry.coordinates[0];
    // positions[i3 + 1] = stars[i].geometry.coordinates[1];
    // positions[i3 + 2] = stars[i].geometry.coordinates[2];

    // Color
    const scalesColor = normalizeColor(
      d3.color(cScale(stars[i].properties.color)).formatHex()
    );

    colors[i3] = scalesColor[0];
    colors[i3 + 1] = scalesColor[1];
    colors[i3 + 2] = scalesColor[2];

    // Size
    sizes[i] = stars[i].properties ? rScale(stars[i].properties.mag) : 1;

    // information on points
    let starInfo = stars[i].properties;
    starInfo.crd = pos;

    // console.log(markerInfo);

    markerInfo.push(starInfo);

    if (stars[i].properties.name) {
      const text = document.createElement('div');
      text.className = 'label';
      text.textContent = stars[i].properties.name;

      const label = new CSS2DObject(text);
      label.position.copy(pos);
      labelsGroup.add(label);
    }

    // Scale
    scales[i] = Math.random();

    // Magnitude
    magnitudes[i] = stars[i].properties.mag;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  // geometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));
  geometry.setAttribute('aMagnitude', new THREE.BufferAttribute(magnitudes, 1));

  /**
   * Material
   */
  material = new THREE.ShaderMaterial({
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexColors: true,
    vertexShader: galaxyVertexShader,
    fragmentShader: galaxyFragmentShader,
    side: THREE.DoubleSide,
    uniforms: globalUniforms,
  });

  /**
   * Points
   */
  points = new THREE.Points(geometry, material);

  // console.log(points);

  group.add(points);
};

// const matcapTexture = textureLoader.load('./assets/textures/13.png');

// fontLoader.load('./css/static/helvetiker_regular.typeface.json', (font) => {
//   console.log('font loaded');

//   const textGeometry = new TextGeometry(`Hello Three.js`, {
//     font,
//     size: 2,
//     height: 1,
//     curveSegments: 4,
//     bevelEnabled: true,
//     bevelThickness: 0.03,
//     bevelSize: 0.02,
//     bevelOffset: 0,
//     bevelSegments: 5,
//   });
//   textGeometry.center();

//   const textMaterial = new THREE.MeshMatcapMaterial({ matcap: matcapTexture });
//   const text = new THREE.Mesh(textGeometry, textMaterial);

//   group.add(text);
// });

const gridGroup = new THREE.Group();
group.add(gridGroup);

const LINE_THICKNESS = 0.003;
const HAG = 0.01; // Sleight distance above globe that longitude/latitude lines are drawn.

// Lines of longitude
for (let n = 0; n < 24; ++n) {
  const line = new THREE.CylinderGeometry(
    globeRadius + HAG,
    globeRadius + HAG,
    LINE_THICKNESS,
    50,
    1,
    true
  );
  line.translate(0, -LINE_THICKNESS / 2, 0);
  line.rotateX(Math.PI / 2);
  line.rotateY((n * Math.PI) / 12);
  const mesh = new THREE.Mesh(
    line,
    new THREE.MeshBasicMaterial({ color: 0x8f87a8, side: THREE.BackSide })
  );
  gridGroup.add(mesh);
}

// Lines of latitude
for (let n = 1; n < 12; ++n) {
  const lat = ((n - 6) * Math.PI) / 12;
  const r = globeRadius * Math.cos(lat);
  const y = globeRadius * Math.sin(lat);
  const r1 = r - (LINE_THICKNESS * Math.sin(lat)) / 2;
  const r2 = r + (LINE_THICKNESS * Math.sin(lat)) / 2;
  const line = new THREE.CylinderGeometry(
    r1 + HAG,
    r2 + HAG,
    Math.cos(lat) * LINE_THICKNESS,
    50,
    8,
    true
  );
  line.translate(0, (-Math.cos(lat) * LINE_THICKNESS) / 2 + y, 0);
  const mesh = new THREE.Mesh(
    line,
    new THREE.MeshBasicMaterial({ color: 0x8f87a8, side: THREE.BackSide })
  );
  gridGroup.add(mesh);
}

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
camera.position.set(0.8, -1.2, -1.4);

// camera.position.set(2, 0, -12);
// camera.position.set(0, -3.2, 3);
// camera.lookAt(0, 6, 0);

// gui.add(camera.position, 'x').min(-10).max(10).step(1);
// gui.add(camera.position, 'y').min(-10).max(10).step(1);
// gui.add(camera.position, 'z').min(-10).max(10).step(1);

scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.autoRotate = false;
controls.autoRotateSpeed *= 0.5;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

let labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0px';
document.body.appendChild(labelRenderer.domElement);

const countStars = () => {
  const selected = stars.filter(
    (star) => star.properties.mag < globalUniforms.uMagLimit.value
  );

  document.querySelector('#stars-no').innerHTML = selected.length;
};

let globalUniforms = {
  uTime: { value: 0 },
  uPixelRatio: { value: renderer.getPixelRatio() },
  uSizeFactor: { value: sizeFactorScale(30) },
  uMagLimit: { value: 30 },
};
// gui
//   .add(globalUniforms.uSizeFactor, 'value')
//   .min(0)
//   .max(60)
//   .step(0.01)
//   .name('Size')
//   .listen();
gui
  .add(globalUniforms.uMagLimit, 'value')
  .min(0)
  .max(30)
  .step(0.01)
  .name('Magnitude')
  .onFinishChange(countStars)
  .listen();

generateGalaxy();

// gui.hide();
// gui.close();

// /**
//  * Mouse
//  */
// const mouse = new THREE.Vector2();
// let currentIntersect = null;

// const handleMouseMove = (event) => {
//   handleMove(event.clientX, event.clientY, 0);
// };

// const handleClick = (event) => {
//   handleMove(event.clientX, event.clientY, 1);
// };

// const handleTouchMove = (event) => {
//   var touch = event.touches[0];
//   var x = touch.clientX;
//   var y = touch.clientY;

//   handleMove(x, y, 1);
// };

// const handleMove = (x, y, isClick) => {
//   mouse.x = (x / sizes.width) * 2 - 1;
//   mouse.y = -(y / sizes.height) * 2 + 1;

//   if (!isClick) {
//     group.rotation.x -= mouse.y * 0.05;
//   }
// };

// if (isMobile) {
//   window.addEventListener('touchstart', handleTouchMove);
//   window.addEventListener('touchmove', handleTouchMove);
// } else {
//   // window.addEventListener('click', (event) => {
//   //   label.element.classList.add('hidden');
//   // });
//   window.addEventListener('click', handleClick);
//   window.addEventListener('mousemove', handleMouseMove);
//   // window.addEventListener('mousemove', handleMouseMove);
// }

const rotateBtn = document.querySelector('#rotate-globe');
const stopBtn = document.querySelector('#stop-globe');
const animateMagnitudeBtn = document.querySelector('#run-mag');
let animate = false;

rotateBtn.addEventListener('click', (event) => {
  rotateBtn.classList.add('hidden');
  stopBtn.classList.remove('hidden');
  controls.autoRotate = true;
  animate = true;
});

stopBtn.addEventListener('click', (event) => {
  rotateBtn.classList.remove('hidden');
  stopBtn.classList.add('hidden');
  controls.autoRotate = false;
  animate = false;
});

animateMagnitudeBtn.addEventListener('click', () => {
  startSequence();
});

/**
 * Animate
 */
const clock = new THREE.Clock();

let sizeFactorLimit = 16;
let sign = 1;

const tick = () => {
  const elapsedTime = clock.getElapsedTime();

  // Update material
  material.uniforms.uTime.value = elapsedTime;
  material.uniforms.uMagLimit.value = globalUniforms.uMagLimit.value;

  material.uniforms.uSizeFactor.value = sizeFactorScale(
    globalUniforms.uMagLimit.value
  );

  // if (animate === true) {
  //   if (
  //     material.uniforms.uSizeFactor.value > sizeFactorLimit ||
  //     material.uniforms.uSizeFactor.value < 12
  //   ) {
  //     sign = -sign;
  //   }
  //   material.uniforms.uSizeFactor.value += 0.2 * sign;
  // }

  // Update controls
  controls.update();

  // Render
  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();

let running = false;

const startSequence = () => {
  if (running) return;

  globalUniforms.uMagLimit.value = 0;

  gsap.to(globalUniforms.uMagLimit, {
    delay: 0,
    duration: 10,
    value: '+=30',
    ease: 'linear',
    // ease: SlowMo.ease.config(5.0, 2.0, true),
    // ease: 'expoScale(0.5, 3)',
    onUpdate: () => {
      // console.log('on update ', globalUniforms.uMagLimit.value);
      countStars();
    },
    onStart: () => {
      // console.log('on start ', globalUniforms.uMagLimit.value);
      // running = true;
    },
    onComplete: () => {
      // console.log('on complete ', globalUniforms.uMagLimit.value);

      running = false;
      // startSequence();
    },
  });
};

startSequence();

window.addEventListener('keydown', (event) => {
  if (event.key === 'h') {
    if (gui._hidden) {
      gui.show();
      document.querySelector('.nav--navigation').classList.remove('hidden');
      document.querySelector('.side-pannel').classList.remove('hidden');
      document
        .querySelector('.main--contentWrapper')
        .classList.remove('hidden');
      document
        .querySelector('.content--contentWrapper')
        .classList.remove('hidden');
    } else {
      gui.hide();
      document.querySelector('.nav--navigation').classList.add('hidden');
      document.querySelector('.side-pannel').classList.add('hidden');
      document.querySelector('.main--contentWrapper').classList.add('hidden');
      document
        .querySelector('.content--contentWrapper')
        .classList.add('hidden');
    }
  }
});
