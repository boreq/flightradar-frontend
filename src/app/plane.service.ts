import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { of } from 'rxjs/observable/of';

import { StoredPlane, Plane } from './plane';

export const planes: Plane[] = [{"icao":"424281","flight_number":"KTK7756","transponder_code":457,"altitude":35000,"speed":477,"heading":48,"latitude":50.033554,"longitude":-20.357666},{"icao":"471f92","flight_number":"WZZ6116","transponder_code":1474,"altitude":35000,"speed":468,"heading":86,"latitude":49.939518,"longitude":20.043665},{"icao":"4243f2","flight_number":"SDM5830","transponder_code":441,"altitude":35000,"speed":458,"heading":48,"latitude":49.620346,"longitude":19.623244}];

@Injectable()
export class PlaneService {

  constructor() { }

  getPlanes(): Observable<Plane[]> {
    return of(planes);
  }

}
