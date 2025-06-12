import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CompanyuserService } from 'src/app/services/companyuser.service';
import * as Global from 'src/app/globals';
import { ToastrService } from 'ngx-toastr';
import { NgxSpinnerService } from 'ngx-spinner';

@Component({
    selector: 'app-companyuser-attendance-funnel-upload',
    templateUrl: './upload.component.html',
})

export class CMPAttendanceFunnelUploadComponent implements OnInit {
    Global = Global;
    csvUploadForm: FormGroup;
    dataMappingFrom: FormGroup;
    uploadPreview: boolean = false;
    uploadPreviewEmployeeMaster: any[] = [];

    constructor(
        private formBuilder: FormBuilder,
        private companyuserService: CompanyuserService,
        private toastr: ToastrService,
        private spinner: NgxSpinnerService
    ) {
        this.csvUploadForm = formBuilder.group({
            file: [null, Validators.compose([Validators.required])],
            file_source: [null, Validators.compose([Validators.required])],
        });

        this.dataMappingFrom = formBuilder.group({
            machine_id: [null, Validators.compose([Validators.required])],
            emp_data: this.formBuilder.array([]),
        })
    }

    ngOnInit() {
    }

    uploadCsv(event: any) {
        this.csvUploadForm.markAllAsTouched();
        if (this.csvUploadForm.valid) {
            event.target.classList.add('btn-loading');

            this.companyuserService.uploadAttendanceFunnelMapFile({
                'emp_map_file': this.csvUploadForm.get('file_source')?.value ?? ""
            }).subscribe((res) => {
                const data = res?.data ?? null;
                if (res.status == 'success') {
                    if ((data?.sheet_data ?? []).length < 1) {
                        this.toastr.error("No data found in the uploaded CSV");
                    } else {
                        this.cancelDataMapping();

                        this.uploadPreview = true;
                        this.uploadPreviewEmployeeMaster = data?.sheet_data ?? [];

                        (data?.employees).forEach((employee: any) => {
                            if (employee?.emp_id)
                                this.addFormRows(this.dataMappingFrom, 'emp_data', {
                                    emp_id: employee?.emp_id,
                                    emp_name: `${employee?.emp_first_name} ${employee?.emp_last_name}`
                                })
                        });

                        Global.resetForm(this.csvUploadForm);
                    }
                } else if (res.status == 'val_err') {
                    this.toastr.error(Global.showValidationMessage(res.val_msg));
                } else {
                    this.toastr.error(res?.message);
                }

                event.target.classList.remove('btn-loading');
            }, (err) => {
                event.target.classList.remove('btn-loading');
                this.toastr.error(Global.showServerErrorMessage(err));
            })
        }
    }

    cancelDataMapping() {
        this.uploadPreview = false;
        this.uploadPreviewEmployeeMaster = [];
        Global.resetForm(this.dataMappingFrom);
        this.resetAllFormRows({ formGroup: this.dataMappingFrom, is_editing: true });
    }

    submitDataMapping(event: any) {
        this.dataMappingFrom.markAllAsTouched();
        setTimeout(() => {
            Global.scrollToQuery("p.error-element");
        }, 100);

        if (this.dataMappingFrom.valid) {
            event.target.classList.add('btn-loading');

            let payload: any = {
                machine_id: this.dataMappingFrom.get('machine_id')?.value,
                emp_data: [],
            };

            (this.dataMappingFrom.get('emp_data')?.value ?? []).forEach((element: any) => {
                payload.emp_data.push({
                    emp_id: element.emp_id,
                    sheet_id: element.sheet_id?.key ?? null,
                })
            });

            this.companyuserService.submitAttendanceFunnelEmployeeMapping(payload).subscribe((res) => {
                if (res?.status == 'success') {
                    this.toastr.success(res.message);  
                    this.cancelDataMapping();
                } else if (res.status == 'val_err') {
                    this.toastr.error(Global.showValidationMessage(res.val_msg));
                } else {
                    this.toastr.error(res?.message);
                }

                event.target.classList.remove('btn-loading');
            }, (err) => {
                this.toastr.error(Global.showServerErrorMessage(err));
                event.target.classList.remove('btn-loading');
            })
        }
    }

    /**
     * -----------------------------
     * MULTIPLE FIELDS FORM FUNCTION
     * -----------------------------
     * -----------------------------
     */
    initFormRows(type: any, data: any = null) {
        switch (type) {
            case 'emp_data':
                return this.formBuilder.group({
                    emp_id: [data?.emp_id ?? null, Validators.compose([])],
                    sheet_id: [data?.sheet_id ?? null, Validators.compose([])],
                    emp_name: [data?.emp_name ?? null],
                });
                break;

            default:
                return this.formBuilder.group({});
                break;
        }
    }

    resetAllFormRows({
        formGroup = <FormGroup>this.dataMappingFrom,
        is_editing = <Boolean>false,
        array = <any[]>['emp_data']
    } = {}) {
        array.forEach((element: any) => {
            const control = <FormArray>formGroup.get(element);
            control.clear();
        });

        if (is_editing == false) {
            array.forEach((element: any) => {
                this.addFormRows(formGroup, element);
            });
        }
    }

    addFormRows(formGroup: FormGroup, type: any, data: any = null) {
        const control = <FormArray>formGroup.get(type);
        control.push(this.initFormRows(type, data));
    }

    removeFormRow(formGroup: FormGroup, type: any, i: number) {
        const control = <FormArray>formGroup.get(type);
        control.removeAt(i);
    }

    fetchIndexOfControl(formGroup: FormGroup, type: any, s_key: any, s_value: any) {
        let arr: any[] = formGroup.value?.[type];
        if (Array.isArray(arr)) {
            let index: any = arr.findIndex(x => x[s_key] == s_value);
            return index;
        }

        return false;
    }
}
