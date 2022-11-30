const bufferBFragmentShader = `
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

export default bufferBFragmentShader;
