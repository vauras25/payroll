import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import * as Global from 'src/app/globals';
import { CompanyuserService } from 'src/app/services/companyuser.service';

@Component({
  selector: 'companyuser-app-attendance-configuration',
  templateUrl: './configuration.component.html',
  styleUrls: ['./configuration.component.css']
})
export class CMPAttendanceConfigurationComponent implements OnInit {
  attendance_config_data: any = null;

  constructor(
    private titleService: Title,
    private toastr: ToastrService,
    protected companyuserService: CompanyuserService,
    private spinner: NgxSpinnerService
  ) { }

  ngOnInit(): void {
    this.titleService.setTitle("Configuration | Attendance Management - " + Global.AppName);

    this.fetch();
  }

  fetch() {
    this.spinner.show();
    this.companyuserService.getAttendanceConfiguration().subscribe(res => {
      if (res.status == 'success') {
        this.attendance_config_data = res.attendance_config_data;

        if (this.attendance_config_data?.attendance_days) {
          this.attendance_config_data.attendance_days = this.attendance_config_data.attendance_days.replace(/_/g, " ")
        }
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
