# Stats update interval [ms]
updateStatsEvery = 5 * 60 * 1000

initStats = () ->
    updateStats()
    $(window).resize(() ->
        displayStatsChart(window.statsResponse)
    )

updateStats = () ->
    $('#last-update-info i').addClass('fa fa-spin fa-circle-o-notch')

    $.ajax
        url: params.api_url_stats
    .done (response) ->
        # Display the data
        window.statsResponse = response
        displayStats(response)
        displayStatsChart(response)

        # Set the text with the time of the last update
        date = new Date()
        $('#last-update')
            .attr("datetime", date.toISOString())
            .attr("title", date)
            .data("timeago", null)
            .timeago()
    .always () ->
        timeout = setTimeout(updateStats, updateStatsEvery)
        $('#last-update-info i').removeClass('fa fa-spin fa-circle-o-notch')

displayStats = (response) ->
    for k, v of response.stats.users
        $("#stats-#{k} .value").text(v.current)

displayStatsChart = (response) ->
    definitions =
        pilots: '#65c6bb'
        controllers: '#EB9532'
        atis: '#F5D76E'
        supervisors: '#663399'
        observers: '#4183D7'
    series = []
    for k, color of definitions
        $("#stats-#{k} i").css('color', color)
        series.push
            color: color
            data: response.stats.users[k].chart
            label: k

    $.plot('#chart', series, {
        lines:
            show: true
        legend:
            show: false
        grid:
            borderWidth: 0
        yaxis:
            min: 0
        xaxis:
            mode: 'time'
            minTickSize: [1, 'hour']
    })
