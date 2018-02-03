# Number of kilometers in a nautical mile.
kmInNm = 1.852

# Converts degrees to radians.
radians =  (deg) ->
    return Math.PI * deg / 180

# Converts radians to degrees.
degrees =  (rad) ->
    return 180 * rad / Math.PI

# Converts a distance in kilometers to nautical miles.
miles = (km) ->
    return km / kmInNm

# Converts a distance in nautical miles to kilometers.
kilometers = (nm) ->
    return nm * kmInNm

# Calculates a distance in kilometers between two coordinates.
distance = (lon1, lat1, lon2, lat2) ->
    lon1 = radians(lon1)
    lat1 = radians(lat1)
    lon2 = radians(lon2)
    lat2 = radians(lat2)

    p1 = Math.pow(Math.sin((lat2 - lat1) / 2), 2)
    p2 = Math.pow(Math.sin((lon2 - lon1) / 2), 2)
    a =  p1 + Math.cos(lat1) * Math.cos(lat2) * p2
    c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return c * 6371

# Returns true if a string starts with a text.
startsWith = (string, text) ->
    string.slice(0, text.length) == text

# Returns true if a string ends with a text.
endsWith = (string, text) ->
    string.slice(string.length - text.length) == text
