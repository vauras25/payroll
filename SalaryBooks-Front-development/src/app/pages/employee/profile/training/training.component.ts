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
  selector: 'app-training',
  templateUrl: './training.component.html',
})
export class TrainingComponent implements OnInit {
  Global = Global;
  operation: any;
  employee_id: any;
  education_id: any;
  @Input() employee_details: any;
  @Input() max_upload_limit:any ='';
  @Input() net_uploaded_size:any ='';
  trainingForm: UntypedFormGroup;
  trainingeditForm: UntypedFormGroup;
  isNew:boolean=false;
  @Output() submitTraining = new EventEmitter<any>();
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
    this.trainingForm = formBuilder.group({
      training_type: [null, Validators.compose([])],
      description: [null, Validators.compose([])],
      comments: [null, Validators.compose([])],
      training_file_image: [null, Validators.compose([])],
      training_file_preview: [null, Validators.compose([])],
  });
  this.trainingeditForm = formBuilder.group({

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

updatetrainingDetails(event: any,i:any) {
    this.trainingeditForm.markAllAsTouched();
    Global.scrollToQuery("p.error-element");
    if (this.trainingeditForm.valid) {
        event.target.classList.add('btn-loading');
        
        this.commonService.postData("employee/update-employee-training",{
            'training_type': this.getTemplateRows('template_data').at(i)?.value.training_type ?? "",
            'description': this.getTemplateRows('template_data').at(i)?.value.description ?? "",
            'comments': this.getTemplateRows('template_data').at(i)?.value.comments ?? "",
            'training_file_image': this.getTemplateRows('template_data').at(i)?.value.training_file_preview ?? "",
            'training_id': this.getTemplateRows('template_data').at(i)?.value.training_id,
        }).subscribe(res => {
          this.spinner.hide();
            if (res.status == 'success') {
                this.toastr.success(res.message);
                this.submitTraining.emit(true);
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
crteatetrainingDetails(event: any)
{
  this.trainingForm.markAllAsTouched();
  Global.scrollToQuery("p.error-element");
  if (this.trainingForm.valid) {
      event.target.classList.add('btn-loading');
      this.spinner.show();
      this.commonService.postData("employee/update-employee-training",{
          'training_type': this.trainingForm.value.training_type ?? "",
          'description': this.trainingForm.value.description ?? "",
          'comments': this.trainingForm.value.comments ?? "",
          'training_file_image': this.trainingForm.value.training_file_preview ?? "",
      }).subscribe(res => {
        this.spinner.hide();
          if (res.status == 'success') {
            this.submitTraining.emit(true);

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
        this.trainingForm?.get("training_file_image")?.setValidators([fileSizeValidator(file,Global.maxFileSize(max_upload_file_size))]);
        this.trainingForm?.get("training_file_image")?.updateValueAndValidity();
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
    let max_upload_file_size=this.max_upload_limit-this.net_uploaded_size;

    const file = ev.target.files[0];
    this.getTemplateRows('template_data').at(i)?.get('training_file_preview')?.setValidators([fileSizeValidator(file,Global.maxFileSize(max_upload_file_size))]);
    this.getTemplateRows('template_data').at(i)?.get('training_file_preview')?.updateValueAndValidity();
    this.getTemplateRows('template_data').at(i)?.patchValue({
      training_file_preview: file
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
            this.trainingForm.controls['training_file_image'].disable();

        }
        
  (this.trainingeditForm.controls['template_data'] as FormArray).clear();

  let control = <FormArray>this.trainingeditForm.get('template_data');
  this.employee_details?.employee_details?.training.forEach((elem:any) => {
  control.push(this.initTemplateRows('template_data', elem));

  });    
}

cancelEntry() {
    Global.scrollToQuery(this.trainingForm);
}


initTemplateRows(type: any, data: any = {}) {
  switch (type) {
    case 'template_data':
      return this.formBuilder.group({
        training_id:[data._id],
        training_type: [data.training_type, Validators.compose([])],
        description: [data.description , Validators.compose([])],
        comments: [data.comments , Validators.compose([])],
        training_file_image: [data.training_file_image, Validators.compose([])],
        training_file_preview: [null, Validators.compose([])],
        isReadOnly: [true, Validators.compose([])],


      });

      break;
    default:
      return this.formBuilder.group({});
      break;
  }
}

addTemplateRows(type: any, data: any = {}) {
  const control = <FormArray>this.trainingeditForm.get(type);
  control.push(this.initTemplateRows(type, data));

}
getTemplateRows(type: any) {
  return (this.trainingeditForm.get(type) as FormArray).controls;
}
togglereadOnly(i:any,isReadOnly:boolean=false)
{
  this.getTemplateRows('template_data').at(i)?.patchValue({
    isReadOnly:isReadOnly
  });
}

}
