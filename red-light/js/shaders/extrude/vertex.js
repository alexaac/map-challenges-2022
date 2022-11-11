// https://github.com/maplibre/maplibre-gl-js/blob/main/src/shaders/fill_extrusion.vertex.glsl
const extrudeVertexShader = `

  void main() {

    // vec3 normal = vec3(u_normal_matrix * a_vertex_normal);
    vec3 normal = a_vertex_normal.xyz;

    float t = mod(normal.x, 2.0);
    float base = max(0.0, a_vertex_base.x);
    float height = max(0.0, a_vertex_height.x);
    float z = t > 0.0 ? height : base;
    vec4 pos = vec4(a_vertex_position, z, 1.0);

    vec4 vertex = u_model_view_matrix * pos;
    // vec4 vertex = pos;

    vec4 positionLight = u_model_view_matrix * vec4(u_light_position, 1.0);
    v_light_ray = vertex.xyz - positionLight.xyz;

    vec3 directionLight = vec3(a_vertex_normal * vec4(u_light_direction, 1.0));
    v_normal = normal - directionLight;
    // v_normal = normal;

    gl_Position = u_projection_matrix * u_model_view_matrix * pos;

    v_pos = pos;
    v_texture_coords = 0.02 * (pos.xz + vec2(250, pos.y));
    v_building_type = u_building_type;
  }

`;

export default extrudeVertexShader;
