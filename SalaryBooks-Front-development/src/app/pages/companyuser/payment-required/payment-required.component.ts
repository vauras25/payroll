import { Component, OnInit } from '@angular/core';
import {
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from 'src/app/services/auth.service';
import { CompanyuserService } from 'src/app/services/companyuser.service';
import * as Global from 'src/app/globals';
import { NgxSpinnerService } from 'ngx-spinner';
import { WindowRefService } from 'src/app/services/window-ref.service';
import swal from 'sweetalert2';
import PaginationOptions from 'src/app/models/PaginationOptions';
import { Router } from '@angular/router';

@Component({
  selector: 'app-payment-required',
  templateUrl: './payment-required.html',
  styles: [
    `
      .card,
      .modal-content {
        display: block;
        width: 100%;
        max-width: 480px;
      }
    `,
  ],
})
export class PaymentRequiredComponent implements OnInit {
  Global = Global;
  creditAmountPerToken: number = 0;
  transactionHistory: any[] = [];
  gstPercentage: number = 0;
  creditForm: UntypedFormGroup;
  userDetails: any = null;
  appliedCoupon: any = null;
  paginationOptions: PaginationOptions = Global.resetPaginationOption();
  rowCheckedAll: any = false;
  uncheckedRowIds: any = [];
  checkedRowIds: any = [];
  creditPurchasing: boolean = false;
  constructor(
    private authService: AuthService,
    protected companyuserService: CompanyuserService,
    private toastr: ToastrService,
    public formBuilder: UntypedFormBuilder,
    private spinner: NgxSpinnerService,
    private winRef: WindowRefService,
    private router:Router
  ) {
    if(!localStorage.getItem("payment-required")) router.navigateByUrl('/company')
    if (localStorage.getItem('payroll-companyuser-user')) {
      this.userDetails = localStorage.getItem('payroll-companyuser-user');
      this.userDetails = JSON.parse(this.userDetails);
    }

    this.creditForm = formBuilder.group({
      credit_amount: [null, Validators.compose([Validators.required])],
      credit_coupon: [
        null,
        Validators.compose([
          Validators.required,
          Validators.pattern('^[0-9]*$'),
        ]),
      ],
      payable_amount: [null, Validators.compose([Validators.required])],
      coupon_code: [null, Validators.compose([])],
    });
  }

  ngOnInit(): void {}

  getAccountDetails() {
    this.authService.getCompanyUserAccountDetails().subscribe({
      next: (res) => {
        if (res.status == 'success') {
          this.userDetails = res.company_det;
          localStorage.removeItem('payment-required');
          localStorage.setItem(
            'payroll-companyuser-user',
            JSON.stringify(res.company_det)
          );
          localStorage.setItem(
            'payroll-companyuser-details',
            JSON.stringify(res.company_det.com_det)
          );
          this.router.navigateByUrl('/company')
        }
      },
      error:()=>{
        // this.creditPurchasing=false
      }
    });
  }

  initCreditPurchase() {
    this.removeCouponCode();
    Global.resetForm(this.creditForm);

    this.spinner.show();
    this.companyuserService.getCreditSettingsValue().subscribe(
      (res) => {
        if (res.status == 'success') {
          if (
            res.settings_value?.credit_amount &&
            res.settings_value?.credit_value
          ) {
            this.creditAmountPerToken =
              parseFloat(res.settings_value?.credit_amount) /
              parseFloat(res.settings_value?.credit_value);
            this.gstPercentage = parseFloat(res.settings_value?.gst_amount);
            this.creditPurchasing = true;
            // $('#creditPurchaseModalButton')?.click();
          }
        } else {
          this.creditPurchasing = false;
          this.toastr.error(res.message);
        }
        this.spinner.hide();
      },
      (err) => {
        this.creditPurchasing = false;

        this.toastr.error(Global.showServerErrorMessage(err));
        this.spinner.hide();
      }
    );
  }

  calculatePayableTotal(type: any) {
    switch (type) {
      case 'credit_amount':
        if (this.creditForm.value.credit_amount) {
          let credit_amount: any = parseFloat(
            this.creditForm.value.credit_amount
          );
          let payable_amount: any = parseFloat(credit_amount);

          payable_amount +=
            (this.gstPercentage / 100) * parseFloat(payable_amount);

          this.creditForm.patchValue({
            credit_coupon: credit_amount / this.creditAmountPerToken,
            payable_amount: payable_amount,
          });
        }
        break;

      case 'credit_coupon':
        if (this.creditForm.value.credit_coupon) {
          let credit_coupon = parseFloat(this.creditForm.value.credit_coupon);
          let payable_amount: any = credit_coupon * this.creditAmountPerToken;

          payable_amount +=
            (this.gstPercentage / 100) * parseFloat(payable_amount);

          this.creditForm.patchValue({
            credit_amount: (credit_coupon * this.creditAmountPerToken).toFixed(
              2
            ),
            payable_amount: payable_amount,
          });
        }
        break;

      default:
        this.toastr.error('Unsupported Type');
        break;
    }
  }

  purchaseCredit(event: any) {
    if (this.creditForm.valid) {
      event.target.classList.add('btn-loading');

      this.companyuserService
        .getCreditPurchaseOrderID({
          coupon_amount: this.creditForm.value.payable_amount,
        })
        .subscribe(
          (res) => {
            if (res.status == 'success') {
              if (res?.message?.id) this.payWithRazorPay(res?.message);
              else this.toastr.error('The OrderID not generated');
            } else {
              this.toastr.error(res.message);
            }

            event.target.classList.remove('btn-loading');
          },
          (err) => {
            this.toastr.error(Global.showServerErrorMessage(err));
            event.target.classList.remove('btn-loading');
          }
        );
    }
  }

  payWithRazorPay(document: any) {
    const options: any = {
      key: Global.RazorpayDoc.key,
      amount: document?.amount ?? 0,
      currency: Global.RazorpayDoc.currency,
      name: Global.RazorpayDoc.company_name,
      description: 'Payment for Credit Token',
      image: Global.RazorpayDoc.company_logo,
      order_id: document.id,
      modal: {
        escape: false,
      },
      notes: {},
      theme: {
        color: Global.RazorpayDoc.theme.color,
      },
    };

    options.handler = (response: any, error: any) => {
      options.response = response;
      this.verifyRazorPayment(response);
    };

    options.modal.ondismiss = () => {
      swal.fire('Cancelled', 'Transaction cancelled', 'error');
    };

    const rzp = new this.winRef.nativeWindow.Razorpay(options);
    rzp.open();
  }

  verifyRazorPayment(response: any) {
    let creditqty = 0;
    if (this.creditForm.value.credit_coupon)
      creditqty += parseInt(this.creditForm.value.credit_coupon);
    if (this.appliedCoupon?.coupon_amount)
      creditqty += parseInt(this.appliedCoupon?.coupon_amount);

    this.spinner.show();
    this.companyuserService
      .verifyCreditPurchasePayment({
        razorpay_order_id: response?.razorpay_order_id ?? '',
        razorpay_payment_id: response?.razorpay_payment_id ?? '',
        razorpay_signature: response?.razorpay_signature ?? '',
        credit_amount: this.creditForm.value.credit_amount ?? 0,
        credit_qty: creditqty,
        coupon_code: this.appliedCoupon?.coupon_code ?? '',
      })
      .subscribe(
        (res) => {
          if (res.status == 'success') {
            Global.resetForm(this.creditForm);
            this.appliedCoupon = null;
            swal.fire('Success', res.message, 'success').then(() => {
              this.creditPurchasing = false;
            });
            this.getAccountDetails();
          } else {
            swal.fire('Cancelled', res.message, 'error');
            this.creditPurchasing = false;
          }
          this.spinner.hide();
        },
        (err) => {
          this.toastr.error(Global.showServerErrorMessage(err));
          this.spinner.hide();
        }
      );
  }

  applyCouponCode(event: any) {
    if (this.creditForm.valid && this.creditForm.value.coupon_code) {
      event.target.classList.add('btn-loading');
      this.companyuserService
        .verifyCreditPurchaseCoupon({
          coupon_code: this.creditForm.value.coupon_code ?? 0,
          purchase_amount: this.creditForm.value.payable_amount ?? 0,
        })
        .subscribe(
          (res) => {
            if (res.status == 'success') {
              this.appliedCoupon = res?.coupon_data ?? null;
            } else {
              this.toastr.error(res.message);
              this.removeCouponCode();
            }
            event.target.classList.remove('btn-loading');
          },
          (err) => {
            this.removeCouponCode();
            this.toastr.error(Global.showServerErrorMessage(err));
            event.target.classList.remove('btn-loading');
          }
        );
    }
  }

  removeCouponCode() {
    this.appliedCoupon = null;
    this.creditForm.patchValue({
      coupon_code: null,
    });
  }
}
