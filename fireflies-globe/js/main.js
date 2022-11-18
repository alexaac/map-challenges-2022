import * as THREE from '../../js/three/build/three.module.js';
import { ObjectControls } from '../../js/three/ObjectControls.js';
import { OrbitControls } from '../../js/three/OrbitControls.js';
import { GLTFLoader } from '../../js/three/GLTFLoader.js';

import * as dat from '../../js/libs/lil-gui.module.min.js';

import firefliesVertexShader from './shaders/fireflies/vertex.js';
import firefliesFragmentShader from './shaders/fireflies/fragment.js';
import portalVertexShader from './shaders/portal/vertex.js';
import portalFragmentShader from './shaders/portal/fragment.js';
import dVertexShader from './shaders/displacement/vertex.js';
import dFragmentShader from './shaders/displacement/fragment.js';

/** Constants */

const GLOBE_RADIUS = 5;

const isMobile = window.innerWidth < 703;
const shiftRightPercent = 0; //isMobile ? 0 : 0.4;
const shiftBottomPercent = 0; // isMobile ? 0.5 : 0.1;
const cameraZoom = isMobile ? 15 : 12;

let time = 0,
  unit = 50;

const params = {
  color: 0xffffff,
  transparency: 0.9,
  envMapIntensity: 1,
  lightIntensity: 1,
  exposure: 1,
};

const sections = document.querySelectorAll('.content--fixedPageContent');
gsap.to(sections[0], {
  duration: 3,
  opacity: 1,
  visibility: 'visible',
  ease: 'power2.inOut',
});

/**
 * Debug
 */

const debugObject = {};
const gui = new dat.GUI();
gui.hide();

gui.addColor(params, 'color').onChange(function () {
  material.color.set(params.color);
  materialb.color.set(params.color);
});

gui.add(params, 'transparency', 0, 1).onChange(function () {
  material.transparency = params.transparency;
  materialb.transparency = params.transparency;
});

gui
  .add(params, 'envMapIntensity', 0, 1)
  .name('envMap intensity')
  .onChange(function () {
    material.envMapIntensity = params.envMapIntensity;
    materialb.envMapIntensity = params.envMapIntensity;
  });

gui
  .add(params, 'lightIntensity', 0, 1)
  .name('light intensity')
  .onChange(function () {
    spotLight1.intensity = spotLight2.intensity = params.lightIntensity;
  });

gui.add(params, 'exposure', 0, 1).onChange(function () {
  renderer.toneMappingExposure = params.exposure;
});

gui.open();

/**
 * Loaders
 */

// GLTF loader
const gltfLoader = new GLTFLoader();
// gltfLoader.setDRACOLoader(dracoLoader);

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

const bakedTexture = textureLoader.load('./assets/models/portal/baked.jpg');
bakedTexture.flipY = false;
bakedTexture.encoding = THREE.sRGBEncoding;

// var supGif = new SuperGif({ gif: document.getElementById('gif') });
// supGif.load();
// var gifCanvas = supGif.get_canvas();
// const tex1 = new THREE.Texture(gifCanvas);
const tex1 = textureLoader.load('./assets/textures/globe_airports.png');
const tex2 = textureLoader.load('./assets/textures/globe_airlines.png');
const tex3 = textureLoader.load('./assets/textures/cluj_globe.png');
const tex4 = textureLoader.load('./assets/textures/cheesy_planets.png');
const tex5 = textureLoader.load('./assets/textures/sculpted_gifts.png');
const tex6 = textureLoader.load('./assets/textures/pale_blue_dot.png');

const globalUniforms = {
  fade: { type: 'f', value: 0 },
  texture1: { value: tex1 },
  texture2: { value: tex2 },
};

const parameters = {
  stateStep: 0,
  state: 0,
  targetState: 1,
};

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
 * Environment map
 */
//  http://www.humus.name/index.php?page=Textures&ID=32
const path = './assets/environmentMaps/Skansen2/';
const format = '.jpg';
const urls = [
  path + 'posx' + format,
  path + 'negx' + format,
  path + 'posy' + format,
  path + 'negy' + format,
  path + 'posz' + format,
  path + 'negz' + format,
];

const environmentMap = new THREE.CubeTextureLoader().load(urls);

/**
 * Base
 */

// Canvas
const canvas = document.querySelector('canvas.webgl');

// Scene
const scene = new THREE.Scene();
scene.background = environmentMap;
scene.environment = environmentMap;

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

// // Animate overlay
// gsap.to(overlayMaterial.uniforms.uAlpha, {
//   duration: 5,
//   value: 0,
//   onComplete: removeOverlay,
// });

function removeOverlay() {
  scene.remove(overlay);
}

/**
 * Lights
 */

const ambientLight = new THREE.AmbientLight(0xcccccc, 0.4);
scene.add(ambientLight);

const spotLight1 = new THREE.SpotLight(0xffffff, params.lightIntensity);
spotLight1.position.set(100, 200, 100);
spotLight1.angle = Math.PI / 6;
scene.add(spotLight1);

const spotLight2 = new THREE.SpotLight(0xffffff, params.lightIntensity);
spotLight2.position.set(-100, -200, -100);
spotLight2.angle = Math.PI / 6;
scene.add(spotLight2);

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  // alpha: true,
  antialias: false,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = params.exposure;
renderer.gammaOutput = true;

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
camera.position.set(-9, 6.2, -8);
camera.lookAt(scene);

scene.add(camera);

/**
 * Objects
 */

/**
 * Materials
 */

const mainGroup = new THREE.Group();
mainGroup.position.set(0, 0, 0);

scene.add(mainGroup);

// Baked material
const bakedMaterial = new THREE.MeshBasicMaterial({ map: bakedTexture });

// Pole light material
const poleLightMaterial = new THREE.MeshBasicMaterial({ color: 0xffffe5 });

// Portal light material

debugObject.portalColorStart = '#000000';
debugObject.portalColorEnd = '#ffffff';

gui.addColor(debugObject, 'portalColorStart').onChange(() => {
  console.log('changed');
  portalLightMaterial.uniforms.uColorStart.value.set(
    debugObject.portalColorStart
  );
});
gui.addColor(debugObject, 'portalColorEnd').onChange(() => {
  console.log('changed');
  portalLightMaterial.uniforms.uColorEnd.value.set(debugObject.portalColorEnd);
});

const portalLightMaterial = new THREE.ShaderMaterial({
  vertexShader: dVertexShader,
  fragmentShader: dFragmentShader,
  // transparent: true,
  uniforms: globalUniforms,
});

/**
 * Model
 */
gltfLoader.load('./assets/models/portal/portal.glb', (gltf) => {
  removeOverlay();

  mainGroup.add(gltf.scene);

  // Get each object
  const bakedMesh = gltf.scene.children.find((child) => child.name === 'baked');
  const portalLightMesh = gltf.scene.children.find(
    (child) => child.name === 'portalLight'
  );
  const poleLightAMesh = gltf.scene.children.find(
    (child) => child.name === 'poleLightA'
  );
  const poleLightBMesh = gltf.scene.children.find(
    (child) => child.name === 'poleLightB'
  );

  // Apply materials
  bakedMesh.material = bakedMaterial;
  portalLightMesh.material = portalLightMaterial;
  poleLightAMesh.material = poleLightMaterial;
  poleLightBMesh.material = poleLightMaterial;

  const meshGroup = new THREE.Group();
  meshGroup.add(bakedMesh);
  meshGroup.add(portalLightMesh);
  meshGroup.add(poleLightAMesh);
  meshGroup.add(poleLightBMesh);
  mainGroup.add(meshGroup);

  meshGroup.position.set(0, -2.99, 0);
  meshGroup.rotation.set(0, 10, 0);
  meshGroup.scale.set(1.2, 1.2, 1.2);
});

/**
 * Globe
 */

// https://github.com/RalucaNicola/learn-threejs
const doorAlphaTexture = new THREE.TextureLoader().load(
  './assets/textures/alpha.png'
);

// add a shiny, transparent globe around the scene
const globeGeom = new THREE.SphereGeometry(5, 32, 32);
const globeMat = new THREE.MeshPhysicalMaterial({
  color: params.color,
  metalness: 0,
  roughness: 0,
  alphaMap: doorAlphaTexture,
  alphaTest: 0.5,
  envMap: environmentMap,
  envMapIntensity: params.envMapIntensity,
  depthTest: false,
  transmission: params.transparency,
  transparent: true,
});

const material = new THREE.MeshPhysicalMaterial().copy(globeMat);
const materialb = new THREE.MeshPhysicalMaterial().copy(globeMat);
materialb.side = THREE.BackSide;

const globeMesh = new THREE.Mesh(globeGeom, material);
globeMesh.position.set(0, 0, 0);
mainGroup.add(globeMesh);

const globeMeshB = new THREE.Mesh(globeGeom, materialb);
globeMeshB.renderOrder = -1;
globeMesh.add(globeMeshB);

// add a base to hold the globe
const baseMesh = new THREE.Mesh(
  new THREE.CylinderGeometry(4, 5, 280, 32),
  new THREE.MeshBasicMaterial({ color: 0x241e1e })
);
baseMesh.position.set(0, -143, 0);
mainGroup.add(baseMesh);

/**
 * Fireflies
 */

// Geometry
const firefliesGeometry = new THREE.BufferGeometry();
const firefliesCount = 450;
const positionArray = new Float32Array(firefliesCount * 3);
const scaleArray = new Float32Array(firefliesCount);

let x, y, z, keepgoing;
const scale = GLOBE_RADIUS / 0.52; // adjust coordinates to size of sphere
const yshift = 0;

for (let i = 0; i < firefliesCount; i++) {
  keepgoing = true;
  while (keepgoing) {
    x = Math.random() - 0.5;
    y = Math.random() - 0.5;
    z = Math.random() - 0.5;
    if (x * x + y * y + z * z < 0.25) {
      keepgoing = false;

      positionArray[i * 3 + 0] = scale * x;
      positionArray[i * 3 + 1] = scale * y + yshift;
      positionArray[i * 3 + 2] = scale * z;

      scaleArray[i] = Math.random() * 2;
    }
  }
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
    uSize: { value: 150 },
  },
  vertexShader: firefliesVertexShader,
  fragmentShader: firefliesFragmentShader,
  transparent: true,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
});

gui
  .add(firefliesMaterial.uniforms.uSize, 'value')
  .min(0)
  .max(500)
  .step(1)
  .name('firefliesSize');

// Points
const fireflies = new THREE.Points(firefliesGeometry, firefliesMaterial);
mainGroup.add(fireflies);

/**
 * Controls
 */

let controls = new OrbitControls(camera, canvas);

// const rotateBtn = document.querySelector('#rotate-globe');
// const stopBtn = document.querySelector('#stop-globe');

// rotateBtn.addEventListener('click', (event) => {
//   globalUniforms.texture1.value = tex1;
//   globalUniforms.texture2.value = tex2;

//   rotateBtn.classList.add('hidden');
//   stopBtn.classList.remove('hidden');
//   running = false;
//   startSequence();
// });

// stopBtn.addEventListener('click', (event) => {
//   rotateBtn.classList.remove('hidden');
//   stopBtn.classList.add('hidden');
//   running = true;
// });

let running = false;

const startSequence = () => {
  if (running) return;

  parameters.state = 0;
  parameters.targetState = 1;

  globalUniforms.texture1.value = tex1;
  globalUniforms.texture2.value = tex2;

  gsap.to(parameters, {
    delay: 2,
    stateStep: 1,
    duration: 3,
    onUpdate: () => {},
    onComplete: () => {
      if (running) return;

      globalUniforms.texture1.value = tex2;
      globalUniforms.texture2.value = tex3;

      gsap.to(parameters, {
        delay: 0,
        stateStep: 1,
        duration: 3,
        onUpdate: () => {},
        onComplete: () => {
          if (running) return;

          globalUniforms.texture1.value = tex3;
          globalUniforms.texture2.value = tex4;
          gsap.to(parameters, {
            delay: 0,
            stateStep: 1,
            duration: 3,
            onUpdate: () => {},
            onComplete: () => {
              if (running) return;

              globalUniforms.texture1.value = tex4;
              globalUniforms.texture2.value = tex5;
              gsap.to(parameters, {
                delay: 0,
                stateStep: 1,
                duration: 3,
                onUpdate: () => {},
                onComplete: () => {
                  if (running) return;

                  globalUniforms.texture1.value = tex5;
                  globalUniforms.texture2.value = tex6;
                  gsap.to(parameters, {
                    delay: 0,
                    stateStep: 1,
                    duration: 3,
                    onUpdate: () => {},
                    onComplete: () => {
                      if (running) return;

                      globalUniforms.texture1.value = tex6;
                      globalUniforms.texture2.value = tex1;
                      gsap.to(parameters, {
                        delay: 0,
                        stateStep: 1,
                        duration: 3,
                        onUpdate: () => {},
                        onComplete: () => {
                          running = false;

                          startSequence();
                        },
                      });
                    },
                  });
                },
              });
            },
          });
        },
      });
    },
  });
};

startSequence();

/**
 * Animate
 */
const clock = new THREE.Clock();

const tick = () => {
  const elapsedTime = clock.getElapsedTime();

  time += 0.0003;

  // Update controls
  controls.update();

  // Update materials
  // portalLightMaterial.uniforms.uTime.value = elapsedTime;
  firefliesMaterial.uniforms.uTime.value = elapsedTime;
  firefliesMaterial.uniforms.uSize.value += unit;
  unit = -unit;

  // firefliesMaterial.uniforms.uTime.value = time;

  // portalLightMaterial.displacementScale = 1.1;
  // portalLightMaterial.map.needsUpdate = true;
  // portalLightMaterial.displacementMap.needsUpdate = true;

  // Render
  renderer.render(scene, camera);

  // scene.rotation.y -= 0.0015;

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
