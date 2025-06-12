import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import * as Global from 'src/app/globals';
import PaginationOptions from 'src/app/models/PaginationOptions';
import TableFilterOptions from 'src/app/models/TableFiilterOptions';
import { CompanyuserService } from 'src/app/services/companyuser.service';
import swal from 'sweetalert2';

@Component({
    selector: 'app-companyuser-instruction-report-data',
    templateUrl: './instruction-report-data.component.html',
    styleUrls: ['./instruction-report-data.component.css']
})
export class CMPInstructionReportDataComponent implements OnInit {
    Global = Global;
    paymentInstTableFilterOptions: TableFilterOptions = Global.resetTableFilterOptions();
    paymentInstPaginationOptions: PaginationOptions = Global.resetPaginationOption();
    paymentInstFilter: any = null;
    paymentInsts: any[] = []

    dtOptions: DataTables.Settings = {};
    sheetConfirmationDetails: any = null;
    confirmationForm: UntypedFormGroup;

    constructor(
        private titleService: Title,
        private toastr: ToastrService,
        private companyuserService: CompanyuserService,
        private spinner: NgxSpinnerService,
        public formBuilder: UntypedFormBuilder,
        private router: Router
        ) {
          if (
            !Global.checkCompanyModulePermission({
              company_module: 'payment_instructions',
              company_sub_module: 'instructions_listing',
              company_sub_operation: ['view'],
              company_strict: true
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
        this.confirmationForm = formBuilder.group({
            remarks: [null, Validators.compose([Validators.required])],
        });
    }

    ngOnInit(): void {
        this.titleService.setTitle("Payment Instructions - " + Global.AppName);
        // this.fetch();
    }

    getPaymentInstructions({
        page = <any>null,
        loading = <boolean>true,
        filter = <any>null,
        options = <TableFilterOptions>this.paymentInstTableFilterOptions,
    } = {}) {
        return new Promise((resolve, reject) => {
            this.paymentInstTableFilterOptions = options;

            if (page != null) this.paymentInstPaginationOptions.page = page;
            if (filter != null) this.paymentInstFilter = filter

            let payload: any = {
                'pageno': this.paymentInstPaginationOptions.page,
                'perpage': this.paymentInstPaginationOptions.limit,
                'wage_month': this.paymentInstFilter?.month?.index ?? "",
                'wage_year': this.paymentInstFilter?.year?.value ?? "",
                'hod_id': this.paymentInstFilter?.hod_id ?? null,
                'department_id': this.paymentInstFilter?.department_id ?? null,
                'designation_id': this.paymentInstFilter?.designation_id ?? null,
                'branch_id': this.paymentInstFilter?.branch_id ?? null,
                'searchkey': this.paymentInstFilter?.searchkey ?? '',
                'status': this.paymentInstFilter?.bankinst_status ?? 'active',
                'pay_type': this.paymentInstFilter?.bankinst_pay_type ?? 'salary',
            };

            if (loading == true) this.spinner.show();
            this.companyuserService.getInstructionReportData(payload).subscribe(res => {
                if (res.status == 'success') {
                    var docs: any[] = res?.bank_payment_data?.docs ?? [];

                    docs.forEach((doc: any) => {
                        doc.checked = this.isRowChecked(doc._id);
                    });

                    this.paymentInsts = docs;
                    this.paymentInstPaginationOptions = {
                        hasNextPage: res.bank_payment_data.hasNextPage,
                        hasPrevPage: res.bank_payment_data.hasPrevPage,
                        limit: res.bank_payment_data.limit,
                        nextPage: res.bank_payment_data.nextPage,
                        page: res.bank_payment_data.page,
                        pagingCounter: res.bank_payment_data.pagingCounter,
                        prevPage: res.bank_payment_data.prevPage,
                        totalDocs: res.bank_payment_data.totalDocs,
                        totalPages: res.bank_payment_data.totalPages,
                    };

                    resolve(true);
                } else {
                    if (res.status == 'val_err') this.toastr.error(Global.showValidationMessage(res.val_msg));
                    else this.toastr.error(res.message);

                    this.paymentInsts = [];
                    this.paymentInstPaginationOptions = Global.resetPaginationOption();

                    this.rowCheckedAll = false;
                    this.checkedRowIds = [];
                    this.uncheckedRowIds = [];

                    resolve(false);
                }

                if (loading == true) this.spinner.hide();
                Global.loadCustomScripts('customJsScript');
            }, (err) => {
                this.toastr.error(Global.showValidationMessage(Global.showServerErrorMessage(err)));
                this.paymentInsts = [];
                this.paymentInstPaginationOptions = Global.resetPaginationOption();
                this.rowCheckedAll = false;
                this.checkedRowIds = [];
                this.uncheckedRowIds = [];
                if (loading == true) this.spinner.hide();
                Global.loadCustomScripts('customJsScript');
                resolve(false);
            });
        })
    }

    /**
     * Multiple Row Checkbox Functions
     * -------------------------------     
     */
    rowCheckedAll: Boolean = false;
    checkedRowIds: any[] = [];
    uncheckedRowIds: any[] = [];

    private isRowChecked(rowId: any) {
        if (!this.rowCheckedAll) return this.checkedRowIds.indexOf(rowId) >= 0 ? true : false;
        else return this.uncheckedRowIds.indexOf(rowId) >= 0 ? false : true;
    }

    rowCheckBoxChecked(event: any, row: any) {
        let rowId: any = row._id;
        let checkbox: any = document.querySelectorAll('[data-checkbox-id="' + rowId + '"]');

        if (checkbox.length > 0) {
            if (checkbox[0].checked) {
                this.uncheckedRowIds.splice(this.uncheckedRowIds.indexOf(rowId), 1);
                if (!this.rowCheckedAll) {
                    if (!this.checkedRowIds.includes(rowId)) {
                        this.checkedRowIds.push(rowId);
                    }
                }
            }
            else {
                this.checkedRowIds.splice(this.checkedRowIds.indexOf(rowId), 1);
                if (this.rowCheckedAll) {
                    if (!this.uncheckedRowIds.includes(rowId)) {
                        this.uncheckedRowIds.push(rowId);
                    }
                }
            }
        }
    }

    allRowsCheckboxChecked(event: any) {
        if (this.rowCheckedAll) {
            this.uncheckedRowIds.length = 0;
            this.rowCheckedAll = false;
        } else {
            this.checkedRowIds.length = 0;
            this.rowCheckedAll = true;
        }

        this.getPaymentInstructions({ page: 1 })
    }

    /**
     * Bank Confirmation Sumission Methods
     * -----------------------------------     
     */

    initSheetConfirmation(item: any) {
        this.cancelSheetConfirmation();
        this.sheetConfirmationDetails = item;
        $('#confirmationModalButton')?.click();
    }

    cancelSheetConfirmation() {
        this.sheetConfirmationDetails = null;
        Global.resetForm(this.confirmationForm);
        $('#confirmationModal')?.find('[data-dismiss="modal"]')?.click();
    }

    confirmSheet(event: any) {
        if (this.confirmationForm.valid) {
            event.target.classList.add('btn-loading');
            this.companyuserService.confirmInstructionReportData({
                'referance_file_id': this.sheetConfirmationDetails?._id,
                'remarks': this.confirmationForm?.value?.remarks,
                'sheet_type':this.paymentInstFilter?.bankinst_pay_type ?? 'salary'
            }).subscribe(res => {
                event.target.classList.remove('btn-loading');
                if (res.status == 'success') {
                    this.toastr.success(res.message);
                    this.getPaymentInstructions();                        
                    this.cancelSheetConfirmation();
                } else {
                    this.toastr.error(res.message);
                }
            }, (err) => {
                event.target.classList.remove('btn-loading');
                this.toastr.error(Global.showServerErrorMessage(err));
            });
        }
    }

    /**
     * Bank Confirmation Delete Methods
     * --------------------------------    
     */

    deleteSheet(item: any) {
        swal.fire({
            title: 'Are you sure want to delete?',
            text: 'You will not be able to reverse your action!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'No, cancel it'
        }).then((result) => {
            if (result.value) {
                this.spinner.show();
                this.companyuserService.deleteInstructionReportData({
                    'referance_file_id': item?._id,
                }).subscribe(res => {
                    this.spinner.hide();
                    if (res.status == 'success') {
                        this.toastr.success(res.message);
                        this.getPaymentInstructions();                        
                    } else {
                        this.toastr.error(res.message);
                    }
                }, (err) => {
                    this.spinner.hide();
                    this.toastr.error(Global.showServerErrorMessage(err));
                });
            }
        })
    }

    async downloadInsReport(_id:string, file_id:string){
        try {
            this.spinner.show();
            await this.companyuserService.downloadFile('download-bank-payment-data',`Payment Instructions of file no ${file_id}` , {
                bank_instruction_id: _id,
                type:"download"
            })
        } catch (err:any) {
            this.toastr.error(err?.message || err)
        } finally {
            this.spinner.hide()
        }
    }
}
