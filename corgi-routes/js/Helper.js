const locale = d3.timeFormatLocale({
  dateTime: '%A, %e %B %Y г. %X',
  date: '%d.%m.%Y',
  time: '%H:%M:%S',
  periods: ['AM', 'PM'],
  days: ['Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă', 'Duminică'],
  shortDays: ['Lu', 'Ma', 'Mi', 'Jo', 'Vi', 'Sa', 'Du'],
  months: [
    'Ianuarie',
    'Februarie',
    'Martie',
    'Aprilie',
    'Mai',
    'Iunie',
    'Iulie',
    'August',
    'Septembrie',
    'Octombrie',
    'Noiembrie',
    'Decembrie',
  ],
  shortMonths: [
    'Ian',
    'Feb',
    'Mart',
    'Apr',
    'Mai',
    'Iun',
    'Iul',
    'Aug',
    'Sept',
    'Oct',
    'Nov',
    'Dec',
  ],
});

const formatMillisecond = locale.format('.%L'),
  formatSecond = locale.format(':%S'),
  formatMinute = locale.format('%I:%M'),
  formatHour = locale.format('%I %p'),
  formatDay = locale.format('%a %d'),
  formatWeek = locale.format('%b %d'),
  formatMonth = locale.format('%B'),
  formatYear = locale.format('%Y');

export const multiFormat = (date) => {
  return (
    d3.timeSecond(date) < date
      ? formatMillisecond
      : d3.timeMinute(date) < date
      ? formatSecond
      : d3.timeHour(date) < date
      ? formatMinute
      : d3.timeDay(date) < date
      ? formatHour
      : d3.timeMonth(date) < date
      ? d3.timeWeek(date) < date
        ? formatDay
        : formatWeek
      : d3.timeYear(date) < date
      ? formatMonth
      : formatYear
  )(date);
};

// Tooltip Code
export const setFocus = (
  parentElement,
  xScale,
  yScale,
  width,
  height,
  dataFiltered,
  field,
  map
) => {
  field = field === 'all' ? 'total_case' : field;

  let focus = parentElement
    .append('g')
    .attr('class', 'focus')
    .style('display', 'none');

  focus
    .append('line')
    .attr('class', 'x-hover-line hover-line')
    .attr('y1', 0)
    .attr('y2', height);

  focus
    .append('line')
    .attr('class', 'y-hover-line hover-line')
    .attr('x1', 0)
    .attr('x2', width);

  focus.append('circle').attr('r', 5.5);

  focus.append('text').attr('x', 0).attr('dy', '-1em');

  parentElement
    .append('rect')
    .attr('class', 'overlay')
    .attr('width', width + 100)
    .attr('height', height)
    .on('mouseover', () => {
      focus.style('display', null);
      tooltip_div.style('display', null);
    })
    .on('touchstart', () => {
      focus.style('display', null);
      tooltip_div.style('display', null);
    })
    .on('mouseout', () => {
      focus.style('display', 'none');
      tooltip_div.style('display', 'none');
    })
    .on('touchend', () => {
      focus.style('display', 'none');
      tooltip_div.style('display', 'none');
    })
    .on('mousemove', mousemove)
    .on('touchmove', mousemove);

  let bisectDate = d3.bisector((d) => d.date).left;

  function mousemove() {
    const x0 = xScale.invert(d3.mouse(this)[0]),
      i = bisectDate(dataFiltered, x0, 1),
      d0 = dataFiltered[i - 1],
      d1 = dataFiltered[i] || dataFiltered[dataFiltered.length - 1],
      d = x0 - d0.date > d1.date - x0 ? d1 : d0;
    focus.attr(
      'transform',
      'translate(' + xScale(d.date) + ',' + yScale(d[field]) + ')'
    );
    focus.select('.x-hover-line').attr('y2', height - yScale(d[field]));
    focus.select('.y-hover-line').attr('x2', -xScale(d.date));

    // Update the popup altitude value and marker location
    highlight(d, map);
  }
};

const tooltip_div = d3
  .select('body')
  .append('tooltip_div')
  .attr('class', 'tooltip')
  .style('opacity', 0);

export const highlight = (d, map) => {
  map.popup.setHTML(tooltipHTML(d));
  const lngLat = {
    lng: d.lon,
    lat: d.lat,
  };
  map.marker.setLngLat(lngLat);
  map.map.panTo(lngLat);

  // tooltip_div.transition().duration(200).style('opacity', 0.9);
  // tooltip_div
  //   .html(tooltipHTML(d))
  //   .style('left', d3.event.pageX / 1.5 + 'px')
  //   .style('top', d3.event.pageY / 1.5 + 'px');
};
const tooltipHTML = (d) => {
  const ro_date = d3.timeFormat('%Y-%m-%d')(d.date);
  let language = d3.select('#language').node().value;
  let labels = {
    elev: { ro: 'Altitudine', en: 'Altitude' },
    lat: { ro: 'Latitudine', en: 'Latitude' },
    lon: { ro: 'Longitudine', en: 'Longitude' },
    dist: { ro: 'Distanța totală', en: 'Total distance' },
  };

  return `<b>${labels.elev[language]} ${d.elevation}m <br/> 
      ${labels.dist[language]}: ${d.totalDistance}m <br />
      ${labels.lat[language]}: ${d.lat} <br />
      ${labels.lon[language]}: ${d.lon} <br />`;
};

export const transition = () => d3.transition().duration(1000);

export const drawButtons = (parentElement) => {
  let play = d3
    .select(parentElement)
    .append('g')
    .classed('play-group', true)
    .attr('transform', 'translate(260,50)');
  let playButton = play
    .append('rect')
    .append('a')
    .attr('class', 'play-icon')
    .attr('id', 'play-cases')
    .attr('href', '#')
    .attr('title', 'Play');
  let pauseButton = play
    .append('rect')
    .append('a')
    .attr('class', 'pause-icon')
    .attr('id', 'pause-cases')
    .attr('href', '#')
    .attr('title', 'Pause');
};
