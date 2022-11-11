const extrudeZoomShader = `
  #define ZOOM_START 12.
  #define ZOOM_END 20.
  #define ZOOM_MAX max(ZOOM_START, ZOOM_END)
  #define ZOOM_FNC linear
  #define ZOOM_IN 0.0
  #define ZOOM_OUT 1.0

  float zoom() {
    return mix( ZOOM_IN, ZOOM_OUT, clamp( smoothstep(  ZOOM_START/ZOOM_MAX,  ZOOM_END/ZOOM_MAX, max(u_map_position.z/ZOOM_MAX, 0.)), 0., 1.) );
  }

  float zoomEase() {
    return mix( ZOOM_IN, ZOOM_OUT, ZOOM_FNC( (u_map_position.z - ZOOM_START)/(ZOOM_END - ZOOM_START) ) );
  }

`;

export default extrudeZoomShader;
