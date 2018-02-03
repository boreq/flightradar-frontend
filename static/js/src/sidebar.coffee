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
            <span id="plane-callsign">#{data.callsign}</span>
            #{renderCoords(parseFloat(data.latitude), parseFloat(data.longitude))}
        </h2>

        <ul>
            <li><span>Speed:</span> #{data.groundspeed}</li>
            <li><span>Heading:</span> #{data.heading}</li>
            <li><span>Altitude:</span> #{data.altitude}</li>
            <li><span>Squawk:</span> #{data.transponder}</li>
            <li><span>Name:</span> #{data.realname}</li>
            <li><span>CID:</span> #{data.cid}</li>
        </ul>
           """

    # Flight plan info
    if data.plan.origin != '' || data.plan.destination != ''
        text += """
            <h3>Flight plan</h3>
            <ul>
                <li><span>Origin:</span> #{data.plan.origin}</li>
                <li><span>Destination:</span> #{data.plan.destination}</li>
                <li><span>Altitude:</span> #{data.plan.altitude}</li>
                <li><span>Aircraft:</span> #{data.plan.aircraft}</li>
            </ul>
            <h4>Route</h4>
            <div id="sidebar-route">
                #{getLoadingIndicator()}
            </div>
                """
        drawRoute(data, dataSource)

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

# Displays info about an airport in the sidebar.
displayAirport = (icao, clientsSource, dataSource) ->
    header = """
        <h2>
            <i class="fa fa-road"></i>
            <span id="airport-icao">#{icao.toUpperCase()}</span>
        </h2>
             """
    sidebarDisplay(header + getLoadingIndicator())

    $.ajax
        url: "/api/airport/#{icao}.json"
        type: 'GET'
    .fail (jqXHR) ->
        responseText = $.parseJSON(jqXHR.responseText)
        sidebarDisplay(header + getErrorIndicator(responseText.message))
    .done (response) ->
        data = response.airport
        text = """
            <h2>
                <i class="fa fa-road"></i>
                <span id="airport-icao">#{data.icao.toUpperCase()}</span>
                #{renderCoords(data.lat, data.lon)}
            </h2>

            <p class="metar">#{data.metar}</p>
            <canvas id="airport-preview" width="300" height="150"></canvas>
               """
        # Runways.
        runwayText = ''
        for v in data.runways
            if v.ils.length > 0
                ilsText = '<ul>'
                for ils in v.ils
                    ilsText += "<li>#{ils.bearing.toFixed(0)}° #{ils.frequency}MHz</li>"
                ilsText += '</ul>'
            else
                ilsText = 'none'

            runwayText += """
                <tr>
                    <td>#{v.name}</td>
                    <td>#{v.heading.toFixed(0)}</td>
                    <td>#{v.length.toFixed(3)}km</td>
                    <td>#{ilsText}</td>
                </tr>
                          """

        text += """
            <h3>Runways</h3>
            <table>
                <thead>
                    <tr>
                        <td>Name</td>
                        <td>Heading</td>
                        <td>Length</td>
                        <td>ILS</td>
                    </tr>
                </thead>
                <tbody>
                    #{runwayText}
                </tbody>
            <table>
                """

        text += """
            <h3>ATC</h3>
            #{getATCAirportText(data.icao.toUpperCase(), clientsSource)}
                """

        arrivDepar = getAndDrawArrivalsDepartures(data, clientsSource, dataSource)
        text += """
            <h3>Arrivals</h3>
            #{arrivDepar[0]}
            <h3>Departures</h3>
            #{arrivDepar[1]}
                """

        sidebarDisplay(text)
        dispayAiportPreview(data)

getAndDrawArrivalsDepartures = (data, clientsSource, dataSource) ->
    clientDistance = (airportData, clientData) ->
        dst = distance(
            clientData.longitude
            clientData.latitude
            airportData.lon
            airportData.lat
        )
        miles(dst).toFixed(1)

    dataSource.clear()
    arrivalsText = ''
    departuresText = ''
    icao = data.icao.toUpperCase()
    for f in clientsSource.getFeatures()
        d = f.get('data')
        if d.type == 'PILOT'
            if d.plan.origin.toUpperCase() == icao
                drawDeparture(d, [data.lon, data.lat], dataSource)
                departuresText += """
                    <tr>
                        <td>#{d.callsign}</td>
                        <td>#{clientDistance(data, d)}nm</td>
                    </tr>
                                  """
            if d.plan.destination.toUpperCase() == icao
                drawArrival(d, [data.lon, data.lat], dataSource)
                arrivalsText += """
                    <tr>
                        <td>#{d.callsign}</td>
                        <td>#{clientDistance(data, d)}nm</td>
                    </tr>
                                """
    if arrivalsText
        arrivalsText = """
            <table>
                <thead>
                    <tr>
                        <td>Callsign</td>
                        <td>Distance</td>
                    </tr>
                </thead>
                <tbody>
                    #{arrivalsText}
                </tbody>
            </table>
                       """
    else
        arrivalsText = 'No arrivals.'

    if departuresText
        departuresText = """
            <table>
                <thead>
                    <tr>
                        <td>Callsign</td>
                        <td>Distance</td>
                    </tr>
                </thead>
                <tbody>
                    #{departuresText}
                </tbody>
            </table>
                         """
    else
        departuresText = 'No departures.'


    return [arrivalsText, departuresText]

getATCAirportText = (icao, clientsSource) ->
    text = ''
    for f in clientsSource.getFeatures()
        d = f.get('data')
        if d.type == 'ATC' and d.callsign.slice(0, icao.length) == icao
            text += """
                <tr>
                    <td>#{d.callsign}</td>
                    <td>#{d.frequency}MHz</td>
                </tr>
                    """
    if text
        text = """
            <table>
                <thead>
                    <tr>
                        <td>Callsign</td>
                        <td>Frequency</td>
                    </tr>
                </thead>
                <tbody>
                    #{text}
                </tbody>
            </table>
               """
    else
        text = 'No active ATC.'
    return text
            

# Generate the aiport preview.
# The ride never ends.
dispayAiportPreview = (data) ->
        # Canvas size
        size = [300, 150]

        # Padding from each border
        padding = 20

        canvas = document.getElementById('airport-preview')
        ctx = canvas.getContext('2d')

        # Calculate boundary
        # lon, lat, lon, lat
        extent = [null, null, null, null]
        for r in data.runways
            if extent[0] == null || r.lon1 < extent[0]
                extent[0] = r.lon1

            if extent[1] == null || r.lat1 < extent[1]
                extent[1] = r.lat1

            if extent[2] == null || r.lon1 > extent[2]
                extent[2] = r.lon1

            if extent[3] == null || r.lat1 > extent[3]
                extent[3] = r.lat1

        # Should be [0, 0]
        offset = [0, 0]
        size[0] -= padding * 2
        size[1] -= padding * 2

        # Calculate offset used to preserve the aspect ratio
        a = (extent[2] - extent[0]) / (extent[3] - extent[1])
        b = size[0] / size[1]
        if a < b
            sizeX = size[1] * a
            offset[0] = (size[0] - sizeX) / 2
        else
            sizeY = size[0] / a
            offset[1] = (size[1] - sizeY) / 2

        # Function translating coords
        translate = (coords) ->
            innerSize = [size[0] - offset[0] * 2, size[1] - offset[1] * 2]
            innerPos = [(coords[0] - extent[0]) / (extent[2] - extent[0]),
                        (coords[1] - extent[1]) / (extent[3] - extent[1])]
            x = innerPos[0] * innerSize[0] + offset[0]
            y = innerPos[1] * innerSize[1] + offset[1]
            # Flip/move away from the border
            y = size[1] - y + padding
            x = x + padding
            return [x, y]

        drawnLines = []
        alreadyDrawn = (start, end) ->
            for v in drawnLines
                if v[0] == end[0] && v[1] == end[1] && v[2] == start[0] && v[3] == start[1]
                    return true
            return false

        # Draw runways
        for r in data.runways
            start = translate([r.lon1, r.lat1])
            end = translate([r.lon2, r.lat2])

            # Runway line
            if !alreadyDrawn(start, end)
                line = new Path2D()
                line.moveTo(start[0], start[1])
                line.lineTo(end[0], end[1])
                ctx.strokeStyle = '#000000'
                ctx.lineWidth = 2
                ctx.stroke(line)
                drawnLines.push([start[0], start[1], end[0], end[1]])

            # Runway text
            x = end[0] - start[0]
            y = end[1] - start[1]
            vLen = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2))
            negNormalized = [-x/vLen, -y/vLen]
            textPos = [start[0] + negNormalized[0] * 2, start[1] + negNormalized[1] * 2]
            ctx.textAlign = if negNormalized[0] > 0 then 'left' else 'right'
            ctx.font = 'bold 13px sans-serif'
            ctx.fillStyle = '#D64541'
            ctx.fillText(r.name, textPos[0], textPos[1])

drawArrival = (planeData, airportCoords, dataSource) ->
    style = new ol.style.Style
        stroke: new ol.style.Stroke
            color: 'rgba(0, 255, 0, 1)'
            lineDash: [5]
    drawArrivalDepartureLine(planeData, airportCoords, dataSource, style)

drawDeparture = (planeData, airportCoords, dataSource) ->
    style = new ol.style.Style
        stroke: new ol.style.Stroke
            color: 'rgba(255, 0, 0, 1)'
            lineDash: [5]
    drawArrivalDepartureLine(planeData, airportCoords, dataSource, style)

drawArrivalDepartureLine = (planeData, airportCoords, dataSource, style) ->
    c = [parseFloat(planeData.longitude), parseFloat(planeData.latitude)]
    line = [
        ol.proj.fromLonLat(airportCoords),
        ol.proj.fromLonLat(c)
    ]
    feature = new ol.Feature
        geometry: new ol.geom.LineString(line)
    feature.setStyle(style)
    dataSource.addFeature(feature)
