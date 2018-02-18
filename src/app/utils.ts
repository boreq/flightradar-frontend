// Number of kilometers in a nautical mile.
const kmInNm = 1.852;

// Earth radius.
const R = 6371.0;

export function getNumberOfSecondsBetweenDates(firstDate, secondDate): number {
  return Math.round(Math.abs((firstDate - secondDate)/(1000)));
}

// Converts a distance in kilometers to nautical miles.
export function miles(km: number): number {
  return km / kmInNm;
}

// Converts a distance in nautical miles to kilometers.
export function kilometers(nm: number): number {
  return nm * kmInNm;
}

// Converts degrees to radians.
export function radians(degrees: number): number {
  return (Math.PI * degrees) / 180.0;
}

// Converts radians to degrees.
export function degrees(radians: number): number {
  return (180.0 * radians) / Math.PI;
}

export function calculateNewLonLat(lon1: number, lat1: number, bearing: number, distance: number): number[] {
  distance = distance / R;
  lon1 = radians(lon1);
  lat1 = radians(lat1);
  bearing = radians(bearing);

  var lat2 = Math.asin(Math.sin(lat1) * Math.cos(distance) + Math.cos(lat1) * Math.sin(distance) * Math.cos(bearing));
  var lon2 = lon1 + Math.atan2(Math.sin(bearing) * Math.sin(distance) * Math.cos(lat1), Math.cos(distance) - Math.sin(lat1) * Math.sin(lat2));
  return [degrees(lon2), degrees(lat2)];
}
