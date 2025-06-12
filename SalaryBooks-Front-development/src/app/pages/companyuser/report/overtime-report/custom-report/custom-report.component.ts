import { Component, EventEmitter, Input, OnInit, Output, } from '@angular/core';
import { Router, ActivatedRoute } from "@angular/router";
import { Location } from '@angular/common';
import { NgxSpinnerService } from 'ngx-spinner';
import { CompanyuserService } from 'src/app/services/companyuser.service';
import * as Global from 'src/app/globals';

@Component({
  selector: 'app-custom-report',
  templateUrl: './custom-report.component.html',
  styleUrls: ['./custom-report.component.css']
})
export class CustomReportComponent implements OnInit {
  rows:any=[];
  @Output()cancellReport = new EventEmitter();
  @Input() reportFilter: any = {};
  template_fields:any=[];
  empReportData:any=[];
  constructor(
    private activatedRoute: ActivatedRoute,private location: Location,private companyuserService: CompanyuserService,
    private spinner: NgxSpinnerService,  

  ) { }

  ngOnInit(): void {
  }
  ngOnChanges()
  {
   this.template_fields= this.reportFilter?.template_fields?.template_fields[0]?.modules[0]?.fields   ;
   this.getFiltered();
  }
  printDoc(elements:any) {
    // console.log(elements.target);

    // window.print();
    if (this.rows.length>0) {
      window.close();
    } else {
      this.location.back();
    }
  }

  closeWindow() {
    this.cancellReport.emit(true)
  }
  getFiltered(page:any=null)
  {
    return new Promise((resolve, reject) => {
          
          let payload:any={};
          payload.pageno = 1;

          payload.row_checked_all = this.reportFilter.row_checked_all,
          payload.checked_row_ids = this.reportFilter.checked_row_ids,
          payload.unchecked_row_ids = this.reportFilter.unchecked_row_ids,
          payload.wage_month_from = this.reportFilter.wage_month,
          payload.wage_year_from = this.reportFilter.wage_year,
          payload.wage_month_to = this.reportFilter.wage_month,
          payload.wage_year_to = this.reportFilter.wage_year,
          payload.hod_id = this.reportFilter.hod_id,
          payload.department_id = this.reportFilter.department_id,
          payload.designation_id = this.reportFilter.designation_id,
          payload.branch_id = this.reportFilter.branch_id,
          payload.template_id = this.reportFilter.template_id,

          this.spinner.show();
          this.companyuserService.overtimecustomReport(payload).subscribe(res => {
              if (res.status == 'success') {
                  this.empReportData = [];
                  let master_data = res?.master_data?.docs ?? []
                  this.empReportData=master_data;
           
              } else {
                  this.empReportData = [];
              }

              this.spinner.hide();
              Global.loadCustomScripts('customJsScript');
              resolve(true);
          }, (err) => {
              this.empReportData = [];
              this.spinner.hide();
              Global.loadCustomScripts('customJsScript');
              resolve(true);
          });

  })
  }
  async exportExcel()
  {
    // return new Promise((resolve, reject) => {
          
      let payload:any={};
      payload.row_checked_all = this.reportFilter.row_checked_all,
      payload.checked_row_ids = this.reportFilter.checked_row_ids,
      payload.unchecked_row_ids = this.reportFilter.unchecked_row_ids,
      payload.wage_month_from = this.reportFilter.wage_month,
      payload.wage_year_from = this.reportFilter.wage_year,
      payload.wage_month_to = this.reportFilter.wage_month,
      payload.wage_year_to = this.reportFilter.wage_year,
      payload.hod_id = this.reportFilter.hod_id,
      payload.department_id = this.reportFilter.department_id,
      payload.designation_id = this.reportFilter.designation_id,
      payload.branch_id = this.reportFilter.branch_id,
      payload.template_id = this.reportFilter.template_id,

      this.spinner.show();
      await this.companyuserService.downloadFile('get-overtime-report-temp-wise-export-listing','get-overtime-report',payload);
      this.spinner.hide();
      // .subscribe(res => {
      //     if (res.status == 'success') {
      //    location.href=  res.url;
       
      //     } else {
      //         this.empReportData = [];
      //     }

      //     Global.loadCustomScripts('customJsScript');
      //     resolve(true);
      // }, (err) => {
      //     this.empReportData = [];
      //     this.spinner.hide();
      //     Global.loadCustomScripts('customJsScript');
      //     resolve(true);
      // });

// })
  }

}
