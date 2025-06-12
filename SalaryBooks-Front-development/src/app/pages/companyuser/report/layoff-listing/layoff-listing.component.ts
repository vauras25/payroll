import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import * as Global from 'src/app/globals';
import { CompanyuserService } from 'src/app/services/companyuser.service';
import { _incentiveReportTempMasterNew } from '../../report/_incentiveReportTempMaster';
import PaginationOptions from 'src/app/models/PaginationOptions';
import TableFilterOptions from 'src/app/models/TableFiilterOptions';
import { Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'app-layoff-listing',
  templateUrl: './layoff-listing.component.html',
  styleUrls: ['./layoff-listing.component.css'],
})
export class CMPLayoffListingComponent implements OnInit {

  Global = Global;
  layoffReportListing: any[] = [];
  showDetailedData: boolean = false;
  employeeListFilter: any = {};
  rowCheckedAll: Boolean = false;
  checkedRowIds: any[] = [];
  uncheckedRowIds: any[] = [];
  layoffListType = 'summary';
  reportPaginationOptions: PaginationOptions = Global.resetPaginationOption();
  reportTableFilterOptions: TableFilterOptions =
    Global.resetTableFilterOptions();

  constructor(
    private companyuserService: CompanyuserService,
    private toastr: ToastrService,
    private spinner: NgxSpinnerService,
    private router: Router
  ) {
    if (
      !Global.checkCompanyModulePermission({
        company_module: 'layoff_management',
        company_sub_module: 'lay-off_report',
        company_sub_operation: ['view'],
        company_strict: true
      })
    ) {
      const _this = this;
      setTimeout(function () {
        _this.router.navigate(['company/errors/unauthorized-access'], {
          skipLocationChange: true,
        });
      }, 500);
      return;
    }}

  ngOnInit() {
    this.fetchLayoffListing();
  }

  allRowsCheckboxChecked(event: any) {
    if (this.rowCheckedAll) {
      this.uncheckedRowIds.length = 0;
      this.rowCheckedAll = false;
    } else {
      this.checkedRowIds.length = 0;
      this.rowCheckedAll = true;
    }

    this.fetchLayoffListing();
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
      row_checked_all: this.rowCheckedAll,
      checked_row_ids: JSON.stringify(this.checkedRowIds),
      unchecked_row_ids: JSON.stringify(this.uncheckedRowIds),
      hod_id: this.employeeListFilter?.hod_id ?? '',
      department_id: this.employeeListFilter?.department_id ?? '',
      designation_id: this.employeeListFilter?.designation_id ?? '',
      branch_id: this.employeeListFilter?.branch_id ?? '',
      searchkey: this.reportTableFilterOptions?.searchkey ?? '',
      disbursement_frequency:this.employeeListFilter?.disbursement_frequency ?? '',
      disbursement_type: this.employeeListFilter?.disbursement_type ?? '',
      wage_month_from: this.employeeListFilter?.wage_month_from ?? '',
      wage_month_to: this.employeeListFilter?.wage_month_to ?? '',
      wage_year_from: this.employeeListFilter?.wage_year_from ?? '',
      wage_year_to: this.employeeListFilter?.wage_year_to ?? '',
      wage_month: this.employeeListFilter?.month?.index ?? '',
      wage_year: this.employeeListFilter?.year?.value ?? '',
      reportListType: this.layoffListType ?? 'summary',
      pageno: this.reportPaginationOptions.page,
      perpage: this.reportPaginationOptions.limit,
    };
    return payload;
  }

  async fetchLayoffListing(listType?:any) {
    try {
      this.spinner.show()
      let payload = this.getPayload() || {};
      if(listType == 'Listing'){
        payload.checked_row_ids = "[]";
        payload.unchecked_row_ids = "[]";
      }
      let res = await this.companyuserService.getLayoffReport(payload)
        .toPromise();

      if (res) {
        if (res.status == 'success') {
          this.layoffReportListing = res?.docs?.docs;
          // console.log(this.layoffReportListing);

          this.layoffReportListing.forEach((doc: any) => {
            doc.checked = this.isRowChecked(doc._id);
          });
          return res;
        } else if (res.status == 'val_err') {
          this.spinner.hide()
          this.toastr.error(Global.showValidationMessage(res.val_msg));
        } else {
          throw res.message;
        }
      }
    } catch (err: any) {
      this.spinner.hide()
      this.toastr.error(err?.message || err);
    }
  }
  utilizeMonth(m: any) {
    return Global.monthMaster.find((d) => d.index == m)?.sf;
  }

  async downloadLayoffSlip(){
    try {
      this.spinner.show();
      let payload = this.getPayload() || {};
      payload.generate = 'excel'
      await this.companyuserService.downloadFile('get-layoff-report', payload.reportListType + '-layoff-report', payload);
      this.spinner.hide()
    } catch (err:any) {
      this.spinner.hide()
      this.toastr.error(err.message)
    }
  }

  // async printMultiplePayslips(e: any) {
  
  //   setTimeout(function () {
  //     Global.scrollToQuery('p.error-element');
  //   }, 100);

  //   e.target.classList.add('btn-loading');

  //   let res = await this.fetchLayoffListing();

  //   this.companyuserService.setPrintDoc({
  //     layoffListing: res?.docs,
  //     layoffListType: this.layoffListType,
  //   });

  //   e.target.classList.remove('btn-loading');
  //   this.router.navigate([`/company/reports/layoff-listing/print`]);
  //   // let payload: any = this.getReportPayload();

  //   // this.companyuserService.getEmployeesPayslip(payload).subscribe(
  //   //   (res) => {
  //   //     if (res.status == 'success') {
  //   //       // this.companyuserService.setPrintDoc({
  //   //       //   // docs:res?.master_data?.docs,
  //   //       //   empData: res?.docs,
  //   //       //   tempDetails: this.templateDetails,
  //   //       //   wageMonth: this.employeeFilter?.month?.index,
  //   //       //   wageYear: this.employeeFilter?.year?.value,
  //   //       // });
  //   //       // this.router.navigate([`/company/reports/payslip/${null}/print`]);
  //   //     } else if (res.status == 'val_err') {
  //   //       this.toastr.error(Global.showValidationMessage(res.val_msg));
  //   //     } else {
  //   //       this.toastr.error(res.message);
  //   //     }

  //   //     e.target.classList.remove('btn-loading');
  //   //   },
  //   //   (err) => {
  //   //     e.target.classList.remove('btn-loading');
  //   //     this.toastr.error(Global.showServerErrorMessage(err));
  //   //   }
  //   // );
  // }
}
