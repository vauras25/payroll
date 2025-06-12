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

@Component({
  selector: 'app-companyuser-bonus-applied',
  templateUrl: './bonus-applied.component.html',
  styleUrls: ['./bonus-applied.component.css'],
})
export class CMPBonusAppliedComponent implements OnInit {
  Global = Global;
  dtOptions: DataTables.Settings = {};

  filterForm: UntypedFormGroup;
  bonusUpdateForm: UntypedFormGroup;
  bonusImportForm: UntypedFormGroup;

  exgratiaStatusMaster = [
    { value: 'on', description: 'ON' },
    { value: 'off', description: 'OFF' },
  ];

  employeeIdBucket: any[];
  csvFailedIds: any[];
  bonusImportFailed: any[] = [];

  rowCheckedAll: Boolean = false;
  checkedRowIds: any[] = [];
  uncheckedRowIds: any[] = [];

  last_emp_id: any = null;

  employeeListFilter: any ;
  selectedEmployeeForUpdate: any;
  currentYear = new Date().getFullYear();
  currentMonth = new Date().getMonth();

  constructor(
    public formBuilder: UntypedFormBuilder,
    private titleService: Title,
    private companyuserService: CompanyuserService,
    private toastr: ToastrService,
    private router: Router,
    private spinner: NgxSpinnerService,
    public AppComponent: AppComponent
  ) {
    if (
      !Global.checkCompanyModulePermission({
        company_module: 'bonus',
        company_sub_module: 'apply_bonus',
        company_sub_operation: ['view'],
        company_strict: true,
      })
    ) {
      setTimeout(() => {
        router.navigate(['company/errors/unauthorized-access'], {
          skipLocationChange: true,
        });
      }, 500);
      return;
    }

    this.bonusUpdateForm = formBuilder.group({
      bonus_value: [null, Validators.compose([Validators.required])],
      exgratia_status: [null, Validators.compose([Validators.required])],
      bonus_from_month: [null, Validators.compose([Validators.required])],
      bonus_from_year: [
        null,
        Validators.compose([
          Validators.required,
          Validators.pattern('^[0-9]*$'),
          Validators.minLength(4),
          Validators.maxLength(4),
        ]),
      ],
      bonus_to_month: [null, Validators.compose([Validators.required])],
      bonus_to_year: [null, Validators.compose([Validators.required])],
      bonus_g_month: [null, Validators.compose([Validators.required])],
      bonus_g_year: [null, Validators.compose([Validators.required])],
      bonus_slot:[null],
      bonus_slot_year:[null]
      // "bonus_wage_month": [null, Validators.compose([])],
    });

    this.bonusImportForm = formBuilder.group({
      file: [null, Validators.compose([Validators.required])],
      file_source: [null, Validators.compose([Validators.required])],
    });

    this.employeeIdBucket = [];
    this.csvFailedIds = [];
  }

  ngOnInit(): void {
    this.titleService.setTitle('Bonus Management - ' + Global.AppName);
    this.fetch();
  }

  filterDataTable(payload?: any) {
    if (payload) {
      this.employeeListFilter = payload;
    }
    $('#my-datatable_filter').find('[type="search"]').val('');
    $('#my-datatable').DataTable().search('').draw();
  }

  // resetDataTableFilter() {
  //   Global.resetForm(this.filterForm);
  // }

  getPayload() {
    let payload: any = {
      searchkey: $('#my-datatable_filter').find('input[type="search"]').val() ?? '',
      row_checked_all: this.rowCheckedAll,
      checked_row_ids: JSON.stringify(this.checkedRowIds),
      unchecked_row_ids: JSON.stringify(this.uncheckedRowIds),
      hod_id: this.employeeListFilter?.hod_id ?? '',
      department_id: this.employeeListFilter?.department_id ?? '',
      designation_id: this.employeeListFilter?.designation_id ?? '',
      branch_id: this.employeeListFilter?.branch_id ?? '',
      disbursement_frequency:
        this.employeeListFilter?.disbursement_frequency ?? 'monthly',
      disbursement_type:
        this.employeeListFilter?.disbursement_type ?? 'percent',
    };
    return payload;
  }

  getBulkUploadPayload() {
    let payload: any = {};

    if (this.employeeIdBucket.length > 0) {
      payload = {
        checked_row_ids: JSON.stringify(this.employeeIdBucket),
        searchkey: $('#my-datatable_filter').find('input[type="search"]').val() ?? '',
        hod_id: '',
        department_id: '',
        designation_id: '',
        branch_id: '',
        row_checked_all: false,
        unchecked_row_ids: JSON.stringify([]),
      };
    } else {
      
      payload = {
        searchkey:$('#my-datatable_filter').find('input[type="search"]').val() ?? '',
        hod_id: this.employeeListFilter.hod_id || '',
        department_id: this.employeeListFilter.department_id || '',
        designation_id: this.employeeListFilter.designation_id || '',
        branch_id: this.employeeListFilter.branch_id || '',
        row_checked_all: this.rowCheckedAll,
        checked_row_ids: JSON.stringify(this.checkedRowIds),
        unchecked_row_ids: JSON.stringify(this.uncheckedRowIds),
      };
    }

    return payload;
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

  fetch() {
    this.dtOptions = {
      ajax: (dataTablesParameters: any, callback) => {
        if (dataTablesParameters.search.value != '') {
          // this.resetDataTableFilter();
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

        this.companyuserService.getBonusForm(payload).subscribe(
          (res) => {
            if (res.status == 'success') {
              var docs: any[] = res.employees.docs;

              docs.forEach((doc: any) => {
                doc.checked = this.isRowChecked(doc._id);
              });

              callback({
                recordsTotal: res.employees.totalDocs,
                recordsFiltered: res.employees.totalDocs,
                data: res.employees.docs || [],
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
          visible: true,
          className: 'text-center',
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
          visible: true,
          orderable: false,
        },
        {
          render: function (data, type, full, meta: any) {
            let html = ``;
            if (
              Global.checkCompanyModulePermission({
                company_module: 'bonus',
                company_sub_module: 'apply_bonus',
                company_sub_operation: ['edit'],
                company_strict: true,
              })
            ) {
              html += `<a href="javascript:;"  id="editButton" class="btn btn-primary btn-icon mg-r-5" data-toggle="tooltip" data-placement="top" title="Edit"><div style="width:25px; height:25px;"><i class="fa fa-edit"></i></div></a>`;
            } else {
              html = '-';
            }
            return html;
          },
          visible: Global.checkCompanyModulePermission({
            company_module: 'bonus',
            company_sub_module: 'apply_bonus',
            company_sub_operation: ['edit'],
            company_strict: true,
          }),
          orderable: false,
          data: 'action',
          className: 'text-center',
        },
        {
          render: function (data, type, full, meta: any) {
            return full.emp_id ?? '';
          },
          orderable: true,
          data: 'emp_id',
          visible: true,
        },
        {
          render: function (data, type, full, meta: any) {
            return `<img src="https://via.placeholder.com/500" class="profile-photo">`;
          },
          orderable: false,
          className: 'text-center',
          visible: true,
        },
        {
          render: function (data, type, full, meta: any) {
            return full.emp_first_name;
          },
          orderable: true,
          visible: true,
          data: 'emp_first_name',
        },
        {
          render: function (data, type, full, meta: any) {
            return full.emp_last_name;
          },
          orderable: true,
          data: 'emp_last_name',
          visible: true,
        },
        {
          render: function (data, type, full, meta: any) {
            return full.email_id;
          },
          orderable: true,
          data: 'email_id',
          visible: true,
        },
        {
          render: function (data, type, full, meta: any) {
            return full.bonus_module[0]?.bonus_value ?? '-';
          },
          orderable: false,
          visible: true,
        },
        {
          render: function (data, type, full, meta: any) {
            let html = '-';
            if (
              full.employee_details?.template_data?.bonus_temp_data
                ?.disbursement_type
            ) {
              html = `<span class="text-uppercase">${full.employee_details?.template_data?.bonus_temp_data?.disbursement_type}</span>`;
            }

            return html;
          },
          orderable: false,
          visible: true,
        },
        {
          render: function (data, type, full, meta: any) {
            let html = '-';
            if (
              full.employee_details?.template_data?.bonus_temp_data
                ?.disbursement_frequency
            ) {
              html = `<span class="text-uppercase">${full.employee_details?.template_data?.bonus_temp_data?.disbursement_frequency}</span>`;
            }

            return html;
          },
          orderable: false,
          visible: true,
        },
        {
          render: function (data, type, full, meta: any) {
            return full.bonus_module[0]?.exgratia
              ? `<span class="text-uppercase">` +
                  full.bonus_module[0]?.exgratia +
                  `</span>`
              : '-';
          },
          orderable: false,
          visible: true,
        },
        {
          render: function (data, type, full, meta: any) {
            if (full.bonus_module[0]?.bonus_from_date) {
              var datePipe = new DatePipe('en-US');
              let value = datePipe.transform(
                full.bonus_module[0]?.bonus_from_date,
                'dd/MM/yyyy'
              );
              return value;
            } else {
              return '-';
            }
          },
          orderable: false,
          visible: true,
        },
        {
          render: function (data, type, full, meta: any) {
            if (full.bonus_module[0]?.bonus_to_date) {
              var datePipe = new DatePipe('en-US');
              let value = datePipe.transform(
                full.bonus_module[0]?.bonus_to_date,
                'dd/MM/yyyy'
              );
              return value;
            } else {
              return '-';
            }
          },
          orderable: false,
          visible: true,
        },
      ],
      rowCallback: (row: Node, data: any | Object, index: number) => {
        const self = this;

        $('table').on('click', '#checkrow-' + index, function () {
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

  frequancyMaster: any[] = [];

  async openBonusEditModal(
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
      Global.resetForm(this.bonusUpdateForm);
      this.employeeIdBucket = [];
      //   this.selectedEmployeeForUpdate = details;

      if (type == 'single') {
        this.bonusUpdateForm.patchValue({
          bonus_value: details?.bonus_module[0]?.bonus_value ?? null,
          exgratia_status:
            this.exgratiaStatusMaster.find((obj: any) => {
              return obj.value == details?.bonus_module[0]?.exgratia ?? null;
            }) ?? null,
          bonus_from_month:
            this.Global.monthMaster.find((obj: any) => {
              return (
                obj.index == details?.bonus_module[0]?.bonus_from_month ?? null
              );
            }) ?? null,
          bonus_from_year: details?.bonus_module[0]?.bonus_from_year ?? null,
          bonus_to_month:
            this.Global.monthMaster.find((obj: any) => {
              return (
                obj.index == details?.bonus_module[0]?.bonus_to_month ?? null
              );
            }) ?? null,
          bonus_to_year: details?.bonus_module[0]?.bonus_to_year ?? null,
          bonus_g_month:
            this.Global.monthMaster.find((obj: any) => {
              return (
                obj.index == details?.bonus_module[0]?.bonus_g_month ?? null
              );
            }) ?? null,
          bonus_g_year: details?.bonus_module[0]?.bonus_g_year ?? null,
          // 'bonus_wage_month': details?.bonus_module[0]?.bonus_wage_month ?? null,
        });

        // if (details?.employee_details?.template_data?.bonus_temp_data?.disbursement_frequency == 'yearly') {
        //   $('#bonuswage-month')?.show(100);
        //   this.bonusUpdateForm.get('bonus_wage_month')?.setValidators([Validators.required])
        // } else {
        //   $('#bonuswage-month')?.hide(100);
        //   this.bonusUpdateForm.get('bonus_wage_month')?.clearValidators();
        // }

        // this.bonusUpdateForm.get('bonus_wage_month')?.updateValueAndValidity();

        this.employeeIdBucket.push(employee_id);

        if (this.employeeIdBucket.length < 0) {
          this.toastr.warning('No Employee IDs available for the Operation');
        }
      }

      if (this.employeeListFilter?.disbursement_type == 'fixed') {
        this.bonusUpdateForm.get('exgratia_status')?.clearValidators();
        this.bonusUpdateForm.get('exgratia_status')?.setValue('');
      }

      if (
        this.employeeListFilter?.disbursement_type == 'fixed' ||
        this.employeeListFilter?.disbursement_frequency == 'monthly'
      ) {
        this.bonusUpdateForm.get('bonus_from_month')?.clearValidators();
        this.bonusUpdateForm.get('bonus_from_month')?.setValue('');
        this.bonusUpdateForm.get('bonus_from_year')?.clearValidators();
        this.bonusUpdateForm.get('bonus_from_year')?.setValue('');
        this.bonusUpdateForm.get('bonus_to_month')?.clearValidators();
        this.bonusUpdateForm.get('bonus_to_month')?.setValue('');
        this.bonusUpdateForm.get('bonus_to_year')?.clearValidators();
        this.bonusUpdateForm.get('bonus_to_year')?.setValue('');
      }

      if (this.employeeListFilter?.disbursement_frequency == 'monthly') {
        this.bonusUpdateForm.get('bonus_g_month')?.clearValidators();
        this.bonusUpdateForm.get('bonus_g_month')?.setValue('');
        this.bonusUpdateForm.get('bonus_g_year')?.clearValidators();
        this.bonusUpdateForm.get('bonus_g_year')?.setValue('');
      }
      
      if (
        this.employeeListFilter?.disbursement_type !== 'fixed' &&
        this.employeeListFilter?.disbursement_frequency !== 'monthly' &&
        this.employeeListFilter?.disbursement_frequency !== 'yearly'
      ) {
        let res = Global.getFrequencyMonths(
          details?.employee_details?.template_data?.bonus_temp_data
          ?.disbursement_frequency
        );
        if (res) {
          this.frequancyMaster = res.describedData.map((d) => {
            const fromSf = Global.monthMaster.find(
              (m) => m.index == d.fromMonth.index
            )?.sf;
            const endSf = Global.monthMaster.find(
              (m) => m.index == d.toMonth.index
            )?.sf;
            return {
              description: `${fromSf} - ${endSf}`,
              value: d,
            };
          });
      if (type == 'single') {

          if (details?.bonus_module?.length) {
            const bonus_slot = this.frequancyMaster.find((m) => {
              if (
                details.bonus_module?.[0]?.bonus_from_month ==
                m?.value?.fromMonth?.index &&
                details.bonus_module?.[0]?.bonus_to_month ==
                m?.value?.toMonth?.index
              ) {
                return m;
              }
            });
            
            this.bonusUpdateForm.get('bonus_slot')?.setValue(bonus_slot);
            this.bonusUpdateForm.get('bonus_slot_year')?.setValue(details?.bonus_module[0]?.bonus_to_year);


            console.log(bonus_slot);
            
          }
        }
        }
      }

      $('#updateBonusModalButton').click();
    }
  }

  setBonusMonth(month: any) {
    console.log(month?.value?.value);

    if (month?.value?.value) {
      this.bonusUpdateForm
        .get('bonus_from_month')
        ?.setValue(month?.value?.value?.fromMonth?.index || 0);
      this.bonusUpdateForm
        .get('bonus_to_month')
        ?.setValue(month?.value?.value?.toMonth?.index || 0);
    }
  }
  setBonusYear(year: any) {
    console.log(year?.value);

    if (year?.value) {
      this.bonusUpdateForm.get('bonus_from_year')?.setValue(year?.value);
      this.bonusUpdateForm.get('bonus_to_year')?.setValue(year?.value);
    }
  }

  updateBonus(event: any) {
    if (this.bonusUpdateForm.valid) {
      event.target.classList.add('btn-loading');

      let payload = this.getBulkUploadPayload();
      console.log(payload);

      payload.bonus_value = +this.bonusUpdateForm.value.bonus_value ?? '';
      if (this.employeeListFilter?.disbursement_type !== 'fixed') {
        payload.exgratia_status =
          this.bonusUpdateForm.value.exgratia_status?.value ?? '';
        payload.bonus_from_year =
          +this.bonusUpdateForm.value.bonus_from_year ?? '';
        payload.bonus_to_year = +this.bonusUpdateForm.value.bonus_to_year ?? '';
        if (this.employeeListFilter?.disbursement_frequency == 'yearly') {
          payload.bonus_from_month =
            +this.bonusUpdateForm.value.bonus_from_month?.index ?? '';
          payload.bonus_to_month =
            +this.bonusUpdateForm.value.bonus_to_month?.index ?? '';
        } else if (
          this.employeeListFilter?.disbursement_frequency !== 'monthly'
        ) {
          payload.bonus_from_month =
            +this.bonusUpdateForm.value.bonus_from_month ?? '';
          payload.bonus_to_month =
            +this.bonusUpdateForm.value.bonus_to_month ?? '';
        }
      }

      if (this.employeeListFilter?.disbursement_frequency !== 'monthly') {
        payload.bonus_g_month =
          +this.bonusUpdateForm.value.bonus_g_month?.index ?? '';
        payload.bonus_g_year = +this.bonusUpdateForm.value.bonus_g_year ?? '';

        if (this.employeeListFilter?.disbursement_type !== 'fixed') {
          if (this.employeeListFilter?.disbursement_frequency !== 'yearly') {
            if (
              payload.bonus_to_year > this.currentYear ||
              (payload.bonus_to_year == this.currentYear &&
                payload.bonus_to_month > this.currentMonth)
            ) {
              this.toastr.error(
                'Selected slot range Must be less then currunt month'
              );
              return;
            }
          }

          if (
            payload.bonus_g_year < payload.bonus_to_year ||
            (payload.bonus_g_year == payload.bonus_to_year &&
              payload.bonus_g_month < payload.bonus_to_month)
          ) {
            this.toastr.error(
              `Disburse Date can't be shorter then selected slot`
            );
          }
        }
      }

      this.companyuserService.updateEmpBonus(payload).subscribe(
        (res) => {
          if (res.status == 'success') {
            this.employeeIdBucket = [];
            this.toastr.success(res.message);
            Global.resetForm(this.bonusUpdateForm);
            $('#updateBonusModal').find('[data-dismiss="modal"]').click();
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

  runBonus() {
    return new Promise((resolve, reject) => {
      if (
        this.rowCheckedAll == false &&
        this.checkedRowIds.length == 0 &&
        this.uncheckedRowIds.length == 0
      ) {
        // this.toastr.error("Please select atleast one employee to continue");
        return;
      }

      this.spinner.show();
      this.companyuserService
        .runBonusSheet({
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
    });
  }

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
          this.bonusImportFailed = [];
          this.spinner.show();
          this.companyuserService
              .importEmpBonusData({
                  emp_bonus_data_file: this.bonusImportForm.value.file ? this.bonusImportForm.value.file_source : '',
              })
              .subscribe(
                  (res) => {
                      if (res.status == 'success') {
                        this.cancelDataImport();
                        this.toastr.success(res.message);
                        this.fetch();
                        $('#my-datatable_filter').find('[type="search"]').val('');
                        $('#my-datatable').DataTable().search('').draw();
                        this.spinner.hide();

                          this.bonusImportFailed = res.failed_entry ?? [];
                          if (this.bonusImportFailed.length > 0) {
                              this.toastr.warning(
                                  'Please check the CSV few of the data format is incorrect'
                              );
                              $('#csvFailedIdModalButton')?.click();
                          }
                      } else if (res.status == 'val_err') {
                          this.spinner.hide();
                          this.toastr.error(Global.showValidationMessage(res.val_msg));
                      } else {
                        this.spinner.hide();
                          this.toastr.error(res.message);
                      }
                      this.spinner.hide();
                      event.target.classList.remove('btn-loading');
                  },
                  (err) => {
                    this.spinner.hide();
                      event.target.classList.remove('btn-loading');
                      this.toastr.error(Global.showServerErrorMessage(err));
                  }
              );
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

  async getSampleImportCsv() {
      try {
          if(
            this.employeeListFilter?.disbursement_frequency == 'monthly' ||
            this.employeeListFilter?.disbursement_type == 'percent'
          ){
            return;
          }
          this.spinner.show();
          await this.companyuserService.downloadFile('export-bonus-sample-file','Bonus-Sample', {
            disbursement_frequency:this.employeeListFilter?.disbursement_frequency,
            disbursement_type:this.employeeListFilter?.disbursement_type
          })
          // saveAs(file, );
          this.spinner.hide()
      } catch (err: any) {
          this.spinner.hide();
          this.toastr.error(err?.message)
      }
  }

}
