const extrudeFbmShader = `
  precision mediump float;
  
  #define NUM_OCTAVES 5

  // Fractional Brownian motion for 1, 2 and 3 dimensions
  float fbm (in float x) {
      float v = 0.0;
      float a = 0.5;
      float shift = float(100.0);
      for (int i = 0; i < int(NUM_OCTAVES); ++i) {
          v += a * noise(x);
          x = x * 2.0 + shift;
          a *= 0.5;
      }
      return v;
  }
  float fbm (in vec2 xy) {
      float v = 0.0;
      float a = 0.5;
      vec2 shift = vec2(100.0);
      mat2 rot = mat2(cos(0.5), sin(0.5), 
                      -sin(0.5), cos(0.50));
      for (int i = 0; i < int(NUM_OCTAVES); ++i) {
          v += a * noise(xy);
          xy = rot * xy * 2.0 + shift;
          a *= 0.5;
      }
      return v;
  }
  float fbm (in vec3 xyz) {
      float v = 0.0;
      float a = 0.5;
      vec3 shift = vec3(100.0);
      for (int i = 0; i < int(NUM_OCTAVES); ++i) {
          v += a * noise(xyz);
          xyz = xyz * 2.0 + shift;
          a *= 0.5;
      }
      return v;
  }

`;

export default extrudeFbmShader;
