import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
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
import { CommonService } from 'src/app/services/common.service';
@Component({
  selector: 'app-address',
  templateUrl: './address.component.html',
})
export class AddressComponent implements OnInit {
  Global = Global;
  operation: any;
  employee_id: any;
  employeeAddressForm: UntypedFormGroup;
  addressProofMaster: any[];
  @Input() isReadOnly:boolean;
  @Output() submitAddress = new EventEmitter<any>();
  @Input() employee_details:any

  constructor(
    public formBuilder: UntypedFormBuilder,
    private titleService: Title,
    private toastr: ToastrService,
    private router: Router,
    private companyuserService: CompanyuserService,
    private spinner: NgxSpinnerService,
    private activatedRoute: ActivatedRoute,
    private datePipe: DatePipe,
    public AppComponent: AppComponent,
    public commonService: CommonService
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
          // this.employeeAddressForm.controls['curr_resident_no'].setValidators([Validators.required]);
          // this.employeeAddressForm.controls['curr_residential_name'].setValidators([Validators.required]);
          // this.employeeAddressForm.controls['curr_road'].setValidators([Validators.required]);
          // this.employeeAddressForm.controls['curr_locality'].setValidators([Validators.required]);
          // this.employeeAddressForm.controls['curr_city'].setValidators([Validators.required]);
          // this.employeeAddressForm.controls['curr_district'].setValidators([Validators.required]);
          // this.employeeAddressForm.controls['curr_state'].setValidators([Validators.required]);
          // this.employeeAddressForm.controls['curr_pincode'].setValidators([Validators.required, Validators.pattern("^[0-9]*$"), Validators.minLength(6), Validators.maxLength(6)]);
          // this.employeeAddressForm.controls['curr_country'].setValidators([Validators.required]);

          $('#current-address-fields').show(500);
        } else {
          // this.employeeAddressForm.controls['curr_resident_no'].clearValidators();
          // this.employeeAddressForm.controls['curr_residential_name'].clearValidators();
          // this.employeeAddressForm.controls['curr_road'].clearValidators();
          // this.employeeAddressForm.controls['curr_locality'].clearValidators();
          // this.employeeAddressForm.controls['curr_city'].clearValidators();
          // this.employeeAddressForm.controls['curr_district'].clearValidators();
          // this.employeeAddressForm.controls['curr_state'].clearValidators();
          // this.employeeAddressForm.controls['curr_pincode'].clearValidators();
          // this.employeeAddressForm.controls['curr_country'].clearValidators();

          $('#current-address-fields').hide(500);
        }

        // this.employeeAddressForm.controls['curr_resident_no']?.updateValueAndValidity();
        // this.employeeAddressForm.controls['curr_residential_name']?.updateValueAndValidity();
        // this.employeeAddressForm.controls['curr_road']?.updateValueAndValidity();
        // this.employeeAddressForm.controls['curr_locality']?.updateValueAndValidity();
        // this.employeeAddressForm.controls['curr_city']?.updateValueAndValidity();
        // this.employeeAddressForm.controls['curr_district']?.updateValueAndValidity();
        // this.employeeAddressForm.controls['curr_state']?.updateValueAndValidity();
        // this.employeeAddressForm.controls['curr_pincode']?.updateValueAndValidity();
        // this.employeeAddressForm.controls['curr_country']?.updateValueAndValidity();
      });
  }
  ngOnChanges() {
    this.fetchEmployeeDetails();

  }
  ngOnInit(): void {
    this.titleService.setTitle('Employees - ' + Global.AppName);

    this.activatedRoute.params.subscribe(
      (params) => (this.employee_id = params['employee_id'] ?? null)
    );

    this.fetchEmployeeDetails();


    this.fetchStates();
  }

  updateEmployeeAddress(event: any) {

    this.employeeAddressForm.markAllAsTouched();
    setTimeout(function () {
      Global.scrollToQuery('p.error-element');
    }, 100);

    if (this.employeeAddressForm.valid) {
      this.spinner.show();

      this.commonService.postDataRaw("employee/update-employee-address",{
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
            this.spinner.hide();

            if (res.status == 'success') {
              this.toastr.success(res.message);
              this.cancelEntry();
              this.submitAddress.emit(true);
            } else if (res.status == 'val_err') {
              this.toastr.error(Global.showValidationMessage(res.val_msg));
            } else {
              this.toastr.error(res.message);
            }

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
    this.employeeAddressForm.patchValue({
      resident_no:
        this.employee_details?.emp_address?.resident_no ??
        null,
      residential_name:
        this.employee_details?.emp_address
          ?.residential_name ?? null,
      road: this.employee_details?.emp_address?.road ?? null,
      locality:
        this.employee_details?.emp_address?.locality ?? null,
      city: this.employee_details?.emp_address?.city ?? null,
      district:
        this.employee_details?.emp_address?.district ?? null,
      state:
        this.employee_details?.emp_address?.state ?? null,
      pincode:
        this.employee_details?.emp_address?.pincode ?? null,
      country:
        this.employee_details?.emp_address?.country ?? null,
    });

    if (
      this.employee_details?.emp_address?.diff_current_add ==
      'yes'
    ) {
      this.employeeAddressForm.patchValue({
        diff_current_add: 'yes',
        curr_resident_no:
          this.employee_details?.emp_curr_address
            ?.resident_no ?? null,
        curr_residential_name:
          this.employee_details?.emp_curr_address
            ?.residential_name ?? null,
        curr_road:
          this.employee_details?.emp_curr_address?.road ??
          null,
        curr_locality:
          this.employee_details?.emp_curr_address
            ?.locality ?? null,
        curr_city:
          this.employee_details?.emp_curr_address?.city ??
          null,
        curr_district:
          this.employee_details?.emp_curr_address
            ?.district ?? null,
        curr_state:
          this.employee_details?.emp_curr_address?.state ??
          null,
        curr_pincode:
          this.employee_details?.emp_curr_address?.pincode ??
          null,
        curr_country:
          this.employee_details?.emp_curr_address?.country ??
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

  cancelEntry() {
    this.employeeAddressForm.reset();
    Global.resetForm(this.employeeAddressForm);
  }

  stateMaster: any[];

  fetchStates() {
    this.spinner.show();

    this.commonService.postDataRaw("employee/get_state_list",{countrycode:"IN"}).subscribe(
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
  checkpermanentadd(ev:any)
  {
    if(ev.target.checked)
    {
      this.employeeAddressForm.patchValue({diff_current_add:'yes'});
    }
    else{
      this.employeeAddressForm.patchValue({diff_current_add:'no'});
    }
  }
}
