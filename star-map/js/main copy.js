import * as THREE from '../../js/three/build/three.module.js';
import { ObjectControls } from '../../js/three/ObjectControls.js';
import { OrbitControls } from '../../js/three/OrbitControls.js';

import { getD3Data, addLatLon } from './helpers.js';

import {
  CSS2DRenderer,
  CSS2DObject,
} from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/renderers/CSS2DRenderer.js';

import galaxyVertexShader from './shaders/galaxy/vertex.js';
import galaxyFragmentShader from './shaders/galaxy/fragment.js';

/** Constants */
const globeRadius = 5.5;

const isMobile = window.innerWidth < 703;
const shiftRightPercent = isMobile ? 0 : 0.4;
const shiftBottomPercent = isMobile ? 0.5 : 0.1;
const cameraZoom = isMobile ? 35 : 18;

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
const dotTexture = textureLoader.load('./assets/textures/plane64teal.png');
const noiseTexture = textureLoader.load('./assets/textures/clouds.png');

/**
 * Base
 */

// Canvas
const canvas = document.querySelector('canvas.webgl');

// Scene
const scene = new THREE.Scene();

/**
 * Lights
 */
var light = new THREE.AmbientLight(0x404040, 3); // soft white light
scene.add(light);

var directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
scene.add(directionalLight);

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
  uDotTexture: { value: dotTexture },
  uNoiseTexture: { value: noiseTexture },
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

const globeGeometry = new THREE.IcosahedronGeometry(globeRadius, 32, 32);
const globeMaterial = new THREE.MeshPhongMaterial({
  // map: textureLoader.load(
  //   './assets/textures/BlackMarble_2016_01deg.jpg' // https://svs.gsfc.nasa.gov/3895
  // ),
  map: textureLoader.load('./assets/textures/earth-small.jpg'),
  bumpMap: textureLoader.load('./assets/textures/earthbump1k.jpg'), // http://planetpixelemporium.com/earth.html
  bumpScale: 0.6,
  specularMap: textureLoader.load('./assets/textures/earthspec1k.jpg'),
  specular: new THREE.Color('grey'),
  shininess: 1,
  normalMap: textureLoader.load('./assets/textures/EarthNormal.png'),
  normalScale: new THREE.Vector2(6, 6),
});

const earthGlobe = new THREE.Mesh(globeGeometry, globeMaterial);
// earthGlobe.rotation.x += 0.7;
// earthGlobe.rotation.y += 0.7;
// scene.add(earthGlobe);

/**
 * Stars
 * */

function calcPosFromLatLonRad(lat, lon, radius) {
  var phi = (90 - lat) * (Math.PI / 180);
  var theta = (lon + 180) * (Math.PI / 180);

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

const starsDataHyg = await getD3Data('data/hygdata_v3.csv');
const cleanedStars = addLatLon(starsDataHyg);
console.log(cleanedStars.features[0]);

const markerCount = cleanedStars.features.length;
let markerInfo = []; // information on markers

const stars = cleanedStars.features;

console.log(stars);

let markerGeometry = new THREE.PlaneGeometry(0.08, 0.08); // point size

const positions = new Float32Array(markerCount * 3);
const colors = new Float32Array(markerCount * 3);
const scales = new Float32Array(markerCount * 1);
const insideColor = new THREE.Color('#ff6030');
const outsideColor = new THREE.Color('#1b3984');
const radius = 1;

for (let i = 0; i < markerCount; i++) {
  const i3 = i * 3;

  // Position

  positions[i3] = stars[i].geometry.coordinates[0];
  positions[i3 + 1] = stars[i].geometry.coordinates[1];
  positions[i3 + 2] = stars[i].geometry.coordinates[2];

  // Color
  const mixedColor = insideColor.clone();
  mixedColor.lerp(outsideColor, (Math.random() * radius) / radius);

  colors[i3] = mixedColor.r;
  colors[i3 + 1] = mixedColor.g;
  colors[i3 + 2] = mixedColor.b;

  // Scale
  scales[i] = Math.random();
}

markerGeometry.setAttribute(
  'position',
  new THREE.BufferAttribute(positions, 3)
);
markerGeometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
markerGeometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));

// Material
const markerMaterial = new THREE.ShaderMaterial({
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  vertexColors: true,
  vertexShader: galaxyVertexShader,
  fragmentShader: galaxyFragmentShader,
  uniforms: {
    uSize: { value: 30 * renderer.getPixelRatio() },
    uTime: { value: 0 },
  },
});

/**
 * Points
 */
let markers = new THREE.Points(markerGeometry, markerMaterial);

console.log(markers);
scene.add(markers);

// let markers = new THREE.InstancedMesh(
//   markerGeometry,
//   markerMaterial,
//   markerCount
// );

// new THREE.MeshBasicMaterial({
//   color: 0xff3232,
//   onBeforeCompile: (shader) => {
//     shader.uniforms.uTime = globalUniforms.uTime;
//     shader.uniforms.uSize = globalUniforms.uSize;
//     shader.uniforms.uDotTexture = globalUniforms.uDotTexture;
//     shader.uniforms.uNoiseTexture = globalUniforms.uNoiseTexture;
//     shader.depthWrite = false;

//     shader.blending = THREE.AdditiveBlending;
//     shader.vertexShader = `
//       attribute float phase;
//       attribute vec3 aColor;

//       varying float vPhase;
//       varying vec3 vColor;

//       ${shader.vertexShader}
//       `.replace(
//       `#include <begin_vertex>`,
//       `#include <begin_vertex>
//         vPhase = phase; // de-synch of ripples
//         vColor = aColor;
//       `
//     );

//     shader.fragmentShader = `
//       uniform float uTime;
//       uniform sampler2D uDotTexture;
//       uniform sampler2D uNoiseTexture;

//       varying float vPhase;
//       varying vec3 vColor;

//       ${shader.fragmentShader}
//       `.replace(
//       `vec4 diffuseColor = vec4( diffuse, opacity );`,
//       `
//         // vec2 lUv = vUv;
//         // // vec2 lUv = (vUv - 0.8) * 2.;

//         // float val = 0.;
//         // float lenUv = length(lUv);
//         // // val = max(val, 1. - step(0.25, lenUv)); // central circle
//         // // val = max(val, step(0.4, lenUv) - step(0.5, lenUv)); // outer circle

//         // float tShift = fract(uTime * 0.2 + 2.0*vPhase);
//         // val = max(val, step(0.4 + (tShift * 0.6), lenUv) - step(0.5 + (tShift * 0.5), lenUv)); // ripple

//         // vec4 textureColor = texture2D(uDotTexture, lUv);
//         // vec4 noiseColor = texture2D(uNoiseTexture, vec2(lUv.x + uTime, lUv.y));
//         // float noiseAlpha = pow(noiseColor.r, 3.0);
//         // vec4 finalColor = vec4(textureColor.rgb, (textureColor.a * 1.0 * 1.0) * 1.0);

//         // vec4 diffuseColor = vec4( finalColor.rgb, opacity );
//         // if (val > 0.5) {
//         //   diffuseColor =  vec4(1.,1.,1., 0.05);

//         // }

//         float strength = distance(gl_PointCoord, vec2(0.5));
//         strength = 1.0 - strength;
//         strength = pow(strength, 10.0);

//         // Final
//         vec3 color = mix(vec3(0.0), vColor, strength);

//         vec4 diffuseColor = vec4(color, 1.0);

//         `
//     );
//   },
// });

// markerMaterial.defines = { USE_UV: ' ' }; // needed to be set to be able to work with UVs

let starPoint = new THREE.Object3D();
let phase = [];
// for (let i = 0; i < markerCount; i++) {
//   // let pos = calcPosFromLatLonRad(
//   //   stars[i].properties.lat,
//   //   stars[i].properties.lon,
//   //   globeRadius
//   // );

//   let pos = {
//     x: stars[i].geometry.coordinates[0],
//     y: stars[i].geometry.coordinates[1],
//     z: stars[i].geometry.coordinates[2],
//   };

//   starPoint.position.set(pos.x, pos.y, pos.z);
//   starPoint.lookAt(starPoint.position.clone().setLength(globeRadius + 1));
//   starPoint.updateMatrix();
//   markers.setMatrixAt(i, starPoint.matrix);
//   phase.push(Math.random());

//   let starInfo = stars[i].properties;
//   starInfo.crd = starPoint.position.clone();

//   // console.log(markerInfo);

//   markerInfo.push(starInfo);
// }

// markerGeometry.setAttribute(
//   'phase',
//   new THREE.InstancedBufferAttribute(new Float32Array(phase), 1)
// );

// scene.add(markers);

// <Label>
let labelDiv = document.getElementById('markerLabel');
let closeBtn = document.getElementById('closeButton');

closeBtn.addEventListener('click', (event) => {
  labelDiv.classList.add('hidden');
});

let label = new CSS2DObject(labelDiv);
label.userData = {
  cNormal: new THREE.Vector3(),
  cPosition: new THREE.Vector3(),
  mat4: new THREE.Matrix4(),
  trackVisibility: () => {
    // the closer to the edge, the less opacity
    let ud = label.userData;
    ud.cNormal
      .copy(label.position)
      .normalize()
      .applyMatrix3(earthGlobe.normalMatrix);
    ud.cPosition
      .copy(label.position)
      .applyMatrix4(
        ud.mat4.multiplyMatrices(
          camera.matrixWorldInverse,
          earthGlobe.matrixWorld
        )
      );
    let d = ud.cPosition.negate().normalize().dot(ud.cNormal);
    d = smoothstep(0.2, 0.7, d);
    label.element.style.opacity = d;

    // https://github.com/gre/smoothstep/blob/master/index.js
    function smoothstep(min, max, value) {
      var x = Math.max(0, Math.min(1, (value - min) / (max - min)));
      return x * x * (3 - 2 * x);
    }
  },
};
scene.add(label);
// </Label>

/**
 * Camera
 */

const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.1,
  100
);
camera.position.x = 3;
camera.position.y = 3;
camera.position.z = 3;
scene.add(camera);

/**
 * Controls
 */

let controls = new OrbitControls(camera, canvas);

// controls.enablePan = true;
// controls.enableZoom = true;
// controls.minDistance = -20;
// controls.maxDistance = 20;
// controls.enableDamping = true;
// controls.autoRotate = false;
// controls.autoRotateSpeed *= 0.25;

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

let divMag = document.getElementById('magnitude');
const handleMove = (x, y, isClick) => {
  mouse.x = (x / sizes.width) * 2 - 1;
  mouse.y = -(y / sizes.height) * 2 + 1;

  /**
   * Raycaster
   */
  // Pick objects from view using normalized mouse coordinates

  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObjects([markers]);

  if (intersects[0]) {
    currentIntersect = intersects[0];

    if (currentIntersect) {
      if (isClick) {
        let iid = currentIntersect.instanceId;
        let mi = markerInfo[iid];

        divMag.innerHTML = '';
        Object.keys(mi).forEach((key) => {
          if (key !== 'crd') {
            divMag.innerHTML += `
            ${key}: ${mi[key]} <br/>
            `;
          }
        });

        label.position.copy(mi.crd);
        // label.element.animate(
        //   [
        //     { width: '0px', height: '0px', marginTop: '0px', marginLeft: '0px' },
        //     {
        //       width: '230px',
        //       height: '50px',
        //       marginTop: '-25px',
        //       maginLeft: '120px',
        //     },
        //   ],
        //   {
        //     duration: 250,
        //   }
        // );
        label.element.classList.remove('hidden');
      }
      document.body.classList.remove('grabbable');
      document.body.classList.add('pointer');
    }
  } else {
    // console.log('----------------- no intersection');
    document.body.classList.remove('pointer');
    document.body.classList.add('grabbable');

    currentIntersect = null;

    // if (isMobile) {
    // label.element.classList.add('hidden');
    // }
    // scrollingArea.classList.remove('no-pointer-events');

    // document.elementFromPoint(x, y).click();
  }
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

const tick = () => {
  const elapsedTime = clock.getElapsedTime();

  globalUniforms.uTime.value = elapsedTime;
  controls.update();
  label.userData.trackVisibility();

  // Render
  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);

  // scene.rotation.y -= 0.0015;

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
