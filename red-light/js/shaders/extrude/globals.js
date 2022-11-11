const extrudeGlobalsShader = `

  #define TANGRAM_FRAGMENT_SHADER true
  #define TANGRAM_EPSILON 0.00001

  // Vertex position in world coordinates, useful for 3d procedural textures, etc.
  vec4 worldPosition() {
    return v_pos;
  }

  // Normal in world space
  vec3 worldNormal() {
    return v_normal;
  }
`;

export default extrudeGlobalsShader;
