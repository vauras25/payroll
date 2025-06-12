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
import swal from 'sweetalert2';
import { Router } from '@angular/router';
@Component({
  selector: 'app-shift-earning-report',
  templateUrl: './shift-earning-report.component.html',
  styleUrls: ['./shift-earning-report.component.css']
})
export class ShiftEarningReportComponent implements  OnInit {
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
    sheetTemplateMaster: any[] = [];
    departmentMaster: any[] = [];
    designationMaster: any[] = [];
    branchMaster: any[] = [];
    hodMaster: any[] = [];
    bankSheetMaster: any[] = [];
    bankMaster: any[] = [];
    empReportData: any[] = [];
    empReportGenerated: Boolean = false;
    empReportTempData: any = {
        'master_head_includes': [],
        'head_includes': [],
        'extra_earning_data': [],
    };
    shiftMasters:any=[];
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
   report_types=[
    {key:'earned_leave_report',value:'Earned Leave Report'},{key:'form_j_leave_reg',value:'Form J- Leave Register'},{key:'form_15_leave_reg',value:'Form 15- Leave Register'},
    {key:'form_e',value:'Form E'}
   ];
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
        company_module: 'shift_management',
        company_operation: 'shift_earning_report',
        company_sub_module:'shift_earning_report',
        company_sub_operation:['view'],
        company_strict:true
      })
    ) {
      setTimeout(() => {
        this.router.navigate(['company/errors/unauthorized-access'], {
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

  let currentYear = new Date().getFullYear();
  this.yearMaster = [];
  for (let index = 4; index >= 0; index--) {
  this.yearMaster.push({
      value: currentYear - index,
      description: currentYear - index,
  });
}
  }

  ngOnInit(): void {
  this.fetchshiftHeads();  
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
  fetchshiftHeads() {
    const _this = this;
    return new Promise((resolve, reject) => {
      _this.spinner.show();
      _this.companyuserService.getActiveShift()
        .subscribe(res => {
          if (res.status == "success") {
            this.shiftMasters=(res.shift);
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
    this.reportFilter=options;
    let wage_month_from:any=options?.wage_month_from+1;
    let wage_month_to:any=options?.wage_month_to+1;

    this.reportFilter.wage_from_date=options.wage_year_from+'-'+(wage_month_from.toString().padStart(2, '0')
    )+'-01';
    this.reportFilter.wage_to_date=options.wage_year_to+'-'+(wage_month_to.toString().padStart(2, '0'))+'-01';

    this.tableFilterOptions =Object.assign(options, this.tableFilterOptions);
    this.getFiltered();
  
  }
  getFiltered(page:any=null,searchkey:any='')
  {
    
    return new Promise((resolve, reject) => {
          if (page != null) {
              this.paginationOptions.page = page;
          }
          //this.tableOperationForm.patchValue({leave_report_tpl:{key:'earned_leave_report'}});

          let payload: any = this.tableFilterOptions;
          payload.pageno = this.paginationOptions.page;
          payload.searchkey = searchkey;
          payload.perpage = this.paginationOptions.limit;
          this.spinner.show();
          this.companyuserService.getshiftEarning(payload).subscribe(res => {
              if (res.status == 'success') {
                  this.empReportData = [];
                  let master_data:any = res?.employees?.docs ?? [];
                  master_data.forEach((elem:any,i:any)=>{
                  elem.checked = this.isRowChecked(elem._id);

                  let total_rate:any=0;  
                  this.shiftMasters.forEach((element:any)=>{
                  let find_index:any= master_data[i]?.shift_rate.findIndex((x:any) => x.shift_id == element._id);  
                  let push_elem:any={};
                  if(find_index!=-1)
                  {
                    push_elem={shift_id:elem?.shift_rate[find_index]?.shift_id,rate:elem?.shift_rate[find_index]?.rate,shift_data:elem?.shift_rate[find_index]?.shift_data};
                    master_data[i]?.shift_rate.push(push_elem);
                    master_data[i]?.shift_rate.splice(find_index,1);
                    total_rate+=parseFloat(elem?.shift_rate[find_index]?.rate);
                  }
                  else{
                    push_elem={shift_id:element?._id,rate:0,
                    shift_data:{shift_name:element?.shift_name,shift_allowance:element?.shift_allowance,overtime:element?.overtime}};
                    master_data[i]?.shift_rate.push(push_elem);
                    total_rate+=0;


                  }
                  });    
                  master_data[i].total_rate=total_rate;
                  })
                  this.empReportData=master_data
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

clearAll()
{
  (this.leaveencashForm.controls['leave_balance'] as FormArray).clear();

}






resetCheckedRows() {
  this.rowCheckedAll = false;
  this.checkedRowIds = [];
  this.uncheckedRowIds = [];

  $('.employee-table').find('#select-all').prop('checked', false);

  //this.fetchEmployees();
}




// generateForme()
// {
//   this.spinner.show();
//   let playload:any=this.tableFilterOptions;
//   playload.unchecked_row_ids=this.uncheckedRowIds;
//   playload.row_checked_all=this.rowCheckedAll.toString();
//   playload.checked_row_ids=this.checkedRowIds;
//   this.companyuserService
//   .getformePdf(playload)
//   .subscribe(
    
//     (res) => {
//       this.spinner.hide();
//       if (res.status == 'success') {
//       window.open(res.url);  
//       } else if (res.status == 'val_err') {
//         this.toastr.error(res.message);
//       } else {
//         this.toastr.error(res.message);
//       }
//     },
//     (err) => {
//       this.toastr.error(Global.showServerErrorMessage(err));
//       this.spinner.hide();
//     }
//   );
// }

async generateForme() {
  try {
    this.spinner.show();
    let payload:any=this.tableFilterOptions;
    payload.unchecked_row_ids=this.uncheckedRowIds;
    payload.row_checked_all=this.rowCheckedAll.toString();
    payload.checked_row_ids=this.checkedRowIds;
    await this.companyuserService.downloadFile('earning-certificate-export-pdf', 'Shift-Earning-Report', payload)
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

  this.getFiltered();
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
exportData() {
  // return new Promise((resolve, reject) => {
    
    //this.tableOperationForm.patchValue({leave_report_tpl:{key:'earned_leave_report'}});

    let payload: any = this.tableFilterOptions;
    payload.pageno = this.paginationOptions.page;
    payload.perpage = this.tableFilterOptions.length;
    payload.unchecked_row_ids = this.uncheckedRowIds;
    payload.checked_row_ids = this.checkedRowIds;
    payload.row_checked_all = this.rowCheckedAll.toString();

    this.spinner.show();
    this.companyuserService.downloadFile('shift-earning-report-export','shift-earning-report',payload);
    this.spinner.hide()
    // .subscribe(res => {
    //     if (res.status == 'success') {
    //     location.href=   res?.url
         
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

// })  
}





}
