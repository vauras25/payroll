import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { CompanyuserService } from 'src/app/services/companyuser.service';
import * as Global from 'src/app/globals';
import PaginationOptions from 'src/app/models/PaginationOptions';
import TableFilterOptions from 'src/app/models/TableFiilterOptions';
import { NgxSpinnerService } from 'ngx-spinner';
import { Router } from '@angular/router';

@Component({
  selector: 'app-compliance-listing-console',
  templateUrl: './compliance-listing-console.component.html',
  styleUrls: ['./compliance-listing-console.component.css'],
})
export class CMListingConsoleComponent implements OnInit {
  rowIndex: number = 1;
  Global = Global;
  employeeFilter: any = null;
  rowCheckedAll: Boolean = false;
  checkedRowIds: any[] = [];
  uncheckedRowIds: any[] = [];
  compliance_type = 'ecr';
  listing_type: 'pf' | 'esic' = 'pf';
  employeesListing: any[] = [];
  employeePaginationOptions: PaginationOptions = Global.resetPaginationOption();
  employeeTableFilterOptions: TableFilterOptions =
    Global.resetTableFilterOptions();
  sheet_types: string[] = [
    'salary_report',
    'ot_report',
    'incentive_report',
    'supplement_salary_report',
    'bonus_report',
    'arrear_report',
  ];

  earning_sheet_type_selection: any = {};
  constructor(
    private companyuserservice: CompanyuserService,
    private toastr: ToastrService,
    private spinner: NgxSpinnerService,
    private router: Router
  ) {
    if (
      !Global.checkCompanyModulePermission({
        company_module: 'compliance',
        company_sub_module: 'compliance_listing',
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
    this.earning_sheet_type_selection = {};
    this.fetchEmployeeList(false);
  }

  rowCheckBoxChecked(
    event: any,
    row: any,
    sheet_type:
      | 'salary_report'
      | 'ot_report'
      | 'incentive_report'
      | 'supplement_salary_report'
      | 'bonus_report'
  ) {
    let rowId: any = row._id;

    let checkbox: any = document.querySelectorAll(
      '[data-checkbox-id="' + rowId + sheet_type + '"]'
    );

    if (checkbox.length > 0) {
      if (checkbox[0].checked) {
        this.uncheckedRowIds.splice(this.uncheckedRowIds.indexOf(rowId), 1);
        if (!this.rowCheckedAll) {
          this.modifyEarningSelectionObject(rowId, sheet_type, 'add');
          if (!this.checkedRowIds.includes(rowId)) {
            this.checkedRowIds.push(rowId);
          }
        } else {
          this.modifyEarningSelectionObject(rowId, sheet_type, 'remove');
        }
      } else {
        this.checkedRowIds.splice(this.checkedRowIds.indexOf(rowId), 1);
        if (this.rowCheckedAll) {
          this.modifyEarningSelectionObject(rowId, sheet_type, 'add');
          // if (!this.uncheckedRowIds.includes(rowId)) {
          //   this.uncheckedRowIds.push(rowId);
          // }
        } else {
          this.modifyEarningSelectionObject(rowId, sheet_type, 'remove');
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

  private isRowChecked(rowId: any, isSheetInclude: boolean = false) {
    if (!this.rowCheckedAll) {
      return this.checkedRowIds.indexOf(rowId) >= 0 ? true : false;
    } else {
      return this.earning_sheet_type_selection[rowId] && isSheetInclude
        ? false
        : true;
    }
  }

  getPayload() {
    let payload: any = {
      // pageno: this.employeePaginationOptions.page,
      pageno: this.employeePaginationOptions.page,
      perpage: this.employeePaginationOptions.limit,
      searchkey: this.employeeTableFilterOptions.searchkey || '',
      wage_month: this.employeeFilter.month?.index ?? '',
      // wage_month: 5,
      wage_year: this.employeeFilter.year?.value ?? '',
      // wage_year: 2023,
      row_checked_all: this.rowCheckedAll.toString(),
      checked_row_ids: JSON.stringify(this.checkedRowIds),
      unchecked_row_ids: JSON.stringify(this.uncheckedRowIds),
      hod_id: this.employeeFilter?.hod_id ?? '',
      department_id: this.employeeFilter?.department_id ?? '',
      designation_id: this.employeeFilter?.designation_id ?? '',
      branch_id: this.employeeFilter?.branch_id ?? '',
      sheet_type: this.employeeFilter?.sheet_type,
      compliance_type: this.compliance_type,
      compliance_status: this.employeeFilter.compliance_status.toLowerCase(),
      listing_type: this.listing_type,
    };
    return payload;
  }

  async fetchEmployeeList(resetFilters: boolean = true) {
    try {
      if (resetFilters) {
        this.checkedRowIds = [];
        this.uncheckedRowIds = [];
        this.rowCheckedAll = false;
        this.earning_sheet_type_selection = {};
      }

      let payload = this.getPayload();
      payload.branch_id = payload.branch_id
        ? JSON.stringify([payload.branch_id])
        : '';

      if (payload.compliance_type == 'arrear') {
        payload.sheet_type = payload.compliance_type;
      }

      let res = await this.companyuserservice
        .getChallanEmployeeList(payload)
        .toPromise();
      if (res) {
        console.log(this.checkedRowIds);
        console.log(this.uncheckedRowIds);
        console.log(this.earning_sheet_type_selection);

        if (res.status == 'success') {
          this.employeesListing = res.master_data.docs;
          this.employeesListing.forEach((doc: any) => {
            if (doc.compliance_report) {
              doc.compliance_report.sheet_types = [];
              if (doc.compliance_report?.salary_report) {
                const isSheetInclude =
                  this.earning_sheet_type_selection[doc._id]?.includes(
                    'salary_report'
                  );
                if (!this.rowCheckedAll && isSheetInclude) {
                  doc.compliance_report.salary_report.checked = true;
                } else if (this.rowCheckedAll) {
                  doc.compliance_report.salary_report.checked =
                    this.isRowChecked(doc._id, isSheetInclude);
                }
                doc?.compliance_report?.sheet_types?.push('salary_report');
              }
              if (doc.compliance_report?.ot_report) {
                const isSheetInclude =
                  this.earning_sheet_type_selection[doc._id]?.includes(
                    'ot_report'
                  );
                if (!this.rowCheckedAll && isSheetInclude) {
                  doc.compliance_report.ot_report.checked = true;
                } else if (this.rowCheckedAll) {
                  doc.compliance_report.ot_report.checked = this.isRowChecked(
                    doc._id,
                    isSheetInclude
                  );
                }
                doc?.compliance_report?.sheet_types?.push('ot_report');
              }
              if (doc.compliance_report?.incentive_report) {
                const isSheetInclude =
                  this.earning_sheet_type_selection[doc._id]?.includes(
                    'incentive_report'
                  );
                if (!this.rowCheckedAll && isSheetInclude) {
                  doc.compliance_report.incentive_report.checked = true;
                } else if (this.rowCheckedAll) {
                  doc.compliance_report.incentive_report.checked =
                    this.isRowChecked(doc._id, isSheetInclude);
                }
                doc?.compliance_report?.sheet_types?.push('incentive_report');
              }
              if (doc.compliance_report?.supplement_salary_report) {
                const isSheetInclude = this.earning_sheet_type_selection[
                  doc._id
                ]?.includes('supplement_salary_report');
                if (!this.rowCheckedAll && isSheetInclude) {
                  doc.compliance_report.supplement_salary_report.checked = true;
                } else if (this.rowCheckedAll) {
                  doc.compliance_report.supplement_salary_report.checked =
                    this.isRowChecked(doc._id, isSheetInclude);
                }
                doc?.compliance_report?.sheet_types?.push(
                  'supplement_salary_report'
                );
              }
              if (doc.compliance_report?.bonus_report) {
                const isSheetInclude =
                  this.earning_sheet_type_selection[doc._id]?.includes(
                    'bonus_report'
                  );
                if (!this.rowCheckedAll && isSheetInclude) {
                  doc.compliance_report.bonus_report.checked = true;
                } else if (this.rowCheckedAll) {
                  doc.compliance_report.bonus_report.checked =
                    this.isRowChecked(doc._id, isSheetInclude);
                }
                doc?.compliance_report?.sheet_types?.push('bonus_report');
              }
              if (doc.compliance_report?.arrear_report) {
                const isSheetInclude =
                  this.earning_sheet_type_selection[doc._id]?.includes(
                    'arrear_report'
                  );
                if (!this.rowCheckedAll && isSheetInclude) {
                  doc.compliance_report.arrear_report.checked = true;
                } else if (this.rowCheckedAll) {
                  doc.compliance_report.arrear_report.checked =
                    this.isRowChecked(doc._id, isSheetInclude);
                }
                doc?.compliance_report?.sheet_types?.push('arrear_report');
              }
            }
          });

          this.employeePaginationOptions = {
            hasNextPage: res.master_data.hasNextPage,
            hasPrevPage: res.master_data.hasPrevPage,
            limit: res.master_data.limit,
            nextPage: res.master_data.nextPage,
            page: res.master_data.page,
            pagingCounter: res.master_data.pagingCounter,
            prevPage: res.master_data.prevPage,
            totalDocs: res.master_data.totalDocs,
            totalPages: res.master_data.totalPages,
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

  formatmonth() {
    if (this.getPayload().wage_month) {
      return Global.monthMaster.find(
        (m) => m.index == this.getPayload().wage_month
      )?.description;
    } else {
      return 'N/A';
    }
  }

  async generateEmployeePayslip(e: any) {
    try {
      this.spinner.show();
      let payload = this.getPayload();
      payload.branch = this.employeeFilter?.branch_id ?? '';
      payload.branch_id = '';
      payload.earning_sheet_type_selection = this.earning_sheet_type_selection;
      if (payload.compliance_type == 'arrear') {
        payload.sheet_type = payload.compliance_type;
      }
      // let model = {
      //   emp_ids: JSON.parse(payload.checked_row_ids),
      //   wage_month: payload.wage_month,
      //   wage_year:payload.wage_year,
      // };
      // JSON.parse(payload.checked_row_ids)?.forEach((id:any) => {
      //   let checkboxs: any = document.querySelectorAll(
      //     '[checkbox-value="' + id +'"]'
      //   );
      //   const el = checkboxs.entries().find((e:any) => e[1]?.checked == true)?.[1] || null
      //   const empIndex = parseInt(el.getAttribute('emp-index')) ?? null
      //   const sheetIndex = parseInt(el.getAttribute('sheet-index')) ?? null
      //   if(empIndex && sheetIndex){
      //     const sheet_type = this.employeesListing[empIndex]?.employee?.compliance_report[sheetIndex] || null
      //     payload.earning_sheet_type_selection.push([])
      //   }
      // })
      let resp = await this.companyuserservice
        .generateChallanData(payload)
        .toPromise();

      if (resp.status !== 'success') throw resp;
      this.spinner.hide();
      this.fetchEmployeeList();
      return this.toastr.success(resp.message);
    } catch (err: any) {
      this.spinner.hide();
      if (err.status == 'val_err') {
        return this.toastr.error(Global.showValidationMessage(err.val_msg));
      }
      return this.toastr.error(err?.message || err);
    }
  }

  get maxSheets() {
    return Math.max(
      ...this.employeesListing.map(
        (emp) => emp.compliance_report.sheet_types.length
      )
    );
  }

  modifyEarningSelectionObject(
    employeeId: any,
    sheet_type:
      | 'salary_report'
      | 'ot_report'
      | 'incentive_report'
      | 'supplement_salary_report'
      | 'bonus_report',
    action: 'add' | 'remove'
  ) {
    let arr = this.earning_sheet_type_selection[employeeId] || null;
    if (arr) {
      if (action == 'add') {
        arr.push(sheet_type);
      } else {
        let index = arr.indexOf(sheet_type);
        if (index > -1) {
          arr.splice(index, 1); // Removes the item at the found index
        }
      }
    } else {
      if (action == 'add') {
        arr = [];
        arr?.push(sheet_type);
      }
    }
    if (arr.length) {
      this.earning_sheet_type_selection[employeeId] = arr;
    } else {
      delete this.earning_sheet_type_selection[employeeId];
    }

    console.log(this.earning_sheet_type_selection);
  }
}
