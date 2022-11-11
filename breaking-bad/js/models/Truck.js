// https://github.com/jscastro76/threebox example

export class Truck {
  constructor(tb, map, layerName, mapConfig, gui, api) {
    this.tb = tb;
    this.map = map;
    this.id = layerName;
    this.mapConfig = mapConfig;
    this.type = 'custom';
    this.renderingMode = '3d';
    this.gui = gui;
    this.api = api;

    this.animateParams = { velocity: 0.0, speed: 0.0, ds: 0.01 };
  }

  onAdd(map, gl) {
    const options = {
      type: this.mapConfig.truck.type, //model type
      obj: this.mapConfig.truck.model + '.' + this.mapConfig.truck.type,
      units: 'meters', // in meters
      scale: this.mapConfig.truck.scale, //x3 times is real size for this model
      rotation: this.mapConfig.truck.rotation, //default rotation
      anchor: 'top',
    };

    this.tb.loadObj(options, (model) => {
      const truck = model.setCoords(this.mapConfig.truck.origin);
      truck.setRotation(this.mapConfig.truck.startRotation); //turn it to the initial street way
      truck.addTooltip('Drive with WASD keys', true, truck.anchor, true, 2);
      truck.castShadow = true;
      truck.selected = true;
      truck.addEventListener(
        'ObjectChanged',
        (e) => this.onObjectChanged(e),
        false
      );
      this.truck = truck;

      this.tb.add(this.truck);
      this.init();
    });
  }

  light(feature) {
    const fHover = feature;

    if (fHover.id) {
      this.map.setFeatureState(
        {
          source: fHover.source,
          sourceLayer: fHover.sourceLayer,
          id: fHover.id,
        },
        { select: true }
      );
    }
  }

  onObjectChanged(e) {
    let model = e.detail.object; //here's the object already modified
    if (this.api.buildings) {
      let c = model.coordinates;
      let point = this.map.project(c);
      let features = this.map.queryRenderedFeatures(point, {
        layers: [this.mapConfig.names.compositeLayer],
      });
      if (features.length > 0) {
        this.light(features[0]); // crash!
      }
    }
  }

  changeGui() {
    let l = this.mapConfig.names.compositeLayer;
    if (this.api.buildings) {
      if (!this.map.getLayer(l)) {
        this.map.addLayer(createCompositeLayer(l));
      }
    } else {
      if (this.map.getLayer(l)) {
        this.map.removeLayer(l);
      }
    }

    this.tb.map.repaint = true;
  }

  init() {
    this.keys = {
      a: false,
      s: false,
      d: false,
      w: false,
    };

    document.body.addEventListener('keydown', (e) => {
      const key = e.code.replace('Key', '').toLowerCase();
      if (this.keys[key] !== undefined) this.keys[key] = true;
    });

    document.body.addEventListener('keyup', (e) => {
      const key = e.code.replace('Key', '').toLowerCase();

      if (this.keys[key] !== undefined) this.keys[key] = false;
    });

    this.animate();

    // this will define if there's a fixed zoom level for the model
    this.gui
      .add(this.api, 'buildings')
      .name('buildings')
      .onChange(this.changeGui());
    this.gui.add(this.api, 'acceleration', 1, 10).step(0.5);
    this.gui.add(this.api, 'inertia', 1, 5).step(0.5);
  }

  easing(t) {
    return t * (2 - t);
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    let { velocity, speed, ds } = this.animateParams;

    if (!(this.keys.w || this.keys.s)) {
      if (velocity > 0) {
        speed = -this.api.inertia * ds;
      } else if (velocity < 0) {
        speed = this.api.inertia * ds;
      }
      if (velocity > -0.0008 && velocity < 0.0008) {
        speed = velocity = 0.0;
        return;
      }
    }

    if (this.keys.w) speed = this.api.acceleration * ds;
    else if (this.keys.s) speed = -this.api.acceleration * ds;

    velocity += (speed - velocity) * this.api.acceleration * ds;
    if (speed == 0.0) {
      velocity = 0;
      return;
    }

    this.truck.set({ worldTranslate: new THREE.Vector3(0, -velocity, 0) });

    let options = {
      center: this.truck.coordinates,
      bearing: this.map.getBearing(),
      easing: this.easing,
    };

    function toDeg(rad) {
      return (rad / Math.PI) * 180;
    }

    function toRad(deg) {
      return (deg * Math.PI) / 180;
    }

    let deg = 1;
    let rad = toRad(deg);
    let zAxis = new THREE.Vector3(0, 0, 1);

    if (this.keys.a || this.keys.d) {
      rad *= this.keys.d ? -1 : 1;
      this.truck.set({ quaternion: [zAxis, this.truck.rotation.z + rad] });

      options.bearing = -toDeg(this.truck.rotation.z);
    }

    this.animateParams = { velocity, speed, ds };
    this.map.jumpTo(options);
    this.tb.map.update = true;
  }

  render(gl, matrix) {
    this.tb.update();
  }
}
