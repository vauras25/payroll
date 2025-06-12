import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'subadmin-app-dashboard-topbar',
  templateUrl: './dashboard-topbar.component.html',
  styleUrls: ['./dashboard-topbar.component.css']
})
export class SubadminDashboardTopbarComponent implements OnInit {
  userDetails : any;

  constructor(
    private authService : AuthService
  ) {
    if(localStorage.getItem('payroll-subadmin-user')){
      this.userDetails = localStorage.getItem('payroll-subadmin-user')
    }
  }

  ngOnInit(): void {
    this.getAccountDetails();
  }

  logout(){
    return this.authService.subAdminLogout();
  }

  getAccountDetails() {
    this.authService.getSubAdminAccountDetails()
      .subscribe(res => {
        if (res.status == 'success') {
          this.userDetails = res.user_data;
        }
      });
  }
}
