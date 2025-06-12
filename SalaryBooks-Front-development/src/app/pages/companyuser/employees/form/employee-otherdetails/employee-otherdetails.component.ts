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
  selector: 'companyuser-app-employee-otherdetails',
  templateUrl: './employee-otherdetails.component.html',
  styleUrls: ['./employee-otherdetails.component.css']
})

export class CMPEmployeeOtherdetailsFormComponent implements OnInit {
  Global = Global;
  operation: any;
  employee_id: any;
  employee_details: any;

  employeeOTherDetailsForm: UntypedFormGroup;

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
    this.employeeOTherDetailsForm = formBuilder.group({
      date: [null, Validators.compose([Validators.required])],
      description: [null, Validators.compose([Validators.required])],
      comments: [null, Validators.compose([])],


      emp_other_det_file_image: [null, Validators.compose([])],
      emp_other_det_file_image_file: [null, Validators.compose([])],
    });
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

  updateEmployeeOtherDetails(event: any) {
    this.employeeOTherDetailsForm.markAllAsTouched();
    setTimeout(function () {
      let $_errFormControl = document.querySelectorAll("p.error-element");
      if ($_errFormControl.length > 0) {
        const firstErr: Element = $_errFormControl[0];
        firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100)

    if (this.employeeOTherDetailsForm.valid) {
      event.target.classList.add('btn-loading');

      this.companyuserService.updateEmployeeOtherDetails({
        'date': this.employeeOTherDetailsForm.value.date ?? "",
        'description': this.employeeOTherDetailsForm.value.description ?? "",
        'comments': this.employeeOTherDetailsForm.value.comments ?? "",
        'emp_other_det_file_image': this.employeeOTherDetailsForm.value.emp_other_det_file_image_file ?? "",
        'employee_id': this.employee_id
      }).subscribe(res => {
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

          if (this.operation == 'view') {
            this.employeeOTherDetailsForm.patchValue({
              'date': this.employee_details.emp_det?.employment_other_details?.date ?? 'N/A',
              'description': this.employee_details.emp_det?.employment_other_details?.description ?? 'N/A',
              'comments': this.employee_details.emp_det?.employment_other_details?.comments ?? 'N/A',
            })
          } else {
            this.employeeOTherDetailsForm.patchValue({
              'date': this.employee_details.emp_det?.employment_other_details?.date ?? null,
              'description': this.employee_details.emp_det?.employment_other_details?.description ?? null,
              'comments': this.employee_details.emp_det?.employment_other_details?.comments ?? null,
            })
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

  cancelEntry() {
    this.employeeOTherDetailsForm.reset();

    for (const key in this.employeeOTherDetailsForm.controls) {
      if (Object.prototype.hasOwnProperty.call(this.employeeOTherDetailsForm.controls, key)) {
        const element = this.employeeOTherDetailsForm.controls[key];

        element.markAsUntouched();
        element.markAsPristine();
      }
    }
  }
}

