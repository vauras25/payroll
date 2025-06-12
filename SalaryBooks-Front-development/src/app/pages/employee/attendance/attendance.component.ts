import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { AbstractControl, UntypedFormBuilder, FormControl, UntypedFormGroup, Validators } from '@angular/forms';
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
import * as moment from 'moment';
@Component({
    selector: 'employee-app-attendance',
    templateUrl: './attendance.component.html',
    styleUrls: ['../employee-user-layout.component.css']
})
export class EMPAttendanceComponent implements OnInit {
    Global = Global;
    operation: any;
    employee_id: any;
    contract_id: any;
    employee_details: any;
    employeeContractForm: UntypedFormGroup;
    @Input() isReadOnly:boolean;
    @Output() submitContract = new EventEmitter<any>();
    contract_file_image:any='';
    rows:any=[];
    register_type:any='';
    constructor(
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

    }

    ngOnInit(): void {
    this.fetchEmployeeDetails();   
    this.fetchTodayActivity()
    this.fetchAttendanceDetails(); 
    this.fetchEmployeeAttendanceDashboardData()
    }
    async fetchEmployeeDetails() {
        this.spinner.show();
        await this.commonService.postDataRaw("employee/get-account",{})
            .subscribe((res: any) => {
                if (res.status == 'success') {
                    this.employee_details = res.employee_data[0];
                    this.register_type=this.employee_details.employee_details.template_data.attendance_temp_data.register_type;
                } else {
                    this.toastr.error(res.message);
                }
    
                this.spinner.hide();
            }, (err) => {
                this.spinner.hide();
                this.toastr.error(Global.showServerErrorMessage(err));
            });
    }
    async fetchAttendanceDetails() {
        this.spinner.show();
        await this.commonService.postDataRaw("employee/employee-get-attendance",{})
            .subscribe((res: any) => {
                if (res.status == 'success') {
                    this.rows = res.attendance_details;
                } else {
                    this.toastr.error(res.message);
                }
    
                this.spinner.hide();
            }, (err) => {
                this.spinner.hide();
                this.toastr.error(Global.showServerErrorMessage(err));
            });
    }

    attendanceStatistics: any;    
  isAttendanceDataLoading:boolean = false;

  async fetchEmployeeAttendanceDashboardData() {
    try {
      this.isAttendanceDataLoading = true 
      this.spinner.show();
      let res = await this.commonService
        .postDataRaw('employee/employee-attendance-data', {})
        .toPromise();
      if (res.status !== 'success') throw res;
      this.attendanceStatistics = res?.data?.attendance_statistics;

      this.isAttendanceDataLoading = false
      this.spinner.hide();
    } catch (err: any) {
      if (err.message) {
        this.toastr.error(err.message);
      } else {
        this.toastr.error(Global.showServerErrorMessage(err));
      }
      this.isAttendanceDataLoading = false 
      this.spinner.hide();
    }
  }

  todayActivites:any[] = []
  async fetchTodayActivity(){
    try {
      await this.commonService.postDataRaw("employee/employee-attendance-log-status",
      {
          "attendance_date":moment().format('YYYY-MM-DD')
      }
      )
      .subscribe((res: any) => {
          if (res.status == 'success') {
              this.todayActivites = res.data?.entries;
              
          } else {
              this.toastr.error(res.message);
          }

          this.spinner.hide();
      }, (err) => {
          this.spinner.hide();
          this.toastr.error(Global.showServerErrorMessage(err));
      });
    } catch (err:any) {
      
    }
  }
}
