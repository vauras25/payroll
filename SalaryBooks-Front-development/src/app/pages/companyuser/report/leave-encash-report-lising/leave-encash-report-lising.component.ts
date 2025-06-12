import { DatePipe } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormArray, FormGroup, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { CompanyuserService } from 'src/app/services/companyuser.service';
import * as Global from 'src/app/globals';
import PaginationOptions from 'src/app/models/PaginationOptions';
import TableFiilterOptions from 'src/app/models/TableFiilterOptions';
import { _salarySheetTempMaster } from '../_salarySheetTempMaster';
import swal from 'sweetalert2';
import { Router } from '@angular/router';

@Component({
  selector: 'app-leave-encash-report-lising',
  templateUrl: './leave-encash-report-lising.component.html',
  styleUrls: ['./leave-encash-report-lising.component.css'],
  encapsulation: ViewEncapsulation.None,


})
export class LeaveEncashReportLisingComponent implements OnInit {
  leaveHeadMaster: any=[];
  @ViewChild('salarysheetreporttable', { static: false }) el!: ElementRef;
    leaveencashForm: UntypedFormGroup;
    filterForm: UntypedFormGroup;
    templateForm: UntypedFormGroup;
    generateReportForm: UntypedFormGroup;
    exportReportForm: UntypedFormGroup;
    tableOperationForm: FormGroup;
    monthMaster: any[] = Global.monthMaster;
    yearMaster: any[] = [];
    sheetTemplate: any[] = _salarySheetTempMaster;
    _tempSheetTemplate: any[] = this.sheetTemplate;
    sheetTemplateMaster: any[] = [];
    departmentMaster: any[] = [];
    designationMaster: any[] = [];
    branchMaster: any[] = [];
    hodMaster: any[] = [];
    bankSheetMaster: any[] = [];
    bankMaster: any[] = [];
    empReportData: any[] = [];
    empBankData:any=[];
    empReportGenerated: Boolean = false;
    empReportTempData: any = {
        'master_head_includes': [],
        'head_includes': [],
        'extra_earning_data': [],
    };

    rowCheckedAll: Boolean = false;
    checkedRowIds: any[] = [];
    uncheckedRowIds: any[] = [];
    sheetTemplateForm: FormGroup;
    Global = Global;
    paginationOptions: PaginationOptions = Global.resetPaginationOption();
    tableFilterOptions: TableFiilterOptions = Global.resetTableFilterOptions();
    holdedSalarypaginationOptions: PaginationOptions = Global.resetPaginationOption();
    isViewSalaryReport: boolean = false;
    reportFilter:any='';
    is_payout_process:any=false;
    empProcessData:any=[];
    display_report:boolean = true;
    hide_all:any=false;
   individual_report:any='';
   selected_id:any;
   report_request:any;
   bankFilter:any={};
   report_types=[
    {key:'earned_leave_report',value:'Earned Leave Report'},{key:'form_j_leave_reg',value:'Form J- Leave Register'},{key:'form_15_leave_reg',value:'Form 15- Leave Register'},
    {key:'form_e',value:'Form E'}
   ];
   is_encash:any=true;
   show_bank_console:any=false;
   instruction_type:any='';
  constructor(
    public formBuilder: UntypedFormBuilder,
    private toastr: ToastrService,
    private companyuserService: CompanyuserService,
    private spinner: NgxSpinnerService,
    private datePipe: DatePipe  ,
    private titleService: Title,
    private router: Router
  ) { 

      if (
        !Global.checkCompanyModulePermission({
          company_module: 'leave',
          company_sub_module: 'leave_encashment',
          company_sub_operation: ['view'],
          company_strict: true,
        })
      ) {
        const _this = this;
        setTimeout(function () {
          _this.router.navigate(['company/errors/unauthorized-access'], {
            skipLocationChange: true,
          });
        }, 500);
        return;
      }

    this.tableOperationForm = formBuilder.group({
      payout_process: [null],
      payout_bankid: [null],
      report_template: [null],
      leave_report_tpl: [],
      wage_month: [null],
      wage_year: [null],


    });
    this.sheetTemplateForm = formBuilder.group({});

    // this.tableOperationForm
    //   .get('payout_process')
    //   ?.valueChanges.subscribe(async (payout_process) => {
    //     this.tableOperationForm.get('payout_bankid')?.reset();
    //     this.tableOperationForm.get('payout_bankid')?.markAsUntouched();

    //     this.tableOperationForm.get('report_template')?.reset();
    //     this.tableOperationForm.get('report_template')?.markAsUntouched();

    //     if (payout_process == true) {
    //       await this.fetchBanks();
    //       await this.getFiltered();

    //       this.tableOperationForm
    //         .get('payout_bankid')
    //         ?.setValidators([Validators.required]);
    //       this.tableOperationForm.get('report_template')?.clearValidators();
    //     } else {
    //       await this.fetchSettingsTemplate();
    //       this.tableOperationForm.get('payout_bankid')?.clearValidators();
    //       this.tableOperationForm
    //         .get('report_template')
    //         ?.setValidators([Validators.required]);
    //     }

    //     this.tableOperationForm.get('payout_bankid')?.updateValueAndValidity();
    //     this.tableOperationForm
    //       .get('report_template')
    //       ?.updateValueAndValidity();

    //     this.resetCheckedRows();
    //   });
    this.leaveencashForm = formBuilder.group({
      leave_balance:this.formBuilder.array([]),

  });
  let currentYear = new Date().getFullYear();
  this.yearMaster = [];
  for (let index = 4; index >= 0; index--) {
  this.yearMaster.push({
      value: currentYear - index,
      description: currentYear - index,
  });
}
  }
  getbankData(page:any=null)
  {
    return new Promise((resolve, reject) => {
      if (page != null) {
          this.paginationOptions.page = page;
      }
     
      let payload: any = this.tableFilterOptions;
      payload.pageno = this.paginationOptions.page;
      payload.perpage = this.tableFilterOptions.length;
      payload.wage_month_from=this.tableOperationForm.value.wage_month?.index;
      payload.wage_year_from=this.tableOperationForm.value.wage_year?.value;
      payload.wage_month_to=this.tableOperationForm.value.wage_month?.index;
      payload.wage_year_to=this.tableOperationForm.value.wage_year?.value;
      this.spinner.show();
      this.companyuserService.leaveencashBank(payload).subscribe(res => {
          if (res.status == 'success') {
              this.empBankData = [];
              let master_data = res?.employees?.docs ?? [];
              master_data.forEach((element: any,index:any) => {
             
              element.checked = this.isRowChecked(element._id);
            
             

              });
              this.empBankData=master_data;

             

              this.paginationOptions = {
                  hasNextPage: res.employees.hasNextPage,
                  hasPrevPage: res.employees.hasPrevPage,
                  limit: res.employees.limit,
                  nextPage: res.employees.nextPage,
                  page: res.employees.page,
                  pagingCounter: res.employees.pagingCounter,
                  prevPage: res.employees.prevPage,
                  totalDocs: res.employees.totalDocs,
                  totalPages: res.employees.totalPages,
              };
          } else {
              this.empReportData = [];
              this.paginationOptions = Global.resetPaginationOption();
          }

          this.spinner.hide();
          this.restoreReportTempData()
          Global.loadCustomScripts('customJsScript');
          resolve(true);
      }, (err) => {
          this.empReportData = [];
          this.paginationOptions = Global.resetPaginationOption();
          this.spinner.hide();
          this.restoreReportTempData()
          Global.loadCustomScripts('customJsScript');
          resolve(true);
      });

})
  }

  ngOnInit(): void {
  this.fetchLeaveHeads();  
  let currentYear = new Date().getFullYear();
  let currentMonth = new Date().getMonth();

  setTimeout(() => {
    this.tableOperationForm.patchValue({
      wage_month: this.monthMaster.find((obj: any) => {
        return obj.index == currentMonth;
      }),
      wage_year: this.yearMaster.find((obj: any) => {
        return obj.value == currentYear;
      }),
    });
  },1500);

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
  setfilter(options:any)
  {
    
    this.tableFilterOptions = Global.resetTableFilterOptions();

    this.reportFilter={wage_month_from:options?.wage_month_from,
      wage_year_from:options?.wage_year_from,wage_month_to:options?.wage_month_to,wage_year_to:options?.wage_year_to,
      bank_name:this.tableOperationForm?.value?.payout_proces,pageno:1,perpage:this.tableFilterOptions?.length};
    this.tableFilterOptions =Object.assign(options, this.tableFilterOptions);
    this.getFiltered();
  
  }
  getFiltered(page:any=null)
  {
    
    return new Promise((resolve, reject) => {
          if (page != null) {
              this.paginationOptions.page = page;
          }
          
          //this.tableOperationForm.patchValue({leave_report_tpl:{key:'earned_leave_report'}});

          let payload: any = this.tableFilterOptions;
          payload.pageno = this.paginationOptions.page;
          payload.searchkey = this.tableFilterOptions.searchkey || '';
          payload.perpage = this.paginationOptions.limit;
          if(this.tableOperationForm.value?.payout_process)
          {
            payload.wage_month_from=this.tableOperationForm.value.wage_month?.index;
            payload.wage_year_from=this.tableOperationForm.value.wage_year?.value;
            delete payload?.wage_month_to;
            delete payload?.wage_year_to;
           

          }
          this.spinner.show();
          this.companyuserService.getLeaveEmp(payload).subscribe(res => {
              if (res.status == 'success') {
                  this.empReportData = [];
                  let master_data = res?.employees?.docs ?? [];

                 master_data.forEach((element: any,index:any) => {
                  let total_available_leave=0;
                  let total_encashable_bal =0;
                  element.checked = this.isRowChecked(element._id);

                  this.leaveHeadMaster.forEach((x:any)=>{
                  let item=  element?.employee_details?.leave_balance_counter.find((item:any)=>item.abbreviation==x.abbreviation);
                  let findbal_index=element?.employee_details?.leave_balance_counter.findIndex((item:any)=>item.abbreviation==x.abbreviation);
                  if(item==undefined)
                   {
                  
                    master_data[index].employee_details?.leave_balance_counter.push(
                      {abbreviation:x.abbreviation,encash:'N/A',leave_temp_head_id:x.id,leave_type_name:x.full_name,available:"N/A"}
                      
                      );
                   }
                   else{
                    master_data[index].employee_details?.leave_balance_counter.splice(findbal_index, 1);
                    master_data[index].employee_details?.leave_balance_counter.push(item);
                    total_available_leave+=parseFloat(item?.available);
                    total_encashable_bal+=parseFloat(item?.encash);

                   }
                  })  
                  master_data[index].total_available_leave=total_available_leave;
                  master_data[index].total_encashable_bal=total_encashable_bal;

                  });
                  this.empReportData=master_data;
                  // master_data.forEach((element: any) => {
                  //     element.master_report.checked = this.isRowChecked(element._id);

                  //     this.empReportData.push(element.master_report);
                  // });

                  this.paginationOptions = {
                      hasNextPage: res.employees.hasNextPage,
                      hasPrevPage: res.employees.hasPrevPage,
                      limit: res.employees.limit,
                      nextPage: res.employees.nextPage,
                      page: res.employees.page,
                      pagingCounter: res.employees.pagingCounter,
                      prevPage: res.employees.prevPage,
                      totalDocs: res.employees.totalDocs,
                      totalPages: res.employees.totalPages,
                  };
              } else {
                  this.empReportData = [];
                  this.paginationOptions = Global.resetPaginationOption();
              }

              this.spinner.hide();
              this.restoreReportTempData()
              Global.loadCustomScripts('customJsScript');
              resolve(true);
          }, (err) => {
              this.empReportData = [];
              this.paginationOptions = Global.resetPaginationOption();
              this.spinner.hide();
              this.restoreReportTempData()
              Global.loadCustomScripts('customJsScript');
              resolve(true);
          });
    
  })
  }
  

employeeListFilter: any = {};
getReportPayload() {
    let payload: any = {
        'wage_month': this.employeeListFilter.month?.index ?? "",
        'wage_year': this.employeeListFilter.year?.value ?? "",
        'row_checked_all': this.rowCheckedAll,
        'checked_row_ids': JSON.stringify(this.checkedRowIds),
        'unchecked_row_ids': JSON.stringify(this.uncheckedRowIds),
        'department_id': this.employeeListFilter?.department_id ?? null,
        'designation_id': this.employeeListFilter?.designation_id ?? null,
        'branch_id': this.employeeListFilter?.branch_id ?? null,
    }

    return payload;
}
restoreReportTempData() {
  let master_head_includes: any[] = []
  let head_includes: any[] = []
  let extra_earning_data: any[] = []

  if (this.empReportData.length > 0) {
      // Generating Report Available Heads
      this.empReportData.forEach(reportData => {
          (reportData.heads_rate ?? []).forEach((head: any) => {
              let exist = master_head_includes.find((obj: any) => {
                  return obj.head_id == head.head_id
              }) ?? null;

              if (!exist) {
                  master_head_includes.push({
                      amount: head.amount,
                      head_id: head.head_id,
                      head_rate: head.head_rate,
                      head_rate_type: head.head_rate_type,
                      head_title: head.head_title,
                      head_abbreviation: head.head_abbreviation,
                  });
              }
          });
      });

      // Generating Report Available Heads
      this.empReportData.forEach(reportData => {
          (reportData.heads ?? []).forEach((head: any) => {
              let exist = head_includes.find((obj: any) => {
                  return obj.head_id == head.head_id
              }) ?? null;

              if (!exist) {
                  head_includes.push({
                      head_id: head.head_id,
                      head_rate: head.head_rate,
                      head_rate_type: head.head_rate_type,
                      head_title: head.head_title,
                      head_abbreviation: head.head_abbreviation,
                  });
              }
          });
      });

      // Generate Extra Earning Heads
      this.empReportData.forEach(reportData => {
          (reportData.extra_earning_data ?? []).forEach((extraEarning: any) => {
              let exist = extra_earning_data.find((obj: any) => {
                  return obj.earning_abbreviation == extraEarning.earning_abbreviation
              }) ?? null;

              if (!exist) {
                  extra_earning_data.push({
                      earning_title: extraEarning.earning_title,
                      earning_abbreviation: extraEarning.earning_abbreviation,
                  });
              }
          });
      });
  }

  // console.log('master_head_includes : ', master_head_includes)
  // console.log('head_includes : ', head_includes)
  // console.log('extra_earning_data : ', extra_earning_data)

  this.empReportTempData = {
      master_head_includes: master_head_includes,
      head_includes: head_includes,
      extra_earning_data: extra_earning_data
  }

  // console.log('empReportTempData : ', this.empReportTempData);
}

initTemplateRows(data: any = {}) {
  return this.formBuilder.group({
    employee_id:[data.employee_id],
    emp_id:[data.emp_id],
    leave_temp_head_id: [data.leave_temp_head_id, Validators.compose([])],
    _id: [data._id , Validators.compose([])],
    leave_type_name: [data.leave_type_name , Validators.compose([])],
    abbreviation: [data.abbreviation , Validators.compose([])],
    available: [data.available, Validators.compose([Validators.min(0)])],
    available_hist: [data.available,Validators.compose([Validators.min(0)])],
    consumed: [data.consumed, Validators.compose([])],
    tenure: [data.tenure, Validators.compose([])],
    quota: [data.quota, Validators.compose([])],
    carryover: [data.carryover, Validators.compose([])],
    encash: [0, Validators.compose([Validators.required])],
    extinguish: [0, Validators.compose([Validators.required])],
    total_balance:[data.total_balance]


  });
}


getTemplateRows(type: any) {
  return (this.leaveencashForm.get(type) as FormArray).controls;
}
checkAll(ev:any)
{
  if(ev.target.checked)
  {
    this.empReportData.forEach((element:any) => {
      this.checkedRowIds.push(element.emp_id); 
    });
   
  }
  else{
    this.checkedRowIds.length=0;
  }
}
openModal(ev:any)
{
  (this.leaveencashForm.controls['leave_balance'] as FormArray).clear();
  let control = <FormArray>this.leaveencashForm.get('leave_balance');
  let reportFilter:any={};
  reportFilter.unchecked_row_ids=this.uncheckedRowIds;
  reportFilter.row_checked_all=this.rowCheckedAll.toString();
  reportFilter.checked_row_ids=this.checkedRowIds;
  let tableFilterOptions:any=this.tableFilterOptions;
   reportFilter={unchecked_row_ids:this.uncheckedRowIds,
    row_checked_all:this.rowCheckedAll.toString(),checked_row_ids:this.checkedRowIds,
    wage_month_from:tableFilterOptions.wage_month_from,wage_year_from:tableFilterOptions.wage_year_from,
    wage_month_to:tableFilterOptions?.wage_month_to,wage_year_to:tableFilterOptions.wage_year_to};         
  this.companyuserService
  .getprocessEmployee(reportFilter)
  .subscribe(
    (res) => {
      this.spinner.hide();
      if (res.status == 'success') {
        //this.toastr.success(res.message);
              let master_data = res?.employees ?? [];
               master_data.forEach((element: any,index:any) => {
              let total_available_leave=0;
              let total_encashable_bal =0;

              this.leaveHeadMaster.forEach((x:any)=>{
              let item=  element?.employee_details[0]?.leave_balance_counter.find((item:any)=>item.abbreviation==x.abbreviation);
              let findbal_index=element?.employee_details[0]?.leave_balance_counter.findIndex((item:any)=>item.abbreviation==x.abbreviation);
              if(item==undefined)
               {
              
                master_data[index].employee_details[0]?.leave_balance_counter.push(
                  {abbreviation:x.abbreviation,encash:'N/A',leave_temp_head_id:x.id,leave_type_name:x.full_name,available:"N/A"}
                  
                  );
               }
               else{
                master_data[index].employee_details[0]?.leave_balance_counter.splice(findbal_index, 1);
                master_data[index].employee_details[0]?.leave_balance_counter.push(item);
                total_available_leave+=parseFloat(item?.available);
                total_encashable_bal+=parseFloat(item?.encash);

               }
              })  
              master_data[index].total_available_leave=total_available_leave;
              master_data[index].total_encashable_bal=total_encashable_bal;

              });
              let rows:any=master_data;

              rows.forEach((element:any) => {
                element.employee_details?.leave_balance_counter.forEach((subElement:any) => {
                  if(subElement?._id)
                  {
                  if(element._id)
                  {  
                  let data:any={
                    emp_id:element?.emp_id,
                    employee_id:element._id          ,
                    leave_temp_head_id:subElement.leave_temp_head_id ,
                    _id:subElement?._id || null ,
                    leave_type_name: subElement?.leave_type_name,
                    abbreviation: subElement.abbreviation,
                    available: subElement?.available || null ,
                    consumed:subElement?.consumed || null,
                    tenure: subElement?.tenure || null,
                    quota: subElement?.quota || null,
                    carryover: subElement?.carryover || null,
                    total_balance:subElement?.total_balance || null
                  }  
                  control.push(this.initTemplateRows(data));
                 }
                }
                });
            
              });
        //this.empProcessData=
      } else if (res.status == 'val_err') {
        this.toastr.error(res.message);
      } else {
        this.toastr.error(res.message);
      }
    },
    (err) => {
      this.toastr.error(Global.showServerErrorMessage(err));
      this.spinner.hide();
    }
  );
  
   
  $("#openModal").click();
 
}

setencashMent(emp_id:any)
{
  (this.leaveencashForm.controls['leave_balance'] as FormArray).clear();
  let control = <FormArray>this.leaveencashForm.get('leave_balance');
  let element=this.empReportData.find(x=>x._id==emp_id);
      element.employee_details?.leave_balance_counter.forEach((subElement:any) => {
        if(subElement?._id)
        {
          let data:any={
            emp_id:element?.emp_id,
            employee_id:element._id          ,
            leave_temp_head_id:subElement.leave_temp_head_id ,
            _id:subElement?._id || null ,
            leave_type_name: subElement?.leave_type_name,
            abbreviation: subElement.abbreviation,
            available: subElement?.available || null ,
            consumed:subElement?.consumed || null,
            tenure: subElement?.tenure || null,
            quota: subElement?.quota || null,
            carryover: subElement?.carryover || null,
            total_balance:subElement?.total_balance || null
          }  
          control.push(this.initTemplateRows(data));
    }
    });
    $("#openModal").click();
  
}
clearAll()
{
  (this.leaveencashForm.controls['leave_balance'] as FormArray).clear();

}
submitData(event:any)
{
  this.leaveencashForm.markAllAsTouched();
  Global.scrollToQuery("p.error-element");

  if (this.leaveencashForm.valid) {
    this.spinner.show();
   event.target.classList.add('btn-loading');
   this.leaveencashForm.value.leave_balance.forEach((val:any,key:any) => {
    this.leaveencashForm.value.leave_balance[key].available=val.available_hist;
   });
  this.companyuserService.saveEncash(this.leaveencashForm.value).subscribe(res => {
    this.spinner.hide();
    if (res.status == 'success') {
        this.toastr.success(res.message);
        $('#settingsTemplateModal')?.find('[data-dismiss="modal"]')?.click();
        this.getFiltered();
        //this.generateMasterSheet();

    } else if (res.status == 'val_err') {
        this.toastr.error(Global.showValidationMessage(res.val_msg));
    } else {
        this.toastr.error(res.message);
    }

    event.target.classList.remove('btn-loading');
}, (err) => {
    this.spinner.hide();
    event.target.classList.remove('btn-loading');
    this.toastr.error(Global.showServerErrorMessage(err));
});
  }
}
updateBalance(ev:any,i:any)
{
  
    let encash=this?.leaveencashForm?.value?.leave_balance[i]?.encash ?? 0;
    let extinguish=this?.leaveencashForm?.value?.leave_balance[i]?.extinguish ?? 0;
    let available=this?.leaveencashForm?.value?.leave_balance[i]?.available ?? 0 
    available=available-(parseInt(extinguish)+parseInt(encash));
    this.getTemplateRows('leave_balance')[i].patchValue({available_hist:available})
  
}

fetchBanks({ loading = <boolean>true } = {}) {
  return new Promise((resolve, reject) => {
    if (loading == true) this.spinner.show();
    this.companyuserService
      .fetchBankSheets({
        pageno: 1,
      })
      .subscribe(
        (res) => {
          if (loading == true) this.spinner.hide();
          if (res.status == 'success') {
            this.bankMaster = res?.templates?.docs;
            resolve(true);
          } else {
            this.toastr.error(res?.message);
            resolve(false);
          }
        },
        (err) => {
          if (loading == true) this.spinner.hide();
          this.toastr.error(Global.showServerErrorMessage(err));
          resolve(false);
        }
      );
  });
}

fetchSettingsTemplate({ loading = <boolean>true } = {}) {
  return new Promise((resolve, reject) => {
    if (loading == true) this.spinner.show();

    this.companyuserService
      .fetchEmployeeSheetTemplates({
        pageno: 1,
        temp_module_for: 'salary_sheet',
      })
      .subscribe(
        (res) => {
          if (loading == true) this.spinner.hide();

          if (res.status == 'success') {
            this.sheetTemplateMaster = res?.earning_sheet_temp?.docs ?? [];
            resolve(true);
          } else if (res.status == 'val_err') {
            this.sheetTemplateMaster = [];
            this.toastr.error(Global.showValidationMessage(res.val_msg));
            resolve(false);
          } else {
            this.sheetTemplateMaster = [];
            this.toastr.error(res.message);
            resolve(false);
          }
        },
        (err) => {
          if (loading == true) this.spinner.hide();
          this.toastr.error(Global.showServerErrorMessage(err));
          this.sheetTemplateMaster = [];
          resolve(false);
        }
      );
  });
}

resetCheckedRows() {
  this.rowCheckedAll = false;
  this.checkedRowIds = [];
  this.uncheckedRowIds = [];

  $('.employee-table').find('#select-all').prop('checked', false);

  //this.fetchEmployees();
}

generateBankInstruction(event: any) {

  this.reportFilter.bank_name="";
  if (
    this.anyRowsChecked() &&
    this.tableOperationForm.get('payout_bankid')?.valid
  ) {
    this.getprocessData();
  }
}
getprocessData() {
  
  this.spinner.show();
  let payload:any={};
  payload.unchecked_row_ids=this.uncheckedRowIds;
  payload.row_checked_all=this.rowCheckedAll.toString();
  payload.checked_row_ids=this.checkedRowIds;
  payload.wage_month=this.tableOperationForm.value.wage_month?.index;
  payload.wage_year=this.tableOperationForm.value.wage_year?.value;
  payload.instruction_type=this.instruction_type;
  payload.payment_for='leave';
  payload.bank_temp_id=this.tableOperationForm?.value?.payout_bankid?._id;

    this.companyuserService
      .leavebankInstruction(payload)
      .subscribe(
        (res) => {
          this.spinner.hide();
          if (res.status == 'success') {
            this.checkedRowIds=[];
            this.uncheckedRowIds=[];
            this.rowCheckedAll=false;  
          this.getbankData(); 

              
          } else if (res.status == 'val_err') {
            this.toastr.error(res.message);
          } else {
            this.toastr.error(res.message);
          }
        },
        (err) => {
          this.toastr.error(Global.showServerErrorMessage(err));
          this.spinner.hide();
        }
      );


}
async shuffleFields(ev:any)
{
  this.checkedRowIds=[];
  this.uncheckedRowIds=[];
  this.rowCheckedAll=false;
  if(ev.target.value=='N')
  {
    this.hide_all=false;
    this.display_report=false;
    this.tableOperationForm.get('payout_bankid')?.reset();
    this.tableOperationForm.get('payout_bankid')?.markAsUntouched();
    this.tableOperationForm.get('report_template')?.reset();
    this.tableOperationForm.get('report_template')?.markAsUntouched();
    this.tableOperationForm.patchValue({payout_process:true});
    await this.fetchBanks();
    this.tableOperationForm.get('payout_bankid')?.setValidators([Validators.required]);
    this.tableOperationForm.get('report_template')?.clearValidators();
    this.tableOperationForm.get('payout_bankid')?.updateValueAndValidity();
    this.tableOperationForm.get('report_template')?.updateValueAndValidity();
    this.resetCheckedRows();
    this.tableOperationForm.patchValue({leave_report_tpl:null});
    this.show_bank_console=true;
    let payload: any = this.tableFilterOptions;
    payload.wage_month_from=this.tableOperationForm.value.wage_month?.index;
    payload.wage_year_from=this.tableOperationForm.value.wage_year?.value;
   
    payload.wage_month_to=this.tableOperationForm.value.wage_month?.index;
    payload.wage_year_to=this.tableOperationForm.value.wage_year?.value;
   
    this.bankFilter=payload;
    this.getbankData();

  }
  else{
    this.tableOperationForm.patchValue({payout_process:false});
    this.display_report=true;
    this.individual_report="";
    this.is_payout_process=false;
    this.hide_all=false;
    this.tableOperationForm.patchValue({leave_report_tpl:null});
    this.show_bank_console=false;
    this.getFiltered();


  }

}
generateReport()
{
 
  // if(this.tableOperationForm?.value?.leave_report_tpl?.key=='form_e')
  // {
  //   this.generateForme();
  // }
  // else{
    
  // }
  this.hide_all=true;
  this.individual_report='';
  let playload:any=this.tableFilterOptions;
  playload.unchecked_row_ids=this.uncheckedRowIds;
  playload.row_checked_all=this.rowCheckedAll.toString();
  playload.checked_row_ids=this.checkedRowIds;
  this.report_request=playload;
  this.individual_report=this.tableOperationForm?.value?.leave_report_tpl?.key;
  this.tableOperationForm.patchValue({leave_report_tpl:null});
}


async generateForme() {
  try {
    this.spinner.show();
    let payload:any=this.tableFilterOptions;
    payload.unchecked_row_ids=this.uncheckedRowIds;
    payload.row_checked_all=this.rowCheckedAll.toString();
    payload.checked_row_ids=this.checkedRowIds;
    await this.companyuserService.downloadFile('earning-certificate-export-pdf', 'Leave-Encashment', payload)
  //   this.companyuserService
  // .getformePdf(payload)
  // .subscribe(
    
  //   (res) => {
  //     this.spinner.hide();
  //     if (res.status == 'success') {
  //     //window.open(res.url);  
  //     } else if (res.status == 'val_err') {
  //       this.toastr.error(res.message);
  //     } else {
  //       this.toastr.error(res.message);
  //     }
  //   },
  //   (err) => {
  //     this.toastr.error(Global.showServerErrorMessage(err));
  //     this.spinner.hide();
  //   }
  // );
  } catch (err:any) {
    this.spinner.hide()
    this.toastr.error(err.message)
  }
}


allRowsCheckboxChecked(event: any) {
  if (this.rowCheckedAll) {
    this.uncheckedRowIds.length = 0;
    this.rowCheckedAll = false;
  } else {
    this.checkedRowIds.length = 0;
    this.rowCheckedAll = true;
  }
  if(this.show_bank_console)
  {
    this.getbankData();

  }
  else{
    this.getFiltered();

  }
}

rowCheckBoxChecked(event: any, row: any) {
  let rowId: any = row._id;
  let checkbox: any = document.querySelectorAll(
    '[data-checkbox-id="' + rowId + '"]'
  );
    
  if (checkbox.length > 0) {
    if (checkbox[0].checked) {
      this.uncheckedRowIds.splice(this.uncheckedRowIds.indexOf(rowId), 1);
      if (!this.rowCheckedAll) {
        if (!this.checkedRowIds.includes(rowId)) {
          this.checkedRowIds.push(rowId);
        }
      }
    } else {
      this.checkedRowIds.splice(this.checkedRowIds.indexOf(rowId), 1);
      if (this.rowCheckedAll) {
        if (!this.uncheckedRowIds.includes(rowId)) {
          this.uncheckedRowIds.push(rowId);
        }
      }
    }
  }
}

anyRowsChecked(): boolean {
  return (
    this.rowCheckedAll == true ||
    this.checkedRowIds.length > 0 ||
    this.uncheckedRowIds.length > 0
  );
}

private isRowChecked(rowId: any) {
  if (!this.rowCheckedAll)
    return this.checkedRowIds.indexOf(rowId) >= 0 ? true : false;
  else return this.uncheckedRowIds.indexOf(rowId) >= 0 ? false : true;
}

changeReport()
{
  this.individual_report="";
}
cancell()
{
  this.checkedRowIds=[];
  this.uncheckedRowIds=[];
  this.rowCheckedAll=false;
  this.getFiltered();
  this.hide_all=false;
  this.individual_report="";
  this.display_report=true;
  this.tableOperationForm.patchValue({leave_report_tpl:null});

}
exportExcel()
{
// console.log(this.individual_report);
  if(this.individual_report=='earned_leave_report')
  {
    this.exportEarnedLeaveReport();
  }
  if(this.individual_report=='form_j_leave_reg')
  {
    this.exportformJReport();
  }
  if(this.individual_report=='form_15_leave_reg')
  {
    this.exportform15Report();
  }
 
}

async exportEarnedLeaveReport() {
  this.spinner.show();
  let reportFilter:any=this.tableFilterOptions;
  reportFilter.unchecked_row_ids=this.uncheckedRowIds;
  reportFilter.row_checked_all=this.rowCheckedAll.toString();
  reportFilter.checked_row_ids=this.checkedRowIds;
  
  await this.companyuserService.downloadFile('employee-earned-leave-report-export','employee-earned-leave-report',reportFilter)

  this.spinner.hide();
      // .subscribe(
      //   (res) => {
      //     this.spinner.hide();
      //     if (res.status == 'success') {
      //     location.href=res?.url;  
              
      //     } else if (res.status == 'val_err') {
      //       this.toastr.error(res.message);
      //     } else {
      //       this.toastr.error(res.message);
      //     }
      //   },
      //   (err) => {
      //     this.toastr.error(Global.showServerErrorMessage(err));
      //   }
      // );


}
async exportformJReport() {
  this.spinner.show();
  let reportFilter:any=this.tableFilterOptions;
  reportFilter.unchecked_row_ids=this.uncheckedRowIds;
  reportFilter.row_checked_all=this.rowCheckedAll.toString();
  reportFilter.checked_row_ids=this.checkedRowIds;
  
  await this.companyuserService.downloadFile('get-register-leave-data-export','get-register-leave-data', reportFilter);
  this.spinner.hide();
      // .subscribe(
      //   (res) => {
      //     if (res.status == 'success') {
      //     location.href=res?.url;  
              
      //     } else if (res.status == 'val_err') {
      //       this.toastr.error(res.message);
      //     } else {
      //       this.toastr.error(res.message);
      //     }
      //   },
      //   (err) => {
      //     this.toastr.error(Global.showServerErrorMessage(err));
      //     this.spinner.hide();
      //   }
      // );


}
exportform15Report() {
  this.spinner.show();
  let reportFilter:any=this.tableFilterOptions;
  reportFilter.unchecked_row_ids=this.uncheckedRowIds;
  reportFilter.row_checked_all=this.rowCheckedAll.toString();
  reportFilter.checked_row_ids=this.checkedRowIds;
  
  this.companyuserService.downloadFile('register-per-calender-year-report-export','register-per-calender-year-report',reportFilter)
  this.spinner.hide();
      // .subscribe(
      //   (res) => {
      //     if (res.status == 'success') {
      //     location.href=res?.url;  
              
      //     } else if (res.status == 'val_err') {
      //       this.toastr.error(res.message);
      //     } else {
      //       this.toastr.error(res.message);
      //     }
      //   },
      //   (err) => {
      //     this.toastr.error(Global.showServerErrorMessage(err));
      //     this.spinner.hide();
      //   }
      // );
}
toggleEncash(ev:any)
{
  if(ev.target?.checked)
  {
    this.is_encash=true;
  }
  else{
    this.is_encash=false;

  }
}
checkPendingData()
{
  let data_length=this.empBankData.filter((x:any)=>x.employee_monthly_reports?.encash_payment_report?.bank_ins_referance_id=='').length;
  if(data_length>0)
  {
    return true;
  }
  else{
    return false;
  }
}
printDoc(elements:any) {
  // console.log(elements.target);

  window.print();
  
}

}
