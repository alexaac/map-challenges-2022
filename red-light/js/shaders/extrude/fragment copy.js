const extrudeFragmentShader = `
  precision mediump float;

  uniform vec3 u_map_position;

  uniform float u_shininess;

  uniform vec4 u_light_ambient;
  uniform vec3 u_light_diffuse;
  uniform vec4 u_light_specular;
  uniform vec4 u_material_ambient;
  uniform vec3 u_material_diffuse;
  uniform vec4 u_material_specular;
  uniform float u_time;
  uniform vec2 u_resolution; // = (window-width, window-height)
  uniform sampler2D texture;
  uniform float u_cut_off;

  uniform float h_wave;
  uniform float pre_wave;
  uniform float post_wave;

  #define GRAIN_AMOUNT 0.3

  void main() {
    vec4 color = vec4(vec3(u_material_diffuse), 1.0);
    
    gl_FragColor = computeLighs();
    
    // vec4 specular = vec4(0.0, 0.0, 0.0, 1.0);
    // vec4 emission = vec4(0.0, 0.0, 0.0, 1.0);

    // vec2 st = vec2(v_texture_coords.x * 2., worldPosition().z * 0.2);
    // vec2 ipos = floor(st);
    // vec2 fpos = fract(st);
    // color.rgb *= vec3(min((worldPosition().z * .001 + .5), 1.));

    // if (isWall()) {
    //   if (v_building_type == 1.0) {
    //     float t = 0.5;
    //       if ( step(0.6, fpos.x) * step(0.4, fpos.y) > 0.0 ){
    //         specular = vec4(1.) * max( 1.-(worldPosition().z * .001 + .5), 0. );
    //         emission = vec4(0.988, 0.983, 0.880, 1.0) * step(.5, random(ipos + floor(worldNormal().xy * 10.0) + t));
    //     }
    //   } else {
    //     if ( step(0.01, fpos.x) * step(0.1, fpos.y) > 0.0 ){
    //       specular = vec4(1.) * max( 1.-(worldPosition().z * .001 + .5), 0. );
    //       emission = vec4(0.957, 0.988, 0.976, 1.0) * step(.5, random(ipos * vec2(0.0000001,0.01) + floor(worldNormal().xy*10.0)));
    //       emission *= vec4(0.988, 0.983, 0.880, 1.0) * step(.5, random(ipos));
    //     }
    //   }
    // }

    // color.rgb *= emission.rgb * emission.a;
    // color *= specular;
    // color.rgb += vec3(1.)* min( 1.-(worldPosition().z * .001 + .7) , 0.5 );
    
    // // Apply the grain in the amount defined on GRAIN_AMOUNT
    // color.rgb = color.rgb - (grain() * GRAIN_AMOUNT);

    // // gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(0.467,0.447,0.443), color.a);
    // gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(0.467,0.447,0.443), color.a);


    // // gl_FragColor = gl_FragColor * color;
    
  }
  
`;

export default extrudeFragmentShader;
