import * as THREE from '../../js/three/build/three.module.js';
import { OrbitControls } from '../../js/three/OrbitControls.js';
// import { EXRLoader } from '../../js/three/EXRLoader.js';

/////////////////////////// ThreeJS ///////////////////////////////
/**
 * Loaders
 */
const cubeTextureLoader = new THREE.CubeTextureLoader();
const textureLoader = new THREE.TextureLoader();

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
const directionalLight = new THREE.DirectionalLight('#ffffff', 1);
directionalLight.position.set(1, 1, 0);
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
});

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
  75,
  sizes.width / sizes.height,
  0.1,
  100
);
camera.position.x = 0;
camera.position.y = 0;
camera.position.z = 2;

cameraGroup.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
// controls.enableZoom = false;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  alpha: true,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.sortObjects = false; // Render in the order the objects were added to the scene

/**
 * Environment map
 */
// const environmentMap = cubeTextureLoader.load([
//   './assets/textures/world/0/px.png',
//   './assets/textures/world/0/nx.png',
//   './assets/textures/world/0/py.png',
//   './assets/textures/world/0/ny.png',
//   './assets/textures/world/0/pz.png',
//   './assets/textures/world/0/nz.png',
// ]);
// environmentMap.encoding = THREE.sRGBEncoding;

// scene.background = environmentMap;
// scene.environment = environmentMap;

// https://svs.gsfc.nasa.gov/3895
const stars = './assets/textures/itl.cat_disaster-wallpaper_1369464.jpeg';

const backgroundMap = textureLoader.load(stars);
backgroundMap.mapping = THREE.EquirectangularReflectionMapping;
backgroundMap.encoding = THREE.sRGBEncoding;
scene.background = backgroundMap;

// new EXRLoader().load(
//   './assets/textures/107_hdrmaps_com_free.exr',
//   function (texture) {
//     texture.mapping = THREE.EquirectangularReflectionMapping;

//     // exrCubeRenderTarget = THREE.pmremGenerator.fromEquirectangular(texture);
//     scene.background = texture;
//   }
// );

const tick = () => {
  // Render
  renderer.render(scene, camera);

  scene.rotation.y -= 0.003;

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();

/////////////////////////// D3JS ///////////////////////////////

/* Global constants */
const margin = { top: 10, left: 10, bottom: 10, right: 10 },
  width = window.innerWidth - margin.left - margin.right,
  height = window.innerHeight - margin.top - margin.bottom,
  svg_width = width + margin.left + margin.right,
  svg_height = height + margin.top + margin.bottom;

let projectionType = 'equi';

const blueColor = '#ffd500ff',
  yellowColor = '#005bbbff';
const color = d3.scaleLinear().domain([1, 2]).range([blueColor, yellowColor]);
const stroke = (id) => (id === 1 ? yellowColor : blueColor);

let id;

const svg = d3
  .select('#chart')
  .append('svg')
  .attr('preserveAspectRatio', 'xMinYMid')
  .attr('width', svg_width)
  .attr('height', svg_height);

// Append zoomable group
const zoomableGroup = svg
  .append('g')
  .attr('class', 'zoomable-group')
  .attr(
    'transform',
    `scale(0.5) translate(${svg_width / 2}, ${svg_height / 2}) `
  );

const zoomHandler = () => {
  const transform = d3.event.transform;

  g.attr(
    'transform',
    'translate(' +
      transform.x +
      ',' +
      transform.y +
      ')scale(' +
      transform.k +
      ')'
  );
};

let countries;

const g = zoomableGroup
  .append('g')
  .attr('class', 'counties')
  .call(d3.zoom().scaleExtent([1, 10]).on('zoom', zoomHandler));

/* Load the data */
const promises = [d3.json('data/world.json')];

Promise.all(promises).then((data) => {
  const world = data[0];
  // console.log(world);

  countries = topojson.feature(world, {
    type: 'GeometryCollection',
    geometries: world.objects['simplified'].geometries,
  });

  const globe = g
    .selectAll('path')
    .data(countries.features)
    .enter()
    .append('path');

  const changeProjection = () => {
    let projection, path;

    if (projectionType === 'equi') {
      projectionType = 'azim';

      projection = d3
        .geoAzimuthalEqualArea()
        .translate([width / 2, height / 2])
        .scale(width / 7);

      path = d3.geoPath().projection(projection);
    } else {
      projectionType = 'equi';

      projection = d3
        .geoEquirectangular()
        .translate([width / 2, height / 2])
        .scale(width / 7);

      path = d3.geoPath().projection(projection);
    }

    globe
      .transition()
      .duration(1000)
      .attr('d', path)
      .style('fill', (d) => color([d.properties.id]))
      .style('stroke-width', '0.5px')
      .style('stroke', (d) => stroke(d.properties.id));
  };

  let initialTime = new Date().getTime();
  const frequency = 5000;
  let elapsedTime;

  let timer = setInterval(onFrame, frequency / 1000);

  function onFrame() {
    elapsedTime = new Date().getTime() - initialTime;
    if (elapsedTime < frequency) return;

    let steps = Math.floor(elapsedTime / frequency);
    while (steps > 0) {
      changeProjection();
      steps -= 1;
    }

    initialTime = new Date().getTime();
  }

  const animateBtn = document.querySelector('#animate');
  const stopBtn = document.querySelector('#stop-animation');

  animateBtn.addEventListener('click', (event) => {
    animateBtn.classList.add('hidden');
    stopBtn.classList.remove('hidden');
    timer = setInterval(onFrame, frequency / 1000);
  });

  stopBtn.addEventListener('click', (event) => {
    animateBtn.classList.remove('hidden');
    stopBtn.classList.add('hidden');
    window.clearInterval(timer);
  });
});
