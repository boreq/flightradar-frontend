import { Component, OnInit, Input } from '@angular/core';

import { Plane } from '../../plane';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {

  @Input() plane: Plane;

  constructor() { }

  ngOnInit() {
  }

}
