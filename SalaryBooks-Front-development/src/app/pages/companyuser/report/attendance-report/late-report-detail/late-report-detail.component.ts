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
  selector: 'app-late-report-detail',
  templateUrl: './late-report-detail.component.html',
  styleUrls: ['./late-report-detail.component.css']
})
export class LateReportDetailComponent implements OnInit {
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
    let filter_optins={
      "wage_month_from": this.employeeListFilter?.month?.index.toString(),
      "wage_year_from": this.employeeListFilter?.year?.value.toString(),
      "wage_month_to":this.employeeListFilter?.month?.index.toString(),
      "wage_year_to":this.employeeListFilter?.year?.value.toString(),
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
      "report_type": "monthly_late_report"

  }
    this.tableFilterOptions = Global.resetTableFilterOptions();
    // this.tableFilterOptions =Object.assign(filter_optins, this.tableFilterOptions);
    this.tableFilterOptions = {
      ...this.tableFilterOptions,
      ...filter_optins
    };
    this.days=[];
    for (let i=1; i<=this.employeeListFilter?.month?.days;i++) {
    this.days.push(i);
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

                  let attendance=element.attendance;

                  this.days.forEach((x:any)=>{
                  let new_date=this.employeeListFilter?.year?.value+'-'+this.zeroPad(this.employeeListFilter?.month?.value, 2)+'-'+this.zeroPad(x, 2);
                  let item=  attendance.find((item:any)=>item.attendance_date==new_date);
                  let del_index=attendance.findIndex((item:any)=>item.attendance_date==new_date);
                  if(item==undefined)
                   {

                    master_data[index]?.attendance.push({attendance_stat:'N/A'});
                   }
                   else{
                    master_data[index].attendance?.splice(del_index, 1);
                    master_data[index].attendance.push(item);


                   }
                  })

                  });
                  this.empReportData=master_data;
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
                  // console.log(this.empReportData);
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
