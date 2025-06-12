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
import swal from 'sweetalert2';
@Component({
  selector: 'app-detail-report',
  templateUrl: './detail-report.component.html',
  styleUrls: ['./detail-report.component.css']
})
export class DetailReportComponent implements OnInit {
  @Input() employeeListFilter: any = {};
  days:any=[];
  Global = Global;
  paginationOptions: PaginationOptions = Global.resetPaginationOption();
  tableFilterOptions: TableFiilterOptions = Global.resetTableFilterOptions();
  empReportData:any=[];
  zeroPad = (num:any, places:any) => String(num).padStart(places, '0');
  start_date:any='';
  end_date:any='';
  leaveHeadMaster: any=[];
  constructor(
    public formBuilder: UntypedFormBuilder,
    private toastr: ToastrService,
    private companyuserService: CompanyuserService,
    private spinner: NgxSpinnerService,
    private datePipe: DatePipe  ,
    private titleService: Title,
  ) { }
  ngOnInit(): void {
  this.fetchLeaveHeads();
  }
  ngOnChanges()
  {
    let wage_month_from=this.employeeListFilter.wage_month_from;
    let wage_year_from=this.employeeListFilter.wage_year_from;

    let wage_month_to=this.employeeListFilter.wage_month_to;
    let wage_year_to=this.employeeListFilter.wage_year_to;

    let start_date=new Date(wage_year_from,wage_month_from,1);

    let monthMaster=Global.monthMaster;

    let no_of_days:any=Global.monthMaster.find(x=>x.index==wage_month_to);
    if(no_of_days)
    {
      let last_date=no_of_days?.days;
      let end_date=new Date(wage_year_to,wage_month_to,last_date);
      this.days=Global.getDaysArray(start_date,end_date);
      let filter_optins={
        "wage_month_from": this.employeeListFilter?.wage_month_from.toString(),
        "wage_year_from": this.employeeListFilter?.wage_year_from.toString(),
        "wage_month_to":this.employeeListFilter?.wage_month_to.toString(),
        "wage_year_to":this.employeeListFilter?.wage_year_to.toString(),
        "attendance_type": "time",
        "branch_id": this.employeeListFilter?.branch_id,
        "designation_id": this.employeeListFilter?.designation_id,
        "department_id": this.employeeListFilter?.department_id,
        "hod_id": this.employeeListFilter?.hod_id,
        "client_id": this.employeeListFilter?.client_id,
        "unchecked_row_ids":[],
        "checked_row_ids":[],
        "row_checked_all":"false",
        "report_type": "month_wise_summary"

    }
      this.tableFilterOptions = Global.resetTableFilterOptions();
      this.tableFilterOptions =Object.assign(filter_optins, this.tableFilterOptions);
      this.start_date=start_date;
      this.end_date=end_date;
      this.getFiltered();

    }



  }
  getFiltered(page:any=null)
  {
    return new Promise((resolve, reject) => {
          if (page != null) {
              this.paginationOptions.page = page;
          }

          let payload: any = this.tableFilterOptions;
          payload.pageno = this.paginationOptions.page;
          payload.perpage = this.tableFilterOptions.length;

          this.spinner.show();
          this.companyuserService.leaveledgerReport(payload).subscribe(res => {
              if (res.status == 'success') {
                  this.empReportData = [];
                  let master_data:any=[];
                   master_data = res?.employees ?? [];
                   master_data.forEach((element: any,index:any) => {
                   
//END

                    let leave_addeds:any=[];
                  
                    
                    this.leaveHeadMaster.forEach((x:any)=>{
                      if(master_data[index]?.leave_added.length>0)
                      {
                        let item=  master_data[index]?.leave_added.find((item:any)=>item.abbreviation==x.abbreviation);
                        let findbal_index= master_data[index]?.leave_added.findIndex((item:any)=>item.abbreviation==x.abbreviation);
                        if(item==undefined)
                         {
                          master_data[index]?.leave_added.push({balance:'N/A',leave_temp_head:{abbreviation:x.abbreviation}});
                        
                         }
                         else{
                           master_data[index].leave_added.splice(findbal_index,1);
                           master_data[index].leave_added.push(item);
  
  
                         }
                      }
                      else{
                        master_data[index].leave_added.push({balance:'N/A',leave_temp_head:{abbreviation:x.abbreviation}});
                      }  

                

                    });
                  
                    let availeds=[];
                   
                   

                      this.leaveHeadMaster.forEach((x:any)=>{
                      if(master_data[index]?.availed.length>0)
                    {
                     
                        let item=  master_data[index]?.availed.find((item:any)=>item.abbreviation==x.abbreviation);
                        let findbal_index= master_data[index]?.availed.findIndex((item:any)=>item.abbreviation==x.abbreviation);
                        if(item==undefined)
                         {

                          master_data[index].availed.push({balance:'N/A'});
                         }
                         else{
                          master_data[index].availed.splice(findbal_index, 1);
                          master_data[index].availed.push(item);

                         }
                      
                     
                    }
                    else{
                      master_data[index].availed.push({balance:'N/A'})

                    }  

                    });

                    this.leaveHeadMaster.forEach((x:any)=>{
                    if(master_data[index]?.lapsed.length>0)
                    {
                     
                        let item=  master_data[index]?.lapsed.find((item:any)=>item.abbreviation==x.abbreviation);
                        let findbal_index= master_data[index]?.lapsed.findIndex((item:any)=>item.abbreviation==x.abbreviation);
                        if(item==undefined)
                         {

                          master_data[index]?.lapsed.push({balance:'N/A'});
                         }
                         else{
                          master_data[index].lapsed.splice(findbal_index, 1);
                          master_data[index].lapsed.push(item);


                         }
                                           

                    }
                    else{
                      master_data[index].lapsed.push({balance:'N/A'})

                    }  
                    });

                    let encashes=[];
                   

                    this.leaveHeadMaster.forEach((x:any)=>{
                      if(master_data[index]?.encashed.length>0)
                      {
                       
                          let item=  master_data[index]?.encashed.find((item:any)=>item.abbreviation==x.abbreviation);
                          let findbal_index=  master_data[index]?.encashed.findIndex((item:any)=>item?.abbreviation==x.abbreviation);
                          if(item==undefined)
                           {
  
                            master_data[index].encashed.push({balance:'N/A'});
                           }
                           else{
                            master_data[index].encashed.splice(findbal_index, 1);
                            master_data[index].encashed.push(item);
  
  
                           }
                       
  
                      }
                      else{
                        master_data[index].encashed.push({balance:'N/A'})
  
                      }  
                    });

                    let closing_balances=[];
                   


                    this.leaveHeadMaster.forEach((x:any)=>{
                      if(master_data[index]?.closing_balance.length>0)
                      {
                       
                          let item=  master_data[index]?.closing_balance.find((item:any)=>item?.abbreviation==x.abbreviation);
                          let findbal_index=  master_data[index]?.closing_balance.findIndex((item:any)=>item?.abbreviation==x.abbreviation);
                          if(item==undefined)
                           {
  
                            master_data[index].closing_balance.push({balance:'N/A'});
                           }
                           else{
                            master_data[index].closing_balance.splice(findbal_index, 1);
                            master_data[index].closing_balance.push(item);
  
  
                           }
                        
  
                      }
                      else{
                        master_data[index].closing_balance.push({balance:'N/A',leave_temp_head:{abbreviation:x.abbreviation}})
  
                      }  
                    });
                    let opening_balances=[];
                    
                    this.leaveHeadMaster.forEach((x:any)=>{
                      if(master_data[index]?.opening_balance.length>0)
                      {
                       
                          let item=  master_data[index]?.opening_balance.find((item:any)=>item?.abbreviation==x.abbreviation);
                          let findbal_index=  master_data[index]?.opening_balance.findIndex((item:any)=>item?.abbreviation==x.abbreviation);
                          if(item==undefined)
                           {
  
                            master_data[index].opening_balance.push({balance:'N/A'});
                           }
                           else{
                            master_data[index].opening_balance.splice(findbal_index, 1);
                            master_data[index].opening_balance.push(item);
  
  
                           }
                       
  
                      }
                      else{
                        master_data[index].opening_balance.push({balance:'N/A',leave_temp_head:{abbreviation:x.abbreviation}})
  
                      }  
                    })

                    this.leaveHeadMaster.forEach((x:any)=>{
                      if(master_data[index]?.carry_forward.length>0)
                      {
                       
                          let item=  master_data[index]?.carry_forward.find((item:any)=>item?.abbreviation==x.abbreviation);
                          let findbal_index=  master_data[index]?.carry_forward.findIndex((item:any)=>item?.abbreviation==x.abbreviation);
                          if(item==undefined)
                           {
  
                            master_data[index].carry_forward.push({balance:'N/A'});
                           }
                           else{
                            master_data[index].carry_forward.splice(findbal_index, 1);
                            master_data[index].carry_forward.push(item);
  
  
                           }
                       
  
                      }
                      else{
                        master_data[index].opening_balance.push({balance:'N/A',leave_temp_head:{abbreviation:x.abbreviation}})
  
                      }  
                    })

                  });
                  this.empReportData=master_data;
                  
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

  fetchLeaveHeads() {
    const _this = this;
    return new Promise((resolve, reject) => {
      _this.spinner.show();
      _this.companyuserService.fetchLeaveTemplateHeads({})
        .subscribe(res => {
          if (res.status == "success") {
            _this.leaveHeadMaster = [];
            for (const key in res.temp_head) {
              if (Object.prototype.hasOwnProperty.call(res.temp_head, key)) {
                const element = res.temp_head[key];
                _this.leaveHeadMaster.push({
                  "id": element._id,
                  "description": element.full_name + " (" + element.abbreviation + ")",
                  "full_name": element.full_name,
                  "head_type": element.head_type,
                  "abbreviation": element.abbreviation,
                });
              }
            }
          } else {
            _this.toastr.error(res.message);
          }

          _this.spinner.hide();
          resolve(true);
        }, (err) => {
          _this.toastr.error(Global.showServerErrorMessage(err));
          _this.spinner.hide();
          resolve(true);
        });
    });
  }

}
