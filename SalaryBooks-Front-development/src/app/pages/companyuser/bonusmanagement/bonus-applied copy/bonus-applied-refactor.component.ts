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
import { CompanyuserTableFilterComponent } from '../../includes/table-filter/table-filter.component';

@Component({
  selector: 'app-companyuser-bonus-applied',
  templateUrl: './bonus-applied-refactor.component.html',
  styleUrls: ['./bonus-applied-refactor.component.css']
})
export class CMPBonusAppliedRefactorComponent implements OnInit {
  Global = Global;
  dtOptions: DataTables.Settings = {};

  filterForm: UntypedFormGroup;
  bonusUpdateForm: UntypedFormGroup;
  bonusImportForm: UntypedFormGroup;

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
  frequencyMaster: any[] = [];
  disburesmentMaster: any[] = [];
  bonusImportFailed: any[] = [];

  rowCheckedAll: Boolean = false;
  checkedRowIds: any[] = [];
  uncheckedRowIds: any[] = [];

  last_emp_id: any = null;

  employeeListFilter:any = {}

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
      "month": [null, Validators.compose([Validators.required])],
      "year": [null, Validators.compose([Validators.required])],

      "emp_first_name": [null],
      "emp_last_name": [null],
      "email_id": [null],
      "pan_no": [null],

      "department": [null],
      "designation": [null],
      "branch": [null],
      "hod": [null],

      "department_id": [null],
      "designation_id": [null],
      "branch_id": [null],
      "hod_id": [null],

      "disbursement_frequency": [null],
      "disbursement_type": [null],
    });

    this.bonusUpdateForm = formBuilder.group({
      "bonus_value": [null, Validators.compose([Validators.required])],
      "exgratia_status": [null, Validators.compose([Validators.required])],
      "bonus_from_month": [null, Validators.compose([Validators.required])],
      "bonus_from_year": [null, Validators.compose([Validators.required, Validators.pattern("^[0-9]*$"), Validators.minLength(4), Validators.maxLength(4)])],
      "bonus_to_month": [null, Validators.compose([Validators.required])],
      "bonus_to_year": [null, Validators.compose([Validators.required])],
      "bonus_wage_month": [null, Validators.compose([])],
    });

    this.bonusImportForm = formBuilder.group({
      "file": [null, Validators.compose([Validators.required])],
      "file_source": [null, Validators.compose([Validators.required])],
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
      { 'value': "on", 'description': "ON" },
      { 'value': "off", 'description': "OFF" },
    ];

    this.monthMaster = [
      { index: 0, value: 1, description: "January", days: 31 },
      { index: 1, value: 2, description: "February", days: 28 },
      { index: 2, value: 3, description: "March", days: 31 },
      { index: 3, value: 4, description: "April", days: 30 },
      { index: 4, value: 5, description: "May", days: 31 },
      { index: 5, value: 6, description: "June", days: 30 },
      { index: 6, value: 7, description: "July", days: 31 },
      { index: 7, value: 8, description: "August", days: 31 },
      { index: 8, value: 9, description: "September", days: 30 },
      { index: 9, value: 10, description: "October", days: 31 },
      { index: 10, value: 11, description: "November", days: 30 },
      { index: 11, value: 12, description: "December", days: 31 },
    ];

    let currentYear = new Date().getFullYear();
    this.yearMaster = [];
    for (let index = 4; index >= 0; index--) {
      this.yearMaster.push({ value: (currentYear - index), description: (currentYear - index) });
    }

    this.frequencyMaster = [
      { 'value': 'monthly', 'description': 'Monthly' },
      { 'value': 'quaterly', 'description': 'Quaterly' },
      { 'value': 'half_yearly', 'description': 'Half Yearly' },
      { 'value': 'yearly', 'description': 'Yearly' },
    ];

    this.disburesmentMaster = [
      { 'value': 'fixed', 'description': 'Fixed Amount' },
      { 'value': 'percent', 'description': 'Percent' },
    ];
  }

  ngOnInit(): void {
    this.titleService.setTitle("Bonus Management - " + Global.AppName);
    this.employeeListFilter = {
      'month': this.monthMaster.find((obj: any) => {
        return obj.index == 0
        return obj.index == new Date().getMonth()
      }) ?? null,

      'year': this.yearMaster.find((obj: any) => {
        return obj.value == 2022
        return obj.value == new Date().getFullYear()
      }) ?? null,
    }

    this.fetchMasters();
    this.fetch();
  }

  filterDataTable(payload?:any) {
    if(payload){
      this.employeeListFilter = payload
    }
    // if (this.filterForm.value.hod != null) {
    //   if (Array.isArray(this.filterForm.value.hod)) {
    //     this.filterForm.value.hod_id = [];
    //     this.filterForm.value.hod.forEach((element: any) => {
    //       this.filterForm.value.hod_id.push(element.id)
    //     });

    //     if (this.filterForm.value.hod_id.length > 0) {
    //       this.filterForm.value.hod_id = JSON.stringify(this.filterForm.value.hod_id)
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
    //       this.filterForm.value.department_id.push(element.id)
    //     });

    //     if (this.filterForm.value.department_id.length > 0) {
    //       this.filterForm.value.department_id = JSON.stringify(this.filterForm.value.department_id)
    //     } else {
    //       this.filterForm.value.department_id = null;
    //     }
    //   } else {
    //     this.filterForm.value.department_id = this.filterForm.value.department.id;
    //   }
    // }

    // if (this.filterForm.value.designation != null) {
    //   if (Array.isArray(this.filterForm.value.designation)) {
    //     this.filterForm.value.designation_id = [];
    //     this.filterForm.value.designation.forEach((element: any) => {
    //       this.filterForm.value.designation_id.push(element.id)
    //     });

    //     if (this.filterForm.value.designation_id.length > 0) {
    //       this.filterForm.value.designation_id = JSON.stringify(this.filterForm.value.designation_id)
    //     } else {
    //       this.filterForm.value.designation_id = null;
    //     }
    //   } else {
    //     this.filterForm.value.designation_id = this.filterForm.value.designation.id;
    //   }
    // }

    // if (this.filterForm.value.branch != null) {
    //   if (Array.isArray(this.filterForm.value.branch)) {
    //     this.filterForm.value.branch_id = [];
    //     this.filterForm.value.branch.forEach((element: any) => {
    //       this.filterForm.value.branch_id.push(element.id)
    //     });

    //     if (this.filterForm.value.branch_id.length > 0) {
    //       this.filterForm.value.branch_id = JSON.stringify(this.filterForm.value.branch_id)
    //     } else {
    //       this.filterForm.value.branch_id = this.filterForm.value.designation.id;
    //     }
    //   } else {
    //     this.filterForm.value.branch_id = this.filterForm.value.branch.id;
    //   }
    // }

    $('#my-datatable_filter').find('[type="search"]').val('');
    $('#my-datatable').DataTable().search('').draw();
  }

  resetDataTableFilter() {
    Global.resetForm(this.filterForm)
  }

  getPayload() {
    let payload: any = {
        'row_checked_all': this.rowCheckedAll,
        'checked_row_ids': JSON.stringify(this.checkedRowIds),
        'unchecked_row_ids': JSON.stringify(this.uncheckedRowIds),
        'hod_id': this.employeeListFilter?.hod_id ?? '',
        'department_id': this.employeeListFilter?.department_id ?? '',
        'designation_id': this.employeeListFilter?.designation_id ?? '',
        'branch_id': this.employeeListFilter?.branch_id ?? '',
        'disbursement_frequency': this.employeeListFilter?.disbursement_frequency ?? '',
        'disbursement_type': this.employeeListFilter?.disbursement_type ?? '',
    }
    return payload;
}

filterTableComponent: CompanyuserTableFilterComponent;

  fetch() {
    this.dtOptions = {
      ajax: (dataTablesParameters: any, callback) => {
        if (dataTablesParameters.search.value != '') {
          this.filterTableComponent.reset({ refresh: false });
          // this.employeeListFilter = {};
        }
        let payload = {
          ...this.getPayload(),
          pageno: Math.floor((dataTablesParameters.start + dataTablesParameters.length) / dataTablesParameters.length), 'perpage': dataTablesParameters.length,
          searchkey: dataTablesParameters.search.value,
          sortbyfield: Global.getTableSortingOptions('sortbyfield', dataTablesParameters) ?? "",
          ascdesc: Global.getTableSortingOptions('ascdesc', dataTablesParameters) ?? "",
        }
        // let disbursement_frequency: any[] = [];
        // if (this.filterForm.value?.disbursement_frequency && Array.isArray(this.filterForm.value.disbursement_frequency)) {
        //   this.filterForm.value.disbursement_frequency.forEach((element: any) => {
        //     disbursement_frequency.push(element.value)
        //   });
        // }

        // let disbursement_type: any[] = [];
        // if (this.filterForm.value?.disbursement_type && Array.isArray(this.filterForm.value.disbursement_type)) {
        //   this.filterForm.value.disbursement_type.forEach((element: any) => {
        //     disbursement_type.push(element.value)
        //   });
        // }

        // let hods: any[] = [];
        // if (this.filterForm.value.hod_id) {
        //   this.filterForm.value.hod_id.forEach((element: any) => {
        //     hods.push(element.id)
        //   });
        // }

        // 'hod_id': (hods.length > 0) ? JSON.stringify(hods) : "",
        // 'disbursement_frequency': (disbursement_frequency.length > 0) ? JSON.stringify(disbursement_frequency) : "",
        // 'disbursement_type': (disbursement_type.length > 0) ? JSON.stringify(disbursement_type) : "",

        this.companyuserService.getBonusForm(payload).subscribe(res => {
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
        }, (err) => {
          this.toastr.error(Global.showServerErrorMessage(err));

          callback({
            recordsTotal: 0,
            recordsFiltered: 0,
            data: [],
          });
        });
      },
      columns: [
        {
          render: function (data, type, full, meta: any) {
            return meta.settings._iDisplayStart + (meta.row + 1)
          },
          orderable: false
        },
        {
          render: function (data, type, full, meta) {
            let checked = (full.checked == true) ? 'checked' : '';
            return `<input type="checkbox" ` + checked + ` id="checkrow-` + meta.row + `" data-checkbox-id="` + full._id + `">`
          },
          orderable: false,
        },
        {
          render: function (data, type, full, meta: any) {
            let html = ``;

            html += `<a href="javascript:;" id="editButton" class="btn btn-primary btn-icon mg-r-5" data-toggle="tooltip" data-placement="top" title="Edit"><div style="width:25px; height:25px;"><i class="fa fa-edit"></i></div></a>`;

            return html
          },
          orderable: false,
          className: 'text-center'
        },
        {
          render: function (data, type, full, meta: any) {
            return full.emp_id ?? "N/A";
          },
          orderable: true,
          data: 'emp_id',
        },
        {
          render: function (data, type, full, meta: any) {
            return `<img src="https://via.placeholder.com/500" class="profile-photo">`
          },
          orderable: false,
          className: "text-center",
        },
        {
          render: function (data, type, full, meta: any) {
            return full.emp_first_name
          },
          orderable: true,
          data: 'emp_first_name',
        },
        {
          render: function (data, type, full, meta: any) {
            return full.emp_last_name
          },
          orderable: true,
          data: 'emp_last_name',
        },
        {
          render: function (data, type, full, meta: any) {
            return full.email_id
          },
          orderable: true,
          data: 'email_id',
        },
        {
          render: function (data, type, full, meta: any) {
            return full.bonus_report[0]?.bonus_value ?? '-'
          },
          orderable: false,
        },
        {
          render: function (data, type, full, meta: any) {
            let html = '-'
            if (full.employee_details?.template_data?.bonus_temp_data?.disbursement_type) {
              html = `<span class="text-uppercase">${full.employee_details?.template_data?.bonus_temp_data?.disbursement_type}</span>`
            }

            return html
          },
          orderable: false,
        },
        {
          render: function (data, type, full, meta: any) {
            let html = '-'
            if (full.employee_details?.template_data?.bonus_temp_data?.disbursement_frequency) {
              html = `<span class="text-uppercase">${full.employee_details?.template_data?.bonus_temp_data?.disbursement_frequency}</span>`
            }

            return html
          },
          orderable: false,
        },
        {
          render: function (data, type, full, meta: any) {
            return full.bonus_report[0]?.exgratia ? `<span class="text-uppercase">` + full.bonus_report[0]?.exgratia + `</span>` : '-'
          },
          orderable: false,
        },
        {
          render: function (data, type, full, meta: any) {
            if (full.bonus_report[0]?.bonus_from_date) {
              var datePipe = new DatePipe("en-US");
              let value = datePipe.transform(full.bonus_report[0]?.bonus_from_date, 'dd/MM/yyyy');
              return value;
            } else {
              return '-';
            }
          },
          orderable: false,
        },
        {
          render: function (data, type, full, meta: any) {
            if (full.bonus_report[0]?.bonus_to_date) {
              var datePipe = new DatePipe("en-US");
              let value = datePipe.transform(full.bonus_report[0]?.bonus_to_date, 'dd/MM/yyyy');
              return value;
            } else {
              return '-';
            }
          },
          orderable: false,
        },
      ],
      rowCallback: (row: Node, data: any | Object, index: number) => {
        const self = this;

        $("table").on('click', '#checkrow-' + index, function () {
          self.rowCheckBoxChecked(event, data);
        });

        $('#editButton', row).bind('click', () => {
          self.openBonusEditModal('single', data._id, data);
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
      lengthChange: true, lengthMenu: Global.DataTableLengthChangeMenu,
      responsive: true,
      order: [],
      language: {
        searchPlaceholder: 'Search...',
        search: "",
      }
    };
  }

  fetchMasters() {
    this.spinner.show();
    this.companyuserService.getEmployeeMaster().subscribe((res: any) => {
      if (res.status == 'success') {
        this.branchMaster = [];
        if (res.masters.branch?.company_branch && Array.isArray(res.masters.branch?.company_branch)) {
          res.masters.branch?.company_branch.forEach((element: any) => {
            this.branchMaster.push({ id: element._id, description: element.branch_name })
          });
        }

        if (res.masters.designation && Array.isArray(res.masters.designation)) {
          this.designationMaster = [];
          res.masters.designation.forEach((element: any) => {
            this.designationMaster.push({ id: element._id, description: element.designation_name })
          });
        }

        if (res.masters.department && Array.isArray(res.masters.department)) {
          this.departmentMaster = [];
          res.masters.department.forEach((element: any) => {
            this.departmentMaster.push({ id: element._id, description: element.department_name })
          });
        }

        if (res.masters.staff && Array.isArray(res.masters.staff)) {
          this.hodMaster = [];
          res.masters.staff.forEach((element: any) => {
            this.hodMaster.push({ id: element._id, description: element.first_name + ' ' + element.last_name })
          });
        }
      } else {
        this.toastr.error(res.message);
      }

      this.spinner.hide();
    }, (err) => {
      this.spinner.hide();
      this.toastr.error(Global.showServerErrorMessage(err));
    });
  }

  private isRowChecked(rowId: any) {
    if (!this.rowCheckedAll) {
      return this.checkedRowIds.indexOf(rowId) >= 0 ? true : false;
    }
    else {
      return this.uncheckedRowIds.indexOf(rowId) >= 0 ? false : true;
    }
  }

  rowCheckBoxChecked(event: any, row: any) {
    let rowId: any = row._id;
    let checkbox: any = document.querySelectorAll('[data-checkbox-id="' + rowId + '"]');

    if (checkbox.length > 0) {
      if (checkbox[0].checked) {
        this.uncheckedRowIds.splice(this.uncheckedRowIds.indexOf(rowId), 1);
        if (!this.rowCheckedAll) {
          if (!this.checkedRowIds.includes(rowId)) {
            this.checkedRowIds.push(rowId);
          }
        }
      }
      else {
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

    $('#my-datatable').dataTable().api().ajax.reload(function (json) { }, false);
  }

  getBulkUploadPayload() {
    let payload: any = {};

    if (this.employeeIdBucket.length > 0) {
      payload = {
        'checked_row_ids': JSON.stringify(this.employeeIdBucket),
        'searchkey': "",
        'hod_id': "",
        'department_id': "",
        'designation_id': "",
        'branch_id': "",
        'row_checked_all': false,
        'unchecked_row_ids': JSON.stringify([]),
      }
    } else {
      payload = {
        'searchkey': $('#my-datatable_filter').find('input[type="search"]').val() ?? "",
        'hod_id': this.filterForm.value.hod_id ?? "",
        'department_id': this.filterForm.value.department_id ?? "",
        'designation_id': this.filterForm.value.designation_id ?? "",
        'branch_id': this.filterForm.value.branch_id ?? "",
        'row_checked_all': this.rowCheckedAll,
        'checked_row_ids': JSON.stringify(this.checkedRowIds),
        'unchecked_row_ids': JSON.stringify(this.uncheckedRowIds),
      }
    }

    return payload;
  }

  fetchEmployeeDetails(employee_id: any) {
    return new Promise((resolve, reject) => {
      this.spinner.show();
      this.companyuserService.getEmployeeDetails({ employee_id: employee_id })
        .subscribe((res: any) => {
          this.spinner.hide();
          if (res.status == 'success') {
            resolve(res.employee_det);
          } else {
            this.toastr.error(res.message);
            resolve(false);
          }
        }, (err) => {
          this.spinner.hide();
          this.toastr.error(Global.showServerErrorMessage(err));
          resolve(false);
        });
    });
  }

  async openBonusEditModal(type: any, employee_id: any = null, details: any = null) {
    if (type == "single" || (this.rowCheckedAll == true || (this.checkedRowIds.length > 0 || this.uncheckedRowIds.length > 0))) {
      Global.resetForm(this.bonusUpdateForm)
      this.employeeIdBucket = [];

      if (type == 'single') {
        var datePipe = new DatePipe("en-US");

        let from_date = null;
        if (details?.bonus_report[0]?.bonus_from_date) {
          from_date = datePipe.transform(details.bonus_report[0]?.bonus_from_date, 'yyyy-MM-dd');
        }

        let to_date = null;
        if (details?.bonus_report[0]?.bonus_to_date) {
          to_date = datePipe.transform(details.bonus_report[0]?.bonus_to_date, 'yyyy-MM-dd');
        }

        this.bonusUpdateForm.patchValue({
          'bonus_value': details?.bonus_report[0]?.bonus_value ?? null,
          'exgratia_status': this.exgratiaStatusMaster.find((obj: any) => {
            return obj.value == details?.bonus_report[0]?.exgratia ?? null
          }) ?? null,
          'bonus_from_month': this.monthMaster.find((obj: any) => {
            return obj.index == details?.bonus_report[0]?.bonus_from_month ?? null;
          }) ?? null,
          'bonus_from_year': details?.bonus_report[0]?.bonus_from_year ?? null,
          'bonus_to_month': this.monthMaster.find((obj: any) => {
            return obj.index == details?.bonus_report[0]?.bonus_to_month ?? null;
          }) ?? null,
          'bonus_to_year': details?.bonus_report[0]?.bonus_to_year ?? null,
          'bonus_wage_month': details?.bonus_report[0]?.bonus_wage_month ?? null,
        })

        if (details?.employee_details?.template_data?.bonus_temp_data?.disbursement_frequency == 'yearly') {
          $('#bonuswage-month')?.show(100);
          this.bonusUpdateForm.get('bonus_wage_month')?.setValidators([Validators.required])
        } else {
          $('#bonuswage-month')?.hide(100);
          this.bonusUpdateForm.get('bonus_wage_month')?.clearValidators();
        }

        this.bonusUpdateForm.get('bonus_wage_month')?.updateValueAndValidity();

        this.employeeIdBucket.push(employee_id);

        if (this.employeeIdBucket.length < 0) {
          this.toastr.warning("No Employee IDs available for the Operation");
        }
      }

      $('#updateBonusModalButton').click();
    }
  }

  updateBonus(event: any) {
    if (this.bonusUpdateForm.valid) {
      event.target.classList.add('btn-loading');

      let payload = this.getBulkUploadPayload();
      payload.bonus_value = this.bonusUpdateForm.value.bonus_value ?? "";
      payload.exgratia_status = this.bonusUpdateForm.value.exgratia_status?.value ?? "";
      payload.bonus_from_month = this.bonusUpdateForm.value.bonus_from_month?.index ?? "";
      payload.bonus_from_year = this.bonusUpdateForm.value.bonus_from_year ?? "";
      payload.bonus_to_month = this.bonusUpdateForm.value.bonus_to_month?.index ?? "";
      payload.bonus_to_year = this.bonusUpdateForm.value.bonus_to_year ?? "";
      payload.bonus_wage_month = this.bonusUpdateForm.value.bonus_wage_month ?? "";

      this.companyuserService.updateEmpBonus(payload).subscribe(res => {
        if (res.status == 'success') {
          this.employeeIdBucket = [];
          this.toastr.success(res.message);
          Global.resetForm(this.bonusUpdateForm)
          $('#updateBonusModal').find('[data-dismiss="modal"]').click();
          $('#my-datatable').dataTable().api().ajax.reload(function (json) { }, false);
          setTimeout(function () {
            $('#letterWritingEmpModalButton')?.click();
          }, 500);
        } else if (res.status == 'val_err') {
          this.toastr.error(Global.showValidationMessage(res.val_msg));
        } else {
          this.toastr.error(res.message);
        }

        event.target.classList.remove('btn-loading');
      }, (err) => {
        event.target.classList.remove('btn-loading');
        this.toastr.error(Global.showServerErrorMessage(err));
      });
    }
  }

  /**
     * =====================
     * DATA IMPORT FUNCTIONS
     * =====================
     */
  initDataImport() {
    $('#bonusImportModalOpen')?.click();

  }

  cancelDataImport() {
    Global.resetForm(this.bonusImportForm);
    $('#bonusImportModal')?.find('[data-dismiss="modal"]')?.click();
  }

  importData(event: any) {
    if (this.bonusImportForm.valid) {
      event.target.classList.add('btn-loading');
      this.bonusImportFailed = []
      this.companyuserService.importEmpBonusData({
        'emp_bonus_data_file': this.bonusImportForm.value.file ? this.bonusImportForm.value.file_source : "",
      }).subscribe(res => {
        if (res.status == 'success') {
          this.cancelDataImport();
          this.toastr.success(res.message);
          this.fetch();

          this.bonusImportFailed = res.failed_entry ?? []
          if (this.bonusImportFailed.length > 0) {
            this.toastr.warning("Please check the CSV few of the data format is incorrect")
            $('#csvFailedIdModalButton')?.click();
          }
        } else if (res.status == 'val_err') {
          this.toastr.error(Global.showValidationMessage(res.val_msg));
        } else {
          this.toastr.error(res.message);
        }

        event.target.classList.remove('btn-loading');
      }, (err) => {
        event.target.classList.remove('btn-loading');
        this.toastr.error(Global.showServerErrorMessage(err));
      });
    }
  }

  onImportFileChanged(event: any, formGroup: UntypedFormGroup, file: any, target: any) {
    if (event.target.files.length > 0) {
      const file = event.target.files[0];
      formGroup.patchValue({
        [target]: file
      });
    }
  }

 async getSampleImportCsv() {
   try {
      this.spinner.show();
      await this.companyuserService.downloadFile('export-bonus-sample-file','Bonus-sample-file')
    } catch (err:any) {
      this.spinner.hide()
      this.toastr.error(err)
    }
    // this.companyuserService.getSampleEmpBonusImportCsv({}).subscribe((res) => {
      // if (res.status == 'success') {
      // } else {
      //   this.toastr.error(res.message);
      // }

      // this.spinner.hide();
    // }, (err) => {
    //   this.toastr.error(Global.showServerErrorMessage(err));
    //   this.spinner.hide();
    // })
  }
}
