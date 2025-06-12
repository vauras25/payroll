import { Component, OnInit } from '@angular/core';
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

@Component({
  selector: 'companyuser-app-employee-form-address',
  templateUrl: './employee-address.component.html',
  styleUrls: ['./employee-address.component.css'],
})
export class CMPEmployeeAddressFormComponent implements OnInit {
  Global = Global;
  operation: any;
  employee_id: any;
  employee_details: any;
  employeeAddressForm: UntypedFormGroup;
  addressProofMaster: any[];

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

    this.addressProofMaster = [
      { value: 'pan', description: 'Pancard' },
      { value: 'aadhaar', description: 'Aadhaar Card' },
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
  }

  ngOnInit(): void {
    this.titleService.setTitle('Employees - ' + Global.AppName);

    this.activatedRoute.params.subscribe(
      (params) => (this.employee_id = params['employee_id'] ?? null)
    );

    if (!this.employee_id) {
      this.operation = 'add';
      $('#current-address-fields').hide(500);
    } else {
      let r = this.router.url.split('/');
      if (r[4] == 'view') {
        this.operation = 'view';
        $('input').attr('disabled', 'true');
      } else if (r[4] == 'edit') {
        this.operation = 'edit';
      }

      console.log(this.operation);
      

      this.fetchEmployeeDetails();
    }

    if (
      !this.AppComponent.checkCompanyModulePermission({
        company_module: 'employee',
        company_operation: 'listing_add_approve',
        company_sub_module: 'employee_master_data',
        company_sub_operation: [this.operation],
        company_strict: true,
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

    this.fetchStates();
  }

  updateEmployeeAddress(event: any) {

    this.employeeAddressForm.markAllAsTouched();
    setTimeout(function () {
      Global.scrollToQuery('p.error-element');
    }, 100);

    if (this.employeeAddressForm.valid) {
      event.target.classList.add('btn-loading');

      this.companyuserService
        .updateEmployeeAddress({
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
          employee_id: this.employee_id,
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
      const file = event.target.files[0];
      formGroup.patchValue({
        [target]: file,
      });
    }
  }

  fetchEmployeeDetails() {
    this.spinner.show();
    this.companyuserService
      .getEmployeeDetails({ employee_id: this.employee_id })
      .subscribe(
        (res: any) => {
          if (res.status == 'success') {
            this.employee_details = res.employee_det;

            if (this.operation == 'view') {
              this.employeeAddressForm.patchValue({
                resident_no:
                  this.employee_details?.emp_det?.emp_address?.resident_no ??
                  'N/A',
                residential_name:
                  this.employee_details?.emp_det?.emp_address
                    ?.residential_name ?? 'N/A',
                road:
                  this.employee_details?.emp_det?.emp_address?.road ?? 'N/A',
                locality:
                  this.employee_details?.emp_det?.emp_address?.locality ??
                  'N/A',
                city:
                  this.employee_details?.emp_det?.emp_address?.city ?? 'N/A',
                district:
                  this.employee_details?.emp_det?.emp_address?.district ??
                  'N/A',
                state:
                  this.employee_details?.emp_det?.emp_address?.state ?? 'N/A',
                pincode:
                  this.employee_details?.emp_det?.emp_address?.pincode ?? 'N/A',
                country:
                  this.employee_details?.emp_det?.emp_address?.country ?? 'N/A',
                diff_current_add:
                  this.employee_details.emp_det?.emp_address
                    ?.diff_current_add ?? null,
                curr_resident_no:
                  this.employee_details?.emp_det?.emp_curr_address
                    ?.resident_no ?? 'N/A',
                curr_residential_name:
                  this.employee_details?.emp_det?.emp_curr_address
                    ?.residential_name ?? 'N/A',
                curr_road:
                  this.employee_details?.emp_det?.emp_curr_address?.road ??
                  'N/A',
                curr_locality:
                  this.employee_details?.emp_det?.emp_curr_address?.locality ??
                  'N/A',
                curr_city:
                  this.employee_details?.emp_det?.emp_curr_address?.city ??
                  'N/A',
                curr_district:
                  this.employee_details?.emp_det?.emp_curr_address?.district ??
                  'N/A',
                curr_state:
                  this.employee_details?.emp_det?.emp_curr_address?.state ??
                  'N/A',
                curr_pincode:
                  this.employee_details?.emp_det?.emp_curr_address?.pincode ??
                  'N/A',
                curr_country:
                  this.employee_details?.emp_det?.emp_curr_address?.country ??
                  'N/A',
              });
            } else {
              this.employeeAddressForm.patchValue({
                resident_no:
                  this.employee_details?.emp_det?.emp_address?.resident_no ??
                  null,
                residential_name:
                  this.employee_details?.emp_det?.emp_address
                    ?.residential_name ?? null,
                road: this.employee_details?.emp_det?.emp_address?.road ?? null,
                locality:
                  this.employee_details?.emp_det?.emp_address?.locality ?? null,
                city: this.employee_details?.emp_det?.emp_address?.city ?? null,
                district:
                  this.employee_details?.emp_det?.emp_address?.district ?? null,
                state:
                  this.employee_details?.emp_det?.emp_address?.state ?? null,
                pincode:
                  this.employee_details?.emp_det?.emp_address?.pincode ?? null,
                country:
                  this.employee_details?.emp_det?.emp_address?.country ?? null,
              });

              if (
                this.employee_details.emp_det?.emp_address.diff_current_add ==
                'yes'
              ) {
                this.employeeAddressForm.patchValue({
                  diff_current_add: 'yes',
                  curr_resident_no:
                    this.employee_details?.emp_det?.emp_curr_address
                      ?.resident_no ?? null,
                  curr_residential_name:
                    this.employee_details?.emp_det?.emp_curr_address
                      ?.residential_name ?? null,
                  curr_road:
                    this.employee_details?.emp_det?.emp_curr_address?.road ??
                    null,
                  curr_locality:
                    this.employee_details?.emp_det?.emp_curr_address
                      ?.locality ?? null,
                  curr_city:
                    this.employee_details?.emp_det?.emp_curr_address?.city ??
                    null,
                  curr_district:
                    this.employee_details?.emp_det?.emp_curr_address
                      ?.district ?? null,
                  curr_state:
                    this.employee_details?.emp_det?.emp_curr_address?.state ??
                    null,
                  curr_pincode:
                    this.employee_details?.emp_det?.emp_curr_address?.pincode ??
                    null,
                  curr_country:
                    this.employee_details?.emp_det?.emp_curr_address?.country ??
                    null,
                });
              } else {
                this.employeeAddressForm.patchValue({
                  diff_current_add: 'no',
                  curr_resident_no: null,
                  curr_residential_name: null,
                  curr_road: null,
                  curr_locality: null,
                  curr_city: null,
                  curr_district: null,
                  curr_state: null,
                  curr_pincode: null,
                  curr_country: null,
                });
              }
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

  cancelEntry() {
    this.employeeAddressForm.reset();
    Global.resetForm(this.employeeAddressForm);
  }

  stateMaster: any[];

  fetchStates() {
    this.spinner.show();

    this.companyuserService.fetchStates().subscribe(
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
}
