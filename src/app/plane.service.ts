import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';

import { environment } from '../environments/environment';
import { Stats, StoredPlane, Plane } from './plane';

@Injectable()
export class PlaneService {

  private planesApiUrl = environment.baseApiUrl + '/planes.json';
  private planeApiUrl = environment.baseApiUrl + "/plane/{icao}.json";
  private statsApiUrl = environment.baseApiUrl + "/stats.json";
  private polarApiUrl = environment.baseApiUrl + "/polar.json";

  constructor(private http: HttpClient) { }

  getPlanes(): Observable<Plane[]> {
    return this.http.get<Plane[]>(this.planesApiUrl);
  }

  getPlane(icao: string): Observable<StoredPlane[]> {
    return this.http.get<StoredPlane[]>(this.planeApiUrl.replace('{icao}', icao));
  }

  getStats(): Observable<Stats> {
    return this.http.get<Stats>(this.statsApiUrl);
  }

  getPolar(from: Date, to: Date): Observable<any> {
    let params = new HttpParams();
    params = params.set('from', Math.round(from.getTime() / 1000).toString())
    params = params.set('to', Math.round(to.getTime() / 1000).toString())
    return this.http.get<any>(this.polarApiUrl, { params: params });
  }

}
