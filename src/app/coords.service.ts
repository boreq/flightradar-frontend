import { Injectable } from '@angular/core';
import { Subject } from 'rxjs/Subject';

import { Coords } from './coords';

@Injectable()
export class CoordsService {

  private coordsSource = new Subject<Coords>();

  coords$ = this.coordsSource.asObservable();

  sendCoords(coords: Coords) {
    this.coordsSource.next(coords);
  }

}
