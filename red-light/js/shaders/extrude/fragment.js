const extrudeFragmentShader = `
  precision mediump float;

  #define GRAIN_AMOUNT 0.9

  void main() {
    // Base color
    vec4 final_color = vec4(0.0, 0.0, 0.0, 1.0);

    if (u_wireframe || u_light_source){
      final_color = vec4(vec3(u_material_diffuse), 1.0);
    }
    else {
      vec4 Ia = u_light_ambient * u_material_ambient;
      vec4 Id = vec4(0.0, 0.0, 0.0, 1.0);

      vec3 N = normalize(v_normal);

      float lambertTerm = dot(N, -normalize(v_light_ray));

      if (lambertTerm > u_cut_off) {
        Id = vec4(vec3(u_light_diffuse), 1.0) * vec4(vec3(u_material_diffuse), 1.0) * lambertTerm;
      }

      final_color = vec4(vec3(Ia + Id), 1.0);
    }
    
    gl_FragColor = final_color;
    
    vec4 color = vec4(0.0, 0.0, 0.0, 1.0);
    vec4 specular = vec4(0.0, 0.0, 0.0, 1.0);
    vec4 emission = vec4(0.0, 0.0, 0.0, 1.0);

    vec2 st = vec2(v_texture_coords.x * 2., worldPosition().z * 0.2);
    vec2 ipos = floor(st);
    vec2 fpos = fract(st);
    color.rgb *= vec3(min((worldPosition().z * .001 + .5), 1.));

    if (isWall()) {
      if (v_building_type == 1.0) {
        float t = 0.5;
          if ( step(0.6, fpos.x) * step(0.4, fpos.y) > 0.0 ){
            specular = vec4(1.) * max( 1.-(worldPosition().z * .001 + .5), 0. );
            emission = vec4(0.988, 0.983, 0.880, 1.0) * step(.5, random(ipos + floor(worldNormal().xy * 10.0) + t));
        }
      } else {
        if ( step(0.01, fpos.x) * step(0.1, fpos.y) > 0.0 ){
          specular = vec4(1.) * max( 1.-(worldPosition().z * .001 + .5), 0. );
          emission = vec4(0.957, 0.988, 0.976, 1.0) * step(.5, random(ipos * vec2(0.0000001,0.01) + floor(worldNormal().xy*10.0)));
          emission *= vec4(0.988, 0.983, 0.880, 1.0) * step(.5, random(ipos));
        }
      }
    }

    color.rgb *= emission.rgb * emission.a;
    color *= specular;
    color.rgb += vec3(1.)* min( 1.-(worldPosition().z * .001 + .7) , 0.5 );
    
    // Apply the grain in the amount defined on GRAIN_AMOUNT
    color.rgb = color.rgb - (grain() * GRAIN_AMOUNT);

    // gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(0.467,0.447,0.443), color.a);
    gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(0.467,0.447,0.443), color.a);


    // // gl_FragColor = gl_FragColor * color;
  }
  
`;

export default extrudeFragmentShader;
