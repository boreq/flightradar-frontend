textStrokeColor = '#fff'
textFillColor = 'rgba(118, 135, 150, 1)'
textStrokeWidth = 2
updateEvery = 10

rangeFrom = null
rangeTo = null

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

    # Polar range plot layer.
    rangeSource = new ol.source.Vector({})
    rangeLayer = new ol.layer.Vector
        source: rangeSource
        visible: false

    # Selected feature data layer (arrivals, departures etc)
    dataSource = new ol.source.Vector({})
    dataLayer = new ol.layer.Vector
        source: dataSource

    # Map.
    map = new ol.Map
        target: 'map'
        layers: [worldLayer, dataLayer, rangeLayer, planeLayer]
        controls: new ol.Collection()
        view: new ol.View
            center: ol.proj.transform([params.longitude, params.latitude], 'EPSG:4326', 'EPSG:3857')
            zoom: 8

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

        if e.selected.length == 0
            sidebarClear()

        for f in e.selected
            d = f.get('data')
            if d.icao
                displayPlane(d, dataSource)

        map.render()

    # Buttons
    toggle = (e, layer, onShow, onHide) ->
        visible = layer.getVisible()
        layer.setVisible(!visible)
        if visible
            $(e.delegateTarget).addClass('hidden')
            if onHide
                onHide()
        else
            $(e.delegateTarget).removeClass('hidden')
            if onShow
                onShow()

    $('#layer-button-world').on('click', (e) ->
        toggle(e, worldLayer)
    )

    $('#layer-button-aircraft').on('click', (e) ->
        toggle(e, planeLayer)
    )

    $('#layer-button-polar').on('click', (e) ->
        toggle(e, rangeLayer, () ->
            updateRange(rangeSource)
            $('.range-hidden').removeClass('hidden')
        , () -> 
            $('.range-hidden').addClass('hidden')
        )
    )
    $('#layer-button-polar').addClass('hidden')
    $('.range-hidden').addClass('hidden')

	# From button
    $('#range-input-from').datetimepicker({
        onChangeDateTime: (dp, $input) ->
            console.log(dp)
            rangeFrom = dp
    })
    $('#range-button-from').on('click', () ->
        $('#range-input-from').datetimepicker('show')
    )

	# To button
    $('#range-input-to').datetimepicker({
        onChangeDateTime: (dp, $input) ->
            console.log(dp)
            rangeTo = dp
    })
    $('#range-button-to').on('click', () ->
        $('#range-input-to').datetimepicker('show')
    )

    # Apply button
    $('#range-button-apply').on('click', () ->
        updateRange(rangeSource)
    )

    rangeTo = new Date()
    rangeFrom = new Date()
    rangeFrom.setDate(rangeFrom.getDate() - 1)

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
        func = () -> update(planesSource, dataSource)
        setTimeout(func, 1000 * updateEvery)

updateRange = (rangeSource) ->
    fromTimestamp = rangeFrom.getTime() / 1000
    toTimestamp = rangeTo.getTime() / 1000
    $.ajax
        url: params.api_url_range
        type: 'GET'
        data:
            from: fromTimestamp
            to: toTimestamp
    .done (response) ->
        drawRange(rangeSource, response)

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

getStationPositionStyle = () ->
    style = new ol.style.Style
        image: new ol.style.Circle
            fill: new ol.style.Fill
                color: 'rgba(214, 69, 65, 1)'
            radius: 5
    textStyle = makeTextStyle('Station position')
    return getResolutionStyle(100, [style], [style, textStyle])

getRangePointStyle = (value) ->
    style = new ol.style.Style
        image: new ol.style.Circle
            fill: new ol.style.Fill
                color: 'rgba(41, 128, 185, 1)'
            radius: 5
    textStyle = makeTextStyle(Math.round(value.distance) + 'km')
    return getResolutionStyle(700, [style], [style, textStyle])

getRangePolygonStyle = (value) ->
    return new ol.style.Style({
        stroke: new ol.style.Stroke({
            color: 'rgba(41, 128, 185, 0.5)'
            width: 2
        }),
        fill: new ol.style.Fill({
            color: 'rgba(41, 128, 185, 0.3)'
        })
    })

drawRange = (rangeSource, planes) ->
    # Draw polygon
    data = {}

    for v in planes
        if not v.latitude and not v.longitude
            continue

        lon = parseFloat(v.longitude)
        lat = parseFloat(v.latitude)
        d = distance(params.longitude, params.latitude, lon, lat)
        b = Math.round(bearing(params.longitude, params.latitude, lon, lat))
        console.log(d, b)

        if not data[b] or data[b].distance < d
            data[b] = {
                bearing: b
                distance: d
                v: v
            }

    bearings = []
    for k, v of data
        bearings.push(k)
    bearings.sort()

    cord = []
    for k in bearings
        v = data[k]
        console.log(k)
        c = [parseFloat(v.v.longitude), parseFloat(v.v.latitude)]
        c = ol.proj.fromLonLat(c)
        cord.push(c)
    cord.push(cord[0])

    console.log(cord)

    rangeSource.clear()

    feature = new ol.Feature({})
    feature.setGeometry(new ol.geom.Polygon([cord]))
    feature.setStyle(getRangePolygonStyle())
    rangeSource.addFeature(feature)

    # Draw every point position
    for k, v of data
        c = [v.v.longitude, v.v.latitude]
        cord = ol.proj.fromLonLat(c)
        feature = new ol.Feature({})
        feature.setGeometry(new ol.geom.Point(cord))
        feature.setStyle(getRangePointStyle(v))
        rangeSource.addFeature(feature)

    # Draw station position
    c = [params.longitude, params.latitude]
    cord = ol.proj.fromLonLat(c)
    feature = new ol.Feature({})
    feature.setGeometry(new ol.geom.Point(cord))
    feature.setStyle(getStationPositionStyle())
    rangeSource.addFeature(feature)

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
