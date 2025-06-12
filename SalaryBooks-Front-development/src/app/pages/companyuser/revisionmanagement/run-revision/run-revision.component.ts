import * as Global from 'src/app/globals';
import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { CompanyuserService } from 'src/app/services/companyuser.service';
import { rejects } from 'assert';
import PaginationOptions from 'src/app/models/PaginationOptions';
import TableFiilterOptions from 'src/app/models/TableFiilterOptions';
import { Title } from '@angular/platform-browser';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'companuuser-app-run-revision',
  templateUrl: './run-revision.component.html',
  styleUrls: ['./run-revision.component.css'],
})
export class CMPRunRevisionComponent implements OnInit {
  Global = Global;
  filterForm: UntypedFormGroup;
  departmentMaster: any[] = [];
  designationMaster: any[] = [];
  branchMaster: any[] = [];
  hodMaster: any[] = [];
  packageMaster: any[] = [];
  salaryTempMaster: any[] = [];
  employees: any[] = [];
  paginationOptions: PaginationOptions = Global.resetPaginationOption();
  tableFilterOptions: TableFiilterOptions = Global.resetTableFilterOptions();
  monthMaster: any[] = [];
  yearMaster: any[] = [];
  sheetMonthYear: {
    month: number;
    year: number;
  };
  employeeListFilter: any = {};

  constructor(
    private spinner: NgxSpinnerService,
    private toastr: ToastrService,
    private companyuserService: CompanyuserService,
    private formBuilder: UntypedFormBuilder,
    private titleService: Title,
    private router:Router
    ) {
  
      if (
        !Global.checkCompanyModulePermission({
          company_module: 'revision_management',
          company_sub_module:'run_arrear',
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
      }
    this.filterForm = formBuilder.group({
      month: [null],
      year: [null],
      department: [null],
      designation: [null],
      branch: [null],
      hod: [null],
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
    this.titleService.setTitle('Update Revision - ' + Global.AppName);

    // this.filterForm.patchValue({
    //     'month': this.monthMaster.find((obj: any) => {
    //         return obj.index == new Date().getM`onth()
    //     }) ?? null,

    //     'year': this.yearMaster.find((obj: any) => {
    //         return obj.value == new Date().getFullYear()
    //     }) ?? null,
    // })

    // this.sheetMonthYear = {
    //     'month': this.filterForm.get('month')?.value?.index,
    //     'year': this.filterForm.get('year')?.value?.value,
    // }

    await this.fetchMasters();
    this.fetchEmployees({ page: 1 });
  }

  getPayload() {
    let payload: any = {
      month: this.employeeListFilter.month?.index ?? '',
      year: this.employeeListFilter.year?.value ?? '',
      row_checked_all: this.rowCheckedAll,
      checked_row_ids: JSON.stringify(this.checkedRowIds),
      unchecked_row_ids: JSON.stringify(this.uncheckedRowIds),
      hod_id: this.employeeListFilter?.hod_id ?? '',
      department_id: this.employeeListFilter?.department_id ?? '',
      designation_id: this.employeeListFilter?.designation_id ?? '',
      branch_id: this.employeeListFilter?.branch_id ?? '',
    };
    return payload;
  }

  fetchEmployees({
    loading = <boolean>true,
    page = <any>null,
    options = <TableFiilterOptions>this.tableFilterOptions,
    tableLengthChanged = <boolean>false,
  } = {}) {
    this.employeeListFilter = options;
    if (page == null) {
      page = this.paginationOptions.page;
    }

    if (tableLengthChanged == true) {
      this.tableFilterOptions = options;
    }

    let payload = {
      perpage: this.tableFilterOptions.length,
      pageno: page,
      searchkey:options?.searchkey || '',
      ...this.getPayload(),
    };


    if (loading == true) this.spinner.show();
    this.companyuserService.getFilteredRevisionEmpList(payload).subscribe(
      (res: any) => {
        if (res.status == 'success') {
          var docs: any[] = res?.employees?.docs;

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

          this.sheetMonthYear = {
            month: this.filterForm.get('month')?.value?.index,
            year: this.filterForm.get('year')?.value?.value,
          };
        } else {
          this.toastr.error(res.message);
          this.paginationOptions = Global.resetPaginationOption();
        }

        if (loading == true) this.spinner.hide();
        Global.loadCustomScripts('customJsScript');
      },
      (err) => {
        if (loading == true) this.spinner.hide();
        this.toastr.error(Global.showServerErrorMessage(err));
        this.paginationOptions = Global.resetPaginationOption();
        Global.loadCustomScripts('customJsScript');
      }
    );
  }

  getFetchPayload() {
    if (this.filterForm.valid) {
      let payload = {};
    }
  }

  fetchMasters() {
    return new Promise((resolve, reject) => {
      this.spinner.show();
      this.companyuserService.getEmployeeMaster().subscribe(
        (res: any) => {
          if (res.status == 'success') {
            this.branchMaster = [];
            if (
              res.masters.branch?.company_branch &&
              Array.isArray(res.masters.branch?.company_branch)
            ) {
              res.masters.branch?.company_branch.forEach((element: any) => {
                this.branchMaster.push({
                  id: element._id,
                  description: element.branch_name,
                });
              });
            }

            if (
              res.masters.designation &&
              Array.isArray(res.masters.designation)
            ) {
              this.designationMaster = [];
              res.masters.designation.forEach((element: any) => {
                this.designationMaster.push({
                  id: element._id,
                  description: element.designation_name,
                });
              });
            }

            if (
              res.masters.department &&
              Array.isArray(res.masters.department)
            ) {
              this.departmentMaster = [];
              res.masters.department.forEach((element: any) => {
                this.departmentMaster.push({
                  id: element._id,
                  description: element.department_name,
                });
              });
            }

            if (
              res.masters.salarytemp &&
              Array.isArray(res.masters.salarytemp)
            ) {
              this.salaryTempMaster = [];
              res.masters.salarytemp.forEach((element: any) => {
                this.salaryTempMaster.push({
                  id: element._id,
                  description: element.template_name,
                });
              });
            }

            if (res.masters.packages && Array.isArray(res.masters.packages)) {
              this.packageMaster = [];
              res.masters.packages.forEach((element: any) => {
                this.packageMaster.push({
                  id: element._id,
                  description: element.package_name,
                });
              });
            }
          } else {
            this.toastr.error(res.message);
          }

          this.spinner.hide();
          resolve(true);
        },
        (err) => {
          this.spinner.hide();
          this.toastr.error(Global.showServerErrorMessage(err));
          resolve(true);
        }
      );
    });
  }

  getMasterValue({
    arrMaster = <any[]>[],
    searchKey = <string>'id',
    searchValue = <any>null,
    returnKey = <string>'description',
  } = {}) {
    return (
      arrMaster.find((obj: any) => {
        return obj[searchKey] == searchValue;
      })?.[returnKey] ?? null
    );
  }

  rowCheckedAll: Boolean = false;
  checkedRowIds: any[] = [];
  uncheckedRowIds: any[] = [];

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

  attendanceRunCompleted: boolean = false;
  payrollRunCompleted: boolean = false;

  initRunAttendancePayroll() {
    if (
      this.rowCheckedAll == false &&
      this.checkedRowIds.length == 0 &&
      this.uncheckedRowIds.length == 0
    ) {
      // this.toastr.error("No Records Selected");
      return;
    }

    this.attendanceRunCompleted = false;
    this.payrollRunCompleted = false;

    $('#runAttendancePayrollButton')?.click();
  }

  runRevisionPayroll(event: any, runType: any) {
    if (
      this.rowCheckedAll == false &&
      this.checkedRowIds.length == 0 &&
      this.uncheckedRowIds.length == 0
    ) {
      this.toastr.error('No Records Selected');
      return;
    }

    let payload = {
      attendance_month: this.sheetMonthYear.month,
      attendance_year: this.sheetMonthYear.year,
      row_checked_all: this.rowCheckedAll,
      checked_row_ids: JSON.stringify(this.checkedRowIds),
      unchecked_row_ids: JSON.stringify(this.uncheckedRowIds),
    };

    // if (runType == 'payroll') {
    //     this.toastr.warning("The section is under maintenance");
    //     return;
    // }

    event.target.classList.add('btn-loading');
    this.companyuserService.runRevisionEmpPayroll(payload, runType).subscribe(
      (res) => {
        event.target.classList.remove('btn-loading');
        if (res.status == 'success') {
          if (runType == 'attendance') {
            this.attendanceRunCompleted = true;
            this.toastr.success(
              'Revision Attendance run completed successfully'
            );
          } else {
            this.payrollRunCompleted = true;
            $('#runAttendancePayroll')?.find('[data-dismiss="modal"]')?.click();
            this.toastr.success('Revision Payroll run completed successfully');
            // this.generateReport();
          }

          // this.rowCheckedAll = false;
          // this.checkedRowIds = [];
          // this.uncheckedRowIds = [];
          // this.fetchEmployees();
        } else {
          this.toastr.error(res.message);
        }
      },
      (err) => {
        event.target.classList.remove('btn-loading');
        this.toastr.error(Global.showServerErrorMessage(err));
      }
    );
  }

  /**
   * REPORT GENERATION FUNCTION
   * ==========================
   */
  reportGenerated: boolean = false;
  generateReport() {
    this.reportGenerated = true;
  }

  getMonthValue(index: any) {
    return (
      this.monthMaster.find((obj) => {
        return obj.index == index;
      }) ?? null
    );
  }
}
