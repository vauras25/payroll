import { DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import {
  UntypedFormGroup,
  UntypedFormBuilder,
  Validators,
} from '@angular/forms';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import PaginationOptions from 'src/app/models/PaginationOptions';
import TableFiilterOptions from 'src/app/models/TableFiilterOptions';
import { CompanyuserService } from 'src/app/services/companyuser.service';
import { _arrearReportTempMaster } from '../../report/_arrearReportTempMaster';
import * as Global from 'src/app/globals';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { FormDComponent } from '../../report/attendance-report/form-d/form-d.component';
import { HalfDayComponent } from '../../report/attendance-report/half-day/half-day.component';
import { LateReportDetailComponent } from '../../report/attendance-report/late-report-detail/late-report-detail.component';
import { LateReportSummaryComponent } from '../../report/attendance-report/late-report-summary/late-report-summary.component';
import { MonthWiseSummaryComponent } from '../../report/attendance-report/month-wise-summary/month-wise-summary.component';
import { SummaryReportComponent } from '../../report/attendance-report/summary-report/summary-report.component';
import { TimeReportComponent } from '../../report/attendance-report/time-report/time-report.component';
import { WholeDayComponent } from '../../report/attendance-report/whole-day/whole-day.component';

@Component({
  selector: 'app-attendance-listing-console',
  templateUrl: './attendance-listing-console.component.html',
  styleUrls: ['./attendance-listing-console.component.css'],
})
export class CMPAttendanceListingConsoleComponent implements OnInit {
  @ViewChild('salarysheetreporttable', { static: false }) el!: ElementRef;
  @ViewChild(FormDComponent) FormD: FormDComponent;
  @ViewChild(HalfDayComponent) HalfDay: HalfDayComponent;
  @ViewChild(LateReportDetailComponent)
  LateReportDetail: LateReportDetailComponent;
  @ViewChild(LateReportSummaryComponent)
  LateReportSummary: LateReportSummaryComponent;
  @ViewChild(MonthWiseSummaryComponent)
  MonthWiseSummary: MonthWiseSummaryComponent;
  @ViewChild(SummaryReportComponent) SummaryReport: SummaryReportComponent;
  @ViewChild(TimeReportComponent) TimeReport: TimeReportComponent;
  @ViewChild(WholeDayComponent) WholeDay: WholeDayComponent;

  attendanceReportListing: any[] = [];

  filterForm: UntypedFormGroup;
  templateForm: UntypedFormGroup;
  generateReportForm: UntypedFormGroup;

  monthMaster: any[] = [];
  yearMaster: any[] = [];
  sheetTemplate: any[] = _arrearReportTempMaster;
  _tempSheetTemplate: any[] = this.sheetTemplate;
  sheetTemplateMaster: any[] = [];
  departmentMaster: any[] = [];
  designationMaster: any[] = [];
  branchMaster: any[] = [];
  hodMaster: any[] = [];

  empReportData: any[] = [];
  empReportGenerated: Boolean = false;
  empReportTempData: any = {
    master_head_includes: [],
    head_includes: [],
    extra_earning_data: [],
  };

  rowCheckedAll: Boolean = false;
  checkedRowIds: any[] = [];
  uncheckedRowIds: any[] = [];

  Global = Global;
  paginationOptions: PaginationOptions = Global.resetPaginationOption();
  tableFilterOptions: TableFiilterOptions = Global.resetTableFilterOptions();
  holdedSalarypaginationOptions: PaginationOptions =
    Global.resetPaginationOption();

  reportType: String = '';
  newreport_type: any;
  attendance_type: any = '';
  employeeListFilter: any = {};

  constructor(
    private titleService: Title,
    private toastr: ToastrService,
    private cd:ChangeDetectorRef,
    protected companyuserService: CompanyuserService,
    private spinner: NgxSpinnerService,
    public formBuilder: UntypedFormBuilder,
    private datePipe: DatePipe,
    private router: Router
  ) {
    this.filterForm = formBuilder.group({
      report_type: [null, Validators.compose([Validators.required])],

      month: [null, Validators.compose([Validators.required])],
      year: [null, Validators.compose([Validators.required])],

      department: [null],
      designation: [null],
      branch: [null],
      hod: [null],

      department_id: [null],
      designation_id: [null],
      branch_id: [null],
      hod_id: [null],
    });

    this.monthMaster = [
      { index: 0, value: 1, description: 'January', days: 31 },
      { index: 1, value: 2, description: 'February', days: 28 },
      { index: 2, value: 3, description: 'March', days: 31 },
      { index: 3, value: 4, description: 'April', days: 30 },
      { index: 4, value: 5, description: 'May', days: 31 },
      { index: 5, value: 6, description: 'June', days: 30 },
      { index: 6, value: 7, description: 'July', days: 31 },
      { index: 7, value: 8, description: 'August', days: 31 },
      { index: 8, value: 9, description: 'September', days: 30 },
      { index: 9, value: 10, description: 'October', days: 31 },
      { index: 10, value: 11, description: 'November', days: 30 },
      { index: 11, value: 12, description: 'December', days: 31 },
    ];

    let currentYear = new Date().getFullYear();
    this.yearMaster = [];
    for (let index = 4; index >= 0; index--) {
      this.yearMaster.push({
        value: currentYear - index,
        description: currentYear - index,
      });
    }
  }

  async ngOnInit() {
    this.titleService.setTitle('Attendance Listing - ' + Global.AppName);

    this.reportType = 'monthlywages';
    this.filterForm.patchValue({
      report_type: 'monthlywages',

      month:
        this.monthMaster.find((obj: any) => {
          return obj.index == 0;
          return obj.index == new Date().getMonth();
        }) ?? null,

      year:
        this.yearMaster.find((obj: any) => {
          // return obj.value == 2022
          return obj.value == new Date().getFullYear();
        }) ?? null,
    });
  }

  getPayload() {
    let payload: any = {
      pageno: this.paginationOptions.page,
      perpage: this.paginationOptions.limit,
      row_checked_all: this.rowCheckedAll,
      checked_row_ids: JSON.stringify(this.checkedRowIds),
      unchecked_row_ids: JSON.stringify(this.uncheckedRowIds),
      hod_id: this.employeeListFilter?.hod_id ?? '',
      department_id: this.employeeListFilter?.department_id ?? '',
      designation_id: this.employeeListFilter?.designation_id ?? '',
      branch_id: this.employeeListFilter?.branch_id ?? '',
      attendance_month: this.employeeListFilter?.month?.index ?? '',
      attendance_year: this.employeeListFilter?.year?.value ?? '',
      register_type: this.employeeListFilter?.attendance_type?.value ?? '',
      searchkey: this.employeeListFilter?.searchkey ?? ''
    };
    return payload;
  }

  getValue(v: any) {
  // console.log(v);
  // console.log(this.getPayload());
  }

  allRowsCheckboxChecked(event: any) {
    if (this.rowCheckedAll) {
      this.uncheckedRowIds.length = 0;
      this.rowCheckedAll = false;
    } else {
      this.checkedRowIds.length = 0;
      this.rowCheckedAll = true;
    }

    this.fetchAttendanceReport();
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

  async fetchAttendanceReport() {
    console.log(this.newreport_type,'new reportt typee');
    
    if (this.newreport_type) return;
    try {
      console.log('reportttttt');
      
      let res = await this.companyuserService
        .fetchAttendanceSummary(this.getPayload())
        .toPromise();

      if (res) {
        if (res.status == 'success') {
          this.attendanceReportListing = res.attendance_summ.docs;
          this.attendanceReportListing.forEach((doc: any) => {
            doc.checked = this.isRowChecked(doc._id);
          });
          this.paginationOptions = {
            hasNextPage: res.attendance_summ.hasNextPage,
            hasPrevPage: res.attendance_summ.hasPrevPage,
            limit: res.attendance_summ.limit,
            nextPage: res.attendance_summ.nextPage,
            page: res.attendance_summ.page,
            pagingCounter: res.attendance_summ.pagingCounter,
            prevPage: res.attendance_summ.prevPage,
            totalDocs: res.attendance_summ.totalDocs,
            totalPages: res.attendance_summ.totalPages,
          };

          return res;
        } else if (res.status == 'val_err') {
          return this.toastr.error(Global.showValidationMessage(res.val_msg));
        } else {
          throw res.message;
        }
      }
    } catch (err: any) {
      return this.toastr.error(err?.message || err);
    }
  }
  updateEmployeeListFilter(event: any): void {
    console.log('calijd  dfndf');
    
    // Update employeeListFilter as needed
    this.employeeListFilter = {
      ...this.employeeListFilter,
      searchkey: event.searchkey
    };
    console.log(this.employeeListFilter,'empll');
    
    this.paginationOptions.limit = +event?.length;
    // Manually trigger change detection
    // this.cd.detectChanges();
    
    // Optionally, fetch the report if needed
    this.fetchAttendanceReport();
  }
  generateMasterSheet({ page = <any>null, options = <any>{} } = {}) {
    this.employeeListFilter = options;
    if (this.employeeListFilter) {
      if (page != null) {
        this.paginationOptions.page = page;
      }
      this.tableFilterOptions = options;
      this.newreport_type = options.report_type;
      this.attendance_type = options.attendance_type?.value;
    }
  // console.log(this.employeeListFilter);

    return;
  }

  // async viewAndPrintAttendanceReport(e: any) {
  //   try {
  //     setTimeout(function () {
  //       Global.scrollToQuery('p.error-element');
  //     }, 100);

  //     e.target.classList.add('btn-loading');
  //     let res;

  //     // this.companyuserService.getEmployeesPayslip(payload).subscribe(
  //     // this.companyuserService.setPrintDoc({
  //     //   // docs:res?.res.attendance_summ?.docs,
  //     //   newreport_type: this.newreport_type,
  //     //   attendance_type: this.attendance_type,
  //     //   attendanceReportListing: res?.attendance_summ?.docs || [],
  //     //   employeeListFilter: this.employeeListFilter,
  //     // });
  //     e.target.classList.remove('btn-loading');
  //     // this.router.navigate([
  //     //   `/company/attendance-management/attendance-report/print`,
  //     // ]);
  //     // return
  //     //   }
  //     // );
  //   } catch (err: any) {
  //     if (err.status == 'val_err') {
  //       return this.toastr.error(Global.showValidationMessage(err.val_msg));
  //     } else {
  //       e.target.classList.remove('btn-loading');
  //       this.toastr.error(Global.showServerErrorMessage(err));
  //       return this.toastr.error(err.message);
  //     }
  //   }
  // }

  async viewAndPrintAttendanceReport(e: any) {
    console.log('in repott 1111');
    if (this.newreport_type == 1) {
      
      this.FormD.generateReportNew(true, this.employeeListFilter);
    } else if (this.newreport_type == 'monthly_late_report') {
      this.LateReportDetail.generateReportNew();
    } else if (this.newreport_type == 'late_summary_report') {
      this.LateReportSummary.generateReportNew();
    } else if (this.newreport_type == 'month_wise_summary') {
      this.MonthWiseSummary.generateReportNew();
    } else if (this.newreport_type == 'summary') {
      this.SummaryReport.generateReportNew();
    } else if (this.newreport_type == 2 && this.attendance_type == 'halfday') {
      this.HalfDay.generateReportNew();
    } else if (this.newreport_type == 2 && this.attendance_type == 'wholeday') {
      this.WholeDay.generateReportNew();
    } else if (this.newreport_type == 2 && this.attendance_type == 'time') {
      this.TimeReport.generateReportNew();
    }
  }

  async previewFormA(templateType: string) {
    try {
      let payload = this.getPayload();
      // payload.pageno = 1;
      // payload.perpage = 20
      // payload.generate = 'excel';

      const res = await this.companyuserService
        .printattendReport(payload)
        .toPromise();

      if (res.status !== 'success') throw res;

      this.companyuserService.setPrintDoc({
        docs: res?.employees,
        payload,
      });

      this.router.navigate([`/company/attendance-management/form-d/print`]);
      return;
    } catch (err: any) {
      if (err.status == 'val_err') {
        return this.toastr.error(Global.showValidationMessage(err.val_msg));
      }
      return this.toastr.error(err?.message || err);
    }
  }
}
