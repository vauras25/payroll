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
  selector: 'app-extracurricular',
  templateUrl: './extracurricular.component.html',
})
export class ExtracurricularComponent implements OnInit {
  Global = Global;
  operation: any;
  employee_id: any;
  education_id: any;
  @Input() employee_details: any;
  @Input() max_upload_limit:any ='';
  @Input() net_uploaded_size:any ='';
  curricularForm: UntypedFormGroup;
  curriculareditForm: UntypedFormGroup;
  isNew:boolean=false;
  @Output() submitCurricular = new EventEmitter<any>();
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
    this.curricularForm = formBuilder.group({
      extra_curricular_type: [null, Validators.compose([])],
      description: [null, Validators.compose([])],
      comments: [null, Validators.compose([])],
      accident_file_image: [null, Validators.compose([])],
      extra_curricular_file_preview: [null, Validators.compose([])],
  });
  this.curriculareditForm = formBuilder.group({

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

updatecurricularDetails(event: any,i:any) {
    this.curriculareditForm.markAllAsTouched();
    Global.scrollToQuery("p.error-element");
    if (this.curriculareditForm.valid) {
        event.target.classList.add('btn-loading');
        
        this.commonService.postData("employee/update-employee-extra-curricular",{
            'extra_curricular_type': this.getTemplateRows('template_data').at(i)?.value.extra_curricular_type ?? "",
            'description': this.getTemplateRows('template_data').at(i)?.value.description ?? "",
            'comments': this.getTemplateRows('template_data').at(i)?.value.comments ?? "",
            'accident_file_image': this.getTemplateRows('template_data').at(i)?.value.extra_curricular_file_preview ?? "",
            'extra_curri_id': this.getTemplateRows('template_data').at(i)?.value.extra_curri_id,
        }).subscribe(res => {
          this.spinner.hide();
            if (res.status == 'success') {
                this.toastr.success(res.message);
                this.submitCurricular.emit(true);
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
createcurricularDetails(event: any)
{
  this.curricularForm.markAllAsTouched();
  Global.scrollToQuery("p.error-element");
  if (this.curricularForm.valid) {
      event.target.classList.add('btn-loading');
      this.spinner.show();
     
      this.commonService.postData("employee/update-employee-extra-curricular",{
          'extra_curricular_type': this.curricularForm.value.extra_curricular_type ?? "",
          'description': this.curricularForm.value.description ,
          'comments': this.curricularForm.value.comments ,
          'accident_file_image': this.curricularForm.value.extra_curricular_file_preview ?? "",
      }).subscribe(res => {
        this.spinner.hide();
          if (res.status == 'success') {
            this.submitCurricular.emit(true);

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
        this.curricularForm?.get("accident_file_image")?.setValidators([fileSizeValidator(file,Global.maxFileSize(max_upload_file_size))]);
        this.curricularForm?.get("accident_file_image")?.updateValueAndValidity();
        formGroup.patchValue({
            [target]: file
        });
    }
}
onFileChangededit(event:any,index:any) {
  if (event.target.files.length > 0) {
      const file = event.target.files[0];  
  }
}
test(ev:any,i:any)
{
  if (ev.target.files.length > 0) {
    let max_upload_file_size=this.max_upload_limit-this.net_uploaded_size;

    const file = ev.target.files[0];
    this.getTemplateRows('template_data').at(i)?.get('extra_curricular_file_preview')?.setValidators([fileSizeValidator(file,Global.maxFileSize(max_upload_file_size))]);
    this.getTemplateRows('template_data').at(i)?.get('extra_curricular_file_preview')?.updateValueAndValidity();
    this.getTemplateRows('template_data').at(i)?.patchValue({
      extra_curricular_file_preview: file
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
          this.curricularForm.controls['accident_file_image'].disable();

      }
  (this.curriculareditForm.controls['template_data'] as FormArray).clear();

  let control = <FormArray>this.curriculareditForm.get('template_data');
  this.employee_details?.employee_details?.extra_curricular.forEach((elem:any) => {
  control.push(this.initTemplateRows('template_data', elem));

  });    
}

cancelEntry() {
    Global.scrollToQuery(this.curricularForm);
}


initTemplateRows(type: any, data: any = {}) {
  switch (type) {
    case 'template_data':
      return this.formBuilder.group({
        extra_curri_id:[data._id],
        extra_curricular_type: [data.extra_curricular_type, Validators.compose([])],
        description: [data.description , Validators.compose([])],
        comments: [data.comments , Validators.compose([])],
        accident_file_image: [data.extra_curricular_file_image, Validators.compose([])],
        extra_curricular_file_preview: [null, Validators.compose([])],
        isReadOnly: [true, Validators.compose([])],

      });
      break;
    default:
      return this.formBuilder.group({});
      break;
  }
}

addTemplateRows(type: any, data: any = {}) {
  const control = <FormArray>this.curriculareditForm.get(type);
  control.push(this.initTemplateRows(type, data));

}
getTemplateRows(type: any) {
  return (this.curriculareditForm.get(type) as FormArray).controls;
}
togglereadOnly(i:any,isReadOnly:boolean=false)
{
 
  this.getTemplateRows('template_data').at(i)?.patchValue({
    isReadOnly:isReadOnly
  });
}

}
