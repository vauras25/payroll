import { DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';
import { disableDebugTools, Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import * as Global from 'src/app/globals';
import { AdminService } from 'src/app/services/admin.service';
import swal from 'sweetalert2';

@Component({
  selector: 'admin-app-clientpackages',
  templateUrl: './clientpackages.component.html',
  styleUrls: ['./clientpackages.component.css'],
})
export class ADClientpackagesComponent implements OnInit {
  dtOptions: DataTables.Settings = {};
  packageForm: UntypedFormGroup;
  editActionId: String;

  pfRulesMaster: any = [];
  pfRuleTypesMaster: any = [];
  gratuityRulesMaster: any = [];
  gratuityRuleTypesMaster: any = [];
  esicRulesMaster: any = [];
  esicRuleTypesMaster: any = [];
  ptaxRulesMaster: any = [];
  ptaxRuleTypesMaster: any = [];
  bonusRulesMaster: any = [];
  bonusRuleTypesMaster: any = [];
  lwfRulesMaster: any = [];
  lwfRuleTypesMaster: any = [];
  tdsRulesMaster: any = [];
  tdsRuleTypesMaster: any = [];
  rulesPermissionMaster: any = [];
  permissionMaster: any = [];
  restrict_toggles: any[];
  restrict_fields = [
    'listing_add_approve',
    'attendance_upload',
    'attendance_edit',
    'attendance_report',
    'run_payroll',
    'salary_earning_report',
    'apply_incentive',
    'bonus_run',
  ];

  constructor(
    public formBuilder: UntypedFormBuilder,
    private titleService: Title,
    private toastr: ToastrService,
    private router: Router,
    private adminService: AdminService,
    private spinner: NgxSpinnerService
  ) {
    this.pfRulesMaster = [
      { value: 'yes', description: 'PF Applicable' },
      { value: 'no', description: 'PF Not Applicable' },
    ];

    this.pfRuleTypesMaster = [
      { value: 'default', description: 'Default PF Rule' },
      { value: 'customizable', description: 'Customizable PF Rule' },
    ];

    this.gratuityRulesMaster = [
      { value: 'yes', description: 'Gratuity Applicable' },
      { value: 'no', description: 'Gratuity Not Applicable' },
    ];

    this.gratuityRuleTypesMaster = [
      { value: 'default', description: 'Default Gratuity Rule' },
      { value: 'customizable', description: 'Customizable Gratuity Rule' },
    ];

    this.esicRulesMaster = [
      { value: 'yes', description: 'ESIC Applicable' },
      { value: 'no', description: 'ESIC Not Applicable' },
    ];

    this.esicRuleTypesMaster = [
      { value: 'default', description: 'Default ESIC Rule' },
      { value: 'customizable', description: 'Customizable ESIC Rule' },
    ];

    this.ptaxRulesMaster = [
      { value: 'yes', description: 'P-Tax Applicable' },
      { value: 'no', description: 'P-Tax Not Applicable' },
    ];

    this.ptaxRuleTypesMaster = [
      { value: 'default', description: 'Default P-Tax Rule' },
      { value: 'customizable', description: 'Customizable P-Tax Rule' },
    ];

    this.bonusRulesMaster = [
      { value: 'yes', description: 'Bonus Applicable' },
      { value: 'no', description: 'Bonus Not Applicable' },
    ];

    this.bonusRuleTypesMaster = [
      { value: 'default', description: 'Default Bonus Rule' },
      { value: 'customizable', description: 'Customizable Bonus Rule' },
    ];

    this.lwfRulesMaster = [
      { value: 'yes', description: 'Lwf Applicable' },
      { value: 'no', description: 'Lwf Not Applicable' },
    ];

    this.lwfRuleTypesMaster = [
      { value: 'default', description: 'Default Lwf Rule' },
      { value: 'customizable', description: 'Customizable Lwf Rule' },
    ];

    this.tdsRulesMaster = [
      { value: 'yes', description: 'TDS Applicable' },
      { value: 'no', description: 'TDS Not Applicable' },
    ];

    this.tdsRuleTypesMaster = [
      { value: 'default', description: 'Default TDS Rule' },
      { value: 'customizable', description: 'Customizable TDS Rule' },
    ];

    (this.rulesPermissionMaster = {
      providentFunds: [
        {
          value: 'internal_report',
          description: 'Internal Report',
          isDisable: false,
          isChecked: false,
        },
        {
          value: 'compliance_report',
          description: 'Compliance Report',
          isDisable: true,
          isChecked: true,
        },
        {
          value: 'compliance_confirmation',
          description: 'Compliance Confirmation',
          isDisable: false,
          isChecked: false,
        },
        {
          value: 'compliance_audit_summary',
          description: 'Compliance Audit Summary',
          isDisable: false,
          isChecked: false,
        },
        // { 'value': 'audit_report', 'description': 'Audit report', isDisable:false, isChecked:false },
        {
          value: 'summary_briefcase',
          description: 'Summary Briefcase',
          isDisable: false,
          isChecked: false,
        },
      ],
      esic: [
        {
          value: 'internal_report',
          description: 'Internal Report',
          isDisable: false,
          isChecked: false,
        },
        {
          value: 'compliance_report',
          description: 'Compliance Report',
          isDisable: true,
          isChecked: true,
        },
        {
          value: 'compliance_confirmation',
          description: 'Compliance Confirmation',
          isDisable: false,
          isChecked: false,
        },
        {
          value: 'compliance_audit_summary',
          description: 'Compliance Audit Summary',
          isDisable: false,
          isChecked: false,
        },
        // { 'value': 'audit_report', 'description': 'Audit report', isDisable:false, isChecked:false },
        {
          value: 'summary_briefcase',
          description: 'Summary Briefcase',
          isDisable: false,
          isChecked: false,
        },
      ],
      gratuity: [
        {
          value: 'internal_report',
          description: 'Internal Report',
          isDisable: false,
          isChecked: false,
        },
        {
          value: 'compliance_report',
          description: 'Compliance Report',
          isDisable: false,
          isChecked: false,
        },
        {
          value: 'compliance_confirmation',
          description: 'Compliance Confirmation',
          isDisable: false,
          isChecked: false,
        },
        {
          value: 'compliance_audit_summary',
          description: 'Compliance Audit Summary',
          isDisable: false,
          isChecked: false,
        },
        {
          value: 'audit_report',
          description: 'Audit report',
          isDisable: false,
          isChecked: false,
        },
        {
          value: 'summary_briefcase',
          description: 'Summary Briefcase',
          isDisable: false,
          isChecked: false,
        },
        {
          value: 'govt_forms',
          description: 'Govt Forms',
          isDisable: false,
          isChecked: false,
        },
      ],
      professionalTax: [
        {
          value: 'internal_report',
          description: 'Internal Report',
          isDisable: false,
          isChecked: false,
        },
        {
          value: 'compliance_report',
          description: 'Compliance Report',
          isDisable: false,
          isChecked: false,
        },
        {
          value: 'compliance_confirmation',
          description: 'Compliance Confirmation',
          isDisable: false,
          isChecked: false,
        },
        {
          value: 'compliance_audit_summary',
          description: 'Compliance Audit Summary',
          isDisable: false,
          isChecked: false,
        },
        {
          value: 'audit_report',
          description: 'Audit report',
          isDisable: false,
          isChecked: false,
        },
        {
          value: 'summary_briefcase',
          description: 'Summary Briefcase',
          isDisable: false,
          isChecked: false,
        },
        {
          value: 'govt_forms',
          description: 'Govt Forms',
          isDisable: false,
          isChecked: false,
        },
      ],
      bonus: [
        {
          value: 'internal_report',
          description: 'Internal Report',
          isDisable: false,
          isChecked: false,
        },
        {
          value: 'compliance_report',
          description: 'Compliance Report',
          isDisable: false,
          isChecked: false,
        },
        {
          value: 'compliance_confirmation',
          description: 'Compliance Confirmation',
          isDisable: false,
          isChecked: false,
        },
        {
          value: 'compliance_audit_summary',
          description: 'Compliance Audit Summary',
          isDisable: false,
          isChecked: false,
        },
        // { 'value': 'audit_report', 'description': 'Audit report', isDisable:false, isChecked:false },
      ],
      tds: [
        {
          value: 'internal_report',
          description: 'Internal Report',
          isDisable: false,
          isChecked: false,
        },
        {
          value: 'compliance_report',
          description: 'Compliance Report',
          isDisable: false,
          isChecked: false,
        },
        {
          value: 'compliance_confirmation',
          description: 'Compliance Confirmation',
          isDisable: false,
          isChecked: false,
        },
        {
          value: 'compliance_audit_summary',
          description: 'Compliance Audit Summary',
          isDisable: false,
          isChecked: false,
        },
        // { 'value': 'audit_report', 'description': 'Audit report', isDisable:false, isChecked:false },
      ],
      lwf: [
        {
          value: 'internal_report',
          description: 'Internal Report',
          isDisable: false,
          isChecked: false,
        },
        {
          value: 'compliance_report',
          description: 'Compliance Report',
          isDisable: false,
          isChecked: false,
        },
        {
          value: 'compliance_confirmation',
          description: 'Compliance Confirmation',
          isDisable: false,
          isChecked: false,
        },
        {
          value: 'compliance_audit_summary',
          description: 'Compliance Audit Summary',
          isDisable: false,
          isChecked: false,
        },
        // { 'value': 'audit_report', 'description': 'Audit report', isDisable:false, isChecked:false },
        // { 'value': 'summary_briefcase', 'description': 'Summary Briefcase', isDisable:false, isChecked:false },
        {
          value: 'govt_forms',
          description: 'Govt Forms',
          isDisable: false,
          isChecked: false,
        },
      ],
    }),
      // this.gratuityRulesMaster = [
      //   { 'value': 'internal_report', 'description': 'Internal Report' },
      //   { 'value': 'compliance_report', 'description': 'Compliance Report' },
      //   { 'value': 'compliance_confirmation', 'description': 'Compliance Confirmation' },
      //   { 'value': 'compliance_audit_summary', 'description': 'Compliance Audit Summary' },
      //   { 'value': 'audit_report', 'description': 'Audit report' },
      //   { 'value': 'summary_briefcase', 'description': 'Summary Briefcase' },
      //   { 'value': 'govt_forms', 'description': 'Govt Briefcase' },
      // ]

      (this.permissionMaster = []);
    this.restrict_toggles = ['employee', 'attendance', 'salary'];

    this.packageForm = formBuilder.group({
      package_name: [null, Validators.compose([Validators.required])],
      employee_vault: [
        null,
        Validators.compose([
          Validators.required,
          Validators.pattern('^[0-9]*$'),
        ]),
      ],

      gov_pf_rule: [null, Validators.compose([Validators.required])],
      gov_pf_rule_type: [null, Validators.compose([Validators.required])],
      gov_pf_permission: this.formBuilder.array([]),

      gov_esic_rule: [null, Validators.compose([Validators.required])],
      gov_esic_rule_type: [null, Validators.compose([Validators.required])],
      gov_esic_permission: this.formBuilder.array([]),

      gov_gratuity_rule: [null, Validators.compose([Validators.required])],
      gov_gratuity_rule_type: [null, Validators.compose([Validators.required])],
      gov_gratuity_permission: this.formBuilder.array([]),

      gov_ptax_rule: [null, Validators.compose([Validators.required])],
      gov_ptax_rule_type: [null, Validators.compose([Validators.required])],
      gov_ptax_permission: this.formBuilder.array([]),

      gov_bonus_rule: [null, Validators.compose([Validators.required])],
      gov_bonus_rule_type: [null, Validators.compose([Validators.required])],
      gov_bonus_permission: this.formBuilder.array([]),

      gov_lwf_rule: [null, Validators.compose([Validators.required])],
      gov_lwf_rule_type: [null, Validators.compose([Validators.required])],
      gov_lwf_permission: this.formBuilder.array([]),

      gov_tds_rule: [null, Validators.compose([Validators.required])],
      gov_tds_rule_type: [null, Validators.compose([Validators.required])],
      gov_tds_permission: this.formBuilder.array([]),
    });

    this.editActionId = '';

    this.packageForm.get('gov_pf_rule')?.valueChanges.subscribe((val) => {
      if (val.value == 'yes') {
        $('.gov-pf-rule-fields').show(500);
        this.packageForm.controls['gov_pf_rule_type'].setValidators([
          Validators.required,
        ]);
      } else {
        $('.gov-pf-rule-fields').hide(500);
        this.packageForm.controls['gov_pf_rule_type'].clearValidators();
      }

      this.packageForm.controls['gov_pf_rule_type'].updateValueAndValidity();
    });

    this.packageForm.get('gov_esic_rule')?.valueChanges.subscribe((val) => {
      if (val.value == 'yes') {
        $('.gov-esic-rule-fields').show(500);
        this.packageForm.controls['gov_esic_rule_type'].setValidators([
          Validators.required,
        ]);
      } else {
        $('.gov-esic-rule-fields').hide(500);
        this.packageForm.controls['gov_esic_rule_type'].clearValidators();
      }

      this.packageForm.controls['gov_esic_rule_type'].updateValueAndValidity();
    });

    this.packageForm.get('gov_gratuity_rule')?.valueChanges.subscribe((val) => {
      if (val.value == 'yes') {
        $('.gov-gratuity-rule-fields').show(500);
        this.packageForm.controls['gov_gratuity_rule_type'].setValidators([
          Validators.required,
        ]);
      } else {
        $('.gov-gratuity-rule-fields').hide(500);
        this.packageForm.controls['gov_gratuity_rule_type'].clearValidators();
      }

      this.packageForm.controls[
        'gov_gratuity_rule_type'
      ].updateValueAndValidity();
    });

    this.packageForm.get('gov_ptax_rule')?.valueChanges.subscribe((val) => {
      if (val.value == 'yes') {
        $('.gov-ptax-rule-fields').show(500);
        this.packageForm.controls['gov_ptax_rule_type'].setValidators([
          Validators.required,
        ]);
      } else {
        $('.gov-ptax-rule-fields').hide(500);
        this.packageForm.controls['gov_ptax_rule_type'].clearValidators();
      }

      this.packageForm.controls['gov_ptax_rule_type'].updateValueAndValidity();
    });

    this.packageForm.get('gov_bonus_rule')?.valueChanges.subscribe((val) => {
      if (val.value == 'yes') {
        $('.gov-bonus-rule-fields').show(500);
        this.packageForm.controls['gov_bonus_rule_type'].setValidators([
          Validators.required,
        ]);
      } else {
        $('.gov-bonus-rule-fields').hide(500);
        this.packageForm.controls['gov_bonus_rule_type'].clearValidators();
      }

      this.packageForm.controls['gov_bonus_rule_type'].updateValueAndValidity();
    });
    this.packageForm.get('gov_tds_rule')?.valueChanges.subscribe((val) => {
      if (val.value == 'yes') {
        $('.gov-tds-rule-fields').show(500);
        this.packageForm.controls['gov_tds_rule_type'].setValidators([
          Validators.required,
        ]);
      } else {
        $('.gov-tds-rule-fields').hide(500);
        this.packageForm.controls['gov_tds_rule_type'].clearValidators();
      }

      this.packageForm.controls['gov_tds_rule_type'].updateValueAndValidity();
    });

    this.packageForm.get('gov_lwf_rule')?.valueChanges.subscribe((val) => {
      if (val.value == 'yes') {
        $('.gov-lwf-rule-fields').show(500);
        this.packageForm.controls['gov_lwf_rule_type'].setValidators([
          Validators.required,
        ]);
      } else {
        $('.gov-lwf-rule-fields').hide(500);
        this.packageForm.controls['gov_lwf_rule_type'].clearValidators();
      }

      this.packageForm.controls['gov_lwf_rule_type'].updateValueAndValidity();
    });
  }

  ngOnInit() {
    this.titleService.setTitle('Client Package - ' + Global.AppName);

    this.fetch();
    this.fetchPermissions();
  }

  fetchPermissions() {
    this.spinner.show();

    this.adminService.fetchPackagePermissionList().subscribe(
      (res) => {
        if (res.status == 'success') {
          this.permissionMaster = res.package_option;

          let $_this = this;
          setTimeout(function () {
            $_this.resetSelectedPermissions();
          }, 100);
        } else {
          this.toastr.error(res.message);
        }

        this.spinner.hide();
      },
      (err) => {
        this.toastr.error(
          'Internal server error occured. Please try again later.'
        );
        this.spinner.hide();
      }
    );
  }

  fetch() {
    this.dtOptions = {
      ajax: (dataTablesParameters: any, callback) => {
        this.adminService
          .fetchClientPackages({
            pageno: dataTablesParameters.start / Global.DataTableLength + 1,
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
                  recordsTotal: res.package_list.totalDocs,
                  recordsFiltered: res.package_list.totalDocs,
                  data: res.package_list.docs,
                });
              } else {
                this.toastr.error(res.message);
              }
            },
            (err) => {
              this.toastr.error(
                'Internal server error occured. Please try again later.'
              );
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
            return (
              `<button class="btn btn-primary btn-icon mx-1" data-toggle="tooltip" data-placement="top" title="Edit" id="editButton-` +
              meta.row +
              `">
                        <div style="width:25px; height:25px;"><i class="fa fa-pen"></i></div>
                    </button>
                    <button class="btn btn-danger btn-icon mx-1" data-toggle="tooltip" data-placement="top" title="Delete" id="deleteButton-` +
              meta.row +
              `">
                        <div style="width:25px; height:25px;"><i class="fa fa-trash"></i></div>
                    </button>`
            );
          },
          className: 'text-center',
          orderable: false,
        },
        {
          render: function (data, type, full, meta) {
            return full.package_name;
          },
          orderable: true,
          name: 'package_name',
        },
        {
          render: function (data, type, full, meta) {
            var datePipe = new DatePipe('en-US');
            let value = datePipe.transform(full.created_at, 'dd/MM/yyyy');
            return value;
          },
          orderable: true,
          name: 'created_at',
        },
      ],
      drawCallback: function (settings) {},
      rowCallback: (row: Node, data: any[] | Object, index: number) => {
        const self = this;
        $('table').on('click', '#editButton-' + index, function () {
          self.getEdit(data);
        });

        $('table').on('click', '#deleteButton-' + index, function () {
          self.deleteItem(data);
        });

        return row;
      },
      pagingType: 'full_numbers',
      serverSide: true,
      processing: true,
      ordering: true,
      order: [],
      searching: true,
      pageLength: Global.DataTableLength,
      lengthChange: true,
      lengthMenu: Global.DataTableLengthChangeMenu,
      responsive: true,
      language: {
        searchPlaceholder: 'Search...',
        search: '',
      },
    };
  }

  getEdit(item: any) {
    this.editActionId = item._id;

    this.checkPermissionsforEdit(item.module);

    this.packageForm.patchValue({
      package_name: item.package_name,
      employee_vault: item.employee_vault,

      gov_pf_rule: this.pfRulesMaster.find((obj: any) => {
        return obj.value == item.gov_pf_rule?.rule_apply;
      }),
      gov_pf_rule_type: this.pfRuleTypesMaster.find((obj: any) => {
        return obj.value == item.gov_pf_rule?.rule_type ?? null;
      }),

      gov_esic_rule: this.esicRulesMaster.find((obj: any) => {
        return obj.value == item.gov_esic_rule?.rule_apply;
      }),
      gov_esic_rule_type: this.esicRuleTypesMaster.find((obj: any) => {
        return obj.value == item.gov_esic_rule?.rule_type ?? null;
      }),

      gov_gratuity_rule: this.gratuityRulesMaster.find((obj: any) => {
        return obj.value == item.gov_gratuity_rule?.rule_apply;
      }),
      gov_gratuity_rule_type: this.gratuityRuleTypesMaster.find((obj: any) => {
        return obj.value == item.gov_gratuity_rule?.rule_type ?? null;
      }),

      gov_ptax_rule: this.ptaxRulesMaster.find((obj: any) => {
        return obj.value == item.gov_ptax_rule?.rule_apply;
      }),
      gov_ptax_rule_type: this.ptaxRuleTypesMaster.find((obj: any) => {
        return obj.value == item.gov_ptax_rule?.rule_type ?? null;
      }),

      gov_bonus_rule: this.bonusRulesMaster.find((obj: any) => {
        return obj.value == item.gov_bonus_rule?.rule_apply;
      }),
      gov_bonus_rule_type: this.bonusRuleTypesMaster.find((obj: any) => {
        return obj.value == item.gov_bonus_rule?.rule_type ?? null;
      }),

      gov_tds_rule: this.tdsRulesMaster.find((obj: any) => {
        return obj.value == item.gov_tds_rule?.rule_apply;
      }),
      gov_tds_rule_type: this.tdsRuleTypesMaster.find((obj: any) => {
        return obj.value == item.gov_tds_rule?.rule_type ?? null;
      }),
      gov_lwf_rule: this.lwfRulesMaster.find((obj: any) => {
        return obj.value == item.gov_lwf_rule?.rule_apply;
      }),
      gov_lwf_rule_type: this.lwfRuleTypesMaster.find((obj: any) => {
        return obj.value == item.gov_lwf_rule?.rule_type ?? null;
      }),
    });

    item.gov_pf_rule?.rule_permission.forEach((element: any) => {
      $('input[name="gov_pf_permission[]"][value="' + element + '"]').prop(
        'checked',
        true
      );
    });

    item.gov_esic_rule?.rule_permission.forEach((element: any) => {
      $('input[name="gov_esic_permission[]"][value="' + element + '"]').prop(
        'checked',
        true
      );
    });

    item.gov_gratuity_rule?.rule_permission.forEach((element: any) => {
      $(
        'input[name="gov_gratuity_permission[]"][value="' + element + '"]'
      ).prop('checked', true);
    });

    item.gov_ptax_rule?.rule_permission.forEach((element: any) => {
      $('input[name="gov_ptax_permission[]"][value="' + element + '"]').prop(
        'checked',
        true
      );
    });

    item.gov_bonus_rule?.rule_permission.forEach((element: any) => {
      $('input[name="gov_bonus_permission[]"][value="' + element + '"]').prop(
        'checked',
        true
      );
    });

    item.gov_lwf_rule?.rule_permission.forEach((element: any) => {
      $('input[name="gov_lwf_permission[]"][value="' + element + '"]').prop(
        'checked',
        true
      );
    });

    $('html, body').animate({
      scrollTop: $('#clientpackage-submit-section').position().top,
    });
  }

  cancelEdit() {
    this.editActionId = '';
    this.packageForm.reset();
    for (const key in this.packageForm.controls) {
      if (
        Object.prototype.hasOwnProperty.call(this.packageForm.controls, key)
      ) {
        const element = this.packageForm.controls[key];

        element.markAsUntouched();
        element.markAsPristine();
      }
    }

    this.resetSelectedPermissions();
    this.permissionCheckboxChanged();
  }

  create(event: any) {
    if (this.packageForm.valid) {
      let permissionmodule = this.getSelectedPermissions();
      if (permissionmodule === false) {
        return;
      }

      if (Object.keys(permissionmodule).length < 1) {
        this.toastr.error(
          'You need to select atleast one permission module for submitting'
        );
        return;
      }

      event.target.classList.add('btn-loading');

      this.adminService
        .createClientPackage({
          package_name: this.packageForm.value.package_name,
          employee_vault: this.packageForm.value.employee_vault,

          gov_pf_rule: this.packageForm.value.gov_pf_rule?.value,
          gov_pf_rule_type: this.packageForm.value.gov_pf_rule_type?.value,
          gov_pf_permission: JSON.stringify(
            $('[name="gov_pf_permission[]"]:checked')
              .map(function () {
                return $(this).val();
              })
              .get()
          ),

          gov_esic_rule: this.packageForm.value.gov_esic_rule?.value,
          gov_esic_rule_type: this.packageForm.value.gov_esic_rule_type?.value,
          gov_esic_permission: JSON.stringify(
            $('[name="gov_esic_permission[]"]:checked')
              .map(function () {
                return $(this).val();
              })
              .get()
          ),

          gov_gratuity_rule: this.packageForm.value.gov_gratuity_rule?.value,
          gov_gratuity_rule_type:
            this.packageForm.value.gov_gratuity_rule_type?.value,
          gov_gratuity_permission: JSON.stringify(
            $('[name="gov_gratuity_permission[]"]:checked')
              .map(function () {
                return $(this).val();
              })
              .get()
          ),

          gov_ptax_rule: this.packageForm.value.gov_ptax_rule?.value,
          gov_ptax_rule_type: this.packageForm.value.gov_ptax_rule_type?.value,
          gov_ptax_permission: JSON.stringify(
            $('[name="gov_ptax_permission[]"]:checked')
              .map(function () {
                return $(this).val();
              })
              .get()
          ),

          gov_bonus_rule: this.packageForm.value.gov_bonus_rule?.value,
          gov_bonus_rule_type:
            this.packageForm.value.gov_bonus_rule_type?.value,
          gov_bonus_permission: JSON.stringify(
            $('[name="gov_bonus_permission[]"]:checked')
              .map(function () {
                return $(this).val();
              })
              .get()
          ),

          gov_tds_rule: this.packageForm.value.gov_tds_rule?.value,
          gov_tds_rule_type: this.packageForm.value.gov_tds_rule_type?.value,
          gov_tds_permission: JSON.stringify(
            $('[name="gov_tds_permission[]"]:checked')
              .map(function () {
                return $(this).val();
              })
              .get()
          ),

          gov_lwf_rule: this.packageForm.value.gov_lwf_rule?.value,
          gov_lwf_rule_type: this.packageForm.value.gov_lwf_rule_type?.value,
          gov_lwf_permission: JSON.stringify(
            $('[name="gov_lwf_permission[]"]:checked')
              .map(function () {
                return $(this).val();
              })
              .get()
          ),

          module: JSON.stringify(permissionmodule),
        })
        .subscribe(
          (res) => {
            if (res.status == 'success') {
              this.toastr.success(res.message);
              this.cancelEdit();
              // this.packageForm.reset();
              // this.resetSelectedPermissions();

              $('#my-datatable')
                .dataTable()
                .api()
                .ajax.reload(function (json) {}, false);
            } else if (res.status == 'val_err') {
              this.toastr.error(Global.showValidationMessage(res.val_msg));
            } else {
              this.toastr.error(res.message);
            }

            event.target.classList.remove('btn-loading');
          },
          (err) => {
            event.target.classList.remove('btn-loading');
            this.toastr.error(
              'Internal server error occured. Please try again later.'
            );
          }
        );
    }
  }

  deleteItem(item: any) {
    swal
      .fire({
        title: 'Are you sure want to remove?',
        text: 'You will not be able to recover this data!',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'No, keep it',
      })
      .then((result) => {
        if (result.value) {
          this.adminService
            .deleteClientPackage({
              package_id: item._id,
            })
            .subscribe(
              (res) => {
                if (res.status == 'success') {
                  this.toastr.success(res.message);
                  $('#my-datatable')
                    .dataTable()
                    .api()
                    .ajax.reload(function (json) {}, false);
                } else {
                  this.toastr.error(res.message);
                }
              },
              (err) => {
                this.toastr.error(
                  'Internal server error occured. Please try again later.'
                );
              }
            );
        } else if (result.dismiss === swal.DismissReason.cancel) {
          swal.fire('Cancelled', 'Your data is safe :)', 'error');
        }
      });
  }

  update(event: any) {
    if (this.packageForm.valid) {
      let permissionmodule = this.getSelectedPermissions();
      if (permissionmodule === false) {
        return;
      }

      if (Object.keys(permissionmodule).length < 1) {
        this.toastr.error(
          'You need to select atleast one permission module for submitting'
        );
        return;
      }

      event.target.classList.add('btn-loading');

      this.adminService
        .updateClientPackage({
          package_id: this.editActionId,
          package_name: this.packageForm.value.package_name,
          employee_vault: this.packageForm.value.employee_vault,

          gov_pf_rule: this.packageForm.value.gov_pf_rule?.value,
          gov_pf_rule_type: this.packageForm.value.gov_pf_rule_type?.value,
          gov_pf_permission: JSON.stringify(
            $('[name="gov_pf_permission[]"]:checked')
              .map(function () {
                return $(this).val();
              })
              .get()
          ),

          gov_esic_rule: this.packageForm.value.gov_esic_rule?.value,
          gov_esic_rule_type: this.packageForm.value.gov_esic_rule_type?.value,
          gov_esic_permission: JSON.stringify(
            $('[name="gov_esic_permission[]"]:checked')
              .map(function () {
                return $(this).val();
              })
              .get()
          ),

          gov_gratuity_rule: this.packageForm.value.gov_gratuity_rule?.value,
          gov_gratuity_rule_type:
            this.packageForm.value.gov_gratuity_rule_type?.value,
          gov_gratuity_permission: JSON.stringify(
            $('[name="gov_gratuity_permission[]"]:checked')
              .map(function () {
                return $(this).val();
              })
              .get()
          ),

          gov_ptax_rule: this.packageForm.value.gov_ptax_rule?.value,
          gov_ptax_rule_type: this.packageForm.value.gov_ptax_rule_type?.value,
          gov_ptax_permission: JSON.stringify(
            $('[name="gov_ptax_permission[]"]:checked')
              .map(function () {
                return $(this).val();
              })
              .get()
          ),

          gov_bonus_rule: this.packageForm.value.gov_bonus_rule?.value,
          gov_bonus_rule_type:
            this.packageForm.value.gov_bonus_rule_type?.value,
          gov_bonus_permission: JSON.stringify(
            $('[name="gov_bonus_permission[]"]:checked')
              .map(function () {
                return $(this).val();
              })
              .get()
          ),

          gov_tds_rule: this.packageForm.value.gov_tds_rule?.value,
          gov_tds_rule_type: this.packageForm.value.gov_tds_rule_type?.value,
          gov_tds_permission: JSON.stringify(
            $('[name="gov_tds_permission[]"]:checked')
              .map(function () {
                return $(this).val();
              })
              .get()
          ),

          gov_lwf_rule: this.packageForm.value.gov_lwf_rule?.value,
          gov_lwf_rule_type: this.packageForm.value.gov_lwf_rule_type?.value,
          gov_lwf_permission: JSON.stringify(
            $('[name="gov_lwf_permission[]"]:checked')
              .map(function () {
                return $(this).val();
              })
              .get()
          ),

          module: JSON.stringify(permissionmodule),
        })
        .subscribe(
          (res) => {
            if (res.status == 'success') {
              this.toastr.success(res.message);
              $('#my-datatable')
                .dataTable()
                .api()
                .ajax.reload(function (json) {}, false);
            } else if (res.status == 'val_err') {
              this.toastr.error(Global.showValidationMessage(res.val_msg));
            } else {
              this.toastr.error(res.message);
            }

            event.target.classList.remove('btn-loading');
          },
          (err) => {
            event.target.classList.remove('btn-loading');
            this.toastr.error(
              'Internal server error occured. Please try again later.'
            );
          }
        );
    }
  }

  getSelectedPermissions() {
    const permission: any = {};
    var r_flag: Boolean = true;

    this.permissionMaster.forEach((element: any) => {
      const access: any[] = [];

      $('input[name="permission[' + element.slug + ']"]:checked').each(
        function () {
          access.push($(this).val());
        }
      );

      if (
        (this.restrict_toggles.includes(element.slug) ||
          $('#' + element.slug + '-toggle-switch').hasClass('on')) &&
        access.length < 1
      ) {
        this.toastr.warning(
          'You need to select atleast one permission for ' +
            element.name +
            ' Module'
        );
        r_flag = false;
      }

      if (access.length > 0) {
        permission[element.slug] = access;
      }
    });

    if (r_flag == true) {
      return permission;
    } else {
      return false;
    }
  }

  resetSelectedPermissions(isEditing: Boolean = false) {
    this.permissionMaster.forEach((element: any) => {
      $('.br-toggle').removeClass('on');

      // $('input[name="gov_pf_permission[]"]').each(function () {
      //   $(this).prop('checked', false)
      // }); $('input[name="gov_esic_permission[]"]').each(function () {
      //   $(this).prop('checked', false)
      // });
      $('input[name="gov_gratuity_permission[]"]').each(function () {
        $(this).prop('checked', false);
      });
      $('input[name="gov_ptax_permission[]"]').each(function () {
        $(this).prop('checked', false);
      });
      $('input[name="gov_bonus_permission[]"]').each(function () {
        $(this).prop('checked', false);
      });
      $('input[name="gov_tds_permission[]"]').each(function () {
        $(this).prop('checked', false);
      });

      //Reset all selected checkbox
      $('input[name="permission[' + element.slug + ']"]').each(function () {
        $(this).prop('checked', false);
        $(this).attr('disabled', 'true');
      });

      //Restrict Toggle for mentioned slugs
      if (this.restrict_toggles.includes(element.slug)) {
        $('#' + element.slug + '-toggle-switch').addClass('disabled');
        $('#' + element.slug + '-toggle-switch').addClass('on');

        $('input[name="permission[' + element.slug + ']"]').each(function () {
          if (!isEditing) {
            $(this).prop('checked', true);
          }

          $(this).removeAttr('disabled');
        });
      }
      element.permission.forEach((el: any) => {
        if (this.restrict_fields.includes(el.key)) {
          $(
            `input[name="permission[${element.slug}]"][value="${el.key}"]`
          ).each(function () {
            // if (!isEditing) {
            $(this).prop('checked', true);
            $(this).prop('disabled', true);
            // }
          });
        }
      });
      // if(this.restrict_fields.includes(element))

      this.permissionCheckboxChanged();
    });
  }

  checkPermissionsforEdit(permissions: any) {
    this.resetSelectedPermissions(true);

    for (const key in permissions) {
      if (Object.prototype.hasOwnProperty.call(permissions, key)) {
        const element = permissions[key];
        if (Array.isArray(element)) {
          element.forEach((access: any) => {
            $('#' + key + '-toggle-switch').addClass('on');
            $(
              'input[name="permission[' + key + ']"][value="' + access + '"]'
            ).prop('checked', true);
          });
        }
      }
    }

    this.permissionCheckboxChanged();
  }

  permissionCheckboxChanged(
    event: any = null,
    key?: any,
    type: any = null,
    _id: any = null
  ) {
    if (key && this.restrict_fields.includes(key)) {
      event.target.checked = true;
      event.target.disabled = true;
      return;
    }

    if (type && type == 'all-fields') {
      if (
        document
          .getElementById(`${key}-toggle-switch`)
          ?.classList.contains('on')
      ) {
        document.getElementsByName(`permission[${key}]`).forEach((e: any) => {
          if (!this.restrict_fields.includes(e.value)) {
            e.checked = event.target.checked;
          }
        });
      }
      return;
    }
    // switch (type) {
    //   case 'selectpermission':
    //     $('input[name="permission[' + _id + ']"]').each(function () {
    //       $(this).prop('checked', event.target.checked)
    //     });
    //     break;
    // }

    this.permissionMaster.forEach((element: any) => {
      let fields = this.restrict_fields;
      let $_this = this;
      // setTimeout(function () {
      if ($_this.restrict_toggles.includes(element.slug)) {
        $('#' + element.slug + '-toggle-switch').addClass('disabled');
        $('#' + element.slug + '-toggle-switch').addClass('on');

        $('input[name="permission[' + element.slug + ']"]').each(function () {
          $(this).removeAttr('disabled');
        });
      }

      if ($('#' + element.slug + '-toggle-switch').hasClass('on')) {
        $('input[name="permission[' + element.slug + ']"]').each(function () {
          if (!fields.includes($(this).val() as any)) {
            $(this).removeAttr('disabled');
          } else {
            $(this).prop('disabled', true);
          }
        });
      } else {
        $('input[name="permission[' + element.slug + ']"]').each(function () {
          if (!fields.includes($(this).val() as any)) {
            $(this).prop('checked', false);
            $(this).prop('disabled', true);
          }
        });
      }

      // $('.br-toggle').on('click', function (e) {
      //   e.preventDefault();
      //   $(this).toggleClass('on');
      // });
      // }, 100);
    });
  }

  toggleOnOff(event: any, item: any) {
    event.stopPropagation()
  
    let toggle = document.getElementById(`${item.slug}-toggle-switch`);
    // let toggle = document.getElementById(`${item.slug}-toggle-switch`);
    
   
    // setTimeout(() => {
      // if(item){
      let el = document.getElementById(`${item.slug}-toggle-switch`);
      // let nested_el = document.getElementById(`${item.slug}-toggle-switch-nested`);
      document
        .getElementsByName(`permission[${item.slug}]`)
        .forEach((el: any) => {
          if (this.restrict_fields.includes(el.value)) {
            el.disabled = true;
          } else {
            el.disabled = false;
          }
        });
      if (el) {
        if (el.classList.contains('on')) {
          document
            .getElementsByName(`permission[${item.slug}]`)
            .forEach((el: any) => {
              if (this.restrict_fields.includes(el.value)) {
                el.disabled = true;
              } else {
                el.disabled = true;
                el.checked = false;
              }
            });
        } else if(el.classList.contains('off')){
          document
            .getElementsByName(`permission[${item.slug}]`)
            .forEach((el: any) => {
              if (this.restrict_fields.includes(el.value)) {
                el.disabled = true;
              } else {
                el.disabled = false;
              }
            });
        }
      }

      if(this.isToggleOn(item)){
        toggle?.classList.add('off')
        toggle?.classList.remove('on')
      }else{
        toggle?.classList.remove('off')
        toggle?.classList.add('on')
      }
    // }, 100);

    //   // this.permissionCheckboxChanged(event)
    // }
  }

  isToggleOn(item: any) {
    let toggle = document.getElementById(`${item.slug}-toggle-switch`);
    return toggle?.classList.contains('on');
    // {{item.slug}}-toggle-switch
  }
}
