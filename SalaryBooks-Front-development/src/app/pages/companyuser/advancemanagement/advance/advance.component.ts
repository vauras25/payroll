import { DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  UntypedFormArray,
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import * as saveAs from 'file-saver';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { AppComponent } from 'src/app/app.component';
import * as Global from 'src/app/globals';
import PaginationOptions from 'src/app/models/PaginationOptions';
import { CompanyuserService } from 'src/app/services/companyuser.service';

@Component({
  selector: 'companyuser-app-advance-management',
  templateUrl: './advance.component.html',
  styleUrls: ['./advance.component.css'],
})
export class CMPAdvanceManagementComponent implements OnInit {
  Global = Global;

  advanceForm: UntypedFormGroup;
  advanceImportForm: UntypedFormGroup;
  advancePaginationOptions: PaginationOptions;

  employeeSearchDraw: number = 1;
  employeeMaster: any[] = [];
  recoveryFromMaster: any[] = [];
  recoveryFrequencyMaster: any[] = [];
  monthMaster: any[] = [];
  yearMaster: any[] = [];
  statusMaster: any[] = [];
  advanceData: any[] = [];
  advanceDetails: any = null;
  editadvanceDetails: any = null;
  advanceImportFailed: any[] = [];

  constructor(
    private titleService: Title,
    public formBuilder: UntypedFormBuilder,
    private companyuserService: CompanyuserService,
    private toastr: ToastrService,
    private spinner: NgxSpinnerService,
    private datePipe: DatePipe,
    public AppComponent: AppComponent,
    private router: Router
  ) {
    if (
      !Global.checkCompanyModulePermission({
        company_module: 'advance',
        company_sub_module: 'apply_advance',
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

    this.advanceForm = formBuilder.group({
      emp_id: [null, Validators.compose([Validators.required])],
      recovery_from: [null, Validators.compose([Validators.required])],
      advance_amount: [
        null,
        Validators.compose([
          Validators.required,
          Validators.pattern('^[0-9]+(.[0-9]{0,2})?$'),
        ]),
      ],
      no_of_instalments: [
        null,
        Validators.compose([
          Validators.required,
          Validators.pattern('^[0-9]*$'),
        ]),
      ],
      recovery_frequency: [null, Validators.compose([Validators.required])],
      payment_start_month: [null, Validators.compose([Validators.required])],
      payment_start_year: [null, Validators.compose([Validators.required])],
      payment_booking_date: [null, Validators.compose([Validators.required])],
      // "advance_outstanding": [null, Validators.compose([Validators.required, Validators.pattern("^[0-9]+(.[0-9]{0,2})?$")])],
      advance_outstanding: [null, Validators.compose([])],
      remarks: [null, Validators.compose([])],
      instalment_history: this.formBuilder.array([]),
    });

    this.advanceImportForm = formBuilder.group({
      file: [null, Validators.compose([Validators.required])],
      file_source: [null, Validators.compose([Validators.required])],
    });

    this.recoveryFromMaster = [
      { value: 'incentive', description: 'Incentive' },
      { value: 'bonus', description: 'Bonus' },
      { value: 'gross_earning', description: 'Gross Earning' },
      { value: 'annual_earning', description: 'Annual Earning' },
      { value: 'reimbursement', description: 'Reimbursement' },
    ];

    this.recoveryFrequencyMaster = [
      { value: 'monthly', description: 'Monthly' },
      { value: 'quaterly', description: 'Quaterly' },
      { value: 'halfyearly', description: 'Half Yearly' },
      { value: 'annually', description: 'Annually' },
    ];

    this.monthMaster = [
      { index: 0, value: 1, description: 'January', days: 31 },
      { index: 1, value: 2, description: 'February', days: 28 },
      { index: 2, value: 3, description: 'March', days: 31 },
      { index: 3, value: 4, description: 'April', days: 30 },
      { index: 4, value: 5, description: 'May', days: 31 },
      { index: 5, value: 6, description: 'June', days: 30 },
      { index: 6, value: 7, description: 'July', days: 31 },
      { index: 7, value: 8, description: 'August', days: 31 },
      { index: 8, value: 9, description: 'September', days: 30 },
      { index: 9, value: 10, description: 'October', days: 31 },
      { index: 10, value: 11, description: 'November', days: 30 },
      { index: 11, value: 12, description: 'December', days: 31 },
    ];

    this.statusMaster = [
      { value: 'pending', description: 'Pending' },
      { value: 'partially_missed', description: 'Partially Missed' },
      { value: 'missed', description: 'Missed' },
      { value: 'complete', description: 'Complete' },
    ];

    let currentYear = new Date().getFullYear();
    this.yearMaster = [];
    for (let index = 0; index < 5; index++) {
      this.yearMaster.push(currentYear + index);
    }

    this.advanceForm.get('advance_amount')?.valueChanges?.subscribe((val) => {
      this.generateInstallmentHistory();
    });

    this.advanceForm
      .get('no_of_instalments')
      ?.valueChanges?.subscribe((val) => {
        setTimeout(() => {
          this.generateInstallmentHistory();
        }, 10);
      });

    this.advanceForm
      .get('recovery_frequency')
      ?.valueChanges?.subscribe((val) => {
        this.generateInstallmentHistory();
      });

    this.advanceForm
      .get('payment_start_month')
      ?.valueChanges?.subscribe((val) => {
        this.generateInstallmentHistory();
      });

    this.advanceForm
      .get('payment_start_year')
      ?.valueChanges?.subscribe((val) => {
        setTimeout(() => {
          this.generateInstallmentHistory();
        }, 20);
      });

    this.advanceForm.get('recovery_from')?.valueChanges?.subscribe((val) => {
      this.generateInstallmentHistory();
    });

    this.advanceForm
      .get('advance_outstanding')
      ?.valueChanges?.subscribe((val) => {
        if (this.editadvanceDetails) {
          this.generateInstallmentHistory();
        }
      });

    this.advancePaginationOptions = Global.resetPaginationOption();
  }

  ngOnInit(): void {
    this.titleService.setTitle('Advance Management - ' + Global.AppName);
    this.fetch();
    this.empSearch('');
    // this.advanceForm.patchValue({
    //   "recovery_from": this.recoveryFromMaster.find((obj: any) => {
    //     return obj.value == 'bonus'
    //   }) ?? null,
    //   "advance_amount": 10000,
    //   "no_of_instalments": 10,
    //   "recovery_frequency": this.recoveryFrequencyMaster.find((obj: any) => {
    //     return obj.value == 'monthly'
    //   }) ?? null,
    //   "payment_start_month": this.monthMaster.find((obj: any) => {
    //     return obj.index == 7
    //   }) ?? null,
    //   "payment_start_year": 2022,
    //   "payment_booking_date": "2022-10-01",
    //   "remarks": "lorem ipsum dummy text",
    // })

    // this.generateInstallmentHistory()

  }

  create(event: any) {
    this.advanceForm.markAllAsTouched();
    setTimeout(function () {
      Global.scrollToQuery('p.error-element');
    }, 100);

    if (this.advanceForm.valid && this.advanceCustomValid()) {
      let payload: any = {
        emp_id: this.advanceForm.value.emp_id?.emp_id ?? '',
        recovery_from: this.advanceForm.value.recovery_from?.value ?? '',
        advance_amount: this.advanceForm.value.advance_amount ?? '',
        no_of_instalments: this.advanceForm.value.no_of_instalments ?? '',
        recovery_frequency:
          this.advanceForm.value.recovery_frequency?.value ?? '',
        payment_start_month:
          this.advanceForm.value.payment_start_month?.index ?? '',
        payment_start_year: this.advanceForm.value.payment_start_year ?? '',
        remarks:this.advanceForm.value.remarks ?? '',
        payment_booking_date: this.advanceForm.value.payment_booking_date ?? '',
        advance_outstanding: this.advanceForm.value.advance_amount ?? '',
      };

      let instalment_history: any = [];
      this.advanceForm.value.instalment_history.forEach((installment: any) => {
        instalment_history.push({
          instalment_month: installment?.instalment_month?.index ?? null,
          instalment_year: installment?.instalment_year ?? null,
          recovery_from: installment?.recovery_from?.value ?? null,
          advance_amount: installment?.advance_amount ?? null,
          status: installment?.status?.value ?? null,
        });
      });

      payload.instalment_history = JSON.stringify(instalment_history);

      event.target.classList.add('btn-loading');
      this.companyuserService.createAdvanceData(payload)?.subscribe(
        (res) => {
          if (res.status == 'success') {
            this.toastr.success(res.message);
            this.cancelEntry();
            this.fetch();
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

  update(event: any) {
    this.advanceForm.markAllAsTouched();
    setTimeout(function () {
      Global.scrollToQuery('p.error-element');
    }, 100);

    if (this.advanceForm.valid && this.advanceCustomValid()) {
      let payload: any = {
        emp_advance_id: this.editadvanceDetails._id ?? '',
        emp_id: this.editadvanceDetails.emp_id ?? '',
        advance_amount: this.editadvanceDetails.advance_amount ?? '',
        recovery_frequency: this.editadvanceDetails.recovery_frequency ?? '',
        payment_start_month: this.editadvanceDetails.payment_start_month ?? '',
        payment_start_year: this.editadvanceDetails.payment_start_year ?? '',
        payment_booking_date:
          this.editadvanceDetails.payment_booking_date ?? '',
        advance_outstanding: this.advanceForm.value.advance_outstanding ?? '',

        recovery_from: this.advanceForm.value.recovery_from?.value ?? '',
        remarks: this.advanceForm.value.remarks ?? '',
        no_of_instalments: this.advanceForm.value.no_of_instalments ?? '',
      };

      let instalment_history: any = [];
      this.advanceForm.value.instalment_history.forEach((installment: any) => {
        instalment_history.push({
          instalment_month: installment?.instalment_month?.index ?? null,
          instalment_year: installment?.instalment_year ?? null,
          recovery_from: installment?.recovery_from?.value ?? null,
          advance_amount: installment?.advance_amount ?? null,
          status: installment?.status?.value ?? null,
        });
      });

      payload.instalment_history = JSON.stringify(instalment_history);

      event.target.classList.add('btn-loading');
      this.companyuserService.updateAdvanceData(payload)?.subscribe(
        (res) => {
          if (res.status == 'success') {
            this.toastr.success(res.message);
            this.fetch();
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

  fetch({ page = <any>null } = {}) {
    if (page != null) {
      this.advancePaginationOptions.page = page;
    }

    return new Promise((resolve, reject) => {
      this.spinner.show();
      this.companyuserService
        .getAdvanceData({
          pageno: this.advancePaginationOptions.page,
          perpage: this.advancePaginationOptions.limit,
        })
        ?.subscribe(
          (res) => {
            if (res.status == 'success') {
              this.advanceData = res.advance_data?.docs ?? [];
              this.advancePaginationOptions = {
                hasNextPage: res.advance_data.hasNextPage,
                hasPrevPage: res.advance_data.hasPrevPage,
                limit: res.advance_data.limit,
                nextPage: res.advance_data.nextPage,
                page: res.advance_data.page,
                pagingCounter: res.advance_data.pagingCounter,
                prevPage: res.advance_data.prevPage,
                totalDocs: res.advance_data.totalDocs,
                totalPages: res.advance_data.totalPages,
              };
            } else if (res.status == 'val_err') {
              this.toastr.error(Global.showValidationMessage(res.val_msg));
              this.advancePaginationOptions = Global.resetPaginationOption();
              this.advanceData = [];
            } else {
              this.toastr.error(res.message);
              this.advancePaginationOptions = Global.resetPaginationOption();
              this.advanceData = [];
            }

            this.spinner.hide();
            resolve(true);
          },
          (err) => {
            this.spinner.hide();
            this.toastr.error(Global.showServerErrorMessage(err));
            this.advanceData = [];
            resolve(true);
          }
        );
    });
  }

  viewDetails(item: any) {
    this.advanceDetails = item;

    $('#advanceDetailsModalOpen')?.click();
  }

  async getEdit(item: any) {
    this.cancelEntry();
    this.editadvanceDetails = item;

    await this.empSearch(item.emp_id);

    this.advanceForm.patchValue({
      emp_id:
        this.employeeMaster.find((obj: any) => {
          return obj.emp_id == item.emp_id;
        }) ?? null,
      recovery_from:
        this.recoveryFromMaster.find((obj: any) => {
          return obj.value == item.recovery_from;
        }) ?? null,
      advance_amount: item.advance_amount,
      no_of_instalments: item.no_of_instalments,
      recovery_frequency: this.recoveryFrequencyMaster.find((obj: any) => {
        return obj.value == item.recovery_frequency;
      }),
      payment_start_month: this.monthMaster.find((obj: any) => {
        return obj.index == item.payment_start_month;
      }),
      payment_start_year: item.payment_start_year,
      payment_booking_date: item.payment_booking_date,
      remarks: item.remarks,
      advance_outstanding: item.advance_outstanding ?? null,
    });

    let fields = [
      'emp_id',
      'advance_amount',
      'recovery_frequency',
      'payment_start_month',
      'payment_start_year',
      'payment_booking_date',
    ];
    fields.forEach((control: any) => {
      this.advanceForm.get(control)?.disable();

      this.advanceForm.get(control)?.clearValidators();
      this.advanceForm.get(control)?.updateValueAndValidity();
    });

    this.advanceForm
      .get('advance_outstanding')
      ?.setValidators([
        Validators.required,
        Validators.pattern('^[0-9]+(.[0-9]{0,2})?$'),
      ]);
    this.advanceForm.get('advance_outstanding')?.updateValueAndValidity();

    setTimeout(() => {
      this.generateInstallmentHistory({ prefillEditData: true });
    }, 500);
  }

  generateInstallmentHistory({ prefillEditData = <boolean>false } = {}) {
    let comp_details: any =
      localStorage.getItem('payroll-companyuser-details') ?? null;

    this.resetAllFormRows({
      formGroup: this.advanceForm,
      is_editing: true,
      array: ['instalment_history'],
    });

    let valid: any = false;
    if (this.editadvanceDetails) {
      valid =
        this.advanceForm.get('no_of_instalments')?.valid &&
        this.advanceForm.get('recovery_from')?.valid;
    } else {
      valid =
        this.advanceForm.get('advance_amount')?.valid &&
        this.advanceForm.get('no_of_instalments')?.valid &&
        this.advanceForm.get('recovery_frequency')?.valid &&
        this.advanceForm.get('recovery_from')?.valid &&
        this.advanceForm.get('payment_start_month')?.valid &&
        this.advanceForm.get('payment_start_year')?.valid;
    }

    if (valid === true && comp_details !== null) {
      let NO_OF_INSTALMENTS = this.advanceForm.value.no_of_instalments;
      let RECOVERY_FROM = this.advanceForm.value.recovery_from;
      let ADVANCE_AMOUNT = this.advanceForm.value.advance_amount;
      let OUTSTANDING_AMOUNT = this.advanceForm.value.advance_amount;
      let RECOVERY_FREQUENCY = this.advanceForm.value.recovery_frequency;
      let PAYMENT_START_MONTH = this.advanceForm.value.payment_start_month;
      let PAYMENT_START_YEAR = this.advanceForm.value.payment_start_year;

      // console.log('advanceForm ::: ', this.advanceForm)
      // console.log('advanceForm.value ::: ', this.advanceForm.value)
      // console.log('PAYMENT_START_YEARs ::: ', PAYMENT_START_YEAR)

      if (this.editadvanceDetails) {
        let completed_transactions: any[] =
          this.editadvanceDetails.instalment_history.filter((obj: any) => {
            return obj.status == 'complete';
          });

        if (parseInt(NO_OF_INSTALMENTS) < completed_transactions.length + 1) {
          // this.toastr.error("The number of installments cannot be less than the added earlier");
          this.toastr.error(
            'The number of installments must be greater than ' +
              completed_transactions.length
          );
          return;
        }

        ADVANCE_AMOUNT = this.editadvanceDetails.advance_amount;
        OUTSTANDING_AMOUNT = this.advanceForm.value.advance_outstanding; // Override the outstanding amount
        RECOVERY_FREQUENCY = this.recoveryFrequencyMaster.find((obj: any) => {
          return obj.value == this.editadvanceDetails.recovery_frequency;
        });
        PAYMENT_START_MONTH = this.monthMaster.find((obj: any) => {
          return obj.index == this.editadvanceDetails.payment_start_month;
        });
        PAYMENT_START_YEAR = this.editadvanceDetails.payment_start_year;
      }

      if (prefillEditData === true && this.editadvanceDetails) {
        this.editadvanceDetails.instalment_history.forEach(
          (installment: any) => {
            this.addFormRows(this.advanceForm, 'instalment_history', {
              instalment_month:
                this.monthMaster.find((obj: any) => {
                  return obj.index == installment.instalment_month;
                }) ?? null,
              instalment_year: installment.instalment_year,
              recovery_from:
                this.recoveryFromMaster.find((obj: any) => {
                  return obj.value == installment.recovery_from ?? null;
                }) ?? null,
              advance_amount: installment.advance_amount,
              status: this.statusMaster.find((obj: any) => {
                return obj.value == installment.status;
              }),
            });
          }
        );

        return;
      }

      comp_details = JSON.parse(comp_details);

      const FYstartmonth = this.monthMaster.find((obj: any) => {
        return (
          obj.value ==
          this.datePipe.transform(
            comp_details?.preference_settings?.financial_year_end,
            'M'
          )
        );
      });

      if (!FYstartmonth) {
        this.toastr.error('Please add FY start month, from company settings');
        return;
      }

      let everyMonthInstallment =
        parseFloat(ADVANCE_AMOUNT) / parseInt(NO_OF_INSTALMENTS);

      if (this.editadvanceDetails) {
        let completed_transactions: any[] =
          this.editadvanceDetails.instalment_history.filter((obj: any) => {
            return obj.status == 'complete';
          });

        let installment_left: number =
          parseInt(NO_OF_INSTALMENTS) - completed_transactions.length;
        let amount_paid = completed_transactions.reduce(function (sum, obj) {
          return sum + parseFloat(obj.advance_amount);
        }, 0);

        // everyMonthInstallment = (parseFloat(ADVANCE_AMOUNT) - parseFloat(amount_paid)) / installment_left
        everyMonthInstallment = OUTSTANDING_AMOUNT / installment_left;
      }

      if (!PAYMENT_START_YEAR || !PAYMENT_START_MONTH) {
        // console.log(!PAYMENT_START_YEAR || !PAYMENT_START_MONTH?.index);
        // console.log('PAYMENT_START_YEAR', PAYMENT_START_YEAR);
        // console.log('PAYMENT_START_MONTH?.index', PAYMENT_START_MONTH?.index);
        return;
      }

      var startDate = new Date(
        PAYMENT_START_YEAR,
        PAYMENT_START_MONTH.index,
        1
      );
      // if (["quaterly", "halfyearly", "annually",].includes(RECOVERY_FREQUENCY?.value)) {
      //   startDate = new Date(PAYMENT_START_YEAR, FYstartmonth.index, 1);
      // } else if (["monthly"].includes(RECOVERY_FREQUENCY?.value)) {
      //   startDate = new Date(PAYMENT_START_YEAR, PAYMENT_START_MONTH.index, 1);
      // }

      for (
        let index = 0;
        index < this.advanceForm.value.no_of_instalments;
        index++
      ) {
        let date: any = null;
        switch (RECOVERY_FREQUENCY?.value) {
          case 'monthly':
            date = new Date(
              startDate.setMonth(startDate.getMonth() + (index == 0 ? 0 : 1))
            );
            break;

          case 'quaterly':
            date = new Date(
              startDate.setMonth(startDate.getMonth() + (index == 0 ? 0 : 3))
            );
            break;

          case 'halfyearly':
            date = new Date(
              startDate.setMonth(startDate.getMonth() + (index == 0 ? 0 : 6))
            );
            break;

          case 'annually':
            date = new Date(
              startDate.setFullYear(
                startDate.getFullYear() + (index == 0 ? 0 : 1)
              )
            );
            break;
        }

        let document = {
          instalment_month:
            this.monthMaster.find((obj: any) => {
              return obj.index == date.getMonth();
            }) ?? null,
          instalment_year: date.getFullYear(),
          recovery_from:
            this.recoveryFromMaster.find((obj: any) => {
              return obj.value == RECOVERY_FROM?.value ?? null;
            }) ?? null,
          advance_amount: everyMonthInstallment.toFixed(2),
          status: this.statusMaster.find((obj: any) => {
            return obj.value == 'pending';
          }),
        };

        // Bind if the installment is already paid
        if (this.editadvanceDetails) {
          let history: any = this.editadvanceDetails.instalment_history.find(
            (obj: any) => {
              return (
                obj.status == 'complete' &&
                obj.instalment_month == date.getMonth()
              );
            }
          );

          if (history) {
            document.recovery_from =
              this.recoveryFromMaster.find((obj: any) => {
                return obj.value == history.recovery_from ?? null;
              }) ?? null;

            document.status = this.statusMaster.find((obj: any) => {
              return obj.value == 'complete';
            });

            document.advance_amount = history.advance_amount;
          }
        }

        this.addFormRows(this.advanceForm, 'instalment_history', document);
      }
    }
  }

  tableAdvanceAmountChanged(changedIndex: number) {
    const INSTALLMENT_HISTORY = this.advanceForm.value.instalment_history;

    let OUTSTANDING_AMOUNT = this.advanceForm.value.advance_amount;
    if (this.editadvanceDetails) {
      OUTSTANDING_AMOUNT = this.advanceForm.value.advance_outstanding; // Override the outstanding amount
    }

    let UB_AMOUNT: number = 0; // Storing the upper bound
    INSTALLMENT_HISTORY.forEach((INSTALLMENT: any, index: number) => {
      if (INSTALLMENT.status.value == 'pending' && index <= changedIndex) {
        UB_AMOUNT += parseFloat(INSTALLMENT?.advance_amount) ?? 0;
      }
    });

    let DB_AMOUNT: number = parseFloat(OUTSTANDING_AMOUNT) - UB_AMOUNT; // Storing the down bound amount to be distributed

    const ADJUSTMENT_LEFT: number =
      INSTALLMENT_HISTORY.length - (changedIndex + 1);
    const DOWNLINE_EMI = (DB_AMOUNT / ADJUSTMENT_LEFT).toFixed(2);

    // console.log('OUTSTANDING_AMOUNT : ', OUTSTANDING_AMOUNT)
    // console.log('UB_AMOUNT : ', UB_AMOUNT)
    // console.log('DB_AMOUNT : ', DB_AMOUNT)
    // console.log('adjustmentLeft : ', ADJUSTMENT_LEFT)
    // console.log('DOWNLINE_EMI : ', DOWNLINE_EMI)

    const control = <UntypedFormArray>(
      this.advanceForm.get('instalment_history')
    );
    for (let index = changedIndex + 1; index < control.length; index++) {
      control.at(index)?.patchValue({
        advance_amount: DOWNLINE_EMI,
      });
    }
  }

  cancelEntry() {
    Global.resetForm(this.advanceForm);
    this.editadvanceDetails = null;
    this.employeeMaster = [];

    let fields = [
      'emp_id',
      'advance_amount',
      'recovery_frequency',
      'payment_start_month',
      'payment_start_year',
      'payment_booking_date',
    ];
    fields.forEach((control: any) => {
      this.advanceForm.get(control)?.enable();
    });

    this.advanceForm.get('emp_id')?.setValidators([Validators.required]);
    this.advanceForm
      .get('advance_amount')
      ?.setValidators([
        Validators.required,
        Validators.pattern('^[0-9]+(.[0-9]{0,2})?$'),
      ]);
    this.advanceForm
      .get('recovery_frequency')
      ?.setValidators([Validators.required]);
    this.advanceForm
      .get('payment_start_month')
      ?.setValidators([Validators.required]);
    this.advanceForm
      .get('payment_start_year')
      ?.setValidators([Validators.required]);
    this.advanceForm
      .get('payment_booking_date')
      ?.setValidators([Validators.required]);
    this.advanceForm.get('advance_outstanding')?.clearValidators();

    this.advanceForm.get('emp_id')?.updateValueAndValidity();
    this.advanceForm.get('advance_amount')?.updateValueAndValidity();
    this.advanceForm.get('recovery_frequency')?.updateValueAndValidity();
    this.advanceForm.get('payment_start_month')?.updateValueAndValidity();
    this.advanceForm.get('payment_start_year')?.updateValueAndValidity();
    this.advanceForm.get('payment_booking_date')?.updateValueAndValidity();
    this.advanceForm.get('advance_outstanding')?.updateValueAndValidity();
    this.empSearch('');

    Global.scrollToQuery('#advance-submit-section');
  }

  advanceCustomValid() {
    /**
     * ------------------------------------
     * CHECK THE TOTAL SUM SATISFIED OR NOT
     * ------------------------------------
     * ------------------------------------
     **/
    let installment_total = this.advanceForm.value.instalment_history.reduce(
      function (sum: any, obj: any) {
        return sum + parseFloat(obj.advance_amount);
      },
      0
    );

    let advance_amount = this.advanceForm.value.advance_amount;
    if (this.editadvanceDetails) {
      // advance_amount = this.editadvanceDetails.advance_amount;
      advance_amount = this.advanceForm.value.advance_outstanding;

      installment_total = this.advanceForm.value.instalment_history.reduce(
        function (sum: any, obj: any) {
          if (obj.status.value == 'pending') {
            return sum + parseFloat(obj.advance_amount);
          } else {
            return sum;
          }
        },
        0
      );

      // console.log('installment_total : ', installment_total)
    }

    if (
      parseFloat(advance_amount) > parseFloat(installment_total) + 1 ||
      parseFloat(advance_amount) < parseFloat(installment_total) - 1
    ) {
      this.toastr.error(
        'The installment sumation doesnot matches the total advance amount'
      );
      return false;
    }

    return true;
  }

  /**
   * -----------------------------------------------
   * function empSearch() - Employee Search Function
   * @param keyword - Search Keyword
   * -----------------------------------------------
   * -----------------------------------------------
   */
  empSearch(keyword: any) {
    return new Promise((resolve, reject) => {
      const currentDraw = this.employeeSearchDraw;
      this.companyuserService
        .fetchEmployees({
          pageno: 1,
          searchkey: keyword,
        })
        ?.subscribe(
          (res) => {
            if (res.status == 'success') {
              if (currentDraw >= this.employeeSearchDraw) {
                this.employeeMaster = [];
                let employees: any[] = res.employees.docs ?? [];
                employees.forEach((employee: any) => {
                  this.employeeMaster.push({
                    _id: employee._id,
                    emp_id: employee.emp_id ?? '',
                    emp_first_name: employee.emp_first_name,
                    emp_last_name: employee.emp_last_name,
                    description:
                      employee.emp_first_name +
                      ' ' +
                      employee.emp_last_name +
                      (employee?.emp_id ? ' (' + employee?.emp_id + ') ' : ''),
                  });
                });
              }
            } else {
              this.employeeMaster = [];
              this.toastr.error(res.message);
            }

            resolve(true);
          },
          (err) => {
            this.employeeMaster = [];
            this.toastr.error(Global.showServerErrorMessage(err));
            resolve(true);
          }
        );
    });
  }

  /**
   * -----------------------------
   * MULTIPLE FIELDS FORM FUNCTION
   * -----------------------------
   * -----------------------------
   */
  initFormRows(type: any, data: any = null) {
    switch (type) {
      case 'instalment_history':
        return this.formBuilder.group({
          instalment_month: [
            data?.instalment_month ?? null,
            Validators.compose([Validators.required]),
          ],
          instalment_year: [
            data?.instalment_year ?? null,
            Validators.compose([Validators.required]),
          ],
          recovery_from: [
            data?.recovery_from ?? null,
            Validators.compose([Validators.required]),
          ],
          advance_amount: [
            data?.advance_amount ?? null,
            Validators.compose([
              Validators.required,
              Validators.pattern('^[0-9]+(.[0-9]{0,2})?$'),
            ]),
          ],
          status: [
            data?.status ?? null,
            Validators.compose([Validators.required]),
          ],
        });
        break;

      default:
        return this.formBuilder.group({});
        break;
    }
  }

  resetAllFormRows({
    formGroup = <UntypedFormGroup>this.advanceForm,
    is_editing = <Boolean>false,
    array = <any[]>['instalment_history'],
  } = {}) {
    array.forEach((element: any) => {
      const control = <UntypedFormArray>formGroup.get(element);
      control.clear();
    });

    if (is_editing == false) {
      array.forEach((element: any) => {
        this.addFormRows(formGroup, element);
      });
    }
  }

  addFormRows(formGroup: UntypedFormGroup, type: any, data: any = null) {
    const control = <UntypedFormArray>formGroup.get(type);
    control.push(this.initFormRows(type, data));
  }

  removeFormRow(formGroup: UntypedFormGroup, type: any, i: number) {
    const control = <UntypedFormArray>formGroup.get(type);
    control.removeAt(i);
  }

  fetchIndexOfControl(
    formGroup: UntypedFormGroup,
    type: any,
    s_key: any,
    s_value: any
  ) {
    let arr: any[] = formGroup.value?.[type];
    if (Array.isArray(arr)) {
      let index: any = arr.findIndex((x) => x[s_key] == s_value);
      return index;
    }

    return false;
  }

  getSelectedMonth(key: any, value: any) {
    return (
      this.monthMaster.find((obj: any) => {
        return obj[key] == value;
      }) ?? null
    );
  }

  /**
   * =====================
   * DATA IMPORT FUNCTIONS
   * =====================
   */
  initDataImport() {
    $('#advanceImportModalOpen')?.click();
  }

  cancelDataImport() {
    Global.resetForm(this.advanceImportForm);
    $('#advanceImportModal')?.find('[data-dismiss="modal"]')?.click();
  }

  importData(event: any) {
    if (this.advanceImportForm.valid) {
      event.target.classList.add('btn-loading');
      this.advanceImportFailed = [];
      this.companyuserService
        .importAdvanceData({
          emp_advance_data_file: this.advanceImportForm.value.file
            ? this.advanceImportForm.value.file_source
            : '',
        })
        ?.subscribe(
          (res) => {
            if (res.status == 'success') {
              this.cancelDataImport();
              this.toastr.success(res.message);
              this.fetch();

              this.advanceImportFailed = res.failed_entry ?? [];
              if (this.advanceImportFailed.length > 0) {
                this.toastr.warning(
                  'Please check the CSV few of the data format is incorrect'
                );
                $('#csvFailedIdModalButton')?.click();
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

  onImportFileChanged(
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

  // getSampleImportCsv() {
  //     this.spinner.show();
  //     this.companyuserService.getSampleAdvanceImportCsv({})?.subscribe((res) => {
  //         if (res.status == 'success') {
  //         } else {
  //             this.toastr.error(res.message);
  //         }

  //         this.spinner.hide();
  //     }, (err) => {
  //         this.toastr.error(Global.showServerErrorMessage(err));
  //         this.spinner.hide();
  //     })
  // }

  async getSampleImportCsv() {
    try {
      this.spinner.show();
      await this.companyuserService.downloadFile(
        'export-advance-data',
        'Advance-Sample'
      );
      this.spinner.hide();
    } catch (err: any) {
      this.spinner.hide();
      this.toastr.error(err?.message);
    }
  }

  // getSampleImportCsv() {
  //     this.spinner.show();
  //     this.companyuserService.getSampleAdvanceImportCsv({})?.subscribe((res) => {
  //         if (res.status == 'success') {
  //         } else {
  //             this.toastr.error(res.message);
  //         }

  //         this.spinner.hide();
  //     }, (err) => {
  //         this.toastr.error(Global.showServerErrorMessage(err));
  //         this.spinner.hide();
  //     })
  // }
}
