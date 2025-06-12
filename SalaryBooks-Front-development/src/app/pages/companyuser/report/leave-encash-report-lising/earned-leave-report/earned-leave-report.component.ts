import { DatePipe } from '@angular/common';
import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { FormArray, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { CompanyuserService } from 'src/app/services/companyuser.service';
import * as Global from 'src/app/globals';
import PaginationOptions from 'src/app/models/PaginationOptions';
import TableFiilterOptions from 'src/app/models/TableFiilterOptions';
import { Router } from '@angular/router';
@Component({
  selector: 'app-earned-leave-report',
  templateUrl: './earned-leave-report.component.html',
  styleUrls: ['./earned-leave-report.component.css']
})
export class EarnedLeaveReportComponent implements OnInit {
  @Input() leaveencashFilter: any = {};
  Global = Global;
  paginationOptions: PaginationOptions = Global.resetPaginationOption();
  tableFilterOptions: TableFiilterOptions = Global.resetTableFilterOptions();
  leaveData:any=[];
  rows:any = [];
  constructor(
    public formBuilder: UntypedFormBuilder,
    private toastr: ToastrService,
    private companyuserService: CompanyuserService,
    private spinner: NgxSpinnerService,
    private datePipe: DatePipe  ,
    private titleService: Title,
    private router: Router

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
          if (page != null) {
              this.paginationOptions.page = page;
          }
          // console.log(page);
          let payload: any = this.leaveencashFilter;
          this.spinner.show();
          this.companyuserService.earnedleaveReporrt(payload).subscribe(res => {
              if (res.status == 'success') {
                  this.leaveData = [];
                  let master_data = res?.employees?? [];
                  this.leaveData=master_data;
                  this.leaveData.forEach((elem:any,index:any) => {
                  let opening_balance:any=0;  
                  let lapsed:any=0;  
                  let encashed:any=0; 
                  let availed:any=0; 
                  let closing_balance:any=0;
                  let leave_earned=0;
                  let carry_forward=0;
                  elem?.opening_balance.forEach((elem_open:any) => {
                  opening_balance+=  parseFloat(elem_open.balance);
                  });

                  elem?.lapsed.forEach((elem_laps:any) => {
                  lapsed+=  parseFloat(elem_laps.balance);  
                  });
                  elem?.carry_forward.forEach((elem_carry_f:any) => {
                  carry_forward+=  parseFloat(elem_carry_f.balance);     
                  });
                  elem.encashed.forEach((elem_encashed:any) => {
                  encashed+=  parseFloat(elem_encashed.balance);
                  })
                  elem.availed.forEach((elem_availed:any) => {
                  availed+=parseFloat(elem_availed.balance);
                  })
                  
                  elem.closing_balance.forEach((elem_closing:any) => {
                  closing_balance+=  parseFloat(elem_closing.balance);
                  });
                  elem.leave_added.forEach((elem_leave:any) => {
                  leave_earned+=parseFloat(elem_leave?.balance);  

                  });
                
                  this.leaveData[index].opening_balance_sum=opening_balance;
                  this.leaveData[index].lapsed_sum=lapsed;
                  this.leaveData[index].encashed_sum=encashed;
                  this.leaveData[index].availed_sum=availed;
                  this.leaveData[index].closing_balance_sum=closing_balance;
                  this.leaveData[index].leave_earned_sum=leave_earned;
                  this.leaveData[index].carry_forward_sum=carry_forward;

                  

                  });
                 
              } else {
                  this.leaveData = [];
                  this.paginationOptions = Global.resetPaginationOption();
              }

              this.spinner.hide();
              Global.loadCustomScripts('customJsScript');
              resolve(true);
          }, (err) => {
              this.leaveData = [];
              this.paginationOptions = Global.resetPaginationOption();
              this.spinner.hide();
              Global.loadCustomScripts('customJsScript');
              resolve(true);
          });

  })
  }
  

}
