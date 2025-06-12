import { DatePipe } from '@angular/common';
import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { FormArray, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { CompanyuserService } from 'src/app/services/companyuser.service';
import * as Global from 'src/app/globals';
import PaginationOptions from 'src/app/models/PaginationOptions';
import TableFiilterOptions from 'src/app/models/TableFiilterOptions';
import swal from 'sweetalert2';
import { Router } from '@angular/router';
@Component({
  selector: 'app-tds-custom-report',
  templateUrl: './tds-custom-report.component.html',
  styleUrls: ['./tds-custom-report.component.css']
})
export class TdsCustomReportComponent implements OnInit {
  @Input() reportFilter: any = {};
  Global = Global;
  paginationOptions: PaginationOptions = Global.resetPaginationOption();
  tableFilterOptions: TableFiilterOptions = Global.resetTableFilterOptions();
  empReportData:any=[];
  rowCheckedAll: Boolean = false;
  checkedRowIds: any[] = [];
  uncheckedRowIds: any[] = [];
  @Output()cencellReport = new EventEmitter();

  constructor(
    public formBuilder: UntypedFormBuilder,
    private toastr: ToastrService,
    private companyuserService: CompanyuserService,
    private spinner: NgxSpinnerService,
    private datePipe: DatePipe  ,
    private titleService: Title,
    private router:Router
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
         

          let payload: any =this.reportFilter;

          this.spinner.show();
          this.companyuserService.tdsCustomReport(payload).subscribe(res => {
              if (res.status == 'success') {
                  this.empReportData =res?.employees;
              } else {
                  this.empReportData = [];
                  this.paginationOptions = Global.resetPaginationOption();
              }

              this.spinner.hide();
              Global.loadCustomScripts('customJsScript');
              resolve(true);
          }, (err) => {
              this.empReportData = [];
              this.paginationOptions = Global.resetPaginationOption();
              this.spinner.hide();
              Global.loadCustomScripts('customJsScript');
              resolve(true);
          });

  })
  }

  headwiseAmount(item:any,head:any)
  {
    let data=item?.tds_custom_report?.deduction_u_chapter_vi_a?.find((x:any)=>x.head==head);
    return data?.amount ?? 0;
  }

  pheadwiseAmount(item:any,head:any)
  {
    let netAmnt=0;
    let data=item?.tds_custom_report?.deduction_u_chapter_vi_a?.filter((x:any)=>x.p_head==head);
    if(data)
    {
     
      data.forEach((element:any) => {
      let amnt=parseFloat(element?.amount);
      if(isNaN(amnt))
      {
        amnt=0;
      }  
      netAmnt+=amnt;

      });
    }
    return netAmnt;
  }


  cancelGenerateReport()
  {
    this.cencellReport.emit();
  }

  exportData()
  {
    // return new Promise((resolve, reject) => {
         
      let payload: any =this.reportFilter;
      payload.generate='excel';
      this.spinner.show();
      this.companyuserService.downloadFile('tds-custom-report','tds-custom-report',payload)
      this.spinner.hide()
      // .subscribe(res => {
      //     if (res.status == 'success') {
      //     location.href=res?.url;  
      //     } else {
      //         this.paginationOptions = Global.resetPaginationOption();
      //     }

      //     this.spinner.hide();
      //     Global.loadCustomScripts('customJsScript');
      //     resolve(true);
      // }, (err) => {
      //     this.paginationOptions = Global.resetPaginationOption();
      //     this.spinner.hide();
      //     Global.loadCustomScripts('customJsScript');
      //     resolve(true);
      // });

// })//
  }


 

  



  

}
