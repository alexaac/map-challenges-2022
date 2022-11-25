import * as Helper from './Helper.js';

const isMobile = window.innerWidth < 703;

// LineGraph Class
export default class LineGraph {
  constructor(_parentElement, data, width, height, radius, map, hasTimes) {
    this.parentElement = _parentElement;
    this.data = data;
    this.svg_width = width;
    this.svg_height = height;
    this.r = radius;
    this.map = map;
    this.hasTimes = hasTimes;

    this.initViz();
  }

  initViz() {
    var viz = this;

    let language = d3.select('#language').node().value;

    (viz.margin = { top: 10, right: 60, bottom: 0, left: 100 }),
      (viz.width = viz.svg_width - viz.margin.left - viz.margin.right),
      (viz.group_height = (viz.svg_height * 1) / 3),
      (viz.height = viz.group_height - viz.margin.top - viz.margin.bottom);

    // append the g object to the svg
    viz.g = d3
      .select(viz.parentElement)
      .append('g')
      .attr('class', 'line-group')
      .attr(
        'transform',
        'translate(' + viz.margin.left + ',' + viz.margin.top + ')'
      );

    // Set the ranges

    viz.linePathActive = viz.g.append('g').attr('class', 'active');
    viz.linePathActiveDay = viz.g.append('g').attr('class', 'active_per_day');

    viz.nodesActive = viz.g.append('g').attr('class', 'node-active');
    viz.nodesActiveDay = viz.g.append('g').attr('class', 'node-active-per-day');

    // Labels
    viz.yLabel = viz.g
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -60)
      .attr('x', -(viz.group_height / 2))
      .attr('font-size', isMobile ? '6px' : '16px')
      .attr('text-anchor', 'middle')
      .text(() => {
        return language === 'ro' ? 'Altitudine' : 'Elevation';
      });

    // Set scales
    viz.xScale = d3.scaleTime().range([0, viz.width]);
    viz.yScale = d3.scaleLinear().range([viz.height, 0]);

    viz.yAxisCall = d3.axisLeft().ticks(5);
    viz.xAxisCall = d3.axisBottom().ticks(5);

    viz.xAxis = viz.g
      .append('g')
      .attr('class', 'line-chart-x')
      .attr('transform', `translate(0,${viz.height})`);
    viz.yAxis = viz.g.append('g').attr('class', 'line-chart-y');

    // // Title
    // viz.title = viz.g.append('text')
    //     .attr('x', (viz.width / 2))
    //     .attr('y', 0 - (viz.margin.top / 4))
    //     .attr('text-anchor', 'middle')
    //     .style('font-size', '16px')
    //     .style('text-decoration', 'underline')
    //     .text('Evoluția cazurilor pe zile');

    d3.select('#min-x').property('value', viz.xScale.range()[0]);
    d3.select('#max-x').property('value', viz.xScale.range()[1]);

    viz.setupData();
  }

  setupData(newValues) {
    var viz = this;

    viz.dataFiltered = viz.data;

    viz.field = 'total_active';

    if (newValues !== undefined) {
      viz.dataFiltered = viz.dataFiltered.filter(
        (d) => d.date >= newValues[0] && d.date <= newValues[1]
      );
    }

    viz.updateViz();
  }

  updateViz() {
    var viz = this;

    d3.select(viz.parentElement).selectAll('circle').remove();
    d3.select(viz.parentElement)
      .select('.line-group')
      .selectAll('path')
      .remove();

    if (viz.dataFiltered !== undefined) {
      // Set minimum Y to lowest graphic for all
      let minY =
          viz.field === 'all'
            ? d3.min(viz.dataFiltered, (d) => d.total_dead)
            : d3.min(viz.dataFiltered, (d) => d[viz.field]),
        maxY =
          viz.field === 'all'
            ? d3.max(viz.dataFiltered, (d) => d.total_case)
            : d3.max(viz.dataFiltered, (d) => d[viz.field]);

      // Update scales
      viz.xScale.domain(d3.extent(viz.dataFiltered, (d) => d.date));
      viz.yScale.domain([minY, maxY]).nice();

      // Update axes
      viz.xAxisCall.scale(viz.xScale);

      if (viz.hasTimes) {
        viz.xAxis
          .transition(Helper.transition)
          .call(viz.xAxisCall.tickFormat(Helper.multiFormat));
      } else {
        viz.xAxis
          .transition(Helper.transition)
          .call(viz.xAxisCall.tickFormat((x) => `${Number(x)}m`));
      }

      viz.yAxisCall.scale(viz.yScale);
      viz.yAxis.transition(Helper.transition).call(viz.yAxisCall);

      viz.xAxis.selectAll('text').attr('font-weight', 'bold');
      viz.yAxis.selectAll('text').attr('font-weight', 'bold');

      // Define the lines
      // Scatterplot

      // Total active cases
      if (viz.field === 'total_active') {
        viz.valueline_active = d3
          .line()
          .x((d) => (d.total_active !== 0 ? viz.xScale(d.date) : null))
          .y((d) => viz.yScale(d.total_active));

        viz.linePathActive = d3
          .select('.active')
          .append('path')
          .attr('class', 'line_active')
          .attr('d', viz.valueline_active(viz.dataFiltered));

        viz.circles4_update = d3
          .select('.node-active')
          .selectAll('circle')
          .data(viz.dataFiltered);
        viz.circles4_update.exit().attr('class', 'exit').remove();
        viz.circles4_enter = viz.circles4_update
          .enter()
          .append('circle')
          .attr('class', 'dot_active')
          .attr('id', (d) => `circle-${d.id}`)
          .merge(viz.circles4_update)
          // .transition(Helper.transition)
          .attr('r', viz.r)
          .attr('cx', (d) => (d.total_active !== 0 ? viz.xScale(d.date) : null))
          .attr('cy', (d) => viz.yScale(d.total_active));
      }

      // Set focus and tooltip on nodes on mousemove
      Helper.setFocus(
        viz.g,
        viz.xScale,
        viz.yScale,
        viz.width,
        viz.height,
        viz.dataFiltered,
        viz.field,
        viz.map
      );
    }
  }
}
