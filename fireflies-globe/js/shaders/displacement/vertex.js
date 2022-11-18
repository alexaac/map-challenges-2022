const vertexShader = `
  // varying vec2 vUv;
  
  // uniform sampler2D uTexture;
  // uniform float uScale;

  // void main() {

  //     vUv = uv;
  //     // vUv = uv * 2.0;
  //     // vUv = fract(uv * 2.0);
     
  //     vec4 noiseTex = texture2D( uTexture, vUv );
  //     float noise = noiseTex.r;

  //     vec4 modelPosition = modelMatrix * vec4(position, 1.0);
  //     vec3 newPosition = position + noise * 1.0;

  //     gl_Position = projectionMatrix * modelViewMatrix * vec4( newPosition, 1.0 );
  // }

  // varying vec2 vUv;

  // void main() {
  //   vUv = vec2( uv.x, 1.0 - uv.y );
  //   gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

  // }

  // Define the uv we want to pass to our fragment shader
  varying vec2 vUv;
  
  void main(){
  
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
  
  }
`;

export default vertexShader;
