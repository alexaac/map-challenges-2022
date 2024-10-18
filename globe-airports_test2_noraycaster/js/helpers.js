// import { config } from './config.js';

/**
 * @description Fetch data
 * @param {string} url - file
 */
const getData = async (url, type) => {
  const response = fetch(url);
  let data;

  if (type === 'json') {
    data = await (await response).json();
  } else {
    data = await (await response).text();
  }

  return data;
};

/**
 * @description Format data to insert into GeoJSON
 * @param {Object} data - data about airports
 */
const formatData = (data) => {
  const dataArr = data.split('\n');
  const columnNames = [
    'Airport ID',
    'Name',
    'City',
    'Country',
    'IATA',
    'ICAO',
    'Latitude',
    'Longitude',
    'Altitude',
    'Timezone',
    'DST',
    'Tz database time zone',
    'Type',
    'Source',
  ];

  const airports = dataArr.map((row) => {
    const airport = {};
    const columns = row.split(',');

    // Generate a Feature object for the FeatureCollection in a GeoJSON data format
    airport.type = 'Feature';

    // Add a geometry of type Point
    airport.geometry = {
      type: 'Point',
      coordinates: [
        // find the index of the column name, then get
        // the corresponding value from the data array
        columns[columnNames.indexOf('Latitude')],
        columns[columnNames.indexOf('Longitude')],
      ],
    };

    // Add properties
    airport.properties = {};

    columnNames.forEach((columnName, i) => {
      airport.properties[columnName] = columns[i];
      if (airport.properties[columnName]) {
        airport.properties[columnName] = airport.properties[columnName].replace(
          /\"/g,
          ''
        );
      }
    });

    // delete airport.properties.undefined; // Get rid of the column that did not match

    return airport;
  });

  return airports.filter((airport) => airport.properties['Type'] === 'airport');
  // return airports.slice(0, 1000);
};

export { getData, formatData };
