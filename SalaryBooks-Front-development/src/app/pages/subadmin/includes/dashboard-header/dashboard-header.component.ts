import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'subadmin-app-dashboard-header',
  templateUrl: './dashboard-header.component.html',
  styleUrls: ['./dashboard-header.component.css']
})
export class SubadminDashboardHeaderComponent implements OnInit {
  userDetails : any;

  constructor() {
    let userDetails = localStorage.getItem('payroll-sudadmin-user');
    if(userDetails){
      this.userDetails = JSON.parse(userDetails);
    }
  }

  ngOnInit(): void {
  }

}
