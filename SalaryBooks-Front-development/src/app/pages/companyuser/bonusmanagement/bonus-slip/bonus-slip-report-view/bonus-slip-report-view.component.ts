import { Component, Input, OnInit } from '@angular/core';

import * as Global from 'src/app/globals';
@Component({
  selector: 'app-bonus-slip-report-view',
  templateUrl: './bonus-slip-report-view.component.html',
  styleUrls: ['./bonus-slip-report-view.component.css'],
})
export class BonusSlipReportViewComponent implements OnInit {
  @Input() rows: any = [];

  Global = Global;

  constructor() {}

  ngOnInit(): void {}

  formatmonth(month:any){
    if (month) {
       return Global.monthMaster.find(m => m.index == month)?.sf
    }else{
      return 'N/A'
    }
  }
}
