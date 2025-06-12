import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, FormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AppComponent } from 'src/app/app.component';
import * as Global from 'src/app/globals';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-companyuser-login-page',
  templateUrl: './companyuser-login-page.component.html',
  styleUrls: ['./companyuser-login-page.component.css']
})
export class CompanyuserLoginPageComponent implements OnInit {
  loginForm: UntypedFormGroup;

  constructor(
    public formBuilder: UntypedFormBuilder,
    private titleService: Title,
    private authService: AuthService,
    private toastr: ToastrService,
    private router: Router,
    private AppComponent: AppComponent
  ) {
    this.loginForm = formBuilder.group({
      corporate_id: ['ivn123', Validators.compose([Validators.required])],
      userid: ['user001', Validators.compose([Validators.required])],
      password: ['qwer1234', Validators.compose([Validators.required])],
    });
  }

  ngOnInit(): void {
    this.titleService.setTitle("Company Login - " + Global.AppName);
  }

  login(event: any) {
    if (this.loginForm.valid) {
      event.target.classList.add('btn-loading');

      this.authService.companyUserLogin({
        'corporate_id': this.loginForm.value.corporate_id,
        'userid': this.loginForm.value.userid,
        'password': this.loginForm.value.password,
      }).subscribe(async res => {
        if (res.status == 'success') {
          if (res.curr_user_data) {
            localStorage.setItem('payroll-companyuser-token', res.token);
            localStorage.setItem('payroll-companyuser-user', JSON.stringify(res.curr_user_data));

            if (res.curr_user_data.user_type == 'company') {
              await this.AppComponent.fetchCompanyUserAuthDetails()
            } else if (res.curr_user_data.user_type == 'staff') {
              await this.AppComponent.fetchCompanyStaffAuthDetails()
            }

            this.router.navigate(['/company']);
          } else {
            this.toastr.error("Unquthorized Access");
            return;
          }

          this.toastr.success("logged in Successfully");
        } else if (res.status == 'val_err') {
          this.toastr.error(Global.showValidationMessage(res.val_msg));
        } else {
          this.toastr.error(res.message);
        }
        event.target.classList.remove('btn-loading');
      }, (err) => {
        event.target.classList.remove('btn-loading');
        this.toastr.error("Internal server error occured. Please try again later.");
      });
    }
  }
}
