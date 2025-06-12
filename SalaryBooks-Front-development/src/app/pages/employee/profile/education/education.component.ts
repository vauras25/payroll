import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { AbstractControl, UntypedFormBuilder, FormControl, UntypedFormGroup, Validators, FormArray } from '@angular/forms';
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
import { fileSizeValidator } from 'src/app/globals';
@Component({
  selector: 'app-education',
  templateUrl: './education.component.html',
})
export class EducationComponent implements OnInit {
  Global = Global;
  operation: any;
  employee_id: any;
  education_id: any;
  @Input() employee_details: any;
  @Input() max_upload_limit:any ='';
  @Input() net_uploaded_size:any ='';
  employeeEducationForm: UntypedFormGroup;
  empEducationeditForm: UntypedFormGroup;
  isNew:boolean=false;
  @Output() submitEducation = new EventEmitter<any>();

  constructor(
    public formBuilder: UntypedFormBuilder,
    private titleService: Title,
    private toastr: ToastrService,
    private router: Router,
    private companyuserService: CompanyuserService,
    private spinner: NgxSpinnerService,
    private activatedRoute: ActivatedRoute,
    private datePipe: DatePipe,
    private AppComponent: AppComponent,
    public commonService: CommonService

  ) {

    this.employeeEducationForm = formBuilder.group({
      institute: [null, Validators.compose([])],
      university: [null, Validators.compose([])],
      stream: [null, Validators.compose([])],
      level: [null, Validators.compose([])],
      specialisation: [null, Validators.compose([])],
      completion: [null, Validators.compose([])],
      education_file_image: [null, Validators.compose([])],
      education_file_image_file: [null, Validators.compose([])],
  });
  this.empEducationeditForm = formBuilder.group({

    'template_data': this.formBuilder.array([

    ]),

  });
  this.education_id = "";
  }
  ngOnInit(): void {
    this.titleService.setTitle("Employees - " + Global.AppName);
    this.fetchEmployeeDetails();

}
ngOnChanges()
{
  this.fetchEmployeeDetails();
}

updateEmployeeEducationDetails(event: any,i:any) {
    this.employeeEducationForm.markAllAsTouched();
    Global.scrollToQuery("p.error-element");
    if (this.empEducationeditForm.valid) {
        event.target.classList.add('btn-loading');
        this.spinner.show();
        // console.log(this.getTemplateRows('template_data').at(i)?.value,"Response New");
        this.commonService.postData("employee/employee-update-education",{
            'institute': this.getTemplateRows('template_data').at(i)?.value.institute ?? "",
            'university': this.getTemplateRows('template_data').at(i)?.value.university ?? "",
            'stream': this.getTemplateRows('template_data').at(i)?.value.stream ?? "",
            'level': this.getTemplateRows('template_data').at(i)?.value.level ?? "",
            'specialisation': this.getTemplateRows('template_data').at(i)?.value.specialisation ?? "",
            'completion': this.getTemplateRows('template_data').at(i)?.value.completion ?? "",
            'education_file_image': this.getTemplateRows('template_data').at(i)?.value.education_file_image_file ?? "",
            'education_id': this.getTemplateRows('template_data').at(i)?.value.education_id,
        }).subscribe(res => {
          this.spinner.hide();
            if (res.status == 'success') {
                this.toastr.success(res.message);
                this.submitEducation.emit(true);
                this.getTemplateRows('template_data').at(i)?.patchValue({
                  isReadOnly:true
                });


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
crteateEmployeeEducationDetails(event: any)
{
  this.employeeEducationForm.markAllAsTouched();
  Global.scrollToQuery("p.error-element");
  if (this.employeeEducationForm.valid) {
      event.target.classList.add('btn-loading');
      this.spinner.show();
      this.commonService.postData("employee/employee-update-education",{
          'institute': this.employeeEducationForm.value.institute ?? "",
          'university': this.employeeEducationForm.value.university ?? "",
          'stream': this.employeeEducationForm.value.stream ?? "",
          'level': this.employeeEducationForm.value.level ?? "",
          'specialisation': this.employeeEducationForm.value.specialisation ?? "",
          'completion': this.employeeEducationForm.value.completion ?? "",
          'education_file_image': this.employeeEducationForm.value.education_file_image_file ?? "",
      }).subscribe(res => {
        this.spinner.hide();
          if (res.status == 'success') {
            this.submitEducation.emit(true);

              this.toastr.success(res.message);
              this.isNew=false;

              if (!this.education_id) {
                  this.cancelEntry();
              }
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
        this.employeeEducationForm?.get("education_file_image")?.setValidators([fileSizeValidator(file,Global.maxFileSize(max_upload_file_size))]);
        this.employeeEducationForm?.get("education_file_image")?.updateValueAndValidity();
        formGroup.patchValue({
            [target]: file
        });
    }
}
onFileChangededit(event:any,index:any) {
  if (event.target.files.length > 0) {
      const file = event.target.files[0];

      // this.getTemplateRows('template_data').at(i)?.patchValue({
      //   education_file_image_file: file
      // });

  }
}
test(ev:any,i:any)
{
  if (ev.target.files.length > 0) {
    const file = ev.target.files[0];
    let max_upload_file_size=this.max_upload_limit-this.net_uploaded_size;

    this.getTemplateRows('template_data').at(i)?.get('education_file_image_file')?.
    setValidators([fileSizeValidator(file,Global.maxFileSize(max_upload_file_size))]);
    this.getTemplateRows('template_data').at(i)?.get('education_file_image_file')?.updateValueAndValidity();
    this.getTemplateRows('template_data').at(i)?.patchValue({
      education_file_image_file: file
    });

}
}
fetchEmployeeDetails() {
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
      this.employeeEducationForm.controls['education_file_image'].disable();

  }

  (this.empEducationeditForm.controls['template_data'] as FormArray).clear();

  let control = <FormArray>this.empEducationeditForm.get('template_data');
  this.employee_details?.education.forEach((elem:any) => {
  control.push(this.initTemplateRows('template_data', elem));

  });
}

cancelEntry() {
    Global.scrollToQuery(this.employeeEducationForm);
}

getEdit(item: any) {
    this.education_id = item._id;
    this.employeeEducationForm.patchValue({
        institute: item.date,
        university: item.education_name,
        stream: item.description,
        level: item.comments,
        specialisation: item.comments,
        completion: item.comments,
    });

    Global.scrollToQuery("#education-submit-section");
}
initTemplateRows(type: any, data: any = {}) {
  switch (type) {
    case 'template_data':
      return this.formBuilder.group({
        education_id:[data._id],
        institute: [data.institute, Validators.compose([])],
        university: [data.university , Validators.compose([])],
        stream: [data.stream , Validators.compose([])],
        level: [data.level , Validators.compose([])],
        specialisation: [data.specialisation, Validators.compose([])],
        completion: [data.completion, Validators.compose([])],
        education_file_image: [data.education_file_image, Validators.compose([])],
        education_file_image_file: [null, Validators.compose([])],
        isReadOnly: [true, Validators.compose([])],

      });
      break;
    default:
      return this.formBuilder.group({});
      break;
  }
}

addTemplateRows(type: any, data: any = {}) {
  const control = <FormArray>this.empEducationeditForm.get(type);
  control.push(this.initTemplateRows(type, data));

}
getTemplateRows(type: any) {
  return (this.empEducationeditForm.get(type) as FormArray).controls;
}
togglereadOnly(i:any,isReadOnly:boolean=false)
{

  this.getTemplateRows('template_data').at(i)?.patchValue({
    isReadOnly:isReadOnly
  });
}


}
