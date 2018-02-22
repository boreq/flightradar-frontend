import { Component, OnInit } from '@angular/core';

import { PlaneService } from '../plane.service'
import { StoredPlane } from '../plane'

class PlaneData {
  flights: string[] = [];

  constructor(public icao: string) { }

  addFlight(flight: string) {
    if (flight && this.flights.indexOf(flight) < 0) {
      this.flights.push(flight);
    }
  }
}

@Component({
  selector: 'app-planes',
  templateUrl: './planes.component.html',
  styleUrls: ['./planes.component.scss']
})
export class PlanesComponent implements OnInit {

  recent: PlaneData[] = null;

  recentNumberOfDays = 1;

  constructor(private planeService: PlaneService) { }

  ngOnInit() {
    let rangeTo = new Date();
    let rangeFrom = new Date();
    rangeFrom.setDate(rangeFrom.getDate() - this.recentNumberOfDays);
    this.planeService.getRange(rangeFrom, rangeTo)
      .subscribe((planes) => this.processRecent(planes));
  }

  private processRecent(planes: StoredPlane[]) {
    // Generating the data
    let planeDatas = {};

    for (let data of planes) {
      if (!planeDatas[data.data.icao]) {
        planeDatas[data.data.icao] = new PlaneData(data.data.icao);
      }
      planeDatas[data.data.icao].addFlight(data.data.flight_number);
    }

    // Sorting
    let keys = [];
    for (let key in planeDatas) {
      keys.push(key);
    }
    keys.sort();

    let recent = [];
    for (let key of keys) {
      recent.push(planeDatas[key]);
    }

    this.recent = recent;
  }

}
