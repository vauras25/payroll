import { Component, OnDestroy, OnInit } from '@angular/core';
import {
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
import { AppComponent } from 'src/app/app.component';
import { Router } from '@angular/router';

@Component({
  selector: 'companyuser-app-shift-add',
  templateUrl: './shift-add.component.html',
  styleUrls: ['./shift-add.component.css'],
})
export class CMPShiftAddComponent implements OnInit {
  Global = Global
  dtOptions: DataTables.Settings = {};
  searchForm: UntypedFormGroup;
  editShiftForm: UntypedFormGroup;

  departmentMaster: any[] = [];
  designationMaster: any[] = [];
  branchMaster: any[] = [];
  clientMaster: any[] = [];
  shiftMaster: any[] = [];

  rowCheckedAll: Boolean = false;
  checkedRowIds: any[] = [];
  uncheckedRowIds: any[] = [];

  editOptionConfig: any = null;
  editEmployeeId: any = null;

  constructor(
    private formBuilder: UntypedFormBuilder,
    private titleService: Title,
    private companyuserService: CompanyuserService,
    private toastr: ToastrService,
    private spinner: NgxSpinnerService,
    private datePipe: DatePipe,
    public AppComponent: AppComponent,
    private router: Router
  ) {
    this.searchForm = formBuilder.group({
      emp_name: [null],
      emp_id: [null],
      department: [null],
      designation: [null],
      branch: [null],
      client: [null],
    });

    this.editShiftForm = formBuilder.group({
      shift_id: [null, Validators.compose([Validators.required])],
      shift_start_date: [null, Validators.compose([Validators.required])],
      shift_end_date: [null, Validators.compose([Validators.required])],
      emp_id: [null],
    });
  }

  async ngOnInit() {
    this.titleService.setTitle('Edit | Shift Management - ' + Global.AppName);

    if (
      !Global.checkCompanyModulePermission({
        company_module: 'shift_management',
        company_operation: 'setup_shift',
        company_sub_module:'allocate_shift',
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

    await this.fetch();
    await this.fetchShiftMaster();
    await this.fetchMasters();
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
    };
    return payload;
  }

  fetch() {
    const _this = this;
    return new Promise((resolve, reject) => {
      this.dtOptions = {
        ajax: (dataTablesParameters: any, callback) => {
          if (dataTablesParameters.search.value != '') {
            this.resetDataTableFilter();
          }

          // let designation_id: any[] = [];
          // if (this.searchForm.value?.designation && Array.isArray(this.searchForm.value?.designation) && this.searchForm.value?.designation.length > 0) {
          //   this.searchForm.value?.designation.forEach((element: any) => {
          //     designation_id.push(element.id);
          //   });
          // }

          // let department_id: any[] = [];
          // if (this.searchForm.value?.department && Array.isArray(this.searchForm.value?.department) && this.searchForm.value?.department.length > 0) {
          //   this.searchForm.value?.department.forEach((element: any) => {
          //     department_id.push(element.id);
          //   });
          // }

          // let branch_id: any[] = [];
          // if (this.searchForm.value?.branch && Array.isArray(this.searchForm.value?.branch) && this.searchForm.value?.branch.length > 0) {
          //   this.searchForm.value?.branch.forEach((element: any) => {
          //     branch_id.push(element.id);
          //   });
          // }

          // let client_code: any[] = [];
          // if (this.searchForm.value?.client && Array.isArray(this.searchForm.value?.client) && this.searchForm.value?.client.length > 0) {
          //   this.searchForm.value?.client.forEach((element: any) => {
          //     client_code.push(element.code);
          //   // console.log(element);

          //   });
          // }

          let payload = {
            ...this.getPayload(),
            pageno: Math.floor(
              (dataTablesParameters.start + dataTablesParameters.length) /
                dataTablesParameters.length
            ),
            perpage: dataTablesParameters.length,
            // searchkey: dataTablesParameters.search.value,
          };
          this.companyuserService.fetchShiftEmployee(payload).subscribe(
            (res) => {
              if (res.status == 'success') {
                var docs: any[] = res.employees.docs;

                docs.forEach((doc: any) => {
                  doc.checked = this.isRowChecked(doc._id);
                });

                callback({
                  recordsTotal: res.employees.totalDocs,
                  recordsFiltered: res.employees.totalDocs,
                  data: docs,
                });
              } else {
                this.toastr.error(res.message);

                callback({
                  recordsTotal: 0,
                  recordsFiltered: 0,
                  data: [],
                });
              }
            },
            (err) => {
              this.toastr.error(Global.showServerErrorMessage(err));

              callback({
                recordsTotal: 0,
                recordsFiltered: 0,
                data: [],
              });
            }
          );
        },
        columns: [
          {
            render: function (data, type, full, meta: any) {
              return meta.settings._iDisplayStart + (meta.row + 1);
            },
            orderable: false,
          },
          {
            render: function (data, type, full, meta) {
              let checked = full.checked == true ? 'checked' : '';
              return (
                `<input type="checkbox" ` +
                checked +
                ` id="checkrow-` +
                meta.row +
                `" data-checkbox-id="` +
                full._id +
                `">`
              );
            },
            orderable: false,
          },
          {
            render: function (data, type, full, meta) {
              let html = ``;
              if(Global.checkCompanyModulePermission({
                company_module: 'shift_management',
                company_operation: 'setup_shift',
                company_sub_module:'allocate_shift',
                company_sub_operation:['edit']
              })){
                html +=
                  `<button action-data="` +
                  full._id +
                  `" class="btn btn-primary btn-icon mx-1" data-toggle="tooltip" data-placement="top" title="Edit" id="edit-button">
                            <div style="width:25px; height:25px;"><i class="fa fa-pen"></i></div>
                        </button>`;
              }

              return html;
            },
            orderable: false,
            className: 'text-center',
          },
          {
            render: function (data, type, full, meta) {
              return full.emp_first_name + ' ' + full.emp_last_name;
            },
            orderable: true,
            name: 'emp_first_name',
          },
          {
            render: function (data, type, full, meta) {
            // console.log(full?.emp_id);

              return full?.emp_id ?? 'N/A';
            },
            orderable: true,
            name: 'emp_id',
          },
          {
            render: function (data, type, full, meta) {
              let shift_id = full.shift?.shift_id;
              if (shift_id) {
                let shift = _this.getShiftInfo(full.shift?.shift_id);
                return shift?.description ?? 'N/A';
              } else {
                return 'N/A';
              }
            },
            orderable: false,
            name: 'shift',
          },
          {
            render: function (data, type, full, meta) {
              if (full.shift?.shift_start_date) {
                var datePipe = new DatePipe('en-US');
                let value = datePipe.transform(
                  full.shift?.shift_start_date,
                  'dd/MM/yyyy'
                );
                return value;
              } else {
                return 'N/A';
              }
            },
            orderable: false,
            name: 'shift',
          },
          {
            render: function (data, type, full, meta) {
              if (full.shift?.shift_end_date) {
                var datePipe = new DatePipe('en-US');
                let value = datePipe.transform(
                  full.shift?.shift_end_date,
                  'dd/MM/yyyy'
                );
                return value;
              } else {
                return 'N/A';
              }
            },
            orderable: false,
            name: 'shift',
          },
        ],
        drawCallback: function (settings) {
          Global.loadCustomScripts('customJsScript');
          resolve(true);
        },
        rowCallback: (row: Node, data: any[] | Object, index: number) => {
          const self = this;

          $('table').on('click', '#checkrow-' + index, function () {
            self.rowCheckBoxChecked(event, data);
          });

          $('#edit-button', row).bind('click', () => {
            self.getEdit(data);
          });

          return row;
        },
        pagingType: 'full_numbers',
        serverSide: true,
        processing: true,
        ordering: false,
        searching: false,
        pageLength: Global.DataTableLength,
        lengthChange: true,
        lengthMenu: Global.DataTableLengthChangeMenu,
        responsive: true,
        order: [],
        language: {
          searchPlaceholder: 'Search...',
          search: '',
        },
      };
    });
  }

  resetDataTableFilter() {
    Global.resetForm(this.searchForm);
  }

  filterDataTable() {
    $('#my-datatable_filter').find('[type="search"]').val('');
    $('#my-datatable').DataTable().search('').draw();
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
    this.cancelEditShift();

    var datePipe = new DatePipe('en-US');
    this.editShiftForm.patchValue({
      shift_id: this.shiftMaster.find((obj: any) => {
        return obj.id == item.shift?.shift_id ?? null;
      }),
      shift_start_date: item.shift?.shift_start_date
        ? datePipe.transform(item.shift?.shift_start_date, 'yyyy-MM-dd')
        : null,
      shift_end_date: item.shift?.shift_end_date
        ? datePipe.transform(item.shift?.shift_end_date, 'yyyy-MM-dd')
        : null,
    });

    this.startEditing('single', item._id);
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
        this.cancelEditShift();
        this.editOptionConfig = 'multiple';
        break;

      default:
        this.toastr.error('Invalid option received at funtion startEditing');
        return;
        break;
    }

    $('#editShiftModalButton').click();
  }

  updateShift(event: any) {
    this.editShiftForm.markAllAsTouched();
    setTimeout(() => {
      Global.scrollToQuery('p.error-element');
    }, 300);

    if (this.editShiftForm.valid) {
      let employee_id: any = null;
      let rowCheckedAll: Boolean = false;
      let checkedRowIds: any[] = [];
      let uncheckedRowIds: any[] = [];
      switch (this.editOptionConfig) {
        case 'single':
          employee_id = this.editEmployeeId;
          break;

        case 'multiple':
          rowCheckedAll = this.rowCheckedAll;
          checkedRowIds = this.checkedRowIds;
          uncheckedRowIds = this.uncheckedRowIds;
          break;

        default:
          this.toastr.error('The edit option is not supported.');
          return;
          break;
      }

      event.target.classList.add('btn-loading');

      this.companyuserService
        .updateShiftEmployee({
          shift_id: this.editShiftForm.value.shift_id?.id ?? '',
          shift_start_date: this.editShiftForm.value.shift_start_date ?? '',
          shift_end_date: this.editShiftForm.value.shift_end_date ?? '',
          row_checked_all: rowCheckedAll,
          checked_row_ids: JSON.stringify(checkedRowIds),
          unchecked_row_ids: JSON.stringify(uncheckedRowIds),
          emp_id: employee_id ?? '',
          editOptionConfig: this.editOptionConfig,
        })
        .subscribe(
          (res) => {
            if (res.status == 'success') {
              this.toastr.success(res.message);
              this.cancelEditShift();
              $('#my-datatable')
                .dataTable()
                .api()
                .ajax.reload(function (json) {}, false);
              $('#editShiftModal')?.find('[data-dismiss="modal"]')?.click();
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

  cancelEditShift() {
    Global.resetForm(this.editShiftForm);

    this.editEmployeeId = null;
    this.editOptionConfig = null;
  }
}
