import { Component, OnInit } from '@angular/core';
import { AbstractControl, UntypedFormBuilder, FormControl, UntypedFormGroup, Validators } from '@angular/forms';
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
  selector: 'companyuser-app-employee-form-family',
  templateUrl: './employee-family.component.html',
  styleUrls: ['./employee-family.component.css']
})

export class CMPEmployeeFamilyFormComponent implements OnInit {
  Global = Global;
  operation: any;
  employee_id: any;
  member_id: any;
  employee_details: any;

  employeeFamilyForm: UntypedFormGroup;

  constructor(
    public formBuilder: UntypedFormBuilder,
    private titleService: Title,
    private toastr: ToastrService,
    private router: Router,
    private companyuserService: CompanyuserService,
    private spinner: NgxSpinnerService,
    private activatedRoute: ActivatedRoute,
    private datePipe: DatePipe,
    private AppComponent: AppComponent
  ) {
    this.employeeFamilyForm = formBuilder.group({
      dob: [null, Validators.compose([Validators.required])],
      name: [null, Validators.compose([Validators.required])],
      relation: [null, Validators.compose([Validators.required])],
      dependent: [null, Validators.compose([Validators.required])],
      nominee: [null, Validators.compose([Validators.required])],
      aadhaar_no: [null, Validators.compose([Validators.required, Validators.pattern("^[0-9]*$"), Validators.minLength(12), Validators.maxLength(12)])],

      family_mem_aadhar_image: [null, Validators.compose([Validators.required])],
      family_mem_aadhar_image_file: [null, Validators.compose([])],
    });

    this.member_id = "";
  }

  ngOnInit(): void {
    this.titleService.setTitle("Employees - " + Global.AppName);

    this.activatedRoute.params.subscribe(
      params => this.employee_id = params['employee_id'] ?? null
    )

    if (!this.employee_id) {
      this.operation = 'add';
      $('#current-address-fields').hide(500);
    } else {
      let r = this.router.url.split('/')
      if (r[4] == 'view') {
        this.operation = 'view';
        $('input').attr('disabled', 'true')
      } else if (r[4] == 'edit') {
        this.operation = 'edit';
      }

      this.fetchEmployeeDetails();
    }

    if (!this.AppComponent.checkCompanyModulePermission({  company_module: 'employee',
      company_operation: 'listing_add_approve',
      company_sub_module: 'employee_master_data',
      company_sub_operation: [this.operation], 'company_strict': true })) {
      const _this = this;
      setTimeout(function () {
        _this.router.navigate(['company/errors/unauthorized-access'], { skipLocationChange: true })
      }, 500);
      return;
    }
  }

  updateEmployeeFamilyDetails(event: any) {
    this.employeeFamilyForm.markAllAsTouched();
    setTimeout(function () {
      let $_errFormControl = document.querySelectorAll("p.error-element");
      if ($_errFormControl.length > 0) {
        const firstErr: Element = $_errFormControl[0];
        firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100)

    if (this.employeeFamilyForm.valid) {
      event.target.classList.add('btn-loading');

      this.companyuserService.updateEmployeeFamilyDetails({
        'dob': this.employeeFamilyForm.value.dob ?? "",
        'name': this.employeeFamilyForm.value.name ?? "",
        'relation': this.employeeFamilyForm.value.relation ?? "",
        'dependent': this.employeeFamilyForm.value.dependent ?? "",
        'nominee': this.employeeFamilyForm.value.nominee ?? "",
        'aadhaar_no': this.employeeFamilyForm.value.aadhaar_no ?? "",
        'family_mem_aadhar_image': this.employeeFamilyForm.value.family_mem_aadhar_image_file ?? "",
        'employee_id': this.employee_id,
        'member_id': this.member_id,
      }).subscribe(res => {
        if (res.status == 'success') {
          this.toastr.success(res.message);
          this.fetchEmployeeDetails();

          if (!this.member_id) {
            this.cancelEntry();
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

  onFileChanged(event: any, formGroup: UntypedFormGroup, file: any, target: any) {
    if (event.target.files.length > 0) {
      const file = event.target.files[0];
      formGroup.patchValue({
        [target]: file
      });
    }
  }

  fetchEmployeeDetails() {
    this.spinner.show();
    this.companyuserService.getEmployeeDetails({ employee_id: this.employee_id })
      .subscribe((res: any) => {
        if (res.status == 'success') {
          this.employee_details = res.employee_det
        } else {
          this.toastr.error(res.message);
        }

        this.spinner.hide();
      }, (err) => {
        this.spinner.hide();
        this.toastr.error(Global.showServerErrorMessage(err));
      });
  }

  cancelEntry() {
    this.employeeFamilyForm.reset();
    this.member_id = "";

    for (const key in this.employeeFamilyForm.controls) {
      if (Object.prototype.hasOwnProperty.call(this.employeeFamilyForm.controls, key)) {
        const element = this.employeeFamilyForm.controls[key];

        element.markAsUntouched();
        element.markAsPristine();
      }
    }

    this.employeeFamilyForm.controls['family_mem_aadhar_image'].setValidators([Validators.required]);
    this.employeeFamilyForm.controls['family_mem_aadhar_image'].updateValueAndValidity();
  }

  getEdit(item: any) {
    this.member_id = item._id;
    this.employeeFamilyForm.patchValue({
      dob: item.dob,
      name: item.name,
      relation: item.relation,
      dependent: item.dependent,
      nominee: item.nominee,
      aadhaar_no: item.aadhaar_no,
    });

    if (item.family_mem_aadhar_image) {
      this.employeeFamilyForm.controls['family_mem_aadhar_image'].clearValidators();
    } else {
      this.employeeFamilyForm.controls['family_mem_aadhar_image'].setValidators([Validators.required]);
    }
    this.employeeFamilyForm.controls['family_mem_aadhar_image'].updateValueAndValidity();

    $('html, body').animate({
      'scrollTop': $("#family-submit-section").position().top
    });
  }
}

