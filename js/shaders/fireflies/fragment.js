const firefliesFragmentShader = `
  void main() {
    float distanceToCenter = distance(gl_PointCoord, vec2(0.5));
    // float strength = 0.05 / distanceToCenter - 0.05 * 2.0;

    float strength = distance(gl_PointCoord, vec2(0.5));
    strength = 1.0 - strength;
    strength = pow(strength, 10.0);

    
    // gl_FragColor = vec4(gl_PointCoord, 0.0, strength);
    // gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
    gl_FragColor = vec4(1.0, 1.0, 1.0, strength);
  }
`;

export default firefliesFragmentShader;
