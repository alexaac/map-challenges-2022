const extrudeFragmentUniformsShader = `
  precision mediump float;

  uniform vec4 u_material_ambient;
  uniform vec3 u_material_diffuse;
  uniform bool u_wireframe;
  uniform bool u_light_source;
  uniform vec4 u_light_ambient;
  uniform vec3 u_light_diffuse;
  uniform float u_cut_off;

  uniform vec3 u_map_position;
  uniform vec2 u_resolution; // = (window-width, window-height)

`;

export default extrudeFragmentUniformsShader;
