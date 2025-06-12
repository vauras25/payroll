import { Component, OnInit } from '@angular/core';
import { FormArray, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { AppComponent } from 'src/app/app.component';
import * as Global from 'src/app/globals';
import { CompanyuserService } from 'src/app/services/companyuser.service';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-companyuser-incentive-list',
  templateUrl: './incentive-list-refactor.component.html',
  styleUrls: ['./incentive-list-refactor.component.css'],
})
export class CMPIncentiveListRefactorComponent implements OnInit {
  Global = Global;
  dtOptions: DataTables.Settings = {};
  template_fields: any[] = [];


  filterForm: UntypedFormGroup;
  incentiveUpdateForm: UntypedFormGroup;

  departmentMaster: any[];
  designationMaster: any[];
  branchMaster: any[];
  hodMaster: any[];
  exgratiaStatusMaster: any[];
  salaryTempMaster: any[];
  packageMaster: any[];
  letterMaster: any[];
  employeeIdBucket: any[];
  csvFailedIds: any[];
  monthMaster: any[] = [];
  yearMaster: any[] = [];

  rowCheckedAll: Boolean = false;
  checkedRowIds: any[] = [];
  uncheckedRowIds: any[] = [];

  last_emp_id: any = null;
  employeeListFilter: any = null;

  constructor(
    public formBuilder: UntypedFormBuilder,
    private titleService: Title,
    private companyuserService: CompanyuserService,
    private toastr: ToastrService,
    private router: Router,
    private spinner: NgxSpinnerService,
    public AppComponent: AppComponent
  ) {
    this.filterForm = formBuilder.group({
      month: [null, Validators.compose([Validators.required])],
      year: [null, Validators.compose([Validators.required])],

      emp_first_name: [null],
      emp_last_name: [null],
      email_id: [null],
      pan_no: [null],

      department: [null],
      designation: [null],
      branch: [null],
      hod: [null],

      department_id: [null],
      designation_id: [null],
      branch_id: [null],
      hod_id: [null],
    });

    this.incentiveUpdateForm = formBuilder.group({
      incentive_value: [null, Validators.compose([Validators.required])],
      from_date: [null, Validators.compose([])],
      to_date: [null, Validators.compose([])],
    });

    this.departmentMaster = [];
    this.designationMaster = [];
    this.branchMaster = [];
    this.hodMaster = [];
    this.salaryTempMaster = [];
    this.packageMaster = [];
    this.letterMaster = [];
    this.employeeIdBucket = [];
    this.csvFailedIds = [];

    this.exgratiaStatusMaster = [
      { value: 'on', description: 'ON' },
      { value: 'off', description: 'OFF' },
    ];

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

  ngOnInit(): void {
    this.titleService.setTitle('Incentive Management - ' + Global.AppName);

    this.employeeListFilter = {
      month:
        this.monthMaster.find((obj: any) => {
          // return obj.index == 0
          return obj.index == new Date().getMonth();
        }) ?? null,

      year:
        this.yearMaster.find((obj: any) => {
          // return obj.value == 2022
          return obj.value == new Date().getFullYear();
        }) ?? null,
    };

    if (
      !this.AppComponent.checkCompanyModulePermission({
        company_module: 'incentive',
        company_operation: ['add_incentive', 'list_incentive'],
      })
    ) {
      setTimeout(() => {
        this.router.navigate(['company/errors/unauthorized-access'], {
          skipLocationChange: true,
        });
      }, 500);
      return;
    }

    this.fetchMasters();
    this.fetch()
    // if(this.employeeListFilter){
      // this.fetch();
    // }
  }

  filterDataTable(filterPayload?: any) {
    // if (filterPayload) {
      // if (this.filterForm.value.hod != null) {
      //   if (Array.isArray(this.filterForm.value.hod)) {
      //     this.filterForm.value.hod_id = [];
      //     this.filterForm.value.hod.forEach((element: any) => {
      //       this.filterForm.value.hod_id.push(element.id);
      //     });

      //     if (this.filterForm.value.hod_id.length > 0) {
      //       this.filterForm.value.hod_id = JSON.stringify(
      //         this.filterForm.value.hod_id
      //       );
      //     } else {
      //       this.filterForm.value.hod_id = null;
      //     }
      //   } else {
      //     this.filterForm.value.hod_id = this.filterForm.value.hod.id;
      //   }
      // }

      // if (this.filterForm.value.department != null) {
      //   if (Array.isArray(this.filterForm.value.department)) {
      //     this.filterForm.value.department_id = [];
      //     this.filterForm.value.department.forEach((element: any) => {
      //       this.filterForm.value.department_id.push(element.id);
      //     });

      //     if (this.filterForm.value.department_id.length > 0) {
      //       this.filterForm.value.department_id = JSON.stringify(
      //         this.filterForm.value.department_id
      //       );
      //     } else {
      //       this.filterForm.value.department_id = null;
      //     }
      //   } else {
      //     this.filterForm.value.department_id =
      //       this.filterForm.value.department.id;
      //   }
      // }

      // if (this.filterForm.value.designation != null) {
      //   if (Array.isArray(this.filterForm.value.designation)) {
      //     this.filterForm.value.designation_id = [];
      //     this.filterForm.value.designation.forEach((element: any) => {
      //       this.filterForm.value.designation_id.push(element.id);
      //     });

      //     if (this.filterForm.value.designation_id.length > 0) {
      //       this.filterForm.value.designation_id = JSON.stringify(
      //         this.filterForm.value.designation_id
      //       );
      //     } else {
      //       this.filterForm.value.designation_id = null;
      //     }
      //   } else {
      //     this.filterForm.value.designation_id =
      //       this.filterForm.value.designation.id;
      //   }
      // }

      // if (this.filterForm.value.branch != null) {
      //   if (Array.isArray(this.filterForm.value.branch)) {
      //     this.filterForm.value.branch_id = [];
      //     this.filterForm.value.branch.forEach((element: any) => {
      //       this.filterForm.value.branch_id.push(element.id);
      //     });

      //     if (this.filterForm.value.branch_id.length > 0) {
      //       this.filterForm.value.branch_id = JSON.stringify(
      //         this.filterForm.value.branch_id
      //       );
      //     } else {
      //       this.filterForm.value.branch_id =
      //         this.filterForm.value.designation.id;
      //     }
      //   } else {
      //     this.filterForm.value.branch_id = this.filterForm.value.branch.id;
      //   }
      // }

      $('#my-datatable_filter').find('[type="search"]').val('');
      $('#my-datatable').DataTable().search('').draw();
    // }
  }

  resetDataTableFilter() {
    Global.resetForm(this.filterForm);
  }

  getPayload() {
    let payload: any = {
      row_checked_all: this.rowCheckedAll,
      checked_row_ids: JSON.stringify(this.checkedRowIds),
      unchecked_row_ids: JSON.stringify(this.uncheckedRowIds),
      incentive_month: this.employeeListFilter?.month?.index ?? "",
      incentive_year: this.employeeListFilter?.year?.value ?? "",
      department_id: this.employeeListFilter?.department_id ?? '',
      designation_id: this.employeeListFilter?.designation_id ?? '',
      branch_id: this.employeeListFilter?.branch_id ?? '',
    };

    return payload;
  }

  fetch() {
    this.dtOptions = {
      ajax: (dataTablesParameters: any, callback) => {
        if (dataTablesParameters?.search?.value != '') {
          this.resetDataTableFilter();
        }
        // console.log(this.getPayload());

        let payload = {
          ...this.getPayload(),
          pageno: dataTablesParameters.start / Global.DataTableLength + 1,
          perpage: dataTablesParameters.length,
          searchkey: dataTablesParameters.search.value,
          sortbyfield:
            Global.getTableSortingOptions(
              'sortbyfield',
              dataTablesParameters
            ) ?? '',
          ascdesc:
            Global.getTableSortingOptions('ascdesc', dataTablesParameters) ??
            '',
        };
        // console.log(payload);


        this.companyuserService
          .getIncentiveForm(payload)
          .subscribe(
            (res) => {
              if (res.status == 'success') {
                var docs: any[] = res.employees.docs;

                docs.forEach((doc: any) => {
                  doc.checked = this.isRowChecked(doc._id);
                });

                callback({
                  recordsTotal: res.employees.totalDocs,
                  recordsFiltered: res.employees.totalDocs,
                  data: res.employees.docs,
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
        // {
        //   render: function (data, type, full, meta) {
        //     let checked = (full.checked == true) ? 'checked' : '';
        //     return `<input type="checkbox" ` + checked + ` id="checkrow-` + meta.row + `" data-checkbox-id="` + full._id + `">`
        //   },
        //   orderable: false,
        // },
        // {
        //   render: function (data, type, full, meta: any) {
        //     let html = ``;

        //     html += `<a href="javascript:;" id="editButton" class="btn btn-primary btn-icon mg-r-5" data-toggle="tooltip" data-placement="top" title="Edit"><div style="width:25px; height:25px;"><i class="fa fa-edit"></i></div></a>`;

        //     return html
        //   },
        //   orderable: false,
        //   className: 'text-center'
        // },
        {
          render: function (data, type, full, meta: any) {
            return full.emp_id ?? 'N/A';
          },
          orderable: true,
          data: 'emp_id',
        },
        {
          render: function (data, type, full, meta: any) {
            return `<img src="https://via.placeholder.com/500" class="profile-photo">`;
          },
          orderable: false,
          className: 'text-center',
        },
        {
          render: function (data, type, full, meta: any) {
            return full.emp_first_name;
          },
          orderable: true,
          data: 'emp_first_name',
        },
        {
          render: function (data, type, full, meta: any) {
            return full.emp_last_name;
          },
          orderable: true,
          data: 'emp_last_name',
        },
        {
          render: function (data, type, full, meta: any) {
            return full.email_id;
          },
          orderable: true,
          data: 'email_id',
        },
        {
          render: function (data, type, full, meta: any) {
            return (
              full.employee_details?.template_data?.incentive_temp_data
                ?.template_name ?? '-'
            );
          },
          orderable: false,
        },
        {
          render: function (data, type, full, meta: any) {
            if (
              !full.employee_details?.template_data?.incentive_temp_data
                ?.template_name
            ) {
              return `-`;
            }

            let html = ``;

            html +=
              `<div class="input-group">
                          <input type="number" id="inc-value-field-` +
              full._id +
              `" class="form-control" placeholder="Incentive Value" value="` +
              (full.incentive_reports[0]?.incentive_value ?? 0) +
              `">
                          <button id="incentiveUpdateButton" class="btn btn-primary input-group-addon"><i class="fa fa-save tx-16 lh-0 op-6"></i></button>
                      </div>`;

            return html;
          },
          orderable: false,
        },
        {
          render: function (data, type, full, meta: any) {
            if (
              !full.employee_details?.template_data?.incentive_temp_data
                ?.template_name
            ) {
              return `-`;
            }

            let btnstatus =
              full.incentive_reports[0]?.auto_disburse == 'on' ? 'on' : 'off';

            return (
              `<div class="br-toggle br-toggle-rounded br-toggle-primary ` +
              btnstatus +
              `" id="changeAutoDisburseValue">\
                      <div class="br-toggle-switch"></div>\
                    </div>`
            );
          },
          orderable: false,
        },
      ],
      rowCallback: (row: Node, data: any | Object, index: number) => {
        const self = this;

        $('table').on('click', '#checkrow-' + index, function () {
          self.rowCheckBoxChecked(event, data);
        });

        $('#editButton', row).bind('click', () => {
          self.openIncentiveEditModal('single', data._id, data);
        });

        $('#incentiveUpdateButton', row).bind('click', () => {
          self.updateSingleIncentiveValue(data);
        });

        $('#changeAutoDisburseValue', row).bind('click', () => {
          self.updateSingleAutoDisburse(data);
        });

        return row;
      },
      drawCallback: function (settings) {
        Global.loadCustomScripts('customJsScript');
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

  fetchMasters() {
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

          if (res.masters.department && Array.isArray(res.masters.department)) {
            this.departmentMaster = [];
            res.masters.department.forEach((element: any) => {
              this.departmentMaster.push({
                id: element._id,
                description: element.department_name,
              });
            });
          }
        } else {
          this.toastr.error(res.message);
        }

        this.spinner.hide();
      },
      (err) => {
        this.spinner.hide();
        this.toastr.error(Global.showServerErrorMessage(err));
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

    $('#my-datatable')
      .dataTable()
      .api()
      .ajax.reload(function (json) {}, false);
  }

  getBulkUploadPayload() {
    let payload: any = {};

    if (this.employeeIdBucket.length > 0) {
      payload = {
        // 'checked_row_ids': JSON.stringify(this.employeeIdBucket),
        // 'searchkey': "",
        // 'hod_id': "",
        // 'department_id': "",
        // 'designation_id': "",
        // 'branch_id': "",
        // 'row_checked_all': false,
        // 'unchecked_row_ids': JSON.stringify([]),
        emp_id: JSON.stringify(this.employeeIdBucket),
      };
    } else {
      payload = {
        // 'searchkey': $('#my-datatable_filter').find('input[type="search"]').val() ?? "",
        // 'hod_id': this.filterForm.value.hod_id ?? "",
        // 'department_id': this.filterForm.value.department_id ?? "",
        // 'designation_id': this.filterForm.value.designation_id ?? "",
        // 'branch_id': this.filterForm.value.branch_id ?? "",
        // 'row_checked_all': this.rowCheckedAll,
        // 'checked_row_ids': JSON.stringify(this.checkedRowIds),
        // 'unchecked_row_ids': JSON.stringify(this.uncheckedRowIds),
        emp_id: JSON.stringify(this.checkedRowIds),
      };
    }

    return payload;
  }

  fetchEmployeeDetails(employee_id: any) {
    return new Promise((resolve, reject) => {
      this.spinner.show();
      this.companyuserService
        .getEmployeeDetails({ employee_id: employee_id })
        .subscribe(
          (res: any) => {
            this.spinner.hide();
            if (res.status == 'success') {
              resolve(res.employee_det);
            } else {
              this.toastr.error(res.message);
              resolve(false);
            }
          },
          (err) => {
            this.spinner.hide();
            this.toastr.error(Global.showServerErrorMessage(err));
            resolve(false);
          }
        );
    });
  }

  async openIncentiveEditModal(
    type: any,
    employee_id: any = null,
    details: any = null
  ) {
    if (
      type == 'single' ||
      this.rowCheckedAll == true ||
      this.checkedRowIds.length > 0 ||
      this.uncheckedRowIds.length > 0
    ) {
      $('#incentive-auto-disburse').removeClass('on');
      Global.resetForm(this.incentiveUpdateForm);
      this.employeeIdBucket = [];

      if (type == 'single') {
        var datePipe = new DatePipe('en-US');

        // let from_date = null;
        // if (details?.incentive_reports?.incentive_from_date) {
        //   from_date = datePipe.transform(details?.incentive_reports?.incentive_from_date, 'yyyy-MM-dd');
        // }

        // let to_date = null;
        // if (details?.incentive_reports?.incentive_to_date) {
        //   to_date = datePipe.transform(details?.incentive_reports?.incentive_to_date, 'yyyy-MM-dd');
        // }

        this.incentiveUpdateForm.patchValue({
          incentive_value:
            details?.incentive_reports[0]?.incentive_value ?? null,
          // 'from_date': from_date,
          // 'to_date': to_date,
        });

        if (details?.incentive_reports[0]?.auto_disburse == 'on') {
          $('#incentive-auto-disburse').addClass('on');
        } else {
          $('#incentive-auto-disburse').removeClass('on');
        }

        this.employeeIdBucket.push(employee_id);

        if (this.employeeIdBucket.length < 0) {
          this.toastr.warning('No Employee IDs available for the Operation');
        }
      }

      $('#updateIncentiveModalButton').click();
    }
  }

  updateIncentive(event: any) {
    if (this.incentiveUpdateForm.valid) {
      event.target.classList.add('btn-loading');

      let payload = this.getBulkUploadPayload();
      payload.incentive_value =
        this.incentiveUpdateForm.value.incentive_value ?? '';
      // payload.from_date = this.incentiveUpdateForm.value.from_date ?? "";
      // payload.to_date = this.incentiveUpdateForm.value.to_date ?? "";
      payload.incentive_month = this.filterForm.value.month?.index ?? '';
      payload.incentive_year = this.filterForm.value.year?.value ?? '';
      payload.auto_disburse = $('#incentive-auto-disburse').hasClass('on')
        ? 'on'
        : 'off';

      this.companyuserService.updateEmpIncentive(payload).subscribe(
        (res) => {
          if (res.status == 'success') {
            this.employeeIdBucket = [];
            this.toastr.success(res.message);
            Global.resetForm(this.incentiveUpdateForm);
            $('#updateIncentiveModal').find('[data-dismiss="modal"]').click();
            $('#my-datatable')
              .dataTable()
              .api()
              .ajax.reload(function (json) {}, false);
            setTimeout(function () {
              $('#letterWritingEmpModalButton')?.click();
            }, 500);
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

  updateSingleIncentiveValue(item: any) {
    if (
      !item.employee_details?.template_data?.incentive_temp_data?.template_name
    ) {
      this.toastr.error('Incentive Template is not added for this employee.');
      return;
    }

    this.employeeIdBucket = [];
    this.employeeIdBucket.push(item._id);

    let payload = this.getBulkUploadPayload();
    payload.incentive_month = this.filterForm.value.month?.index ?? '';
    payload.incentive_year = this.filterForm.value.year?.value ?? '';
    payload.incentive_value = $('#inc-value-field-' + item._id).val() ?? 0;
    payload.auto_disburse = item.incentive_reports[0]?.auto_disburse ?? 'off';

    this.updateEmpIncentive(payload);
  }

  updateSingleAutoDisburse(item: any) {
    if (
      !item.employee_details?.template_data?.incentive_temp_data?.template_name
    ) {
      this.toastr.error('Incentive Template is not added for this employee.');
      return;
    }

    this.employeeIdBucket = [];
    this.employeeIdBucket.push(item._id);

    let payload = this.getBulkUploadPayload();
    payload.incentive_month = this.filterForm.value.month?.index ?? '';
    payload.incentive_year = this.filterForm.value.year?.value ?? '';
    payload.incentive_value = item.incentive_reports[0]?.incentive_value ?? 0;
    payload.auto_disburse =
      item.incentive_reports[0]?.auto_disburse == 'on' ? 'off' : 'on';

    this.updateEmpIncentive(payload);
  }

  incentiveExportCustomFields: any[] = [
    {
      section: 'Incentive',
      values: [
        { label: 'Sl No', value: '' },
        { label: 'Emp Id', value: '' },
        { label: 'Name', value: '' },
        { label: 'Department', value: '' },
        { label: 'Designation', value: '' },
        { label: 'Client', value: '' },
        { label: 'Branch', value: '' },
        { label: 'HOD', value: '' },
        { label: 'Incentive Accumulated', value: '' },
        { label: 'Incentive Setteled', value: '' },
        { label: 'Advance Paid', value: '' },
        { label: 'Advance Recovered', value: '' },
        { label: 'TDS', value: '' },
        { label: 'EE PF', value: '' },
        { label: 'EE ESI', value: '' },
        { label: 'ER PF', value: '' },
        { label: 'ER ESIC', value: '' },
        { label: 'Net Pay', value: '' },
      ],
    },
  ];

  rowSelecion(e: any, name: string) {
    let checkboxes: any = document.getElementsByName(`fields[${name}]`);
    for (const checkbox of checkboxes) {
      checkbox.checked = e.target.checked;
    }
  }

  adjustTemplateFields(field: any[], e: any) {
    let arr = field.map((d) => {
      return d.value;
    });
    if (e.target.checked) {
      this.template_fields.push(...arr);
    } else {
      arr.forEach((element) => {
        let i = this.template_fields.indexOf(element);
        if (i > -1) {
          this.template_fields.splice(i, 1);
        }
      });
    }
  }


  updateEmpIncentive(payload: any) {
    this.spinner.show();
    this.companyuserService.updateEmpIncentive(payload).subscribe(
      (res) => {
        if (res.status == 'success') {
          this.employeeIdBucket = [];
          // this.toastr.success(res.message);
          this.toastr.success('Incentive options updated for this employee.');
          $('#my-datatable')
            .dataTable()
            .api()
            .ajax.reload(function (json) {}, false);
        } else if (res.status == 'val_err') {
          this.toastr.error(Global.showValidationMessage(res.val_msg));
        } else {
          this.toastr.error(res.message);
        }

        this.spinner.hide();
      },
      (err) => {
        this.spinner.hide();
        this.toastr.error(Global.showServerErrorMessage(err));
      }
    );
  }

  initTemplateCreate() {
    this.cancelTemplateCreate();
    $('#settingsTemplateModalOpen')?.click();
  }

  cancelTemplateCreate() {
    $('#settingsTemplateModal')?.find('[data-dismiss="modal"]')?.click();
    // Global.resetForm(this.templateForm);
    // this.resetSelectedModules();
  }

  // resetSelectedModules() {
  //   this.employeeExportCustomFields.forEach((row: any) => {
  //     $('input[name="fields[' + row.section + ']"]:checked').each(function () {
  //       $(this).prop('checked', false);
  //     });
  //   });
  // }
}
