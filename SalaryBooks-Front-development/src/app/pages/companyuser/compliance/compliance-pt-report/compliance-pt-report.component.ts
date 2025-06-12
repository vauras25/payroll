import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import * as Global from 'src/app/globals';
import { CompanyuserService } from 'src/app/services/companyuser.service';
import { _incentiveReportTempMasterNew } from '../../report/_incentiveReportTempMaster';
import PaginationOptions from 'src/app/models/PaginationOptions';
import TableFilterOptions from 'src/app/models/TableFiilterOptions';
import { Router } from '@angular/router';

@Component({
  selector: 'app-compliance-pt-report',
  templateUrl: './compliance-pt-report.component.html',
  styleUrls: ['./compliance-pt-report.component.css'],
})
export class CMPCompliancePtReportComponent implements OnInit {
  Global = Global;
  employeeReportListing: any[] = [];
  showDetailedData: boolean = false;
  employeeListFilter: any = {};
  rowCheckedAll: Boolean = false;
  checkedRowIds: any[] = [];
  uncheckedRowIds: any[] = [];
  layoffListType = 'summary';
  reportPaginationOptions: PaginationOptions = Global.resetPaginationOption();
  reportTableFilterOptions: TableFilterOptions =
    Global.resetTableFilterOptions();
  monthYearList: any[] = [];

  constructor(
    private companyuserService: CompanyuserService,
    private toastr: ToastrService,
    private router: Router
  ) {
    if (
      !Global.checkCompanyModulePermission({
        company_module: 'compliance',
        company_sub_module: 'p_tax_report',
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
  }

  ngOnInit() {}

  allRowsCheckboxChecked(event: any) {
    if (this.rowCheckedAll) {
      this.uncheckedRowIds.length = 0;
      this.rowCheckedAll = false;
    } else {
      this.checkedRowIds.length = 0;
      this.rowCheckedAll = true;
    }

    this.fetchPFReport();
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
      searchkey: this.employeeListFilter?.searchkey ?? '',
      pageno: this.reportPaginationOptions.page,
      row_checked_all: this.rowCheckedAll,
      checked_row_ids: JSON.stringify(this.checkedRowIds),
      unchecked_row_ids: JSON.stringify(this.uncheckedRowIds),
      hod_id: this.employeeListFilter?.hod_id ?? '',
      department_id: this.employeeListFilter?.department_id ?? '',
      designation_id: this.employeeListFilter?.designation_id ?? '',
      branch_id: this.employeeListFilter?.branch_id ?? '',
      wage_month_from: this.employeeListFilter?.wage_month_from ?? '',
      wage_year_from: this.employeeListFilter?.wage_year_from ?? '',
      wage_month_to: this.employeeListFilter?.wage_month_to ?? '',
      wage_year_to: this.employeeListFilter?.wage_year_to ?? '',
      report_type: 'pt',
    };
    return payload;
  }

  getAllMonthBetween() {
    const dateFrom = new Date(
      this.employeeListFilter.wage_year_from,
      this.employeeListFilter.wage_month_from,
      1
    );
    const dateTo = new Date(
      this.employeeListFilter.wage_year_to,
      this.employeeListFilter.wage_month_to,
      30
    );
  // console.log(dateFrom, dateTo);
  }

  async fetchPFReport({ page = <any>null, options = <any>{} } = {}) {
    try {
      let payload = this.getPayload();
      let res = await this.companyuserService
        .employeeReportListing(payload)
        .toPromise();
      if (res.status !== 'success') throw res;
      this.employeeReportListing = res?.report_data?.docs;
      this.employeeReportListing.forEach((doc: any) => {
        doc.checked = this.isRowChecked(doc._id);
      });
      return res;
    } catch (err: any) {
      if (err.status == 'val_err') {
        return this.toastr.error(Global.showValidationMessage(err.val_msg));
      }
      return this.toastr.error(err?.message || err);
    }
  }

  async downloadPFReport(e: any) {
    try {
      if (this.employeeReportListing.length > 0) {
        let payload = this.getPayload();
        let res = await this.companyuserService.downloadFile(
          'get-compliance-report-export-file',
          'PT-compliance-Report',
          payload
        );

        // let res;
        // res = await this.companyuserService
        //   .employeeReportListingExcelDownload(payload)
        //   .toPromise();

        // if (res.status !== 'success') throw res;
        return res;
      }
    } catch (err: any) {
      if (err.status == 'val_err') {
        return this.toastr.error(Global.showValidationMessage(err.val_msg));
      }
      return this.toastr.error(err?.message || err);
    }
  }
}
