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
import { Router } from '@angular/router';

@Component({
  selector: 'app-late-report-summary',
  templateUrl: './late-report-summary.component.html',
  styleUrls: ['./late-report-summary.component.css']
})
export class LateReportSummaryComponent implements OnInit {
  @Input() employeeListFilter: any = {};
  days:any=[];
  Global = Global;
  paginationOptions: PaginationOptions = Global.resetPaginationOption();
  tableFilterOptions: TableFiilterOptions = Global.resetTableFilterOptions();
  empReportData:any=[];
  zeroPad = (num:any, places:any) => String(num).padStart(places, '0')

  rowCheckedAll: Boolean = false;
  checkedRowIds: any[] = [];
  uncheckedRowIds: any[] = [];

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
    let wage_month_from=this.employeeListFilter.wage_month_from;
    let wage_year_from=this.employeeListFilter.wage_year_from;

    let wage_month_to=this.employeeListFilter.wage_month_to;
    let wage_year_to=this.employeeListFilter.wage_year_to;

    let start_date=new Date(wage_year_from,wage_month_from,1);

    let monthMaster=Global.monthMaster;

    let no_of_days:any=Global.monthMaster.find(x=>x.index==wage_month_to);
    let last_date=no_of_days.days;
    let end_date=new Date(wage_year_to,wage_month_to,last_date);
    this.days=Global.getDaysArray(start_date,end_date);
    let filter_optins={
      "wage_month_from": this.employeeListFilter?.wage_month_from.toString(),
      "wage_year_from": this.employeeListFilter?.wage_year_from.toString(),
      "wage_month_to":this.employeeListFilter?.wage_month_to.toString(),
      "wage_year_to":this.employeeListFilter?.wage_year_to.toString(),
      "attendance_type": "time",
      "branch_id": this.employeeListFilter?.branch_id,
      "searchkey": this.employeeListFilter?.searchkey,
      "designation_id": this.employeeListFilter?.designation_id,
      "department_id": this.employeeListFilter?.department_id,
      "hod_id": this.employeeListFilter?.hod_id,
      "client_id": this.employeeListFilter?.client_id,
      "unchecked_row_ids":[],
      "checked_row_ids":[],
      "row_checked_all":"false",
      "report_type": "late_summary_report"

  }
    this.tableFilterOptions = Global.resetTableFilterOptions();
    // this.tableFilterOptions =Object.assign(filter_optins, this.tableFilterOptions);
    this.tableFilterOptions = {
      ...this.tableFilterOptions,
      ...filter_optins
    }
    this.getFiltered();

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
          payload.row_checked_all = this.rowCheckedAll,
          payload.checked_row_ids = JSON.stringify(this.checkedRowIds),
          payload.unchecked_row_ids = JSON.stringify(this.uncheckedRowIds),

          this.spinner.show();
          this.companyuserService.attendanceReport(payload).subscribe(res => {
              if (res.status == 'success') {
                  this.empReportData = [];
                  let master_data = res?.employees?.docs ?? [];

                 master_data.forEach((element: any,index:any) => {
                  element.checked = this.isRowChecked(element._id);


                  let attendance=element.attendance_summ;
                  let row_total_late=0;
                  this.days.forEach((x:any)=>{
                    let d=x;
                   let item=  attendance.find((newItem:any)=>(newItem.attendance_month==d.getMonth().toString() && newItem.attendance_year==d.getFullYear().toString()));

                   let del_index=attendance.findIndex((item:any)=>(item.attendance_month==d.getMonth().toString() && item.attendance_year==d.getFullYear().toString()));

                   let month_data=Global.monthMaster.find(x=>x.index==d.getMonth());
                  if(item==undefined)
                   {
                    master_data[index]?.attendance_summ.push({total_late_hour:'N/A',total_instances:'N/A'});
                   }
                   else{
                    master_data[index].attendance_summ?.splice(del_index, 1);
                    item.total_instances='N/A';
                    item.total_late_hour=item.total_late_hour?(item.total_late_hour/60) : 0;
                    row_total_late+=item.total_late_hour;
                    master_data[index].attendance_summ.push(item);
                   }
                  })
                  master_data[index].rowTotal=row_total_late;
                  });
                  this.empReportData=master_data;
                  //console.log(this.empReportData);
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
  async generateReportNew() {
    let filter_optins_report:any=this.tableFilterOptions;
    delete filter_optins_report.unchecked_row_ids;
    delete filter_optins_report.row_checked_all;
    delete filter_optins_report.checked_row_ids;

   if(this.anyRowsChecked())
   {
    let reportFilter:any={
      unchecked_row_ids:this.uncheckedRowIds,row_checked_all:this.rowCheckedAll.toString(),
      checked_row_ids:this.checkedRowIds,month:this.employeeListFilter?.month,year:this.employeeListFilter?.year
     
    }  
    reportFilter =Object.assign(reportFilter, filter_optins_report);
    this.companyuserService.setPrintDoc(reportFilter);
    this.router.navigate([
            `/company/attendance-management/attendance-report/print`,
          ]);



   }
    
    }

}
