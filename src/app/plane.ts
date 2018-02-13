export class Plane {
  icao: string;
  flight_number: string;
  transponder_code: number;
  altitude: number;
  speed: number;
  heading: number;
  latitude: number;
  longitude: number;
}

export class StoredPlane {
  data: Plane;
  time: Date;
}
