import { orsApiKey, stadiaApiKey } from './apiKey.js';

// const longitude = 4.8959624,
//   latitude = 52.3711013;

const longitude = 23.5898864,
  latitude = 46.769558;

window.onload = function () {
  const node = document.getElementById('isochrones');

  const Isochrones = new Openrouteservice.Isochrones({
    api_key: orsApiKey,
  });

  var map = L.map('map', {
    contextmenu: true,
    contextmenuWidth: 140,
    contextmenuItems: [
      {
        text: 'get Isochrones',
        callback: getAccess,
      },
    ],
    zoomSnap: 0.5,
  }).setView([latitude, longitude], 14);

  L.tileLayer(
    `https://tiles.stadiamaps.com/tiles/stamen_toner/{z}/{x}/{y}{r}.png?api_key=${stadiaApiKey}`,
    {
      maxZoom: 20,
      attribution:
        '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://stamen.com/">Stamen Design</a>, &copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>',
    }
  ).addTo(map);

  //the geojson data:
  var data = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Point',
          coordinates: [latitude, longitude],
        },
      },
    ],
  };

  function onEachMarker(feature, layer) {
    layer.bindContextMenu({
      contextmenu: true,
      contextmenuWidth: 140,
      contextmenuItems: [
        {
          text: 'get Isochrones from marker',
          callback: getAccessFromMarker,
        },
      ],
    });
    layer.bindPopup(feature.properties.name);
  }

  var markers = L.geoJSON(data, {
    onEachFeature: onEachMarker,
  }).addTo(map);

  function getAccessFromMarker(e) {
    getIsochrones(e.relatedTarget.feature.geometry.coordinates);
  }

  function getAccess(e) {
    getIsochrones([e.latlng.lng, e.latlng.lat]);
  }

  /** Turn nested isochrones into rings (Turf v7+ needs a FeatureCollection). */
  function buildIsochroneRings(features) {
    const sorted = [...features].sort(
      (a, b) => a.properties.value - b.properties.value
    );

    if (sorted.length === 1) {
      return sorted;
    }

    const rings = [];
    for (let i = 0; i < sorted.length - 1; i++) {
      const ring = turf.difference(
        turf.featureCollection([sorted[i + 1], sorted[i]])
      );
      if (ring) {
        ring.properties = { ...sorted[i + 1].properties };
        rings.push(ring);
      }
    }
    rings.push(sorted[0]);
    return rings;
  }

  function getIsochrones(point) {
    Isochrones.calculate({
      profile: 'foot-walking',
      locations: [point],
      range: [300, 600, 900, 1200, 1500, 1800],
      range_type: 'time',
    })
      .then(function (data) {
        console.log(data);

        if (!data.features || data.features.length === 0) {
          console.warn('No isochrone features returned from ORS');
          return;
        }

        map.eachLayer(function (layer) {
          if (layer.id === 'access') {
            map.removeLayer(layer);
          }
        });

        data.features = buildIsochroneRings(data.features);

        let access = new L.geoJson(data, {
          onEachFeature: function (feature, layer) {
            layer.bindPopup(
              'Isochrone: ' + feature.properties.value / 60 + ' minutes'
            );
          },
          style: function (feature) {
            let ratio = feature.properties.value;
            console.log(ratio);
            let color;

            if (ratio === 300) {
              color = '#006837';
            } else if (ratio === 600) {
              color = '#39b54a';
            } else if (ratio === 900) {
              color = '#8cc63f';
            } else if (ratio === 1200) {
              color = '#f7931e';
            } else if (ratio === 1500) {
              color = '#f15a24';
            } else {
              color = '#c1272d';
            }
            return {
              color: color,
              opacity: 0.5,
            };
          },
        }).addTo(map);

        access.id = 'access';

        // let response = JSON.stringify(json, null, '\t');
        // console.log(response);
      })
      .catch(function (err) {
        let response = JSON.stringify(err, null, '\t');
        console.log(err);
      });
  }
};
