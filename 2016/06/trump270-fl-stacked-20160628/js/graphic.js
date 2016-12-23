// Global vars
var pymChild = null;
var isMobile = false;

/*
 * Initialize the graphic.
 */
var onWindowLoaded = function() {
    if (Modernizr.svg) {
        formatData();

        pymChild = new pym.Child({
            renderCallback: render
        });
    } else {
        pymChild = new pym.Child({});
    }

    pymChild.onMessage('on-screen', function(bucket) {
        ANALYTICS.trackEvent('on-screen', bucket);
    });
    pymChild.onMessage('scroll-depth', function(data) {
        data = JSON.parse(data);
        ANALYTICS.trackEvent('scroll-depth', data.percent, data.seconds);
    });
}

/*
 * Format graphic data for processing by D3.
 */
var formatData = function() {
    DATA.forEach(function(d) {
        var x0 = 0;

        d['values'] = [];

        for (var key in d) {
            if (key == 'label' || key == 'values') {
                continue;
            }

            d[key] = +d[key];

            var x1 = x0 + d[key];

            d['values'].push({
                'name': key,
                'x0': x0,
                'x1': x1,
                'val': d[key]
            })

            x0 = x1;
        }
    });
}

/*
 * Render the graphic(s). Called by pym with the container width.
 */
var render = function(containerWidth) {
    if (!containerWidth) {
        containerWidth = DEFAULT_WIDTH;
    }

    if (containerWidth <= MOBILE_THRESHOLD) {
        isMobile = true;
    } else {
        isMobile = false;
    }

    // Render the chart!
    renderStackedBarChart({
        container: '#stacked-bar-chart',
        width: containerWidth,
        data: DATA,
        headers: HEADERS
    });

    // Update iframe
    if (pymChild) {
        pymChild.sendHeight();
    }
}

/*
 * Render a stacked bar chart.
 */
var renderStackedBarChart = function(config) {
    /*
     * Setup
     */
    var labelColumn = 'label';

    var barHeight = 40;
    var barGap = 5;
    var labelWidth = 135;
    var labelMargin = 6;
    var winnerWidth = 65;
    var winnerMargin = 6;
    var valueGap = 6;

    var margins = {
        top: 20,
        right: (winnerWidth + winnerMargin),
        bottom: 20,
        left: (labelWidth + labelMargin)
    };

    var ticksX = 4;
    var roundTicksFactor = 10;

    if (isMobile) {
        ticksX = 2;
    }

    // Calculate actual chart dimensions
    var chartWidth = config['width'] - margins['left'] - margins['right'];
    var chartHeight = ((barHeight + barGap) * config['data'].length);

    // Clear existing graphic (for redraw)
    var containerElement = d3.select(config['container']);
    containerElement.html('');

    /*
     * Create D3 scale objects.
     */
     var min = d3.min(config['data'], function(d) {
         var lastValue = d['values'][d['values'].length - 1];
         return Math.floor(lastValue['x1'] / roundTicksFactor) * roundTicksFactor;
     });

     if (min > 0) {
         min = 0;
     }

     var max = d3.max(config['data'], function(d) {
         var lastValue = d['values'][d['values'].length - 1];
         return Math.ceil(lastValue['x1'] / roundTicksFactor) * roundTicksFactor;
     });

     var xScale = d3.scale.linear()
         .domain([min, max])
         .rangeRound([0, chartWidth]);

     var colorScale = d3.scale.ordinal()
         .domain(d3.keys(config['data'][0]).filter(function(d) {
             return d != labelColumn && d != 'values';
         }))
         .range([ COLORS['red2'], COLORS['red3'], COLORS['blue2']]);

    /*
     * Render the legend.
     */
    var legend = containerElement
        .append('div')
        .attr('class', 'legend-wrapper')
        .append('ul')
        .attr('class', 'key')
        .selectAll('g')
            .data(colorScale.domain())
        .enter().append('li')
            .attr('class', function(d, i) {
                return 'key-item key-' + i + ' ' + classify(d);
            });

    legend.append('b')
        .style('background-color', function(d) {
            return colorScale(d);
        });

    legend.append('label')
        .text(function(d) {
            return d;
        });


    header = containerElement.append('div')
        .attr('class', 'header clearfix');

    header.append('div')
        .attr('style', function(d, i) {
            return formatStyle({
                'width': labelWidth + 'px',
                'left': winnerMargin + 'px',
                'top': '15px'
            });
        })
        .attr('class', 'header-label')
        .html(config['headers']['labels-header']);

    header.append('div')
    .attr('style', function(d, i) {
            return formatStyle({
                'width': winnerWidth + 'px',
                'left': chartWidth + 16 + 'px',
                'top': '15px'
            });
        })
        .attr('class', 'header-winner')
        .text("Winner");


    /*
     * Create the root SVG element.
     */
    var chartWrapper = containerElement.append('div')
        .attr('class', 'graphic-wrapper');

    // Testing

    var chartElement = chartWrapper.append('svg')
        .attr('width', chartWidth + margins['left'] + margins['right'])
        .attr('height', chartHeight + margins['top'] + margins['bottom'])
        .append('g')
        .attr('transform', 'translate(' + margins['left'] + ',' + margins['top'] + ')');

    /*
     * Create D3 axes.
     */
    var xAxis = d3.svg.axis()
        .scale(xScale)
        .orient('bottom')
        .ticks(ticksX)
        .tickFormat(function(d) {
            return d + '%';
        });

    /*
     * Render axes to chart.
     */
    chartElement.append('g')
        .attr('class', 'x axis')
        .attr('transform', makeTranslate(0, chartHeight))
        .call(xAxis);

    /*
     * Render grid to chart.
     */
    var xAxisGrid = function() {
        return xAxis;
    };

    chartElement.append('g')
        .attr('class', 'x grid')
        .attr('transform', makeTranslate(0, chartHeight))
        .call(xAxisGrid()
            .tickSize(-chartHeight, 0, 0)
            .tickFormat('')
        );

    /*
     * Render bars to chart.
     */
     var group = chartElement.selectAll('.group')
         .data(config['data'])
         .enter().append('g')
             .attr('class', function(d) {
                 return 'group ' + classify(d[labelColumn]);
             })
             .attr('transform', function(d,i) {
                 return 'translate(0,' + (i * (barHeight + barGap)) + ')';
             });

     group.selectAll('rect')
         .data(function(d) {
             return d['values'];
         })
         .enter().append('rect')
             .attr('x', function(d) {
                 if (d['x0'] < d['x1']) {
                     return xScale(d['x0']);
                 }

                 return xScale(d['x1']);
             })
             .attr('width', function(d) {
                 return Math.abs(xScale(d['x1']) - xScale(d['x0']));
             })
             .attr('height', barHeight)
             .style('fill', function(d) {
                 return colorScale(d['name']);
             })
             .attr('class', function(d) {
                 return classify(d['name']);
             });

     /*
      * Render bar values.
      */
     // group.append('g')
     //    .attr('class', 'value')
     //    .selectAll('text')
     //    .data(function(d) {
     //        return d['values'];
     //    })
     //    .enter().append('text')
     //        .text(function(d) {
     //            if (d['val'] != 0) {
     //                if (d['val'] > 40) {
     //                    return d['val'] + '%';
     //                }
     //            }
     //        })
     //        .attr('class', function(d) {
     //            return classify(d['name']);
     //        })
     //        .attr('x', function(d) {
     //            return xScale(d['x1']);
     //        })
     //        .attr('dx', function(d) {
     //            var textWidth = this.getComputedTextLength();
     //            var barWidth = Math.abs(xScale(d['x1']) - xScale(d['x0']));

     //            // Hide labels that don't fit
     //            if (textWidth + valueGap * 2 > barWidth) {
     //                d3.select(this).classed('hidden', true)
     //            }

     //            if (d['x1'] < 0) {
     //                return valueGap;
     //            }

     //            return -(valueGap + textWidth);
     //        })
     //        .attr('dy', (barHeight / 2) + 4)

    /*
     * Render 0-line.
     */
    if (min < 0) {
        chartElement.append('line')
            .attr('class', 'zero-line')
            .attr('x1', xScale(0))
            .attr('x2', xScale(0))
            .attr('y1', 0)
            .attr('y2', chartHeight);
    }

    /*
     * Render winning line
     */
     chartElement.append('line')
            .attr('class', 'winner-line')
            .attr('x1', xScale(50))
            .attr('x2', xScale(50))
            .attr('y1', 0)
            .attr('y2', chartHeight);

    /*
     * Render bar labels.
     */
    chartWrapper.append('ul')
        .attr('class', 'labels')
        .attr('style', formatStyle({
            'width': labelWidth + 'px',
            'top': margins['top'] + 'px',
            'left': '0'
        }))
        .selectAll('li')
        .data(config['data'])
        .enter()
        .append('li')
            .attr('style', function(d, i) {
                return formatStyle({
                    'width': labelWidth + 'px',
                    'height': barHeight + 'px',
                    'left': '0px',
                    'top': (i * (barHeight + barGap)) + 'px;'
                });
            })
            .attr('class', function(d) {
                return classify(d[labelColumn]);
            })
            .append('span')
                .html(function(d) {
                    return d[labelColumn];
                });


    /*
     * Render winners for each scenario
     */
    winners = chartWrapper.append('ul')
        .attr('class', 'winner')
        .attr('style', formatStyle({
            'width': winnerWidth + 'px',
            'top': margins['top'] + 'px',
            'left': chartWidth + labelWidth + labelMargin + 'px'
        }))
        .selectAll('li')
        .data(config['data'])
        .enter()
        .append('li')
            .attr('style', function(d, i) {
                return formatStyle({
                    'width': winnerWidth + 'px',
                    'height': barHeight + 'px',
                    'left': winnerMargin + 'px',
                    'top': (i * (barHeight + barGap)) + 'px'
                });
            })
            .attr('class', function(d) {
                return 'legend-winner';
            });

    winners.append('div')
            .attr('style', function(d, i) {
                var bckColor = (d['Democratic votes'] > 50) ? COLORS['blue2'] : COLORS['red2'];
                return formatStyle({
                    'background-color': bckColor,
                    // 'width': winnerWidth - winnerMargin + 'px',
                    'height': barHeight + 'px',
                    'line-height': barHeight + 'px',
                    'color': 'white',
                    'text-align': 'center',
                    'font-weight': 'bold'
                });
            })
            .attr('class', 'winner-div')
            .text(function(d) {
                return (d['Democratic votes'] > 50) ? "DEM" : "GOP";
            });
}

/*
 * Initially load the graphic
 * (NB: Use window.load to ensure all images have loaded)
 */
window.onload = onWindowLoaded;
