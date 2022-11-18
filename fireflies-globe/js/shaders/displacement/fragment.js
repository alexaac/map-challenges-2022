const fragmentShader = `
  // varying vec2 vUv;
  // uniform sampler2D uTexture;

  // void main( void ) {
  //     vec4 textureColor = texture2D(uTexture, vUv);
  //     gl_FragColor = textureColor;
  // }

  // // uniform float opacity;
  // uniform sampler2D tDiffuse;

  // varying vec2 vUv;

  // void main() {
  //   vec4 texel = texture2D( tDiffuse, vUv );
  //   gl_FragColor = texel;
  // }

  // Read our uv and textures, as well as fade value
  uniform sampler2D texture1;
  uniform sampler2D texture2;
  uniform float fade;
  varying vec2 vUv;
  
  void main(){
  
    // Read our pixel colors as rgba
    vec4 t1 = texture2D( texture1, vUv );
    vec4 t2 = texture2D( texture2, vUv );
    
    // Mix our pixels together based on fade value
    gl_FragColor = mix( t1, t2, fade );
    
  }
`;

export default fragmentShader;
