import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AppComponent } from 'src/app/app.component';

@Component({
  selector: 'subadmin-app-dashboard-sidebar',
  templateUrl: './dashboard-sidebar.component.html',
  styleUrls: ['./dashboard-sidebar.component.css']
})
export class SubadminDashboardSidebarComponent implements OnInit {

  constructor(
    public router: Router,
    public AppComponent: AppComponent
  ) { }

  ngOnInit(): void {
  }

}
