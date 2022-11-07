const splineVertexShader = `
  uniform vec3 bboxMin;
  uniform vec3 bboxMax;

  attribute vec3 customColor;

  varying vec2 vUv;
  varying vec3 vColor;

  void main() {
    vUv = uv;
    // vUv.y = (position.y - bboxMin.y) / (bboxMax.y - bboxMin.y);

    // vUv.y = (position.z - 1.6955314874649048) / (2.1739425659179688 - 1.6955314874649048);
    vColor = customColor;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
  }
`;

export default splineVertexShader;
