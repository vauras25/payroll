import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import * as Global from 'src/app/globals';

@Component({
  selector: 'admin-app-dashboard-topbar',
  templateUrl: './dashboard-topbar.component.html',
  styleUrls: ['./dashboard-topbar.component.css']
})
export class AdminDashboardTopbarComponent implements OnInit {
  userDetails: any;
  Global = Global;

  constructor(
    private authService: AuthService
  ) {
    if (localStorage.getItem('payroll-admin-user')) {
      this.userDetails = localStorage.getItem('payroll-admin-user')
      this.userDetails = JSON.parse(this.userDetails)
    }
  }

  ngOnInit(): void {
    if (!this.userDetails) {
      this.getAccountDetails();
    }
  }

  logout() {
    return this.authService.adminLogout();
  }

  getAccountDetails() {
    this.authService.getAdminAccountDetails()
      .subscribe(res => {
        if (res.status == 'success') {
          this.userDetails = res.user_data;
        }
      });
  }
}
