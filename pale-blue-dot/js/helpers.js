// import { config } from './config.js';

/**
 * @description Fetch data
 * @param {string} url - file
 */
const getData = async (url) => {
  const response = fetch(url);

  const data = await (await response).text();

  return data;
};

/**
 * @description Format data to insert into GeoJSON
 * @param {Object} data - data about airports
 */
const formatAirportData = (data) => {
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

  const airports = {};

  dataArr.map((row) => {
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

    if (airport.properties['Type'] === 'airport') {
      airports[airport.properties['Airport ID']] = airport;
    }
  });

  return airports;
};

/**
 * @description Format data to insert into GeoJSON
 * @param {Object} data - data about airlines
 */
const formatAirlineData = (data, airportsData) => {
  const dataArr = data.split('\n');
  const columnNames = [
    'Airline',
    'Airline ID',
    'Source airport',
    'Source airport ID',
    'Destination airport',
    'Destination airport ID',
    'Codeshare',
    'Stops',
    'Equipment',
  ];

  const airlines = dataArr.map((row) => {
    const airline = {};
    const columns = row.split(',');

    // Generate a Feature object for the FeatureCollection in a GeoJSON data format
    airline.type = 'Feature';

    // Add properties
    airline.properties = {};

    columnNames.forEach((columnName, i) => {
      airline.properties[columnName] = columns[i];
      if (airline.properties[columnName]) {
        airline.properties[columnName] = airline.properties[columnName].replace(
          /\"/g,
          ''
        );
      }
    });
    // Add geometries of type Point
    // console.log(airline.properties['Destination airport ID']);
    if (
      airportsData[airline.properties['Source airport ID']] &&
      airportsData[airline.properties['Destination airport ID']] !== undefined
    ) {
      airline.airports = {
        source: airportsData[airline.properties['Source airport ID']],
        target: airportsData[airline.properties['Destination airport ID']],
      };
    }
    // console.log(airportsData[airline.properties['Source airport ID']]);
    // console.log(airportsData[airline.properties['Destination airport ID']]);

    // delete airline.properties.undefined; // Get rid of the column that did not match

    return airline;
  });

  let result = airlines.reduce((result, d) => {
    if (d.airports) {
      // console.log(d);
      let currentData = result[d.properties['Source airport ID']] || {
        'Airport ID': d.properties['Source airport ID'],
        IATA: d.properties['Source airport'],
        properties: d.airports.source.properties,
        geometry: d.airports.source.geometry,
        destinationsCount: 0,
        destinations: [],
      };

      currentData.destinationsCount += 1;

      const destination = d.properties;
      destination.destinationGeometry = d.airports.target.geometry;

      currentData.destinations.push(destination);

      result[d.properties['Source airport ID']] = currentData;
    }

    return result;
  }, {});

  console.log(result);

  return result;
};

export { getData, formatAirportData, formatAirlineData };
