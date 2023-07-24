import * as THREE from '../../js/three/build/three.module.js';

const clock = new THREE.Clock();

export const VERTEX_SHADER = `
varying vec2 vUv;

void main() {
vUv = uv;
gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
}
`;

export const BUFFER_A_FRAG = `
uniform vec4 iMouse;
uniform sampler2D iChannel0;
uniform sampler2D iChannel1;
uniform vec2 iResolution;
uniform float iFrame;
varying vec2 vUv;

#define mousedata(a,b) texture2D( iChannel1, (0.5+vec2(a,b)) / iResolution.xy, -0.0 )
#define backbuffer(uv) texture2D( iChannel0, uv ).xy

float random(vec2 p) {
  return fract(sin(dot(p, vec2(12.75, 8.92))) * 53638.97582);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);

  float a = random(i);
  float b = random(i + vec2(1., 0.));
  float c = random(i + vec2(0., 1.));
  float d = random(i + vec2(1., 1.));

  f = f * f * (3.0 - 2.0 * f);

  return mix(mix(a,b,f.x),mix(c,d,f.x), f.y);
}

float fbm(vec2 p) {
  float a = .5;
  float f = 1.;
  float y = 0.;

  for(int i = 0; i < 8; i++) {
    y += a * noise(f * p);
    f *= 2.;
    a *= .5;
  }

  return y;
}

void main() {
  float mx = max(iResolution.x, iResolution.y);
  vec2 uv = gl_FragCoord.xy / mx;
  uv *= 20.;
  vec3 color = vec3(0.);

  color += fbm(uv);

  gl_FragColor = vec4(color, 1.0);
}

`;

export const BUFFER_B_FRAG = `
uniform vec4 iMouse;
uniform sampler2D iChannel0;
uniform vec3 iResolution;
varying vec2 vUv;

float random(vec2 p) {
  return fract(sin(dot(p, vec2(124.75, 83.92))) * 53638.97582);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);

  float a = random(i);
  float b = random(i + vec2(1., 0.));
  float c = random(i + vec2(0., 1.));
  float d = random(i + vec2(1., 1.));

  f = f * f * (3.0 - 2.0 * f);

  return mix(mix(a,b,f.x),mix(c,d,f.x), f.y);
}

float fbm(vec2 p) {
  float a = .5;
  float f = 1.;
  float y = 0.;

  for(int i = 0; i < 8; i++) {
    y += a * noise(f * p);
    f *= 2.;
    a *= .5;
  }

  return y;
}

void main( ) {

  float mx = max(iResolution.x, iResolution.y);
  vec2 uv = gl_FragCoord.xy / mx;
  uv *= 20.;
  vec3 color = vec3(0.);

  color += smoothstep(.995, 1., random(uv));

  gl_FragColor = vec4(color, 1.0);

}
`;

export const BUFFER_FINAL_FRAG = `
uniform vec4 iMouse;
uniform sampler2D iChannel0;
uniform sampler2D iChannel1;
uniform sampler2D iChannel2;
uniform vec2 iResolution;
uniform float iFrame;
uniform float iTime;
varying vec2 vUv;


float farClip = 30.0;
float pi = 3.14159;

float sphere(vec3 p, vec3 c, float r) {
  return length(p - c) - r;
}

float capsule( vec3 p, vec3 a, vec3 b, float r )
{
  vec3 pa = p - a, ba = b - a;
  float h = clamp( dot(pa,ba)/dot(ba,ba), 0.0, 1.0 );
  return length( pa - ba*h ) - r;
}

vec3 triplaner(vec3 n, sampler2D tex, float s) {
  n = normalize(n);
  vec3 xz = texture(tex, (n.xz * .5 + .5) * s).rgb;
  vec3 xy = texture(tex, (n.xy * .5 + .5) * s).rgb;
  vec3 zy = texture(tex, (n.yz * .5 + .5) * s).rgb;

  vec3 tn = abs(n);
  tn *= pow(abs(n), vec3(20.));
  tn /= tn.x + tn.y + tn.z;
  return tn.y * xz + tn.z * xy + tn.x * zy;
}

vec4 map(vec3 p) {
  float d1 = sphere(p, vec3(0.), .25);

  // float roc = triplaner(p, iChannel1, .6).r * 2. - 1.;
  // float d3 = roc;

  // float gra = triplaner(p, iChannel0, 1.).g * 2. - 1.;
  // float gt = .3;
  // float d2 = max(roc, gt) + gra * .2;

  // float wat = gt;
  // float wt = .1;

  // float t1 = smoothstep(gt, gt , roc);
  // float t2 = smoothstep(wt, wt, roc);
  // float t = mix(wat, mix(d2, d3, t1), t2);
  // float dis = t * .05;
  // float d = .7 * (d1 - dis);

  // return vec4(d, t1 + t2, roc, d1);
  return vec4(d1, d1, d1, d1);
}

vec3 calcNormal(vec3 p) {
  float d = map(p).x;
  vec2 e = vec2(.001, 0);

  vec3 n = d - vec3(
    map(p-e.xyy).x,
    map(p-e.yxy).x,
    map(p-e.yyx).x);

  return normalize(n);
}

vec4 marchRay(vec3 ro, vec3 rd) {
  float t = 0.;
  vec4 res;
  for(int i = 0; i < 100; i++) {
    vec3 p = ro + t * rd;
    res = map(p);
    float h = res.x;
    if (h < 0.0001) return vec4(t, res.yz, i);
    t += h;
    if (t > farClip) return vec4(0.0, res.yz, i);
  }
  return vec4(t, res.yz, 100.);
}

float softShadow(vec3 ro, vec3 rd, float k) {
  float res = 1.0;
    float ph = 1e20;
    for( float t = 0.; t<100.;)
    {
      float h = map(ro + rd*t).x;
      if( h<0.001 )
        return 0.0;
      float y = h*h/(2.0*ph);
      float d = sqrt(h*h-y*y);
      res = min( res, k*d/max(0.0,t-y) );
      ph = h;
      t += h;
    }
    return res;
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * iResolution.xy) / iResolution.x;

  float tx = iTime / 2.0 + 3.;
  float ty = 0.2;
  if (iMouse.z > 0.0) {
    tx = iMouse.x / iResolution.x * 3.1416 * 3.0 + 3.14;
    ty = iMouse.y / iResolution.y - .1;
  }

  vec3 ro = vec3(cos(tx * .7), ty, sin(tx * .7));
  vec3 ta = vec3(0.0, 0.0, 0.0);

  // camera axes
  vec3 ww = normalize(ta - ro);
  vec3 uu = normalize(cross(ww, vec3(0,1,0)));
  vec3 vv = normalize(cross(uu, ww));

  vec3 rd = normalize(uv.x*uu + uv.y*vv + .9*ww);

    vec4 res = marchRay(ro, rd);
    float t = res.x;
    float mat = res.y;
    float h = res.z;
    float i = res.w;

    vec3 l = normalize(vec3(1., .17, 1.));
    float vdotl = max(dot(rd, l), 0.0);

    vec3 fog = vec3(.01, .01, .02);
    vec3 sun = vec3(0.6, 0.2, 0.);
    float sunAmount = pow(vdotl, 256.);
    fog = mix(fog, sun, sunAmount);
    fog += pow(triplaner(rd, iChannel2, 2.), vec3(1.));
    fog += pow(triplaner(rd, iChannel1, 1.), vec3(10.))
    * vec3(.7, .5, .9);
    vec3 col = fog;

    if (t > 0.0) {
        col = vec3(0.0);
        vec3 p = ro + t * rd;

        vec3 n = calcNormal(p);
        vec3 np = normalize(p);
        vec3 cNoise = triplaner(p, iChannel0, 2.) * 2. - 1.;
        n = mix(mix(np, cNoise, .02), mix(n, cNoise, .3), step(1.5, mat));
        n = mix(mix(n, cNoise, .02), n, step(.5, mat));
        n = normalize(n);

        vec3 r = reflect(-l, n);

        float ndotl = clamp(dot(n, l), 0., 1.);
        float rdotv = clamp(dot(-rd, r), 0., 1.);
        float npdotl = clamp(dot(np, l), 0., 1.);

        vec3 albedo;
        vec3 water1 = vec3(.05, .1, .4);
        vec3 water2 = vec3(.05, .25, .55);
        vec3 water = mix(water1, water2, smoothstep(-.4, .2, h));

        vec3 rock = mix(vec3(.3, .28, .25),
          vec3(2.0), smoothstep(.5, .6, h));
        albedo = mix(water, triplaner(n, iChannel0, 1.) * vec3(.5, 1., .6), clamp(mat, 0., 1.));
        albedo = mix(albedo, rock, clamp(mat - 1., 0., 1.));

        float sha = softShadow(p + .02 * n, l, 64.);
        float diff = max(ndotl, .3 * npdotl);
        float sp = pow(rdotv, 30.) * smoothstep(.9, 0., mat);
        float sky = clamp(.5 + .5 * n.y, 0., 1.);
        float ind = clamp(dot(n, normalize(l * vec3(-1., 0., -1.))), 0., 1.);

        vec3 lin = (diff * sha) * .7 * sun + .02;
        col = albedo * lin + sp * sun * .8;
    }

    // atmosphere
    vec3 p = .9 * rd * length(ro) / dot(normalize(-ro), rd);
    float sha = clamp(capsule(ro + p, vec3(0.), -l * 100., .24), 0., 1.);

    float at = pow(i / 20., 2.);
    col += mix(
    vec3(.2, .5, 1.) * (pow(vdotl, 3.) * .5 + .1),
    vec3(.7, .4, .3) * (pow(vdotl, 3.) * .5),
    pow(vdotl, 10.)) * smoothstep(0., .05, sha) * at;

    col = pow(col, vec3(1.0 / 2.2));

    gl_FragColor = vec4(col, 1.0);
}
`;

export class App {
  constructor(renderer, camera, scene, canvas, width, height) {
    this.canvas = canvas;
    this.width = width;
    this.height = height;

    this.scene = scene;
    this.renderer = renderer; // new THREE.WebGLRenderer({ canvas: this.canvas });
    this.loader = new THREE.TextureLoader();
    this.mousePosition = new THREE.Vector4();
    this.orthoCamera = camera; //new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.counter = 0;

    this.renderer.setSize(this.width, this.height);
    document.body.appendChild(this.renderer.domElement);

    this.renderer.domElement.addEventListener('mousedown', () => {
      this.mousePosition.setZ(1);
      this.counter = 0;
    });

    this.renderer.domElement.addEventListener('mouseup', () => {
      this.mousePosition.setZ(0);
    });

    this.renderer.domElement.addEventListener('mousemove', (event) => {
      this.mousePosition.setX(event.clientX);
      this.mousePosition.setY(this.height - event.clientY);
    });

    this.targetA = new BufferManager(this.renderer, this.scene, {
      width: this.width,
      height: this.height,
    });
    this.targetB = new BufferManager(this.renderer, this.scene, {
      width: this.width,
      height: this.height,
    });
    this.targetC = new BufferManager(this.renderer, this.scene, {
      width: this.width,
      height: this.height,
    });
  }

  start() {
    const resolution = new THREE.Vector3(
      this.width,
      this.height,
      window.devicePixelRatio
    );
    const channel0 = this.loader.load(
      './assets/textures/bathymetry_bw_composite_4k.jpg'
    );
    const channel1 = this.loader.load('./assets/textures/channel2.png');
    this.loader.setCrossOrigin('');

    this.bufferA = new BufferShader(this.scene, BUFFER_A_FRAG, {
      iFrame: {
        value: 0,
      },
      iResolution: {
        value: resolution,
      },
      iMouse: {
        value: this.mousePosition,
      },
      iChannel0: {
        value: null,
      },
      iChannel1: {
        value: null,
      },
    });

    this.bufferB = new BufferShader(this.scene, BUFFER_B_FRAG, {
      iFrame: {
        value: 0,
      },
      iResolution: {
        value: resolution,
      },
      iMouse: {
        value: this.mousePosition,
      },
      iChannel0: {
        value: null,
      },
    });

    this.bufferImage = new BufferShader(this.scene, BUFFER_FINAL_FRAG, {
      iResolution: {
        value: resolution,
      },
      iMouse: {
        value: this.mousePosition,
      },
      iChannel0: {
        value: channel0,
      },
      iChannel1: {
        value: channel0,
      },
      iTime: {
        value: null,
      },
    });

    this.animate();
  }

  animate() {
    requestAnimationFrame(() => {
      const elapsedTime = clock.getElapsedTime();

      this.bufferA.uniforms['iFrame'].value = this.counter++;

      this.bufferA.uniforms['iChannel0'].value =
        this.targetA.readBuffer.texture;
      this.bufferA.uniforms['iChannel1'].value =
        this.targetB.readBuffer.texture;
      this.targetA.render(this.bufferA.scene, this.orthoCamera);

      this.bufferB.uniforms['iChannel0'].value =
        this.targetB.readBuffer.texture;
      this.targetB.render(this.bufferB.scene, this.orthoCamera);

      this.bufferImage.uniforms['iChannel1'].value =
        this.targetA.readBuffer.texture;
      this.bufferImage.uniforms['iTime'].value = elapsedTime;

      this.targetC.render(this.bufferImage.scene, this.orthoCamera, true);

      this.animate();
    });
  }
}

export class BufferShader {
  constructor(scene, fragmentShader, uniforms = {}) {
    this.scene = scene;
    this.uniforms = uniforms;
    this.material = new THREE.ShaderMaterial({
      fragmentShader: fragmentShader,
      vertexShader: VERTEX_SHADER,
      uniforms: uniforms,
    });
    // this.scene = new THREE.Scene();
    this.scene.add(
      new THREE.Mesh(new THREE.PlaneBufferGeometry(3, 3), this.material)
    );
  }
}

export class BufferManager {
  constructor(renderer, scene, size) {
    this.renderer = renderer;
    this.scene = scene;

    this.readBuffer = new THREE.WebGLRenderTarget(size.width, size.height, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      type: THREE.FloatType,
      stencilBuffer: false,
    });

    this.writeBuffer = this.readBuffer.clone();
  }

  swap() {
    const temp = this.readBuffer;
    this.readBuffer = this.writeBuffer;
    this.writeBuffer = temp;
  }

  render(scene, camera, toScreen = false) {
    // write false to glitch
    if (toScreen) {
      this.renderer.render(this.scene, camera);
    } else {
      this.renderer.setRenderTarget(this.writeBuffer);
      this.renderer.clear();
      this.renderer.render(this.scene, camera);
      this.renderer.setRenderTarget(null);
    }
    this.swap();
  }
}
