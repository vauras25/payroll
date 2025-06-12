import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { UntypedFormBuilder, FormControl, UntypedFormGroup, Validators, FormGroup } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { AppComponent } from 'src/app/app.component';
import * as Global from 'src/app/globals';
import { AuthService } from 'src/app/services/auth.service';
import { CommonService } from 'src/app/services/common.service';
import { DatePipe } from '@angular/common';
import { AddressComponent } from './address/address.component';
import { BankDetailsComponent } from './bank-details/bank-details.component';
import { fileSizeValidator } from 'src/app/globals';

@Component({
    selector: 'employee-app-profile',
    templateUrl: './profile.component.html',
    styleUrls: ['../employee-user-layout.component.css'],
    encapsulation: ViewEncapsulation.None

})
export class EMPProfileComponent implements OnInit {
    employeeDetailsForm: FormGroup;
    yesNoMaster: any=[];
    maritalStatusMaster:any=Global.maritalStatusMaster;
    bloodGroupMaster:any=Global.bloodGroupMaster;
    religionMaster: any[] = Global.religionMaster;
    emp_aadhaar_image:any="";
    emp_pan_image:any="";
    emp_profile_image:any="";
    additional_id_image:any="";
    emp_passport_image:any="";
    sexMaster: any[] = Global.getGenderMaster();
    isReadOnly:boolean=true;
    isaddressReadOnly:boolean=true;
    isbankReadOnly:boolean=true;
    Global=Global;
    employee_details:any='';
    @ViewChild(AddressComponent ) address: AddressComponent ; 
    @ViewChild(BankDetailsComponent ) bank: BankDetailsComponent ; 
    max_upload_limit: number=0;
    net_uploaded_size: number=0;
    aadhaar_image_size:any=0;
    pan_image_size:any=0;
    passport_image_size:any=0;
    additional_image_size:any=0;
    profile_image_size:any=0;
    constructor(
        public formBuilder: UntypedFormBuilder,
        private titleService: Title,
        private authService: AuthService,
        private toastr: ToastrService,
        private router: Router,
        private AppComponent: AppComponent,
        private commonService: CommonService,
        private spinner: NgxSpinnerService,
        private datePipe: DatePipe,
        ) {

    }

    ngOnInit(): void {
    
        this.employeeDetailsForm = this.formBuilder.group({
            emp_first_name: [null, Validators.compose([Validators.required])],
            emp_last_name: [null, Validators.compose([Validators.required])],
            emp_father_name: [null, Validators.compose([])],
            email_id: [null, Validators.compose([Validators.email])],
            mobile_no: [null, Validators.compose([Validators.required, Validators.pattern("^[0-9]*$"), Validators.minLength(10), Validators.maxLength(10)])],
            alternate_mob_no: [null, Validators.compose([Validators.minLength(10), Validators.maxLength(10)])],
            emp_dob: [null, Validators.compose([Validators.required])],
            sex: [null, Validators.compose([Validators.required])],
            aadhar_no: [null, Validators.compose([Validators.pattern("^[0-9]*$"), Validators.minLength(12), Validators.maxLength(12)])],
            emp_aadhaar_image: [null, Validators.compose([])],
            emp_aadhaar_image_file: [null, Validators.compose([])],
            pan_no: [null, Validators.compose([Validators.pattern("^[A-Z]{5}[0-9]{4}[A-Z]{1}$")])],
            emp_pan_image: [null, Validators.compose([])],
            emp_pan_image_file: [null, Validators.compose([])],
            passport_no: [null, Validators.compose([])],
            emp_passport_image: [null, Validators.compose([])],
            emp_passport_image_file: [null, Validators.compose([])],
            passport_val_form: [null, Validators.compose([])],
            passport_val_to: [null, Validators.compose([])],
            nationality: [null, Validators.compose([])],
            blood_group: [null, Validators.compose([])],
            physical_disability: [null, Validators.compose([])],
            marital_status: [null, Validators.compose([])],
            marriage_date: [null, Validators.compose([])],
            emergency_contact_no: [null, Validators.compose([Validators.pattern("^[0-9]*$"), Validators.minLength(10), Validators.maxLength(10)])],
            emergency_contact_name: [null, Validators.compose([])],
            domicile: [null, Validators.compose([])],
            height: [null, Validators.compose([])],
            religion: [null, Validators.compose([])],
            additional_id_image: [null, Validators.compose([])],
            additional_id_image_file: [null, Validators.compose([])],
            profile_image: [null, Validators.compose([])],
            profile_image_file: [null, Validators.compose([])],
        });

        this.yesNoMaster = [
            { value: 'yes', description: 'Yes' },
            { value: 'no', description: 'No' },
        ]; 
        this.fetchEmployeeDetails();
    }
 
    fetchEmployeeDetails() {
        
            this.spinner.show();
            this.commonService.postDataRaw("employee/get-account",{})
                .subscribe((res: any) => {
                    this.spinner.hide();
                    if (res.status == 'success') {
                        // console.log(res.employee_det);
                            this.employee_details = res.employee_data[0];


                            this.employeeDetailsForm.patchValue({
                               
                                "emp_first_name": this.employee_details?.emp_first_name ?? null,
                                "emp_last_name": this.employee_details?.emp_last_name ?? null,
                                "emp_father_name": this.employee_details?.emp_father_name ?? null,
                                "email_id": this.employee_details?.email_id ?? null,
                                "mobile_no": this.employee_details?.mobile_no ?? null,
                                "alternate_mob_no": this.employee_details?.alternate_mob_no ?? null,
                                "emp_dob": this.employee_details?.emp_dob ? this.datePipe.transform(this.employee_details.emp_dob, 'YYYY-MM-dd') : null,
                                "sex": this.sexMaster.find((obj: any) => {
                                    return obj.value === this.employee_details?.sex
                                }) ?? null,
                                "aadhar_no": this.employee_details?.aadhar_no ?? null,
                                "pan_no": this.employee_details?.pan_no ?? null,
                                "passport_no": this.employee_details?.passport_no ?? null,
                                "passport_val_form": this.employee_details?.passport_val_form ?? null,
                                "passport_val_to": this.employee_details?.passport_val_to ?? null,
                                "nationality": this.employee_details?.nationality ?? null,
                                "blood_group": this.bloodGroupMaster.find((obj: any) => {
                                    return obj.value === this.employee_details.blood_group
                                }) ?? null,
                                "physical_disability": this.yesNoMaster.find((obj: any) => {
                                    return obj.value === this.employee_details.physical_disability
                                }) ?? null,
                                "marital_status": this.maritalStatusMaster.find((obj: any) => {
                                    return obj.value === this.employee_details.marital_status
                                }) ?? null,
                                "marriage_date": this.employee_details?.marriage_date ?? null,
                                "emergency_contact_no": this.employee_details?.emergency_contact_no ?? null,
                                "emergency_contact_name": this.employee_details?.emergency_contact_name ?? null,
                                "domicile": this.employee_details?.domicile ?? null,
                                "height": this.employee_details?.height ?? null,
                                "religion": this.religionMaster.find((obj: any) => {
                                    return obj.value === this.employee_details.religion
                                }) ?? "N/A",
                            })
                            this.emp_aadhaar_image=this.employee_details?.emp_aadhaar_image || "";
                            this.emp_profile_image=this.employee_details?.profile_pic || "";

                            this.emp_pan_image=this.employee_details?.emp_pan_image || "";
                            this.additional_id_image=this.employee_details?.additional_id_image || "";
                            this.emp_passport_image=this.employee_details?.emp_passport_image || "";
                            this.max_upload_limit=+this.employee_details?.package?.employee_vault;    
                            this.net_uploaded_size=+this.employee_details?.total_file_size;
                           
                            if(isNaN(this.max_upload_limit))
                            {
                                this.max_upload_limit=0;
                            }
                            if(isNaN(this.net_uploaded_size))
                            {
                                this.net_uploaded_size=0;
                            }
                            if(this.net_uploaded_size>=this.max_upload_limit )
                            {
                                this.employeeDetailsForm.controls['emp_aadhaar_image'].disable();
                                this.employeeDetailsForm.controls['emp_pan_image'].disable();
                                this.employeeDetailsForm.controls['emp_passport_image'].disable();
                                this.employeeDetailsForm.controls['additional_id_image'].disable();
                                this.employeeDetailsForm.controls['profile_image'].disable();

                            }


                    } else {
                        this.toastr.error(res.message);
                    }

                    this.spinner.hide();
                }, (err) => {
                    this.spinner.hide();
                    this.toastr.error(Global.showServerErrorMessage(err));
                });
      
    }
    onFileChanged(event: any, formGroup: UntypedFormGroup, file: any, target: any) {
        if (event.target.files.length > 0) {
            const file = event.target.files[0];
            
            if(target=='emp_aadhaar_image_file')
            {
                this.aadhaar_image_size=file.size;
            }
            if(target=='emp_passport_image_file')
            {
                this.passport_image_size=file.size;
            }
            if(target=='emp_pan_image_file')
            {
                this.pan_image_size=file.size;
            }
            if(target=='additional_id_image_file')
            {
                this.additional_image_size=file.size;
            }
            if(file=='profile_image_file')
            {
                this.profile_image_size=event.target.files[0].size;
            }
            formGroup.patchValue({
                [target]: file
            });
            let net_img_size=(this.aadhaar_image_size+this.pan_image_size+this.passport_image_size+this.additional_image_size+this.profile_image_size)/1024;
            if(isNaN(net_img_size))
            {
                net_img_size=0;
            }
            let max_upload_file_size=this.max_upload_limit-
            (this.net_uploaded_size+net_img_size);
            if(max_upload_file_size<0)
            {
                max_upload_file_size=0;
            }
            this.employeeDetailsForm?.get([target])?.setValidators([fileSizeValidator(file,Global.maxFileSize(max_upload_file_size))]);
            this.employeeDetailsForm?.get([target])?.updateValueAndValidity();

           

        }
    }
    cancelEntry() {
        Global.resetForm(this.employeeDetailsForm);
        this.isReadOnly=true;
    }
    updateEmployee(event: any) {
        this.employeeDetailsForm.markAllAsTouched();
        setTimeout(function () {
            Global.scrollToQuery("p.error-element");
        }, 100)

        if (this.employeeDetailsForm.valid) {
            event.target.classList.add('btn-loading');
            this.spinner.show();

            this.commonService.postData("employee/update-personal-details",{
                "first_name": this.employeeDetailsForm?.value?.emp_first_name ?? "",
                "last_name": this.employeeDetailsForm?.value?.emp_last_name ?? "",
                "father_name": this.employeeDetailsForm?.value?.emp_father_name ?? "",
                "email_id": this.employeeDetailsForm?.value?.email_id ?? "",
                "mobile_no": this.employeeDetailsForm?.value?.mobile_no ?? "",
                "alternate_mob_no": this.employeeDetailsForm?.value?.alternate_mob_no ?? "",
                "dob": this.employeeDetailsForm?.value?.emp_dob ?? "",
                "sex": this.employeeDetailsForm?.value?.sex?.value ?? "",
                "aadhar_no": this.employeeDetailsForm?.value?.aadhar_no ?? "",
                "emp_aadhaar_image": this.employeeDetailsForm?.value?.emp_aadhaar_image_file ?? "",
                "pan_no": this.employeeDetailsForm?.value?.pan_no ?? "",
                "emp_pan_image": this.employeeDetailsForm?.value?.emp_pan_image_file ?? "",
                "passport_no": this.employeeDetailsForm?.value?.passport_no ?? "",
                "emp_passport_image": this.employeeDetailsForm?.value?.emp_passport_image_file ?? "",
                "passport_val_form": this.employeeDetailsForm?.value?.passport_val_form ?? "",
                "passport_val_to": this.employeeDetailsForm?.value?.passport_val_to ?? "",
                "nationality": this.employeeDetailsForm?.value?.nationality ?? "",
                "blood_group": this.employeeDetailsForm?.value?.blood_group?.value ?? "",
                "physical_disability": this.employeeDetailsForm?.value?.physical_disability?.value ?? "",
                "marital_status": this.employeeDetailsForm?.value?.marital_status?.value ?? "",
                "marriage_date": this.employeeDetailsForm?.value?.marriage_date ?? "",
                "emergency_contact_no": this.employeeDetailsForm?.value?.emergency_contact_no ?? "",
                "emergency_contact_name": this.employeeDetailsForm?.value?.emergency_contact_name ?? "",
                "domicile": this.employeeDetailsForm?.value?.domicile ?? "",
                "height": this.employeeDetailsForm?.value?.height ?? "",
                "religion": this.employeeDetailsForm?.value?.religion?.value ?? "",
                "additional_id_image": this.employeeDetailsForm?.value?.additional_id_image_file ?? "",
                "profile_image": this.employeeDetailsForm?.value?.profile_image_file ?? "",

            }).subscribe(res => {
                this.spinner.hide();
                if (res.status == 'success') {
                    this.toastr.success(res.message);
                    
                    this.cancelEntry();
                    this.fetchEmployeeDetails();
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
    updateEmployeeAddress(ev:any)
    {
        this.address.updateEmployeeAddress(ev);
    }
    submitAddress(ev:any)
    {
       if(ev)
       {
        this.isaddressReadOnly=true;
        this.fetchEmployeeDetails();
       }
    }
    updateEmployeeBankDetails(ev:any)
    {
        this.bank.updateEmployeeBankDetails(ev);

    }
    submitbankDetails(ev:any)
    {
        if(ev)
        {
            this.isbankReadOnly=true;
            this.fetchEmployeeDetails();
        }
    }
    submitEducation(ev:any)
    {
       if(ev)
       {
        this.fetchEmployeeDetails();
       }
    }
    submitAccident(ev:any)
    {
       if(ev)
       {
        this.fetchEmployeeDetails();
       }
    }
    submitTraining(ev:any)
    {
       if(ev)
       {
        this.fetchEmployeeDetails();
       }
    }
    submitCurricular(ev:any)
    {
        if(ev)
       {
        this.fetchEmployeeDetails();
       }
    }
    submitESI(ev:any)
    {
        if(ev)
       {
        this.fetchEmployeeDetails();
       }
    }
   
    
    
}
