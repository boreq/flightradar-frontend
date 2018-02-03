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
    # World layer.
    sourceWorld = new ol.source.OSM
        url: params.api_url_tiles
    worldLayer = new ol.layer.Tile
        source: sourceWorld

    # Planes layer.
    planesSource = new ol.source.Vector({})
    planeLayer = new ol.layer.Vector
        source: planesSource

    # Selected feature data layer (arrivals, departures etc)
    dataSource = new ol.source.Vector({})
    dataLayer = new ol.layer.Vector
        source: dataSource

    # Map.
    map = new ol.Map
        target: 'map'
        layers: [worldLayer, dataLayer, planeLayer]
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
        layers: [planeLayer]
        multi: false
        filter: (feature) ->
            d = feature.get('data')
            if d.icao
                return true
            return false
    map.addInteraction(interaction)
    interaction.on 'select', (e) ->
        dataSource.clear()

        #for v in e.deselected
        #    d = v.get('data')
        #    if d.icao
        #        v.setStyle(getAirportStyle(v))

        if e.selected.length == 0
            sidebarClear()

        for f in e.selected
            d = f.get('data')
            if d.icao
                displayPlane(d, dataSource)

        map.render()

    update(planesSource, dataSource)

# Updates the data displayed in the sidebar
updateSidebar = (planesSource, dataSource) ->
    icao = $('#sidebar #plane-callsign')
    if icao.length
        for f in planesSource.getFeatures()
            d = f.get('data')
            if d.icao == icao.text()
                displayPlane(d, dataSource)
                break

update = (planesSource, dataSource) ->
    $.ajax
        url: params.api_url_planes
        type: 'GET'
        cache: false
    .done (response) ->
        drawPlanes(planesSource, response)
        updateSidebar(planesSource, dataSource)
    .always () ->
        console.log('always')
        func = () -> update(planesSource, dataSource)
        setTimeout(func, 1000 * 60)

getPlaneStyle = (feature) ->
    data = feature.get('data')
    rot = (data.heading / 360) * 2 * Math.PI
    planeStyle = new ol.style.Style
        image: new ol.style.Icon
            src: 'static/img/plane.png'
            rotation: rot
    getResolutionStyle(2000, [planeStyle], [planeStyle, makeTextStyle(data.icao)])

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

drawPlanes = (planesSource, planes) ->
    # Function which looks for a feature with the right callsign
    findFeature = (icao) ->
        for f in planesSource.getFeatures()
            if f.get('data').icao == icao
                return f
        return null

    for v in planes
        # Sanity check
        if (not v.longitude or not v.latitude)
            continue

        # Convert coords
        c = [parseFloat(v.longitude), parseFloat(v.latitude)]
        cord = ol.proj.fromLonLat(c)

        # Get an existing feature or create a new one if it doesn't exist yet
        feature = findFeature(v.icao)
        if !feature
            feature = new ol.Feature({})
            planesSource.addFeature(feature)

        # Update custom properties
        feature.setProperties
            data: v

        # Update feature
        feature.setGeometry(new ol.geom.Point(cord))
        spd = parseFloat(v.speed)
        if spd != null and spd < 50
            feature.setStyle(getStationaryPlaneStyle(feature))
        else
            feature.setStyle(getPlaneStyle(feature))

    # Function which looks for a callsign in new data
    findClient = (icao) ->
        for c in planes
            if c.icao == icao
                return c
        return null

    # Remove missing
    for f in planesSource.getFeatures()
        if !findClient(f.get('data').icao)
            planesSource.removeFeature(f)
