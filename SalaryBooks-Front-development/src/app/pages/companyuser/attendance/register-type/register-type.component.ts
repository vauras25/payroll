import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { CompanyuserService } from 'src/app/services/companyuser.service';
import * as Global from 'src/app/globals';

@Component({
  selector: 'companyuser-app-attendance-register-type',
  templateUrl: './register-type.component.html',
  styleUrls: ['./register-type.component.css']
})
export class CMPAttendanceRegisterTypeComponent implements OnInit {
  registerTypeForm: UntypedFormGroup;
  dailyRegisterTypeMaster: any[];

  constructor(
    private titleService: Title,
    private toastr: ToastrService,
    protected companyuserService: CompanyuserService,
    private spinner: NgxSpinnerService,
    public formBuilder: UntypedFormBuilder,
  ) {
    this.registerTypeForm = formBuilder.group({
      register_type: [null, Validators.compose([Validators.required])],
      daily_type: [null, Validators.compose([])],
    });

    this.dailyRegisterTypeMaster = [
      { value: 'whole_day', description: 'Whole Day' },
      { value: 'office_half', description: 'Office Half' },
      { value: 'time_basis', description: 'Time Basis' },
    ];

    this.registerTypeForm.get('register_type')?.valueChanges.subscribe(val => {
      if (val == 'daily') {
        this.registerTypeForm.controls['daily_type'].setValidators([Validators.required]);
        $('#register-type-section').show(300);
      } else {
        this.registerTypeForm.controls['daily_type'].clearValidators();
        $('#register-type-section').hide(300);
      }

      this.registerTypeForm.controls['daily_type'].updateValueAndValidity();
    });
  }

  ngOnInit(): void {
    this.titleService.setTitle("Register Type | Attendance Management - " + Global.AppName);

    this.fetchRegisterType();
  }

  submitRegisterType(event: any) {
    if (this.registerTypeForm.valid) {
      event.target.classList.add('btn-loading');

      this.companyuserService.updateAttendanceRegister({
        'register_type': this.registerTypeForm.value.register_type ?? "",
        'daily_type': this.registerTypeForm.value.daily_type.value ?? "",
      }).subscribe(res => {
        if (res.status == 'success') {
          Global.resetForm(this.registerTypeForm)
          this.toastr.success(res.message);
          this.fetchRegisterType();
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

  fetchRegisterType() {
    this.spinner.show();
    this.companyuserService.fetchAttendanceRegister().subscribe(res => {
      if (res.status == 'success') {
        let register_type = res.register;

        this.registerTypeForm.patchValue({
          'register_type': register_type.register_type,
          'daily_type': this.dailyRegisterTypeMaster.find((obj: any) => {
            return obj.value == register_type.daily_type
          }) ?? null
        });
      } else if (res.status == 'val_err') {
        this.toastr.error(Global.showValidationMessage(res.val_msg));
      } else {
        this.toastr.error(res.message);
      }

      this.spinner.hide();
    }, (err) => {
      this.toastr.error(Global.showServerErrorMessage(err));
      this.spinner.hide();
    });
  }
}
