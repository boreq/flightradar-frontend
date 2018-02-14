import { Component, OnInit, Input } from '@angular/core';

import { CoordsService } from '../../../coords.service';
import { Coords } from '../../../coords';

@Component({
  selector: 'app-coords',
  templateUrl: './coords.component.html',
  styleUrls: ['./coords.component.scss']
})
export class CoordsComponent implements OnInit {

  @Input() latitude: number;
  @Input() longitude: number;

  constructor(private coordsService: CoordsService) { }

  ngOnInit() {
  }

  onClick() {
    let coords = new Coords(this.latitude, this.longitude);
    this.coordsService.sendCoords(coords);
  }

}
