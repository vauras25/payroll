import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
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
import { CommonService } from 'src/app/services/common.service';
import { fileSizeValidator } from "src/app/globals";

@Component({
  selector: 'app-bank-details',
  templateUrl: './bank-details.component.html',
})
export class BankDetailsComponent implements OnInit {
  @Input() isReadOnly:boolean;
  @Output() submitbankDetails = new EventEmitter<any>();
  Global = Global;
  operation: any;
  employee_id: any;
  @Input() employee_details: any;
  employeeBankForm: UntypedFormGroup;
  accountTypeMaster: any[] = [];
  cancel_cheque_file:any='';
  @Input() max_upload_limit:any ='';
  @Input() net_uploaded_size:any ='';
  filesNum: any;
  fileSize: number;
  constructor(
    public formBuilder: UntypedFormBuilder,
    private titleService: Title,
    private toastr: ToastrService,
    private router: Router,
    private companyuserService: CompanyuserService,
    private spinner: NgxSpinnerService,
    private activatedRoute: ActivatedRoute,
    private datePipe: DatePipe,
    public AppComponent: AppComponent,
    public commonService:CommonService
) {
    this.employeeBankForm = formBuilder.group({
        name_on_passbook: [null, Validators.compose([])],
        bank_name: [null, Validators.compose([])],
        branch_name: [null, Validators.compose([])],
        branch_address: [null, Validators.compose([])],
        branch_pin: [null, Validators.compose([])],
        account_no: [null, Validators.compose([])],
        account_no_confirmation: [null, Validators.compose([])],
        account_type: [null, Validators.compose([])],
        ifsc_code: [null, Validators.compose([])],
        micr_no: [null, Validators.compose([])],
        cancel_cheque: [null, Validators.compose([])],
        cancel_cheque_file: [null, Validators.compose([])],
    });

    this.accountTypeMaster = [
        { value: 'saving', description: 'Savings Account' },
        { value: 'current', description: 'Current Account' },
    ];
}

ngOnInit(): void {
    this.titleService.setTitle("Employees - " + Global.AppName);

    this.activatedRoute.params.subscribe(
        params => this.employee_id = params['employee_id'] ?? null
    )
    this.fetchEmployeeDetails();

}
ngOnChanges()
{
    this.fetchEmployeeDetails();

}

updateEmployeeBankDetails(event: any) {
    this.employeeBankForm.markAllAsTouched();
    Global.scrollToQuery("p.error-element");

    if (this.employeeBankForm.valid) {
        if (this.employeeBankForm.value.account_no && (this.employeeBankForm.value.account_no !== this.employeeBankForm.value.account_no_confirmation)) {
            this.toastr.error("Account number confirmation does't matched");
            return;
        }
        this.spinner.show();

        this.commonService.postData("employee/update-employee-bank-details",{
            'name_on_passbook': this.employeeBankForm?.value?.name_on_passbook ?? "",
            'bank_name': this.employeeBankForm?.value?.bank_name ?? "",
            'branch_name': this.employeeBankForm?.value?.branch_name ?? "",
            'branch_address': this.employeeBankForm?.value?.branch_address ?? "",
            'branch_pin': this.employeeBankForm?.value?.branch_pin ?? "",
            'account_no': this.employeeBankForm?.value?.account_no ?? "",
            'account_type': this.employeeBankForm?.value?.account_type?.value ?? "",
            'ifsc_code': this.employeeBankForm?.value?.ifsc_code ?? "",
            'micr_no': this.employeeBankForm?.value?.micr_no ?? "",
            'cancel_cheque': this.employeeBankForm?.value?.cancel_cheque_file ?? "",
            'employee_id': this.employee_id
        }).subscribe(res => {
          this.spinner.hide();

            if (res.status == 'success') {
                this.toastr.success(res.message);
                this.cancelEntry();
                this.submitbankDetails.emit(true);
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

onFileChanged(event: any, formGroup: UntypedFormGroup, file: any, target: any) {
    if (event.target.files.length > 0) {
        const file = event.target.files[0];
        let max_upload_file_size=this.max_upload_limit-this.net_uploaded_size;
        if(max_upload_file_size<0)
        {
            max_upload_file_size=0;
        }
        this.employeeBankForm?.get("cancel_cheque")?.setValidators([fileSizeValidator(event.target.files[0],Global.maxFileSize(max_upload_file_size))]);
        this.employeeBankForm?.get("cancel_cheque")?.updateValueAndValidity();
        formGroup.patchValue({
            [target]: file
        });
    }
}

fetchEmployeeDetails() {
        this.employeeBankForm.patchValue({
            'bank_name': this.employee_details.bank_details?.bank_name ?? null,
            'branch_name': this.employee_details.bank_details?.branch_name ?? null,
            'branch_address': this.employee_details.bank_details?.branch_address ?? null,
            'branch_pin': this.employee_details.bank_details?.branch_pin ?? null,
            'account_no': this.employee_details.bank_details?.account_no ?? null,
            'account_no_confirmation': this.employee_details.bank_details?.account_no ?? null,
            'account_type': this.accountTypeMaster.find((obj: any) => {
                return obj.value === this.employee_details.bank_details?.account_type
            }) ?? null,
            'ifsc_code': this.employee_details.bank_details?.ifsc_code ?? null,
            'micr_no': this.employee_details.bank_details?.micr_no ?? null,
        })
        this.cancel_cheque_file=this.employee_details.bank_details?.cancel_cheque;
      
        if(isNaN(this.max_upload_limit))
        {
            this.max_upload_limit=0;
        }
        if(isNaN(this.net_uploaded_size))
        {
            this.net_uploaded_size=0;
        }
        if(this.net_uploaded_size>=this.max_upload_limit)
        {
            this.employeeBankForm.controls['cancel_cheque'].disable();

        }
  
  
}

cancelEntry() {
    Global.resetForm(this.employeeBankForm);
}


}
