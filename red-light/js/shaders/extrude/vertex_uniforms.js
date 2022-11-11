const extrudeVertexUniformsShader = `
  precision mediump float;
  precision highp float;

  uniform mat4 u_model_view_matrix;
  uniform mat4 u_projection_matrix;
  uniform mat4 u_normal_matrix;
  uniform vec3 u_light_position;
  uniform vec3 u_light_direction;
  uniform float u_building_type;

`;

export default extrudeVertexUniformsShader;
