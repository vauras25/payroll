import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-view-location-map',
  templateUrl: './view-location-map.component.html',
  styleUrls: ['./view-location-map.component.css']
})
export class ViewLocationMapComponent implements OnInit {
  @Input() location:any

  constructor() { }

  ngOnInit() {
  }

}
