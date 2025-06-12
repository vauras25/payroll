import { DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { AppComponent } from 'src/app/app.component';
import * as Global from 'src/app/globals';
import PaginationOptions from 'src/app/models/PaginationOptions';
import { CompanyuserService } from 'src/app/services/companyuser.service';

@Component({
  selector: 'companyuser-app-shift-batch',
  templateUrl: './shift-batch.component.html',
  styleUrls: ['./shift-batch.component.css'],
})
export class CMPShiftBatchComponent implements OnInit {
  dtOptions: DataTables.Settings = {};
  employeeListPaginationOptions: PaginationOptions;
  editShiftEmployeeForm: UntypedFormGroup;

  shiftMaster: any[] = [];
  shiftEmployeeList: any[] = [];

  shiftDetails: any = null;
  editEmployeeId: any = null;
  pershiftItem: any = {};
  rowCheckedAll: any = false;
  checkedRowIds: any = [];
  uncheckedRowIds: any = [];
  Global: any = Global;
  constructor(
    private titleService: Title,
    protected companyuserService: CompanyuserService,
    private toastr: ToastrService,
    private spinner: NgxSpinnerService,
    public router: Router,
    private datePipe: DatePipe,
    private formBuilder: UntypedFormBuilder,
    private AppComponent: AppComponent
  ) {
    this.employeeListPaginationOptions = {
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

    this.editShiftEmployeeForm = formBuilder.group({
      shift_id: [null, Validators.compose([Validators.required])],
      shift_start_date: [null, Validators.compose([Validators.required])],
      shift_end_date: [null, Validators.compose([Validators.required])],
      emp_id: [null],
    });
  }

  ngOnInit(): void {
    this.titleService.setTitle('Batch | Shift Management - ' + Global.AppName);

    if (
      !Global.checkCompanyModulePermission({
        company_module: 'shift_management',
        company_operation: 'employee_shift_add',
        company_sub_module:'manage_shift_batch',
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

    this.fetchShifts();
    this.fetchShiftMaster();
  }

  fetchShifts() {
    this.dtOptions = {
      ajax: (dataTablesParameters: any, callback) => {
        this.companyuserService
          .fetchShifts({
            pageno: Math.floor(
              (dataTablesParameters.start + dataTablesParameters.length) /
                dataTablesParameters.length
            ),
            perpage: dataTablesParameters.length,
            searchkey: dataTablesParameters.search.value,
            sortbyfield: Global.getTableSortingOptions(
              'sortbyfield',
              dataTablesParameters
            ),
            ascdesc: Global.getTableSortingOptions(
              'ascdesc',
              dataTablesParameters
            ),
          })
          .subscribe(
            (res) => {
              if (res.status == 'success') {
                callback({
                  recordsTotal: res.shift.totalDocs,
                  recordsFiltered: res.shift.totalDocs,
                  data: res.shift.docs,
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
            let html = ``;

            html += `<button class="btn btn-dark btn-icon mx-1" data-toggle="tooltip" data-placement="top" title="Assigned Employees" id="assigned-emps-view">
                        <div style="width:25px; height:25px;"><i class="fa fa-users"></i></div>
                    </button>`;

            return html;
          },
          orderable: false,
          className: 'text-center',
        },
        {
          render: function (data, type, full, meta) {
            return full.shift_name;
          },
          orderable: true,
          name: 'shift_name',
        },
        {
          render: function (data, type, full, meta) {
            return full.shift1_start_time ?? 'N/A';
          },
          orderable: true,
          name: 'shift1_start_time',
        },
        {
          render: function (data, type, full, meta) {
            return full.shift1_end_time ?? 'N/A';
          },
          orderable: true,
          name: 'shift1_end_time',
        },
        {
          render: function (data, type, full, meta) {
            return full.shift2_start_time ?? 'N/A';
          },
          orderable: true,
          name: 'shift2_start_time',
        },
        {
          render: function (data, type, full, meta) {
            return full.shift2_end_time ?? 'N/A';
          },
          orderable: true,
          name: 'shift2_end_time',
        },
        {
          render: function (data, type, full, meta) {
            switch (full.status) {
              case 'active':
                return `<span class="badge badge-success badge-sm">Active</span>`;
                break;

              case 'inactive':
                return `<span class="badge badge-warning badge-sm">Inactive</span>`;
                break;

              default:
                return (
                  `<span class="badge badge-grey badge-sm text-uppercase">` +
                  full.status +
                  `</span>`
                );
                break;
            }
          },
          orderable: true,
          name: 'status',
        },
      ],
      drawCallback: function (settings) {
        Global.loadCustomScripts('customJsScript');
      },
      rowCallback: (row: Node, data: any[] | Object, index: number) => {
        const self = this;

        $('#assigned-emps-view', row).bind('click', () => {
          self.pershiftItem = data;
          self.fetchAssignedEmployee(data);
        });

        return row;
      },
      pagingType: 'full_numbers',
      serverSide: true,
      processing: true,
      ordering: true,
      searching: true,
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

  async fetchAssignedEmployee(shift: any) {
    this.shiftDetails = shift;

    this.shiftEmployeeList = [];
    await this.fetchShiftDetails(this.shiftDetails._id);
    this.resetCheckBox();

    $('#shiftEmployeeModalOpenButton').click();
  }

  fetchShiftDetails(shift_id: any, page: any = null) {
    return new Promise((resolve, reject) => {
      if (page != null) {
        this.employeeListPaginationOptions.page = page;
      }

      this.spinner.show();
      this.companyuserService
        .fetchShiftDetails({
          shift_id: shift_id,
          pageno: this.employeeListPaginationOptions.page,
        })
        .subscribe(
          (res: any) => {
            this.spinner.hide();
            if (res.status == 'success') {
              let docs: any[] = res?.employeelist?.docs ?? [];
              docs.forEach((doc: any) => {
                doc.checked = this.isRowChecked(doc.emp_id);
              });
              this.shiftEmployeeList = docs;
              this.employeeListPaginationOptions = {
                hasNextPage: res.employeelist.hasNextPage,
                hasPrevPage: res.employeelist.hasPrevPage,
                limit: res.employeelist.limit,
                nextPage: res.employeelist.nextPage,
                page: res.employeelist.page,
                pagingCounter: res.employeelist.pagingCounter,
                prevPage: res.employeelist.prevPage,
                totalDocs: res.employeelist.totalDocs,
                totalPages: res.employeelist.totalPages,
              };

              resolve(true);
            } else {
              this.employeeListPaginationOptions = {
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
              resolve(false);
            }
          },
          (err) => {
            this.employeeListPaginationOptions = {
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
            resolve(false);
          }
        );
    });
  }

  getEmployeeShiftEdit(item: any) {
    this.cancelEditEmployeeShift();

    var datePipe = new DatePipe('en-US');
    this.editShiftEmployeeForm.patchValue({
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

    this.editEmployeeId = item._id;
    $('#editEmployeeShiftModalButton').click();
  }

  cancelEditEmployeeShift() {
    Global.resetForm(this.editShiftEmployeeForm);

    this.editEmployeeId = null;
  }

  updateEmployeeShift(event: any) {
    this.editShiftEmployeeForm.markAllAsTouched();
    setTimeout(() => {
      Global.scrollToQuery('p.error-element');
    }, 300);

    if (this.editShiftEmployeeForm.valid) {
      event.target.classList.add('btn-loading');

      this.companyuserService
        .updateShiftEmployee({
          shift_id: this.editShiftEmployeeForm.value.shift_id?.id ?? '',
          shift_start_date:
            this.editShiftEmployeeForm.value.shift_start_date ?? '',
          shift_end_date: this.editShiftEmployeeForm.value.shift_end_date ?? '',
          emp_id: this.editEmployeeId,
          editOptionConfig: 'single',
        })
        .subscribe(
          (res) => {
            if (res.status == 'success') {
              this.toastr.success(res.message);
              this.cancelEditEmployeeShift();
              this.fetchShiftDetails(this.shiftDetails._id);
              $('#editEmployeeShiftModal')
                ?.find('[data-dismiss="modal"]')
                ?.click();
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
    this.fetchShiftDetails(this.shiftDetails._id);
  }
  private isRowChecked(rowId: any) {
    if (!this.rowCheckedAll)
      return this.checkedRowIds.indexOf(rowId) >= 0 ? true : false;
    else return this.uncheckedRowIds.indexOf(rowId) >= 0 ? false : true;
  }
  anyRowsChecked(): boolean {
    return (
      this.rowCheckedAll == true ||
      this.checkedRowIds.length > 0 ||
      this.uncheckedRowIds.length > 0
    );
  }

  exportAll() {
    let payload: any = {
      unchecked_row_ids: this.uncheckedRowIds,
      checked_row_ids: this.checkedRowIds,
      row_checked_all: this.rowCheckedAll.toString(),
      pageno: 1,
      generate: 'excel',
      shift_id: this.shiftDetails?._id,
    };
    this.companyuserService.downloadFile(
      'shift-details',
      'shift-batch-report',
      payload
    );
    // .subscribe(res => {
    //   if (res.status == 'success') {
    //   location.href=  res?.url;
    //   } else if (res.status == 'val_err') {
    //     this.toastr.error(Global.showValidationMessage(res.val_msg));
    //   } else {
    //     this.toastr.error(res.message);
    //   }

    // }, (err) => {
    //   this.toastr.error(Global.showServerErrorMessage(err));
    // });
  }
  resetCheckBox() {
    this.rowCheckedAll = false;
    this.checkedRowIds = [];
    this.uncheckedRowIds = [];
  }
}
