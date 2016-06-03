// Global config
var GRAPHIC_DEFAULT_WIDTH = 600;
var MOBILE_THRESHOLD = 500;

// Global vars
var pymChild = null;
var isMobile = false;
var graphicData = null;

// D3 formatters
var fmtComma = d3.format(',');
var fmtYearAbbrev = d3.time.format('%y');
var fmtYearFull = d3.time.format('%Y');

/*
 * Initialize graphic
 */
var onWindowLoaded = function() {
    if (Modernizr.svg) {
        loadLocalData(GRAPHIC_DATA);
        //loadCSV('data.csv')
    } else {
        pymChild = new pym.Child({});
    }
}

/*
 * Load graphic data from a local source.
 */
var loadLocalData = function(data) {
    graphicData = data;

    formatData();

    pymChild = new pym.Child({
        renderCallback: render
    });
}

/*
 * Load graphic data from a CSV.
 */
var loadCSV = function(url) {
    d3.csv(GRAPHIC_DATA_URL, function(error, data) {
        graphicData = data;

        formatData();

        pymChild = new pym.Child({
            renderCallback: render
        });
    });
}

/*
 * Format graphic data for processing by D3.
 */
var formatData = function() {
    graphicData.forEach(function(d) {
        console.log(d);
        d['slides'] = +d['slides'];
        d['completion'] = +d['completion'];

    });
}

/*
 * Render the graphic(s). Called by pym with the container width.
 */
var render = function(containerWidth) {
    if (!containerWidth) {
        containerWidth = GRAPHIC_DEFAULT_WIDTH;
    }

    if (containerWidth <= MOBILE_THRESHOLD) {
        isMobile = true;
    } else {
        isMobile = false;
    }

    // Render the chart!
    renderLineChart({
        container: '#graphic',
        width: containerWidth,
        data: graphicData
    });

    // Update iframe
    if (pymChild) {
        pymChild.sendHeight();
    }
}

/*
 * Render a line chart.
 */
var renderLineChart = function(config) {
    /*
     * Setup
     */
    var xColumn = 'slides';
    var yColumn = 'completion';

    var aspectWidth = isMobile ? 4 : 16;
    var aspectHeight = isMobile ? 3 : 9;

    var margins = {
        top: 5,
        right: 25,
        bottom: 40,
        left: 70
    };

    var ticksX = 10;
    var ticksY = 10;
    var roundTicksFactor = 5;

    // Mobile
    if (isMobile) {
        ticksX = 5;
        ticksY = 5;
        margins['right'] = 25;
    }

    // Calculate actual chart dimensions
    var chartWidth = config['width'] - margins['left'] - margins['right'];
    var chartHeight = Math.ceil((config['width'] * aspectHeight) / aspectWidth) - margins['top'] - margins['bottom'];

    // Clear existing graphic (for redraw)
    var containerElement = d3.select(config['container']);
    containerElement.html('');

    /*
     * Create D3 scale objects.
     */

    var xScale = d3.scale.linear()
        .domain([0, 140])
        .range([ 0, chartWidth ])

    var yScale = d3.scale.linear()
        .domain([ 0, 100 ])
        .range([ chartHeight, 0 ]);

    /*
     * Create the root SVG element.
     */
    var chartWrapper = containerElement.append('div')
        .attr('class', 'graphic-wrapper');

    var chartElement = chartWrapper.append('svg')
        .attr('width', chartWidth + margins['left'] + margins['right'])
        .attr('height', chartHeight + margins['top'] + margins['bottom'])
        .append('g')
        .attr('transform', 'translate(' + margins['left'] + ',' + margins['top'] + ')');

    /*
     * Create SVG filters.
     */
    var filters = chartElement.append('filters');

    var textFilter = filters.append('filter')
        .attr('id', 'textshadow');

    textFilter.append('feGaussianBlur')
        .attr('in', 'SourceGraphic')
        .attr('result', 'blurOut')
        .attr('stdDeviation', '.25');

    /*
     * Create D3 axes.
     */
    var xAxis = d3.svg.axis()
        .scale(xScale)
        .orient('bottom')
        .ticks(ticksX)

    var yAxis = d3.svg.axis()
        .scale(yScale)
        .orient('left')
        .ticks(ticksY)
        .tickFormat(function(d) {
            return d + '%'
        })

    /*
     * Render axes to chart.
     */
    chartElement.append('g')
        .attr('class', 'x axis')
        .attr('transform', makeTranslate(0, chartHeight))
        .call(xAxis);

    chartElement.append('g')
        .attr('class', 'y axis')
        .call(yAxis);

    chartElement.append("text")
        .attr("class", "x axis-label")
        .attr("text-anchor", "middle")
        .attr("x", chartWidth / 2)
        .attr("y", chartHeight + 35)
        .text("Number of slides");

    chartElement.append("text")
        .attr("class", "y axis-label")
        .attr("text-anchor", "middle")
        .attr("y", -60)
        .attr("dy", ".75em")
        .attr("x", -(chartHeight / 2))
        .attr("transform", "rotate(-90)")
        .text("Completion Rate");

    /*
     * Render grid to chart.
     */
    var xAxisGrid = function() {
        return xAxis;
    }

    var yAxisGrid = function() {
        return yAxis;
    }

    chartElement.append('g')
        .attr('class', 'x grid')
        .attr('transform', makeTranslate(0, chartHeight))
        .call(xAxisGrid()
            .tickSize(-chartHeight, 0, 0)
            .tickFormat('')
        );

    chartElement.append('g')
        .attr('class', 'y grid')
        .call(yAxisGrid()
            .tickSize(-chartWidth, 0, 0)
            .tickFormat('')
        );

    /*
     * Render dots to chart.
     */
     chartElement.append('g')
        .attr('class', 'dots')
        .selectAll('circle')
        .data(config['data'])
        .enter().append('circle')
            .attr('fill', function(d) {
                if (d['highlight']) {
                    return COLORS['blue1'];
                }

                return COLORS['blue3']
            })
            .attr('r', 3.5)
            .attr('cx', function(d) {
                return xScale(d[xColumn]);
            })
            .attr('cy', function(d) {
                return yScale(d[yColumn] * 100);
            })
            .attr('class', function(d) {
                if (d['highlight']) {
                    return 'highlight';
                }

                return '';
            });

    /*
     * Add text shadow.
     */

    /*
     * Render labels.
     */
    var highlights = _.filter(config['data'], function(d) {
        return d['highlight'] !== null;
    })

    chartElement.append('g')
        .attr('class', 'label')
        .selectAll('text')
        .data(highlights)
        .enter().append('text')
            .attr('x', function(d) {
                if (d['story'] === 'The Unthinkable') {
                    return xScale(d[xColumn]) + 3;
                } else {
                    return xScale(d[xColumn]) - 65;

                }
            })
            .attr('y', function(d) {if (d['story'] === 'The Unthinkable') {
                    return yScale(d[yColumn] * 100) - 8;
                } else {
                    return yScale(d[yColumn] * 100) + 4;
                }
            })
            .text(function(d) {
                return d['story'];
            });
}

/*
 * Initially load the graphic
 * (NB: Use window.load to ensure all images have loaded)
 */
window.onload = onWindowLoaded;