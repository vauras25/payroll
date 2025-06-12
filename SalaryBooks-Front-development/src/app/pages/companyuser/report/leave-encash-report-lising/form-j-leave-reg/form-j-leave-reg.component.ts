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
  selector: 'app-form-j-leave-reg',
  templateUrl: './form-j-leave-reg.component.html',
  styleUrls: ['./form-j-leave-reg.component.css']
})
export class FormJLeaveRegComponent implements OnInit {
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
          payload.pageno = this.paginationOptions.page;
          payload.perpage = this.tableFilterOptions.length;
        

          this.spinner.show();
          this.companyuserService.formjleaveReporrt(payload).subscribe(res => {
              if (res.status == 'success') {
                  this.leaveData = [];
                  let master_data = res?.data ?? [];
                  this.leaveData=master_data;
                  this.leaveData.data=[];
                  this.leaveData.forEach((elem_leave_dt:any,index:any)=>{
                  let count_elem_arr=[this.leaveData[index]?.privilege_leave?.length,this.leaveData[index]?.maternity_leave?.length,this.leaveData[index]?.special_leave?.length];
                  let iterate_num:any=Math.max(...count_elem_arr);
                  let data=[];
                  for(let i=0;i<iterate_num;i++)
                  {
                    data.push({
                      privilege:{
                        application_date:elem_leave_dt.privilege_leave[i]?elem_leave_dt.privilege_leave[i].date_of_application:'',
                        from_date:elem_leave_dt.privilege_leave[i]?elem_leave_dt.privilege_leave[i].from_date:'',to_date:elem_leave_dt.privilege_leave[i]?elem_leave_dt.privilege_leave[i].to_date:'',
                        balance_due:elem_leave_dt.privilege_leave[i]?elem_leave_dt.privilege_leave[i].balance_due:''
                    
                    },
                    maternity:{
                      application_date:elem_leave_dt.maternity_leave[i]?elem_leave_dt.maternity_leave[i].date_of_application:'',
                      from_date:elem_leave_dt.maternity_leave[i]?elem_leave_dt.maternity_leave[i].from_date:'',to_date:elem_leave_dt.maternity_leave[i]?elem_leave_dt.maternity_leave[i].to_date:'',
                      balance_due:elem_leave_dt.maternity_leave[i]?elem_leave_dt.maternity_leave[i].balance_due:''
                  
                  },
                  special:{
                    application_date:elem_leave_dt.special_leave[i]?elem_leave_dt.special_leave[i].date_of_application:'',
                    from_date:elem_leave_dt.special_leave[i]?elem_leave_dt.special_leave[i].from_date:'',to_date:elem_leave_dt.special_leave[i]?elem_leave_dt.special_leave[i].to_date:'',
                    balance_due:elem_leave_dt.special_leave[i]?elem_leave_dt.special_leave[i].balance_due:''
                
                }
                    
                });


              }  
              this.rows.push({data:data});



                  })
                  
             
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
