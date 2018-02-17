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
  data_points_altitude_cross_section: any;
  planes_number: number;
  flights_number: number;
  average_distance: number;
  median_distance: number;
  max_distance: number;
}

export class DailyStats {
  date: string;
  data: DataPoint;
}

export class Stats {
  stats: DailyStats[];
  altitude_cross_section_step: number;
}
