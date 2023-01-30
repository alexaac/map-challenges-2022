const pointLongitude = -80.02605,
  pointLatitude = 40.61279;

const longitude = -80.02895718904472,
  latitude = 40.61201143180975;

var map = new maplibregl.Map({
  container: 'map',
  style: './styles/osm_liberty.json',
  // style:
  //   'https://api.maptiler.com/maps/hybrid/style.json?key=wSVUkjoWKTD8fUSyzJd5',
  center: [longitude, latitude],
  zoom: window.innerWidth < 750 ? 15 : 16,
  pitch: 55,
  bearing: -20,
  antialias: true,
});

// create a DOM element for the marker
var el = document.createElement('div');
el.className = 'marker';
el.style.backgroundImage = 'url(./assets/textures/ball.png)';
el.style.width = '50px';
el.style.height = '50px';

var marker = new maplibregl.Marker(el)
  .setLngLat([pointLongitude, pointLatitude])
  .addTo(map);

// map.on('mousemove', function (e) {
//   console.log(JSON.stringify(e.lngLat.wrap()));
// });

map.addControl(new maplibregl.NavigationControl());

map.on('load', function () {
  // Insert the layer beneath any symbol layer.
  const layers = map.getStyle().layers;
  const labelLayerId = layers.find(
    (layer) => layer.type === 'symbol' && layer.layout['text-field']
  ).id;

  if (map.getLayer('building-3d')) {
    map.removeLayer('building-3d');
  }

  if (map.getSource('openmaptiles')) {
    map.addLayer(
      {
        id: 'building-3d',
        source: 'openmaptiles',
        'source-layer': 'building',
        type: 'fill-extrusion',
        minzoom: 14,
        paint: {
          'fill-extrusion-color': [
            'case',
            ['boolean', ['feature-state', 'select'], false],
            'lightgreen',
            ['boolean', ['feature-state', 'hover'], false],
            'lightblue',
            '#f00',
            // '#f00',
          ],
          'fill-extrusion-height': ['number', ['get', 'render_height'], 5],
          'fill-extrusion-base': ['number', ['get', 'render_min_height'], 0],
          'fill-extrusion-opacity': 0.0,
        },
      },
      labelLayerId
    );
  }

  let uTime;
  function animate(timestamp) {
    uTime = timestamp;

    // // clamp the rotation between 0 -360 degrees
    // // Divide timestamp by 100 to slow rotation to ~10 degrees / sec
    // map.rotateTo((timestamp / 300) % 360, { duration: 0 });

    // Request the next frame of the animation.
    requestAnimationFrame(animate);
  }

  // Start the animation.
  animate(0);
});
