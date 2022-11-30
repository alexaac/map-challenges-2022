import * as THREE from './three/build/three.module.js';
import * as dat from './libs/lil-gui.module.min.js';

import firefliesVertexShader from './shaders/fireflies/vertex.js';
import firefliesFragmentShader from './shaders/fireflies/fragment.js';

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
const parameters = {
  materialColor: '#ffeded',
};

gui.addColor(parameters, 'materialColor').onChange(() => {
  particlesMaterial.color.set(parameters.materialColor);
});

/**
 * Base
 */
// Canvas
const canvas = document.querySelector('canvas.main-webgl');

// Scene
const scene = new THREE.Scene();

/**
 * Objects
 */
// const geometry = new THREE.TorusGeometry(0.4, 0.2, 16, 60);
const imgWidth = window.innerWidth < 768 ? 1.15 : 2.3;
const imgHeight = window.innerWidth < 768 ? 0.75 : 1.5;
const geometry = new THREE.PlaneBufferGeometry(imgWidth, imgHeight, 1, 1); // 1400*900
// const geometry = new THREE.PlaneBufferGeometry(2, 1.3);

// Meshes
const objectsDistance = 2.5;
let index = 0;
let xOffset = 0.5;
const sectionMeshes = [];

const video = document.createElement('video');
video.autoplay = true;
video.style.display = 'none';
document.body.appendChild(video);

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
    let demoLink = '';
    if (elem.name === 'google-routes') {
      demoLink = `https://maptheclouds.com/playground/30-day-map-challenge-2022/${elem.name}/dist/`;
    } else {
      demoLink = `https://maptheclouds.com/playground/30-day-map-challenge-2022/${elem.name}/`;
    }
    const demoImg = textureLoader.load(`./${elem.name}/img/og_1400_900.png`);
    const demoMp4 = `./${elem.name}/img/demo.mp4`;

    const section = document.createElement('section');
    section.className = 'section';
    section.id = `section-${index}`;
    const h2 = document.createElement('h2');
    h2.innerText = elem.title;
    section.appendChild(h2);
    div.appendChild(section);

    // Material
    const material = new THREE.MeshBasicMaterial({
      map: demoImg,
    });

    // Mesh
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = -objectsDistance * index;
    mesh.position.x = -(Math.random() - 0.5) * xOffset;

    mesh.properties = elem;
    mesh.properties.demoImg = demoImg;
    mesh.properties.demoLink = demoLink;
    mesh.properties.demoMp4 = demoMp4;
    mesh.index = index;

    index++;
    xOffset = -xOffset;

    scene.add(mesh);

    sectionMeshes.push(mesh);
  }
});

sectionMeshes[0].visible = false;
// Animate overlay
gsap.to(sectionMeshes[0], {
  delay: 6,
  duration: 30,
  visible: true,
});
// gsap.to(sectionMeshes[0].rotation, {
//   delay: 0,
//   duration: 10,
//   y: -0.5,
// });

const firstH2 = document.querySelector('#section-0');
gsap.timeline().to(firstH2, {
  delay: 4,
  duration: 4,
  opacity: 1,
});

/**
 * Particles
 */
// Geometry
const particlesCount = 200;
const positions = new Float32Array(particlesCount * 3);

for (let i = 0; i < particlesCount; i++) {
  positions[i * 3 + 0] = (Math.random() - 0.5) * 10;
  positions[i * 3 + 1] =
    objectsDistance * 0.5 -
    Math.random() * objectsDistance * sectionMeshes.length;
  positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
}

const particlesGeometry = new THREE.BufferGeometry();
particlesGeometry.setAttribute(
  'position',
  new THREE.BufferAttribute(positions, 3)
);

// Material
const particlesMaterial = new THREE.PointsMaterial({
  color: parameters.materialColor,
  sizeAttenuation: true,
  size: 0.03,
});

// Points
const particles = new THREE.Points(particlesGeometry, particlesMaterial);
// scene.add(particles);

/**
 * Fireflies from three.js journey
 */
// Geometry
const firefliesGeometry = new THREE.BufferGeometry();
const firefliesCount = 200;
const positionArray = new Float32Array(firefliesCount * 3);
const scaleArray = new Float32Array(firefliesCount);

for (let i = 0; i < firefliesCount; i++) {
  positionArray[i * 3 + 0] = (Math.random() - 0.5) * 10;
  positionArray[i * 3 + 1] =
    objectsDistance * 0.5 -
    Math.random() * objectsDistance * sectionMeshes.length;
  positionArray[i * 3 + 2] = (Math.random() - 0.5) * 10;

  scaleArray[i] = Math.random();
}

firefliesGeometry.setAttribute(
  'position',
  new THREE.BufferAttribute(positionArray, 3)
);
firefliesGeometry.setAttribute(
  'aScale',
  new THREE.BufferAttribute(scaleArray, 1)
);

// Material
const firefliesMaterial = new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0 },
    uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
    uSize: { value: 130 },
  },
  vertexShader: firefliesVertexShader,
  fragmentShader: firefliesFragmentShader,
  transparent: true,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
});

// Points
const fireflies = new THREE.Points(firefliesGeometry, firefliesMaterial);
scene.add(fireflies);

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
 * Scroll
 */
let scrollY = window.scrollY;
let currentSection = 0;

window.addEventListener('scroll', () => {
  scrollY = window.scrollY;

  const newSection = Math.round(scrollY / sizes.height);

  if (newSection !== currentSection) {
    //   currentSection = newSection;
    //   if (sectionMeshes[currentSection]) {
    //     gsap.to(sectionMeshes[currentSection].rotation, {
    //       duration: 1.5,
    //       ease: 'power2.inOut',
    //       x: '+=6',
    //       y: '+=3',
    //       z: '+=1.5',
    //     });
    //   }
  }
});

/**
 * Mouse
 */
const mouse = new THREE.Vector2();
let currentIntersect = null;
const tooltip = document.getElementById('tooltip');

const handleMouseMove = (event) => {
  event.preventDefault();

  mouse.x = (event.clientX / sizes.width) * 2 - 1;
  mouse.y = -(event.clientY / sizes.height) * 2 + 1;

  /**
   * Raycaster
   */
  // Pick objects from view using normalized mouse coordinates

  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObjects(sectionMeshes);

  // tooltip.style.visibility = 'hidden';

  if (intersects[0]) {
    currentIntersect = intersects[0];

    if (intersects[0].object.properties.description) {
      // tooltip.innerHTML = intersects[0].object.properties.description;
      // tooltip.style.visibility = 'visible';
      // tooltip.style.top = '50vh';
      // tooltip.style.left = '50vw';

      document.body.style.cursor = 'pointer';
      // tooltip.style.visibility = 'visible';
    }

    if (currentIntersect) {
      // Play the video again only when finished or if it's for another project
      if (video.paused) {
        video.src = currentIntersect.object.properties.demoMp4; //currentIntersect.object.properties.demoMp4;
        video.load();
        video.play().catch((e) => {
          // console.log(e);
          resetTextures();
        });

        const texture = new THREE.VideoTexture(video);
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.format = THREE.RGBAFormat;

        currentIntersect.object.material.map = texture;
        currentIntersect.object.properties.playing = true;

        video.addEventListener('ended', function () {
          resetTextures();
        });
      }
    }
  } else {
    currentIntersect = null;

    document.body.style.cursor = 'auto';

    // Important - stop the other players
    video.pause();
    resetTextures();
  }

  for (const intersect of intersects) {
    gsap.to(intersect.object.scale, { x: 1.7, y: 1.7 });
    // gsap.to(intersect.object.rotation, { y: -0.2 });
    // gsap.to(intersect.object.position, { z: -0.9 });
  }

  for (const mesh of sectionMeshes) {
    if (!intersects.find((intersect) => intersect.object === mesh)) {
      gsap.to(mesh.scale, { x: 1, y: 1 });
      // gsap.to(mesh.rotation, { y: 0 });
      // gsap.to(mesh.position, { z: 0 });
    }
  }
};

window.addEventListener('mousemove', handleMouseMove);
window.addEventListener('touchmove', handleMouseMove);

window.addEventListener('click', () => {
  if (currentIntersect) {
    window.open(currentIntersect.object.properties.demoLink);
  }
});

/**
 * Raycaster
 */
const raycaster = new THREE.Raycaster();

/**
 * Animate
 */
const clock = new THREE.Clock();

let previousTime = 0;

const tick = () => {
  const elapsedTime = clock.getElapsedTime();
  const deltaTime = elapsedTime - previousTime;
  previousTime = elapsedTime;

  // Update material
  firefliesMaterial.uniforms.uTime.value = elapsedTime;

  // Animate camera
  camera.position.y = (-scrollY / sizes.height) * objectsDistance;

  const parallaxX = mouse.x * 0.5;
  const parallaxY = -mouse.y * 0.5; // Invert

  cameraGroup.position.x +=
    (parallaxX - cameraGroup.position.x) * 5 * deltaTime;
  cameraGroup.position.y +=
    (parallaxY - cameraGroup.position.y) * 5 * deltaTime;

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

function resetTextures() {
  sectionMeshes.forEach((mesh) => {
    mesh.material.map = mesh.properties.demoImg;
  });
}

tick();
