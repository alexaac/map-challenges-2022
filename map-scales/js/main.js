import * as THREE from '../../js/three/build/three.module.js';
import { OrbitControls } from '../../js/three/OrbitControls.js';
import * as dat from '../../js/libs/lil-gui.module.min.js';

import dVertexShader from './shaders/displacement/vertex.js';
import dFragmentShader from './shaders/displacement/fragment.js';

const isMobile = window.innerWidth < 703;

/**
 * Loaders
 */
const cubeTextureLoader = new THREE.CubeTextureLoader();
const textureLoader = new THREE.TextureLoader();

/**
 * Textures
 */
// const height1 = textureLoader.load('./assets/textures/ro_height.png');
// const height2 = textureLoader.load('./assets/textures/ro_height2.png');
// const height3 = textureLoader.load('./assets/textures/ro_height3.png');
const tex1 = textureLoader.load('./assets/textures/ro_texture.png');
const tex2 = textureLoader.load('./assets/textures/ro_texture2.png');
const tex3 = textureLoader.load('./assets/textures/ro_texture3.png');

/**
 * Debug
 */
const gui = new dat.GUI({ closed: true });

gui.hide();

/**
 * Base
 */
// Canvas
const canvas = document.querySelector('canvas.webgl');

// Scene
const scene = new THREE.Scene();

/**
 * Objects
 */

const globalUniforms = {
  fade: { type: 'f', value: 0 },
  texture1: { value: tex1 },
  texture2: { value: tex2 },
};
// globalUniforms.texture1.value.needsUpdate = true;
// globalUniforms.texture2.value.needsUpdate = true;

// 1
const geometry = new THREE.PlaneBufferGeometry(3, 2.096, 32, 32);

const material = new THREE.ShaderMaterial({
  uniforms: globalUniforms,
  vertexShader: `

    // Define the uv we want to pass to our fragment shader
    varying vec2 vUv;
    
    void main(){
    
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    
    }
  
  `,
  fragmentShader: `
  
    // Read our uv and textures, as well as fade value
    uniform sampler2D texture1;
    uniform sampler2D texture2;
    uniform float fade;
    varying vec2 vUv;
    
    void main(){
    
      // Read our pixel colors as rgba
      vec4 t1 = texture2D( texture1, vUv );
      vec4 t2 = texture2D( texture2, vUv );
      
      // Mix our pixels together based on fade value
      gl_FragColor = mix( t1, t2, fade );
      
    }
    
  `,
});

var state = 0;
var targetState = 0;

// Mesh
const plane = new THREE.Mesh(geometry, material);
plane.material.side = THREE.DoubleSide;
scene.add(plane);

/**
 * Lights
 */

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
camera.position.z = 1.8;

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

const rotateBtn = document.querySelector('#rotate-globe');
const stopBtn = document.querySelector('#stop-globe');

rotateBtn.addEventListener('click', (event) => {
  globalUniforms.texture1.value = tex1;
  globalUniforms.texture2.value = tex2;

  rotateBtn.classList.add('hidden');
  stopBtn.classList.remove('hidden');
  running = false;
  startSequence();
});

stopBtn.addEventListener('click', (event) => {
  rotateBtn.classList.remove('hidden');
  stopBtn.classList.add('hidden');
  running = true;
});

const parameters = {
  stateStep: 0,
  state: 0,
  targetState: 1,
};

let running = false;

const startSequence = () => {
  if (running) return;

  parameters.state = 0;
  parameters.targetState = 1;

  globalUniforms.texture1.value = tex1;
  globalUniforms.texture2.value = tex2;

  gsap.to(parameters, {
    delay: 3,
    stateStep: 1,
    duration: 4,
    onUpdate: () => {
      if (!running) {
        parameters.state =
          parameters.targetState >= parameters.state
            ? parameters.state + 0.01
            : parameters.state - 0.01;
        parameters.state =
          parameters.state < 0
            ? 0
            : parameters.state > 1
            ? 1
            : parameters.state;

        plane.material.uniforms.fade.value = parameters.state;
      } else {
        parameters.state = 1;
      }
    },
    onComplete: () => {
      if (!running) {
        parameters.state = 0;
        parameters.targetState = 1;

        gsap.to(parameters, {
          delay: 1,
          stateStep: 1,
          duration: 4,
          onUpdate: () => {
            globalUniforms.texture2.value = tex3;
            globalUniforms.texture1.value = tex2;
            if (!running) {
              parameters.state =
                parameters.targetState >= parameters.state
                  ? parameters.state + 0.01
                  : parameters.state - 0.01;
              parameters.state =
                parameters.state < 0
                  ? 0
                  : parameters.state > 1
                  ? 1
                  : parameters.state;

              plane.material.uniforms.fade.value = parameters.state;
            } else {
              parameters.state = 1;
            }
          },
          onComplete: () => {
            running = false;
            console.log('------------------');
            rotateBtn.classList.remove('hidden');
            stopBtn.classList.add('hidden');
          },
        });
      }
    },
  });
};

startSequence();

const tick = () => {
  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
