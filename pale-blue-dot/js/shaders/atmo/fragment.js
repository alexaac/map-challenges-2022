const splineFragmentShader = `
  uniform float c;
  uniform float p;
  
  varying vec3 vNormal;

  void main() {
    float intensity = pow( c - dot( vNormal, vec3( 0.0, 0.0, 1.0 ) ), p ); 
    // gl_FragColor = vec4( 1.0, 1.0, 1.0, 1.0 ) * intensity;

    // float intensity = pow( 0.8 - dot( vNormal, vec3( 0, 0, 1.0 ) ), 14.0 );
    
    gl_FragColor = vec4( vec3(0.29,0.588,0.988), 1.0 ) * intensity;

  }
`;

export default splineFragmentShader;
