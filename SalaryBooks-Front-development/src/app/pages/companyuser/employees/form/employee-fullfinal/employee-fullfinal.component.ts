import { DatePipe } from '@angular/common';
import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import {
  FormArray,
  FormGroup,
  UntypedFormArray,
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import * as moment from 'moment';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { AppComponent } from 'src/app/app.component';
import * as Global from 'src/app/globals';
import { CompanyuserService } from 'src/app/services/companyuser.service';

@Component({
  selector: 'companyuser-app-employee-form-fullfinal',
  templateUrl: './employee-fullfinal.component.html',
  styleUrls: ['./employee-fullfinal.component.css'],
})
export class CMPEmployeeFullfinalFormComponent implements OnInit, OnDestroy {
  report_data: any;
  @Input() actionfrom: any = 'normal';
  @Input() actionEmployeeId: any = null;
  isSubmitted: boolean = false;
  Global = Global;
  operation: any = null;
  employee_id: any;
  employee_details: any;
  win_modal: any;

  employeeFullFinalForm: UntypedFormGroup;
  employeeAssetReceiveForm: UntypedFormGroup;
  employeeAssets: any[] = [];

  leavingReasons: any[] = [
    { label: 'Left Service', value: 2 },
    { label: 'Retired', value: 3 },
    { label: 'Out of Coverage', value: 4 },
    { label: 'Expired', value: 5 },
    { label: 'Non Implemented area', value: 6 },
    { label: 'Compliance by Immediate Employer', value: 7 },
    { label: 'Suspension of work', value: 8 },
    { label: 'Strike/Lockout', value: 9 },
    { label: 'Retrenchment', value: 10 },
    { label: 'No Work', value: 11 },
    { label: "Doesn't Belong To This Employer", value: 12 },
    { label: 'Duplicate IP', value: 13 },
  ];

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

    
    this.employeeFullFinalForm = formBuilder.group({
      last_working_date: [null, Validators.compose([])],
      emp_notice_period: ['', Validators.compose([])],
      er_notice_period: ['', Validators.compose([])],
      do_resignation: [null, Validators.compose([])],
      net_pay: [false],
      employee_pf: [false],
      employer_pf: [false],
      employee_esic: [false],
      employer_esic: [false],
      p_tax: [false],
      leave_encashment: [false],
      accumulated_bonus: [false],
      outstanding_incentive: [false],
      tds: [false],
      outstanding_advance: [false],
      gratuity: [false],
      footer_text: [],
      reason_code: [null, Validators.compose([Validators.required])],
      payble_field: this.formBuilder.array([this.initFormRows('payble_field')]),
      is_notice_pay: [true],
      payble_days: [''],
    });

    this.employeeAssetReceiveForm = formBuilder.group({
      asset_id: [null, Validators.compose([Validators.required])],
      asset_details: [null, Validators.compose([])],
      asset_no: [null, Validators.compose([])],
      asset_value: [null, Validators.compose([])],
      asset_qty: [null, Validators.compose([])],
      asset_issue_date: [null, Validators.compose([])],
      asset_receive_date: [null, Validators.compose([Validators.required])],
      asset_receive_by: [null, Validators.compose([Validators.required])],
    });
  }

  tooglenoticePay(ev: any) {
    let is_notice_pay: boolean;
    if (ev.target.checked) {
      is_notice_pay = true;
    } else {
      is_notice_pay = false;
    }
    this.employeeFullFinalForm.patchValue({ is_notice_pay: is_notice_pay });
  }

  async ngOnInit() {

    if (
      !Global.checkCompanyModulePermission({
        company_module: 'employee',
        company_operation: 'fullnfinal',
        company_sub_module: 'full_&_final',
        company_sub_operation: ['view']
      })
    ) {
      // const _this = this;
      // setTimeout(function () {
       this.router.navigate(['/company/errors/unauthorized-access'], {
          skipLocationChange: true,
        });
      // }, 500);
      return;
    }

    if (['exitmodal'].includes(this.actionfrom)) {
      this.operation = 'edit';
      this.employee_id = this.actionEmployeeId;
      this.employeeFullFinalForm.removeValidators(Validators.required);
      await this.fetchEmployeeDetails();
    } else {
      this.titleService.setTitle('Employees - ' + Global.AppName);

      this.activatedRoute.params.subscribe(
        (params) => (this.employee_id = params['employee_id'] ?? null)
      );

      if (!this.employee_id) {
        this.operation = 'add';
      } else {
        if (this.operation == 'modalaction') {
          this.operation = 'edit';
        } else {
          let r = this.router.url.split('/');
          if (r[4] == 'view') {
            this.operation = 'view';
            $('input').attr('disabled', 'true');
            $('textarea').attr('disabled', 'true');
            $(':radio').attr('disabled', 'true');
          } else if (r[4] == 'edit') {
          }

          $('input[type="date"]').attr('type', 'text');
        }

        await this.fetchEmployeeDetails();
      }
    }

    setTimeout(() => {
      this.textTODATE();
    }, 1500);
  }

  ngOnDestroy() {
    this.employee_id = null;
    this.employee_details = null;
    Global?.resetForm(this.employeeFullFinalForm);
    Global?.resetForm(this.employeeAssetReceiveForm);
    this.employeeAssets = [];
  }

  fetchEmployeeDetails() {
    return new Promise((resolve, reject) => {
      this.spinner.show();
      this.companyuserService
        .getEmployeeDetails({
          employee_id: this.employee_id,
        })
        .subscribe(
          (res: any) => {
            this.spinner.hide();
            if (res.status == 'success') {
              //this.cancelEntry();

              this.employee_details = res.employee_det;
              let DEFAULTVAL = null;
              if (this.operation == 'view') DEFAULTVAL = 'N/A';
              // moment(new Date()).format('MM DD YYYY')

              this.employeeFullFinalForm.patchValue({
                last_working_date:
                  this.employee_details?.emp_det?.full_and_final
                    ?.last_working_date ?? DEFAULTVAL,
                emp_notice_period:
                  this.employee_details?.emp_det?.full_and_final
                    ?.emp_notice_period ?? DEFAULTVAL,
                er_notice_period:
                  this.employee_details?.emp_det?.full_and_final
                    ?.er_notice_period ?? DEFAULTVAL,
                do_resignation:
                  moment(
                    this.employee_details?.emp_det?.full_and_final
                      ?.do_resignation
                  ).format('YYYY-MM-DD') ?? DEFAULTVAL,
                net_pay:
                  this.employee_details?.emp_det?.full_and_final?.is_net_pay,
                employee_pf:
                  this.employee_details?.emp_det?.full_and_final
                    ?.is_employee_pf,
                employer_pf:
                  this.employee_details?.emp_det?.full_and_final
                    ?.is_employer_pf,
                employee_esic:
                  this.employee_details?.emp_det?.full_and_final
                    ?.is_employee_esic,
                employer_esic:
                  this.employee_details?.emp_det?.full_and_final
                    ?.is_employer_esic,
                p_tax: this.employee_details?.emp_det?.full_and_final?.is_ptax,
                leave_encashment:
                  this.employee_details?.emp_det?.full_and_final
                    ?.is_leave_encashment,
                outstanding_incentive:
                  this.employee_details?.emp_det?.full_and_final
                    ?.is_outstanding_incentive,
                outstanding_advance:
                  this.employee_details?.emp_det?.full_and_final
                    ?.is_less_outstanding_advance,
                gratuity:
                  this.employee_details?.emp_det?.full_and_final?.is_gratuity,
                footer_text:
                  this.employee_details?.emp_det?.full_and_final?.footer_text,
                is_notice_pay: true,
                payble_days:
                  this.employee_details?.emp_det?.full_and_final?.payble_days,
                accumulated_bonus:
                  this.employee_details?.emp_det?.full_and_final
                    ?.is_accumulated_bonus,
                tds: this.employee_details?.emp_det?.full_and_final
                  ?.is_less_tds,
                reason_code: this.leavingReasons.find(
                  (res) =>
                    res.label ==
                    this.employee_details?.emp_det?.full_and_final?.reason_code
                ),
              });
              if (
                this.employee_details?.emp_det?.full_and_final?.extra_fields
                  ?.lengh > 0
              ) {
                (
                  this.employeeFullFinalForm.controls[
                    'payble_field'
                  ] as FormArray
                ).clear();
              }
              (
                this.employee_details?.emp_det?.full_and_final?.extra_fields ??
                []
              ).forEach((field: any) => {
                this.addFormRows(
                  this.employeeFullFinalForm,
                  'payble_field',
                  field
                );
              });
              let r = this.router.url.split('/');
              if (
                r[4] == 'view' ||
                this.employee_details?.emp_det?.full_and_final?.is_final_settlement
              ) {
                $('input').attr('disabled', 'true');
                $('textarea').attr('disabled', 'true');
                $(':radio').attr('disabled', 'true');
              }
              this.employeeAssets =
                this.employee_details?.emp_det?.assets ?? [];
              if (
                this.employee_details?.emp_det?.full_and_final?.is_final_settlement
              ) {
                if (
                  this.employee_details.emp_det.full_and_final?.do_resignation
                ) {
                  Object.keys(this.employeeFullFinalForm.value).forEach(
                    (key) => {
                      this.employeeFullFinalForm.get(key)?.disable();
                    }
                  );
                }
              }

              resolve(true);
            } else {
              this.toastr.error(res.message);
              resolve(false);
            }
          },
          (err) => {
            this.spinner.hide();
            this.toastr.error(Global.showServerErrorMessage(err));
            resolve(false);
          }
        );
    });
  }

  updateEmployeeFullFinalDetails(event: any) {
    this.employeeFullFinalForm.markAllAsTouched();
    Global.scrollToQuery('p.error-element');

    if (this.employeeFullFinalForm.valid) {
      // this.employeeFullFinalForm.markAllAsTouched();
      event.target.classList.add('btn-loading');

      this.companyuserService
        .updateEmployeeFullFinalDetails({
          last_working_date:
            this.employeeFullFinalForm.value?.last_working_date ?? '',
          emp_notice_period:
            this.employeeFullFinalForm.value?.emp_notice_period ?? '',
          er_notice_period:
            this.employeeFullFinalForm.value?.er_notice_period ?? '',
          do_resignation:
            this.employeeFullFinalForm.value?.do_resignation ?? '',
          reason_code:
            this.employeeFullFinalForm.value?.reason_code?.value ?? '',
          extra_field: JSON.stringify(
            this.employeeFullFinalForm.value?.extra_field
          ),
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

  cancelEntry() {
    Global.resetForm(this.employeeFullFinalForm);
    // Global.resetFormGroupArrRow(this.employeeFullFinalForm, 'extra_field');
    Global.resetFormGroupArrRow(this.employeeFullFinalForm, 'payble_field');
    this.employeeFullFinalForm.patchValue({
      net_pay: false,
      employee_pf: false,
      employer_pf: false,
      employee_esic: false,
      employer_esic: false,
      p_tax: false,
      leave_encashment: false,
      accumulated_bonus: false,
      outstanding_incentive: false,
      tds: false,
      outstanding_advance: false,
      gratuity: FontFaceSetLoadEvent,
    });
  }

  initAssetReceive(item: any) {
    Global.resetForm(this.employeeAssetReceiveForm);
    this.employeeAssetReceiveForm.patchValue({
      asset_id: item?._id ?? null,
      asset_details: item?.asset_details ?? null,
      asset_no: item?.asset_no ?? null,
      asset_value: item?.asset_value ?? null,
      asset_qty: item?.asset_qty ?? null,
      asset_issue_date: item?.asset_issue_date ?? null,
      asset_receive_date: item?.asset_receive_date ?? null,
      asset_receive_by: item?.asset_receive_by ?? null,
    });

    $('#employeeAssetReceiveModalButton')?.click();
  }

  cancelAssetReceive() {
    Global.resetForm(this.employeeAssetReceiveForm);
    $('#employeeAssetReceiveModal')?.find('[data-dismiss="modal"]')?.click();
  }

  submitAssetReceive(event: any) {
    this.employeeAssetReceiveForm.markAllAsTouched();
    Global.scrollToQuery('p.error-element');

    if (this.employeeAssetReceiveForm.valid) {
      event.target.classList.add('btn-loading');

      this.companyuserService
        .updateEmployeeAssetDetails({
          asset_id: this.employeeAssetReceiveForm.value?.asset_id ?? '',
          asset_details:
            this.employeeAssetReceiveForm.value?.asset_details ?? '',
          asset_no: this.employeeAssetReceiveForm.value?.asset_no ?? '',
          asset_value: this.employeeAssetReceiveForm.value?.asset_value ?? '',
          asset_qty: this.employeeAssetReceiveForm.value?.asset_qty ?? '',
          asset_issue_date:
            this.employeeAssetReceiveForm.value?.asset_issue_date ?? '',
          asset_receive_date:
            this.employeeAssetReceiveForm.value?.asset_receive_date ?? '',
          asset_receive_by:
            this.employeeAssetReceiveForm.value?.asset_receive_by ?? '',
          employee_id: this.employee_id,
        })
        .subscribe(
          (res) => {
            if (res.status == 'success') {
              this.toastr.success(res.message);
              this.cancelAssetReceive();
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

  /**
   * =========================
   * FormGroup Array Functions
   * =========================
   */

  initFormRows(type: any, data: any = null) {
    switch (type) {
      case 'extra_field':
        return this.formBuilder.group({
          label: [
            data?.label ?? null,
            Validators.compose([Validators.required]),
          ],
          value: [
            data?.value ?? null,
            Validators.compose([Validators.required]),
          ],
        });
      case 'payble_field':
        return this.formBuilder.group({
          label: [
            data?.label ?? null,
            Validators.compose([Validators.required]),
          ],
          value: [
            data?.value ?? null,
            Validators.compose([Validators.required]),
          ],
        });

      default:
        return this.formBuilder.group({});
    }
  }

  addFormRows(formGroup: UntypedFormGroup, type: any, data: any = null) {
    const control = <UntypedFormArray>formGroup.get(type);
    switch (type) {
      case 'extra_field':
        control.push(this.initFormRows('extra_field', data));
        break;
      case 'payble_field':
        control.push(this.initFormRows('payble_field', data));
        break;
    }
  }

  removeTemplateRow(formGroup: any, type: any, i: number) {
    const control = <UntypedFormArray>formGroup.get(type);
    control.removeAt(i);
  }

  textTODATE() {
    $('#adverts_eventDate').attr('type', 'date');
    $('.date_field').attr('type', 'date');
  }

  handleCheck(ev: any, key: any) {
    if (ev.target.checked) {
      this.employeeFullFinalForm.patchValue({ [key]: true });
      if (key == 'leave_encashment') {
        this.employeeFullFinalForm.patchValue({
          net_pay: true,
          employee_pf: true,
          employer_pf: true,
          employee_esic: true,
          employer_esic: true,
          p_tax: true,
        });
      }
    } else {
      this.employeeFullFinalForm.patchValue({ [key]: false });
      if (key == 'leave_encashment') {
        this.employeeFullFinalForm.patchValue({
          net_pay: false,
          employee_pf: false,
          employer_pf: false,
          employee_esic: false,
          employer_esic: false,
          p_tax: false,
        });
      }
    }
  }

  submitFullandFinal() {
    this.isSubmitted = true;
    // if(this.actionfrom !== 'exitmodal'){
    //   this.employeeFullFinalForm.removeValidators("")
    // }
    if (this.actionfrom == 'exitmodal' || this.employeeFullFinalForm.valid) {
      let payload: any = this.employeeFullFinalForm?.value;
      payload.is_final_process = false;

      if (this.actionfrom !== 'exitmodal') {
        payload.is_final_process = true;
      } else {
        if (
          !this.employeeFullFinalForm.value.last_working_date ||
          !this.employeeFullFinalForm.value.do_resignation ||
          !this.employeeFullFinalForm.value.reason_code
        ) {
          return;
        }
      }
      payload.extra_fields = JSON.stringify(payload?.payble_field);
      payload.employee_id = this.employee_id;
      payload.reason_code = payload.reason_code?.label ?? '';
      payload.emp_notice_period = '';
      payload.er_notice_period = '';
      delete payload.payble_field;
      this.spinner.show();
      //console.log(JSON.stringify(payload));
      this.companyuserService.submitFullandFinal(payload).subscribe(
        (res: any) => {
          this.spinner.hide();
          if (res.status == 'success') {
            this.toastr.success(res.message);
            this.cancelEntry();
            this.fetchEmployeeDetails();
          } else if (res.status == 'val_err') {
            this.toastr.error(Global.showValidationMessage(res.val_msg));
          } else {
            this.toastr.error(res.message);
          }
        },
        (err) => {
          this.spinner.hide();
          this.toastr.error(Global.showServerErrorMessage(err));
        }
      );
    }
  }

  get payble_field(): UntypedFormArray {
    return this.employeeFullFinalForm.get('payble_field') as UntypedFormArray;
  }
  
  async downloadReport(){
    try {
      await this.companyuserService.downloadFile('employee-full-and-final-report', 'employee-full-and-final-report', {
        employee_id: this.employee_id,
        generate:'excel'
      })    
      this.actionfrom = 'normal'
    } catch (err:any) {
      this.toastr.error(err.message)
    }
  }
  async viewFullandFinalReport(element_id: any) {
    try {
      let res = await this.companyuserService
        .employeeFullAndFinalReport({ employee_id: this.employee_id})
        .toPromise();
      if (res.status !== 'success') throw res;
      this.report_data = res.doc;
      let startDate = moment(res.doc?.date_of_join);
      let endDate = moment(res.doc?.full_and_final_data?.last_working_date);

      this.report_data.lastMonthDays = moment(
        `${new Date(
          res.doc?.full_and_final_data?.last_working_date
        ).getFullYear()}-${
          new Date(res.doc?.full_and_final_data?.last_working_date).getMonth() +
          1
        }`,
        'YYYY-M'
      ).daysInMonth();
      this.report_data.lastMonthDaysToPay = endDate.date();
      this.report_data.amountInWords = Global.convertNumberToWords(
        res?.doc?.full_and_final?.total_payable
      );
      this.report_data.working_tenaure = `${endDate.diff(
        startDate,
        'years'
      )} Years ${endDate.diff(startDate, 'months') % 12} Months ${
        endDate.diff(startDate, 'days') % 30
      } Days`;

      this.actionfrom = 'report'


      // setTimeout(() => {
      //   var divContents: any = document.getElementById(element_id)?.innerHTML;
      //   if (divContents) {
      //     this.win_modal = window.open('', '');
      //     this.win_modal.document.write(
      //       `<html><head><link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-EVSTQN3/azprG1Anm3QDgpJLIm9Nao0Yz1ztcQTwFspd3yD65VohhpuuCOmLASjC" crossorigin="anonymous"></head><body>${divContents}</body></html>`
      //     );
      //   }
      //   this.printReport(this.win_modal);
      // }, 1000);
    } catch (err: any) {
      if (err.status == 'val_err') {
        this.toastr.error(Global.showValidationMessage(err.val_msg));
      } else {
        this.toastr.error(Global.showServerErrorMessage(err));
        this.toastr.error(err.message);
      }
    }
  }

  printReport(a: any) {

    setTimeout(() => {
      // a.print();
    }, 500);
  }
}
