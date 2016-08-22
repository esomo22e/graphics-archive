/*
 * Initialize the graphic.
 */
var onWindowLoaded = function() {
    // Uncomment to enable column sorting
    // var tablesort = new Tablesort(document.getElementById('state-table'));

    pymChild = new pym.Child({});

    pymChild.onMessage('on-screen', function(bucket) {
        ANALYTICS.trackEvent('on-screen', bucket);
    });

    var pastLink = d3.select('#jump-past');
    var upcomingLink = d3.select('#jump-upcoming');

    pastLink.on('click', function() {
        var t = document.getElementById('past');
        pymChild.sendMessage('scrollTo', t.getBoundingClientRect().top);
    })

    upcomingLink.on('click', function() {
        var t = document.getElementById('upcoming');
        pymChild.sendMessage('scrollTo', t.getBoundingClientRect().top);
    })
}

/*
 * Initially load the graphic
 * (NB: Use window.load instead of document.ready
 * to ensure all images have loaded)
 */
window.onload = onWindowLoaded;
