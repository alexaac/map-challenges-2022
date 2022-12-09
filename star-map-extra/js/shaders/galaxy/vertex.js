const galaxyVertexShader = `
  
  uniform float uPixelRatio;
  uniform float uTime;
  uniform float uSizeFactor;

  attribute float aScale;
  attribute vec3 aRandomness;
  attribute vec3 aColor;
  attribute float aSize;

  varying vec3 vColor;

  void main() {
    /**
      * Position
    */
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);

    // // Spin
    // float angle = atan(modelPosition.x, modelPosition.z);
    // float distanceToCenter = length(modelPosition.xz);
    // float angleOffset = (1.0 / distanceToCenter) * uTime * 0.2;
    // angle += angleOffset;
    // modelPosition.x = cos(angle) * distanceToCenter;
    // modelPosition.z = sin(angle) * distanceToCenter;

    // Randomness
    // modelPosition.xyz += position.xyz;

    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;

    gl_Position = projectedPosition;

    /**
      * Size
    */
    // gl_PointSize = aSize;
    gl_PointSize = uPixelRatio * aSize * uSizeFactor * aScale ;
    // gl_PointSize = uPixelRatio * aSize * uSizeFactor * aScale * sin(modelPosition.y - uTime);
    // // gl_PointSize = aSize * 1.0;
    // gl_PointSize *= (5.0 / - viewPosition.z);
    // gl_PointSize *= (10.0 / - viewPosition.z);

    /**
    * Color
    */

    vColor = aColor;
  }
  
`;

export default galaxyVertexShader;
