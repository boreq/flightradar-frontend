import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-coords',
  templateUrl: './coords.component.html',
  styleUrls: ['./coords.component.scss']
})
export class CoordsComponent implements OnInit {

  @Input() latitude: number;
  @Input() longitude: number;

  constructor() { }

  ngOnInit() {
  }

}
