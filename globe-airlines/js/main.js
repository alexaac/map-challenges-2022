import * as THREE from '../../js/three/build/three.module.js';
import { ObjectControls } from '../../js/three/ObjectControls.js';
import { OrbitControls } from '../../js/three/OrbitControls.js';

import { geoInterpolate } from 'https://cdn.skypack.dev/d3-geo@3';

import {
  CSS2DRenderer,
  CSS2DObject,
} from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/renderers/CSS2DRenderer.js';

import { getData, formatAirportData, formatAirlineData } from './helpers.js';

import atmoVertexShader from './shaders/atmo/vertex.js';
import atmoFragmentShader from './shaders/atmo/fragment.js';
import splineVertexShader from './shaders/spline/vertex.js';
import splineFragmentShader from './shaders/spline/fragment.js';

/** Constants */
const isMobile = window.innerWidth < 703;
const shiftRightPercent = isMobile ? 0 : 0.4;
const shiftBottomPercent = isMobile ? 0.5 : 0.1;
const cameraZoom = isMobile ? 35 : 18;

const CURVE_SEGMENTS = 44;
const DEFAULT_TUBE_RADIUS = 0.015;
const TUBE_RADIUS_SEGMENTS = 8;
const GLOBE_RADIUS = 5.5;
const DEGREE_TO_RADIAN = Math.PI / 180;
const CURVE_MIN_ALTITUDE = 2;
const CURVE_MAX_ALTITUDE = 5;

let splines, drawCount;

const sections = document.querySelectorAll('.content--fixedPageContent');
gsap.to(sections[0], {
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

// https://svs.gsfc.nasa.gov/3895
const stars = './assets/textures/starmap_4k.jpg';

const backgroundMap = textureLoader.load(stars);
backgroundMap.mapping = THREE.EquirectangularReflectionMapping;
backgroundMap.encoding = THREE.sRGBEncoding;

scene.background = backgroundMap;

/**
 * Lights
 */

// var light = new THREE.AmbientLight(0x404040, 3); // soft white light
// scene.add(light);

// var directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
// scene.add(directionalLight);

var pointLight = new THREE.PointLight(0xffffff);
pointLight.position.set(0, 250, 0);
scene.add(pointLight);

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
  uSize: { value: 0.005 * renderer.getPixelRatio() },

  color: { value: new THREE.Color(0xffffff) },
  opacity: { value: 0.9 },
};

/**
 * Objects
 */

/**
 * Globe
 */

const globeGeometry = new THREE.IcosahedronGeometry(GLOBE_RADIUS, 32, 32);
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
scene.add(earthGlobe);

var customMaterialAtmosphere = new THREE.ShaderMaterial({
  uniforms: {
    c: { type: 'f', value: 0.88 },
    p: { type: 'f', value: 14.0 },
  },
  vertexShader: atmoVertexShader,
  fragmentShader: atmoFragmentShader,
  side: THREE.BackSide,
  blending: THREE.AdditiveBlending,
  transparent: true,
});

var mesh = new THREE.Mesh(globeGeometry.clone(), customMaterialAtmosphere);
mesh.scale.x = mesh.scale.y = mesh.scale.z = 1.1;
// atmosphere should provide light from behind the sphere, so only render the back side
// mesh.material.side = THREE.BackSide;
scene.add(mesh);

// // clone earlier sphere geometry to block light correctly
// // and make it a bit smaller so that light blends into surface a bit
// var blackMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
// var sphere = new THREE.Mesh(globeGeometry.clone(), blackMaterial);
// // sphere.scale.x = sphere.scale.y = sphere.scale.z = 1;
// scene.add(sphere);

/**
 * Airports
 * */

// Get the data
const dataAirport = await getData('data/airports-extended.dat');
const dataAirline = await getData('data/routes.dat');
let airports = formatAirportData(dataAirport);
// console.log(airports.splice(0, 10));
let airportsPlusAirlines = formatAirlineData(dataAirline, airports);
// document.querySelector('#airport-no').innerHTML = Object.keys(airports).length;
console.log(Object.keys(airports).length);

// Particles

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

const markerCount = Object.keys(airportsPlusAirlines).length;
let markerInfo = []; // information on markers

let gMarker = new THREE.PlaneGeometry(0.08, 0.08); // point size

// Material
const mMarker = new THREE.MeshBasicMaterial({
  color: 0xff3232,
  onBeforeCompile: (shader) => {
    shader.uniforms.uTime = globalUniforms.uTime;
    shader.uniforms.uDotTexture = globalUniforms.uDotTexture;
    shader.uniforms.uNoiseTexture = globalUniforms.uNoiseTexture;
    shader.depthWrite = false;
    shader.blending = THREE.AdditiveBlending;
    shader.vertexShader = `
      attribute float phase;
      varying float vPhase;
      ${shader.vertexShader}
      `.replace(
      `#include <begin_vertex>`,
      `#include <begin_vertex>
        vPhase = phase; // de-synch of ripples
      `
    );

    shader.fragmentShader = `
      uniform float uTime;
      uniform sampler2D uDotTexture;
      uniform sampler2D uNoiseTexture;

      varying float vPhase;

      ${shader.fragmentShader}
      `.replace(
      `vec4 diffuseColor = vec4( diffuse, opacity );`,
      `
        vec2 lUv = vUv;
        // vec2 lUv = (vUv - 0.8) * 2.;

        float val = 0.;
        float lenUv = length(lUv);
        // val = max(val, 1. - step(0.25, lenUv)); // central circle
        // val = max(val, step(0.4, lenUv) - step(0.5, lenUv)); // outer circle

        float tShift = fract(uTime * 0.2 + 2.0*vPhase);
        val = max(val, step(0.4 + (tShift * 0.6), lenUv) - step(0.5 + (tShift * 0.5), lenUv)); // ripple

        
        vec4 textureColor = texture2D(uDotTexture, lUv);
        vec4 noiseColor = texture2D(uNoiseTexture, vec2(lUv.x + uTime, lUv.y));
        float noiseAlpha = pow(noiseColor.r, 3.0);
        vec4 finalColor = vec4(textureColor.rgb, (textureColor.a * 1.0 * 1.0) * 1.0);
        
        vec4 diffuseColor = vec4( finalColor.rgb, opacity );
        if (val > 0.5) {
          diffuseColor =  vec4(1.,1.,1., 0.05);
          
        } 
        `
    );
  },
});

mMarker.defines = { USE_UV: ' ' }; // needed to be set to be able to work with UVs

let markers = new THREE.InstancedMesh(gMarker, mMarker, markerCount);

const airportsAsArray = Object.entries(airportsPlusAirlines);

let airportPoint = new THREE.Object3D();
let phase = [];
for (let i = 0; i < markerCount; i++) {
  let pos = calcPosFromLatLonRad(
    airportsAsArray[i][1].geometry.coordinates[0],
    airportsAsArray[i][1].geometry.coordinates[1],
    GLOBE_RADIUS
  );

  airportPoint.position.set(pos.x, pos.y, pos.z);
  airportPoint.lookAt(
    airportPoint.position.clone().setLength(GLOBE_RADIUS + 1)
  );
  airportPoint.updateMatrix();
  markers.setMatrixAt(i, airportPoint.matrix);
  phase.push(Math.random());

  let airportInfo = airportsAsArray[i][1];
  airportInfo.crd = airportPoint.position.clone();

  // console.log(markerInfo);

  markerInfo.push(airportInfo);
}

gMarker.setAttribute(
  'phase',
  new THREE.InstancedBufferAttribute(new Float32Array(phase), 1)
);

// markers.rotation.x += 0.7;
// markers.rotation.y += 0.7;
scene.add(markers);

const splinesGroup = new THREE.Group();
scene.add(splinesGroup);

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
 * Group
 */
const cameraGroup = new THREE.Group();
scene.add(cameraGroup);

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
camera.position.set(0, 0, cameraZoom);
cameraGroup.add(camera);

/**
 * Controls
 */

let controls = new OrbitControls(camera, canvas);

// controls.enablePan = true;
// controls.enableZoom = true;
controls.minDistance = 9;
controls.maxDistance = 20;
controls.enableDamping = true;
controls.autoRotate = true;
controls.autoRotateSpeed *= 0.9;

// controls.enablePan = false;
// controls.minDistance = 6;
// controls.maxDistance = 15;
// controls.enableDamping = true;
// controls.autoRotate = true;
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

function clamp(num, min, max) {
  return num <= min ? min : num >= max ? max : num;
}

function getSplineFromCoords(coords) {
  const startLat = coords[0];
  const startLng = coords[1];
  const endLat = coords[2];
  const endLng = coords[3];

  // spline vertices
  const start = calcPosFromLatLonRad(startLat, startLng, GLOBE_RADIUS);
  const end = calcPosFromLatLonRad(endLat, endLng, GLOBE_RADIUS);

  const altitude = clamp(
    start.distanceTo(end) * 0.75,
    CURVE_MIN_ALTITUDE,
    CURVE_MAX_ALTITUDE
  );
  const interpolate = geoInterpolate([startLng, startLat], [endLng, endLat]);
  const midCoord1 = interpolate(0.25);
  const midCoord2 = interpolate(0.75);
  const mid1 = calcPosFromLatLonRad(
    midCoord1[1],
    midCoord1[0],
    GLOBE_RADIUS + altitude
  );
  const mid2 = calcPosFromLatLonRad(
    midCoord2[1],
    midCoord2[0],
    GLOBE_RADIUS + altitude
  );

  return {
    start,
    end,
    spline: new THREE.CubicBezierCurve3(start, mid1, mid2, end),
  };
}

// https://medium.com/@xiaoyangzhao/drawing-curves-on-webgl-globe-using-three-js-and-d3-draft-7e782ffd7ab
let path;

const splineMaterial = new THREE.ShaderMaterial({
  uniforms: globalUniforms,
  vertexShader: splineVertexShader,
  fragmentShader: splineFragmentShader,
  // wireframe: true,
  transparent: true,
});

function getCurve(coords) {
  let p1 = calcPosFromLatLonRad(coords[0], coords[1], GLOBE_RADIUS);
  let p2 = calcPosFromLatLonRad(coords[2], coords[3], GLOBE_RADIUS);

  let v1 = new THREE.Vector3(p1.x, p1.y, p1.z);
  let v2 = new THREE.Vector3(p2.x, p2.y, p2.z);

  let points = [];
  for (let i = 0; i <= 50; i++) {
    let p = new THREE.Vector3().lerpVectors(v1, v2, i / 50);
    p.normalize();
    p.multiplyScalar(5.2 + 1 * Math.sin((Math.PI * i) / 50));
    points.push(p);
  }

  path = new THREE.CatmullRomCurve3(points, false);

  const splineGeometry = new THREE.TubeBufferGeometry(
    path,
    CURVE_SEGMENTS,
    DEFAULT_TUBE_RADIUS,
    TUBE_RADIUS_SEGMENTS,
    false
  );

  splineGeometry.computeBoundingBox();

  const count = splineGeometry.attributes.position.count;
  const customColor = new THREE.Float32BufferAttribute(count * 3, 3);
  splineGeometry.setAttribute('customColor', customColor);

  const color = new THREE.Color(0xffffff);
  for (let i = 0, l = customColor.count; i < l; i++) {
    // color.setHSL(i / l, 0.5, 0.5);
    // color.setHSL(i / l, 0.5, 0.5);
    color.setHSL(i / l, 1.0, 0.7);

    color.toArray(customColor.array, i * customColor.itemSize);
  }

  // Material

  splineMaterial.uniforms.bboxMin = splineGeometry.boundingBox.min;
  splineMaterial.uniforms.bboxMax = splineGeometry.boundingBox.max;

  splines = new THREE.Mesh(splineGeometry, splineMaterial);
  splinesGroup.add(splines);

  let startTime = 0;

  const drawDirectedAnimatedLine = ({ reverse }) => {
    const drawAnimatedLine = () => {
      let drawRangeCount = splineGeometry.drawRange.count;
      const timeElapsed = performance.now() - startTime;

      // Animate the curve for 2.5 seconds
      const progress = timeElapsed / 16000;
      // console.log('progress ', progress);

      // Arcs are made up of roughly 3000 vertices
      drawRangeCount = (reverse ? 1 - progress : progress) * 10000;
      // console.log(drawRangeCount);

      if (progress < 0.999) {
        // Update the draw range to reveal the curve
        splineGeometry.setDrawRange(0, drawRangeCount);
        requestAnimationFrame(drawAnimatedLine);
      } else {
        if (reverse === false) {
          startTime = performance.now();

          console.log('-------------------------');
          splineGeometry.setDrawRange(0, 10000);
          drawDirectedAnimatedLine({ reverse: true });
          console.log('------------------- aici';
        } else {
          // console.log('------------------0000000000000000000');
         // setTimeout(function () {
         //   splinesGroup.remove(splines);
         //   document.querySelector('#airport-name').innerHTML = '';
         // }, 500);
        }
      }
    };

    return drawAnimatedLine();
  };

  drawCount = 2;
  splineGeometry.setDrawRange(0, drawCount);
  drawDirectedAnimatedLine({ reverse: false });
  // drawDirectedAnimatedLine({ reverse: true });
}

// const coords = ['22.308901', '113.915001', '51.4706', '-0.461941'];

// getCurve(coords);

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
    // splinesGroup.remove(splines);

    // for (var i = splinesGroup.children.length - 1; i >= 0; i--) {
    //   const obj = splinesGroup.children[i];
    //   splinesGroup.remove(obj);
    // }

    currentIntersect = intersects[0];

    if (currentIntersect) {
      let iid = currentIntersect.instanceId;
      let currentAirport = markerInfo[iid];
      let mi = currentAirport.properties;

      document.querySelector('#airport-name').innerHTML = mi['Name'];

      if (isClick) {
        // console.log(currentAirport);

        divMag.innerHTML = '';
        Object.keys(mi).forEach((key) => {
          if (key !== 'crd') {
            divMag.innerHTML += `
            ${key}: ${mi[key]} <br/>
            `;
          }
        });

        label.position.copy(markerInfo[iid].crd);

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

      currentAirport.destinations.forEach((destination) => {
        getCurve([
          currentAirport.geometry.coordinates[0],
          currentAirport.geometry.coordinates[1],
          destination.destinationGeometry.coordinates[0],
          destination.destinationGeometry.coordinates[1],
        ]);
      });

      // console.log(splinesGroup);

      // document.body.classList.remove('grabbable');
      document.body.classList.add('pointer');
    }
  } else {
    // console.log('----------------- no intersection');
    document.body.classList.remove('pointer');
    // document.body.classList.add('grabbable');

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
let time = 0;

const tick = () => {
  const elapsedTime = clock.getElapsedTime();

  // Update material
  time += 0.3;
  globalUniforms.uTime.value = time;
  // globalUniforms.color.value.offsetHSL(0.0005, 0, 0);

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
