const extrudeNormalShader = `
  #ifdef TANGRAM_FRAGMENT_SHADER
  // Ask to the geometry normals if this surface is a Wall
  bool isWall () {
      return dot(vec3(0., 0., 1.), worldNormal()) < 1.0 - TANGRAM_EPSILON;
  }
  
  //
  // Ask to the geometry normals if this surface is a roof
  bool isRoof () {
      return !isWall();
  }
  #endif
  
`;

export default extrudeNormalShader;
