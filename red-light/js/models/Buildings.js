import { Program } from '../components/Program.js';

import utils from '../utils.js';

import extrudeVertexShader from '../shaders/extrude/vertex.js';
import extrudeVertexUniformsShader from '../shaders/extrude/vertex_uniforms.js';
import extrudeFragmentUniformsShader from '../shaders/extrude/fragment_uniforms.js';
import extrudeAttributesShader from '../shaders/extrude/attributes.js';
import extrudeVaryingsShader from '../shaders/extrude/varyings.js';
import extrudeGlobalsShader from '../shaders/extrude/globals.js';
import extrudeNormalShader from '../shaders/extrude/geometry/normal.js';
import extrudeNoiseShader from '../shaders/extrude/generative/noise.js';
import extrudeFbmShader from '../shaders/extrude/generative/fbm.js';
import extrudeGrainShader from '../shaders/extrude/filter/grain.js';
import extrudeRandomShader from '../shaders/extrude/generative/random.js';
import extrudeEasingShader from '../shaders/extrude/functions/easing.js';
import extrudeZoomShader from '../shaders/extrude/functions/zoom.js';
import extrudeLightsShader from '../shaders/extrude/lights/lights.js';
import extrudeFragmentShader from '../shaders/extrude/fragment.js';

let buildingsProgram;
let running = false;

export class Buildings {
  constructor(id, buildingsLayerId, buildingType, parameters) {
    // console.log(id);
    this.id = id;
    this.parameters = parameters;
    this.buildingsLayerId = buildingsLayerId;
    this.buildingType = buildingType;
    this.type = 'custom';
    this.renderingMode = '3d';
  }

  onAdd(map, gl) {
    this.map = map;

    // find layer source
    const sourceName = this.map.getLayer(this.buildingsLayerId).source;
    this.source = (this.map.style.sourceCaches ||
      this.map.style._otherSourceCaches)[sourceName];
    if (!this.source) {
      console.warn(`Can't find layer ${this.buildingsLayerId}'s source.`);
    }

    gl.clearColor(Math.random(), Math.random(), Math.random(), 1.0);
    const color = gl.getParameter(gl.COLOR_CLEAR_VALUE);
    console.log(`clearColor = (
      ${color[0].toFixed(1)},
      ${color[1].toFixed(1)},
      ${color[2].toFixed(1)}
    )`);

    // Turn on culling. By default backfacing triangles
    // will be culled.
    gl.enable(gl.CULL_FACE);

    // Enable the depth buffer
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.ALWAYS);
    gl.hint(gl.PERSPECTIVE_CORRECTION_HINT, gl.NICEST);

    gl.depthMask(true);
    gl.enable(gl.BLEND);

    // Create a program with the appropriate vertex and fragment shaders
    const initBuildingsProgram = () => {
      // Create a program
      // buildingsProgram = new Program(
      //   gl,
      //   ` ${extrudeVertexShader}
      //   `,
      //   ` ${extrudeFragmentShader}
      //   `
      // );

      buildingsProgram = new Program(
        gl,
        ` ${extrudeVertexUniformsShader}
          ${extrudeAttributesShader}
          ${extrudeVaryingsShader}
          ${extrudeVertexShader}
        `,
        ` ${extrudeFragmentUniformsShader}
          ${extrudeVaryingsShader}
          ${extrudeGlobalsShader}
          ${extrudeNormalShader}
          ${extrudeNoiseShader}
          ${extrudeFbmShader}
          ${extrudeGrainShader}
          ${extrudeRandomShader}
          ${extrudeEasingShader}
          ${extrudeZoomShader}
          ${extrudeLightsShader}
          ${extrudeFragmentShader} 
        `
      );

      // We attach the location of these shader values to the program instance
      // for easy access later in the code
      // Create a mapping between JavaScript variables and the program attributes and uniforms

      // Attributes to be loaded into program
      const attributes = [
        'aVertexPosition',
        'aVertexNormal',
        'aVertexBase',
        'aVertexHeight',
        'aVertexColor',
        'aVertexTextureCoords',
      ];

      // Uniforms to be loaded into program
      const uniforms = [
        'uMatrix',
        'uModelMatrix',
        'uViewMatrix',
        'uModelViewMatrix',
        'uProjectionMatrix',
        'uNormalMatrix',
        'materialOpacity',
        'uTime',
        'uLightDiffuse',
        'uLightAmbient',
        'uLightSpecular',
        'uLightDirection',
        'uLightPosition',
        'uMaterialAmbient',
        'uMaterialDiffuse',
        'uMaterialSpecular',
        'uShininess',
        'preWave',
        'postWave',
        'hWave',
        'uMaterialOpacity',
        'uOpacity',
        'uMapPosition',
        'uResolution',
        'uSampler',
        'uPatternFrom',
        'uPatternTo',
        'uPixelRatioFrom',
        'uPixelRatioTo',
        'uRandom',
        'uBuildingType',
        'uWireframe',
        'uLightSource',
      ];

      // Load attributes and uniforms
      buildingsProgram.load(attributes, uniforms);
    };

    initBuildingsProgram();

    if (this.parameters.animate) {
      this.startSequence();
    }
  }

  render(gl) {
    const currentCenter = this.map.getCenter();

    utils.initLights(gl, buildingsProgram, this.parameters);

    gl.uniform1i(buildingsProgram.uWireframe, this.parameters.wireframe);
    gl.uniform1i(buildingsProgram.uLightSource, this.parameters.lightSource);
    gl.uniform1f(buildingsProgram.uBuildingType, this.buildingType);
    gl.uniform1f(buildingsProgram.uExponentFactor, 10);
    // console.log(this.parameters.center.meters);
    gl.uniform3fv(buildingsProgram.uMapPosition, [
      maplibregl.MercatorCoordinate.fromLngLat(
        [currentCenter.lng, currentCenter.lat],
        0
      ),
      this.parameters.zoom,
    ]);

    gl.uniform1f(buildingsProgram.uTime, this.parameters.uTime);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.uniform1i(buildingsProgram.uSampler, 0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture2);
    gl.uniform1i(buildingsProgram.uSampler, 0);

    const drawBuildings = () => {
      if (!this.source) return;

      // Use this program instance
      buildingsProgram.useProgram();

      const coords = this.source.getVisibleCoordinates().reverse();

      const buildingsLayer = this.map.getLayer(this.buildingsLayerId);
      const context = this.map.painter.context;

      let { lng, lat } = this.map.getCenter();
      const pos = SunCalc.getPosition(this.parameters.date, lat, lng);

      gl.uniform1f(buildingsProgram.uAltitude, pos.altitude);
      gl.uniform1f(buildingsProgram.uAzimuth, pos.azimuth + (3 * Math.PI) / 2);

      gl.uniform1f(buildingsProgram.preWave, this.parameters.preWave);
      gl.uniform1f(buildingsProgram.postWave, this.parameters.postWave);
      gl.uniform1f(buildingsProgram.postWave, this.parameters.hWave);
      gl.uniform2fv(buildingsProgram.uResolution, this.parameters.resolution);
      // console.log('this.parameters.resolution ', this.parameters.resolution);

      gl.uniform1f(
        buildingsProgram.uMaterialOpacity,
        this.parameters.materialOpacity
      );
      gl.uniform1f(buildingsProgram.uOpacity, this.parameters.opacity);

      // Turn on culling. By default backfacing triangles
      // will be culled.
      gl.enable(gl.CULL_FACE);

      // Enable the depth buffer
      gl.enable(gl.DEPTH_TEST);

      const transform = this.map.transform;
      const camera = this.camera;

      // console.log(transform);
      // console.log(coords[0]);

      const projectionMatrix = new Float64Array(16),
        projectionMatrixI = new Float64Array(16),
        normalMatrix = new Float64Array(16),
        modelViewMatrix = new Float64Array(16),
        modelMatrix = new Float64Array(16),
        viewMatrix = new Float64Array(16),
        viewMatrixI = new Float64Array(16),
        testMatrix = new Float64Array(16);

      // from https://github.com/mapbox/mapbox-gl-js/blob/master/src/geo/transform.js#L556-L568
      const halfFov = transform._fov / 2;
      const groundAngle = Math.PI / 2 + transform._pitch;
      const topHalfSurfaceDistance =
        (Math.sin(halfFov) * transform.cameraToCenterDistance) /
        Math.sin(Math.PI - groundAngle - halfFov);
      const furthestDistance =
        Math.cos(Math.PI / 2 - transform._pitch) * topHalfSurfaceDistance +
        transform.cameraToCenterDistance;
      const farZ = furthestDistance * 1.01;

      mat4.copy(projectionMatrix, transform.projMatrix);
      mat4.invert(projectionMatrixI, projectionMatrix);

      const tile0 = this.source.getTile(coords[0]);
      const bucket0 = tile0.getBucket(buildingsLayer);

      let i = 0;
      for (const coord of coords) {
        i++;

        // Model view matrix - transform tile space into view space (meters, relative to camera)
        const viewProjectionMatrix = coord.posMatrix;

        mat4.multiply(modelViewMatrix, projectionMatrixI, viewProjectionMatrix);

        // viewMatrix = transform._camera.getWorldToCamera(transform.worldSize, 1);

        mat4.copy(viewMatrix, transform.pixelMatrix);
        mat4.invert(viewMatrixI, viewMatrix);
        mat4.multiply(modelMatrix, viewMatrixI, modelViewMatrix);

        mat4.multiply(testMatrix, modelMatrix, viewMatrix);

        // Normal matrices - transforms surface normals into view space
        mat3.normalFromMat4(normalMatrix, modelViewMatrix);
        mat3.invert(normalMatrix, normalMatrix);

        const tile = this.source.getTile(coord);
        const bucket = tile.getBucket(buildingsLayer);

        if (!bucket) continue;

        const buffers =
          bucket.programConfigurations.programConfigurations[
            this.buildingsLayerId
          ]._buffers;

        // const pattern =
        //   bucket.programConfigurations.programConfigurations['building-3d-apartments']
        //     .binders['fill-extrusion-pattern'];

        const pattern = {
          patternFrom: [1, 1, 81, 56],
          patternTo: [1, 1, 81, 56],
          pixelRatioFrom: 1,
          pixelRatioTo: 1,
        };

        // console.log(pattern.patternFrom);
        // console.log(pattern.patternTo);
        // console.log(pattern.pixelRatioFrom);
        // console.log(pattern.pixelRatioTo);

        if (pattern.patternFrom === null) {
          return;
        }

        gl.uniform4fv(buildingsProgram.uPatternFrom, pattern.patternFrom);
        gl.uniform4fv(buildingsProgram.uPatternTo, pattern.patternTo);
        gl.uniform1f(buildingsProgram.uPixelRatioFrom, pattern.pixelRatioFrom);
        gl.uniform1f(buildingsProgram.uPixelRatioTo, pattern.pixelRatioTo);

        let colorBuffer, heightBuffer, baseBuffer;

        if (buffers.length === 2) {
          [baseBuffer, heightBuffer] = buffers;
        } else {
          [baseBuffer, colorBuffer, heightBuffer] = buffers;
        }

        gl.uniformMatrix4fv(
          buildingsProgram.uModelViewMatrix,
          false,
          modelViewMatrix
        );
        gl.uniformMatrix4fv(
          buildingsProgram.uProjectionMatrix,
          false,
          projectionMatrix
        );
        gl.uniformMatrix4fv(
          buildingsProgram.uNormalMatrix,
          false,
          normalMatrix
        );

        gl.uniformMatrix4fv(
          buildingsProgram.uMatrix,
          false,
          coord.posMatrix || coord.projMatrix
        );

        gl.uniform1f(
          buildingsProgram.uHeightFactor,
          Math.pow(2, coord.overscaledZ) / tile.tileSize / 8
        );

        for (const segment of bucket.segments.get()) {
          const numPrevAttrib = context.currentNumAttributes || 0;
          const numNextAttrib = 2;

          for (let i = numNextAttrib; i < numPrevAttrib; i++)
            gl.disableVertexAttribArray(i);

          const vertexOffset = segment.vertexOffset || 0;
          gl.enableVertexAttribArray(buildingsProgram.aVertexPosition);
          gl.enableVertexAttribArray(buildingsProgram.aVertexNormal);
          gl.enableVertexAttribArray(buildingsProgram.aVertexHeight);
          gl.enableVertexAttribArray(buildingsProgram.aVertexBase);

          bucket.layoutVertexBuffer.bind(); // Set up the buffer
          gl.vertexAttribPointer(
            buildingsProgram.aVertexPosition,
            2,
            gl.SHORT,
            false,
            12,
            12 * vertexOffset
          );
          gl.vertexAttribPointer(
            buildingsProgram.aVertexNormal,
            4,
            gl.SHORT,
            false,
            12,
            4 + 12 * vertexOffset
          );

          heightBuffer.bind(); // Set up the buffer
          gl.vertexAttribPointer(
            buildingsProgram.aVertexHeight,
            1,
            gl.FLOAT,
            false,
            4,
            4 * vertexOffset
          );

          baseBuffer.bind(); // Set up the buffer
          gl.vertexAttribPointer(
            buildingsProgram.aVertexBase,
            1,
            gl.FLOAT,
            false,
            4,
            4 * vertexOffset
          );
          bucket.indexBuffer.bind(); // Set up the buffer

          // if (colorBuffer) {
          //   gl.enableVertexAttribArray(buildingsProgram.aVertexColor);

          //   colorBuffer.bind(); // Set up the buffer
          //   gl.vertexAttribPointer(
          //     buildingsProgram.aVertexColor,
          //     1,
          //     gl.FLOAT,
          //     false,
          //     4,
          //     4 * vertexOffset
          //   );
          // }

          context.currentNumAttributes = numNextAttrib;

          // Render to our canvas

          // If wireframe is truthy, we draw using `LINES`
          const type = this.parameters.wireframe ? gl.LINES : gl.TRIANGLES;

          gl.drawElements(
            type,
            segment.primitiveLength * 3,
            gl.UNSIGNED_SHORT,
            segment.primitiveOffset * 3 * 2
          );
        }
      }
    };

    drawBuildings();
  }
}
