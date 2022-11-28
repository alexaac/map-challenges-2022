const atmosphereVertexShader = `
  uniform float c;
  uniform float p;
  
  varying float intensity;
  varying vec3 vcameraPosition;
  varying vec2 vUv;

  void main() 
  {
    vUv = uv;
    
    vec3 vNormal = normalize( normalMatrix * normal );
    vec3 vNormel = normalize( normalMatrix * cameraPosition );
    intensity = pow( c - dot(vNormal, vNormel), p );
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
  }
`;

export default atmosphereVertexShader;
