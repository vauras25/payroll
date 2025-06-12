import { DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { disableDebugTools, Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import * as Global from 'src/app/globals';
import { AdminService } from 'src/app/services/admin.service';
import swal from 'sweetalert2';

@Component({
  selector: 'admin-app-subscription-credit',
  templateUrl: './subscription-credit.component.html',
  styleUrls: ['./subscription-credit.component.css']
})
export class ADSubscriptionCreditComponent implements OnInit {
  creditForm: UntypedFormGroup;

  constructor(
    public formBuilder: UntypedFormBuilder,
    private titleService: Title,
    private toastr: ToastrService,
    private router: Router,
    private adminService: AdminService,
    private spinner: NgxSpinnerService,
    private datePipe: DatePipe
  ) {
    this.creditForm = formBuilder.group({
      credit_value: [null, Validators.compose([Validators.required, Validators.pattern("^[0-9]+(.[0-9]{0,2})?$")])],
      credit_amount: [null, Validators.compose([Validators.required, Validators.pattern("^[0-9]+(.[0-9]{0,2})?$")])],
      gst_amount: [null, Validators.compose([Validators.required, Validators.pattern("^[0-9]+(.[0-9]{0,2})?$")])],
      payable_amount: [{ value: null, disabled: true }],
    });


    this.creditForm.get('credit_amount')?.valueChanges
      .subscribe(val => {
        setTimeout(() => {
          this.calculatePayableAmount()
        }, 500);
      });

    this.creditForm.get('gst_amount')?.valueChanges
      .subscribe(val => {
        setTimeout(() => {
          this.calculatePayableAmount()
        }, 500);
      });
  }

  ngOnInit() {
    this.titleService.setTitle("Subscription Credit Management - " + Global.AppName);

    this.fetchValue();
  }

  calculatePayableAmount() {
    let payable_amount: any = 0;

    if (this.creditForm.value.credit_amount)
      payable_amount += parseFloat(this.creditForm.value.credit_amount);

    if (payable_amount && this.creditForm.value.gst_amount)
      payable_amount += ((parseFloat(this.creditForm.value.gst_amount) / 100) * parseFloat(payable_amount))

    this.creditForm.patchValue({
      'payable_amount': parseFloat(payable_amount).toFixed(2)
    })
  }

  fetchValue() {
    this.spinner.show();

    this.adminService.fetchSubscriptionCreditValue()
      .subscribe(res => {
        if (res.status == 'success') {
          this.creditForm.patchValue({
            'credit_value': res?.settings_value?.credit_value ?? null,
            'credit_amount': res?.settings_value?.credit_amount ?? null,
            'gst_amount': res?.settings_value?.gst_amount ?? null,
          })
        } else {
          this.toastr.error(res.message);
        }

        this.spinner.hide();
      }, (err) => {
        this.toastr.error("Internal server error occured. Please try again later.");
        this.spinner.hide();
      });
  }

  update(event: any) {
    if (this.creditForm.valid) {
      event.target.classList.add('btn-loading');

      this.adminService.updateSubscriptionCreditValue({
        'credit_value': this.creditForm.value.credit_value,
        'credit_amount': this.creditForm.value.credit_amount,
        'gst_amount': this.creditForm.value.gst_amount,
      }).subscribe(res => {
        if (res.status == 'success') {
          Global.resetForm(this.creditForm);
          this.fetchValue();
          this.toastr.success(res.message);
        } else if (res.status == 'val_err') {
          this.toastr.error(Global.showValidationMessage(res.val_msg));
        } else {
          this.toastr.error(res.message);
        }

        event.target.classList.remove('btn-loading');
      }, (err) => {
        event.target.classList.remove('btn-loading');
        this.toastr.error("Internal server error occured. Please try again later.");
      });
    }
  }
}
