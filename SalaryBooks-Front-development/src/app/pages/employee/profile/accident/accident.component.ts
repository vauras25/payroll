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
@Component({
  selector: 'app-accident',
  templateUrl: './accident.component.html',
})
export class AccidentComponent implements OnInit {
  Global = Global;
  operation: any;
  employee_id: any;
  accident_id: any;
  @Input() employee_details: any;
  accidentForm: UntypedFormGroup;
  accidenteditForm: UntypedFormGroup;
  isNew:boolean=false;
  @Output() submitAccident = new EventEmitter<any>();
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
    this.accidentForm = formBuilder.group({
      accident_type: [null, Validators.compose([])],
      description: [null, Validators.compose([])],
      comments: [null, Validators.compose([])],
      date: [null, Validators.compose([])],
      accident_id: [null, Validators.compose([])],
     
  });
  this.accidenteditForm = formBuilder.group({

    'template_data': this.formBuilder.array([
     
    ]),
   
  });  



  }

  ngOnInit(): void {
    this.titleService.setTitle("Employees - " + Global.AppName);
    this.fetchEmployeeDetails();  
  }
  updateEmployeeaccidentDetails(event: any,i:any) {
    this.accidentForm.markAllAsTouched();
    Global.scrollToQuery("p.error-element");
    if (this.accidentForm.valid) {
        event.target.classList.add('btn-loading');
        this.spinner.show();
        this.commonService.postData("employee/update-employee-accident-details",{
            'accident_type': this.getTemplateRows('template_data').at(i)?.value.accident_type ?? "",
            'description': this.getTemplateRows('template_data').at(i)?.value.description ?? "",
            'comments': this.getTemplateRows('template_data').at(i)?.value.comments ?? "",
            'date': this.getTemplateRows('template_data').at(i)?.value.date ?? "",
            'accident_id': this.getTemplateRows('template_data').at(i)?.value.accident_id,
        }).subscribe(res => {
          this.spinner.hide();
            if (res.status == 'success') {
                this.toastr.success(res.message);
                this.submitAccident.emit(true);
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
crteateEmployeeaccidentDetails(event: any)
{
  this.accidentForm.markAllAsTouched();
  Global.scrollToQuery("p.error-element");
  if (this.accidentForm.valid) {
      event.target.classList.add('btn-loading');
      this.spinner.show();
      this.commonService.postData("employee/update-employee-accident-details",this.accidentForm.valid).subscribe(res => {
        this.spinner.hide();
          if (res.status == 'success') {
            this.submitAccident.emit(true);
              this.toastr.success(res.message);
              this.isNew=false;

              if (!this.accident_id) {
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
fetchEmployeeDetails() {
  (this.accidenteditForm.controls['template_data'] as FormArray).clear();

  let control = <FormArray>this.accidenteditForm.get('template_data');
  this.employee_details?.accident.forEach((elem:any) => {
  control.push(this.initTemplateRows('template_data', elem));

  });    
}

cancelEntry() {
    Global.scrollToQuery(this.accidentForm);
}

getEdit(item: any) {
    this.accident_id = item._id;
    this.accidentForm.patchValue({
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
        accident_id:[data._id],
        accident_type: [data.accident_type, Validators.compose([])],
        description: [data.description , Validators.compose([])],
        comments: [data.comments , Validators.compose([])],
        date: [data.date , Validators.compose([])],
        isReadOnly: [true, Validators.compose([])],

      });
      break;
    default:
      return this.formBuilder.group({});
      break;
  }
}

addTemplateRows(type: any, data: any = {}) {
  const control = <FormArray>this.accidenteditForm.get(type);
  control.push(this.initTemplateRows(type, data));

}
getTemplateRows(type: any) {
  return (this.accidenteditForm.get(type) as FormArray).controls;
}
togglereadOnly(i:any,isReadOnly:boolean=false)
{
 
  this.getTemplateRows('template_data').at(i)?.patchValue({
    isReadOnly:isReadOnly
  });
}
}
