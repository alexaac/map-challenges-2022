import {
  AmbientLight,
  AnimationMixer,
  AxesHelper,
  Box3,
  Cache,
  CubeTextureLoader,
  DirectionalLight,
  GridHelper,
  HemisphereLight,
  LinearEncoding,
  LinearToneMapping,
  LoadingManager,
  PMREMGenerator,
  PerspectiveCamera,
  RGBAFormat,
  Scene,
  SkeletonHelper,
  HalfFloatType,
  Vector3,
  WebGLRenderer,
  sRGBEncoding,
} from '../build/three.module.js';

import * as dat from '../libs/lil-gui.module.min.js';

import { environments } from '../../assets/environment/index.js';
import utils from '../utils.js';

const DEFAULT_CAMERA = '[default]';

export class Viewer {
  constructor(el, map, parameters) {
    this.el = el;
    this.map = map;

    this.lights = [];
    this.gui = null;

    this.state = parameters;

    this.addGUI();
  }

  addGUI() {
    // Debug

    window.addEventListener('keydown', (event) => {
      if (event.key === 'h') {
        if (this.gui._hidden) {
          this.gui.show();
        } else {
          this.gui.hide();
        }
      }
    });

    const gui = (this.gui = new dat.GUI({
      autoPlace: false,
      width: 260,
      hideable: true,
    }));
    // gui.hide();

    // Display controls.
    const dispFolder = gui.addFolder('Display');

    dispFolder
      .add(this.state, 'wireframe')
      .name('Wireframe')
      .onChange(() => {
        this.map.triggerRepaint();
      });

    dispFolder
      .add(this.state, 'lightSource')
      .name('Light Source')
      .onChange(() => {
        this.map.triggerRepaint();
      });

    dispFolder
      .add(this.state, 'fixedLight')
      .name('Fixed Light')
      .onChange(() => {
        this.map.triggerRepaint();
      });

    // Lighting controls.
    const lightFolder = gui.addFolder('Lighting');

    lightFolder
      .addColor(this.state, 'lightColor')
      .name('Light Color')
      .onChange(() => {
        this.map.triggerRepaint();
      })
      .listen();
    lightFolder
      .add(this.state, 'ambientTerm')
      .min(0)
      .max(1)
      .step(0.01)
      .name('Light Ambient Term')
      .onChange((v) => {
        this.map.triggerRepaint();
      })
      .listen();
    lightFolder
      .add(this.state, 'specularTerm')
      .min(0)
      .max(1)
      .step(0.01)
      .name('Light Specular Term')
      .onChange(() => {
        this.map.triggerRepaint();
      });

    lightFolder
      .add(this.state, 'lightCutOff')
      .min(0)
      .max(1)
      .step(0.01)
      .name('Light Cone Cut Off')
      .onChange(() => {
        this.map.triggerRepaint();
      });

    lightFolder
      .add(this.state.lightPosition, 'x')
      .min(-2000)
      .max(2000)
      .step(1)
      .name('Light pos x')
      .onChange(() => {
        this.map.triggerRepaint();
      })
      .listen();
    lightFolder
      .add(this.state.lightPosition, 'y')
      .min(-2000)
      .max(2000)
      .step(1)
      .name('Light pos y')
      .onChange(() => {
        this.map.triggerRepaint();
      })
      .listen();
    lightFolder
      .add(this.state.lightPosition, 'z')
      .min(-100)
      .max(600)
      .step(1)
      .name('Light pos z')
      .onChange(() => {
        this.map.triggerRepaint();
      })
      .listen();

    lightFolder
      .add(this.state.lightDirection, 'x')
      .min(-150)
      .max(150)
      .step(0.01)
      .name('Light dir x')
      .onChange(() => {
        utils.updateDirectionalLight(this.state);

        this.map.triggerRepaint();
      })
      .listen();
    lightFolder
      .add(this.state.lightDirection, 'y')
      .min(-150)
      .max(150)
      .step(0.01)
      .name('Light dir y')
      .onChange(() => {
        utils.updateDirectionalLight(this.state);

        this.map.triggerRepaint();
      })
      .listen();
    lightFolder
      .add(this.state.lightDirection, 'z')
      .min(-150)
      .max(150)
      .step(0.01)
      .name('Light dir z')
      .onChange(() => {
        utils.updateDirectionalLight(this.state);

        this.map.triggerRepaint();
      })
      .listen();

    // Material controls.
    const materialFolder = gui.addFolder('Material');

    materialFolder
      .addColor(this.state, 'materialColor')
      .name('Material Color')
      .onChange(() => {
        this.map.triggerRepaint();
      })
      .listen();
    materialFolder
      .add(this.state, 'materialAmbientTerm')
      .min(0)
      .max(1)
      .step(0.01)
      .name('Material Ambient')
      .onChange(() => {
        this.map.triggerRepaint();
      })
      .listen();
    materialFolder
      .add(this.state, 'materialSpecularTerm')
      .min(0)
      .max(1)
      .step(0.01)
      .name('Material Specular')
      .onChange(() => {
        this.map.triggerRepaint();
      })
      .listen();
    materialFolder
      .add(this.state, 'materialShininess')
      .min(0)
      .max(20)
      .step(0.1)
      .name('Material Shininess')
      .onChange((v) => {
        this.map.triggerRepaint();
      });
    materialFolder
      .add(this.state, 'materialOpacity')
      .min(0)
      .max(1)
      .step(0.01)
      .name('Material Opacity')
      .onChange(() => {
        this.map.triggerRepaint();
      });

    const guiWrap = document.createElement('div');
    this.el.appendChild(guiWrap);
    guiWrap.classList.add('gui-wrap');
    guiWrap.appendChild(gui.domElement);
    gui.open();
  }
}
