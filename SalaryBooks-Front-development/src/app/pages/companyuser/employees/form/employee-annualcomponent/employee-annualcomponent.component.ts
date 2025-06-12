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
import { Subject } from 'rxjs';

@Component({
  selector: 'app-employee-annualcomponent',
  templateUrl: './employee-annualcomponent.component.html',
  styleUrls: ['./employee-annualcomponent.component.css'],
})
export class CMPEmployeeAnnualcomponentFormComponent implements OnInit {
  Global = Global;
  operation: any;
  employee_id: any;
  annual_earnings_id: any;
  employee_details: any;
  categoryMaster: any[];
  earningHeadsMaster: any[] = [];
  earningHeadSelectMaster: any[] = [];
  earningStatusMaster: any[] = [];

  employeeAnnualComponentForm: UntypedFormGroup;

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
    this.employeeAnnualComponentForm = formBuilder.group({
      earning_head: [null, Validators.compose([])],
      earning_head_id: [null, Validators.compose([Validators.required])],
      earning_category: [null, Validators.compose([Validators.required])],
      earning_amount: [null, Validators.compose([Validators.required])],
    });

    this.categoryMaster = [
      { value: 'Provision', description: 'Provision' },
      { value: 'Earning', description: 'Earning' },
      { value: 'Reimbursement', description: 'Reimbursement' },
    ];

    this.earningStatusMaster = [
      { value: 'earning', description: 'Earning' },
      { value: 'provision', description: 'Provision' },
      { value: 'reimbursement', description: 'Reimbursement' },
    ];

    this.annual_earnings_id = '';

    this.employeeAnnualComponentForm
      .get('earning_category')
      ?.valueChanges.subscribe((val) => {
        this.earningHeadSelectMaster = [];
        this.employeeAnnualComponentForm.patchValue({
          earning_head_id: null,
        });

        if (val.value) {
          this.earningHeadSelectMaster = this.earningHeadsMaster.filter(
            (obj: any) => {
              return obj.status == val.value.toLowerCase();
            }
          );
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

      this.fetchEmployeeDetails();
    }

    if (
      !Global.checkCompanyModulePermission({
        company_module: 'employee',
        company_sub_module: 'annual_component',
        company_sub_operation: ['view'],
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

    this.fetchEarningHeads();
  }

  updateEmployeeAnnualCompDetails(event: any) {
    this.employeeAnnualComponentForm.markAllAsTouched();
    setTimeout(function () {
      let $_errFormControl = document.querySelectorAll('p.error-element');
      if ($_errFormControl.length > 0) {
        const firstErr: Element = $_errFormControl[0];
        firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);

    if (this.employeeAnnualComponentForm.valid) {
      event.target.classList.add('btn-loading');

      this.companyuserService
        .updateEmployeeAnnualCompDetails({
          earning_head:
            this.employeeAnnualComponentForm.value.earning_head ?? '',
          earning_head_id:
            this.employeeAnnualComponentForm.value.earning_head_id?._id ?? '',
          earning_category:
            this.employeeAnnualComponentForm.value.earning_category?.value ??
            '',
          earning_amount:
            this.employeeAnnualComponentForm.value.earning_amount ?? '',
          employee_id: this.employee_id,
          annual_earnings_id: this.annual_earnings_id,
        })
        .subscribe(
          (res) => {
            if (res.status == 'success') {
              this.toastr.success(res.message);
              this.fetchEmployeeDetails();

              if (!this.annual_earnings_id) {
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
    Global.resetForm(this.employeeAnnualComponentForm);
    this.annual_earnings_id = '';
  }

  getEdit(item: any) {
    this.cancelEntry();

    this.annual_earnings_id = item._id;
    this.employeeAnnualComponentForm.patchValue({
      earning_category: this.categoryMaster.find((obj: any) => {
        return obj.value == item.earning_category;
      }),
      earning_amount: item.earning_amount,
    });

    this.employeeAnnualComponentForm.patchValue({
      earning_head_id: this.earningHeadSelectMaster.find((obj: any) => {
        return obj._id == item.earning_head_id;
      }),
    });

    Global.scrollToQuery('#annualcomponent-submit-section');
  }

  /**
   * For Extra Deduction Head Master
   * -------------------------------
   * -------------------------------
   */

  extraDeductionHeadMasterEventSubject: Subject<void> = new Subject<void>();
  initEarningHeadEntry() {
    this.extraDeductionHeadMasterEventSubject.next();
  }

  fetchEarningHeads() {
    return new Promise((resolve, reject) => {
      this.spinner.show();
      this.companyuserService.getExtraEarningHeads({}).subscribe(
        (res: any) => {
          if (res.status == 'success') {
            this.earningHeadsMaster = [];
            res?.temp_head.forEach((element: any) => {
              if (
                ['earning', 'provision', 'reimbursement'].includes(
                  element.earning_status
                )
              ) {
                this.earningHeadsMaster.push({
                  _id: element._id,
                  head_name: element.head_name,
                  status: element.earning_status,
                });
              }
            });
          } else {
            this.toastr.error(res.message);
          }

          this.spinner.hide();
          resolve(true);
        },
        (err) => {
          this.spinner.hide();
          this.toastr.error(Global.showServerErrorMessage(err));
          resolve(true);
        }
      );
    });
  }

  getHeadDetails(head_id: any) {
    return (
      this.earningHeadsMaster.find((obj: any) => {
        return obj._id == head_id;
      }) ?? null
    );
  }
}
