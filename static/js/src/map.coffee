textStrokeColor = '#fff'
textFillColor = 'rgba(118, 135, 150, 1)'
textStrokeWidth = 2

# Creates ol.style.Text with the specified text.
makeTextStyle = (text) ->
    new ol.style.Style
        text: new ol.style.Text
            text: text
            font: '11px Verdana',
            offsetX: 10,
            textAlign: 'left',
            fill: new ol.style.Fill
                color: textFillColor
            stroke: new ol.style.Stroke
                color: textStrokeColor
                width: textStrokeWidth
                
# Create a tiled ol.layer.Vector with ol.source.TileVector.
makeTiledLayer = (url, style, maxResolution, extract, render) ->
    downloaded = []
    isDownloaded = (url) -> url in downloaded

    source = new ol.source.TileVector
        url: url
        tileGrid: new ol.tilegrid.TileGrid
            minZoom: 0
            extent: ol.proj.get('EPSG:3857').getExtent()
            origin: [-20037508.342789244, 20037508.342789244]
            resolutions: [9783.93962050256]
        projection: 'EPSG:3857',
        tileLoadFunction: (url, callback) ->
            if isDownloaded(url)
                return

            $.ajax(
                url: url,
                type: 'GET'
            ).done (response) ->
                if isDownloaded(url)
                    return

                downloaded.push url
                features = []
                data = extract(response)
                for v in data
                    # Convert coords.
                    c = [v.lon, v.lat]
                    cord = ol.proj.fromLonLat(c)

                    # Create feature.
                    if render == null || render == undefined
                        feature = new ol.Feature
                            geometry: new ol.geom.Point(cord)
                            data: v
                    else
                        feature = render(cord, v)

                    # Add feature.
                    if feature != null
                        features.push(feature)

                callback(features)

    new ol.layer.Vector
        source: source
        style: style
        maxResolution: maxResolution

# If passed to a style function alternates between two styles depending on the
# current map resolution.
getResolutionStyle = (thresholdResolution, styleAbove, styleBelow) ->
    (resolution) ->
        if resolution < thresholdResolution then styleBelow else styleAbove

init = () ->
    getAirportStyle = (airport) ->
        airportStyle = new ol.style.Style
            image: new ol.style.Circle
                fill: new ol.style.Fill
                    color: 'rgba(214, 69, 65, 1)'
                #stroke: new ol.style.Stroke
                #    color: '#D64541'
                radius: 5
        textStyle = makeTextStyle(airport.get('data').icao.toUpperCase())
        return getResolutionStyle(700, [airportStyle], [airportStyle, textStyle])

    selectedAirportStyle = new ol.style.Style
        image: new ol.style.Circle
            fill: new ol.style.Fill
                color: '#D64541'
            radius: 5

    # World layer.
    sourceWorld = new ol.source.OSM
        url: params.api_url_tiles
    worldLayer = new ol.layer.Tile
        source: sourceWorld

    # FIRs layer.
    firSource = new ol.source.Vector
        format: new ol.format.TopoJSON({})
        url: 'static/data/fir.topo.json'

    firLayer = new ol.layer.Vector
        source: firSource
        style: getFIRStyle()
        visible: false

    # Planes layer.
    planesSource = new ol.source.Vector({})
    planeLayer = new ol.layer.Vector
        source: planesSource

    # Selected feature data layer (arrivals, departures etc)
    dataSource = new ol.source.Vector({})
    dataLayer = new ol.layer.Vector
        source: dataSource

    # Airports.
    airportLayer = makeTiledLayer(
        params.api_url_airports_tiles
        undefined
        2000
        (response) ->
            response.airports
        (cord, v) ->
            feature = new ol.Feature
                geometry: new ol.geom.Point(cord)
                data: v
            feature.setStyle(getAirportStyle(feature))
            return feature
    )

    # Map.
    map = new ol.Map
        target: 'map'
        layers: [worldLayer, firLayer, airportLayer, dataLayer, planeLayer]
        controls: new ol.Collection()
        view: new ol.View
            center: ol.proj.transform([20, 50], 'EPSG:4326', 'EPSG:3857')
            zoom: 5

    # Interaction.
    $(document).on('click', '.coords', (e) ->
        focusMap(map,
                 parseFloat($(e.target).attr('lat')),
                 parseFloat($(e.target).attr('lon'))
        )
    )

    interaction = new ol.interaction.Select
        condition: ol.events.condition.singleClick
        layers: [airportLayer, planeLayer]
        multi: false
        filter: (feature) ->
            d = feature.get('data')
            if d.icao
                return true
            if d.callsign and d.type == 'PILOT'
                return true
            return false
    map.addInteraction(interaction)
    interaction.on 'select', (e) ->
        dataSource.clear()

        for v in e.deselected
            d = v.get('data')
            if d.icao
                v.setStyle(getAirportStyle(v))

        if e.selected.length == 0
            sidebarClear()

        for f in e.selected
            d = f.get('data')
            if d.callsign and d.type == 'PILOT'
                displayPlane(d, dataSource)

            if d.icao
                displayAirport(d.icao, planesSource, dataSource)
                f.setStyle(selectedAirportStyle)

        map.render()


    toggle = (e, layer) ->
        visible = layer.getVisible()
        layer.setVisible(!visible)
        if visible
            $(e.delegateTarget).addClass('hidden')
        else
            $(e.delegateTarget).removeClass('hidden')

    #firSource.on('change', () ->
    #    if firSource.getState() == 'ready'
    #        console.log(firSource.getState())
    #)

    $('#layer-button-world').on('click', (e) ->
        toggle(e, worldLayer)
    )

    $('#layer-button-fir').on('click', (e) ->
        toggle(e, firLayer)
    )
    $('#layer-button-fir').addClass('hidden')

    $('#layer-button-airport').on('click', (e) ->
        toggle(e, airportLayer)
    )

    $('#layer-button-aircraft').on('click', (e) ->
        toggle(e, planeLayer)
    )

    update(planesSource, firSource, dataSource)

# Updates the data displayed in the sidebar
updateSidebar = (planesSource, dataSource) ->
    # Plane
    callsign = $('#sidebar #plane-callsign')
    if callsign.length
        for f in planesSource.getFeatures()
            d = f.get('data')
            if d.callsign == callsign.text()
                displayPlane(d, dataSource)
                break
        return

    # Airport
    icao = $('#sidebar #airport-icao')
    if icao.length
        displayAirport(icao.text(), planesSource, dataSource)
        return

update = (planesSource, firSource, dataSource) ->
    console.log('update')
    $.ajax
        url: params.api_url_clients
        type: 'GET'
        cache: false
    .done (response) ->
        drawClients(planesSource, firSource, response.clients)
        updateSidebar(planesSource, dataSource)
    .always () ->
        func = () -> update(planesSource, firSource, dataSource)
        setTimeout(func, 1000 * 60)

getPlaneStyle = (feature) ->
    data = feature.get('data')
    rot = (data.heading / 360) * 2 * Math.PI
    planeStyle = new ol.style.Style
        image: new ol.style.Icon
            src: 'static/img/plane.png'
            rotation: rot
    getResolutionStyle(2000, [planeStyle], [planeStyle, makeTextStyle(data.callsign)])

getStationaryPlaneStyle = (feature) ->
    data = feature.get('data')
    rot = (data.heading / 360) * 2 * Math.PI
    planeStyle = new ol.style.Style
        image: new ol.style.Icon
            src: 'static/img/plane.png'
            rotation: rot
            opacity: 0.4
        zIndex: -100
    return planeStyle
    getResolutionStyle(100, [], [planeStyle])

getFIRStyle = () ->
    new ol.style.Style
        stroke: new ol.style.Stroke
            color: '#ABB7B7'

getActiveFIRStyle = (icao) ->
    new ol.style.Style
        text: new ol.style.Text
            text: icao
            font: '11px Verdana',
            offsetX: 10,
            textAlign: 'left',
            fill: new ol.style.Fill
                color: '#fff'
            stroke: new ol.style.Stroke
                color: '#888'
                width: 1
        stroke: new ol.style.Stroke
            color: '#ff0000'
        zIndex: 100

drawClients = (planesSource, firSource, clients) ->
    # Function which looks for a feature with the right callsign
    findFeature = (callsign) ->
        for f in planesSource.getFeatures()
            if f.get('data').callsign == callsign
                return f
        return null

    for v in clients
        # Sanity check
        if (v.longitude == '' || v.latitude == '')
            continue

        # Convert coords
        c = [parseFloat(v.longitude), parseFloat(v.latitude)]
        cord = ol.proj.fromLonLat(c)

        # Get an existing feature or create a new one if it doesn't exist yet
        feature = findFeature(v.callsign)
        if !feature
            feature = new ol.Feature({})
            planesSource.addFeature(feature)

        # Update custom properties
        feature.setProperties
            data: v

        # Update feature
        if v.type == 'PILOT'
            feature.setGeometry(new ol.geom.Point(cord))
            spd = parseFloat(v.groundspeed)
            if spd != null and spd < 50
                feature.setStyle(getStationaryPlaneStyle(feature))
            else
                feature.setStyle(getPlaneStyle(feature))
        else
            getATCStyle = (radius, color, data) ->
                (resolution) ->
                    circle = new ol.style.Style
                        stroke: new ol.style.Stroke
                            color: color
                            width: 2

                    text = "#{data.callsign} #{data.frequency}MHz"

                    if endsWith(data.callsign, 'ATIS')
                        offsetY = (radius / resolution) + 12
                    else
                        offsetY = (-radius / resolution) - 12

                    text = new ol.style.Style
                        text: new ol.style.Text
                            text: text
                            font: '11px Verdana',
                            offsetY: offsetY,
                            textAlign: 'center',
                            fill: new ol.style.Fill
                                color: color
                            stroke: new ol.style.Stroke
                                color: textStrokeColor
                                width: textStrokeWidth
                    if resolution > 500 then [circle] else [circle, text]


            # Ground
            if v.facility_type == '3'
                feature.setGeometry(new ol.geom.Circle(cord, 10000))
                feature.setStyle(getATCStyle(10000, 'rgba(217, 30, 24, 1)', v))

            # Tower
            if v.facility_type == '4'
                feature.setGeometry(new ol.geom.Circle(cord, 20000))
                feature.setStyle(getATCStyle(20000, 'rgba(248, 148, 6, 1)', v))

            # Approach
            if v.facility_type == '5'
                feature.setGeometry(new ol.geom.Circle(cord, 100000))
                feature.setStyle(getATCStyle(100000, 'rgba(38, 166, 91, 1)', v))

    # Function which looks for a callsign in new data
    findClient = (callsign) ->
        for c in clients
            if c.callsign == callsign
                return c
        return null

    # Remove missing
    for f in planesSource.getFeatures()
        if !findClient(f.get('data').callsign)
            planesSource.removeFeature(f)

hilightFir = (firSource, clients) ->
    activeATC = (icao) =>
        for d in clients
            if d.type == 'ATC' and d.facility_type == '6' and startsWith(d.callsign, icao)
                return d.callsign
        return null

    for f in firSource.getFeatures()
        icao = f.get('icao')
        if icao
            act = activeATC(icao)
            if act
                f.setStyle(getActiveFIRStyle(act))
            else
                f.setStyle(getFIRStyle())
