import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { UntypedFormBuilder, FormControl, UntypedFormGroup, Validators, FormGroup, UntypedFormArray } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { AppComponent } from 'src/app/app.component';
import * as Global from 'src/app/globals';
import { AuthService } from 'src/app/services/auth.service';
import { CommonService } from 'src/app/services/common.service';
import { DatePipe } from '@angular/common';
import PaginationOptions from 'src/app/models/PaginationOptions';
@Component({
  selector: 'app-advance-request',
  templateUrl: './advance-request.component.html',
})
export class AdvanceRequestComponent implements OnInit {
  advancerequestForm: FormGroup; 
  Global=Global;
  employee_details:any='';
  leave_cat_lists:any=[];
  advance_requests:any=[];
  paginationOptions: PaginationOptions;
  libraryPaginationOptions: PaginationOptions;
  recovery_items:any=[
    { value: "incentive", description: "Incentive" },
    { value: "bonus", description: "Bonus" },
    { value: "gross_earning", description: "Gross Earning" },
    { value: "annual_earning", description: "Annual Earning" },
    { value: "reimbursement", description: "Reimbursement" },
];
frequencies:any=[
  { value: "monthly", description: "Monthly" },
  { value: "quaterly", description: "Quaterly" },
  { value: "halfyearly", description: "Half Yearly" },
  { value: "annually", description: "Annually" },
];
monthMaster: any[] = [];
yearMaster: any[] = [];
editadvanceDetails: any;
statusMaster:any={};
empDetail:any={};
  constructor(
    public formBuilder: UntypedFormBuilder,
    private titleService: Title,
    private authService: AuthService,
    private toastr: ToastrService,
    private router: Router,
    private AppComponent: AppComponent,
    private commonService: CommonService,
    private spinner: NgxSpinnerService,
    private datePipe: DatePipe,  
  ) { 
    this.advancerequestForm=formBuilder.group({
      emp_advance_id:[null],
      recovery_from: ["", Validators.compose([Validators.required])] ,  
      advance_amount: ["", Validators.compose([Validators.required, Validators.pattern("^[0-9]*$")])] ,   
      no_of_instalments: ["", Validators.compose([Validators.required, Validators.pattern("^[0-9]*$")])],    
      recovery_frequency: ["", Validators.compose([Validators.required])] ,
      remarks: ["", Validators.compose([Validators.required])], 
      payment_start_month:["",Validators.compose([Validators.required])],
      payment_start_year:["",Validators.compose([Validators.required])],
      instalment_history: this.formBuilder.array([]),
      advance_outstanding: [null, Validators.compose([])],



  });
  this.paginationOptions = this.libraryPaginationOptions = {
      hasNextPage: false,
      hasPrevPage: false,
      limit: Global.DataTableLength,
      nextPage: null,
      page: 1,
      pagingCounter: 1,
      prevPage: null,
      totalDocs: 0,
      totalPages: 1,
    };

  }

  ngOnInit(): void {
    this.monthMaster = [
      { index: 0, value: 1, description: "January", days: 31 },
      { index: 1, value: 2, description: "February", days: 28 },
      { index: 2, value: 3, description: "March", days: 31 },
      { index: 3, value: 4, description: "April", days: 30 },
      { index: 4, value: 5, description: "May", days: 31 },
      { index: 5, value: 6, description: "June", days: 30 },
      { index: 6, value: 7, description: "July", days: 31 },
      { index: 7, value: 8, description: "August", days: 31 },
      { index: 8, value: 9, description: "September", days: 30 },
      { index: 9, value: 10, description: "October", days: 31 },
      { index: 10, value: 11, description: "November", days: 30 },
      { index: 11, value: 12, description: "December", days: 31 },
  ];
  this.statusMaster = [
    { value: 'pending', description: "Pending" },
    { value: 'partially_missed', description: "Partially Missed" },
    { value: 'missed', description: "Missed" },
    { value: 'complete', description: "Complete" },
];
this.advancerequestForm.get('advance_amount')?.valueChanges.subscribe(val => {
  this.generateInstallmentHistory()
})

this.advancerequestForm.get('no_of_instalments')?.valueChanges.subscribe(val => {
  setTimeout(() => {
      this.generateInstallmentHistory()
  }, 10);
})

this.advancerequestForm.get('recovery_frequency')?.valueChanges.subscribe(val => {
  this.generateInstallmentHistory()
})

this.advancerequestForm.get('payment_start_month')?.valueChanges.subscribe(val => {
  this.generateInstallmentHistory()
})

this.advancerequestForm.get('payment_start_year')?.valueChanges.subscribe(val => {
  setTimeout(() => {
      this.generateInstallmentHistory()
  }, 20);
})

this.advancerequestForm.get('recovery_from')?.valueChanges.subscribe(val => {
  this.generateInstallmentHistory()
})

this.advancerequestForm.get('advance_outstanding')?.valueChanges.subscribe(val => {
  if (this.editadvanceDetails) {
      this.generateInstallmentHistory()
  }
})
  let currentYear = new Date().getFullYear();
        this.yearMaster = [];
        for (let index = 0; index < 5; index++) {
            this.yearMaster.push(currentYear + index);
        }
    this.fetchEmployeeDetails();    
    this.fetchleaveRequest();
    this.getAccount();
    }
    
    fetchEmployeeDetails() {
        
        this.spinner.show();
        this.commonService.postDataRaw("employee/employee-leave-type-list",{})
            .subscribe((res: any) => {
                this.spinner.hide();
                if (res.status == 'success') {
                 this.leave_cat_lists=  res.leave_type ;

                } else {
                    this.toastr.error(res.message);
                }

                this.spinner.hide();
            }, (err) => {
                this.spinner.hide();
                this.toastr.error(Global.showServerErrorMessage(err));
            });
  
}


submitForm(event:any)
{
    this.advancerequestForm.markAllAsTouched();

    if (this.advancerequestForm.valid) {
        event.target.classList.add('btn-loading');
        this.spinner.show();
        let submit_data:any={
          advance_amount:this.advancerequestForm.value.advance_amount, advance_outstanding:this.advancerequestForm.value.advance_amount,
          payment_start_month:this.advancerequestForm.value.payment_start_month.index.toString(), payment_start_year:this.advancerequestForm.value.payment_start_year.toString(),
          recovery_frequency:this.advancerequestForm.value.recovery_frequency?.value,recovery_from:this.advancerequestForm.value.recovery_from?.value,
          remarks:this.advancerequestForm.value.remarks,no_of_instalments:this.advancerequestForm.value.no_of_instalments
        };
        let instalment_history: any = [];
        this.advancerequestForm.value.instalment_history.forEach((installment: any) => {
            instalment_history.push({
                'instalment_month': installment?.instalment_month?.index ?? null,
                'instalment_year': installment?.instalment_year ?? null,
                'recovery_from': installment?.recovery_from?.value ?? null,
                'advance_amount': installment?.advance_amount ?? null,
                'status': installment?.status?.value ?? null,
            })
        });
        submit_data.instalment_history = (instalment_history)

        this.commonService.postDataRaw("employee/employee-advance-request",submit_data).subscribe(res => {
            this.spinner.hide();
            if (res.status == 'success') {
                this.toastr.success(res.message);
                this.fetchleaveRequest();
                this.cancelEntry();
            } else if (res.status == 'val_err') {
                this.toastr.error(Global.showValidationMessage(res.val_msg));
            } else {
                this.toastr.error(res.message);
            }

            event.target.classList.remove('btn-loading');
        }, (err) => {
            this.spinner.hide();
            event.target.classList.remove('btn-loading');
            this.toastr.error(Global.showServerErrorMessage(err));
        });
    }
}
updateData(event:any)
{
    this.advancerequestForm.markAllAsTouched();

    if (this.advancerequestForm.valid) {
        event.target.classList.add('btn-loading');
        this.spinner.show();
        let submit_data:any={
          advance_amount:this.advancerequestForm.value.advance_amount, advance_outstanding:this.advancerequestForm.value.advance_outstanding,
          payment_start_month:this.advancerequestForm.value.payment_start_month?this.advancerequestForm.value.payment_start_month.index.toString():this.editadvanceDetails.payment_start_month, 
          payment_start_year:this.advancerequestForm.value.payment_start_year?this.advancerequestForm.value.payment_start_year.toString():this.editadvanceDetails.payment_start_year,
          recovery_frequency:this.advancerequestForm.value.recovery_frequency?this.advancerequestForm.value.recovery_frequency?.value:this.editadvanceDetails?.recovery_frequency,
          recovery_from:this.advancerequestForm.value.recovery_from?this.advancerequestForm.value.recovery_from?.value:this.editadvanceDetails.recovery_from,
          remarks:this.advancerequestForm.value.remarks,
          no_of_instalments:this.advancerequestForm.value.no_of_instalments,
          emp_advance_id:this.advancerequestForm.value.emp_advance_id
        };
        let instalment_history: any = [];
        this.advancerequestForm.value.instalment_history.forEach((installment: any) => {
            instalment_history.push({
                'instalment_month': installment?.instalment_month?.index ?? null,
                'instalment_year': installment?.instalment_year ?? null,
                'recovery_from': installment?.recovery_from?.value ?? null,
                'advance_amount': installment?.advance_amount ?? null,
                'status': installment?.status?.value ?? null,
            })
        });
        submit_data.instalment_history = (instalment_history)
        this.commonService.postDataRaw("employee/employee-advance-request-update",submit_data).subscribe(res => {
            this.spinner.hide();
            if (res.status == 'success') {
                this.toastr.success(res.message);
                this.fetchleaveRequest();
                this.cancelEntry();
            } else if (res.status == 'val_err') {
                this.toastr.error(Global.showValidationMessage(res.val_msg));
            } else {
                this.toastr.error(res.message);
            }

            event.target.classList.remove('btn-loading');
        }, (err) => {
            this.spinner.hide();
            event.target.classList.remove('btn-loading');
            this.toastr.error(Global.showServerErrorMessage(err));
        });
    }
}
cancelEntry() {
    Global.resetForm(this.advancerequestForm);
    $('#advanceRequestModal').find('[data-dismiss="modal"]').click();
}

fetchleaveRequest(page: any = null) {
    return new Promise((resolve, reject) => {
      if (page != null) {
        this.paginationOptions.page = page;
      }

      this.spinner.show();
      this.commonService.postDataRaw("employee/employee-get-advance-list",{
        'pageno': this.paginationOptions.page,
      }).subscribe(res => {
        if (res.status == 'success') {
          this.advance_requests = res.advance_data.docs;
          this.paginationOptions = {
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
        } else {
          this.toastr.error(res.message);

          this.advance_requests = [];
          this.paginationOptions = {
            hasNextPage: false,
            hasPrevPage: false,
            limit: Global.DataTableLength,
            nextPage: null,
            page: 1,
            pagingCounter: 1,
            prevPage: null,
            totalDocs: 0,
            totalPages: 1,
          };
        }

        this.spinner.hide();
        Global.loadCustomScripts('customJsScript');
        resolve(true);
      }, (err) => {
        this.advance_requests = [];
        this.paginationOptions = {
          hasNextPage: false,
          hasPrevPage: false,
          limit: Global.DataTableLength,
          nextPage: null,
          page: 1,
          pagingCounter: 1,
          prevPage: null,
          totalDocs: 0,
          totalPages: 1,
        };

        this.spinner.hide();
        this.toastr.error(Global.showServerErrorMessage(err));
        Global.loadCustomScripts('customJsScript');
        resolve(true);
      });
    });
  }
  getEdit(item:any)
  {

     
    this.editadvanceDetails = item;
    this.advancerequestForm.patchValue({emp_advance_id:item._id,
      advance_outstanding: item.advance_outstanding ?? null,
      recovery_from:this.recovery_items.find((obj: any) => {
        return obj.value == item.recovery_from
    }),advance_amount:item.advance_amount,no_of_instalments:item.no_of_instalments,
      recovery_frequency:this.frequencies.find((obj: any) => {
        return obj.value == item.recovery_frequency
    }),remarks:item.remarks,payment_start_month:this.monthMaster.find((obj: any) => {
        return obj.index == item.payment_start_month
    }),payment_start_year:item.payment_start_year,payment_booking_date:item.payment_booking_date
    });
    let fields = ['advance_amount', 'recovery_frequency', 'payment_start_month', 'payment_start_year', 'payment_booking_date'];
    fields.forEach((control: any) => {
        this.advancerequestForm.get(control)?.disable();

        this.advancerequestForm.get(control)?.clearValidators();
        this.advancerequestForm.get(control)?.updateValueAndValidity();
    });

    this.advancerequestForm.get('advance_outstanding')?.setValidators([Validators.required, Validators.pattern("^[0-9]+(.[0-9]{0,2})?$")]);
    this.advancerequestForm.get('advance_outstanding')?.updateValueAndValidity();

    setTimeout(() => {
        this.generateInstallmentHistory({ prefillEditData: true })
    }, 500);



    $('#advanceRequest_btn').click();

  }
  generateInstallmentHistory({
    prefillEditData = <boolean>false
} = {}) {
    let comp_details: any = this.empDetail.company_financial_year;
    this.resetAllFormRows({
        formGroup: this.advancerequestForm,
        is_editing: true,
        array: ['instalment_history']
    })

    let valid: any = false
    if (this.editadvanceDetails) {
        valid = (
            this.advancerequestForm.get('no_of_instalments')?.valid &&
            this.advancerequestForm.get('recovery_from')?.valid
        );
    } else {
        valid = (
            this.advancerequestForm.get('advance_amount')?.valid &&
            this.advancerequestForm.get('no_of_instalments')?.valid &&
            this.advancerequestForm.get('recovery_frequency')?.valid &&
            this.advancerequestForm.get('recovery_from')?.valid &&
            this.advancerequestForm.get('payment_start_month')?.valid &&
            this.advancerequestForm.get('payment_start_year')?.valid
        );
    }

    if (valid === true && comp_details !== null) {
        let NO_OF_INSTALMENTS = this.advancerequestForm.value.no_of_instalments;
        let RECOVERY_FROM = this.advancerequestForm.value.recovery_from;
        let ADVANCE_AMOUNT = this.advancerequestForm.value.advance_amount;
        let OUTSTANDING_AMOUNT = this.advancerequestForm.value.advance_amount;
        let RECOVERY_FREQUENCY = this.advancerequestForm.value.recovery_frequency;
        let PAYMENT_START_MONTH = this.advancerequestForm.value.payment_start_month;
        let PAYMENT_START_YEAR = this.advancerequestForm.value.payment_start_year;

        // console.log('advancerequestForm ::: ', this.advancerequestForm)
        // console.log('advancerequestForm.value ::: ', this.advancerequestForm.value)
        // console.log('PAYMENT_START_YEARs ::: ', PAYMENT_START_YEAR)

        if (this.editadvanceDetails) {
            let completed_transactions: any[] = this.editadvanceDetails.instalment_history.filter((obj: any) => {
                return obj.status == 'complete';
            })

            if (parseInt(NO_OF_INSTALMENTS) < (completed_transactions.length + 1)) {
                // this.toastr.error("The number of installments cannot be less than the added earlier");
                this.toastr.error("The number of installments must be greater than " + completed_transactions.length);
                return;
            }
            ADVANCE_AMOUNT = this.editadvanceDetails.advance_amount;
            OUTSTANDING_AMOUNT = this.advancerequestForm.value.advance_outstanding; // Override the outstanding amount
            RECOVERY_FREQUENCY = this.frequencies.find((obj: any) => {
                return obj.value == this.editadvanceDetails.recovery_frequency
            });
            PAYMENT_START_MONTH = this.monthMaster.find((obj: any) => {
                return obj.index == this.editadvanceDetails.payment_start_month
            });
            PAYMENT_START_YEAR = this.editadvanceDetails.payment_start_year;
        }

        if (prefillEditData === true && this.editadvanceDetails) {

            this.editadvanceDetails.instalment_history.forEach((installment: any) => {
                this.addFormRows(this.advancerequestForm, 'instalment_history', {
                    'instalment_month': this.monthMaster.find((obj: any) => {
                        return obj.index == installment.instalment_month;
                    }) ?? null,
                    'instalment_year': installment.instalment_year,
                    'recovery_from': this.recovery_items.find((obj: any) => {
                        return obj.value == installment.recovery_from ?? null
                    }) ?? null,
                    'advance_amount': installment.advance_amount,
                    'status': this.statusMaster.find((obj: any) => {
                        return obj.value == installment.status
                    }),
                });
            });

            return;
        }


        const FYstartmonth = this.monthMaster.find((obj: any) => {
            return obj.value == this.datePipe.transform(comp_details, 'M')
        });

        if (!FYstartmonth) {
            this.toastr.error("Please add FY start month, from company settings");
            return;
        }

        let everyMonthInstallment = parseFloat(ADVANCE_AMOUNT) / parseInt(NO_OF_INSTALMENTS)

        if (this.editadvanceDetails) {
            let completed_transactions: any[] = this.editadvanceDetails.instalment_history.filter((obj: any) => {
                return obj.status == 'complete';
            })

            let installment_left: number = parseInt(NO_OF_INSTALMENTS) - completed_transactions.length;
            let amount_paid = completed_transactions.reduce(function (sum, obj) {
                return sum + parseFloat(obj.advance_amount);
            }, 0);

            // everyMonthInstallment = (parseFloat(ADVANCE_AMOUNT) - parseFloat(amount_paid)) / installment_left
            everyMonthInstallment = OUTSTANDING_AMOUNT / installment_left
        }

        if (!PAYMENT_START_YEAR || !PAYMENT_START_MONTH) {
            // console.log(!PAYMENT_START_YEAR || !PAYMENT_START_MONTH?.index);
            // console.log('PAYMENT_START_YEAR', PAYMENT_START_YEAR);
            // console.log('PAYMENT_START_MONTH?.index', PAYMENT_START_MONTH?.index);
            return;
        }

        var startDate = new Date(PAYMENT_START_YEAR, PAYMENT_START_MONTH.index, 1);
      
        for (let index = 0; index < this.advancerequestForm.value.no_of_instalments; index++) {
            let date: any = null;
            switch (RECOVERY_FREQUENCY?.value) {
                case "monthly":
                    date = new Date(startDate.setMonth(startDate.getMonth() + (index == 0 ? 0 : 1)));
                    break;

                case "quaterly":
                    date = new Date(startDate.setMonth(startDate.getMonth() + (index == 0 ? 0 : 3)));
                    break;

                case "halfyearly":
                    date = new Date(startDate.setMonth(startDate.getMonth() + (index == 0 ? 0 : 6)));
                    break;

                case "annually":
                    date = new Date(startDate.setFullYear(startDate.getFullYear() + (index == 0 ? 0 : 1)));
                    break;
            }

            let document = {
                'instalment_month': this.monthMaster.find((obj: any) => {
                    return obj.index == date.getMonth();
                }) ?? null,
                'instalment_year': date.getFullYear(),
                'recovery_from': this.recovery_items.find((obj: any) => {
                    return obj.value == RECOVERY_FROM?.value ?? null
                }) ?? null,
                'advance_amount': everyMonthInstallment.toFixed(2),
                'status': this.statusMaster.find((obj: any) => {
                    return obj.value == 'pending'
                }),
            }

            // Bind if the installment is already paid
            if (this.editadvanceDetails) {
                let history: any = this.editadvanceDetails.instalment_history.find((obj: any) => {
                    return obj.status == 'complete' && obj.instalment_month == date.getMonth()
                })

                if (history) {
                    document.recovery_from = this.recovery_items.find((obj: any) => {
                        return obj.value == history.recovery_from ?? null
                    }) ?? null

                    document.status = this.statusMaster.find((obj: any) => {
                        return obj.value == 'complete'
                    });

                    document.advance_amount = history.advance_amount
                }
            }

            this.addFormRows(this.advancerequestForm, 'instalment_history', document);
        }
    }
}
resetAllFormRows({
  formGroup = <UntypedFormGroup>this.advancerequestForm,
  is_editing = <Boolean>false,
  array = <any[]>['instalment_history']
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

fetchIndexOfControl(formGroup: UntypedFormGroup, type: any, s_key: any, s_value: any) {
  let arr: any[] = formGroup.value?.[type];
  if (Array.isArray(arr)) {
      let index: any = arr.findIndex(x => x[s_key] == s_value);
      return index;
  }

  return false;
}
initFormRows(type: any, data: any = null) {
  switch (type) {
      case 'instalment_history':
          return this.formBuilder.group({
              instalment_month: [data?.instalment_month ?? null, Validators.compose([Validators.required])],
              instalment_year: [data?.instalment_year ?? null, Validators.compose([Validators.required])],
              recovery_from: [data?.recovery_from ?? null, Validators.compose([Validators.required])],
              advance_amount: [data?.advance_amount ?? null, Validators.compose([Validators.required, Validators.pattern("^[0-9]+(.[0-9]{0,2})?$")])],
              status: [data?.status ?? null, Validators.compose([Validators.required])],
          });
          break;

      default:
          return this.formBuilder.group({});
          break;
  }
}
getAccount()
{
  this.spinner.show();
  this.commonService.postDataRaw("employee/get-account","").subscribe((res) => {
      if (res.status == 'success') {
      this.empDetail=res?.employee_data[0];
      } else {
          this.toastr.error(res.message);
      }

      this.spinner.hide();
  }, (err) => {
      this.toastr.error(Global.showServerErrorMessage(err));
      this.spinner.hide();
  })
}

}
