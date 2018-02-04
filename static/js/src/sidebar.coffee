altitude1 = 2000
altitude2 = 10000
altitude3 = 20000
altitude4 = 30000
altitude5 = 50000

pickColorForAltitude = (altitude) ->
    if altitude < altitude1
        return formatColor(255, 255 * altitudeAsFraction(altitude, 0, altitude1), 0, 1)
    if altitude < altitude2
        return formatColor(255 * (1 - altitudeAsFraction(altitude, altitude1, altitude2)), 255, 0, 1)
    if altitude < altitude3
        return formatColor(0, 255, 255 * altitudeAsFraction(altitude, altitude2, altitude3), 1)
    if altitude < altitude4
        return formatColor(0, 255 * (1 - altitudeAsFraction(altitude, altitude3, altitude4)), 255, 1)
    if altitude < altitude5
        return formatColor(255 * altitudeAsFraction(altitude, altitude4, altitude5), 0, 255, 1)
    return formatColor(255, 0, 255, 1)

altitudeAsFraction = (current, min, max) ->
    return (current - min) / (max - min)

formatColor = (r, g, b, a) ->
    return "rgba(#{Math.round(r)}, #{Math.round(g)}, #{Math.round(b)}, #{a})"

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

getNumberOfDaysBetweenDates = (firstDate, secondDate) ->
    oneDay = 24 * 60 * 60 * 1000
    return Math.round(Math.abs((firstDate - secondDate)/(oneDay)))

getNumberOfSecondsBetweenDates = (firstDate, secondDate) ->
    return Math.round(Math.abs((firstDate - secondDate)/(1000)))

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
    map.getView().setZoom(9)

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
            <span id="plane-callsign">#{data.flight_number or 'No callsign'}</span>
            #{renderCoords(parseFloat(data.latitude), parseFloat(data.longitude))}
        </h2>

        <ul>
            <li><span>ICAO:</span> #{data.icao}</li>
            <li><span>Flight:</span> #{data.flight_number}</li>
            <li><span>Squawk:</span> #{data.transponder_code}</li>
            <li><span>Heading:</span> #{data.heading}</li>
            <li><span>Speed:</span> #{data.speed} <span class="dimmed">knots</span></li>
            <li><span>Altitude:</span> #{data.altitude} <span class="dimmed">feet</span></li>
        </ul>
           """

    # Flight plan info
    text += """
        <h3>Previous sightings</h3>
        <div id="sidebar-seen">
            #{getLoadingIndicator()}
        </div>
            """
    drawHistory(data, dataSource)

    sidebarDisplay(text)

drawHistory = (data, dataSource) ->
    dataSource.clear()

    $.ajax
        url: params.api_url_plane.replace('{icao}', data.icao)
        type: 'GET'
    .done (response) ->
        text = ""

        # Assemble
        flights = {}
        for data, i in response
            if data.data.longitude and data.data.latitude
                if i < response.length - 1 and getNumberOfSecondsBetweenDates(new Date(), Date.parse(data.time)) < 30 * 60
                    coords = []

                    c = [data.data.longitude, data.data.latitude]
                    coord = ol.proj.fromLonLat(c)
                    coords.push(coord)

                    c = [response[i + 1].data.longitude, response[i + 1].data.latitude]
                    coord = ol.proj.fromLonLat(c)
                    coords.push(coord)

                    # Draw segment
                    style = new ol.style.Style
                        stroke: new ol.style.Stroke
                            color: pickColorForAltitude(parseFloat(data.data.altitude))
                            #lineDash: [5]
                            width: 2
                    feature = new ol.Feature
                        geometry: new ol.geom.LineString(coords)
                    feature.setStyle(style)
                    dataSource.addFeature(feature)

            if data.data.flight_number
                daysPassed = getNumberOfDaysBetweenDates(new Date(), Date.parse(data.time))
                if daysPassed in flights
                    if not data.data.flight_number in flights[daysPassed]
                        flights[daysPassed].push(data.data.flight_number)
                else
                    flights[daysPassed] = [data.data.flight_number]

        daysAgo = []
        for numberOfDays, flightList of flights
            daysAgo.push(parseInt(numberOfDays))

        i = 0
        for numberOfDays in daysAgo
            flightList = flights[numberOfDays]
            flightText = ""
            for flight, i in flightList
                if i > 0
                    flightText += ", "
                flightText += flight

            if parseInt(numberOfDays) == 0
                daysText = "today"
            else
                daysText = "#{numberOfDays} days ago"
            
            text += """
                <tr>
                    <td>#{daysText}</td>
                    <td>#{flightText}</td>
                </tr>
                    """
            i++
            if i > 30
                break

        text = """
            <table>
                <thead>
                    <tr>
                        <td>Time</td>
                        <td>Flights</td>
                    </tr>
                </thead>
                <tbody>
                    #{text}
                </tbody>
            <table>
                """

        $('#sidebar-seen').html(text)
    .fail (jqXHR) ->
        responseText = $.parseJSON(jqXHR.responseText)
        $('#sidebar-route').html(getErrorIndicator(responseText.message))
