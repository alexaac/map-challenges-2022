/* Global variables */
const margin = { top: 20, left: 20, bottom: 20, right: 20 },
  width =
    window.innerWidth <= 360
      ? 600 - margin.left - margin.right
      : window.innerWidth <= 960
      ? 1000 - margin.left - margin.right
      : 1200 - margin.left - margin.right,
  height = (2 / 3) * width,
  svg_width = width + margin.left + margin.right,
  svg_height = height + margin.top + margin.bottom;

let countries;

let i = 0,
  playNow;

// Projection and path
const projection = d3
  .geoEquirectangular()
  .translate([width / 2, height / 2])
  .scale(width / 7);

const path = d3.geoPath().projection(projection);

const svg = d3
  .select('#chart')
  .append('svg')
  .attr('class', 'chart-group grabbable')
  .attr('width', svg_width)
  .attr('height', svg_height)
  .attr('preserveAspectRatio', 'xMinYMin')
  .attr('viewBox', '0, 0 ' + width + ' ' + height);

// Append zoomable group
let zoomableGroup = svg
  .append('g')
  .attr('class', 'zoomable-group')
  .attr('transform', `translate(${margin.left}, ${margin.top})`);

const zoomed = (event) => {
  zoomableGroup.attr('transform', event.transform);

  // let scale = event.transform.k;
  // if (scale > 0.8) {
  //   zoomableGroup
  //     .selectAll('.labels > text')
  //     .attr('transform', 'scale(' + 1 / scale + ')');
  // }
  // return hideLabels(scale);
};

const zoom = d3
  .zoom()
  .scaleExtent([0.2, 10])
  .on('zoom', (event) => {
    zoomed(event);
  });
svg.call(zoom);

const promises = [
  d3.csv('data/annual-change-fossil-fuels.csv'),
  d3.json('./data/ne_110m_admin_0_countries.json'),
];

Promise.all(promises)
  .then(([fuelsComs, countries]) => {
    countries = topojson.feature(
      countries,
      countries.objects.ne_110m_admin_0_countries
    );
    console.log(countries);
    // Reduce properties
    countries.features = countries.features.map(function (el) {
      return {
        geometry: el.geometry,
        type: el.type,
        properties: {
          name: el.properties.ADMIN,
          adm0_a3: el.properties.ADM0_A3,
          pop_est: el.properties.POP_EST,
        },
      };
    });

    countries.features = countries.features;

    draw(countries, fuelsComs);
  })
  .catch((err) => {
    console.error(err);
  });

function draw(countries, fuelsComs) {
  fuelsComs = fuelsComs.filter(
    // ditch the world value
    (elem) => elem.Code !== '' && elem.Code !== 'OWID_WRL'
  );

  const data = new Map([
    ...d3.rollup(
      fuelsComs,
      (v) => d3.sum(v, (d) => +d['Fossil fuels (TWh growth – sub method)']),
      (d) => d.Year,
      (d) => d.Code
    ),
  ]);

  let date = '2019';
  const yearData = data.get(date);
  console.log(yearData);
  const years = [...data.keys()];
  console.log(data);

  // Color scale
  const extent = d3.extent(
    fuelsComs,
    (d) => +d['Fossil fuels (TWh growth – sub method)']
  );
  console.log(extent);

  const colorRange = ['#005bbb', '#ffd500'];

  const color = d3
    .scaleDiverging()
    .domain([extent[1], 0, extent[0]])
    .interpolator(d3.interpolateSpectral)
    // .range([d3.hcl(colorRange[1]), d3.hcl(colorRange[0])])
    .unknown('#ccc');

  const pentaArray = [
    'A3',
    'C4',
    'D4',
    'E4',
    'G4',
    'A4',
    'C5',
    'D5',
    'E5',
    'G5',
  ];

  const sound = d3
    .scaleOrdinal()
    .domain([extent[0], extent[1]])
    .range(pentaArray);

  const legend_height = 15;
  const legend_svg = svg
    .append('g')
    .attr('transform', `translate(${0}, ${height - 30})`);

  const defs = legend_svg.append('defs');

  const gradient = defs.append('linearGradient').attr('id', 'linear-gradient');
  const stops = [
    { offset: 0, value: extent[0] },
    { offset: 0.5, value: (extent[1] - extent[0]) / 2 },
    { offset: 1, value: extent[1] },
  ];

  gradient
    .selectAll('stop')
    .data(stops)
    .enter()
    .append('stop')
    .attr('offset', (d) => 100 * d.offset + '%')
    .attr('stop-color', (d) => color(d.value));

  legend_svg
    .append('rect')
    .attr('width', width)
    .attr('height', legend_height)
    .style('fill', 'url(#linear-gradient)');

  legend_svg
    .selectAll('text')
    .data(stops)
    .enter()
    .append('text')
    .attr('x', (d) => width * d.offset)
    .attr('dy', -3)
    .style('text-anchor', (d, i) =>
      i == 0 ? 'start' : i == 1 ? 'middle' : 'end'
    )
    .text((d, i) => d3.format(',')(d.value) + (i == 2 ? ' > 250 TWh' : ''));

  legend_svg
    .append('text')
    .classed('year-label', true)
    .attr('x', width * 0.5 - 20)
    .attr('y', -height + 160)
    .html('2019');

  // Initial map
  const polygonsGroup = zoomableGroup.append('g').attr('class', 'map-features');

  const mapFeatures = polygonsGroup
    .selectAll('path.country')
    .data(countries.features)
    .join('path')
    .filter(function (d) {
      return d.properties.name != 'Antarctica';
    })

    .attr('fill', (d) => color(yearData.get(d.properties.adm0_a3)))
    .classed('country', true)
    .attr('d', path)
    .on('touchstart mouseover', (event, d) => {
      console.log(d);
      const note = sound(yearData.get(d.properties.adm0_a3));
      console.log(note);

      let notes = ['A4', 'B4', 'C4', 'D4'];

      userStartAudio();
      countryPressed(event, [note]);

      highlight();
      d.properties.val = yearData.get(d.properties.adm0_a3);

      showInfo(event, d.properties);

      svg.classed('point-at', true);
    })
    .on('touchend mouseout', (d) => {
      svg.classed('point-at', false);
    })
    // tooltip
    // .append('title')
    .text(
      (d) => `${d.properties.name}
${
  yearData.has(d.properties.adm0_a3)
    ? yearData.get(d.properties.adm0_a3)
    : 'N/A'
}`
    );
  mapFeatures.exit().remove();

  const drawfuelsComs = (year) => {
    const yearData = data.get(year);
    console.log(year);

    svg
      .selectAll('path')
      .transition()
      .duration(50)
      .attr('fill', (d) => color(yearData.get(d.properties.adm0_a3)));
    // .on('touchstart mouseover', (event, d) => {
    //   console.log(event.target);
    //   const note = sound(yearData.get(d.properties.adm0_a3));
    //   console.log(note);

    //   //  playSynth([notes]);
    //   // monoSynth.play('A4', 5, 0, 6 / 6);

    //   // userStartAudio();
    //   // countryPressed(event, [note]);
    // });

    legend_svg.selectAll('.year-label').transition().duration(50).text(year);
  };

  drawfuelsComs('2019');

  /* Animate */

  const animateYears = () => {
    playNow = setInterval(() => {
      console.log(i);
      if (i >= years.length) {
        clearInterval(playNow);

        d3.select('#pause-years').classed('hide', true);
        d3.select('#play-years').classed('hide', false);
      }

      const currentYear = years[i];
      if (currentYear) {
        drawfuelsComs(currentYear);
      }

      i++;
    }, 400);
  };

  d3.select('#play-years').on('click', () => {
    d3.select('#play-years').classed('hide', true);
    d3.select('#pause-years').classed('hide', false);

    i = 0;
    animateYears();
  });
  d3.select('#pause-years').on('click', () => {
    d3.select('#pause-years').classed('hide', true);
    d3.select('#play-years').classed('hide', false);
    pauseAnimations();
  });

  const pauseAnimations = () => {
    clearInterval(playNow);
  };
}

const tooltip_div = d3
  .select('body')
  .append('tooltip_div')
  .attr('class', 'tooltip')
  .style('opacity', 0)
  .style('display', 'none');

tooltip_div.append('div').classed('tooltip__text', true);

const highlight = () => {
  tooltip_div.transition().duration(200).style('opacity', 0.9);
};

const showInfo = (event, d) => {
  console.log(d);
  event.preventDefault();

  let left = event.pageX;
  let top = event.pageY;

  tooltip_div.transition().duration(200).style('opacity', 0.9);

  tooltip_div.select('.tooltip__text').html(() => {
    return `
    <strong>${d.name}</strong><br/>
    ${d.val === undefined ? '' : d.val}
    
    `;
  });
  tooltip_div
    .style('left', left + 'px')
    .style('top', top + 'px')
    .style('display', null);
};
