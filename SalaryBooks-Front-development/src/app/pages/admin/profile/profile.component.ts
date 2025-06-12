import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from 'src/app/services/auth.service';
import { AdminService } from 'src/app/services/admin.service';
import * as Global from 'src/app/globals';
import { Title } from '@angular/platform-browser';
import { NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'admin-app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ADProfileComponent implements OnInit {
  BACKEND_URL: any;
  basicDetailsForm: UntypedFormGroup;
  passwordUpdateForm: UntypedFormGroup;
  profilePicUploadForm: UntypedFormGroup;
  userDetails: any;

  constructor(
    public formBuilder: UntypedFormBuilder,
    private authService: AuthService,
    private adminService: AdminService,
    private toastr: ToastrService,
    private titleService: Title,
    private spinner: NgxSpinnerService
  ) {
    this.basicDetailsForm = formBuilder.group({
      "first_name": [null, Validators.compose([Validators.required])],
      "last_name": [null, Validators.compose([Validators.required])],
      "phone_no": [null, Validators.compose([Validators.required, Validators.minLength(10), Validators.maxLength(10), Validators.pattern("^[0-9]*$")])],
      "email_id": [{ value: null, disabled: true }],
    });

    this.passwordUpdateForm = formBuilder.group({
      "old_password": [null, Validators.compose([Validators.required])],
      "password": [null, Validators.compose([Validators.required])],
      "password_confirmation": [null, Validators.compose([Validators.required])],
    });

    this.profilePicUploadForm = formBuilder.group({
      "image": [null, Validators.compose([Validators.required])],
      "imageSource": [null, Validators.compose([Validators.required])]
    });

    this.BACKEND_URL = Global.BACKEND_URL

    this.userDetails = {
      "profile_pic" : "",
      "first_name" : "",
      "last_name" : "",
      "email_id" : "",
    }
  }

  ngOnInit(): void {
    this.titleService.setTitle("Profile - " + Global.AppName);

    this.getAccountDetails();
  }

  getAccountDetails() {
    this.spinner.show();

    this.authService.getAdminAccountDetails()
      .subscribe(res => {
        if (res.status == 'success') {
          this.userDetails = res.user_data;

          this.basicDetailsForm.setValue({
            first_name: this.userDetails.first_name,
            last_name: this.userDetails.last_name,
            phone_no: this.userDetails.phone_no,
            email_id: this.userDetails.email_id,
          })
        }

        this.spinner.hide();
      }, (err) => {
        this.spinner.hide();
        this.toastr.error("Internal server error occured. Please try again later.");
      });
  }

  updateBaicDetails(event: any) {
    if (this.basicDetailsForm.valid) {
      event.target.classList.add('btn-loading');

      this.adminService.updateAccountData({
        'first_name': this.basicDetailsForm.value.first_name,
        'last_name': this.basicDetailsForm.value.last_name,
        'phone_no': this.basicDetailsForm.value.phone_no,
        'profile_pic' : ''
      }).subscribe(res => {
        if (res.status == 'success') {
          this.toastr.success(res.message);
          this.getAccountDetails();
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

  updateAccountPassword(event: any) {
    if (this.passwordUpdateForm.valid) {
      if (this.passwordUpdateForm.value.password != this.passwordUpdateForm.value.password_confirmation) {
        this.toastr.error("The password confirmation didn't matched");
        return;
      }

      event.target.classList.add('btn-loading');

      this.adminService.updateAccountPassword({
        'old_password': this.passwordUpdateForm.value.old_password,
        'password': this.passwordUpdateForm.value.password,
      }).subscribe(res => {
        if (res.status == 'success') {
          this.toastr.success(res.message);
          this.passwordUpdateForm.reset();
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

  updateAccountPic(event: any) {
    // console.log(this.profilePicUploadForm.value);

    if (this.profilePicUploadForm.valid) {
      event.target.classList.add('btn-loading');

      this.adminService.updateAccountData({
        'first_name': this.userDetails.first_name,
        'last_name': this.userDetails.last_name,
        'phone_no': this.userDetails.phone_no,
        'profile_pic': this.profilePicUploadForm.value.imageSource,
      }).subscribe(res => {
        if (res.status == 'success') {
          this.toastr.success(res.message);
          this.profilePicUploadForm.reset();
          this.getAccountDetails();
          $('#profPicModal').find('[data-dismiss="modal"]').click();
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

  onPofPicChanged(event: any) {
    if (event.target.files.length > 0) {
      const file = event.target.files[0];
      this.profilePicUploadForm.patchValue({
        imageSource: file
      })
    }
  }
}
