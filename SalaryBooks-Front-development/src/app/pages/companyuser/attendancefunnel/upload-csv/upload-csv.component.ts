import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import * as Global from 'src/app/globals';
import { CompanyuserService } from 'src/app/services/companyuser.service';

@Component({
    selector: 'app-companyuser-attendance-funnel-upload-csv',
    templateUrl: './upload-csv.component.html',
})

export class CMPAttendanceFunnelUploadCsvComponent implements OnInit {
    Global = Global;
    csvUploadForm: FormGroup;
    biometricDeviceMaster: any[] = [];

    constructor(
        private formBuilder: FormBuilder,
        private companyuserService: CompanyuserService,
        private toastr: ToastrService,
        private spinner: NgxSpinnerService,
        private router:Router,
        private titleService: Title
    ) {

        if (
            !Global.checkCompanyModulePermission({
              company_module: 'attendance',
              company_sub_module:"attendance_funnel",
              company_sub_operation: ['view'],
              company_strict: true  
            })
          ) {
            // const _this = this;
            // setTimeout(function () {
            router.navigate(['company/errors/unauthorized-access'], {
                skipLocationChange: true,
              });
            // }, 500);
            return;
          }
        this.csvUploadForm = formBuilder.group({
            biometric_device: [null, Validators.compose([Validators.required])],
            attendance_month: [null, Validators.compose([Validators.required])],
            attendance_year: [null, Validators.compose([Validators.required, Validators.minLength(4), Validators.maxLength(4)])],
            file: [null, Validators.compose([Validators.required])],
            file_source: [null, Validators.compose([Validators.required])],
        });
    }

    async ngOnInit() {
        this.titleService.setTitle("Upload Attendance CSV - " + Global.AppName);
        await this.fetchDeviceMaster();
    }

    fetchDeviceMaster({
        loading = <boolean>true
    } = {}) {
        return new Promise((resolve, reject) => {
            if (loading == true) this.spinner.show();

            this.companyuserService.fetchBiometricDeviceMaster().subscribe((res) => {
                if (res.status == 'success') {
                    this.biometricDeviceMaster = res?.docs ?? [];
                    resolve(true);
                } else {
                    this.toastr.error(res.message);
                    this.biometricDeviceMaster = [];
                    resolve(false);
                }

                if (loading == true) this.spinner.hide();
            }, (err) => {
                if (loading == true) this.spinner.hide();
                this.biometricDeviceMaster = [];
                this.toastr.error(Global.showServerErrorMessage(err));
                resolve(false);
            })
        })
    }

    uploadCsv(event: any) {
        this.csvUploadForm.markAllAsTouched();
        if (this.csvUploadForm.valid) {
            event.target.classList.add('btn-loading');
            this.companyuserService.uploadAttendanceFunnelCsv({
                'biometric_id': this.csvUploadForm.get('biometric_device')?.value?.biometric_id ?? "",
                'attendance_year': this.csvUploadForm.get('attendance_month')?.value?.value,
                'attendance_month': this.csvUploadForm.get('attendance_year')?.value,
                'file': this.csvUploadForm.get('file_source')?.value ?? ""
            }).subscribe((res) => {
                const data = res?.data ?? null;
                if (res.status == 'success') {
                    this.toastr.success(res.message);
                    Global.resetForm(this.csvUploadForm)
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
}