import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'admin-app-dashboard-header',
  templateUrl: './dashboard-header.component.html',
  styleUrls: ['./dashboard-header.component.css']
})
export class AdminDashboardHeaderComponent implements OnInit {
  userDetails : any;
  
  constructor() {
    let userDetails = localStorage.getItem('payroll-admin-user');
    if(userDetails){
      this.userDetails = JSON.parse(userDetails);
    }
  }

  ngOnInit(): void {
  }

}
