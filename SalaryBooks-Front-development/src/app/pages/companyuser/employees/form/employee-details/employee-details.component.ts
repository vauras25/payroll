import { Component, Input, OnInit } from '@angular/core';
import {
  AbstractControl,
  UntypedFormBuilder,
  FormControl,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { CompanyuserService } from 'src/app/services/companyuser.service';
import * as Global from 'src/app/globals';
import swal from 'sweetalert2';
import { DatePipe } from '@angular/common';
import { AppComponent } from 'src/app/app.component';
import { fileSizeValidator } from 'src/app/globals';
import * as moment from 'moment';

@Component({
  selector: 'companyuser-app-employee-form-details',
  templateUrl: './employee-details.component.html',
  styleUrls: ['./employee-details.component.css'],
})
export class CMPEmployeeDetailsFormComponent implements OnInit {
  Global = Global;
  operation: any;
  employee_id: any;
  employee_details: any;

  employeeDetailsForm: UntypedFormGroup;
  yesNoMaster: any[];
  sexMaster: any[] = Global.getGenderMaster();
  bloodGroupMaster: any[] = Global.bloodGroupMaster;
  maritalStatusMaster: any[] = Global.maritalStatusMaster;
  religionMaster: any[] = Global.religionMaster;
  hodMaster: any[] = [];

  @Input() isInvite: boolean = false;
  max_upload_limit: any = '';
  net_uploaded_size: any = '';
  filesNum: any;
  fileSize: number;
  aadhaar_image_size: any = 0;
  pan_image_size: any = 0;
  additional_image_size: any = 0;
  passport_image_size: any = 0;
  profile_image_size: any = 0;
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
    this.employeeDetailsForm = formBuilder.group({
      emp_hod: [null, Validators.compose([Validators.required])],
      gross_salary: [
        null,
        Validators.compose([
          Validators.required,
          Validators.min(0),
          Validators.pattern('^[0-9]*$'),
        ]),
      ],
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
        Validators.compose([
          Validators.pattern('^[A-Za-z]{5}[0-9]{4}[A-Za-z]{1}$'),
        ]),
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

    this.yesNoMaster = [
      { value: 'yes', description: 'Yes' },
      { value: 'no', description: 'No' },
    ];
    
  }
  getToday(): string {
    return new Date().toISOString().split('T')[0];
  }
  disableType(ev: any) {
    ev.preventDefault();
  }
  transformToUpperCase(event: any) {
    event.target.value = event.target.value.toUpperCase();
  }
  async ngOnInit() {
    this.titleService.setTitle('Employees - ' + Global.AppName);
    this.activatedRoute.params.subscribe(
      (params) => (this.employee_id = params['employee_id'] ?? null)
    );

    await this.fetchCompanyDetails();


    if (!this.employee_id) {
      this.operation = 'add';
      this.employeeDetailsForm
        ?.get('emp_hod')
        ?.setValidators([Validators.required]);
    } else {
      this.employeeDetailsForm?.get('emp_hod')?.clearValidators();
      this.employeeDetailsForm?.get('gross_salary')?.clearValidators();


      let r = this.router.url.split('/');
      if (r[4] == 'view') {
        this.operation = 'view';
        $('input[type="date"]').attr('type', 'text');
      } else if (r[4] == 'edit') {
        this.operation = 'edit';
      }

      await this.fetchEmployeeDetails();
    }
    this.employeeDetailsForm.get('marital_status')?.valueChanges.subscribe((value) => {
      const marriageDateControl = this.employeeDetailsForm.get('marriage_date');

      if (value === 'married') {

          marriageDateControl?.setValidators([Validators.required]);
      } else {

          marriageDateControl?.clearValidators();
          marriageDateControl?.reset();
      }


      marriageDateControl?.updateValueAndValidity();
  });
    this.employeeDetailsForm?.get('emp_hod')?.updateValueAndValidity();

    
    if (
      !this.AppComponent.checkCompanyModulePermission({
        company_module: 'employee',
        company_operation: 'listing_add_approve',
        company_sub_module: 'employee_master_data',
        company_sub_operation: [this.operation],
        // staff_module: 'employee_approval',
        // staff_operation: ['add', 'edit', 'view', 'delete'],
        company_strict: true,
        // staff_module: 'employee_details',
        // staff_operation: [this.operation],
        // company_strict: true,
      })
    ) {
      const _this = this;
      setTimeout(function () {
        _this.router.navigate(['company/errors/unauthorized-access'], {
          skipLocationChange: true,
        });
      }, 500);
      return;
    }

    await this.getEmployeeMaster();
  }
 imageViewer(imagepath: any) {
    var modal: any = $('#image-viewer-modal');
    modal.modal();    
    $(modal).find('#image-src').attr('src', imagepath);
  }
  createEmployee(event: any) {
    try {
      if (!Global.isCreditAvailable('company_user')) {
        this.toastr.error(
          "You don't have sufficient credit value to create an employee"
        );
        return;
      }

      this.employeeDetailsForm.markAllAsTouched();
      setTimeout(function () {
        Global.scrollToQuery('p.error-element');
      }, 100);

      if (this.employeeDetailsForm.valid) {
        event.target.classList.add('btn-loading');

        this.companyuserService
          .createEmployee({
            emp_hod: this.employeeDetailsForm?.value?.emp_hod?.id ?? '',
            gross_salary: this.employeeDetailsForm?.value?.gross_salary ?? '',
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
            pan_no:
              this.employeeDetailsForm?.value?.pan_no?.toUpperCase() ?? '',
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
          .subscribe(
            (res) => {
              if (res.status == 'success') {
                this.toastr.success('Employee Created Successfully');
                this.cancelEntry();

                if (res.user_data?._id) {
                  this.router.navigate([
                    '/company/employees/' + res.user_data._id + '/edit/details',
                  ]);
                } else {
                  this.router.navigate(['/company/employees']);
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
    } catch (err) {
      event.target.classList.remove('btn-loading');
    }
  }

  updateEmployee(event: any) {
    this.employeeDetailsForm.markAllAsTouched();
    setTimeout(function () {
      Global.scrollToQuery('p.error-element');
    }, 100);

    if (this.employeeDetailsForm.valid) {
      event.target.classList.add('btn-loading');

      this.companyuserService
        .updateEmployee({
          emp_hod: this.employeeDetailsForm?.value?.emp_hod?.id ?? '',
          // "gross_salary": this.employeeDetailsForm?.value?.gross_salary ?? "",
          emp_first_name: this.employeeDetailsForm?.value?.emp_first_name ?? '',
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
          pan_no: this.employeeDetailsForm?.value?.pan_no.toUpperCase() ?? '',
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
          employee_id: this.employee_id,
          profile_image:
            this.employeeDetailsForm?.value?.profile_image_file ?? '',
        })
        .subscribe(
          (res) => {
            if (res.status == 'success') {
              this.toastr.success(res.message);
              this.cancelEntry();
              this.fetchEmployeeDetails();
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
      if (file == 'emp_aadhaar_image') {
        this.aadhaar_image_size = event.target.files[0].size;
      }
      if (file == 'emp_passport_image') {
        this.passport_image_size = event.target.files[0].size;
      }
      if (file == 'emp_pan_image') {
        this.pan_image_size = event.target.files[0].size;
      }
      if (file == 'additional_id_image') {
        this.additional_image_size = event.target.files[0].size;
      }
      if (file == 'profile_image') {
        this.profile_image_size = event.target.files[0].size;
      }
      let net_img_size =
        (this.aadhaar_image_size +
          this.pan_image_size +
          this.passport_image_size +
          this.additional_image_size +
          this.profile_image_size) /
        1024;

      if (isNaN(net_img_size)) {
        net_img_size = 0;
      }
      let max_upload_file_size =
        this.max_upload_limit - (this.net_uploaded_size + net_img_size);
      if (max_upload_file_size < 0) {
        max_upload_file_size = 0;
      }
      this.employeeDetailsForm
        ?.get([file])
        ?.setValidators([
          fileSizeValidator(
            event.target.files[0],
            Global.maxFileSize(max_upload_file_size)
          ),
        ]);
      this.employeeDetailsForm?.get([file])?.updateValueAndValidity();
      formGroup.patchValue({
        [target]: event.target.files[0],
      });
    }
  }

  cancelEntry() {
    Global.resetForm(this.employeeDetailsForm);
  }

  fetchCompanyDetails() {
    return new Promise((resolve, reject) => {
      this.spinner.show();
      this.companyuserService.getCompanyDetails().subscribe(
        (res: any) => {
          if (res.status == 'success') {
            this.max_upload_limit =
              +res?.company_det?.package[0]?.employee_vault;
            // this.net_uploaded_size = +res?.company_det?.total_file_size;
            if (isNaN(this.max_upload_limit)) {
              this.max_upload_limit = 0;
            }
            // if (isNaN(this.net_uploaded_size)) {
            //   this.net_uploaded_size = 0;
            // }
            // if (this.net_uploaded_size >= this.max_upload_limit) {
            //   this.employeeDetailsForm.controls[
            //     'additional_id_image'
            //   ].disable();
            //   this.employeeDetailsForm.controls['emp_aadhaar_image'].disable();
            //   this.employeeDetailsForm.controls['emp_pan_image'].disable();
            //   this.employeeDetailsForm.controls['emp_passport_image'].disable();
            //   this.employeeDetailsForm.controls['profile_image'].disable();
            // }

            resolve(true);
          } else {
            this.toastr.error(res.message);
            resolve(false);
          }

          this.spinner.hide();
        },
        (err) => {
          this.spinner.hide();
          this.toastr.error(Global.showServerErrorMessage(err));
          resolve(false);
        }
      );
    });
  }

  fetchEmployeeDetails() {
    return new Promise((resolve, reject) => {
      this.spinner.show();
      this.companyuserService
        .getEmployeeDetails({ employee_id: this.employee_id })
        .subscribe(
          (res: any) => {
            if (res.status == 'success') {
              this.employee_details = res.employee_det;

              if (this.operation == 'view') {
                this.employeeDetailsForm.patchValue({
                  emp_hod:
                    this.hodMaster.find((obj: any) => {
                      return (
                        obj.id ===
                          this.employee_details.emp_det?.employment_hr_details
                            ?.hod || null
                      );
                    }) ?? 'N/A',
                  gross_salary:
                    this.employee_details?.emp_det?.employment_hr_details
                      ?.gross_salary ?? 'N/A',
                  emp_first_name:
                    this.employee_details?.emp_first_name ?? 'N/A',
                  emp_last_name: this.employee_details?.emp_last_name ?? 'N/A',
                  emp_father_name:
                    this.employee_details?.emp_father_name ?? 'N/A',
                  email_id: this.employee_details?.email_id ?? 'N/A',
                  mobile_no: this.employee_details?.mobile_no ?? 'N/A',
                  alternate_mob_no:
                    this.employee_details?.alternate_mob_no ?? 'N/A',
                  emp_dob: this.employee_details?.emp_dob
                    ? moment(this.employee_details?.emp_dob).format(
                        'YYYY-MM-DD'
                      )
                    : 'N/A',
                  sex:
                    this.sexMaster.find((obj: any) => {
                      return obj.value === this.employee_details.sex;
                    }) ?? 'N/A',
                  aadhar_no: this.employee_details?.aadhar_no ?? 'N/A',
                  pan_no: this.employee_details?.pan_no ?? 'N/A',
                  passport_no: this.employee_details?.passport_no ?? 'N/A',
                  passport_val_form:
                    this.employee_details?.passport_val_form ?? 'N/A',
                  passport_val_to:
                    this.employee_details?.passport_val_to ?? 'N/A',
                  nationality: this.employee_details?.nationality ?? 'N/A',
                  blood_group:
                    this.bloodGroupMaster.find((obj: any) => {
                      return obj.value === this.employee_details.blood_group;
                    }) ?? 'N/A',
                  physical_disability:
                    this.yesNoMaster.find((obj: any) => {
                      return (
                        obj.value === this.employee_details.physical_disability
                      );
                    }) ?? 'N/A',
                  marital_status:
                    this.maritalStatusMaster.find((obj: any) => {
                      return obj.value === this.employee_details.marital_status;
                    }) ?? 'N/A',
                  marriage_date: this.employee_details?.marriage_date
                  ? moment(this.employee_details?.marriage_date).format(
                      'YYYY-MM-DD'
                    )
                  : 'N/A',
                  emergency_contact_no:
                    this.employee_details?.emergency_contact_no ?? 'N/A',
                  emergency_contact_name:
                    this.employee_details?.emergency_contact_name ?? 'N/A',
                  domicile: this.employee_details?.domicile ?? 'N/A',
                  height: this.employee_details?.height ?? 'N/A',
                  religion:
                    this.religionMaster.find((obj: any) => {
                      return obj.value === this.employee_details.religion;
                    }) ?? 'N/A',
                });
              } else {
                this.employeeDetailsForm.patchValue({
                  emp_hod:
                    this.hodMaster.find((obj: any) => {
                      return (
                        obj.id ===
                          this.employee_details.emp_det?.employment_hr_details
                            ?.hod || null
                      );
                    }) ?? null,
                  gross_salary:
                    this.employee_details?.emp_det?.employment_hr_details
                      ?.gross_salary ?? null,
                  emp_first_name: this.employee_details?.emp_first_name ?? null,
                  emp_last_name: this.employee_details?.emp_last_name ?? null,
                  emp_father_name:
                    this.employee_details?.emp_father_name ?? null,
                  email_id: this.employee_details?.email_id ?? null,
                  mobile_no: this.employee_details?.mobile_no ?? null,
                  alternate_mob_no:
                    this.employee_details?.alternate_mob_no ?? null,
                  emp_dob: this.employee_details?.emp_dob
                    ? this.datePipe.transform(
                        this.employee_details.emp_dob,
                        'YYYY-MM-dd'
                      )
                    : null,
                  sex:
                    this.sexMaster.find((obj: any) => {
                      return obj.value === this.employee_details.sex;
                    }) ?? null,
                  aadhar_no: this.employee_details?.aadhar_no ?? null,
                  pan_no: this.employee_details?.pan_no ?? null,
                  passport_no: this.employee_details?.passport_no ?? null,
                  passport_val_form:
                    this.employee_details?.passport_val_form ?? null,
                  passport_val_to:
                    this.employee_details?.passport_val_to ?? null,
                  nationality: this.employee_details?.nationality ?? null,
                  blood_group:
                    this.bloodGroupMaster.find((obj: any) => {
                      return obj.value === this.employee_details.blood_group;
                    }) ?? null,
                  physical_disability:
                    this.yesNoMaster.find((obj: any) => {
                      return (
                        obj.value === this.employee_details.physical_disability
                      );
                    }) ?? null,
                  marital_status:
                    this.maritalStatusMaster.find((obj: any) => {
                      return obj.value === this.employee_details.marital_status;
                    }) ?? null,
                  marriage_date: this.employee_details?.marriage_date
                  ? this.datePipe.transform(
                      this.employee_details.marriage_date,
                      'YYYY-MM-dd'
                    )
                  : null,
                  emergency_contact_no:
                    this.employee_details?.emergency_contact_no ?? null,
                  emergency_contact_name:
                    this.employee_details?.emergency_contact_name ?? null,
                  domicile: this.employee_details?.domicile ?? null,
                  height: this.employee_details?.height ?? null,
                  religion:
                    this.religionMaster.find((obj: any) => {
                      return obj.value === this.employee_details.religion;
                    }) ?? 'N/A',
                });
              }

              this.net_uploaded_size = +res?.employee_det?.total_file_size;
              if (isNaN(this.net_uploaded_size)) {
                this.net_uploaded_size = 0;
              }
            if (this.net_uploaded_size >= this.max_upload_limit) {
              
              this.employeeDetailsForm.controls[
                'additional_id_image'
              ].disable();
              this.employeeDetailsForm.controls['emp_aadhaar_image'].disable();
              this.employeeDetailsForm.controls['emp_pan_image'].disable();
              this.employeeDetailsForm.controls['emp_passport_image'].disable();
              this.employeeDetailsForm.controls['profile_image'].disable();
            }

              resolve(true);
            } else {
              this.toastr.error(res.message);
              resolve(false);
            }

            this.spinner.hide();
          },
          (err) => {
            this.spinner.hide();
            this.toastr.error(Global.showServerErrorMessage(err));
            resolve(false);
          }
        );
    });
  }

  getEmployeeMaster() {
    return new Promise((resolve, reject) => {
      this.spinner.show();
      this.companyuserService.getEmployeeMaster().subscribe(
        (res: any) => {
          if (res.status == 'success') {
            this.hodMaster = [];
            if (res.masters.hod && Array.isArray(res.masters.hod)) {
              res.masters.hod.forEach((element: any) => {
                this.hodMaster.push({
                  id: element._id,
                  description: `${element.first_name} ${element.last_name}`,
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
    });
  }

  CheckIsFormValid() {
    if (
      this.employeeDetailsForm.get('emp_hod')?.valid &&
      this.employeeDetailsForm.get('gross_salary')?.valid &&
      this.employeeDetailsForm.get('emp_first_name')?.valid &&
      this.employeeDetailsForm.get('emp_last_name')?.valid &&
      this.employeeDetailsForm.get('mobile_no')?.valid &&
      this.employeeDetailsForm.get('emp_dob')?.valid &&
      this.employeeDetailsForm.get('sex')?.valid
    ) {
      return true;
    } else {
      return false;
    }
  }
}
