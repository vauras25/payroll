import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { disableDebugTools, Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import * as Global from 'src/app/globals';
import { AdminService } from 'src/app/services/admin.service';
import swal from 'sweetalert2';
import * as ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'admin-app-credit-invoice',
  templateUrl: './credit-invoice.component.html',
  styleUrls: ['./credit-invoice.component.css']
})

export class ADCreditInvoiceComponent implements OnInit {
  Global = Global;
  Editor = ClassicEditor;
  creditInvoiceForm: UntypedFormGroup;
  currentInvoice: any = null;

  constructor(
    public formBuilder: UntypedFormBuilder,
    private titleService: Title,
    private toastr: ToastrService,
    private adminService: AdminService,
    private spinner: NgxSpinnerService

  ) {
    this.creditInvoiceForm = formBuilder.group({
      // template_name: [null, Validators.compose([Validators.required])],
      credit_inv_logo: [null, Validators.compose([])],
      credit_inv_logo_source: [null, Validators.compose([])],
      com_address: [null, Validators.compose([Validators.required])],
      com_state_name: [null, Validators.compose([Validators.required])],
      com_state_code: [null, Validators.compose([Validators.required])],
      invoice_prefix: [null, Validators.compose([Validators.required])],
      mode_of_pay: [null, Validators.compose([Validators.required])],
      terms_of_delivery: [null, Validators.compose([Validators.required])],
      entity_name: [null, Validators.compose([Validators.required])],
      entity_description: [null, Validators.compose([Validators.required])],
      hsn_sac: [null, Validators.compose([Validators.required])],
      com_pan: [null, Validators.compose([Validators.required])],
      declaration: [null, Validators.compose([Validators.required])],
      com_bank_details: [null, Validators.compose([Validators.required])],
      footer_text: [null, Validators.compose([Validators.required])],
      // status: [null, Validators.compose([Validators.required])],
    });
  }

  ngOnInit() {
    this.titleService.setTitle("Credit Invoice Template - " + Global.AppName);
    this.fetchTemplate();
  }

  cancelEntry() {
    Global.resetForm(this.creditInvoiceForm);
    this.fetchTemplate()
  }

  submitTemplate(event: any) {
    if (this.creditInvoiceForm.valid) {
      event.target.classList.add('btn-loading');

      this.adminService.submitCreditInvoiceTemplate({
        'credit_inv_logo': this.creditInvoiceForm.value.credit_inv_logo ? this.creditInvoiceForm.value.credit_inv_logo_source : "",
        // 'credit_inv_logo_source': this.creditInvoiceForm.value.credit_inv_logo_source ?? "",
        'com_address': this.creditInvoiceForm.value.com_address ?? "",
        'com_state_name': this.creditInvoiceForm.value.com_state_name ?? "",
        'com_state_code': this.creditInvoiceForm.value.com_state_code ?? "",
        'invoice_prefix': this.creditInvoiceForm.value.invoice_prefix ?? "",
        'mode_of_pay': this.creditInvoiceForm.value.mode_of_pay ?? "",
        'terms_of_delivery': this.creditInvoiceForm.value.terms_of_delivery ?? "",
        'entity_name': this.creditInvoiceForm.value.entity_name ?? "",
        'entity_description': this.creditInvoiceForm.value.entity_description ?? "",
        'hsn_sac': this.creditInvoiceForm.value.hsn_sac ?? "",
        'com_pan': this.creditInvoiceForm.value.com_pan ?? "",
        'declaration': this.creditInvoiceForm.value.declaration ?? "",
        'com_bank_details': this.creditInvoiceForm.value.com_bank_details ?? "",
        'footer_text': this.creditInvoiceForm.value.footer_text ?? "",

        'template_name': "TEMPLATE ONE",
        'status': 'active',
      }).subscribe(res => {
        if (res.status == 'success') {
          this.toastr.success(res.message);
          this.cancelEntry();
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

  templateData:any = null
  fetchTemplate() {
    this.spinner.show();
    this.adminService.fetchCreditInvoiceTemplate({}).subscribe(res => {
      if (res.status == 'success') {
        this.currentInvoice = res?.template_list ?? null;
        this.creditInvoiceForm.patchValue({
          'com_address': res?.template_list?.com_address ?? null,
          'com_state_name': res?.template_list?.com_state_name ?? null,
          'com_state_code': res?.template_list?.com_state_code ?? null,
          'invoice_prefix': res?.template_list?.invoice_prefix ?? null,
          'mode_of_pay': res?.template_list?.mode_of_pay ?? null,
          'terms_of_delivery': res?.template_list?.terms_of_delivery ?? null,
          'entity_name': res?.template_list?.entity_name ?? null,
          'entity_description': res?.template_list?.entity_description ?? null,
          'hsn_sac': res?.template_list?.hsn_sac ?? null,
          'com_pan': res?.template_list?.com_pan ?? null,
          'declaration': res?.template_list?.declaration ?? null,
          'com_bank_details': res?.template_list?.com_bank_details ?? null,
          'footer_text': res?.template_list?.footer_text ?? null,
        })
        this.templateData =this.creditInvoiceForm.value
      } else {
        this.toastr.error(res.message);
      }

      this.spinner.hide();
    }, (err) => {
      this.spinner.hide();
      this.toastr.error("Internal server error occured. Please try again later.");
    });
  }

  onImageChanged(event: any) {
    if (event.target.files.length > 0) {
      const file = event.target.files[0];
      this.creditInvoiceForm.patchValue({
        credit_inv_logo_source: file
      })
    }
  }

  viewCurrTemplate(e:any){
    try {
      $("#viewTemplateModalButton").click()
    } catch (err:any) {
      this.toastr.error(err?.message ?? err ?? "Something went wrong!")
    }
  }
}
