export class Plane {
  icao: string;
  flight_number?: string;
  transponder_code?: number;
  altitude?: number;
  speed?: number;
  heading?: number;
  latitude?: number;
  longitude?: number;
}

export class StoredPlane {
  data: Plane;
  time: string;
}

export class DataPoint {
  data_points_number: number;
  planes_number: number;
  flights_number: number;
}

export class Stats {
  date: string;
  data: DataPoint;
}
