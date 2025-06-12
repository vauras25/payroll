import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AppComponent } from 'src/app/app.component';
import * as Global from 'src/app/globals';

@Component({
  selector: 'companyuser-app-dashboard-sidebar',
  templateUrl: './dashboard-sidebar.component.html',
  styleUrls: ['./dashboard-sidebar.component.css']
})
export class CompanyuserDashboardSidebarComponent implements OnInit {
  Global = Global
  constructor(
    public router: Router,
    public AppComponent: AppComponent
  ) { }

  ngOnInit(): void {
  }

}
