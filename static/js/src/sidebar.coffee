# Returns the jQuery element corresponding to the sidebar.
getSidebar = () ->
    $('#sidebar')

# Clears and hides the sidebar.
sidebarClear = () ->
    getSidebar().empty()
    getSidebar().hide()

# Shows the sidebar and fills it with html.
sidebarDisplay = (html) ->
    getSidebar().show()
    getSidebar().html(html)

getLoadingIndicator = () ->
    '<div class="loading-indicator"><i class="fa fa-spinner fa-spin"></i></div>'

getErrorIndicator = (text) ->
    if text == undefined or text == null
        text = 'Error.'
    """
        <div class="error-indicator"><i class="fa fa-exclamation-triangle"></i><div>#{text}</div></div>
    """

# Pans the map and zooms it on the specified coordinates.
focusMap = (map, lat, lon) ->
    target = ol.proj.fromLonLat([lon, lat])
    duration = 2000
    start = +new Date()

    pan = ol.animation.pan
        duration: duration
        source: map.getView().getCenter()
        start: start

    zoom = ol.animation.zoom
        duration: duration
        resolution: map.getView().getResolution()
        start: start

    map.beforeRender(pan, zoom)
    map.getView().setCenter(target)
    map.getView().setZoom(7)

# Creates an html with coordinates.
renderCoords = (lat, lon) ->
    latText = lat.toFixed(5)
    if lat > 0
        latText = latText + 'N'
    else
        latText = -latText + 'S'

    lonText = lon.toFixed(5)
    if lon > 0
        lonText = lonText + 'E'
    else
        lonText = -lonText + 'W'

    """
        <span class="coords" lat="#{lat}" lon="#{lon}">
            <i class="fa fa-globe"></i> #{latText} #{lonText}
        </span>
    """

# Displays info about a plane in the sidebar.
displayPlane = (data, dataSource) ->
    text = """
        <h2>
            <i class="fa fa-plane"></i> 
            <span id="plane-callsign">#{data.icao}</span>
            #{renderCoords(parseFloat(data.latitude), parseFloat(data.longitude))}
        </h2>

        <ul>
            <li><span>Flight:</span> #{data.flight_number}</li>
            <li><span>Speed:</span> #{data.speed}</li>
            <li><span>Heading:</span> #{data.heading}</li>
            <li><span>Altitude:</span> #{data.altitude}</li>
            <li><span>Squawk:</span> #{data.transponder_code}</li>
        </ul>
           """

    ## Flight plan info
    #if data.plan.origin != '' || data.plan.destination != ''
    #    text += """
    #        <h3>Flight plan</h3>
    #        <ul>
    #            <li><span>Origin:</span> #{data.plan.origin}</li>
    #            <li><span>Destination:</span> #{data.plan.destination}</li>
    #            <li><span>Altitude:</span> #{data.plan.altitude}</li>
    #            <li><span>Aircraft:</span> #{data.plan.aircraft}</li>
    #        </ul>
    #        <h4>Route</h4>
    #        <div id="sidebar-route">
    #            #{getLoadingIndicator()}
    #        </div>
    #            """
    #    drawRoute(data, dataSource)

    sidebarDisplay(text)

drawRoute = (data, dataSource) ->
    dataSource.clear()

    route = data.plan.origin + ' ' + data.plan.route + ' ' + data.plan.destination
    $.ajax
        url: params.api_url_route
        type: 'GET'
        data:
            route: route
    .done (response) ->
        text = ""

        # Assemble
        coords = []
        for point in response.route
            if point.lon != null and point.lat != null
                c = [point.lon, point.lat]
                coord = ol.proj.fromLonLat(c)
                coords.push(coord)
                coordsText = renderCoords(point.lat, point.lon)
            else
                coordsText = '<i class="dimmed">Unknown.</i>'

            text += """
                <tr>
                    <td>#{point.name}</td>
                    <td>#{coordsText}</td>
                </tr>
                    """

        text = """
            <table>
                <thead>
                    <tr>
                        <td>Name</td>
                        <td>Position</td>
                    </tr>
                </thead>
                <tbody>
                    #{text}
                </tbody>
            <table>
                """

        $('#sidebar-route').html(text)

        # Draw
        style = new ol.style.Style
            stroke: new ol.style.Stroke
                color: 'rgba(154, 18, 179, 0.8)'
                lineDash: [5]
        feature = new ol.Feature
            geometry: new ol.geom.LineString(coords)
        feature.setStyle(style)
        dataSource.addFeature(feature)
    .fail (jqXHR) ->
        responseText = $.parseJSON(jqXHR.responseText)
        $('#sidebar-route').html(getErrorIndicator(responseText.message))
