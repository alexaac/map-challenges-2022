// import { config } from './config.js';

const rotate = { x: 0, y: 45 };

const flippedStereographic = (lambda, phi) => {
  var coslambda = Math.cos(lambda),
    cosphi = Math.cos(phi),
    k = 1 / (1 + coslambda * cosphi);
  return [-k * cosphi * Math.sin(lambda), k * Math.sin(phi)];
};

// set the dimensions and margins of the diagram
const width = 6,
  height = 6;

const projection = d3
  .geoProjection(flippedStereographic)
  .scale((2 * height) / Math.PI)
  .translate([width / 2, height / 2])
  // .clipAngle(90)
  // .rotate([rotate.x, -rotate.y])
  .precision(0.1);

/**
 * @description Fetch data
 * @param {string} url - file
 */
const getData = async (url) => {
  const response = fetch(url);

  const data = await (await response).json();

  return data;
};

/**
 * @description Fetch data
 * @param {string} url - file
 */
const getD3Data = async (url) => {
  const data = await d3.csv(url);

  return data;
};

const hexToRgb = (hex) => {
  hex = hex.substring(1);

  const num = parseInt(hex, 16);

  const r = num >> 16;
  const g = (num >> 8) & 255;
  const b = num & 255;

  return [r, g, b];
};

// De-normalize colors from 0-1 to 0-255
const denormalizeColor = (color) => {
  return color.map((c) => c * 255);
};

// Normalize colors from 0-255 to 0-1
const normalizeColor = (color) => {
  const rgbColor = hexToRgb(color);

  return rgbColor.map((c) => c / 255);
};

const addLatLon = (starsDataHyg, magLimit) => {
  const cleanedStars = { type: 'FeatureCollection', features: [] };

  /* Filter by magnitude - the star's apparent visual magnitude */
  // const filtered = starsDataHyg;
  const filtered = starsDataHyg.filter((d) => d.mag < magLimit);

  filtered.map((d) => {
    /* Longitudes and latitudes are obtained from declination and right ascension;
    longitude is inverted because the celestial sphere is seen from the inside */

    const lat = +d.dec;
    const lon = (+d.ra * 360) / 24;
    // const lon = (+d.ra * 360) / 24 - 180;
    const [x, y] = projection([-lon, lat]);

    cleanedStars.features.push({
      geometry: {
        coordinates: [x, y, +d.dist * 0.01],
        type: 'Point',
      },
      properties: {
        color: +d.ci,
        mag: +d.mag,
        name: d.proper,
        distance: +d.dist,
        lat: lat,
        lon: lon,
      },
      type: 'Feature',
    });

    return d;
  });

  return cleanedStars;
};

export { getData, getD3Data, addLatLon, normalizeColor, denormalizeColor };
