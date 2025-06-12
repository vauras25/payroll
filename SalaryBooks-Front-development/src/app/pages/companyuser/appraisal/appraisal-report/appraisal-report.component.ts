import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import PaginationOptions from 'src/app/models/PaginationOptions';
import TableFilterOptions from 'src/app/models/TableFiilterOptions';
import { CompanyuserService } from 'src/app/services/companyuser.service';
import * as Global from 'src/app/globals';

@Component({
  selector: 'app-appraisal-report',
  templateUrl: './appraisal-report.component.html',
  styleUrls: ['./appraisal-report.component.css'],
})
export class CMPAppraisalReportComponent implements OnInit {
  reportListType = 'summary';
  Global = Global;
  employeesListing: any[] = [];
  appraisalsListing: any[] = [];
  showDetailedData: boolean = false;
  employeeListFilter: any = {};
  rowCheckedAll: Boolean = false;
  checkedRowIds: any[] = [];
  uncheckedRowIds: any[] = [];
  reportPaginationOptions: PaginationOptions = Global.resetPaginationOption();
  reportTableFilterOptions: TableFilterOptions =
    Global.resetTableFilterOptions();
  employee_id: any;
  isViewReportDetails: boolean = false;

  constructor(
    private companyuserService: CompanyuserService,
    private toastr: ToastrService,
    private router: Router
  ) {}

  ngOnInit() {}

  allRowsCheckboxChecked(event: any) {
    if (this.rowCheckedAll) {
      this.uncheckedRowIds.length = 0;
      this.rowCheckedAll = false;
    } else {
      this.checkedRowIds.length = 0;
      this.rowCheckedAll = true;
    }

    this.fetchAppraisalListing();
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

  getPayload() {
    let payload: any = {
      pageno: this.reportPaginationOptions.page,
      perpage: this.reportPaginationOptions.limit,
      searchkey: this.reportTableFilterOptions.searchkey || '',
      row_checked_all: this.rowCheckedAll,
      checked_row_ids: JSON.stringify(this.checkedRowIds),
      unchecked_row_ids: JSON.stringify(this.uncheckedRowIds),
      hod_id: this.employeeListFilter?.hod_id ?? '',
      department_id: this.employeeListFilter?.department_id ?? '',
      designation_id: this.employeeListFilter?.designation_id ?? '',
      branch_id: this.employeeListFilter?.branch_id ?? '',
      rating_year: this.employeeListFilter?.year?.value ?? '',
    };
    return payload;
  }

  async fetchAppraisalListing(listType: any = 'report') {
    try {
      let payload = this.getPayload();
      payload.listType = listType;
      let res = await this.companyuserService
        .getAppraisalReportListing(payload)
        .toPromise();

      if (res) {
        if (res.status == 'success') {
          this.employeesListing =
            listType === 'report' ? res?.docs?.docs : res?.docs;
          this.employeesListing.forEach((doc: any) => {
            doc.checked = this.isRowChecked(doc._id);
            doc.overallRating = 0;
            doc.appraisals.forEach((d: any) => {
              doc.overallRating += d.calculated_rating;
            });
          });

          if(listType == 'report'){
            this.reportPaginationOptions = {
              hasNextPage: res?.docs?.hasNextPage,
              hasPrevPage: res?.docs?.hasPrevPage,
              limit: res?.docs?.limit,
              nextPage: res?.docs?.nextPage,
              page: res?.docs?.page,
              pagingCounter: res?.docs?.pagingCounter,
              prevPage: res?.docs?.prevPage,
              totalDocs: res?.docs?.totalDocs,
              totalPages: res?.docs?.totalPages,
            };
          }


          return res;
        } else if (res.status == 'val_err') {
          this.toastr.error(Global.showValidationMessage(res.val_msg));
        } else {
          throw res.message;
        }
      }
    } catch (err: any) {
      this.toastr.error(err?.message || err);
    }
  }

  async viewReportDetail() {
    await this.fetchAppraisalListing('report_detail');
    this.isViewReportDetails = true;
  }

  getAppraisalheads(item: any = []): Array<any> {
    let heads: any = [];

    item.map((d: any) => {
      heads.push(
        ...d.heads_data.map((h: any) => {
          if (!heads.find((el: any) => el.name === h.head_name)) {
            return {
              name: h.head_name,
              value: h.head_value,
              assign_value: h.assign_value,
            };
          }
          return null;
        })
      );
    });
    return [...new Set(heads)];
  }

  getAppraisalheadsAssignValue(
    report: any,
    appraisals: any,
    rating_of: any
  ): Array<any> {
    let heads: any = [];
    heads = appraisals.find(
      (ap: any) =>
        ap.rate_contributor.contributor_id ===
        report.employee_detail.kpi_and_appraisal[rating_of].assignee_id
    )?.heads_data;
    return heads;
  }

  getAppraisalheadsTotalValue(report: any, appraisals: any, rating_of: any) {
    let sum = appraisals.find(
      (ap: any) =>
        ap.rate_contributor.contributor_id ===
        report.employee_detail.kpi_and_appraisal[rating_of].assignee_id
    )?.total_rating;

    return sum;
  }

  async downloadExcelReport(e: any) {
    try {
      let payload = this.getPayload();
      payload.list_type = this.reportListType;
      payload.rating_year = payload.rating_year;

      await this.companyuserService.downloadFile('appraisal_report_excel_export','appraisal-report', payload)
      // let res = await this.companyuserService.exportAppraisalReportExcel(payload).toPromise();
      // if (res.status !== 'success') throw res;
      this.appraisalsListing = []
      this.checkedRowIds = []
      this.uncheckedRowIds = []
      this.rowCheckedAll = false
      this.fetchAppraisalListing();
      this.isViewReportDetails = false;
      this.reportListType = 'summary';

    } catch (err: any) {
      e.target.classList.remove('btn-loading');
      if (err.status == 'val_err') {
        this.toastr.error(Global.showValidationMessage(err.val_msg));
      } else {
        this.toastr.error(Global.showServerErrorMessage(err));
        this.toastr.error(err.message);
      }
    }
  }
}
