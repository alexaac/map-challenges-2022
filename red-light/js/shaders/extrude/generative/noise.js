const extrudeNoiseShader = `

  uniform sampler2D u_random;

  #define NOISE_TEXSAMPLE 1
  #define NOISE_TEXSAMPLE_SIZE 256.0

  // Value Noise 
  float noise (in float x) {
      #ifdef NOISE_TEXSAMPLE
      return texture2D(u_random, vec2(x*(1./NOISE_TEXSAMPLE_SIZE))).r;
      #else
      float i = floor(x);
      float f = fract(x);
      f = f * f * (3.0 - 2.0 * f);
      return mix(random(i), random(i + 1.0), f);
      #endif
  }

  // Value Noise
  float noise (vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      #ifdef NOISE_TEXSAMPLE
      vec2 uv = i.xy + f.xy*f.xy*(3.0-2.0*f.xy);
      return texture2D(u_random, fract((uv+118.4)/NOISE_TEXSAMPLE_SIZE) ).x;
      #else
      f = f * f * (3.0 - 2.0 * f);
      float a = random(i);
      float b = random(i + vec2(1.0, 0.0));
      float c = random(i + vec2(0.0, 1.0));
      float d = random(i + vec2(1.0, 1.0));
      return mix(a, b, f.x) + (c - a) * f.y * (1.0 - f.x) + (d - b) * f.x * f.y;
      #endif
  }

  // Value Noise
  float noise (vec3 p) {
      vec3 i = floor(p);
      vec3 f = fract(p);
      f = f*f*(3.0-2.0*f);
      #ifdef NOISE_TEXSAMPLE
      vec2 uv = (i.xy+vec2(37.0,17.0)*i.z) + f.xy;
      vec2 rg = texture2D(u_random, fract((uv+.5)/NOISE_TEXSAMPLE_SIZE), -100.0 ).yx;
      return mix( rg.x, rg.y, f.z );
      #else
      float n = i.x + i.y*57.0 + 113.0*i.z;
      return mix(mix(mix(random(n+0.0),random(n+1.0),f.x),mix(random(n+ 57.0),random(n+ 58.0),f.x),f.y),mix(mix(random(n+113.0),random(n+114.0),f.x),mix(random(n+170.0),random(n+171.0),f.x),f.y),f.z);
      /*
      const vec3 step = vec3(110.0, 241.0, 171.0);
      float n = dot(i, step);
      return mix( mix(mix(random(n + dot(step, vec3(0,0,0))),
                          random(n + dot(step, vec3(1,0,0))), f.x),
                      mix(random(n + dot(step, vec3(0,1,0))),
                          random(n + dot(step, vec3(1,1,0))), f.x),
                      f.y),
                  mix(mix(random(n + dot(step, vec3(0,0,1))),
                          random(n + dot(step, vec3(1,0,1))), f.x),
                      mix(random(n + dot(step, vec3(0,1,1))),
                          random(n + dot(step, vec3(1,1,1))), f.x),
                  f.y),
              f.z);
              */
      #endif
  }

`;

export default extrudeNoiseShader;
