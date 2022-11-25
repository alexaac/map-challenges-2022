import LineGraph from './LineGraph.js';
import TimeBrush from './TimeBrush.js';

let lineGraph, timeBrush, gpx_data, radius;

function drawChart(gpx_data, times, map) {
  let totalDistance = 0;

  const parent = document.querySelector('#chart');

  const changeView = () => {
    let width = parent.offsetWidth <= 960 ? parent.offsetWidth : 1200,
      height = parent.offsetWidth <= 960 ? (1 / 2) * width : (1 / 4) * width;

    radius =
      parent.offsetWidth <= 360 ? 0.5 : parent.offsetWidth <= 960 ? 1 : 1.5;
    console.log(parent.offsetWidth);
    // append the svg object to the chart div
    document.querySelector('#chart').innerHTML = '';

    let svg = d3
      .select('#chart')
      .append('svg')
      .attr('class', 'chart-group')
      .attr('preserveAspectRatio', 'xMidYMin')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', '0 0 ' + width + ' ' + height);

    // Set object for nodes by time

    const hasTimes = times !== undefined ? true : false;

    lineGraph = new LineGraph(
      '.chart-group',
      gpx_data,
      width,
      height,
      radius,
      map,
      hasTimes
    );
    lineGraph.setupData();

    timeBrush = new TimeBrush(
      '.chart-group',
      gpx_data,
      lineGraph,
      width,
      height,
      radius,
      hasTimes
    );
    timeBrush.setupData();

    // // Start/stop the brush animation
    // var flag = false;

    // d3.select('#play-cases').on('click', () => {
    //   d3.select('#play-cases').classed('hide', true);
    //   d3.select('#pause-cases').classed('hide', false);
    //   flag = true;
    //   animateBrush();
    // });
    // d3.select('#pause-cases').on('click', () => {
    //   d3.select('#pause-cases').classed('hide', true);
    //   d3.select('#play-cases').classed('hide', false);
    //   flag = false;
    // });

    const sleep = (ms) => {
      return new Promise((resolve) => setTimeout(resolve, ms));
    };

    async function animateBrush() {
      let brushStart = 0,
        brushEnd = 0,
        step = timeBrush.xScale.range()[1] / 10;

      for (let i = 10; i > 0; i--) {
        brushEnd += step;

        if (flag) {
          timeBrush.brushComponent
            .transition()
            .call(timeBrush.brush.move, [brushStart, brushEnd]);

          // brushStart = brushEnd; // let chart accumulate for now
          await sleep(1000);
        }
      }
      // if (flag) {
      //   d3.select('#play-cases').classed('hide', false);
      //   d3.select('#pause-cases').classed('hide', true);
      // }
    }
  };

  changeView();

  return { radius, lineGraph, timeBrush };
}

export { drawChart };
