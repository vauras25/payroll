import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, FormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import * as Global from 'src/app/globals';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-subadmin-login-page',
  templateUrl: './subadmin-login-page.component.html',
  styleUrls: ['./subadmin-login-page.component.css']
})
export class SubadminLoginPageComponent implements OnInit {
  loginForm: UntypedFormGroup;

  constructor(
    public formBuilder: UntypedFormBuilder,
    private titleService: Title,
    private authService: AuthService,
    private toastr: ToastrService,
    private router: Router
  ) {
    this.loginForm = formBuilder.group({
      corporate_id: ['ivadmin123', Validators.compose([Validators.required])],
      userid: ['Ivan001', Validators.compose([Validators.required])],
      password: ['12345678', Validators.compose([Validators.required])],
    });
  }

  ngOnInit(): void {
    this.titleService.setTitle("Subadmin Login - " + Global.AppName);
  }

  login(event: any) {
    if (this.loginForm.valid) {
      event.target.classList.add('btn-loading');

      this.authService.subAdminLogin({
        'corporate_id': this.loginForm.value.corporate_id,
        'userid': this.loginForm.value.userid,
        'password': this.loginForm.value.password,
      }).subscribe(res => {
        if (res.status == 'success') {
          if (res.subadmin) {
            localStorage.setItem('payroll-subadmin-token', res.token);
            localStorage.setItem('payroll-subadmin-user', JSON.stringify(res.superadmin));
            localStorage.setItem('payroll-subadmin-permission', JSON.stringify(res.permission));
            this.router.navigate(['/sub-admin']);
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
