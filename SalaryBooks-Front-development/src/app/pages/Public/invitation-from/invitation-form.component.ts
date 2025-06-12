import {
  Component,
  Input,
  OnInit,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import {
  UntypedFormBuilder,
  FormControl,
  UntypedFormGroup,
  Validators,
  FormGroup,
  UntypedFormArray,
  FormArray,
  AbstractControl,
} from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { AppComponent } from 'src/app/app.component';
import * as Global from 'src/app/globals';
import { AuthService } from 'src/app/services/auth.service';
import { CommonService } from 'src/app/services/common.service';
import { DatePipe } from '@angular/common';
import { BankDetailsComponent } from '../../employee/profile/bank-details/bank-details.component';
import { AddressComponent } from '../../employee/profile/address/address.component';
import { CompanyuserService } from 'src/app/services/companyuser.service';
import * as moment from 'moment';
// import { AddressComponent } from './address/address.component';
// import { BankDetailsComponent } from './bank-details/bank-details.component';

@Component({
  selector: 'app-invitation-form',
  templateUrl: './invitation-form.component.html',
  styleUrls: ['./invitation-form.component.css'],
})
export class InvitationFormComponent implements OnInit {
  Global = Global;
  operation: any;
  employee_details: any;
  address_details: any;
  bank_details: any;
  other_details: any;
  education_details: any;
  isPrev: boolean = false;
  isFormPending: boolean = true;
  isLoading: boolean = true;

  formType:
     'personal_details'
    | 'address_details'
    | 'bank_details'
    | 'pf_esi_data'
    | 'educational'
    | 'accident'
    | 'training'
    | 'extra_curricular' = 'personal_details';

  invitation_id: any;

  education_id: any = '';
  accident_id: any = '';
  training_id: any = '';
  extracurriculum_id: any = '';

  employeeDetailsForm: UntypedFormGroup;
  employeeAddressForm: UntypedFormGroup;
  employeeBankForm: UntypedFormGroup;
  employeeEducationForm: UntypedFormGroup;
  employeeAccidentForm: UntypedFormGroup;
  employeeTrainingForm: UntypedFormGroup;
  employeeExtraCurriculumForm: UntypedFormGroup;

  yesNoMaster: any[];
  sexMaster: any[] = Global.getGenderMaster();
  bloodGroupMaster: any[] = Global.bloodGroupMaster;
  maritalStatusMaster: any[] = Global.maritalStatusMaster;
  religionMaster: any[] = Global.religionMaster;
  hodMaster: any[] = [];
  addressProofMaster: any[];
  accountTypeMaster: any[] = [];
  isLinkValid: boolean = false;
  employmentForm: UntypedFormGroup;
  dispensaryForm: UntypedFormGroup;
  dispensaryMaster: any[] = [];
  relationMaster: any[] = Global.relationMaster;

  @Input() isInvite: boolean = false;

  constructor(
    public formBuilder: UntypedFormBuilder,
    private titleService: Title,
    private toastr: ToastrService,
    private router: Router,
    private companyuserService: CompanyuserService,
    private spinner: NgxSpinnerService,
    private activatedRoute: ActivatedRoute,
    private datePipe: DatePipe,
    public AppComponent: AppComponent
  ) {
    this.isLoading = true;

    this.invitation_id = activatedRoute.snapshot.queryParams['id'];

    this.employeeDetailsForm = formBuilder.group({
      emp_first_name: [null, Validators.compose([Validators.required])],
      emp_last_name: [null, Validators.compose([Validators.required])],
      emp_father_name: [null, Validators.compose([])],
      email_id: [null, Validators.compose([Validators.email])],
      mobile_no: [
        null,
        Validators.compose([
          Validators.required,
          Validators.pattern('^[0-9]*$'),
          Validators.minLength(10),
          Validators.maxLength(10),
        ]),
      ],
      alternate_mob_no: [
        null,
        Validators.compose([
          Validators.minLength(10),
          Validators.maxLength(10),
        ]),
      ],
      emp_dob: [null, Validators.compose([Validators.required])],
      sex: [null, Validators.compose([Validators.required])],
      aadhar_no: [
        null,
        Validators.compose([
          Validators.pattern('^[0-9]*$'),
          Validators.minLength(12),
          Validators.maxLength(12),
        ]),
      ],
      emp_aadhaar_image: [null, Validators.compose([])],
      emp_aadhaar_image_file: [null, Validators.compose([])],
      pan_no: [
        null,
        Validators.compose([Validators.pattern('^[A-Z]{5}[0-9]{4}[A-Z]{1}$')]),
      ],
      emp_pan_image: [null, Validators.compose([])],
      emp_pan_image_file: [null, Validators.compose([])],
      passport_no: [null, Validators.compose([])],
      emp_passport_image: [null, Validators.compose([])],
      emp_passport_image_file: [null, Validators.compose([])],
      passport_val_form: [null, Validators.compose([])],
      passport_val_to: [null, Validators.compose([])],
      nationality: [null, Validators.compose([])],
      blood_group: [null, Validators.compose([])],
      physical_disability: [null, Validators.compose([])],
      marital_status: [null, Validators.compose([])],
      marriage_date: [null, Validators.compose([])],
      emergency_contact_no: [
        null,
        Validators.compose([
          Validators.pattern('^[0-9]*$'),
          Validators.minLength(10),
          Validators.maxLength(10),
        ]),
      ],
      emergency_contact_name: [null, Validators.compose([])],
      domicile: [null, Validators.compose([])],
      height: [null, Validators.compose([])],
      religion: [null, Validators.compose([])],
      additional_id_image: [null, Validators.compose([])],
      additional_id_image_file: [null, Validators.compose([])],
      profile_image: [null, Validators.compose([])],
      profile_image_file: [null, Validators.compose([])],
    });
    this.employeeAddressForm = formBuilder.group({
      resident_no: [null, Validators.compose([])],
      residential_name: [null, Validators.compose([])],
      road: [null, Validators.compose([])],
      locality: [null, Validators.compose([])],
      city: [null, Validators.compose([])],
      district: [null, Validators.compose([])],
      state: [null, Validators.compose([])],
      pincode: [
        null,
        Validators.compose([
          ,
          Validators.pattern('^[0-9]*$'),
          Validators.minLength(6),
          Validators.maxLength(6),
        ]),
      ],
      country: [null, Validators.compose([])],
      diff_current_add: [null, Validators.compose([])],
      curr_resident_no: [null, Validators.compose([])],
      curr_residential_name: [null, Validators.compose([])],
      curr_road: [null, Validators.compose([])],
      curr_locality: [null, Validators.compose([])],
      curr_city: [null, Validators.compose([])],
      curr_district: [null, Validators.compose([])],
      curr_state: [null, Validators.compose([])],
      curr_pincode: [
        null,
        Validators.compose([
          Validators.pattern('^[0-9]*$'),
          Validators.minLength(6),
          Validators.maxLength(6),
        ]),
      ],
      curr_country: [null, Validators.compose([])],
    });
    this.employeeBankForm = formBuilder.group({
      name_on_passbook: [null, Validators.compose([])],
      bank_name: [null, Validators.compose([])],
      branch_name: [null, Validators.compose([])],
      branch_address: [null, Validators.compose([])],
      branch_pin: [null, Validators.compose([])],
      account_no: [null, Validators.compose([])],
      account_no_confirmation: [null, Validators.compose([])],
      account_type: [null, Validators.compose([])],
      ifsc_code: [null, Validators.compose([])],
      micr_no: [null, Validators.compose([])],
      cancel_cheque: [null, Validators.compose([])],
      cancel_cheque_file: [null, Validators.compose([])],
    });
    this.employmentForm = formBuilder.group({
      // pre_er_pf: [null, Validators.compose([])],
      pre_er_details: formBuilder.group({
        er_name: [null, Validators.compose([])],
        last_drawn_gross: [null, Validators.compose([])],
        contact_no: [
          null,
          Validators.compose([
            Validators.pattern('^[0-9]*$'),
            Validators.minLength(10),
            Validators.maxLength(10),
          ]),
        ],
        reporting_to: [null, Validators.compose([])],
        exit_date: [null, Validators.compose([])],
        last_designation: [null, Validators.compose([])],
      }),
      pre_er_epfo_details: formBuilder.group({
        uan_no: [null, Validators.compose([])],
        last_member_id: [null, Validators.compose([])],
        last_ro: [null, Validators.compose([])],
      }),
      pre_er_esic_details: formBuilder.group({
        esic_no: [null, Validators.compose([])],
        ip_dispensary: [null, Validators.compose([])],
        family_dispensary: [null, Validators.compose([])],
      }),
      curr_er_epfo_details: formBuilder.group({
        uan_no: [null, Validators.compose([])],
        last_member_id: [null, Validators.compose([])],
        last_ro: [null, Validators.compose([])],
        membership_date: [null, Validators.compose([])],
      }),
      curr_er_esic_details: formBuilder.group({
        esic_no: [null, Validators.compose([])],
        ip_dispensary: [null, Validators.compose([])],
        family_dispensary: [null, Validators.compose([])],
        membership_date: [null, Validators.compose([])],
      }),
      // esic_family_details: this.formBuilder.array([this.initFormRows('esic_family_details')]),
      // pf_nominee_details: this.formBuilder.array([this.initFormRows('pf_nominee_details')]),

      esic_family_details: this.formBuilder.array([]),
      pf_nominee_details: this.formBuilder.array([]),
    });
    this.dispensaryForm = formBuilder.group({
      dispensary_name: [null, Validators.compose([Validators.required])],
    });
    this.employeeEducationForm = formBuilder.group({
      institute: [null, Validators.compose([Validators.required])],
      university: [null, Validators.compose([Validators.required])],
      stream: [null, Validators.compose([Validators.required])],
      level: [null, Validators.compose([Validators.required])],
      specialisation: [null, Validators.compose([])],
      completion: [null, Validators.compose([])],

      education_file_image: [null, Validators.compose([])],
      education_file_image_file: [null, Validators.compose([])],
    });
    this.employeeAccidentForm = formBuilder.group({
      accident_type: [null, Validators.compose([Validators.required])],
      accident_name: [null, Validators.compose([])],
      description: [null, Validators.compose([])],
      comments: [null, Validators.compose([])],

      accident_file_image: [null, Validators.compose([])],
      accident_file_image_file: [null, Validators.compose([])],
    });
    this.employeeTrainingForm = formBuilder.group({
      training_type: [null, Validators.compose([Validators.required])],
      training_name: [null, Validators.compose([])],
      description: [null, Validators.compose([])],
      comments: [null, Validators.compose([])],

      training_file_image: [null, Validators.compose([])],
      training_file_image_file: [null, Validators.compose([])],
    });
    this.employeeExtraCurriculumForm = formBuilder.group({
      extra_curricular_type: [null, Validators.compose([Validators.required])],
      extracurriculum_name: [null, Validators.compose([])],
      description: [null, Validators.compose([])],
      comments: [null, Validators.compose([])],

      extra_curricular_file_image: [null, Validators.compose([])],
      extra_curricular_file_image_file: [null, Validators.compose([])],
    });
    this.employmentForm
      ?.get('pre_er_epfo_details')
      ?.get('uan_no')
      ?.valueChanges.subscribe((val) => {
        if ($('#previousemployment-toggle-ab')?.hasClass('on')) {
          this.employmentForm
            ?.get('curr_er_epfo_details')
            ?.get('uan_no')
            ?.setValue(val);
        }
      });

    this.employmentForm
      ?.get('pre_er_esic_details')
      ?.get('esic_no')
      ?.valueChanges.subscribe((val) => {
        if ($('#previousemployment-toggle-ab')?.hasClass('on')) {
          this.employmentForm
            ?.get('curr_er_esic_details')
            ?.get('esic_no')
            ?.setValue(val);
        }
      });
    this.yesNoMaster = [
      { value: 'yes', description: 'Yes' },
      { value: 'no', description: 'No' },
    ];
    this.addressProofMaster = [
      { value: 'pan', description: 'Pancard' },
      { value: 'aadhaar', description: 'Aadhaar Card' },
    ];
    this.accountTypeMaster = [
      { value: 'saving', description: 'Savings Account' },
      { value: 'current', description: 'Current Account' },
    ];

    this.employeeAddressForm
      .get('diff_current_add')
      ?.valueChanges.subscribe((val) => {
        if (val == 'yes') {
          $('#current-address-fields').show(500);
        } else {
          $('#current-address-fields').hide(500);
        }
      });
    this.fetchStates();
    companyuserService
      .ValidInvitationLink({
        invitation_id: this.invitation_id,
      })
      .toPromise()
      .then((res) => {
        if (res.doc) {
          this.isLinkValid = true;
          this.employee_details = res.doc.employee_details;
          if (res.doc.employee_details) {
            this.fetchEmployeeDetails();
          }
          this.isLoading = false;
        }
        this.isLoading = false;
      });
  }

  async ngOnInit() {}

  async createEmployee(e: any) {
    try {
      this.employeeDetailsForm.markAllAsTouched();
      setTimeout(function () {
        Global.scrollToQuery('p.error-element');
      }, 100);

      if (this.employeeDetailsForm.valid) {
        e.target.classList.add('btn-loading');

        let res = await this.companyuserService
          .createEmployeePublic({
            invitation_id: this.invitation_id,
            emp_first_name:
              this.employeeDetailsForm?.value?.emp_first_name ?? '',
            emp_last_name: this.employeeDetailsForm?.value?.emp_last_name ?? '',
            emp_father_name:
              this.employeeDetailsForm?.value?.emp_father_name ?? '',
            email_id: this.employeeDetailsForm?.value?.email_id ?? '',
            mobile_no: this.employeeDetailsForm?.value?.mobile_no ?? '',
            alternate_mob_no:
              this.employeeDetailsForm?.value?.alternate_mob_no ?? '',
            emp_dob: this.employeeDetailsForm?.value?.emp_dob ?? '',
            sex: this.employeeDetailsForm?.value?.sex?.value ?? '',
            aadhar_no: this.employeeDetailsForm?.value?.aadhar_no ?? '',
            emp_aadhaar_image:
              this.employeeDetailsForm?.value?.emp_aadhaar_image_file ?? '',
            pan_no: this.employeeDetailsForm?.value?.pan_no ?? '',
            emp_pan_image:
              this.employeeDetailsForm?.value?.emp_pan_image_file ?? '',
            passport_no: this.employeeDetailsForm?.value?.passport_no ?? '',
            emp_passport_image:
              this.employeeDetailsForm?.value?.emp_passport_image_file ?? '',
            passport_val_form:
              this.employeeDetailsForm?.value?.passport_val_form ?? '',
            passport_val_to:
              this.employeeDetailsForm?.value?.passport_val_to ?? '',
            nationality: this.employeeDetailsForm?.value?.nationality ?? '',
            blood_group:
              this.employeeDetailsForm?.value?.blood_group?.value ?? '',
            physical_disability:
              this.employeeDetailsForm?.value?.physical_disability?.value ?? '',
            marital_status:
              this.employeeDetailsForm?.value?.marital_status?.value ?? '',
            marriage_date: this.employeeDetailsForm?.value?.marriage_date ?? '',
            emergency_contact_no:
              this.employeeDetailsForm?.value?.emergency_contact_no ?? '',
            emergency_contact_name:
              this.employeeDetailsForm?.value?.emergency_contact_name ?? '',
            domicile: this.employeeDetailsForm?.value?.domicile ?? '',
            height: this.employeeDetailsForm?.value?.height ?? '',
            religion: this.employeeDetailsForm?.value?.religion?.value ?? '',
            additional_id_image:
              this.employeeDetailsForm?.value?.additional_id_image_file ?? '',
              profile_image:
              this.employeeDetailsForm?.value?.profile_image_file ?? '',
          })
          .toPromise();
        if (res.status !== 'success') throw res;
        this.employee_details = res.user_data;
        this.toastr.success(res.message);
        e.target.classList.remove('btn-loading');
      }
    } catch (err: any) {
      {
        e.target.classList.remove('btn-loading');
        if (err.status == 'val_err') {
          this.toastr.error(Global.showValidationMessage(err.val_msg));
        } else {
          this.toastr.error(Global.showServerErrorMessage(err));
          this.toastr.error(err.message);
        }
      }
    }
  }

  async updateEmployee(e: any) {
    try {
      this.employeeDetailsForm.markAllAsTouched();
      setTimeout(function () {
        Global.scrollToQuery('p.error-element');
      }, 100);

      if (this.employeeDetailsForm.valid) {
        e.target.classList.add('btn-loading');

        let res = await this.companyuserService
          .updateEmployeePublic({
            employee_id: this.employee_details?._id,
            invitation_id: this.invitation_id,
            emp_first_name:
              this.employeeDetailsForm?.value?.emp_first_name ?? '',
            emp_last_name: this.employeeDetailsForm?.value?.emp_last_name ?? '',
            emp_father_name:
              this.employeeDetailsForm?.value?.emp_father_name ?? '',
            email_id: this.employeeDetailsForm?.value?.email_id ?? '',
            mobile_no: this.employeeDetailsForm?.value?.mobile_no ?? '',
            alternate_mob_no:
              this.employeeDetailsForm?.value?.alternate_mob_no ?? '',
            emp_dob: this.employeeDetailsForm?.value?.emp_dob ?? '',
            sex: this.employeeDetailsForm?.value?.sex?.value ?? '',
            aadhar_no: this.employeeDetailsForm?.value?.aadhar_no ?? '',
            emp_aadhaar_image:
              this.employeeDetailsForm?.value?.emp_aadhaar_image_file ?? '',
            pan_no: this.employeeDetailsForm?.value?.pan_no ?? '',
            emp_pan_image:
              this.employeeDetailsForm?.value?.emp_pan_image_file ?? '',
            passport_no: this.employeeDetailsForm?.value?.passport_no ?? '',
            emp_passport_image:
              this.employeeDetailsForm?.value?.emp_passport_image_file ?? '',
            passport_val_form:
              this.employeeDetailsForm?.value?.passport_val_form ?? '',
            passport_val_to:
              this.employeeDetailsForm?.value?.passport_val_to ?? '',
            nationality: this.employeeDetailsForm?.value?.nationality ?? '',
            blood_group:
              this.employeeDetailsForm?.value?.blood_group?.value ?? '',
            physical_disability:
              this.employeeDetailsForm?.value?.physical_disability?.value ?? '',
            marital_status:
              this.employeeDetailsForm?.value?.marital_status?.value ?? '',
            marriage_date: this.employeeDetailsForm?.value?.marriage_date ?? '',
            emergency_contact_no:
              this.employeeDetailsForm?.value?.emergency_contact_no ?? '',
            emergency_contact_name:
              this.employeeDetailsForm?.value?.emergency_contact_name ?? '',
            domicile: this.employeeDetailsForm?.value?.domicile ?? '',
            height: this.employeeDetailsForm?.value?.height ?? '',
            religion: this.employeeDetailsForm?.value?.religion?.value ?? '',
            additional_id_image:
              this.employeeDetailsForm?.value?.additional_id_image_file ?? '',
              profile_image:
              this.employeeDetailsForm?.value?.profile_image_file ?? '',
          })
          .toPromise();
        if (res.status !== 'success') throw res;
        // this.employee_details = res.user_data;
        this.fetchEmployeeDetails();
        // this.formType = 'address_details';
        this.toastr.success(res.message);

        e.target.classList.remove('btn-loading');
      }
    } catch (err: any) {
      {
        e.target.classList.remove('btn-loading');
        if (err.status == 'val_err') {
          this.toastr.error(Global.showValidationMessage(err.val_msg));
        } else {
          this.toastr.error(Global.showServerErrorMessage(err));
          this.toastr.error(err.message);
        }
      }
    }
  }
  imageViewer(imagepath: any) {
    var modal: any = $('#image-viewer-modal');
    modal.modal();        
    $(modal).find('#image-src').attr('src', imagepath);
  }
  async updateEmployeeAddress(e: any) {
    try {
      if (this.employeeAddressForm.valid) {
        e.target.classList.add('btn-loading');

        let res = await this.companyuserService
          .updateEmployeeAddressPublic({
            invitation_id: this.invitation_id,
            resident_no: this.employeeAddressForm.value?.resident_no ?? '',
            residential_name:
              this.employeeAddressForm.value?.residential_name ?? '',
            road: this.employeeAddressForm.value?.road ?? '',
            locality: this.employeeAddressForm.value?.locality ?? '',
            city: this.employeeAddressForm.value?.city ?? '',
            district: this.employeeAddressForm.value?.district ?? '',
            state: this.employeeAddressForm.value?.state?.description ?? '',
            pincode: this.employeeAddressForm.value?.pincode ?? '',
            country: this.employeeAddressForm.value?.country ?? '',
            diff_current_add:
              this.employeeAddressForm.value?.diff_current_add ?? '',
            curr_resident_no:
              this.employeeAddressForm.value?.diff_current_add == 'yes'
                ? this.employeeAddressForm.value?.curr_resident_no ?? ''
                : '',
            curr_residential_name:
              this.employeeAddressForm.value?.diff_current_add == 'yes'
                ? this.employeeAddressForm.value?.curr_residential_name ?? ''
                : '',
            curr_road:
              this.employeeAddressForm.value?.diff_current_add == 'yes'
                ? this.employeeAddressForm.value?.curr_road ?? ''
                : '',
            curr_locality:
              this.employeeAddressForm.value?.diff_current_add == 'yes'
                ? this.employeeAddressForm.value?.curr_locality ?? ''
                : '',
            curr_city:
              this.employeeAddressForm.value?.diff_current_add == 'yes'
                ? this.employeeAddressForm.value?.curr_city ?? ''
                : '',
            curr_district:
              this.employeeAddressForm.value?.diff_current_add == 'yes'
                ? this.employeeAddressForm.value?.curr_district ?? ''
                : '',
            curr_state:
              this.employeeAddressForm.value?.diff_current_add == 'yes'
                ? this.employeeAddressForm.value?.curr_state ?? ''
                : '',
            curr_pincode:
              this.employeeAddressForm.value?.diff_current_add == 'yes'
                ? this.employeeAddressForm.value?.curr_pincode ?? ''
                : '',
            curr_country:
              this.employeeAddressForm.value?.diff_current_add == 'yes'
                ? this.employeeAddressForm.value?.curr_country ?? ''
                : '',
            employee_id: this.employee_details._id,
          })
          .toPromise();

        if (res.status !== 'success') throw res;
        this.address_details = res.emp_det;
        // this.formType = 'bank_details';
        this.toastr.success(res.message);

        e.target.classList.remove('btn-loading');
      }
    } catch (err: any) {
      {
        e.target.classList.remove('btn-loading');
        if (err.status == 'val_err') {
          this.toastr.error(Global.showValidationMessage(err.val_msg));
        } else {
          this.toastr.error(Global.showServerErrorMessage(err));
          this.toastr.error(err.message);
        }
      }
    }
  }

  async updateEmployeeBankDetail(e: any) {
    try {
      this.employeeBankForm.markAllAsTouched();
      Global.scrollToQuery('p.error-element');

      if (this.employeeBankForm.valid) {
        if (
          this.employeeBankForm.value.account_no &&
          this.employeeBankForm.value.account_no !==
            this.employeeBankForm.value.account_no_confirmation
        ) {
          this.toastr.error("Account number does't matched");
          return;
        }

        e.target.classList.add('btn-loading');

        let res = await this.companyuserService
          .updateEmployeeBankDetailsPublic({
            name_on_passbook:
              this.employeeBankForm?.value?.name_on_passbook ?? '',
            bank_name: this.employeeBankForm?.value?.bank_name ?? '',
            branch_name: this.employeeBankForm?.value?.branch_name ?? '',
            branch_address: this.employeeBankForm?.value?.branch_address ?? '',
            branch_pin: this.employeeBankForm?.value?.branch_pin ?? '',
            account_no: this.employeeBankForm?.value?.account_no ?? '',
            account_type:
              this.employeeBankForm?.value?.account_type?.value ?? '',
            ifsc_code: this.employeeBankForm?.value?.ifsc_code ?? '',
            micr_no: this.employeeBankForm?.value?.micr_no ?? '',
            cancel_cheque:
              this.employeeBankForm?.value?.cancel_cheque_file ?? '',
            employee_id: this.employee_details._id,
            invitation_id: this.invitation_id,
          })
          .toPromise();
        if (res.status !== 'success') throw res;
        this.bank_details = res.emp_det;
        // this.formType = 'pf_esi_data';
        this.toastr.success(res.message);

        e.target.classList.remove('btn-loading');
      }
    } catch (err: any) {
      {
        e.target.classList.remove('btn-loading');
        if (err.status == 'val_err') {
          this.toastr.error(Global.showValidationMessage(err.val_msg));
        } else {
          this.toastr.error(Global.showServerErrorMessage(err));
          this.toastr.error(err.message);
        }
      }
    }
  }

  async updateEmployeeOtherDetail(e: any) {
    try {
      this.employmentForm.markAllAsTouched();
      Global.scrollToQuery('p.error-element');

      if (this.employmentForm.valid) {
        e.target.classList.add('btn-loading');

        let payload: any = {
          employee_id: this.employee_details._id,
          invitation_id: this.invitation_id,
        };

        if ($('#previousemployment-toggle-ab')?.hasClass('on')) {
          payload.pre_er_pf = 'yes';

          payload.pre_er_details = JSON.stringify({
            er_name: this.employmentForm.value?.pre_er_details?.er_name ?? null,
            last_drawn_gross:
              this.employmentForm.value?.pre_er_details?.last_drawn_gross ??
              null,
            contact_no:
              this.employmentForm.value?.pre_er_details?.contact_no ?? null,
            reporting_to:
              this.employmentForm.value?.pre_er_details?.reporting_to ?? null,
            exit_date:
              this.employmentForm.value?.pre_er_details?.exit_date ?? null,
            last_designation:
              this.employmentForm.value?.pre_er_details?.last_designation ??
              null,
          });

          payload.pre_er_epfo_details = JSON.stringify({
            uan_no:
              this.employmentForm.value?.pre_er_epfo_details?.uan_no ?? null,
            last_member_id:
              this.employmentForm.value?.pre_er_epfo_details?.last_member_id ??
              null,
            last_ro:
              this.employmentForm.value?.pre_er_epfo_details?.last_ro ?? null,
          });

          payload.pre_er_esic_details = JSON.stringify({
            esic_no:
              this.employmentForm?.value?.pre_er_esic_details?.esic_no ?? null,
            ip_dispensary:
              this.employmentForm?.value?.pre_er_esic_details?.ip_dispensary ??
              null,
            family_dispensary:
              this.employmentForm?.value?.pre_er_esic_details
                ?.family_dispensary ?? null,
          });
        } else {
          payload.pre_er_pf = 'no';

          payload.pre_er_details = JSON.stringify({
            er_name: null,
            last_drawn_gross: null,
            contact_no: null,
            reporting_to: null,
            exit_date: null,
            last_designation: null,
          });

          payload.pre_er_epfo_details = JSON.stringify({
            uan_no: null,
            last_member_id: null,
            last_ro: null,
          });

          payload.pre_er_esic_details = JSON.stringify({
            esic_no: null,
            ip_dispensary: null,
            family_dispensary: null,
          });
        }

        payload.curr_er_epfo_details = JSON.stringify({
          uan_no:
            this.employmentForm?.value?.curr_er_epfo_details?.uan_no ?? null,
          last_member_id:
            this.employmentForm?.value?.curr_er_epfo_details?.last_member_id ??
            null,
          last_ro:
            this.employmentForm?.value?.curr_er_epfo_details?.last_ro ?? null,
          membership_date:
            this.employmentForm?.value?.curr_er_epfo_details?.membership_date ??
            null,
        });

        payload.curr_er_esic_details = JSON.stringify({
          esic_no:
            this.employmentForm?.value?.curr_er_esic_details?.esic_no ?? null,
          ip_dispensary:
            this.employmentForm?.value?.curr_er_esic_details?.ip_dispensary ??
            null,
          family_dispensary:
            this.employmentForm?.value?.curr_er_esic_details
              ?.family_dispensary ?? null,
          membership_date:
            this.employmentForm?.value?.curr_er_esic_details?.membership_date ??
            null,
        });

        /**
         * esic_family_details
         */
        let esic_family_details: any[] = [];
        (this.employmentForm?.value?.esic_family_details ?? []).forEach(
          (details: any) => {
            esic_family_details.push({
              fm_name: details?.fm_name ?? null,
              fm_dob: details?.fm_dob ?? null,
              fm_relation: details?.fm_relation?.value ?? null,
              sex: details?.sex?.value ?? null,
              residing_with_if:
                details?.residing_with_if == true ? 'yes' : 'no',
            });
          }
        );

        /**
         * pf_nominee_details
         */
        let pf_nominee_details: any[] = [];
        (this.employmentForm?.value?.pf_nominee_details ?? []).forEach(
          (details: any) => {
            pf_nominee_details.push({
              aadhar_no: details?.aadhar_no ?? null,
              dob: details?.dob ?? null,
              name: details?.name ?? null,
              sex: details?.sex?.value ?? null,
              fm_relation: details?.fm_relation?.value ?? null,
              address: details?.address ?? null,
            });
          }
        );

        payload.esic_family_details = JSON.stringify(esic_family_details);
        payload.pf_nominee_details = JSON.stringify(pf_nominee_details);

        let res = await this.companyuserService
          .updateEmployeeEmploymentDetailsPublic(payload)
          .toPromise();
        if (res.status !== 'success') throw res;
        this.other_details = res.emp_det;
        e.target.classList.remove('btn-loading');

        // this.formType = 'educational';
        this.toastr.success(res.message);
      }
    } catch (err: any) {
      {
        e.target.classList.remove('btn-loading');
        if (err.status == 'val_err') {
          this.toastr.error(Global.showValidationMessage(err.val_msg));
        } else {
          this.toastr.error(Global.showServerErrorMessage(err));
          this.toastr.error(err.message);
        }
      }
    }
  }

  updateEmployeeEducationDetails(event: any) {
    this.employeeEducationForm.markAllAsTouched();
    if(this.employeeEducationForm.invalid) return;
    Global.scrollToQuery('p.error-element');

    if (this.employeeEducationForm.valid) {
      event.target.classList.add('btn-loading');

      this.companyuserService
        .updateEmployeeEducationDetailsPublic({
          invitation_id: this.invitation_id,
          institute: this.employeeEducationForm.value.institute ?? '',
          university: this.employeeEducationForm.value.university ?? '',
          stream: this.employeeEducationForm.value.stream ?? '',
          level: this.employeeEducationForm.value.level ?? '',
          specialisation: this.employeeEducationForm.value.specialisation ?? '',
          completion: this.employeeEducationForm.value.completion ?? '',
          education_file_image:
            this.employeeEducationForm.value.education_file_image_file ?? '',
          employee_id: this.employee_details._id,
          education_id: this.education_id,
        })
        .subscribe(
          (res) => {
            if (res.status == 'success') {
              this.toastr.success(res.message);
              this.fetchEmployeeDetails();
              if (!this.education_id) {
                this.cancelEntry();
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

  updateEmployeeAccidentDetails(event: any) {
    this.employeeAccidentForm.markAllAsTouched();
    if(this.employeeAccidentForm.invalid) return
    Global.scrollToQuery('p.error-element');

    if (this.employeeAccidentForm.valid) {
      event.target.classList.add('btn-loading');

      this.companyuserService
        .updateEmployeeAccidentDetailsPublic({
          invitation_id: this.invitation_id,
          accident_type: this.employeeAccidentForm.value.accident_type ?? '',
          accident_name: this.employeeAccidentForm.value.accident_name ?? '',
          description: this.employeeAccidentForm.value.description ?? '',
          comments: this.employeeAccidentForm.value.comments ?? '',
          accident_file_image:
            this.employeeAccidentForm.value.accident_file_image_file ?? '',
          employee_id: this.employee_details?._id,
          accident_id: this.accident_id,
        })
        .subscribe(
          (res) => {
            if (res.status == 'success') {
              this.toastr.success(res.message);
              this.fetchEmployeeDetails();

              if (!this.accident_id) {
                this.cancelEntry();
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

  updateEmployeeTrainingDetails(event: any) {
    this.employeeTrainingForm.markAllAsTouched();
    if(this.employeeTrainingForm.invalid) return
    Global.scrollToQuery('p.error-element');

    if (this.employeeTrainingForm.valid) {
      event.target.classList.add('btn-loading');

      this.companyuserService
        .updateEmployeeTrainingDetailsPublic({
          invitation_id: this.invitation_id,
          training_type: this.employeeTrainingForm.value.training_type ?? '',
          training_name: this.employeeTrainingForm.value.training_name ?? '',
          description: this.employeeTrainingForm.value.description ?? '',
          comments: this.employeeTrainingForm.value.comments ?? '',
          training_file_image:
            this.employeeTrainingForm.value.training_file_image_file ?? '',
          employee_id: this.employee_details?._id,
          training_id: this.training_id,
        })
        .subscribe(
          (res) => {
            if (res.status == 'success') {
              this.toastr.success(res.message);
              this.fetchEmployeeDetails();

              if (!this.accident_id) {
                this.cancelEntry();
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

  updateEmployeeExtraCurriculumDetails(event: any) {
    this.employeeExtraCurriculumForm.markAllAsTouched();
    if(this.employeeExtraCurriculumForm.invalid) return 
    Global.scrollToQuery('p.error-element');

    if (this.employeeExtraCurriculumForm.valid) {
      event.target.classList.add('btn-loading');

      this.companyuserService
        .updateEmployeeExtraCurriculumDetailsPublic({
          invitation_id: this.invitation_id,
          extra_curricular_type:
            this.employeeExtraCurriculumForm.value.extra_curricular_type ?? '',
          extracurriculum_name:
            this.employeeExtraCurriculumForm.value.extracurriculum_name ?? '',
          description: this.employeeExtraCurriculumForm.value.description ?? '',
          comments: this.employeeExtraCurriculumForm.value.comments ?? '',
          extra_curricular_file_image:
            this.employeeExtraCurriculumForm.value
              .extra_curricular_file_image_file ?? '',
          employee_id: this.employee_details?._id,
          extra_curri_id: this.extracurriculum_id,
        })
        .subscribe(
          (res) => {
            if (res.status == 'success') {
              this.toastr.success(res.message);
              this.fetchEmployeeDetails();

              // if (!this.extracurriculum_id) {
                this.cancelEntry();
              // }
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

  cancelEntry() {
    Global.resetForm(this.employeeDetailsForm);
    this.employeeDetailsForm.reset();
    this.employeeAddressForm.reset();
    this.employeeBankForm.reset();
    this.employeeEducationForm.reset();
    this.employeeAccidentForm.reset();
    this.employeeTrainingForm.reset();
    this.employeeExtraCurriculumForm.reset();
    this.fetchEmployeeDetails();
  }

  stateMaster: any[];

  fetchStates() {
    this.spinner.show();

    this.companyuserService.fetchStatesPublic().subscribe(
      (res) => {
        if (res.status == 'success') {
          this.stateMaster = [];
          for (const key in res.state_list[0].states) {
            if (
              Object.prototype.hasOwnProperty.call(
                res.state_list[0].states,
                key
              )
            ) {
              const element = res.state_list[0].states[key];
              this.stateMaster.push({
                id: element.id,
                description: element.name,
              });
            }
          }
        } else {
          this.toastr.error(res.message);
        }

        this.spinner.hide();
      },
      (err) => {
        this.toastr.error(Global.showServerErrorMessage(err));
        this.spinner.hide();
      }
    );
  }

  getEmployeeMaster() {
    this.spinner.show();
    this.companyuserService.fetchDispensaries({}).subscribe(
      (res: any) => {
        if (res.status == 'success') {
          this.dispensaryMaster = [];
          res.dispensary.docs.forEach((element: any) => {
            this.dispensaryMaster.push({
              id: element._id,
              description: element.dispensary_name,
            });
          });
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

  fetchEmployeeDetails() {
    this.spinner.show();
    this.companyuserService
      .getEmployeeDetailsPublic({ employee_id: this.employee_details._id })
      .subscribe(
        (res: any) => {
          if (res.status == 'success') {
            this.employee_details = res.employee_det;
            let emp_data = res.employee_det.emp_det;

            this.updateFormValues(
              this.employeeDetailsForm,
              this.employee_details
            );
            this.updateFormValues(this.employeeAddressForm, {
              ...emp_data.emp_address,
              ...emp_data.emp_curr_address,
            });
            this.updateFormValues(this.employeeBankForm, emp_data.bank_details);
            this.updateFormValues(
              this.employmentForm,
              emp_data.pf_esic_details
            );

            (emp_data.pf_esic_details?.esic_family_details ?? []).forEach(
              (details: any) => {
                this.addFormRows(
                  this.employmentForm,
                  'esic_family_details',
                  details
                );
              }
            );

            (emp_data.pf_esic_details?.pf_nominee_details ?? []).forEach(
              (details: any) => {
                this.addFormRows(
                  this.employmentForm,
                  'pf_nominee_details',
                  details
                );
              }
            );
          } else {
            this.toastr.error(res.message);
          }

          this.spinner.hide();
        },
        (err: any) => {
          this.spinner.hide();
          this.toastr.error(Global.showServerErrorMessage(err));
        }
      );
  }

  updateFormValues(group: FormGroup | FormArray, values: any) {
    try {
      Object.keys(group.controls).forEach((k) => {
        const control = group.get(k);
        if (values && values[k] !== undefined) {
          if (!Array.isArray(values[k])) {
            control?.setValue(values[k]);
            if (k == 'sex') {
              control?.setValue(
                this.sexMaster.find((m) => m.value == values[k])
              );
            }
            if (k == 'emp_dob') {
              control?.setValue(moment(values[k]).format('YYYY-MM-DD'));
            }
            if (k == 'marital_status') {
              control?.setValue(
                this.maritalStatusMaster.find((m) => m.value == values[k])
              );
            }
            if (k == 'physical_disability') {
              control?.setValue(
                this.yesNoMaster.find((m) => m.value == values[k])
              );
            }
            if (k == 'blood_group') {
              control?.setValue(
                this.bloodGroupMaster.find((m) => m.value == values[k])
              );
            }
            if (k == 'marriage_date') {
              control?.setValue(moment(values[k]).format('YYYY-MM-DD'));
            }
            if (k == 'religion') {
              control?.setValue(
                this.religionMaster.find((m) => m.value == values[k])
              );
            }
            
          }
        }
      });
      
    } catch (err) {
      throw err;
    }
  }
  createDispensary(event: any) {
    if (this.dispensaryForm.valid) {
      event.target.classList.add('btn-loading');

      this.companyuserService
        .createDispensary({
          dispensary_name: this.dispensaryForm.value.dispensary_name,
          status: 'active',
        })
        .subscribe(
          (res) => {
            if (res.status == 'success') {
              this.toastr.success(res.message);
              this.dispensaryForm.reset();
              this.getEmployeeMaster();
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

  shuffleFields() {
    setTimeout(() => {
      if ($('#previousemployment-toggle-ab')?.hasClass('on')) {
        $('#prevemployment-fields-ab')?.show(300);
      } else {
        $('#prevemployment-fields-ab')?.hide(300);
      }
    }, 100);
  }

  initFormRows(type: any, data: any = null) {
    switch (type) {
      case 'esic_family_details':
        return this.formBuilder.group({
          fm_name: [data?.fm_name ?? null, Validators.compose([])],
          fm_dob: [data?.fm_dob ?? null, Validators.compose([])],
          fm_relation: [
            data?.fm_relation
              ? this.relationMaster?.find((obj: any) => {
                  return obj.value == data?.fm_relation;
                }) ?? null
              : null,
            Validators.compose([]),
          ],
          sex: [
            data?.sex
              ? this.sexMaster?.find((obj: any) => {
                  return obj.value == data?.sex;
                }) ?? null
              : null,
            Validators.compose([]),
          ],
          residing_with_if: [
            data?.residing_with_if == 'yes' ? true : false,
            Validators.compose([]),
          ],
        });

      case 'pf_nominee_details':
        return this.formBuilder.group({
          aadhar_no: [
            data?.aadhar_no ?? null,
            Validators.compose([
              Validators.pattern('^[0-9]*$'),
              Validators.minLength(12),
              Validators.maxLength(12),
            ]),
          ],
          dob: [data?.dob ?? null, Validators.compose([])],
          name: [data?.name ?? null, Validators.compose([])],
          sex: [
            data?.sex
              ? this.sexMaster?.find((obj: any) => {
                  return obj.value == data?.sex;
                }) ?? null
              : null,
            Validators.compose([]),
          ],
          fm_relation: [
            data?.fm_relation
              ? this.relationMaster?.find((obj: any) => {
                  return obj.value == data?.fm_relation;
                }) ?? null
              : null,
            Validators.compose([]),
          ],
          address: [data?.address ?? null, Validators.compose([])],
          profile_pic: [null, Validators.compose([])],
          profile_pic_file: [null, Validators.compose([])],
        });

      default:
        return this.formBuilder.group({});
    }
  }

  addFormRows(formGroup: UntypedFormGroup, type: any, data: any = null) {
    const control = <UntypedFormArray>formGroup.get(type);
    switch (type) {
      case 'esic_family_details':
        control.push(this.initFormRows('esic_family_details', data));
        break;

      case 'pf_nominee_details':
        control.push(this.initFormRows('pf_nominee_details', data));
        break;
    }
  }

  getEditEducation(item: any) {
    this.education_id = item._id;
    this.employeeEducationForm.patchValue({
      institute: item.institute,
      university: item.university,
      stream: item.stream,
      level: item.level,
      specialisation: item.specialisation,
      completion: item.completion,
    });

    Global.scrollToQuery('#education-submit-section');
  }
  getEditAccident(item: any) {
    this.accident_id = item._id;
    this.employeeAccidentForm.patchValue({
      accident_type: item.accident_type,
      accident_name: item.accident_name,
      description: item.description,
      comments: item.comments,
    });

    Global.scrollToQuery('#accident-submit-section');
  }
  getEditTraining(item: any) {
    this.training_id = item._id;
    this.employeeTrainingForm.patchValue({
      training_type: item.training_type,
      training_name: item.training_name,
      description: item.description,
      comments: item.comments,
    });

    Global.scrollToQuery('#training-submit-section');
  }
  getEditExCurr(item: any) {
    this.extracurriculum_id = item._id;
    this.employeeExtraCurriculumForm.patchValue({
      extra_curricular_type: item.extra_curricular_type,
      extracurriculum_name: item.extracurriculum_name,
      description: item.description,
      comments: item.comments,
    });

    Global.scrollToQuery('#extracurriculum-submit-section');
  }

  addRemoveMenuClass(el: HTMLUListElement) {
    if (el.classList.contains('d-none')) {
      el.classList.remove('d-none');
      el.classList.add('d-inline');
    }else{
      el.classList.remove('d-inline');
      el.classList.add('d-none');
    }
  }
}
