const extrudeLightsShader = `

  vec4 computeLighs() {
    // Ambient
    vec4 Ia = u_light_ambient * u_material_ambient;
    // Base color
    vec4 final_color = vec4(0.0, 0.0, 0.0, 1.0);

    // Normalized light direction
    vec3 L = vec3(0.0);
    // Normalized normal
    vec3 N = vec3(0.0);
    float lambertTerm = 0.0;

    L = normalize(v_light_ray);
    N = normalize(v_normal);
    lambertTerm	= dot(N, -L);
    if (lambertTerm > u_cut_off) {
      final_color += vec4(u_light_diffuse, 1.0) * vec4(u_material_diffuse, 1.0);
    }

    return vec4(vec3(final_color), 1.0);
    // return vec4(vec3(u_material_diffuse), 1.0);
  }

`;

export default extrudeLightsShader;
