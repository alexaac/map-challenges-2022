const fragmentShader = `
  varying vec2 vUv;
  varying float noise;
  varying float vElevation;
  varying vec3 fNormal;
  uniform sampler2D uTexture;

  void main( void ) {

      // compose the colour using the normals then 
      // whatever is heightened by the noise is lighter

      vec4 textureColor = texture2D(uTexture, vUv);
      // textureColor.rgb *= vElevation * 2.0 + 0.5;
      gl_FragColor = textureColor;

      // gl_FragColor = vec4( fNormal * noise, 1. );

  }
`;

export default fragmentShader;
