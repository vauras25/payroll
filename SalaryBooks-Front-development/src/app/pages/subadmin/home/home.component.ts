import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { AdminService } from 'src/app/services/admin.service';
import * as Global from 'src/app/globals';


@Component({
  selector: 'subadmin-app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class SADHomeComponent implements OnInit {
  constructor(private adminService: AdminService, private titleService: Title) { }

  ngOnInit(): void {
    this.titleService.setTitle("Home - " + Global.AppName);
  }

}
