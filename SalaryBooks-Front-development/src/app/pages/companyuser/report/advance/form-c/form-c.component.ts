import { Component, Input, OnInit } from '@angular/core';
import * as Global from '../../../../../globals';


@Component({
  selector: 'advance-form-c',
  templateUrl: './form-c.component.html',
  styleUrls: ['./form-c.component.css']
})
export class FormCComponent implements OnInit {
  @Input('employees') employees:any[] = [];
  @Input('company') company:any
  constructor() { }

  ngOnInit(): void {
  }
  getMonth(index:number){
    return Global.monthMaster.find(m => m.index == index)?.sf
  }


}
