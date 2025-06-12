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
  selector: 'companyuser-app-employee-form-assets',
  templateUrl: './employee-assets.component.html',
  styleUrls: ['./employee-assets.component.css'],
})
export class CMPEmployeeAssetsFormComponent implements OnInit {
  Global = Global;
  operation: any;
  employee_id: any;
  asset_id: any;
  employee_details: any;

  employeeAssetForm: UntypedFormGroup;

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
    this.employeeAssetForm = formBuilder.group({
      asset_details: [null, Validators.compose([])],
      asset_no: [null, Validators.compose([])],
      asset_value: [null, Validators.compose([])],
      asset_qty: [null, Validators.compose([])],
      asset_issue_date: [null, Validators.compose([])],
      asset_receive_date: [null, Validators.compose([])],
      asset_receive_by: [null, Validators.compose([])],
    });

    this.asset_id = '';
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

      this.fetchEmployeeDetails();
    }

    if (
      !Global.checkCompanyModulePermission({
        company_module: 'employee',
        company_operation: 'employee_assest',
        company_sub_module: 'asset_management',
        company_sub_operation: ['view'],
      })
    ) {
      setTimeout(() => {
        this.router.navigate(['company/errors/unauthorized-access'], {
          skipLocationChange: true,
        });
      }, 500);
      return;
    }
  }

  updateEmployeeAssetDetails(event: any) {
    this.employeeAssetForm.markAllAsTouched();
    Global.scrollToQuery('p.error-element');

    if (this.employeeAssetForm.valid) {
      event.target.classList.add('btn-loading');

      this.companyuserService
        .updateEmployeeAssetDetails({
          asset_details: this.employeeAssetForm.value.asset_details ?? '',
          asset_no: this.employeeAssetForm.value.asset_no ?? '',
          asset_value: this.employeeAssetForm.value.asset_value ?? '',
          asset_qty: this.employeeAssetForm.value.asset_qty ?? '',
          asset_issue_date: this.employeeAssetForm.value.asset_issue_date ?? '',
          asset_receive_date:
            this.employeeAssetForm.value.asset_receive_date ?? '',
          asset_receive_by: this.employeeAssetForm.value.asset_receive_by ?? '',
          employee_id: this.employee_id,
          asset_id: this.asset_id,
        })
        .subscribe(
          (res) => {
            if (res.status == 'success') {
              this.toastr.success(res.message);
              this.fetchEmployeeDetails();

              if (!this.asset_id) {
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

  fetchEmployeeDetails() {
    this.spinner.show();
    this.companyuserService
      .getEmployeeDetails({ employee_id: this.employee_id })
      .subscribe(
        (res: any) => {
          if (res.status == 'success') {
            this.employee_details = res.employee_det;
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
    this.asset_id = '';
    Global.resetForm(this.employeeAssetForm);
  }

  getEdit(item: any) {
    this.asset_id = item._id;
    this.employeeAssetForm.patchValue({
      asset_details: item.asset_details,
      asset_no: item.asset_no,
      asset_value: item.asset_value,
      asset_qty: item.asset_qty,
      asset_issue_date: item.asset_issue_date,
      asset_receive_date: item.asset_receive_date,
      asset_receive_by: item.asset_receive_by,
    });

    Global.scrollToQuery('#Asset-submit-section');
  }
}
