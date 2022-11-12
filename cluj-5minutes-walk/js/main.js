import apiKey from './apiKey.js';

// const longitude = 4.8959624,
//   latitude = 52.3711013;

const longitude = 23.5898864,
  latitude = 46.769558;

window.onload = function () {
  const node = document.getElementById('isochrones');

  const Isochrones = new Openrouteservice.Isochrones({
    api_key: apiKey,
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

  // L.tileLayer('https://a.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
  L.tileLayer('https://stamen-tiles.a.ssl.fastly.net/toner/{z}/{x}/{y}.png', {
    maxZoom: 18,
  }).addTo(map);

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

  function getIsochrones(point) {
    Isochrones.calculate({
      profile: 'foot-walking',
      locations: [point],
      area_units: 'm',
      range: [300, 600, 900, 1200, 1500, 1800],
      // range: [300, 600, 900],
      range_type: 'time',
    })
      .then(function (data) {
        console.log(data);

        map.eachLayer(function (layer) {
          if (layer.id === 'access') {
            // it's the access layer
            map.removeLayer(layer);
          }
        });

        var difference = [];
        for (let i = 0; i < data.features.length - 1; i++) {
          difference.push(
            turf.difference(data.features[i + 1], data.features[i])
          );
        }

        difference.push(data.features[0]);
        data.features = difference;

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
