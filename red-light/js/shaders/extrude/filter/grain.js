const extrudeGrainShader = `

  #ifdef TANGRAM_FRAGMENT_SHADER
  float grain () {
      vec2 pos = gl_FragCoord.xy;
      vec2 st = pos/u_resolution.xy - vec2(.5);
      return dot(st,st) + (fbm(pos * 0.6)*0.1);
  }
  #endif

  
`;

export default extrudeGrainShader;
