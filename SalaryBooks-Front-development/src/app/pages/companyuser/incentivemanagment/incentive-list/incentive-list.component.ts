import { Component, OnInit } from '@angular/core';
import {
  FormArray,
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
import { CompanyuserService } from 'src/app/services/companyuser.service';
import { DatePipe } from '@angular/common';
import { saveAs } from 'file-saver';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-companyuser-incentive-list',
  templateUrl: './incentive-list.component.html',
  styleUrls: ['./incentive-list.component.css'],
})
export class CMPIncentiveListComponent implements OnInit {
  Global = Global;
  dtOptions: DataTables.Settings = {};

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
  incetiveImportForm: UntypedFormGroup;

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

    this.incetiveImportForm = formBuilder.group({
      file: [null, Validators.compose([Validators.required])],
      file_source: [null, Validators.compose([Validators.required])],
    });
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
      !Global.checkCompanyModulePermission({
        company_module: 'incentive',
        company_operation: ['apply_incentive', 'list_incentive'],
        company_sub_module: 'add_apply_incentive',
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

    this.fetchMasters();
    this.fetch();
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
      incentive_month: this.employeeListFilter?.month?.index ?? '',
      incentive_year: this.employeeListFilter?.year?.value ?? '',
      department_id: this.employeeListFilter?.department_id ?? '',
      designation_id: this.employeeListFilter?.designation_id ?? '',
      branch_id: this.employeeListFilter?.branch_id ?? '',
      client_id: this.employeeListFilter?.client_id ?? '',
      hod_id: this.employeeListFilter?.hod_id ?? '',
      incentive_value: this.incentiveUpdateForm.value.incentive_value ?? '',
    };

    return payload;
  }

  fetch() {
    this.dtOptions = {
      ajax: (dataTablesParameters: any, callback) => {
        if (dataTablesParameters?.search?.value != '') {
          this.resetDataTableFilter();
        }

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

        this.companyuserService.getIncentiveForm(payload).subscribe(
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
            // if(!full?.incentive_module?._id){
            //   return ""
            // }
            if(full.bank_ins_id){
              return ""
            }
            let checked = full.checked == true ? 'checked' : '';

            let html =
              `<input type="checkbox" ` +
              checked +
              ` id="checkrow-` +
              meta.row +
              `" data-checkbox-id="` +
              full._id +
              `">`;

            html += meta.settings._iDisplayStart + (meta.row + 1);

            return html;
          },
          orderable: false,
        },
        {
          render: function (data, type, full, meta: any) {
            let status = 'Pending';
            const {bank_ins_id, bank_instruction_status, incentive_module} = full
            // console.log(incentive_modules?.[0]?.status);
            
            if(!bank_ins_id && incentive_module?.status == 'pending') status = "Run";
            if(!bank_ins_id && incentive_module?.status == 'run') status = "Re-Run";
            if(bank_ins_id) status = bank_ins_id;
            if(bank_ins_id && bank_instruction_status == 'confirm') status = "Confirmed";
            return status
          },
          orderable: true,
          data: "status",
        },
        {
          render: function (data, type, full, meta: any) {
            return full.emp_id ?? 'N/A';
          },
          orderable: true,
          data: 'emp_id',
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
            return (
              full.employee_details?.template_data?.incentive_temp_data
                ?.template_name ?? '-'
            );
          },
          orderable: false,
        },
        {
          render: function (data, type, full, meta: any) {
            if( full.bank_ins_id){
              return `<div class="input-group text-dark form-control">${full?.incentive_module?.incentive_value}</div>`
            }
            if (
              !full.employee_details?.template_data?.incentive_temp_data
                ?.template_name
            ) {
              return `-`;
            }

            let html = ``;

            if (
              Global.checkCompanyModulePermission({
                company_module: 'incentive',
                company_operation: 'apply_incentive',
                company_sub_module: 'add_apply_incentive',
                company_sub_operation: ['edit'],
                company_strict:true
              })
            ) {
              html +=
                `<div  class="input-group">
                                      <input type="number" id="inc-value-field-` +
                full._id +
                `" class="form-control" placeholder="Incentive Value" value="` +
                (full.incentive_module.incentive_value ?? 0) +
                `">
                                      <button data-toggle="tooltip" data-placement="top" title="Apply Incentive" id="incentiveUpdateButton" class="btn btn-primary input-group-addon"><i class="fa fa-sync tx-16 lh-0 op-6"></i></button>
                                  </div>`;
            }else{
              return full?.incentive_module?.incentive_value ?? 0
            }

            return html;
          },
          orderable: false,
          className:"text-center text-capitalize"

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
              full.employee_details?.template_data?.incentive_temp_data
              ?.eligble_disburse == 'on'
              ? 'on'
              : 'off';
              if (full.incentive_module.auto_disburse) {
                btnstatus =
                full.incentive_module.auto_disburse == 'on' ? 'on' : 'off';
              }
              if(!Global.checkCompanyModulePermission({
                company_module: 'incentive',
                company_operation: 'apply_incentive',
                company_sub_module: 'add_apply_incentive',
                company_sub_operation: ['edit'],
                company_strict:true
              })){
                return btnstatus
              }

            if( full.bank_ins_id){
              return ''
            }          
            return (
              `<div  class="br-toggle br-toggle-rounded br-toggle-primary ` +
              btnstatus +
              `" id="changeAutoDisburseValue">\ 
                                <div class="br-toggle-switch"></div>\
                            </div>`
            );
          },
          orderable: false,
          className:"text-center text-capitalize"
        },
      ],
      rowCallback: (row: Node, data: any | Object, index: number) => {
        const self = this;

        $('table').on('click', '#checkrow-' + index, function () {
          self.rowCheckBoxChecked(event, data);
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
      // searchDelay:700,
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

  async openIncentiveEditModal() { 
      $('#updateIncentiveModalButton').click();
  }

  // updateIncentive(event: any) {
  //   if (this.incentiveUpdateForm.valid) {
  //     event.target.classList.add('btn-loading');
  //     let payload = this.getBulkUploadPayload();
  //     payload.incentive_value = this.incentiveUpdateForm.value.incentive_value ?? '';

  //     payload.incentive_month = this.employeeListFilter.month?.index ?? '';
  //     payload.incentive_year = this.employeeListFilter.year?.value ?? '';
  //     payload.auto_disburse = $('#incentive-auto-disburse').hasClass('on')
  //       ? 'on'
  //       : 'off';

  //     this.companyuserService.updateEmpIncentive(payload).subscribe(
  //       (res) => {
  //         if (res.status == 'success') {
  //           this.employeeIdBucket = [];
  //           this.toastr.success(res.message);
  //           Global.resetForm(this.incentiveUpdateForm);
  //           $('#updateIncentiveModal').find('[data-dismiss="modal"]').click();
  //           $('#my-datatable')
  //             .dataTable()
  //             .api()
  //             .ajax.reload(function (json) {}, false);
  //           // setTimeout(function () {
  //           //   $('#letterWritingEmpModalButton')?.click();
  //           // }, 500);
  //         } else if (res.status == 'val_err') {
  //           this.toastr.error(Global.showValidationMessage(res.val_msg));
  //         } else {
  //           this.toastr.error(res.message);
  //         }

  //         event.target.classList.remove('btn-loading');
  //       },
  //       (err) => {
  //         event.target.classList.remove('btn-loading');
  //         this.toastr.error(Global.showServerErrorMessage(err));
  //       }
  //     );
  //   }
  // }

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
    payload.incentive_month = this.employeeListFilter.month?.index ?? '';
    payload.incentive_year = this.employeeListFilter.year?.value ?? '';
    payload.incentive_value = $('#inc-value-field-' + item._id).val() ?? 0;
    payload.auto_disburse = item.incentive_module.auto_disburse ?? 'off';

    this.updateEmpIncentive('single', payload);
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
    payload.incentive_month = this.employeeListFilter.month?.index ?? '';
    payload.incentive_year = this.employeeListFilter.year?.value ?? '';
    payload.incentive_value = item.incentive_module.incentive_value ?? 0;
    payload.auto_disburse =
      item.incentive_module.auto_disburse == 'on' ? 'off' : 'on';

    this.updateEmpIncentive('single',payload);
  }

  updateEmpIncentive(actionType:string, payload: any) {
    if(actionType == 'single'){
      payload.row_checked_all = false;
      payload.checked_row_ids = payload.emp_id;
      payload.unchecked_row_ids = JSON.stringify([]);
    }else{
      payload = {
      incentive_month: this.employeeListFilter.month?.index ?? '',
      incentive_year: this.employeeListFilter.year?.value ?? '',
      incentive_value: this.incentiveUpdateForm.value.incentive_value ?? '',
      row_checked_all: this.rowCheckedAll,
      checked_row_ids: JSON.stringify(this.checkedRowIds),
      unchecked_row_ids: JSON.stringify(this.uncheckedRowIds),
      auto_disburse: $('#incentive-auto-disburse').hasClass('on') ? 'on' : 'off',
    }

    }
    if (
      payload.row_checked_all == false &&
      payload.checked_row_ids.length == 0 &&
      payload.unchecked_row_ids.length == 0
    ) {
      return;
    }
    this.spinner.show();
    payload.action = "apply"
    this.companyuserService.updateEmpIncentive(payload).subscribe(
      (res) => {
        if (res.status == 'success') {
          this.employeeIdBucket = [];
          this.rowCheckedAll = false;
          this.checkedRowIds = [];
          this.uncheckedRowIds = [];
          Global.resetForm(this.incentiveUpdateForm);
          $('#updateIncentiveModal').find('[data-dismiss="modal"]').click();
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

  async incentiveBulkUpdate(){
    try {
      
      if (
        this.rowCheckedAll == false &&
        this.checkedRowIds.length == 0 &&
        this.uncheckedRowIds.length == 0
      ) {
        return;
      }
      const payload:any = {
        incentive_month: this.employeeListFilter.month?.index ?? '',
        incentive_year: this.employeeListFilter.year?.value ?? '',
        row_checked_all: this.rowCheckedAll,
        checked_row_ids: JSON.stringify(this.checkedRowIds),
        unchecked_row_ids: JSON.stringify(this.uncheckedRowIds),
        incentive_items: {},
        action:"update"
      }
      this.checkedRowIds.forEach((el:string) => {
        const incentive_value = $(`#inc-value-field-${el}`).val();
        // payload.incentive_items.push({
        //   _id:el,
        //   incentive_value
        // })
        payload.incentive_items = {
          ...payload.incentive_items,
          [el]: incentive_value
        }
      })

      payload.incentive_items = JSON.stringify(payload.incentive_items); 

      this.spinner.show();

      const res = await this.companyuserService.updateEmpIncentive(payload).toPromise();
 
        if (res.status !== 'success') throw res;

          this.employeeIdBucket = [];
          this.rowCheckedAll = false;
          this.checkedRowIds = [];
          this.uncheckedRowIds = [];
          Global.resetForm(this.incentiveUpdateForm);
          $('#updateIncentiveModal').find('[data-dismiss="modal"]').click();
          $('#my-datatable')
          .dataTable()
          .api()
          .ajax.reload(function (json) {}, false);
          
          this.spinner.hide();
          this.toastr.success('Incentive options updated for these employees.');
        
      } catch (err:any) {
        this.spinner.hide();
        if (err.status == 'val_err') {
          this.toastr.error(Global.showValidationMessage(err.val_msg));
        } else {
          this.toastr.error(err.message || err || 'Something Went Wrong');
        }
    }
  }

  runIncentive() {
    return new Promise((resolve, reject) => {
      if (
        this.rowCheckedAll == false &&
        this.checkedRowIds.length == 0 &&
        this.uncheckedRowIds.length == 0
      ) {
        return;
      }

      Swal
      .fire({
        title: 'Want to run the Incentive?',
        text:
          'Ensure that you have already applied for incentives for all selected employees.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, Run it!',
        cancelButtonText: 'No, cancel it',
      })
      .then((result) => {
        if (result.value) {
          this.spinner.show();
          this.companyuserService
            .runIncentiveSheet({
              row_checked_all: this.rowCheckedAll,
              checked_row_ids: JSON.stringify(this.checkedRowIds),
              unchecked_row_ids: JSON.stringify(this.uncheckedRowIds),
              attendance_month: this.employeeListFilter?.month?.index ?? '',
              attendance_year: this.employeeListFilter?.year?.value ?? '',
            })
            .subscribe(
              (res) => {
                this.spinner.hide();
                if (res.status == 'success') {
                  this.toastr.success(res?.message);
                  resolve(true);
                } else if (res.status == 'val_err') {
                  this.toastr.error(Global.showValidationMessage(res.val_msg));
                  resolve(false);
                } else {
                  this.toastr.error(res.message);
                  resolve(false);
                }
              },
              (err) => {
                this.toastr.error(Global.showServerErrorMessage(err));
                this.spinner.hide();
                resolve(false);
              }
            );
        }})

    });
  }

  initDataImport() {
    $('#incentiveImportModalOpen')?.click();
  }

  async getSampleImportCsv() {
    try {
      this.spinner.show();
      await this.companyuserService.downloadFile('export-excel-sample-file','Incentive-Sample', { list_type: 'incentive' });

      // saveAs(file, 'Incentive-Sample');
      this.spinner.hide();
    } catch (err: any) {
      this.spinner.hide();
      this.toastr.error(err?.message);
    }
  }

  onImportFileChanged(
    event: any,
    formGroup: UntypedFormGroup,
    file: any,
    target: any
  ) {
    if (event.target.files.length > 0) {
      const file = event.target.files[0];
      formGroup.patchValue({
        [target]: file,
      });
    }
  }

  cancelDataImport() {
    Global.resetForm(this.incetiveImportForm);
    $('#incentiveImportModal')?.find('[data-dismiss="modal"]')?.click();
  }

  importData(event: any) {
    if (this.incetiveImportForm.valid) {
      event.target.classList.add('btn-loading');
      let incentiveImportFailed = [];
      let payload = this.getPayload();
      payload.emp_incentive_data_file = this.incetiveImportForm.value.file
        ? this.incetiveImportForm.value.file_source
        : '';
      this.companyuserService.importEmpIncentiveData(payload).subscribe(
        (res) => {
          if (res.status == 'success') {
            this.cancelDataImport();
            this.toastr.success(res.message);
            this.fetch();

            incentiveImportFailed = res.failed_entry ?? [];
            if (incentiveImportFailed.length > 0) {
              this.toastr.warning(
                'Please check the CSV few of the data format is incorrect'
              );
              $('#csvFailedIdModalButton')?.click();
            }
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
