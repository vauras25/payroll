import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'd-view-location-map',
  templateUrl: './d-view-location-map.component.html',
  styleUrls: ['./d-view-location-map.component.css']
})
export class DViewLocationMapComponent implements OnInit {
  @Input() location:any
  timeNow:Date = new Date()

  constructor() { 
    setInterval(() => {
      this.timeNow = new Date();
    }, 1);
  }

  ngOnInit() {
  }

}
