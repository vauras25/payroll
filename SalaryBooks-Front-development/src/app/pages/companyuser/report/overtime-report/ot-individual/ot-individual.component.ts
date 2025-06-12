import { Component, EventEmitter, Input, OnInit, Output, } from '@angular/core';
import { Router, ActivatedRoute } from "@angular/router";
import { Location } from '@angular/common';
import { NgxSpinnerService } from 'ngx-spinner';
import { CompanyuserService } from 'src/app/services/companyuser.service';
import * as Global from 'src/app/globals';

@Component({
  selector: 'app-ot-individual',
  templateUrl: './ot-individual.component.html',
  styleUrls: ['./ot-individual.component.css']
})
export class OtIndividualComponent implements  OnInit {
  @Input() reportFilter: any = {};
  @Output()cancellReport = new EventEmitter();
  rows:any=[];
  constructor(
    private activatedRoute: ActivatedRoute,private location: Location,private companyuserService: CompanyuserService,
    private spinner: NgxSpinnerService,
  
  ) { }

  ngOnInit(): void {
  
  }
  ngOnChanges()
  {
    this.getFiltered();
  }

  getFiltered(page:any=null)
  {
    return new Promise((resolve, reject) => {
          
          let payload:any={};
          payload.row_checked_all = this.reportFilter.row_checked_all,
          payload.checked_row_ids = this.reportFilter.checked_row_ids,
          payload.unchecked_row_ids = this.reportFilter.unchecked_row_ids,
          payload.wage_month = this.reportFilter.wage_month,
          payload.wage_year = this.reportFilter.wage_year,
          this.spinner.show();
          this.companyuserService.overtimeReportTwentythree(payload).subscribe(res => {
              if (res.status == 'success') {
                  let master_data = res?.data?.docs ?? []
                  this.rows=master_data;
                 
              } else {
                  this.rows = [];
              }

              this.spinner.hide();
              Global.loadCustomScripts('customJsScript');
              resolve(true);
          }, (err) => {
              this.rows = [];
              this.spinner.hide();
              Global.loadCustomScripts('customJsScript');
              resolve(true);
          });

  })
  }
  printDoc(elements:any) {
    elements.hidden = true;
    
    // window.print();
    if (this.rows !== 'null') {
      window.print();
      // setTimeout(() => {
        this.closeWindow()
      // }, 1000);
      // this.location.back();
    }
    elements.hidden = false;
  }

  closeWindow() {
    this.cancellReport.emit(true)
  }

}
