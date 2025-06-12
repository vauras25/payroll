import { DatePipe } from '@angular/common';
import { Component, NgZone, OnInit } from '@angular/core';
import {
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { AppComponent } from 'src/app/app.component';
import * as Global from 'src/app/globals';
import { AuthService } from 'src/app/services/auth.service';
import { CompanyuserService } from 'src/app/services/companyuser.service';

@Component({
  selector: 'companyuser-app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
})
export class CMPProfileComponent implements OnInit {
  BACKEND_URL: any;
  userDetails: any;
  Global = Global;

  establishmentTypeMaster: any[];
  pfRuleApplyMaster: any[];
  epfoRuleMaster: any[];
  esicRuleMaster: any[];
  gratuityRuleMaster: any[];
  pfRuleMaster: any[];

  companyPartnerEditActionId: any;
  companyEstablishmentEditActionId: any;
  companyBranchEditActionId: any;

  companyDetailsForm: UntypedFormGroup;
  companyRegOfficeAddressForm: UntypedFormGroup;
  companyCommOfficeAddressForm: UntypedFormGroup;
  companyEpfForm: UntypedFormGroup;
  companyEsicForm: UntypedFormGroup;
  companyPTaxForm: UntypedFormGroup;
  companyEstablishmentForm: UntypedFormGroup;
  companyPartnersForm: UntypedFormGroup;
  companyBranchesForm: UntypedFormGroup;
  companyPreferenceForm: UntypedFormGroup;
  companyLogoUploadForm: UntypedFormGroup;

  constructor(
    private titleService: Title,
    private spinner: NgxSpinnerService,
    private authService: AuthService,
    private toastr: ToastrService,
    public zone: NgZone,
    public formBuilder: UntypedFormBuilder,
    protected companyuserService: CompanyuserService,
    private datePipe: DatePipe,
    public AppComponent: AppComponent,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.BACKEND_URL = Global.BACKEND_URL;

    this.establishmentTypeMaster = [
      // { 'value': 'plc', 'description': 'Public Limited' },
      // { 'value': 'sp', 'description': 'Sole Proprietorship' },
      // { 'value': 'lp', 'description': 'Limited Partnership' },
      // { 'value': 'corporation', 'description': 'Corporation' },
      // { 'value': 'llc', 'description': 'Limited Liability Company' },
      // { 'value': 'non-profit', 'description': 'Nonprofit Organization' },
      // { 'value': 'co-op', 'description': 'Cooperative' },

      { value: 'individual', description: 'Individual' },
      { value: 'proprietorship', description: 'Proprietorship' },
      { value: 'partnership', description: 'Partnership' },
      { value: 'pvt_ltd', description: 'PVT Ltd.' },
      { value: 'ltd', description: 'Ltd.' },
      { value: 'llp', description: 'LLP' },
      { value: 'trust', description: 'Trust' },
      { value: 'other', description: 'Other' },
    ];

    this.pfRuleApplyMaster = [
      { value: 'yes', description: 'Yes' },
      { value: 'no', description: 'No' },
    ];

    this.pfRuleMaster = [
      { value: 'custom', description: 'Custom' },
      { value: 'default', description: 'Default' },
    ];

    this.epfoRuleMaster = [
      { value: 'custom', description: 'Custom' },
      { value: 'default', description: 'Default' },
    ];

    this.esicRuleMaster = [
      { value: 'custom', description: 'Custom' },
      { value: 'default', description: 'Default' },
    ];

    this.gratuityRuleMaster = [
      { value: 'custom', description: 'Custom' },
      { value: 'default', description: 'Default' },
    ];

    this.companyDetailsForm = formBuilder.group({
      establishment_name: [{ value: null, disabled: true }],
      corporate_id: [{ value: null, disabled: true }],
      establishment_type: [null, Validators.compose([Validators.required])],
      company_reg_certificate: [null, Validators.compose([])],
      company_reg_certificate_file: [null, Validators.compose([])],

      com_logo: [null, Validators.compose([])],
      com_logo_file: [null, Validators.compose([])],
    });

    this.companyRegOfficeAddressForm = formBuilder.group({
      door_no: [null, Validators.compose([Validators.required])],
      street_name: [null, Validators.compose([Validators.required])],
      locality: [null, Validators.compose([Validators.required])],
      district_name: [null, Validators.compose([Validators.required])],
      state: [null, Validators.compose([Validators.required])],
      pin_code: [
        null,
        Validators.compose([
          Validators.required,
          Validators.minLength(6),
          Validators.maxLength(6),
          Validators.pattern('^[0-9]*$'),
        ]),
      ],
    });

    this.companyCommOfficeAddressForm = formBuilder.group({
      door_no: [null, Validators.compose([Validators.required])],
      street_name: [null, Validators.compose([Validators.required])],
      locality: [null, Validators.compose([Validators.required])],
      district_name: [null, Validators.compose([Validators.required])],
      state: [null, Validators.compose([Validators.required])],
      pin_code: [
        null,
        Validators.compose([
          Validators.required,
          Validators.minLength(6),
          Validators.maxLength(6),
          Validators.pattern('^[0-9]*$'),
        ]),
      ],
    });

    this.companyEpfForm = formBuilder.group({
      registration_no: [null, Validators.compose([Validators.required])],
      group_no: [null, Validators.compose([Validators.required])],
      pf_rule_apply: [null, Validators.compose([Validators.required])],
      pf_rule: [null, Validators.compose([Validators.required])],
      lin_no: [null, Validators.compose([Validators.required])],
      // "login_id": [null, Validators.compose([Validators.required])],
      // "password": [null, Validators.compose([Validators.required])],
      note_box: [null, Validators.compose([Validators.required])],
      regional_office_address: [
        null,
        Validators.compose([Validators.required]),
      ],
      pf_certificate: [null, Validators.compose([])],
      pf_certificate_file: [null, Validators.compose([])],
    });

    this.companyEsicForm = formBuilder.group({
      registration_no: [null, Validators.compose([Validators.required])],
      regional_pf_office: [null, Validators.compose([Validators.required])],
      lin_no: [null, Validators.compose([Validators.required])],
      note_box: [null, Validators.compose([Validators.required])],
      esic_certificate: [null, Validators.compose([])],
      esic_certificate_file: [null, Validators.compose([])],
    });

    this.companyPTaxForm = formBuilder.group({
      registration_no_enrolment: [
        null,
        Validators.compose([Validators.required]),
      ],
      registration_no_rgistration: [
        null,
        Validators.compose([Validators.required]),
      ],
      registration_no_enrolment_certificate: [null, Validators.compose([])],
      registration_no_enrolment_certificate_file: [
        null,
        Validators.compose([]),
      ],
      registration_no_rgistration_certificate: [null, Validators.compose([])],
      registration_no_rgistration_certificate_file: [
        null,
        Validators.compose([]),
      ],
      note_box: [null, Validators.compose([])],
    });

    this.companyEstablishmentForm = formBuilder.group({
      nature_of_business: [null, Validators.compose([])],
      date_of_incorporation: [null, Validators.compose([])],
      mobile_no: [
        null,
        Validators.compose([
          Validators.minLength(10),
          Validators.maxLength(10),
          Validators.pattern('^[0-9]*$'),
        ]),
      ],
      email_id: [null, Validators.compose([Validators.email])],

      trade_licence_no: [null, Validators.compose([])],
      gst_no: [null, Validators.compose([])],
      pan_numberc: [null, Validators.compose([])],
      tan_number: [null, Validators.compose([])],

      trade_Licence_doc: [null, Validators.compose([])],
      gst_doc: [null, Validators.compose([])],
      pan_numberc_doc: [null, Validators.compose([])],
      tan_number_doc: [null, Validators.compose([])],

      trade_Licence_doc_file: [null, Validators.compose([])],
      gst_doc_file: [null, Validators.compose([])],
      pan_numberc_doc_file: [null, Validators.compose([])],
      tan_number_doc_file: [null, Validators.compose([])],

      land_line: [null, Validators.compose([])],
      alternate_email_id: [null, Validators.compose([Validators.email])],
      website: [null, Validators.compose([])],
    });

    this.companyPartnersForm = formBuilder.group({
      first_name: [null, Validators.compose([Validators.required])],
      last_name: [null, Validators.compose([Validators.required])],
      designation: [null, Validators.compose([])],
      din_no: [null, Validators.compose([])],
      date_of_appointment: [null, Validators.compose([])],
      mobile_no: [
        null,
        Validators.compose([
          Validators.required,
          Validators.minLength(10),
          Validators.maxLength(10),
          Validators.pattern('^[0-9]*$'),
        ]),
      ],
      pan_no: [null, Validators.compose([])],
      aadhaar_no: [null, Validators.compose([])],

      partners_pan_doc: [null, Validators.compose([])],
      partners_aadhaar_no: [null, Validators.compose([])],

      partners_pan_doc_file: [null, Validators.compose([])],
      partners_aadhaar_no_file: [null, Validators.compose([])],
    });

    this.companyBranchesForm = formBuilder.group({
      branch_name: [null, Validators.compose([Validators.required])],
      branch_contact_person: [null, Validators.compose([])],
      contact_person_number: [
        null,
        Validators.compose([
          Validators.minLength(10),
          Validators.maxLength(10),
          Validators.pattern('^[0-9]*$'),
        ]),
      ],
      contact_person_email: [null, Validators.compose([Validators.email])],

      branch_address: [null, Validators.compose([])],
      lwf_shop: [null, Validators.compose([])],
      establishment_labour_license: [null, Validators.compose([])],
      status: [null, Validators.compose([])],

      // "branch_EPFO_number": [null, Validators.compose([])],
      epf_registration_no: [null, Validators.compose([])],
      epf_pf_rule_apply: [null, Validators.compose([Validators.required])],
      epf_group_no: [null, Validators.compose([])],
      epf_pf_rule: [null, Validators.compose([])],
      epf_lin_no: [null, Validators.compose([])],
      epf_regional_office_address: [null, Validators.compose([])],

      // "branch_ESIC_number": [null, Validators.compose([])],
      esic_registration_no: [null, Validators.compose([])],
      esic_regional_pf_office: [null, Validators.compose([])],
      esic_lin_no: [null, Validators.compose([])],

      // "branch_P_Tax_number": [null, Validators.compose([])],
      p_tax_registration_no_enrolment: [null, Validators.compose([])],
      p_tax_registration_no_rgistration: [null, Validators.compose([])],

      branch_EPFO_number_doc: [null, Validators.compose([])],
      branch_ESIC_number_doc: [null, Validators.compose([])],
      ptax_enrolment_certificate: [null, Validators.compose([])],
      ptax_rgistration_certificate: [null, Validators.compose([])],

      branch_EPFO_number_doc_file: [null, Validators.compose([])],
      branch_ESIC_number_doc_file: [null, Validators.compose([])],
      branch_P_Tax_number_doc_file: [null, Validators.compose([])],
      ptax_enrolment_certificate_file: [null, Validators.compose([])],
      ptax_rgistration_certificate_file: [null, Validators.compose([])],
    });

    this.companyPreferenceForm = formBuilder.group({
      epfo_rule: [null, Validators.compose([Validators.required])],
      esic_rule: [null, Validators.compose([Validators.required])],
      gratuity_rule: [null, Validators.compose([Validators.required])],
      bonus_rule: [null, Validators.compose([Validators.required])],
      financial_year_end: [null, Validators.compose([Validators.required])],
    });

    this.companyLogoUploadForm = formBuilder.group({
      image: [null, Validators.compose([Validators.required])],
      imageSource: [null, Validators.compose([Validators.required])],
    });

    this.companyEpfForm.get('pf_rule_apply')?.valueChanges.subscribe((val) => {
      if (val.value == 'yes') {
        $('.pf-rule-fields').show(500);
        this.companyEpfForm.controls['pf_rule'].setValidators([
          Validators.required,
        ]);
      } else {
        $('.pf-rule-fields').hide(500);
        this.companyEpfForm.controls['pf_rule'].clearValidators();
      }

      this.companyEpfForm.controls['pf_rule'].updateValueAndValidity();
    });

    this.companyBranchesForm
      .get('epf_pf_rule_apply')
      ?.valueChanges.subscribe((val) => {
        if (val.value == 'yes') {
          $('.branch-epfo-pf-rule-fields').show(500);
          this.companyBranchesForm.controls['epf_pf_rule'].setValidators([
            Validators.required,
          ]);
        } else {
          $('.branch-epfo-pf-rule-fields').hide(500);
          this.companyBranchesForm.controls['epf_pf_rule'].clearValidators();
        }

        this.companyBranchesForm.controls[
          'epf_pf_rule'
        ].updateValueAndValidity();
      });

    this.fetechProfileData();

    this.companyEstablishmentEditActionId = '';
    this.companyBranchEditActionId = '';
  }

  ngOnInit(): void {
    this.titleService.setTitle('Company Profile - ' + Global.AppName);

    if (
      !Global.checkCompanyModulePermission({
        company_module: 'company_profile',
        company_sub_module: 'company_profile',
        company_sub_operation: ['view'],
        company_strict: true,
      })
    ) {
      const _this = this;
      setTimeout(function () {
        alert();
        _this.router.navigate(['company/errors/unauthorized-access'], {
          skipLocationChange: true,
        });
      }, 500);
      return;
    }

    this.route.queryParams.subscribe((params) => {
      let activesection = params['active'];
      if (activesection) {
        setTimeout(function () {
          $('#v-pills-' + activesection + '-tab').click();
        }, 1000);
      }
    });
  }

  fetechProfileData() {
    
    this.spinner.show();
    this.authService.getCompanyUserAccountDetails().subscribe(
      (res: any) => {
        if (res.status == 'success') {
          this.zone.run(() => {
            this.userDetails = res.company_det;
          });

          if (['company'].includes(this.userDetails?.user_type)) {
            localStorage.setItem(
              'payroll-companyuser-user',
              JSON.stringify(res.company_det || {})
            );
            localStorage.setItem(
              'payroll-companyuser-details',
              JSON.stringify(res.company_det.com_det || {})
            );
            localStorage.setItem(
              'payroll-companyuser-permission',
              JSON.stringify(res.company_det?.package || {})
            );
          }

          let establishment_type = this.establishmentTypeMaster.find(
            (obj: any) => {
              return (
                obj.value ===
                this.userDetails?.com_det?.details.establishment_type
              );
            }
          );

          if (establishment_type) {
            this.userDetails.com_det.details.establishment_type_name =
              establishment_type.description;
          }

          this.companyDetailsForm.patchValue({
            establishment_name:
              res.company_det?.com_det?.details.establishment_name,
            corporate_id: res.company_det?.com_det?.details.corporate_id,
            establishment_type: this.establishmentTypeMaster.find(
              (obj: any) => {
                return (
                  obj.value ===
                  res.company_det?.com_det?.details.establishment_type
                );
              }
            ),
          });

          this.companyRegOfficeAddressForm.patchValue({
            door_no: res.company_det?.com_det?.reg_office_address.door_no,
            street_name:
              res.company_det?.com_det?.reg_office_address.street_name,
            locality: res.company_det?.com_det?.reg_office_address.locality,
            district_name:
              res.company_det?.com_det?.reg_office_address.district_name,
            state: res.company_det?.com_det?.reg_office_address.state,
            pin_code: res.company_det?.com_det?.reg_office_address.pin_code,
          });

          this.companyCommOfficeAddressForm.patchValue({
            door_no:
              res.company_det?.com_det?.communication_office_address.door_no,
            street_name:
              res.company_det?.com_det?.communication_office_address
                .street_name,
            locality:
              res.company_det?.com_det?.communication_office_address.locality,
            district_name:
              res.company_det?.com_det?.communication_office_address
                .district_name,
            state: res.company_det?.com_det?.communication_office_address.state,
            pin_code:
              res.company_det?.com_det?.communication_office_address.pin_code,
          });

          this.companyEpfForm.patchValue({
            registration_no: res.company_det?.com_det?.epf.registration_no,
            group_no: res.company_det?.com_det?.epf.group_no,
            pf_rule_apply: this.pfRuleApplyMaster.find((obj: any) => {
              return obj.value === res.company_det?.com_det?.epf.pf_rule_apply;
            }),
            pf_rule: this.pfRuleMaster.find((obj: any) => {
              return obj.value === res.company_det?.com_det?.epf.pf_rule;
            }),
            lin_no: res.company_det?.com_det?.epf.lin_no,
            // 'login_id': res.company_det?.com_det?.epf.login_id,
            // 'password': res.company_det?.com_det?.epf.password,
            note_box: res.company_det?.com_det?.epf.note_box,
            regional_office_address:
              res.company_det?.com_det?.epf.regional_office_address,
          });

          this.companyEsicForm.patchValue({
            registration_no: res.company_det?.com_det?.esic.registration_no,
            regional_pf_office:
              res.company_det?.com_det?.esic.regional_pf_office,
            lin_no: res.company_det?.com_det?.esic.lin_no,
            note_box: res.company_det?.com_det?.esic.note_box,
          });

          this.companyPTaxForm.patchValue({
            registration_no_enrolment:
              res.company_det?.com_det?.professional_tax
                .registration_no_enrolment,
            registration_no_rgistration:
              res.company_det?.com_det?.professional_tax
                .registration_no_rgistration,
            note_box: res.company_det?.com_det?.professional_tax.note_box,
          });

          this.companyPreferenceForm.patchValue({
            epfo_rule:
              this.userDetails?.com_det?.preference_settings?.epfo_rule,
            esic_rule:
              this.userDetails?.com_det?.preference_settings?.esic_rule,
            gratuity_rule:
              this.userDetails?.com_det?.preference_settings?.gratuity_rule,
            bonus_rule:
              this.userDetails?.com_det?.preference_settings?.bonus_rule,
            financial_year_end: this.datePipe.transform(
              this.userDetails?.com_det?.preference_settings
                ?.financial_year_end,
              'MM/dd/YYYY'
            ),
          });
        }

        this.spinner.hide();
      },
      (err) => {
        this.spinner.hide();
        this.toastr.error(Global.showServerErrorMessage(err));
      }
    );
  }

  submitCompanyDetails(event: any) {
    
    if (!this.AppComponent.checkCompanyModulePermission(
      {
        company_module: 'company_profile',
        company_sub_module:'company_profile',
        company_sub_operation: ['edit'],
        company_strict: true
      }
    )) {
      this.toastr.error('Permission not allowed');
      return;
    }

    this.companyDetailsForm.markAllAsTouched();
    setTimeout(function () {
      let $_errFormControl = document.querySelectorAll('p.text-danger');
      if ($_errFormControl.length > 0) {
        const firstErr: Element = $_errFormControl[0];
        firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);

    if (this.companyDetailsForm.valid) {
      event.target.classList.add('btn-loading');
      this.companyuserService
        .updateCompanyDetails({
          com_logo: this.companyDetailsForm.value.com_logo_file ?? '',
          establishment_type:
            this.companyDetailsForm.value.establishment_type.value,
          company_reg_certificate:
            this.companyDetailsForm.value.company_reg_certificate_file,
        })
        .subscribe(
          (res) => {
            if (res.status == 'success') {
              $('.from_establishment').find('.cancel-modal').click();
              this.toastr.success(res.message);
              this.fetechProfileData();

              this.companyDetailsForm.patchValue({
                com_logo: null,
                com_logo_file: null,
                company_reg_certificate: null,
                company_reg_certificate_file: null,
              });
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

  submitCompanyRegOfficeAddress(event: any) {
    if (!this.AppComponent.checkCompanyModulePermission(
      {
        company_module: 'company_profile',
        company_sub_module:'company_profile',
        company_sub_operation: ['edit'],
        company_strict: true
      }
    )) {
      this.toastr.error('Permission not allowed');
      return;
    }

    this.companyRegOfficeAddressForm.markAllAsTouched();
    setTimeout(function () {
      let $_errFormControl = document.querySelectorAll('p.error-element');
      if ($_errFormControl.length > 0) {
        const firstErr: Element = $_errFormControl[0];
        firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);

    if (this.companyRegOfficeAddressForm.valid) {
      event.target.classList.add('btn-loading');
      this.companyuserService
        .updatecompanyRegOfficeAddress({
          door_no: this.companyRegOfficeAddressForm.value.door_no,
          street_name: this.companyRegOfficeAddressForm.value.street_name,
          locality: this.companyRegOfficeAddressForm.value.locality,
          district_name: this.companyRegOfficeAddressForm.value.district_name,
          state: this.companyRegOfficeAddressForm.value.state,
          pin_code: this.companyRegOfficeAddressForm.value.pin_code,
        })
        .subscribe(
          (res) => {
            if (res.status == 'success') {
              $('.from_regofficeadd').find('.cancel-modal').click();
              this.toastr.success(res.message);
              this.fetechProfileData();
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

  submitCompanyCommOfficeAddress(event: any) {
    if (!this.AppComponent.checkCompanyModulePermission(
      {
        company_module: 'company_profile',
        company_sub_module:'company_profile',
        company_sub_operation: ['edit'],
        company_strict: true
      }
    )) {
      this.toastr.error('Permission not allowed');
      return;
    }

    this.companyCommOfficeAddressForm.markAllAsTouched();
    setTimeout(function () {
      let $_errFormControl = document.querySelectorAll('p.error-element');
      if ($_errFormControl.length > 0) {
        const firstErr: Element = $_errFormControl[0];
        firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);

    if (this.companyCommOfficeAddressForm.valid) {
      event.target.classList.add('btn-loading');
      this.companyuserService
        .updatecompanyCommOfficeAddress({
          door_no: this.companyCommOfficeAddressForm.value.door_no,
          street_name: this.companyCommOfficeAddressForm.value.street_name,
          locality: this.companyCommOfficeAddressForm.value.locality,
          district_name: this.companyCommOfficeAddressForm.value.district_name,
          state: this.companyCommOfficeAddressForm.value.state,
          pin_code: this.companyCommOfficeAddressForm.value.pin_code,
        })
        .subscribe(
          (res) => {
            if (res.status == 'success') {
              $('.from_commofficeadd').find('.cancel-modal').click();
              this.toastr.success(res.message);
              this.fetechProfileData();
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

  submitCompanyEPFData(event: any) {
    if (!this.AppComponent.checkCompanyModulePermission(
      {
        company_module: 'company_profile',
        company_sub_module:'company_profile',
        company_sub_operation: ['edit'],
        company_strict: true
      }
    )) {
      this.toastr.error('Permission not allowed');
      return;
    }

    this.companyEpfForm.markAllAsTouched();
    setTimeout(function () {
      let $_errFormControl = document.querySelectorAll('p.error-element');
      if ($_errFormControl.length > 0) {
        const firstErr: Element = $_errFormControl[0];
        firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);

    if (this.companyEpfForm.valid) {
      event.target.classList.add('btn-loading');
      this.companyuserService
        .updateCompanyEPFData({
          registration_no: this.companyEpfForm.value.registration_no,
          group_no: this.companyEpfForm.value.group_no,
          pf_rule_apply: this.companyEpfForm.value.pf_rule_apply.value,
          pf_rule: this.companyEpfForm.value.pf_rule?.value,
          lin_no: this.companyEpfForm.value.lin_no,
          // 'login_id': this.companyEpfForm.value.login_id,
          // 'password': this.companyEpfForm.value.password,
          note_box: this.companyEpfForm.value.note_box,
          regional_office_address:
            this.companyEpfForm.value.regional_office_address,
          pf_certificate: this.companyEpfForm.value.pf_certificate_file,
        })
        .subscribe(
          (res) => {
            if (res.status == 'success') {
              $('.from-pf').find('.cancel-modal').click();
              this.toastr.success(res.message);
              this.fetechProfileData();

              this.companyEpfForm.patchValue({
                pf_certificate: null,
                pf_certificate_file: null,
              });
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

  submitCompanyESICData(event: any) {
    if (!this.AppComponent.checkCompanyModulePermission(
      {
        company_module: 'company_profile',
        company_sub_module:'company_profile',
        company_sub_operation: ['edit'],
        company_strict: true
      }
    )) {
      this.toastr.error('Permission not allowed');
      return;
    }

    this.companyEsicForm.markAllAsTouched();
    setTimeout(function () {
      let $_errFormControl = document.querySelectorAll('p.error-element');
      if ($_errFormControl.length > 0) {
        const firstErr: Element = $_errFormControl[0];
        firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);

    if (this.companyEsicForm.valid) {
      event.target.classList.add('btn-loading');
      this.companyuserService
        .updateCompanyESICData({
          registration_no: this.companyEsicForm.value.registration_no,
          regional_pf_office: this.companyEsicForm.value.regional_pf_office,
          lin_no: this.companyEsicForm.value.lin_no,
          note_box: this.companyEsicForm.value.note_box,
          esic_certificate: this.companyEsicForm.value.esic_certificate_file,
        })
        .subscribe(
          (res) => {
            if (res.status == 'success') {
              $('.from_esic').find('.cancel-modal').click();
              this.toastr.success(res.message);
              this.fetechProfileData();

              this.companyEsicForm.patchValue({
                esic_certificate: null,
                esic_certificate_file: null,
              });
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

  submitCompanyPTaxData(event: any) {
    if (!this.AppComponent.checkCompanyModulePermission(
      {
        company_module: 'company_profile',
        company_sub_module:'company_profile',
        company_sub_operation: ['edit'],
        company_strict: true
      }
    )) {
      this.toastr.error('Permission not allowed');
      return;
    }

    this.companyPTaxForm.markAllAsTouched();
    setTimeout(function () {
      let $_errFormControl = document.querySelectorAll('p.error-element');
      if ($_errFormControl.length > 0) {
        const firstErr: Element = $_errFormControl[0];
        firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);

    if (this.companyPTaxForm.valid) {
      event.target.classList.add('btn-loading');
      this.companyuserService
        .updateCompanyPTaxData({
          registration_no_enrolment:
            this.companyPTaxForm.value.registration_no_enrolment,
          registration_no_rgistration:
            this.companyPTaxForm.value.registration_no_rgistration,
          registration_no_enrolment_certificate:
            this.companyPTaxForm.value
              .registration_no_enrolment_certificate_file,
          registration_no_rgistration_certificate:
            this.companyPTaxForm.value
              .registration_no_rgistration_certificate_file,
          note_box: this.companyPTaxForm.value.note_box,
        })
        .subscribe(
          (res) => {
            if (res.status == 'success') {
              $('.from_protax').find('.cancel-modal').click();
              this.toastr.success(res.message);
              this.fetechProfileData();

              this.companyPTaxForm.patchValue({
                registration_no_enrolment_certificate: null,
                registration_no_enrolment_certificate_file: null,
                registration_no_rgistration_certificate: null,
                registration_no_rgistration_certificate_file: null,
              });
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

  onFileChanged(
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

  addPartner() {
    if (!this.AppComponent.checkCompanyModulePermission({
      company_module: 'company_profile',
      company_sub_module:'company_profile',
      company_sub_operation: ['add'],
      company_strict: true
    })) {
      this.toastr.error('Permission not allowed');
      return;
    }

    this.cancelPartnerEntry();

    // this.companyPartnersForm.controls['trade_Licence_doc'].setValidators([Validators.required]);
    // this.companyPartnersForm.controls['gst_doc'].setValidators([Validators.required]);
    // this.companyPartnersForm.controls['pan_numberc_doc'].setValidators([Validators.required]);
    // this.companyPartnersForm.controls['tan_number_doc'].setValidators([Validators.required]);

    // this.companyPartnersForm.controls['trade_Licence_doc'].updateValueAndValidity();
    // this.companyPartnersForm.controls['gst_doc'].updateValueAndValidity();
    // this.companyPartnersForm.controls['pan_numberc_doc'].updateValueAndValidity();
    // this.companyPartnersForm.controls['tan_number_doc'].updateValueAndValidity();
  }

  editPartner(item: any) {
    
    if (!this.AppComponent.checkCompanyModulePermission(
      {
        company_module: 'company_profile',
        company_sub_module:'company_profile',
        company_sub_operation: ['edit'],
        company_strict: true
      }
    )) {
      this.toastr.error('Permission not allowed');
      return;
    }

    this.cancelPartnerEntry();

    this.companyPartnerEditActionId = item._id;
    this.companyPartnersForm.patchValue({
      first_name: item.first_name,
      last_name: item.last_name,
      designation: item.designation,
      din_no: item.din_no,
      date_of_appointment: item.date_of_incorporation
        ? this.datePipe.transform(item.date_of_incorporation, 'MM/dd/YYYY')
        : null,
      mobile_no: item.mobile_no,
      pan_no: item.pan_no,
      aadhaar_no: item.aadhaar_no,
    });

    // this.companyPartnersForm.controls['trade_Licence_doc'].clearValidators();
    // this.companyPartnersForm.controls['gst_doc'].clearValidators();
    // this.companyPartnersForm.controls['pan_numberc_doc'].clearValidators();
    // this.companyPartnersForm.controls['tan_number_doc'].clearValidators();

    // this.companyPartnersForm.controls['trade_Licence_doc'].updateValueAndValidity();
    // this.companyPartnersForm.controls['gst_doc'].updateValueAndValidity();
    // this.companyPartnersForm.controls['pan_numberc_doc'].updateValueAndValidity();
    // this.companyPartnersForm.controls['tan_number_doc'].updateValueAndValidity();
  }

  cancelPartnerEntry() {
    this.companyPartnerEditActionId = '';
    this.companyPartnersForm.reset();

    for (const key in this.companyPartnersForm.controls) {
      if (
        Object.prototype.hasOwnProperty.call(
          this.companyPartnersForm.controls,
          key
        )
      ) {
        const element = this.companyPartnersForm.controls[key];

        element.markAsUntouched();
        element.markAsPristine();
      }
    }

    $('.from_pardetails').toggle();
  }

  submitCompanyPartner(event: any) {
    
    if (!this.AppComponent.checkCompanyModulePermission(
      {
        company_module: 'company_profile',
        company_sub_module:'company_profile',
        company_sub_operation: ['add','edit'],
        company_strict: true
      }
    )) {
      this.toastr.error('Permission not allowed');
      return;
    }

    this.companyPartnersForm.markAllAsTouched();
    // setTimeout(function () {
    //   let $_errFormControl = document.querySelectorAll("p.text-danger");
    //   if ($_errFormControl.length > 0) {
    //     const firstErr: Element = $_errFormControl[0];
    //     firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
    //   }
    // }, 100)

    if (this.companyPartnersForm.valid) {
      event.target.classList.add('btn-loading');

      var document: any = {
        first_name: this.companyPartnersForm.value.first_name ?? '',
        last_name: this.companyPartnersForm.value.last_name ?? '',
        designation: this.companyPartnersForm.value.designation ?? '',
        din_no: this.companyPartnersForm.value.din_no ?? '',
        date_of_appointment: this.companyPartnersForm.value.date_of_appointment
          ? this.datePipe.transform(
              this.companyPartnersForm.value.date_of_appointment,
              'Y-MM-dd'
            )
          : '',
        mobile_no: this.companyPartnersForm.value.mobile_no ?? '',
        pan_no: this.companyPartnersForm.value.pan_no ?? '',
        aadhaar_no: this.companyPartnersForm.value.aadhaar_no ?? '',
        partners_pan_doc: this.companyPartnersForm.value.partners_pan_doc
          ? this.companyPartnersForm.value.partners_pan_doc_file
          : '',
        partners_aadhaar_no: this.companyPartnersForm.value.partners_aadhaar_no
          ? this.companyPartnersForm.value.partners_aadhaar_no_file
          : '',
      };

      if (
        Object.values(document).every((x) => x === null || x === '') === true
      ) {
        this.toastr.warning('Atleast you must enter a data before submit');
        event.target.classList.remove('btn-loading');
        return;
      }

      document.partner_id = this.companyPartnerEditActionId;

      this.companyuserService.submitCompanyPartner(document).subscribe(
        (res) => {
          if (res.status == 'success') {
            this.toastr.success(res.message);
            this.cancelPartnerEntry();
            this.fetechProfileData();
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

  addEstablishment() {
    if (!this.AppComponent.checkCompanyModulePermission({
      company_module: 'company_profile',
      company_sub_module:'company_profile',
      company_sub_operation: ['edit'],
      company_strict: true
    })) {
      this.toastr.error('Permission not allowed');
      return;
    }

    this.cancelEstablishmentEntry();

    // this.companyEstablishmentForm.controls['trade_Licence_doc'].setValidators([Validators.required]);
    // this.companyEstablishmentForm.controls['gst_doc'].setValidators([Validators.required]);
    // this.companyEstablishmentForm.controls['pan_numberc_doc'].setValidators([Validators.required]);
    // this.companyEstablishmentForm.controls['tan_number_doc'].setValidators([Validators.required]);

    // this.companyEstablishmentForm.controls['trade_Licence_doc'].updateValueAndValidity();
    // this.companyEstablishmentForm.controls['gst_doc'].updateValueAndValidity();
    // this.companyEstablishmentForm.controls['pan_numberc_doc'].updateValueAndValidity();
    // this.companyEstablishmentForm.controls['tan_number_doc'].updateValueAndValidity();
  }

  editEstablishment(item: any) {
    if (!this.AppComponent.checkCompanyModulePermission(
      {
        company_module: 'company_profile',
        company_sub_module:'company_profile',
        company_sub_operation: ['edit'],
        company_strict: true
      }
    )) {
      this.toastr.error('Permission not allowed');
      return;
    }

    this.cancelEstablishmentEntry();

    this.companyEstablishmentEditActionId = item._id;
    this.companyEstablishmentForm.patchValue({
      nature_of_business: item.nature_of_business,
      date_of_incorporation: item.date_of_incorporation
        ? this.datePipe.transform(item.date_of_incorporation, 'YYYY-MM-dd')
        : null,
      mobile_no: item.mobile_no,
      email_id: item.email_id,
      trade_licence_no: item.trade_licence_no,
      gst_no: item.gst_no,
      pan_numberc: item.pan_numberc,
      tan_number: item.tan_number,
      land_line: item.land_line != 'null' ? item.land_line : null,
      alternate_email_id:
        item.alternate_email_id != 'null' ? item.alternate_email_id : null,
      website: item.website != 'null' ? item.website : null,
    });
    this.companyEstablishmentForm.get('pan_numberc')?.setValidators([Validators.required, Validators.pattern('^[A-Za-z]{5}[0-9]{4}[A-Za-z]{1}$')])
    this.companyEstablishmentForm.get('gst_no')?.setValidators([Validators.required, Validators.pattern('^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{3}$')])

    // this.companyEstablishmentForm.controls['trade_Licence_doc'].clearValidators();
    // this.companyEstablishmentForm.controls['gst_doc'].clearValidators();
    // this.companyEstablishmentForm.controls['pan_numberc_doc'].clearValidators();
    // this.companyEstablishmentForm.controls['tan_number_doc'].clearValidators();

    // this.companyEstablishmentForm.controls['trade_Licence_doc'].updateValueAndValidity();
    // this.companyEstablishmentForm.controls['gst_doc'].updateValueAndValidity();
    // this.companyEstablishmentForm.controls['pan_numberc_doc'].updateValueAndValidity();
    // this.companyEstablishmentForm.controls['tan_number_doc'].updateValueAndValidity();
  }

  cancelEstablishmentEntry() {
    this.companyEstablishmentEditActionId = '';
    this.companyEstablishmentForm.reset();

    for (const key in this.companyEstablishmentForm.controls) {
      if (
        Object.prototype.hasOwnProperty.call(
          this.companyEstablishmentForm.controls,
          key
        )
      ) {
        const element = this.companyEstablishmentForm.controls[key];

        element.markAsUntouched();
        element.markAsPristine();
      }
    }

    $('.from_establishmentdetails').toggle();
  }

  clickOnTabNav(pills_id: any) {
    $('.nav-pills')
      .find('#' + pills_id)
      .click();
    // $('html,body').animate({ scrollTop: 0 }, 'slow');
  }

  submitCompanyEstablishment(event: any) {
    if (!this.AppComponent.checkCompanyModulePermission(
      {
        company_module: 'company_profile',
        company_sub_module:'company_profile',
        company_sub_operation: ['add','edit'],
        company_strict: true
      }
    )) {
      this.toastr.error('Permission not allowed');
      return;
    }

    this.companyEstablishmentForm.markAllAsTouched();
    // setTimeout(function () {
    //   let $_errFormControl = document.querySelectorAll("p.text-danger");
    //   if ($_errFormControl.length > 0) {
    //     const firstErr: Element = $_errFormControl[0];
    //     firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
    //   }
    // }, 100)

    if (this.companyEstablishmentForm.valid) {
      event.target.classList.add('btn-loading');

      var document: any = {
        nature_of_business:
          this.companyEstablishmentForm.value.nature_of_business ?? '',
        date_of_incorporation: this.companyEstablishmentForm.value
          .date_of_incorporation
          ? this.datePipe.transform(
              this.companyEstablishmentForm.value.date_of_incorporation,
              'Y-MM-dd'
            )
          : '',
        trade_licence_no:
          this.companyEstablishmentForm.value.trade_licence_no ?? '',
        gst_no: this.companyEstablishmentForm.value.gst_no ?? '',
        pan_numberc: this.companyEstablishmentForm.value.pan_numberc ?? '',
        tan_number: this.companyEstablishmentForm.value.tan_number ?? '',
        mobile_no: this.companyEstablishmentForm.value.mobile_no ?? '',
        email_id: this.companyEstablishmentForm.value.email_id ?? '',
        trade_Licence_doc: this.companyEstablishmentForm.value.trade_Licence_doc
          ? this.companyEstablishmentForm.value.trade_Licence_doc_file
          : '',
        gst_doc: this.companyEstablishmentForm.value.gst_doc
          ? this.companyEstablishmentForm.value.gst_doc_file
          : '',
        pan_numberc_doc: this.companyEstablishmentForm.value.pan_numberc_doc
          ? this.companyEstablishmentForm.value.pan_numberc_doc_file
          : '',
        tan_number_doc: this.companyEstablishmentForm.value.tan_number_doc
          ? this.companyEstablishmentForm.value.tan_number_doc_file
          : '',
        land_line: this.companyEstablishmentForm.value.land_line ?? '',
        alternate_email_id:
          this.companyEstablishmentForm.value.alternate_email_id ?? '',
        website: this.companyEstablishmentForm.value.website ?? '',
      };

      if (
        Object.values(document).every((x) => x === null || x === '') === true
      ) {
        this.toastr.warning('Atleast you must enter a data before submit');
        event.target.classList.remove('btn-loading');
        return;
      }

      document.establishment_id = this.companyEstablishmentEditActionId;

      this.companyuserService.submitCompanyEstablishment(document).subscribe(
        (res) => {
          if (res.status == 'success') {
            this.toastr.success(res.message);
            // this.cancelEstablishmentEntry();
            $('.from_establishmentdetails').toggle();
            this.fetechProfileData();
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

  addBranch() {
    if (!this.AppComponent.checkCompanyModulePermission(
      {
        company_module: 'master',
        company_sub_module:'branch',
        company_sub_operation: ['add'],
        company_strict: true
      }
    )) {
      this.toastr.error('Permission not allowed');
      return;
    }

    this.cancelBranchEntry();

    // this.companyBranchesForm.controls['branch_EPFO_number_doc'].setValidators([Validators.required]);
    // this.companyBranchesForm.controls['branch_ESIC_number_doc'].setValidators([Validators.required]);
    // this.companyBranchesForm.controls['branch_P_Tax_number_doc'].setValidators([Validators.required]);

    // this.companyBranchesForm.controls['branch_EPFO_number_doc'].updateValueAndValidity();
    // this.companyBranchesForm.controls['branch_ESIC_number_doc'].updateValueAndValidity();
    // this.companyBranchesForm.controls['branch_P_Tax_number_doc'].updateValueAndValidity();
  }

  editBranch(item: any) {
    if (!this.AppComponent.checkCompanyModulePermission(
      {
        company_module: 'master',
        company_sub_module:'branch',
        company_sub_operation: ['edit'],
        company_strict: true
      }
    )) {
      this.toastr.error('Permission not allowed');
      return;
    }

    this.cancelBranchEntry();

    // console.log(item)

    this.companyBranchEditActionId = item._id;
    this.companyBranchesForm.patchValue({
      branch_name: item.branch_name,
      branch_contact_person: item.branch_contact_person,
      contact_person_number: item.contact_person_number,
      contact_person_email: item.contact_person_email,
      branch_ESIC_number: item.branch_ESIC_number,
      branch_P_Tax_number: item.branch_P_Tax_number,
      branch_address: item.branch_address,
      lwf_shop: item.lwf_shop,
      establishment_labour_license: item.establishment_labour_license,
      status: item.status,

      // 'branch_EPFO_number': item.branch_EPFO_number,
      epf_registration_no: item.epf_registration_no,
      epf_group_no: item.epf_group_no,
      epf_lin_no: item.epf_lin_no,
      epf_regional_office_address: item.epf_regional_office_address,
      epf_pf_rule_apply: this.pfRuleApplyMaster.find((obj: any) => {
        return obj.value === item.epf_pf_rule_apply;
      }),
      epf_pf_rule: this.pfRuleMaster.find((obj: any) => {
        return obj.value === item.epf_pf_rule;
      }),

      esic_registration_no: item.esic_registration_no,
      esic_regional_pf_office: item.esic_regional_pf_office,
      esic_lin_no: item.esic_lin_no,

      p_tax_registration_no_enrolment: item.p_tax_registration_no_enrolment,
      p_tax_registration_no_rgistration: item.p_tax_registration_no_enrolment,
    });

    // this.companyBranchesForm.controls['branch_EPFO_number_doc'].clearValidators();
    // this.companyBranchesForm.controls['branch_ESIC_number_doc'].clearValidators();
    // this.companyBranchesForm.controls['branch_P_Tax_number_doc'].clearValidators();

    // this.companyBranchesForm.controls['branch_EPFO_number_doc'].updateValueAndValidity();
    // this.companyBranchesForm.controls['branch_ESIC_number_doc'].updateValueAndValidity();
    // this.companyBranchesForm.controls['branch_P_Tax_number_doc'].updateValueAndValidity();
  }

  cancelBranchEntry() {
    this.companyBranchEditActionId = '';
    this.companyBranchesForm.reset();

    $('.from_combrde').toggle();
  }

  submitCompanyBranch(event: any) {
    if (!this.AppComponent.checkCompanyModulePermission(
      {
        company_module: 'master',
        company_sub_module:'branch',
        company_sub_operation: ['add', 'edit'],
        company_strict: true
      }
    )) {
      this.toastr.error('Permission not allowed');
      return;
    }

    this.companyBranchesForm.markAllAsTouched();
    setTimeout(function () {
      let $_errFormControl = document.querySelectorAll('p.text-danger');
      if ($_errFormControl.length > 0) {
        const firstErr: Element = $_errFormControl[0];
        firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);

    if (this.companyBranchesForm.valid) {
      event.target.classList.add('btn-loading');

      this.companyuserService
        .submitCompanyBranch({
          branch_name: this.companyBranchesForm.value.branch_name ?? '',
          branch_contact_person:
            this.companyBranchesForm.value.branch_contact_person ?? '',
          contact_person_number:
            this.companyBranchesForm.value.contact_person_number ?? '',
          contact_person_email:
            this.companyBranchesForm.value.contact_person_email ?? '',
          branch_ESIC_number:
            this.companyBranchesForm.value.branch_ESIC_number ?? '',
          branch_P_Tax_number:
            this.companyBranchesForm.value.branch_P_Tax_number ?? '',
          branch_address: this.companyBranchesForm.value.branch_address ?? '',
          lwf_shop: this.companyBranchesForm.value.lwf_shop ?? '',
          establishment_labour_license:
            this.companyBranchesForm.value.establishment_labour_license ?? '',
          status: this.companyBranchesForm.value.status,
          branch_id: this.companyBranchEditActionId,

          // 'branch_EPFO_number': this.companyBranchesForm.value.branch_EPFO_number ?? '',
          epf_registration_no:
            this.companyBranchesForm.value.epf_registration_no ?? '',
          epf_pf_rule_apply: this.companyBranchesForm.value.epf_pf_rule_apply
            ? this.companyBranchesForm.value.epf_pf_rule_apply.value
            : '',
          epf_group_no: this.companyBranchesForm.value.epf_group_no ?? '',
          epf_pf_rule: this.companyBranchesForm.value.epf_pf_rule
            ? this.companyBranchesForm.value.epf_pf_rule.value
            : '',
          epf_lin_no: this.companyBranchesForm.value.epf_lin_no ?? '',
          epf_regional_office_address:
            this.companyBranchesForm.value.epf_regional_office_address ?? '',

          esic_registration_no:
            this.companyBranchesForm.value.esic_registration_no ?? '',
          esic_regional_pf_office:
            this.companyBranchesForm.value.esic_regional_pf_office ?? '',
          esic_lin_no: this.companyBranchesForm.value.esic_lin_no ?? '',

          p_tax_registration_no_enrolment:
            this.companyBranchesForm.value.p_tax_registration_no_enrolment ??
            '',
          p_tax_registration_no_rgistration:
            this.companyBranchesForm.value.p_tax_registration_no_rgistration ??
            '',

          branch_EPFO_number_doc: this.companyBranchesForm.value
            .branch_EPFO_number_doc
            ? this.companyBranchesForm.value.branch_EPFO_number_doc_file
            : null,
          branch_ESIC_number_doc: this.companyBranchesForm.value
            .branch_ESIC_number_doc
            ? this.companyBranchesForm.value.branch_ESIC_number_doc_file
            : null,
          ptax_enrolment_certificate: this.companyBranchesForm.value
            .ptax_enrolment_certificate
            ? this.companyBranchesForm.value.ptax_enrolment_certificate_file
            : null,
          ptax_rgistration_certificate: this.companyBranchesForm.value
            .ptax_rgistration_certificate
            ? this.companyBranchesForm.value.ptax_rgistration_certificate_file
            : null,
        })
        .subscribe(
          (res) => {
            if (res.status == 'success') {
              this.toastr.success(res.message);
              this.cancelBranchEntry();
              this.fetechProfileData();
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

  submitCompanyPreference(event: any) {
    if (!this.AppComponent.checkCompanyModulePermission({
      company_module: 'company_profile',
      company_sub_module:'company_profile',
      company_sub_operation: ['edit'],
      company_strict: true
    })) {
      this.toastr.error('Permission not allowed');
      return;
    }

    this.companyPreferenceForm.markAllAsTouched();
    setTimeout(function () {
      let $_errFormControl = document.querySelectorAll('p.error-element');
      if ($_errFormControl.length > 0) {
        const firstErr: Element = $_errFormControl[0];
        firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);

    if (this.companyPreferenceForm.valid) {
      event.target.classList.add('btn-loading');
      this.companyuserService
        .updateCompanyPreference({
          epfo_rule: this.companyPreferenceForm.value.epfo_rule,
          esic_rule: this.companyPreferenceForm.value.esic_rule,
          gratuity_rule: this.companyPreferenceForm.value.gratuity_rule,
          bonus_rule: this.companyPreferenceForm.value.bonus_rule,
          financial_year_end: this.datePipe.transform(
            this.companyPreferenceForm.value.financial_year_end,
            'Y-MM-dd'
          ),
        })
        .subscribe(
          (res) => {
            if (res.status == 'success') {
              $('.from_prefsetting').find('.cancel-modal').click();
              this.toastr.success(res.message);
              this.fetechProfileData();
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

  imageViewer(imagepath: any) {
    var modal: any = $('#image-viewer-modal');
    modal.modal();

    $(modal).find('#image-src').attr('src', imagepath);
  }

  updateCompanyLogo(event: any) {
    if (!this.AppComponent.checkCompanyModulePermission({
      company_module: 'company_profile',
      company_sub_module:'company_profile',
      company_sub_operation: ['edit'],
      company_strict: true
    })) {
      this.toastr.error('Permission not allowed');
      return;
    }

    if (this.companyLogoUploadForm.valid) {
      event.target.classList.add('btn-loading');

      this.companyuserService
        .uploadCompanyLogo({
          com_logo: this.companyLogoUploadForm.value.imageSource,
        })
        .subscribe(
          (res) => {
            if (res.status == 'success') {
              this.toastr.success(res.message);
              Global.resetForm(this.companyLogoUploadForm);
              this.fetechProfileData();
              $('#compLogoModal').find('[data-dismiss="modal"]').click();
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

  onCompanyLogoChanged(event: any) {
    if (event.target.files.length > 0) {
      const file = event.target.files[0];
      this.companyLogoUploadForm.patchValue({
        imageSource: file,
      });
    }
  }
}
