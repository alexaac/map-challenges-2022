const quakeFragmentShader = `
  uniform sampler2D uPointTexture;
  uniform sampler2D uNoiseTexture;
  uniform float uTime;

  varying vec2 vUv;
  varying float vPhase;

  void main() {
    vec2 lUv = vUv;

    gl_FragColor = vec4( 0.0, 0.0, 1.0, 0.1 );

    // vec2 lUv = (vUv - 0.5) * 2.;
    float val = 0.;
    float lenUv = length(lUv);
    // val = max(val, 1. - step(0.25, lenUv)); // central circle
    // val = max(val, step(0.4, lenUv) - step(0.5, lenUv)); // outer circle
    
    float tShift = fract(uTime * 0.2 + 2.0*vPhase);
    val = max(val, step(0.4 + (tShift * 0.6), lenUv) - step(0.5 + (tShift * 0.5), lenUv)); // ripple
    
    // if (val < 0.5) discard;
    
    vec4 textureColor = texture2D(uPointTexture, lUv);
    vec4 noiseColor = texture2D(uNoiseTexture, vec2(lUv.x + uTime, lUv.y));
    float noiseAlpha = pow(noiseColor.r, 3.0);

    vec4 finalColor = vec4(textureColor.rgb, (textureColor.a * 1.0 * 1.0) * 1.0);

    vec4 diffuseColor = vec4( finalColor.rgb, 0.5);
    if (val > 0.5) {
      diffuseColor =  vec4(1.,1.,1., 0.05);
    }

    gl_FragColor = diffuseColor;
    // gl_FragColor = gl_FragColor * texture2D( uPointTexture, gl_PointCoord );

  }

`;

export default quakeFragmentShader;
