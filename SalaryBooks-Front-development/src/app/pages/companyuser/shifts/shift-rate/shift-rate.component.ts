import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  UntypedFormArray,
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { CompanyuserService } from 'src/app/services/companyuser.service';
import * as Global from 'src/app/globals';
import { DatePipe } from '@angular/common';
import PaginationOptions from 'src/app/models/PaginationOptions';
import { AppComponent } from 'src/app/app.component';
import { Router } from '@angular/router';

@Component({
  selector: 'companyuser-app-shift-rate',
  templateUrl: './shift-rate.component.html',
  styleUrls: ['./shift-rate.component.css'],
})
export class CMPShiftRateComponent implements OnInit {
  Global = Global;

  dtOptions: DataTables.Settings = {};
  paginationOptions: PaginationOptions;
  searchForm: UntypedFormGroup;
  shiftRateForm: UntypedFormGroup;

  departmentMaster: any[] = [];
  designationMaster: any[] = [];
  branchMaster: any[] = [];
  clientMaster: any[] = [];
  shiftMaster: any[] = [];
  employeeList: any[] = [];

  rowCheckedAll: Boolean = false;
  checkedRowIds: any[] = [];
  uncheckedRowIds: any[] = [];

  editOptionConfig: any = null;
  editEmployeeId: any = null;
  employeeDetails: any = null;

  constructor(
    private formBuilder: UntypedFormBuilder,
    private titleService: Title,
    private companyuserService: CompanyuserService,
    private toastr: ToastrService,
    private spinner: NgxSpinnerService,
    private datePipe: DatePipe,
    private AppComponent: AppComponent,
    private router: Router
  ) {
    this.paginationOptions = {
      hasNextPage: false,
      hasPrevPage: false,
      limit: Global.DataTableLength,
      nextPage: null,
      page: 1,
      pagingCounter: 1,
      prevPage: null,
      totalDocs: 0,
      totalPages: 1,
    };

    this.searchForm = formBuilder.group({
      emp_name: [null],
      emp_id: [null],
      department: [null],
      designation: [null],
      branch: [null],
      client: [null],
    });

    this.shiftRateForm = formBuilder.group({
      shift_rate: this.formBuilder.array([this.initTemplateRows('shift_rate')]),
    });
  }

  /** START OF TEMPLATE ROWS */

  initTemplateRows(type: any, data: any = {}) {
    switch (type) {
      case 'shift_rate':
        return this.formBuilder.group({
          shift_id: [
            data?.shift_id ?? null,
            Validators.compose([Validators.required]),
          ],
          rate: [
            data?.rate ?? null,
            Validators.compose([
              Validators.required,
              Validators.pattern('^[0-9]+(.[0-9]{0,2})?$'),
            ]),
          ],
        });
        break;

      default:
        return this.formBuilder.group({});
        break;
    }
  }

  getTemplateRows(type: any) {
    return (this.shiftRateForm.get(type) as UntypedFormArray).controls;
  }

  removeTemplateRow(type: any, i: number) {
    const control = <UntypedFormArray>this.shiftRateForm.get(type);
    control.removeAt(i);
  }

  addTemplateRows(type: any, data: any = {}) {
    const control = <UntypedFormArray>this.shiftRateForm.get(type);
    control.push(this.initTemplateRows(type, data));

    Global.loadCustomScripts('customJsScript');
  }

  resetAllTemplateRows(isEditing: any = false) {
    let arr = ['shift_rate'];
    arr.forEach((element) => {
      const control = <UntypedFormArray>this.shiftRateForm.get(element);
      control.clear();
    });

    if (isEditing == false) {
      arr.forEach((element) => {
        this.addTemplateRows(element);
      });
    }
  }

  /** END OF TEMPLATE ROWS */

  async ngOnInit() {
    this.titleService.setTitle(
      'Manage Rate | Shift Management - ' + Global.AppName
    );

    if (
      !Global.checkCompanyModulePermission({
        company_module: 'shift_management',
        company_operation: 'manage_shift_rate',
        company_sub_module:'define_shift_allowance',
        company_sub_operation:['view']
      })
    ) {
      setTimeout(() => {
        this.router.navigate(['company/errors/unauthorized-access'], {
          skipLocationChange: true,
        });
      }, 500);
      return;
    }

    await this.fetchShiftMaster();
    await this.fetchMasters();
    this.fetch();
  }

  fetchMasters() {
    return new Promise((resolve, reject) => {
      this.spinner.show();
      this.companyuserService.getEmployeeMaster().subscribe(
        (res: any) => {
          if (res.status == 'success') {
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
              res.masters.branch.company_branch &&
              Array.isArray(res.masters.branch.company_branch)
            ) {
              this.branchMaster = [];
              res.masters.branch.company_branch.forEach((element: any) => {
                this.branchMaster.push({
                  id: element._id,
                  description: element.branch_name,
                });
              });
            }

            if (res.masters.clients && Array.isArray(res.masters.clients)) {
              this.clientMaster = [];
              res.masters.clients.forEach((element: any) => {
                this.clientMaster.push({
                  id: element._id,
                  description: element.client_name,
                  code: element.client_code,
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

  fetchShiftMaster() {
    return new Promise((resolve, reject) => {
      this.spinner.show();
      this.companyuserService.getActiveShift().subscribe(
        (res: any) => {
          if (res.status == 'success') {
            if (res.shift && Array.isArray(res.shift)) {
              this.shiftMaster = [];
              res.shift.forEach((element: any) => {
                this.shiftMaster.push({
                  id: element._id,
                  description: element.shift_name,
                });
              });
            }
          } else {
            this.toastr.error(res.message);
          }

          $('#my-datatable')
            .dataTable()
            .api()
            .ajax.reload(function (json) {}, false);
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
  employeeListFilter: any = {};
  getPayload() {
    let payload: any = {
      row_checked_all: this.rowCheckedAll,
      checked_row_ids: JSON.stringify(this.checkedRowIds),
      unchecked_row_ids: JSON.stringify(this.uncheckedRowIds),
      department_id: this.employeeListFilter?.department_id ?? '',
      designation_id: this.employeeListFilter?.designation_id ?? '',
      searchkey: this.employeeListFilter?.searchkey ?? '',
      branch_id: this.employeeListFilter?.branch_id ?? '',
      emp_id: this.employeeListFilter?.emp_id ?? '',
      emp_name: this.employeeListFilter?.emp_name ?? '',
      client_code: this.employeeListFilter?.client_code ?? '',
      pageno: this.paginationOptions.page,
      perpage:this.paginationOptions.limit
    };
    return payload;
  }

  fetch(page?: any, options?: any) {
    this.employeeListFilter = options;
    if (page != null) {
      this.paginationOptions.page = page;
    }

    let payload = { pageno: this.paginationOptions.page, ...this.getPayload() };

    // let designation_id: any[] = [];
    // if (this.searchForm.value?.designation && Array.isArray(this.searchForm.value?.designation) && this.searchForm.value?.designation.length > 0) {
    //     this.searchForm.value?.designation.forEach((element: any) => {
    //         designation_id.push(element.id);
    //     });
    // }

    // let department_id: any[] = [];
    // if (this.searchForm.value?.department && Array.isArray(this.searchForm.value?.department) && this.searchForm.value?.department.length > 0) {
    //     this.searchForm.value?.department.forEach((element: any) => {
    //         department_id.push(element.id);
    //     });
    // }

    // let branch_id: any[] = [];
    // if (this.searchForm.value?.branch && Array.isArray(this.searchForm.value?.branch) && this.searchForm.value?.branch.length > 0) {
    //     this.searchForm.value?.branch.forEach((element: any) => {
    //         branch_id.push(element.id);
    //     });
    // }

    // let client_code: any[] = [];
    // if (this.searchForm.value?.client && Array.isArray(this.searchForm.value?.client) && this.searchForm.value?.client.length > 0) {
    //     this.searchForm.value?.client.forEach((element: any) => {
    //         client_code.push(element.code);
    //     });
    // }

    this.spinner.show();
    this.companyuserService.fetchShiftEmployee(payload).subscribe(
      (res: any) => {
        this.spinner.hide();
        if (res.status == 'success') {
          this.employeeList = res?.employees?.docs ?? [];
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
          this.paginationOptions = {
            hasNextPage: false,
            hasPrevPage: false,
            limit: Global.DataTableLength,
            nextPage: null,
            page: 1,
            pagingCounter: 1,
            prevPage: null,
            totalDocs: 0,
            totalPages: 1,
          };

          this.toastr.error(res.message);
        }
      },
      (err) => {
        this.paginationOptions = {
          hasNextPage: false,
          hasPrevPage: false,
          limit: Global.DataTableLength,
          nextPage: null,
          page: 1,
          pagingCounter: 1,
          prevPage: null,
          totalDocs: 0,
          totalPages: 1,
        };

        this.spinner.hide();
        this.toastr.error(Global.showServerErrorMessage(err));
      }
    );
  }

  resetDataTableFilter() {
    Global.resetForm(this.searchForm);
  }

  isRowChecked(rowId: any) {
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

    $('#my-datatable')
      .dataTable()
      .api()
      .ajax.reload(function (json) {}, false);
  }

  getShiftInfo(shift_id: any) {
    return (
      this.shiftMaster.find((obj: any) => {
        return obj.id == shift_id;
      }) ?? null
    );
  }

  getEdit(item: any) {
    this.cancelEntry(true);

    this.shiftMaster.forEach((element) => {
      let data: any = {
        shift_id: element.id,
        rate: this.pluckShiftRate(item?.shift_rate ?? [], element.id),
      };

      this.addTemplateRows('shift_rate', data);
    });

    this.employeeDetails = item;
    this.startEditing('single', item._id);
  }

  cancelEntry(isEditing: any = false) {
    this.employeeDetails = null;
    this.resetAllTemplateRows(isEditing);
    Global.resetForm(this.shiftRateForm);

    this.editOptionConfig = null;
    this.editEmployeeId = null;
  }

  pluckShiftRate(shift_rate: any, shift_id: any) {
    if (shift_rate && shift_rate instanceof Array && shift_id) {
      return (
        shift_rate.find((obj: any) => {
          return obj.shift_id == shift_id;
        })?.rate ?? null
      );
    }

    return null;
  }

  startEditing(option: any, employee_id: any = null) {
    switch (option) {
      case 'single':
        if (!employee_id) {
          this.toastr.error('No employee id received at function startEditing');
          return;
        }

        this.editOptionConfig = 'single';
        this.editEmployeeId = employee_id;
        break;

      case 'multiple':
        this.cancelEntry(true);
        this.editOptionConfig = 'multiple';

        this.shiftMaster.forEach((element) => {
          let data: any = {
            shift_id: element.id,
            rate: null,
          };

          this.addTemplateRows('shift_rate', data);
        });
        break;

      default:
        this.toastr.error('Invalid option received at funtion startEditing');
        return;
        break;
    }

    $('#editShiftRateModalButton').click();
  }

  updateShiftRate(event: any) {
    this.shiftRateForm.markAllAsTouched();
    setTimeout(() => {
      Global.scrollToQuery('p.error-element');
    }, 300);

    if (this.shiftRateForm.valid) {
      let employee_id: any = null;
      let rowCheckedAll: Boolean = false;
      let checkedRowIds: any[] = [];
      let uncheckedRowIds: any[] = [];

      switch (this.editOptionConfig) {
        case 'single':
          checkedRowIds.push(this.editEmployeeId);
          employee_id = this.editEmployeeId;
          break;

        case 'multiple':
          rowCheckedAll = this.rowCheckedAll;
          checkedRowIds = this.checkedRowIds;
          uncheckedRowIds = this.uncheckedRowIds;
          break;

        default:
          this.toastr.error('The update option is not supported');
          return;
      }

      event.target.classList.add('btn-loading');
      this.companyuserService
        .updateShiftRate({
          shift_rate: JSON.stringify(this.shiftRateForm.value.shift_rate),
          emp_id: employee_id ?? '',
          editOptionConfig: this.editOptionConfig,
          row_checked_all: rowCheckedAll,
          checked_row_ids: JSON.stringify(checkedRowIds),
          unchecked_row_ids: JSON.stringify(uncheckedRowIds),
        })
        .subscribe(
          (res) => {
            if (res.status == 'success') {
              this.toastr.success(res.message);
              this.fetch();
              $('#editShiftRateModal')?.find('[data-dismiss="modal"]')?.click();

              // this.cancelEditShift();
              // $('#my-datatable').dataTable().api().ajax.reload(function (json) { }, false);
            } else if (res.status == 'val_err') {
              this.toastr.error(Global.showValidationMessage(res.val_msg));
            } else {
              this.toastr.error(res.message);
            }

            event.target.classList.remove('btn-loading');
          },
          (err) => {
            event.target.classList.remove('btn-loading');
            this.toastr.error(Global.showServerErrorMessage(err));
          }
        );
    }
  }
}
