import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, FormControl, UntypedFormGroup, Validators, FormGroup } from '@angular/forms';
import { Title,  } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AppComponent } from 'src/app/app.component';
import * as Global from 'src/app/globals';
import { AuthService } from 'src/app/services/auth.service';1
import { CommonService } from 'src/app/services/common.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;

  constructor(
    public formBuilder: UntypedFormBuilder,
    private titleService: Title,
    private authService: AuthService,
    private toastr: ToastrService,
    private router: Router,
    private AppComponent: AppComponent,
    private commonService: CommonService,
  ) {
    this.loginForm = formBuilder.group({
      corporate_id: ['ivn123', Validators.compose([Validators.required])],
      userid: ['user001', Validators.compose([Validators.required])],
      password: ['qwer1234', Validators.compose([Validators.required])],
    });
    if(window.location.pathname == '/employee/login'){
      this.loginForm.get('userid')?.setValue('emp115');
    }
    
  }

  ngOnInit(): void {
    this.titleService.setTitle("Employee Login - " + Global.AppName);
  }

  login(event: any) {
    if (this.loginForm.valid) {
      event.target.classList.add('btn-loading');
    // console.log('start')
      this.commonService.postDataRaw("employee_signin",this.loginForm.value).subscribe(async res => {
        if (res.status == 'success') {
          if (res.user) {
            const {user_type} = res.user;
            if(user_type == 'employee'){
              localStorage.setItem('payroll-companyemp-token', res.token);
              localStorage.setItem('payroll-companyemp-user', JSON.stringify(res.user));
              this.router.navigate(['/employee']);
              
            }
            if(user_type == 'company' || user_type == 'staff' ){
              localStorage.setItem('payroll-companyuser-token', res.token);
              localStorage.setItem('payroll-companyuser-user', JSON.stringify(res.user));
  
              if (res.user.user_type == 'company') {
                await this.AppComponent.fetchCompanyUserAuthDetails()
              } else if (res.user.user_type == 'staff') {
                await this.AppComponent.fetchCompanyStaffAuthDetails()
              }
              this.router.navigate(['/company']);
            }

            if(user_type == 'super_admin'){
              localStorage.setItem('payroll-admin-token', res.token);
              localStorage.setItem('payroll-admin-user', JSON.stringify(res.user));
              this.router.navigate(['/admin']);
            }
            
            this.toastr.success("logged in Successfully");
            // // if(res.user.user_type == 'super_admin'){
            // //   this.router.navigate(['/admin']);
            // return
            // // }
            // if(res.user.user_type == 'company'){
            //   this.router.navigate(['/company']);
            //   return
            // }
            // if(res.user.user_type == 'employee'){
            //   this.router.navigate(['/employee']);
            //   return
            // }
          } else {
            this.toastr.error("Unquthorized Access");
            return;
          }

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
