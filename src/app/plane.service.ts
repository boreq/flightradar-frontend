import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';

import { Stats, StoredPlane, Plane } from './plane';

@Injectable()
export class PlaneService {

  private apiUrl = 'https://flightradar.0x46.net/api';
  private planesApiUrl = this.apiUrl + '/planes.json';
  private planeApiUrl = this.apiUrl + "/plane/{icao}.json";
  private statsApiUrl = this.apiUrl + "/stats.json";

  constructor(private http: HttpClient) { }

  getPlanes(): Observable<Plane[]> {
    return this.http.get<Plane[]>(this.planesApiUrl);
  }

  getPlane(icao: string): Observable<StoredPlane[]> {
    return this.http.get<StoredPlane[]>(this.planeApiUrl.replace('{icao}', icao));
  }

  getStats(): Observable<Stats[]> {
    return this.http.get<Stats[]>(this.statsApiUrl);
  }

}
