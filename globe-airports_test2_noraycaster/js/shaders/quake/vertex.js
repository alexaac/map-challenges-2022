const quakeVertexShader = ` 
  attribute float aMagnitude;
  attribute float aSize;
  attribute float aPhase;
  
  varying vec2 vUv;
  varying float vPhase;

  void main() {
      
    vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );

    gl_PointSize = (aSize*aMagnitude) * ( 200.0 / -mvPosition.z );

    gl_Position = projectionMatrix * mvPosition;

    // float pointSize = aSize + min(aSize * pow(aMagnitude / 5.0, 8.0), 14.0);
    // pointSize = pointSize + (10.0 * pow(1.0, 9.0));

    // gl_PointSize = pointSize;

    vUv = uv;
    vPhase = aPhase;

    // gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
  }
`;

export default quakeVertexShader;
