import { Component, OnInit, Input } from '@angular/core';

import { StoredPlane, Plane } from '../../plane';
import { getNumberOfSecondsBetweenDates } from '../../utils';

class PreviouslySeen {
  constructor(public daysAgo: number, public flights: string[]) {}
}

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {

  @Input() plane: Plane;
  previouslySeen: PreviouslySeen[];

  constructor() { }

  @Input() set planeHistory(value: StoredPlane[]) {
    if (value === null) {
      this.previouslySeen == null;
      return;
    }

    let flights = {};
    for (let data of value) {
        if (data.data.flight_number) {
            let daysPassed = Math.floor(getNumberOfSecondsBetweenDates(new Date(), Date.parse(data.time)) / (60 * 60 * 24));
            if (daysPassed in flights) {
                if (flights[daysPassed].indexOf(data.data.flight_number) < 0) {
                  flights[daysPassed].push(data.data.flight_number);
                }
            } else {
              flights[daysPassed] = [data.data.flight_number];
            }
        }
    }

    let keys = [];
    for (let key in flights) {
      keys.push(parseInt(key));
    }
    keys = keys.sort((a, b) => a - b);

    let previouslySeen = [];
    for (let key of keys) {
      previouslySeen.push(new PreviouslySeen(parseInt(key), flights[key]));
    }

    this.previouslySeen = previouslySeen;
  }

  ngOnInit() {
  }

}
