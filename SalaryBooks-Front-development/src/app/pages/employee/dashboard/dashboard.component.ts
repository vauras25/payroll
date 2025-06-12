import { Component, OnInit } from '@angular/core';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { CommonService } from 'src/app/services/common.service';
import * as Global from 'src/app/globals';
import { DatePipe } from '@angular/common';
import * as moment from 'moment';

declare var google: any; // Declare Google to avoid TypeScript errors

@Component({
  selector: 'employee-app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['../employee-user-layout.component.css'],
})
export class EMPDashboardComponent implements OnInit {
  dateNow = moment().format('YYYY-MM-DD');
  timeNow = moment().format('HH:mm:ss');
  geocoder: any;
  isSpinnerLoading: boolean = true;
  constructor(
    private toastr: ToastrService,
    private commonService: CommonService,
    private spinner: NgxSpinnerService,
    private datePipe: DatePipe
  ) {
    this.geocoder = new google.maps.Geocoder();

    setInterval(() => {
      this.timeNow = moment().format('HH:mm:ss');
      // this.timeNow = moment().format('DD MM YYY HH:mm:ss');
    }, 1);
    this.fetchEmployeeDetails();
    this.fetchTodayActivity()
    this.fetchEmployeeLeavesDashboardData();
    this.fetchEmployeeAttendanceDashboardData();
    // setInterval
  }

  ngOnInit(): void { }

  public pieChartOptions: ChartConfiguration['options'] = {
    aspectRatio: 2,
    plugins: {
      legend: {
        display: false,
        position: 'right',
      },
    },
  };

  public pieChartData: ChartData<'pie', number[], string | string[]> = {
    labels: ['A', 'B', 'C', 'D'],
    datasets: [
      {
        data: [25, 25, 25, 25],
        label: 'Label',
        backgroundColor: [
          'rgba(242,209,79,1)',
          'rgba(56,183,179,1)',
          'rgba(0,83,146,1)',
          'rgba(0,194,236,1)',
        ],
        borderColor: 'transparent',
      },
    ],
  };

  public pieChartType: ChartType = 'pie';

  // fetchEmployeeDetails() {

  //     this.spinner.show();
  //     this.commonService.postDataRaw("employee/employee-leave-type-list",{})
  //         .subscribe((res: any) => {
  //             this.spinner.hide();
  //             if (res.status == 'success') {
  //              this.leave_cat_lists=  res.leave_type ;

  //             } else {
  //                 this.toastr.error(res.message);
  //             }

  //             this.spinner.hide();
  //         }, (err) => {
  //             this.spinner.hide();
  //             this.toastr.error(Global.showServerErrorMessage(err));
  //         });
  //     }

  pendingRequests: any;
  leave_activities: any = [];
  leaveBalanceSummmary: any;
  isLeaveDataLoading: boolean = false;

  async fetchEmployeeLeavesDashboardData() {
    try {
      this.isLeaveDataLoading = true;
      this.spinner.show();
      let res = await this.commonService
        .postDataRaw('employee/employee-dashboard-leave-data', {})
        .toPromise();
      if (res.status !== 'success') throw res;
      this.pendingRequests = res.data?.pending_requests || [];
      this.leave_activities = res.data?.leave_types || [];
      this.isLeaveDataLoading = false;
      this.spinner.hide();
    } catch (err: any) {
      if (err.message) {
        this.toastr.error(err.message);
      } else {
        this.toastr.error(Global.showServerErrorMessage(err));
      }
      this.isLeaveDataLoading = false;
      this.spinner.hide();
    }
  }

  attendanceStatistics: any;
  isAttendanceDataLoading: boolean = false;

  async fetchEmployeeAttendanceDashboardData() {
    try {
      this.isAttendanceDataLoading = true;
      this.spinner.show();
      let res = await this.commonService
        .postDataRaw('employee/employee-dashboard-attendance-data', {})
        .toPromise();
      if (res.status !== 'success') throw res;
      this.attendanceStatistics = res?.data;

      this.isAttendanceDataLoading = false;
      this.spinner.hide();
    } catch (err: any) {
      if (err.message) {
        this.toastr.error(err.message);
      } else {
        this.toastr.error(Global.showServerErrorMessage(err));
      }
      this.isLeaveDataLoading = false;
      this.spinner.hide();
    }
  }

  locationMaster: any;

  viewLocation() {
    try {
      if (navigator.geolocation) {
        this.spinner.show();
        navigator.geolocation.getCurrentPosition(
          (p) => {
            const coords = p.coords;
            if (!coords.latitude && !coords.longitude) return;
            // if (!this.isUserInCoverageArea(coords.latitude, coords.longitude)) {
            //   this.spinner.hide();
            //   alert(
            //     'You are not under permitted radius. Please check your GPS accuracy and try again'
            //   );
            //   return;
            // }
            const latLng = new google.maps.LatLng(
              coords.latitude,
              coords.longitude
            );

            this.geocoder.geocode(
              { location: latLng },
              (results: any, status: any) => {
                this.locationMaster = {
                  location: results[0].formatted_address,
                  latitude: coords.latitude,
                  longitude: coords.longitude,
                  preLat: this.employee_details?.company_location?.latitude,
                  preLng: this.employee_details?.company_location?.longitude,
                  radius: this.employee_details?.company_location?.radius,
                  isUserInCoverageArea: this.isUserInCoverageArea(coords.latitude, coords.longitude)
                };
                this.spinner.hide();
                $('#viewLocation').click();
              }
            );
          },
          (err) => {
            this.spinner.hide();
            this.toastr.error(err?.message) 
          },
          {
            enableHighAccuracy: true,
          }
        );
      }
    } catch (err:any) {
      this.spinner.hide();
      this.toastr.error(err)
    }
  }

  employee_details: any;
  register_type: any;

  async fetchEmployeeDetails() {
    this.spinner.show();
    this.commonService.postDataRaw('employee/get-account', {}).subscribe(
      (res: any) => {
        if (res.status == 'success') {
          this.employee_details = res.employee_data[0];
          this.register_type =
            this.employee_details.employee_details.template_data.attendance_temp_data.register_type;
        } else {
          this.toastr.error(res.message);
        }

        this.spinner.hide();
      },
      (err) => {
        this.spinner.hide();
        this.toastr.error(Global.showServerErrorMessage(err));
      }
    );
  }

  isUserInCoverageArea(userLat: number, userLng: number): boolean {
    const predefinedLat = this.employee_details?.company_location?.latitude;
    const predefinedLng = this.employee_details?.company_location?.longitude;
    const radiusInMeters = this.employee_details?.company_location?.radius;
    const userLocation = new google.maps.LatLng(userLat, userLng);
    const predefinedLocation = new google.maps.LatLng(
      predefinedLat,
      predefinedLng
    );

    const distance = google.maps.geometry.spherical.computeDistanceBetween(
      userLocation,
      predefinedLocation
    );

    return distance <= radiusInMeters;
  }

  async empCheckInAndOut(closeBtn: any) {
    try {
      if (!this.locationMaster.latitude || !this.locationMaster.longitude) throw { message: "Location Data is Missing, Please Try Again!" }
      if (!this.isUserInCoverageArea(this.locationMaster.latitude, this.locationMaster.longitude)) {
        this.spinner.hide();
        alert(
          'You are not under permitted radius. Please check your GPS accuracy and try again'
        );
        return;
      }
      let payload = {
        latitude: this.locationMaster.latitude,
        longitude: this.locationMaster.longitude,
        attendance_date: this.dateNow,
        attendance_stat: 'P',
        login_time: this.timeNow
      };
      let res = await this.commonService.postDataRaw('employee/check-in-check-out', payload).toPromise();
      if (res.status !== 'success') throw res;
      this.toastr.success(res.message);
      closeBtn.click()
      this.locationMaster = null;
    } catch (err: any) {
      this.spinner.hide();
      if (err.message) {
        this.toastr.error(err.message);
      } else {
        this.toastr.error(Global.showServerErrorMessage(err));
      }
    }
  }
  IsPunchIn:any
  async fetchTodayActivity(){
    try {
      await this.commonService.postDataRaw("employee/employee-attendance-log-status",
      {
          "attendance_date":moment().format('YYYY-MM-DD')
      }
      )
      .subscribe((res: any) => {
          if (res.status == 'success') {
              if(res.data?.entries?.length){
                this.IsPunchIn = res.data?.entries[res.data?.entries.length - 1]?.entry_type === 'in';
              }else{
                this.IsPunchIn = false
              }
              
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
