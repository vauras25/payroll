import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'companyuser-app-dashboard-header',
  templateUrl: './dashboard-header.component.html',
  styleUrls: ['./dashboard-header.component.css']
})
export class CompanyuserDashboardHeaderComponent implements OnInit {
  userDetails : any;

  constructor() {
    let userDetails = localStorage.getItem('payroll-companyuser-user');
    if(userDetails){
      this.userDetails = JSON.parse(userDetails);

    }
  }

  ngOnInit(): void {
  }

}
