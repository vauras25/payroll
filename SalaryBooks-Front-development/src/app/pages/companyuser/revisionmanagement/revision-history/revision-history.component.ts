import * as Global from 'src/app/globals';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { CompanyuserService } from 'src/app/services/companyuser.service';
import { rejects } from 'assert';
import PaginationOptions from 'src/app/models/PaginationOptions';
import TableFiilterOptions from 'src/app/models/TableFiilterOptions';
import { Title } from '@angular/platform-browser';
import { DatePipe } from '@angular/common';
@Component({
  selector: 'app-revision-history',
  templateUrl: './revision-history.component.html',
  styleUrls: ['./revision-history.component.css'],
})
export class RevisionHistoryComponent implements OnInit {
  @Input() rivision_filter: any = {};
  Global = Global;
  employees: any[] = [];
  paginationOptions: PaginationOptions = Global.resetPaginationOption();
  tableFilterOptions: TableFiilterOptions = Global.resetTableFilterOptions();
  rowCheckedAll: Boolean = false;
  checkedRowIds: any[] = [];
  uncheckedRowIds: any[] = [];
  salaryTempateDetails: any = {};
  @Output() resetFilter = new EventEmitter();
  constructor(
    private spinner: NgxSpinnerService,
    private toastr: ToastrService,
    private companyuserService: CompanyuserService,
    private titleService: Title
  ) {}

  ngOnInit(): void {}
  ngOnChanges() {
    this.fetchEmployees({ page: 1 });
  }
  fetchEmployees({
    loading = <boolean>true,
    page = <any>null,
    options = <TableFiilterOptions>this.tableFilterOptions,
  } = {}) {
    let payload: any = this.rivision_filter;
    payload.pageno = page;
    payload.perpage = this.tableFilterOptions.length;
    this.spinner.show();

    this.companyuserService.getRevisionHistory(payload).subscribe(
      (res: any) => {
        this.spinner.hide();
        if (res.status == 'success') {
          var docs: any[] = res?.employees?.docs ?? [];
          docs.forEach((doc: any) => {
            doc.checked = this.isRowChecked(doc._id);
          });

          this.employees = docs ?? [];
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
          this.toastr.error(res.message);
          this.employees = [];
        }

        this.spinner.hide();
        Global.loadCustomScripts('customJsScript');
      },
      (err) => {
        this.spinner.hide();
        this.toastr.error(Global.showServerErrorMessage(err));
        Global.loadCustomScripts('customJsScript');
      }
    );
  }

  private isRowChecked(rowId: any) {
    if (!this.rowCheckedAll) {
      return this.checkedRowIds.indexOf(rowId) >= 0 ? true : false;
    } else {
      return this.uncheckedRowIds.indexOf(rowId) >= 0 ? false : true;
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

  allRowsCheckboxChecked(event: any) {
    if (this.rowCheckedAll) {
      this.uncheckedRowIds.length = 0;
      this.rowCheckedAll = false;
    } else {
      this.checkedRowIds.length = 0;
      this.rowCheckedAll = true;
    }

    this.fetchEmployees();
  }

  resetCheckedRows() {
    this.rowCheckedAll = false;
    this.checkedRowIds = [];
    this.uncheckedRowIds = [];
  }
  viewSalaryTemplate(item: any) {
    this.salaryTempateDetails = item;
    $('#viewSalaryTemplateModalButton').click();
  }
  anyRowsChecked(): boolean {
    return (
      this.rowCheckedAll == true ||
      this.checkedRowIds.length > 0 ||
      this.uncheckedRowIds.length > 0
    );
  }
  exportExcel() {
    let wage_month_from = this.rivision_filter?.wage_from_date.split('-')[1];
    let wage_year_from = this.rivision_filter?.wage_from_date.split('-')[0];

    let wage_month_to = this.rivision_filter?.wage_to_date.split('-')[1];
    let wage_year_to = this.rivision_filter?.wage_to_date.split('-')[0];
    wage_month_from = wage_month_from - 1;
    wage_month_to = wage_month_to - 1;

    let payload: any = {
      unchecked_row_ids: this.uncheckedRowIds,
      checked_row_ids: this.checkedRowIds,
      row_checked_all: this.rowCheckedAll.toString(),
      wage_month_from: wage_month_from,
      wage_year_from: wage_year_from,
      wage_month_to: wage_month_to,
      wage_year_to: wage_year_to,
      generate: 'excel',
    };

    this.spinner.show();
    this.companyuserService.downloadFile('employee-revision-arrear-history-log-report','employee-revision-arrear-history', payload)
    this.spinner.hide();
    // .subscribe(
    //   (res: any) => {
    //     if (res.status == 'success') {
    //       location.href = res?.url;
    //     } else {
    //       this.toastr.error(res.message);
    //       this.employees = [];
    //     }

    //     this.spinner.hide();
    //     Global.loadCustomScripts('customJsScript');
    //   },
    //   (err) => {
    //     this.spinner.hide();
    //     this.toastr.error(Global.showServerErrorMessage(err));
    //     Global.loadCustomScripts('customJsScript');
    //   }
    // );
  }
  cancellRivReport() {
    this.resetFilter.emit(true);
  }
}






