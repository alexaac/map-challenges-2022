// https://github.com/maplibre/maplibre-gl-js/blob/main/src/shaders/fill_extrusion.vertex.glsl
const extrudeVertexShader = `
  precision mediump float;
  precision highp float;

  uniform mat4 u_matrix;
  uniform mat4 u_model_view_matrix;
  uniform mat4 u_projection_matrix;
  uniform mat4 u_normal_matrix;
  uniform mat4 u_model_matrix;
  uniform mat4 u_view_matrix;
  // uniform vec2 u_resolution; // = (window-width, window-height)
  uniform float u_building_type;
  uniform vec3 u_light_position;
  uniform vec3 u_light_direction;

  uniform vec4 u_pattern_from;
  uniform vec4 u_pattern_to;
  uniform float u_pixel_ratio_from;
  uniform float u_pixel_ratio_to;

  vec2 get_pattern_pos(const vec2 pixel_coord_upper, const vec2 pixel_coord_lower,
    const vec2 pattern_size, const float tile_units_to_pixels, const vec2 pos) {

    vec2 offset = mod(mod(mod(pixel_coord_upper, pattern_size) * 256.0, pattern_size) * 256.0 + pixel_coord_lower, pattern_size);

    return (tile_units_to_pixels * pos + offset) / pattern_size;
  }

  void main() {

    
    // v_pos = pos;

    // v_texture_coords = 0.02 * (pos.xz + vec2(250, pos.y));
  
    // pattern_tl_a = u_pattern_from.xy;
    // pattern_br_a = u_pattern_from.zw;
    // pattern_tl_b = u_pattern_to.xy;
    // pattern_br_b = u_pattern_to.zw;

    // float tileZoomRatio = 1.0;
    // float fromScale = 1.0;
    // float toScale = 1.0;

    // vec2 display_size_a = (pattern_br_a - pattern_tl_a) / u_pixel_ratio_from;
    // vec2 display_size_b = (pattern_br_b - pattern_tl_b) / u_pixel_ratio_to;

    // const vec2 u_pixel_coord_upper = vec2(0.0, 0.0);
    // const vec2 u_pixel_coord_lower = vec2(0.0, 0.0);

    // float u_height_factor = 10.2;

    // float edgedistance = a_vertex_normal.w;
    // vec2 posEx = normal.x == 1.0 && normal.y == 0.0 && normal.z == 16384.0
    //     ? pos.xy // extrusion top
    //     : vec2(edgedistance, z * u_height_factor); // extrusion side

    // v_pos_a = get_pattern_pos(u_pixel_coord_upper, u_pixel_coord_lower, fromScale * display_size_a, tileZoomRatio, posEx);
    // v_pos_b = get_pattern_pos(u_pixel_coord_upper, u_pixel_coord_lower, toScale * display_size_b, tileZoomRatio, posEx);

    // // gl_Position = u_projection_matrix * u_model_view_matrix * pos;
    // gl_Position = u_matrix * pos;

    // v_normal = a_vertex_normal.xyz;
    // v_eye_vector = -vec3(pos.xyz);
    // v_building_type = u_building_type;

    // vec3 normal = vec3(u_normal_matrix * a_vertex_normal);
    vec3 normal = a_vertex_normal.xyz;
    float t = mod(normal.x, 2.0);
    
    float base = max(0.0, a_vertex_base.x);
    float height = max(0.0, a_vertex_height.x);
    float z = t > 0.0 ? height : base;
    
    vec4 pos = vec4(a_vertex_position, z, 1);
    vec4 vertex = u_model_view_matrix * pos;
    // vec4 vertex =  pos;

    vec4 positionLight = u_model_view_matrix * vec4(u_light_position, 1.0);
    vec3 directionLight = vec3(u_normal_matrix * vec4(u_light_direction, 1.0));
    v_normal = normal - directionLight;
    v_light_ray = vertex.xyz - positionLight.xyz;

    gl_Position = u_projection_matrix * u_model_view_matrix * pos;

  }

`;

export default extrudeVertexShader;
