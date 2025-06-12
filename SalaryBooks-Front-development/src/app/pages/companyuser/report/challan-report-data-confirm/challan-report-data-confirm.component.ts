import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import * as Global from 'src/app/globals';
import { CompanyuserService } from 'src/app/services/companyuser.service';

@Component({
    selector: 'app-companyuser-challan-report-data-confirm',
    templateUrl: './challan-report-data-confirm.component.html',
    styleUrls: ['./challan-report-data-confirm.component.css']
})
export class CMPChallanReportDataConfirmComponent implements OnInit {
    Global = Global;
    fileId: any = null;
    fileData: any = null;
    companyData: any = null;
    pfConfirmationForm: UntypedFormGroup;
    esicConfirmationForm: UntypedFormGroup;
    challanType: string = "";

    constructor(
        private activatedRoute: ActivatedRoute,
        private titleService: Title,
        private companyuserService: CompanyuserService,
        private spinner: NgxSpinnerService,
        public formBuilder: UntypedFormBuilder,
        private toastr: ToastrService,
        private router: Router
    ) {
        this.pfConfirmationForm = formBuilder.group({
            referance_file_id: [null, Validators.compose([Validators.required])],
            trrn: [null, Validators.compose([Validators.required])],
            ecr_id: [null, Validators.compose([Validators.required])],
            due_date: [null, Validators.compose([Validators.required])],
            total_amount: [null, Validators.compose([Validators.required])],

            challan_details_file: [null, Validators.compose([Validators.required])],
            challan_details_file_source: [null, Validators.compose([Validators.required])],
            challan_details: formBuilder.group({
                acc1_er_cont: [null, Validators.compose([Validators.required])],
                acc1_ee_cont: [null, Validators.compose([Validators.required])],
                acc2_admin_charge: [null, Validators.compose([Validators.required])],
                acc10_er_cont: [null, Validators.compose([Validators.required])],
                acc21_er_cont: [null, Validators.compose([Validators.required])],
                acc22_admin_charge: [null, Validators.compose([Validators.required])],
                challan_gen_date: [null, Validators.compose([Validators.required])],
                challan_gen_time: [null, Validators.compose([Validators.required])],
                gov_acc1_er_cont: [null, Validators.compose([Validators.required])],
                gov_acc10_pension_fund: [null, Validators.compose([Validators.required])],
                gov_acc1_ee_cont: [null, Validators.compose([Validators.required])],
                gov_acc2_er_cont: [null, Validators.compose([Validators.required])],
                gov_acc21_edli: [null, Validators.compose([Validators.required])],
                gov_acc22_edli_admin: [null, Validators.compose([Validators.required])],
                total_gov_schemes: [null, Validators.compose([Validators.required])],
                total_remittance_emp: [null, Validators.compose([Validators.required])],

                total_admin_charge: [null, Validators.compose([Validators.required])],
                total_er_cont: [null, Validators.compose([Validators.required])],
                total_ee_cont: [null, Validators.compose([Validators.required])],
            }),

            ecr_details_file: [null, Validators.compose([Validators.required])],
            ecr_details_file_source: [null, Validators.compose([Validators.required])],
            ecr_details: formBuilder.group({
                return_month: [null, Validators.compose([Validators.required])],
                return_year: [null, Validators.compose([Validators.required])],
                wage_month: [null, Validators.compose([Validators.required])],
                wage_year: [null, Validators.compose([Validators.required])],
                uploaded_date_time: [null, Validators.compose([Validators.required])],
                trrn: [null, Validators.compose([Validators.required])],
                ecr_id: [null, Validators.compose([Validators.required])],
                ecr_type: [null, Validators.compose([Validators.required])],
                contribution_rate: [null, Validators.compose([Validators.required])],
                salary_dis_date: [null, Validators.compose([Validators.required])],
                exem_status: [null, Validators.compose([Validators.required])],
                total_mem: [null, Validators.compose([Validators.required])],
                total_epf_cont_remi: [null, Validators.compose([Validators.required])],
                total_eps_cont_remi: [null, Validators.compose([Validators.required])],
                total_epf_eps_cont_remi: [null, Validators.compose([Validators.required])],
                total_refund_advance: [null, Validators.compose([Validators.required])],
            }),

            payment_confirm_file: [null, Validators.compose([Validators.required])],
            payment_confirm_file_source: [null, Validators.compose([Validators.required])],
            payment_confirmation: formBuilder.group({
                trrn: [null, Validators.compose([Validators.required])],
                challan_status: [null, Validators.compose([Validators.required])],
                challan_gen_on: [null, Validators.compose([Validators.required])],
                challan_type: [null, Validators.compose([Validators.required])],
                total_amount: [null, Validators.compose([Validators.required])],
                acc1_amount: [null, Validators.compose([Validators.required])],
                acc2_amount: [null, Validators.compose([Validators.required])],
                acc10_amount: [null, Validators.compose([Validators.required])],
                acc21_amount: [null, Validators.compose([Validators.required])],
                acc22_amount: [null, Validators.compose([Validators.required])],
                payment_confirmation: [null, Validators.compose([])],
                crn: [null, Validators.compose([Validators.required])],
                presentation_date: [null, Validators.compose([Validators.required])],
                realization_date: [null, Validators.compose([Validators.required])],
                date_of_credit: [null, Validators.compose([Validators.required])],
                total_gov_benefit: [null, Validators.compose([Validators.required])],
            }),
        });

        this.esicConfirmationForm = formBuilder.group({
            referance_file_id: [null, Validators.compose([Validators.required])],
            empr_code: [null, Validators.compose([Validators.required])],
            empr_name: [null, Validators.compose([Validators.required])],
            challan_number: [null, Validators.compose([Validators.required])],
            due_date: [null, Validators.compose([Validators.required])],
            total_amount: [null, Validators.compose([Validators.required])],
            challan_created: [null, Validators.compose([Validators.required])],
            challan_submited: [null, Validators.compose([Validators.required])],
            tran_number: [null, Validators.compose([Validators.required])],
            esic_challan_details_file: [null, Validators.compose([Validators.required])],
            esic_challan_details_file_source: [null, Validators.compose([Validators.required])],
        });


        this.pfConfirmationForm.get('challan_details')?.get('acc2_admin_charge')?.valueChanges.subscribe(val => {
            this.calculateChallanDetailsAdminCharge();
        }); this.pfConfirmationForm.get('challan_details')?.get('acc22_admin_charge')?.valueChanges.subscribe(val => {
            this.calculateChallanDetailsAdminCharge();
        })

        this.pfConfirmationForm.get('challan_details')?.get('acc1_er_cont')?.valueChanges.subscribe(val => {
            this.calculateChallanDetailsTotalERCont();
        }); this.pfConfirmationForm.get('challan_details')?.get('acc10_er_cont')?.valueChanges.subscribe(val => {
            this.calculateChallanDetailsTotalERCont();
        }); this.pfConfirmationForm.get('challan_details')?.get('acc21_er_cont')?.valueChanges.subscribe(val => {
            this.calculateChallanDetailsTotalERCont();
        });

        this.pfConfirmationForm.get('challan_details')?.get('acc1_ee_cont')?.valueChanges.subscribe(val => {
            this.calculateChallanDetailsTotalEECont();
        });

        this.pfConfirmationForm.get('challan_details')?.get('total_admin_charge')?.valueChanges.subscribe(val => {
            this.calculateTotalRemittanceEmp();
        }); this.pfConfirmationForm.get('challan_details')?.get('total_er_cont')?.valueChanges.subscribe(val => {
            this.calculateTotalRemittanceEmp();
        }); this.pfConfirmationForm.get('challan_details')?.get('total_ee_cont')?.valueChanges.subscribe(val => {
            this.calculateTotalRemittanceEmp();
        });

        this.pfConfirmationForm.get('challan_details')?.get('gov_acc1_er_cont')?.valueChanges.subscribe(val => {
            this.calculateTotalGovSchemes();
        }); this.pfConfirmationForm.get('challan_details')?.get('gov_acc10_pension_fund')?.valueChanges.subscribe(val => {
            this.calculateTotalGovSchemes();
        }); this.pfConfirmationForm.get('challan_details')?.get('gov_acc1_ee_cont')?.valueChanges.subscribe(val => {
            this.calculateTotalGovSchemes();
        }); this.pfConfirmationForm.get('challan_details')?.get('gov_acc2_er_cont')?.valueChanges.subscribe(val => {
            this.calculateTotalGovSchemes();
        }); this.pfConfirmationForm.get('challan_details')?.get('gov_acc21_edli')?.valueChanges.subscribe(val => {
            this.calculateTotalGovSchemes();
        }); this.pfConfirmationForm.get('challan_details')?.get('gov_acc22_edli_admin')?.valueChanges.subscribe(val => {
            this.calculateTotalGovSchemes();
        });

        this.pfConfirmationForm.get('challan_details')?.get('total_gov_schemes')?.valueChanges.subscribe(val => {
            this.pfConfirmationForm?.get('payment_confirmation')?.get('total_gov_benefit')?.setValue(val);
            this.calculateTotalAmount();
        }); this.pfConfirmationForm.get('challan_details')?.get('total_remittance_emp')?.valueChanges.subscribe(val => {
            this.calculateTotalAmount();
        });

        this.pfConfirmationForm.get('trrn')?.valueChanges.subscribe(val => {
            this.pfConfirmationForm.get('ecr_details')?.get('trrn')?.setValue(val);
            this.pfConfirmationForm.get('payment_confirmation')?.get('trrn')?.setValue(val);
        })

        this.pfConfirmationForm.get('ecr_id')?.valueChanges.subscribe(val => {
            this.pfConfirmationForm.get('ecr_details')?.get('ecr_id')?.setValue(val);
        })
    }

    calculateChallanDetailsAdminCharge() {
        setTimeout(() => {
            let challan_details = this.pfConfirmationForm?.value?.challan_details ?? null;

            this.pfConfirmationForm.get('challan_details')?.get('total_admin_charge')?.patchValue(
                parseFloat(challan_details?.acc2_admin_charge ?? 0) + parseFloat(challan_details?.acc22_admin_charge ?? 0)
            );
        }, 100);
    }

    calculateChallanDetailsTotalERCont() {
        setTimeout(() => {
            let challan_details = this.pfConfirmationForm?.value?.challan_details ?? null;

            this.pfConfirmationForm.get('challan_details')?.get('total_er_cont')?.patchValue(
                parseFloat(challan_details?.acc1_er_cont ?? 0) + parseFloat(challan_details?.acc10_er_cont ?? 0) + parseFloat(challan_details?.acc21_er_cont ?? 0)
            );
        }, 100);
    }

    calculateChallanDetailsTotalEECont() {
        setTimeout(() => {
            let challan_details = this.pfConfirmationForm?.value?.challan_details ?? null;

            this.pfConfirmationForm.get('challan_details')?.get('total_ee_cont')?.patchValue(
                parseFloat(challan_details?.acc1_ee_cont ?? 0)
            );
        }, 100);
    }

    calculateTotalRemittanceEmp() {
        setTimeout(() => {
            let challan_details = this.pfConfirmationForm?.value?.challan_details ?? null;

            this.pfConfirmationForm.get('challan_details')?.get('total_remittance_emp')?.patchValue(
                parseFloat(challan_details?.total_admin_charge ?? 0) + parseFloat(challan_details?.total_er_cont ?? 0) + parseFloat(challan_details?.total_ee_cont ?? 0)
            );
        }, 100);
    }

    calculateTotalGovSchemes() {
        setTimeout(() => {
            let challan_details = this.pfConfirmationForm?.value?.challan_details ?? null;

            this.pfConfirmationForm.get('challan_details')?.get('total_gov_schemes')?.patchValue(
                parseFloat(challan_details?.gov_acc1_er_cont ?? 0) + parseFloat(challan_details?.gov_acc10_pension_fund ?? 0) + parseFloat(challan_details?.gov_acc1_ee_cont ?? 0) + parseFloat(challan_details?.gov_acc2_er_cont ?? 0) + parseFloat(challan_details?.gov_acc21_edli ?? 0) + parseFloat(challan_details?.gov_acc22_edli_admin ?? 0)
            );
        }, 100);
    }

    calculateTotalAmount() {
        setTimeout(() => {
            let challan_details = this.pfConfirmationForm?.value?.challan_details ?? null;
            let totalAmount = parseFloat(challan_details?.total_gov_schemes ?? 0) + parseFloat(challan_details?.total_remittance_emp ?? 0);

            this.pfConfirmationForm.get('total_amount')?.patchValue(totalAmount);
            this.pfConfirmationForm.get('payment_confirmation')?.get('total_amount')?.setValue(totalAmount)
        }, 100);
    }

    async ngOnInit() {
        switch (this.activatedRoute.snapshot.url[1].path) {
            case "pf-challan-report":
                this.challanType = "pf";
                break;

            case "esic-challan-report":
                this.challanType = "esic";
                break;
        }

        this.titleService.setTitle(this.challanType.toUpperCase() + " Challan Report Data - " + Global.AppName);

        this.fileId = this.activatedRoute.snapshot.paramMap.get('fileId');
        await this.getChallanFormData()
    }

    getChallanFormData() {
        return new Promise((resolve, reject) => {
            this.spinner.show();
            this.companyuserService.getChallanFormData({
                'file_id': this.fileId
            }, this.challanType).subscribe((res) => {
                this.spinner.hide();
                if (res.status == 'success') {
                    this.companyData = res?.company_data ?? null

                    this.fileData = res?.file_data ?? null;
                    if (this.fileData.status != 'active') {
                        this.toastr.warning("The form is already submitted");
                        this.router.navigate([`/company/reports/${this.challanType}-challan-report/data-new`]);
                    }

                    if (this.challanType == 'pf') {
                        this.pfConfirmationForm.get('referance_file_id')?.setValue(this.fileData?._id)
                        this.pfConfirmationForm.get('ecr_details')?.get('total_mem')?.setValue(this.fileData?.total_eps_emp)
                        this.pfConfirmationForm.get('payment_confirmation')?.get('challan_status')?.setValue(this.fileData?.status)
                        // this.pfConfirmationForm.get('payment_confirmation')?.get('total_amount')?.setValue(this.fileData?.total_challan_amount)
                    } else if (this.challanType == 'esic') {
                        this.esicConfirmationForm.get('referance_file_id')?.setValue(this.fileData?._id)
                        this.esicConfirmationForm.get('empr_name')?.setValue(this.companyData?.details?.establishment_name)
                    }
                    resolve(true)
                } else {
                    this.toastr.error(res.message);
                    resolve(false);
                }
            }, (err) => {
                this.spinner.hide();
                this.toastr.error(Global.showServerErrorMessage(err));
                resolve(false);
            })
        })
    }

    submitPfConfirmation(event: any) {
        this.pfConfirmationForm.markAllAsTouched();
        setTimeout(() => {
            Global.scrollToQuery('input.ng-invalid.ng-touched')
        }, 100);

        if (this.pfConfirmationForm.valid) {
            event.target.classList.add('btn-loading');
            this.companyuserService.submitConfirmChallanPayment({
                'referance_file_id': this.pfConfirmationForm.value.referance_file_id ?? "",
                'trrn': this.pfConfirmationForm.value.trrn ?? "",
                'ecr_id': this.pfConfirmationForm.value.ecr_id ?? "",
                'due_date': this.pfConfirmationForm.value.due_date ?? "",
                'total_amount': this.pfConfirmationForm.value.total_amount ?? "",
                'challan_details_file': this.pfConfirmationForm.value.challan_details_file_source ?? "",
                'challan_details': JSON.stringify(this.pfConfirmationForm.value.challan_details),
                'ecr_details_file': this.pfConfirmationForm.value.ecr_details_file_source ?? "",
                'ecr_details': JSON.stringify(this.pfConfirmationForm.value.ecr_details),
                'payment_confirm_file': this.pfConfirmationForm.value.payment_confirm_file_source ?? "",
                'payment_confirmation': JSON.stringify(this.pfConfirmationForm.value.payment_confirmation),
            }, this.challanType).subscribe(res => {
                if (res.status == 'success') {
                    this.toastr.success(res.message);
                    this.router.navigate([`/company/reports/${this.challanType}-challan-report/data-new`]);
                } else if (res.status == 'val_err') {
                    this.toastr.error(Global.showValidationMessage(res.val_msg));
                } else {
                    this.toastr.error(res.message);
                }

                event.target.classList.remove('btn-loading');
            }, (err) => {
                event.target.classList.remove('btn-loading');
                this.toastr.error(Global.showServerErrorMessage(err));
            });
        }
    }

    submitEsicConfirmation(event: any) {
        this.esicConfirmationForm.markAllAsTouched();
        setTimeout(() => {
            Global.scrollToQuery('input.ng-invalid.ng-touched')
        }, 100);

        if (this.esicConfirmationForm.valid) {
            event.target.classList.add('btn-loading');
            this.companyuserService.submitConfirmChallanPayment({
                'referance_file_id': this.esicConfirmationForm.value.referance_file_id ?? "",
                'empr_code': this.esicConfirmationForm.value.empr_code ?? "",
                'empr_name': this.esicConfirmationForm.value.empr_name ?? "",
                'challan_number': this.esicConfirmationForm.value.challan_number ?? "",
                'due_date': this.esicConfirmationForm.value.due_date ?? "",
                'total_amount': this.esicConfirmationForm.value.total_amount ?? "",
                'challan_created': this.esicConfirmationForm.value.challan_created ?? "",
                'challan_submited': this.esicConfirmationForm.value.challan_submited ?? "",
                'tran_number': this.esicConfirmationForm.value.tran_number ?? "",
                'esic_challan_details_file': this.esicConfirmationForm.value.esic_challan_details_file_source ?? "",                
            }, this.challanType).subscribe(res => {
                if (res.status == 'success') {
                    this.toastr.success(res.message);
                    this.router.navigate([`/company/reports/${this.challanType}-challan-report/data-new`]);
                } else if (res.status == 'val_err') {
                    this.toastr.error(Global.showValidationMessage(res.val_msg));
                } else {
                    this.toastr.error(res.message);
                }

                event.target.classList.remove('btn-loading');
            }, (err) => {
                event.target.classList.remove('btn-loading');
                this.toastr.error(Global.showServerErrorMessage(err));
            });
        }
    }
}
