import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-pageheader',
  templateUrl: './pageheader.component.html',
  styleUrls: ['./pageheader.component.scss']
})
export class PageheaderComponent implements OnInit {

  @Input() title: string;
  @Input() fontAwesome: string;

  constructor() { }

  ngOnInit() {
  }

}
