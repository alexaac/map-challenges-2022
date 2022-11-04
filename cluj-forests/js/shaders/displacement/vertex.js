const vertexShader = `
  varying vec2 vUv;
  varying float noise;
  varying vec3 fNormal;
  varying float vElevation;
  
  uniform sampler2D uTexture;
  uniform float uScale;
  uniform vec2 uFrequency;
  uniform float uTime;

  void main() {

      vUv = uv;
      
      fNormal = normal;
      
      vec4 noiseTex = texture2D( uTexture, vUv );
      
      noise = noiseTex.r;
      //adding the normal scales it outward
      //(normal scale equals sphere diameter)


      vec4 modelPosition = modelMatrix * vec4(position, 1.0);

      float elevation = sin(modelPosition.x * uFrequency.x - uTime) * 0.1;
      elevation += sin(modelPosition.y * uFrequency.y - uTime) * 0.1;
      vElevation = elevation;

      vec3 newPosition = position + normal * noise * uScale;

      gl_Position = projectionMatrix * modelViewMatrix * vec4( newPosition, 1.0 );
  }
`;

export default vertexShader;
