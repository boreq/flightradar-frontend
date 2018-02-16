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
  private polarApiUrl = this.apiUrl + "/polar.json";

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

  getPolar(from: Date, to: Date): Observable<any> {
    let params = {
      from: Math.round(from.getTime() / 1000)),
      to: Math.round(to.getTime() / 1000))
    };
    return this.http.get<any>(this.polarApiUrl, { params: params });
  }

}
