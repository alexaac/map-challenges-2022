const splineFragmentShader = `
  // https://threejs.org/examples/webgl_custom_attributes_lines.html
  
  uniform float uTime;  
  uniform vec3 color;
  uniform float opacity;

  varying vec2 vUv;
  varying vec3 vColor;

  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187,  // (3.0-sqrt(3.0))/6.0
                        0.366025403784439,  // 0.5*(sqrt(3.0)-1.0)
                        -0.577350269189626,  // -1.0 + 2.0 * C.x
                        0.024390243902439); // 1.0 / 41.0
    vec2 i  = floor(v + dot(v, C.yy) );
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i); // Avoid truncation effects in permutation
    vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
        + i.x + vec3(0.0, i1.x, 1.0 ));

    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m ;
    m = m*m ;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  void main() {

    vec3 colorA = vec3(0.500,0.141,0.912);
    vec3 colorB = vec3(1.000,0.833,0.224);
    vec3 tempColor = vec3(0. ,1. ,1.);
    
    float noise1 = snoise(vUv + uTime * 0.1);
    float noise2 = snoise(vUv * 2. + uTime * 0.1);

    vec3 colorMix = vec3(1.0);
    // colorMix = mix(colorA, colorB, sin(uTime * 0.8) + 0.5);
    // colorMix = mix(colorMix, tempColor, noise2 * 0.6);
    // // colorMix = mix(colorA, colorB,  noise2 * 2.0);
    colorMix = mix(vColor, tempColor,  .5);

    // gl_FragColor = vec4(  colorMix, opacity );
    // gl_FragColor = vec4( vColor * colorMix, opacity );
    // // gl_FragColor = vec4( vColor , opacity );

    float dash = sin(vUv.x * 100. - uTime);

    if (dash < 0.) discard;


    // gl_FragColor = vec4( mix(vec3(vUv.x , 0., 0.), vColor , 0.9), 1. );
    gl_FragColor = vec4( mix(vec3(vUv.x , 0., 0.), colorMix , 0.9), 1. );
  }
`;

export default splineFragmentShader;
