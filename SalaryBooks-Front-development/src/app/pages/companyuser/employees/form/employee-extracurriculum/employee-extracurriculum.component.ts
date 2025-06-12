import { Component, OnInit } from '@angular/core';
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
import { fileSizeValidator } from 'src/app/globals';

@Component({
    selector: 'companyuser-employee-form-extracurriculum',
    templateUrl: './employee-extracurriculum.component.html',
    styleUrls: ['./employee-extracurriculum.component.css']
})

export class CMPEmployeeExtracurriculumFormComponent implements OnInit {
    Global = Global;
    operation: any;
    employee_id: any;
    extracurriculum_id: any;
    employee_details: any;

    employeeExtraCurriculumForm: UntypedFormGroup;
    max_upload_limit: number=0;
    net_uploaded_size: number=0;

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
        this.employeeExtraCurriculumForm = formBuilder.group({
            extra_curricular_type: [null, Validators.compose([Validators.required])],
            extracurriculum_name: [null, Validators.compose([])],
            description: [null, Validators.compose([])],
            comments: [null, Validators.compose([])],

            extra_curricular_file_image: [null, Validators.compose([])],
            extra_curricular_file_image_file: [null, Validators.compose([])],
        });

        this.extracurriculum_id = "";
    }

   async ngOnInit() {
        this.titleService.setTitle("Employees - " + Global.AppName);

        await this.fetchCompanyDetails();
        this.activatedRoute.params.subscribe(
            params => this.employee_id = params['employee_id'] ?? null
        )

        if (!this.employee_id) {
            this.operation = 'add';
            $('#current-address-fields').hide(500);
        } else {
            let r = this.router.url.split('/')
            if (r[4] == 'view') {
                this.operation = 'view';
                $('input').attr('disabled', 'true')
            } else if (r[4] == 'edit') {
                this.operation = 'edit';
            }

            this.fetchEmployeeDetails();
        }

        if (!this.AppComponent.checkCompanyModulePermission({  company_module: 'employee',
            company_operation: 'listing_add_approve',
            company_sub_module: 'employee_master_data',
            company_sub_operation: [this.operation], 'company_strict': true })) {
            const _this = this;
            setTimeout(function () {
                _this.router.navigate(['company/errors/unauthorized-access'], { skipLocationChange: true })
            }, 500);
            return;
        }
    }

    updateEmployeeExtraCurriculumDetails(event: any) {
        this.employeeExtraCurriculumForm.markAllAsTouched();
        Global.scrollToQuery("p.error-element")

        if (this.employeeExtraCurriculumForm.valid) {
            event.target.classList.add('btn-loading');

            this.companyuserService.updateEmployeeExtraCurriculumDetails({
                'extra_curricular_type': this.employeeExtraCurriculumForm.value.extra_curricular_type ?? "",
                'extracurriculum_name': this.employeeExtraCurriculumForm.value.extracurriculum_name ?? "",
                'description': this.employeeExtraCurriculumForm.value.description ?? "",
                'comments': this.employeeExtraCurriculumForm.value.comments ?? "",
                'extra_curricular_file_image': this.employeeExtraCurriculumForm.value.extra_curricular_file_image_file ?? "",
                'employee_id': this.employee_id,
                'extra_curri_id': this.extracurriculum_id,
            }).subscribe(res => {
                if (res.status == 'success') {
                    this.toastr.success(res.message);
                    this.fetchEmployeeDetails();

                    if (!this.extracurriculum_id) {
                        this.cancelEntry();
                    }
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
            
            let max_upload_file_size=this.max_upload_limit-this.net_uploaded_size;
            if(max_upload_file_size<0)
            {
                max_upload_file_size=0;
            }
            formGroup?.get('extra_curricular_file_image')?.setValidators([fileSizeValidator(event.target.files[0],Global.maxFileSize(max_upload_file_size))]);
            formGroup?.get('extra_curricular_file_image')?.updateValueAndValidity();
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
                    this.employee_details = res.employee_det
                } else {
                    this.toastr.error(res.message);
                }
                this.net_uploaded_size = +res?.employee_det?.total_file_size;
                if (isNaN(this.net_uploaded_size)) {
                  this.net_uploaded_size = 0;
                }
               if (this.net_uploaded_size >= this.max_upload_limit) {                
                this.employeeExtraCurriculumForm.controls['extra_curricular_file_image'].disable();
               }
                this.spinner.hide();
            }, (err) => {
                this.spinner.hide();
                this.toastr.error(Global.showServerErrorMessage(err));
            });
    }

    cancelEntry() {
        Global.resetForm(this.employeeExtraCurriculumForm);
        this.extracurriculum_id = "";
    }
    imageViewer(imagepath: any) {
        var modal: any = $('#image-viewer-modal');
        modal.modal();        
        $(modal).find('#image-src').attr('src', imagepath);
      }
    getEdit(item: any) {
        this.extracurriculum_id = item._id;
        this.employeeExtraCurriculumForm.patchValue({
            extra_curricular_type: item.extra_curricular_type,
            extracurriculum_name: item.extracurriculum_name,
            description: item.description,
            comments: item.comments,
        });

        Global.scrollToQuery("#extracurriculum-submit-section");
    }
    fetchCompanyDetails() {
        return new Promise((resolve, reject) => {
            this.spinner.show();
            this.companyuserService.getCompanyDetails()
                .subscribe((res: any) => {
                    if (res.status == 'success') {
                    this.max_upload_limit=+res?.company_det?.package[0]?.employee_vault;    
                    // this.net_uploaded_size=+res?.company_det?.total_file_size;
                    if(isNaN(this.max_upload_limit))
                    {
                        this.max_upload_limit=0;
                    }
                    // if(isNaN(this.net_uploaded_size))
                    // {
                    //     this.net_uploaded_size=0;
                    // }
                    // if(this.net_uploaded_size>=this.max_upload_limit)
                    // {
                    //     this.employeeExtraCurriculumForm.controls['extracurriculum_file_image'].disable();

                    // }

                    resolve(true);
                    } else {
                        this.toastr.error(res.message);
                        resolve(false);
                    }

                    this.spinner.hide();
                }, (err) => {
                    this.spinner.hide();
                    this.toastr.error(Global.showServerErrorMessage(err));
                    resolve(false);
                });
        })
    }
}

