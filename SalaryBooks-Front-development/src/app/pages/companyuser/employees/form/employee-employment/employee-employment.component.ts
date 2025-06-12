import { Component, OnInit } from '@angular/core';
import { AbstractControl, UntypedFormArray, UntypedFormBuilder, FormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { CompanyuserService } from 'src/app/services/companyuser.service';
import * as Global from 'src/app/globals';
import swal from 'sweetalert2';
import { DatePipe } from '@angular/common';
import { AppComponent } from 'src/app/app.component';

@Component({
    selector: 'companyuser-app-employee-form-employment',
    templateUrl: './employee-employment.component.html',
    styleUrls: ['./employee-employment.component.css']
})

export class CMPEmployeeEmploymentFormComponent implements OnInit {
    Global = Global;
    operation: any;
    employee_id: any;
    employee_details: any;

    employmentForm: UntypedFormGroup;
    dispensaryForm: UntypedFormGroup;
    dispensaryMaster: any[] = [];
    sexMaster: any[] = Global.getGenderMaster();
    relationMaster: any[] = Global.relationMaster;

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
        this.employmentForm = formBuilder.group({
            // pre_er_pf: [null, Validators.compose([])],
            pre_er_details: formBuilder.group({
                er_name: [null, Validators.compose([])],
                last_drawn_gross: [null, Validators.compose([])],
                contact_no: [null, Validators.compose([Validators.pattern("^[0-9]*$"), Validators.minLength(10), Validators.maxLength(10)])],
                reporting_to: [null, Validators.compose([])],
                exit_date: [null, Validators.compose([])],
                last_designation: [null, Validators.compose([])],
            }),
            pre_er_epfo_details: formBuilder.group({
                uan_no: [null, Validators.compose([])],
                last_member_id: [null, Validators.compose([])],
                last_ro: [null, Validators.compose([])],
            }),
            pre_er_esic_details: formBuilder.group({
                esic_no: [null, Validators.compose([])],
                ip_dispensary: [null, Validators.compose([])],
                family_dispensary: [null, Validators.compose([])],
            }),
            curr_er_epfo_details: formBuilder.group({
                uan_no: [null, Validators.compose([])],
                last_member_id: [null, Validators.compose([])],
                last_ro: [null, Validators.compose([])],
                membership_date: [null, Validators.compose([])],
            }),
            curr_er_esic_details: formBuilder.group({
                esic_no: [null, Validators.compose([])],
                ip_dispensary: [null, Validators.compose([])],
                family_dispensary: [null, Validators.compose([])],
                membership_date: [null, Validators.compose([])],
            }),
            // esic_family_details: this.formBuilder.array([this.initFormRows('esic_family_details')]),
            // pf_nominee_details: this.formBuilder.array([this.initFormRows('pf_nominee_details')]),

            esic_family_details: this.formBuilder.array([]),
            pf_nominee_details: this.formBuilder.array([]),
        });

        this.dispensaryForm = formBuilder.group({
            dispensary_name: [null, Validators.compose([Validators.required])],
        });

        this.employmentForm?.get('pre_er_epfo_details')?.get('uan_no')?.valueChanges.subscribe(val => {
            if ($('#previousemployment-toggle')?.hasClass('on')) {
                this.employmentForm?.get('curr_er_epfo_details')?.get('uan_no')?.setValue(val)
            }
        });

        this.employmentForm?.get('pre_er_esic_details')?.get('esic_no')?.valueChanges.subscribe(val => {
            if ($('#previousemployment-toggle')?.hasClass('on')) {
                this.employmentForm?.get('curr_er_esic_details')?.get('esic_no')?.setValue(val)
            }
        });
    }

    ngOnInit(): void {
        this.titleService.setTitle("Employees - " + Global.AppName);

        this.activatedRoute.params.subscribe(
            params => this.employee_id = params['employee_id'] ?? null
        )

        if (!this.employee_id) {
            this.operation = 'add';
        } else {
            let r = this.router.url.split('/')
            if (r[4] == 'view') {
                this.operation = 'view';
                $('input').attr('disabled', 'true')
            } else if (r[4] == 'edit') {
                this.operation = 'edit';
            }

            this.getEmployeeMaster();
            this.fetchEmployeeDetails();
        }


        if (!this.AppComponent.checkCompanyModulePermission({  company_module: 'employee',
            company_operation: 'listing_add_approve',
            company_sub_module: 'employee_master_data',
            company_sub_operation: [this.operation], 'company_strict': true })) {
            setTimeout(() => {
                this.router.navigate(['company/errors/unauthorized-access'], { skipLocationChange: true })
            }, 500);
            return;
        }
    }

    updateEmployeeEmploymentDetails(event: any) {
        this.employmentForm.markAllAsTouched();
        Global.scrollToQuery("p.error-element");

        if (this.employmentForm.valid) {
            event.target.classList.add('btn-loading');

            let payload: any = {
                'employee_id': this.employee_id
            };

            if ($('#previousemployment-toggle')?.hasClass('on')) {
                payload.pre_er_pf = "yes";

                payload.pre_er_details = JSON.stringify({
                    'er_name': this.employmentForm.value?.pre_er_details?.er_name ?? null,
                    'last_drawn_gross': this.employmentForm.value?.pre_er_details?.last_drawn_gross ?? null,
                    'contact_no': this.employmentForm.value?.pre_er_details?.contact_no ?? null,
                    'reporting_to': this.employmentForm.value?.pre_er_details?.reporting_to ?? null,
                    'exit_date': this.employmentForm.value?.pre_er_details?.exit_date ?? null,
                    'last_designation': this.employmentForm.value?.pre_er_details?.last_designation ?? null,
                });

                payload.pre_er_epfo_details = JSON.stringify({
                    'uan_no': this.employmentForm.value?.pre_er_epfo_details?.uan_no ?? null,
                    'last_member_id': this.employmentForm.value?.pre_er_epfo_details?.last_member_id ?? null,
                    'last_ro': this.employmentForm.value?.pre_er_epfo_details?.last_ro ?? null,
                })

                payload.pre_er_esic_details = JSON.stringify({
                    'esic_no': this.employmentForm?.value?.pre_er_esic_details?.esic_no ?? null,
                    'ip_dispensary': this.employmentForm?.value?.pre_er_esic_details?.ip_dispensary ?? null,
                    'family_dispensary': this.employmentForm?.value?.pre_er_esic_details?.family_dispensary ?? null,
                })
            } else {
                payload.pre_er_pf = "no";

                payload.pre_er_details = JSON.stringify({
                    'er_name': null,
                    'last_drawn_gross': null,
                    'contact_no': null,
                    'reporting_to': null,
                    'exit_date': null,
                    'last_designation': null,
                });

                payload.pre_er_epfo_details = JSON.stringify({
                    'uan_no': null,
                    'last_member_id': null,
                    'last_ro': null,
                })

                payload.pre_er_esic_details = JSON.stringify({
                    'esic_no': null,
                    'ip_dispensary': null,
                    'family_dispensary': null,
                })
            }

            payload.curr_er_epfo_details = JSON.stringify({
                'uan_no': this.employmentForm?.value?.curr_er_epfo_details?.uan_no ?? null,
                'last_member_id': this.employmentForm?.value?.curr_er_epfo_details?.last_member_id ?? null,
                'last_ro': this.employmentForm?.value?.curr_er_epfo_details?.last_ro ?? null,
                'membership_date': this.employmentForm?.value?.curr_er_epfo_details?.membership_date ?? null,
            })

            payload.curr_er_esic_details = JSON.stringify({
                'esic_no': this.employmentForm?.value?.curr_er_esic_details?.esic_no ?? null,
                'ip_dispensary': this.employmentForm?.value?.curr_er_esic_details?.ip_dispensary ?? null,
                'family_dispensary': this.employmentForm?.value?.curr_er_esic_details?.family_dispensary ?? null,
                'membership_date': this.employmentForm?.value?.curr_er_esic_details?.membership_date ?? null,
            })

            /**
             * esic_family_details
             */
            let esic_family_details: any[] = [];
            (this.employmentForm?.value?.esic_family_details ?? []).forEach((details: any) => {
                esic_family_details.push({
                    'fm_name': details?.fm_name ?? null,
                    'fm_dob': details?.fm_dob ?? null,
                    'fm_relation': details?.fm_relation?.value ?? null,
                    'sex': details?.sex?.value ?? null,
                    'residing_with_if': details?.residing_with_if == true ? "yes" : "no",
                })
            });

            /**
             * pf_nominee_details
             */
            let pf_nominee_details: any[] = [];
            (this.employmentForm?.value?.pf_nominee_details ?? []).forEach((details: any) => {
                pf_nominee_details.push({
                    'aadhar_no': details?.aadhar_no ?? null,
                    'dob': details?.dob ?? null,
                    'name': details?.name ?? null,
                    'sex': details?.sex?.value ?? null,
                    'fm_relation': details?.fm_relation?.value ?? null,
                    'address': details?.address ?? null,
                })
            });


            payload.esic_family_details = JSON.stringify(esic_family_details);
            payload.pf_nominee_details = JSON.stringify(pf_nominee_details);

            this.companyuserService.updateEmployeeEmploymentDetails(payload).subscribe(res => {
                if (res.status == 'success') {
                    this.toastr.success(res.message);
                    this.cancelEntry();
                    this.fetchEmployeeDetails();

                    // if (this.employee_id) {
                    //   this.router.navigate(['/company/employees/' + this.employee_id + '/edit/bank']);
                    // } else {
                    //   this.fetchEmployeeDetails();
                    // }
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

    onFileChanged(event: any, formGroup: UntypedFormGroup, file: any, target: any) {
        if (event.target.files.length > 0) {
            const file = event.target.files[0];
            formGroup.patchValue({
                [target]: file
            });
        }
    }

    fetchEmployeeDetails() {
        this.spinner.show();
        this.companyuserService.getEmployeeDetails({ employee_id: this.employee_id })
            .subscribe((res: any) => {
                if (res.status == 'success') {
                    let DEFAULTVAL = null;
                    if (this.operation == 'view') DEFAULTVAL = "N/A";

                    this.employee_details = res.employee_det

                    if (this.employee_details?.emp_det?.pf_esic_details?.pre_er_pf == 'yes') {
                        $('#previousemployment-toggle')?.addClass('on')
                    } else {
                        $('#previousemployment-toggle')?.removeClass('on')
                    }

                    this.employmentForm.patchValue({
                        'pre_er_details': {
                            'er_name': this.employee_details?.emp_det?.pf_esic_details?.pre_er_details?.er_name ?? DEFAULTVAL,
                            'last_drawn_gross': this.employee_details?.emp_det?.pf_esic_details?.pre_er_details?.last_drawn_gross ?? DEFAULTVAL,
                            'contact_no': this.employee_details?.emp_det?.pf_esic_details?.pre_er_details?.contact_no ?? DEFAULTVAL,
                            'reporting_to': this.employee_details?.emp_det?.pf_esic_details?.pre_er_details?.reporting_to ?? DEFAULTVAL,
                            'exit_date': this.employee_details?.emp_det?.pf_esic_details?.pre_er_details?.exit_date ?? DEFAULTVAL,
                            'last_designation': this.employee_details?.emp_det?.pf_esic_details?.pre_er_details?.last_designation ?? DEFAULTVAL,
                        },
                        'pre_er_epfo_details': {
                            'uan_no': this.employee_details?.emp_det?.pf_esic_details?.pre_er_epfo_details?.uan_no ?? DEFAULTVAL,
                            'last_member_id': this.employee_details?.emp_det?.pf_esic_details?.pre_er_epfo_details?.last_member_id ?? DEFAULTVAL,
                            'last_ro': this.employee_details?.emp_det?.pf_esic_details?.pre_er_epfo_details?.last_ro ?? DEFAULTVAL,
                        },
                        'pre_er_esic_details': {
                            'esic_no': this.employee_details?.emp_det?.pf_esic_details?.pre_er_esic_details?.esic_no ?? DEFAULTVAL,
                            'ip_dispensary': this.employee_details?.emp_det?.pf_esic_details?.pre_er_esic_details?.ip_dispensary ?? DEFAULTVAL,
                            'family_dispensary': this.employee_details?.emp_det?.pf_esic_details?.pre_er_esic_details?.family_dispensary ?? DEFAULTVAL,
                        },
                        'curr_er_epfo_details': {
                            'uan_no': this.employee_details?.emp_det?.pf_esic_details?.curr_er_epfo_details?.uan_no ?? DEFAULTVAL,
                            'last_member_id': this.employee_details?.emp_det?.pf_esic_details?.curr_er_epfo_details?.last_member_id ?? DEFAULTVAL,
                            'last_ro': this.employee_details?.emp_det?.pf_esic_details?.curr_er_epfo_details?.last_ro ?? DEFAULTVAL,
                            'membership_date': this.employee_details?.emp_det?.pf_esic_details?.curr_er_epfo_details?.membership_date ?? DEFAULTVAL,
                        },
                        'curr_er_esic_details': {
                            'esic_no': this.employee_details?.emp_det?.pf_esic_details?.curr_er_esic_details?.esic_no ?? DEFAULTVAL,
                            'ip_dispensary': this.employee_details?.emp_det?.pf_esic_details?.curr_er_esic_details?.ip_dispensary ?? DEFAULTVAL,
                            'family_dispensary': this.employee_details?.emp_det?.pf_esic_details?.curr_er_esic_details?.family_dispensary ?? DEFAULTVAL,
                            'membership_date': this.employee_details?.emp_det?.pf_esic_details?.curr_er_esic_details?.membership_date ?? DEFAULTVAL,
                        }
                    });

                    (this.employee_details?.emp_det?.pf_esic_details?.esic_family_details ?? []).forEach((details: any) => {
                        this.addFormRows(this.employmentForm, 'esic_family_details', details)
                    });

                    (this.employee_details?.emp_det?.pf_esic_details?.pf_nominee_details ?? []).forEach((details: any) => {
                        this.addFormRows(this.employmentForm, 'pf_nominee_details', details)
                    });

                    this.shuffleFields();
                } else {
                    this.toastr.error(res.message);
                }

                this.spinner.hide();
            }, (err) => {
                this.spinner.hide();
                this.toastr.error(Global.showServerErrorMessage(err));
            });
    }

    getEmployeeMaster() {
        this.spinner.show();
        this.companyuserService.fetchDispensaries({})
            .subscribe((res: any) => {
                if (res.status == 'success') {
                    this.dispensaryMaster = [];
                    res.dispensary.docs.forEach((element: any) => {
                        this.dispensaryMaster.push({ id: element._id, description: element.dispensary_name })
                    });
                } else {
                    this.toastr.error(res.message);
                }

                this.spinner.hide();
            }, (err) => {
                this.spinner.hide();
                this.toastr.error(Global.showServerErrorMessage(err));
            });
    }

    cancelEntry() {
        Global.resetForm(this.employmentForm);
        Global.resetFormGroupArrRow(this.employmentForm, 'esic_family_details');
        Global.resetFormGroupArrRow(this.employmentForm, 'pf_nominee_details');
    }

    createDispensary(event: any) {
        if (this.dispensaryForm.valid) {
            event.target.classList.add('btn-loading');

            this.companyuserService.createDispensary({
                'dispensary_name': this.dispensaryForm.value.dispensary_name,
                'status': 'active',
            }).subscribe(res => {
                if (res.status == 'success') {
                    this.toastr.success(res.message);
                    this.dispensaryForm.reset();
                    this.getEmployeeMaster();
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

    shuffleFields() {
        setTimeout(() => {
            if ($('#previousemployment-toggle')?.hasClass('on')) {
                $('#prevemployment-fields')?.show(300);
            } else {
                $('#prevemployment-fields')?.hide(300);
            }
        }, 100);
    }

    /**
     * =========================
     * FormGroup Array Functions
     * =========================
     */

    initFormRows(type: any, data: any = null) {
        switch (type) {
            case 'esic_family_details':
                return this.formBuilder.group({
                    'fm_name': [data?.fm_name ?? null, Validators.compose([]),],
                    'fm_dob': [data?.fm_dob ?? null, Validators.compose([]),],
                    'fm_relation': [data?.fm_relation ? this.relationMaster?.find((obj: any) => {
                        return obj.value == data?.fm_relation
                    }) ?? null : null, Validators.compose([]),],
                    'sex': [data?.sex ? this.sexMaster?.find((obj: any) => {
                        return obj.value == data?.sex
                    }) ?? null : null, Validators.compose([]),],
                    'residing_with_if': [data?.residing_with_if == 'yes' ? true : false, Validators.compose([]),],
                });

            case 'pf_nominee_details':
                return this.formBuilder.group({
                    'aadhar_no': [data?.aadhar_no ?? null, Validators.compose([Validators.pattern("^[0-9]*$"), Validators.minLength(12), Validators.maxLength(12)]),],
                    'dob': [data?.dob ?? null, Validators.compose([]),],
                    'name': [data?.name ?? null, Validators.compose([]),],
                    'sex': [data?.sex ? this.sexMaster?.find((obj: any) => {
                        return obj.value == data?.sex
                    }) ?? null : null, Validators.compose([]),],
                    'fm_relation': [data?.fm_relation ? this.relationMaster?.find((obj: any) => {
                        return obj.value == data?.fm_relation
                    }) ?? null : null, Validators.compose([]),],
                    'address': [data?.address ?? null, Validators.compose([]),],
                    'profile_pic': [null, Validators.compose([]),],
                    'profile_pic_file': [null, Validators.compose([]),],
                });

            default:
                return this.formBuilder.group({});
        }
    }

    addFormRows(formGroup: UntypedFormGroup, type: any, data: any = null) {
        const control = <UntypedFormArray>formGroup.get(type);
        switch (type) {
            case 'esic_family_details':
                control.push(this.initFormRows('esic_family_details', data));
                break;

            case 'pf_nominee_details':
                control.push(this.initFormRows('pf_nominee_details', data));
                break;
        }
    }
}


