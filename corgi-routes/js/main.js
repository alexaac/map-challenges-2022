import { toGeoJSON } from './togeojson.js';
import { drawChart } from './drawChart.js';
import * as Helper from './Helper.js';
import { haversineDistance } from './haversine.js';

const apiKey = 'wSVUkjoWKTD8fUSyzJd5';
const defaultDataFile = './data/savadisla.gpx';

const map = new maplibregl.Map({
  container: 'map',
  style: `https://api.maptiler.com/maps/winter/style.json?key=${apiKey}`,
  // style: `https://api.maptiler.com/maps/hybrid/style.json?key=${apiKey}`,
  // center: [11.40416, 47.26475],
  zoom: 12,
  pitch: 55,
  maxPitch: 85,
});

// Create the marker and popup that will display the elevation queries
const popup = new maplibregl.Popup({ closeButton: false });

let lngLat = {
  lng: 0,
  lat: 0,
};
const marker = new maplibregl.Marker({
  // color: 'red',
  // scale: 0.8,
  // draggable: false,
  // pitchAlignment: 'auto',
  // rotationAlignment: 'auto',
})
  .setLngLat(lngLat)
  .setPopup(popup)
  .addTo(map)
  .togglePopup();

map.addControl(
  new maplibregl.NavigationControl({
    visualizePitch: true,
    showZoom: true,
    showCompass: true,
  })
);

map.addControl(
  new maplibregl.TerrainControl({
    source: 'terrainSource',
    exaggeration: 1,
  })
);

/**
 * @description Fetch data
 * @param {string} url - file
 */
const getData = async (url) => {
  const response = fetch(url);

  let data = await (await response).text();
  data = new window.DOMParser().parseFromString(data, 'text/xml');

  return data;
};

map.on('load', async () => {
  map.addSource('terrain', {
    type: 'raster-dem',
    url: `https://api.maptiler.com/tiles/terrain-rgb/tiles.json?key=${apiKey}`,
  });
  map.setTerrain({
    source: 'terrain',
  });

  // Draw default route

  setTimeout(function () {
    drawRoute({ content: undefined, file: undefined });
  }, 2000);

  async function drawRoute({ content, file }) {
    let data;

    if (content === undefined) {
      data = await getData(file || defaultDataFile);
      data = toGeoJSON.gpx(data);
    } else {
      data = toGeoJSON.gpx(content);
    }

    /**
     * Prepare data for chart
     */
    const points = data.features[0].geometry.coordinates;
    const times = data.features[0].properties.coordTimes;
    let totalDistance = 0;
    const gpx_data = points.map((array, index) => {
      const elem = {};

      elem.id = index;
      elem.lat = array[1];
      elem.lon = array[0];
      elem.elevation = array[2];
      elem.prevLat = elem.lat;
      elem.prevLon = elem.lon;

      const prevElem = points[index - 1];
      if (prevElem) {
        elem.prevLat = prevElem[1];
        elem.prevLon = prevElem[0];
      }

      elem.distance = haversineDistance(
        [elem.lat, elem.lon],
        [elem.prevLat, elem.prevLon]
      );

      totalDistance += elem.distance;
      elem.totalDistance = totalDistance.toFixed(0);

      elem.time = times && times[index];

      elem.point = [elem.lon, elem.lat, elem.elevation];

      for (let i = 1; i < data.features.length; i++) {
        const dist = haversineDistance(
          [elem.lat, elem.lon],
          [
            data.features[i].geometry.coordinates[1],
            data.features[i].geometry.coordinates[0],
          ]
        );

        if (dist < 10) {
          elem.photo = data.features[i];
          console.log(
            '---------------------------------------------',
            elem.photo
          );
        }
      }

      return elem;
    });

    const parseTime1 = d3.utcParse('%Y-%m-%dT%H:%M:%S.%LZ');
    const parseTime2 = d3.utcParse('%Y-%m-%dT%H:%M:%SZ');

    function parseTime(s) {
      let t1 = parseTime1(s);
      let t2 = parseTime2(s);
      if (t1) {
        return t1;
      } else {
        return t2;
      }
    }

    // format the data
    if (times) {
      gpx_data.forEach((d) => {
        d.date = parseTime(d.time);
        d.total_active = +d.elevation || 0;
      });
    } else {
      gpx_data.forEach((d) => {
        d.date = +d.totalDistance;
        d.total_active = +d.elevation || 0;
      });
    }

    let { radius, lineGraph, timeBrush } = drawChart(gpx_data, times, {
      map,
      popup,
      marker,
    });

    // save full coordinate list for later
    const coordinates = data.features[0].geometry.coordinates;

    map.setCenter(coordinates[0]);
    map.flyTo({
      ...{
        center: coordinates[0],
        zoom: 12,
        pitch: 0,
        bearing: 0,
      },
      duration: 1000,
      essential: true,
    });

    // setup the viewport
    const bounds = getBoundingBox(coordinates);
    map.fitBounds(
      [
        [bounds.xMin, bounds.yMin],
        [bounds.xMax, bounds.yMax],
      ],
      {
        padding: {
          top: 0,
          bottom: 150,
          left: 50,
          right: 50,
        },
        linear: true,
        duration: 0,
      }
    );

    // start by showing just the first coordinate
    data.features[0].geometry.coordinates = [coordinates[0]];

    /**
     * Rotate camera
     */
    // The total animation duration, in milliseconds
    // const animationDuration = coordinates.length * 20;
    // let start;
    // function frame(time) {
    //   if (!start) start = time;
    //   const animationPhase = (time - start) / animationDuration;
    //   if (animationPhase > 1) {
    //     return;
    //   }

    //   // Rotate the camera at a slightly lower speed to give some parallax effect in the background
    //   const rotation = 150 - animationPhase * 40.0;
    //   map.setBearing(rotation % 360);

    //   window.requestAnimationFrame(frame);
    // }
    // window.requestAnimationFrame(frame);

    /**
     * Add points to route
     */
    // on a regular basis, add more coordinates from the saved list and update the map
    let i = 0;
    let brushStart = 0;
    const timer = setInterval(() => {
      if (i < coordinates.length) {
        data.features[0].geometry.coordinates.push(coordinates[i]);

        if (map.getSource('trace')) {
          map.panTo(coordinates[i]);

          map.getSource('trace').setData(data);

          // Show popup
          Helper.highlight(
            {
              lat: coordinates[i][1],
              lon: coordinates[i][0],
              elevation: coordinates[i][2],
              totalDistance: gpx_data[i].totalDistance,
            },
            { map, popup, marker }
          );

          // Show photo if stop
          if (gpx_data[i].photo) {
            addPopup(
              [coordinates[i][0], coordinates[i][1]],
              i,
              gpx_data[i].photo.properties.name
            );
          }

          // // Brush the chart
          // timeBrush.brushComponent
          //   .transition()
          //   .call(timeBrush.brush.move, [brushStart, i]);

          d3.selectAll('.dot_active')
            .attr('r', radius)
            .classed('focus-marker', false);
          d3.select(`#circle-${gpx_data[i].id}`)
            .attr('r', 4 * radius)
            .classed('focus-marker', true);

          i++;
        }
      } else {
        window.clearInterval(timer);

        d3.select('#pause-cases').classed('hide', true);
        d3.select('#play-cases').classed('hide', false);

        setTimeout(function () {
          map.flyTo({
            ...{
              center: coordinates[i],
              zoom: 12,
              pitch: 0,
              bearing: 0,
            },
            duration: 1000,
            essential: true,
          });
          map.fitBounds(
            [
              [bounds.xMin, bounds.yMin],
              [bounds.xMax, bounds.yMax],
            ],
            {
              padding: {
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
              },
              linear: false,
              duration: 0,
            }
          );
        }, 1000);
      }
    }, 10);

    // Start/stop the brush animation
    var flag = false;

    d3.select('#play-cases').on('click', () => {
      d3.select('#play-cases').classed('hide', true);
      d3.select('#pause-cases').classed('hide', false);
      flag = true;
      drawRoute({ content: undefined, file: undefined });
    });
    d3.select('#pause-cases').on('click', () => {
      d3.select('#pause-cases').classed('hide', true);
      d3.select('#play-cases').classed('hide', false);
      flag = false;
      window.clearInterval(timer);
    });

    // add it to the map
    if (map.getSource('trace')) {
      // window.clearInterval(timer);
      // map.removeLayer('trace');
      // map.removeSource('trace');
    }

    map.addSource('trace', { type: 'geojson', data: data });
    map.addLayer({
      id: 'trace',
      type: 'line',
      source: 'trace',
      // paint: {
      //   'line-color': 'yellow',
      //   'line-opacity': 0.75,
      //   'line-width': 5,
      // },
      layout: {
        'line-cap': 'round',
        'line-join': 'round',
      },
      paint: {
        'line-color': '#3fb1ce',
        'line-width': 5,
        'line-opacity': 0.8,
      },
    });

    map.addSource('Stations', {
      type: 'geojson',
      data: data,
    });
    map.addLayer({
      id: 'Stations',
      type: 'circle',
      source: 'Stations',
      paint: {
        'circle-stroke-color': 'white',
        'circle-stroke-width': 3,
        'circle-radius': 6,
        'circle-color': '#3fb1ce',
      },
    });
  }

  function getBoundingBox(coords) {
    var bounds = {},
      point,
      latitude,
      longitude;

    for (var j = 0; j < coords.length; j++) {
      longitude = coords[j][0];
      latitude = coords[j][1];
      bounds.xMin = bounds.xMin < longitude ? bounds.xMin : longitude;
      bounds.xMax = bounds.xMax > longitude ? bounds.xMax : longitude;
      bounds.yMin = bounds.yMin < latitude ? bounds.yMin : latitude;
      bounds.yMax = bounds.yMax > latitude ? bounds.yMax : latitude;
    }

    return bounds;
  }

  function readSingleFile(e) {
    var file = e.target.files[0];
    if (!file) {
      return;
    }
    var reader = new FileReader();
    reader.onload = async function (e) {
      var content = e.target.result;

      // displayContents(contents);

      content = new window.DOMParser().parseFromString(content, 'text/xml');

      drawRoute({ content, file: undefined });
    };
    reader.readAsText(file);
  }

  function displayContents(contents) {
    var element = document.getElementById('file-content');
    element.textContent = contents;
  }

  document
    .getElementById('file-input')
    .addEventListener('change', readSingleFile, false);

  document
    .querySelector('#case-select')
    .addEventListener('change', function handleChange(event) {
      const fileName = `./data/${event.target.value}.gpx`;

      drawRoute({ content: undefined, file: fileName });
    });

  /* Popup containing random cats images */
  const addPopup = (coordinates, index, name) => {
    index = index || 0;
    // random number from 1 to 10
    const randomNo = Math.floor(Math.random() * 6 + 1);
    // const iconSize = [50 + randomNo, 50 + randomNo];
    // const iconSize = [53 + index, 53 + index];

    // create a DOM element for the marker
    const el = document.createElement('div');

    const img = document.createElement('div');
    el.appendChild(img);
    img.className = 'popup';
    // img.style.backgroundImage = `url(https://placekitten.com/g/${iconSize.join(
    //   '/'
    // )}/)`;

    // Removed until placecorgi works
    // img.style.backgroundImage = `url(http://placecorgi.com/${iconSize.join(
    //   '/'
    // )}/)`;

    img.style.backgroundImage = `url(./assets/textures/corgi${randomNo}.jpg)`;
    img.style.backgroundSize = 'cover';
    img.style.backgroundRepeat = 'no-repeat';
    img.style.backgroundPosition = 'center center';

    // img.style.backgroundImage = `url(https://picsum.photos/${iconSize[0]}/)`;

    img.style.width = '50px';
    img.style.height = '50px';

    const text = document.createElement('div');
    el.appendChild(text);
    text.style.textAlign = 'center';
    text.innerHTML = name;

    const popup = new maplibregl.Popup({
      offset: 25,
      closeOnClick: false,
      closeButton: false,
      className: 'popup-outer',
    })
      .setHTML(el.outerHTML)
      .setLngLat(coordinates)
      .addTo(map);
  };
});
