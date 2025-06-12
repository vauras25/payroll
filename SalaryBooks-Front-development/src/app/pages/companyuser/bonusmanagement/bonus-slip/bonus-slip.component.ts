import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import PaginationOptions from 'src/app/models/PaginationOptions';
import TableFilterOptions from 'src/app/models/TableFiilterOptions';
import { CompanyuserService } from 'src/app/services/companyuser.service';
import * as Global from 'src/app/globals';
import { NgxSpinnerService } from 'ngx-spinner';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'app-bonus-slip',
  templateUrl: './bonus-slip.component.html',
  styleUrls: ['./bonus-slip.component.css'],
})
export class CMPBonusSlipComponent implements OnInit {
  Global = Global;
  employeePaginationOptions: PaginationOptions = Global.resetPaginationOption();
  employeeTableFilterOptions: TableFilterOptions =
    Global.resetTableFilterOptions();
  employeeFilter: any = null;
  commomTableFilterData: any = {};
  employees: any[] = [];
  rowCheckedAll: Boolean = false;
  checkedRowIds: any[] = [];
  uncheckedRowIds: any[] = [];
  isBatchDownloading: boolean = false;

  constructor(
    private toastr: ToastrService,
    private companyuserService: CompanyuserService,
    private spinner: NgxSpinnerService
  ) {}

  ngOnInit() {}

  private isRowChecked(rowId: any) {
    if (!this.rowCheckedAll)
      return this.checkedRowIds.indexOf(rowId) >= 0 ? true : false;
    else return this.uncheckedRowIds.indexOf(rowId) >= 0 ? false : true;
  }

  rowSelecion(e: any): void {
    document.getElementsByName(e.target?.name)?.forEach((checkbox: any) => {
      checkbox.checked = e.target.checked;
    });
  }

  rowCheckBoxChecked(event: any, row: any) {
    let rowId: any = row.employee_id;
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

  fetchEmployees({
    page = <any>null,
    loading = <boolean>true,
    filter = <any>null,
  } = {}) {
    return new Promise((resolve, reject) => {
      if (page != null) this.employeePaginationOptions.page = page;
      if (filter != null) this.employeeFilter = filter;

      if (!this.employeeFilter) {
        resolve(false);
        return;
      }
      this.commomTableFilterData = filter;
      let payload: any = {
        pageno: this.employeePaginationOptions.page,
        perpage: this.employeePaginationOptions.limit,
        wage_month: this.employeeFilter?.month?.index ?? '',
        wage_year: this.employeeFilter?.year?.value ?? '',
        hod_id: this.employeeFilter?.hod_id ?? null,
        searchkey: this.employeeFilter?.searchkey ?? '',
        department_id: this.employeeFilter?.department_id ?? null,
        designation_id: this.employeeFilter?.designation_id ?? null,
        branch_id: this.employeeFilter?.branch_id ?? null,
      };

      if (loading == true) this.spinner.show();
      this.companyuserService.getGeneratedBonusSlips(payload).subscribe(
        (res) => {
          if (res.status == 'success') {
            var docs: any[] = res?.employees?.docs ?? [];

            docs.forEach((doc: any) => {
              doc.checked = this.isRowChecked(doc.employee_id);
            });

            this.employees = docs;
            this.employeePaginationOptions = {
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

            resolve(true);
          } else {
            if (res.status == 'val_err')
              this.toastr.error(Global.showValidationMessage(res.val_msg));
            else this.toastr.error(res.message);

            this.employees = [];
            this.employeePaginationOptions = Global.resetPaginationOption();

            this.rowCheckedAll = false;
            this.checkedRowIds = [];
            this.uncheckedRowIds = [];

            resolve(false);
          }

          if (loading == true) this.spinner.hide();
          Global.loadCustomScripts('customJsScript');
        },
        (err) => {
          this.toastr.error(
            Global.showValidationMessage(Global.showServerErrorMessage(err))
          );
          this.employees = [];
          this.employeePaginationOptions = Global.resetPaginationOption();
          this.rowCheckedAll = false;
          this.checkedRowIds = [];
          this.uncheckedRowIds = [];
          if (loading == true) this.spinner.hide();
          Global.loadCustomScripts('customJsScript');
          resolve(false);
        }
      );
    });
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

  anyRowsChecked(): boolean {
    return (
      this.rowCheckedAll == true ||
      this.checkedRowIds.length > 0 ||
      this.uncheckedRowIds.length > 0
    );
  }

  cancelReportDownloading() {
    this.rowCheckedAll = false;
    this.checkedRowIds = [];
    this.uncheckedRowIds = [];
    this.isBatchDownloading = false;
  }

  reportListing: any = [];

  async downloadBatch(isGenerate: boolean = false, emp_id?: any) {
    try {
      // this.isBatchDownloading = false;

      let payload: any = {
        pageno: this.employeePaginationOptions.page,
        perpage: this.employeeTableFilterOptions.length,
        wage_month: this.employeeFilter?.month?.index ?? '',
        wage_year: this.employeeFilter?.year?.value ?? '',
        hod_id: this.employeeFilter?.hod_id ?? null,
        department_id: this.employeeFilter?.department_id ?? null,
        designation_id: this.employeeFilter?.designation_id ?? null,
        branch_id: this.employeeFilter?.branch_id ?? null,
        row_checked_all: this.rowCheckedAll,
        checked_row_ids: JSON.stringify(this.checkedRowIds),
        unchecked_row_ids: JSON.stringify(this.uncheckedRowIds),
      };

      if (emp_id) {
        payload.row_checked_all = false;
        payload.checked_row_ids = [emp_id];
        payload.checked_row_ids = JSON.stringify(payload.checked_row_ids);
      }
      
      if (isGenerate) {
        payload.generate = 'yes';

        await this.companyuserService.downloadFile('employee-generated-bonus-slip', 'Employee-bonus-slip', payload)
        this.cancelReportDownloading();
        return;
      }

      

      // } else {
      let res = await this.companyuserService
        .generateBonusSlip(payload)
        .toPromise();

      if (res.status !== 'success') throw res;

      if (emp_id) {
        this.reportListing = res.employees;
        return;
      }
      this.reportListing = res.employees;
      this.isBatchDownloading = true;
      // }
    } catch (err) {
      this.isBatchDownloading = false;
      console.error(err);
    }
  }

  async viewBonusSlipTemplate(emp_id: any) {
    await this.downloadBatch(false, emp_id);
    if (this.reportListing[0]?.bonus_slip_temp_data) {
      // setTimeout(() => {
      $('#viewBonusSlipTemplate')?.click();
      // }, 100);
    } else {
      this.toastr.error('Bonus Slip Template Not Available!');
    }
  }

  // async printBonusSlipTemplate(emp_id: any) {
  //   await this.downloadBatch(true, emp_id);
  //   if (this.reportListing[0]?.bonus_slip_temp_data) {
  //     setTimeout(() => {
  //       let modal = Global.documentPrintByElement('print-section');
  //     }, 1000);
  //   } else {
  //     this.toastr.error('Bonus Slip Template Not Available!');
  //   }
  // }

  // async downloadSingleSlip(link: any) {
  //   if (link) {
  //     window.open(Global.BACKEND_URL + link);
  //   }
  // }
}
