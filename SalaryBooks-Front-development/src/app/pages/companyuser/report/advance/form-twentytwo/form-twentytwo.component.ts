import { Component, Input, OnInit } from '@angular/core';
import * as Global from '../../../../../globals';

@Component({
  selector: 'advance-form-twentytwo',
  templateUrl: './form-twentytwo.component.html',
  styleUrls: ['./form-twentytwo.component.css']
})
export class FormTwentytwoComponent implements OnInit {
  @Input('employees') employees:any[] = [];
  @Input('company') company:any

  constructor() { }

  ngOnInit(): void {
  }

  getMonth(index:number){
    return Global.monthMaster.find(m => m.index == index)?.sf
  }

}
