import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import * as Global from 'src/app/globals';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.css']
})
export class HomePageComponent implements OnInit {

  constructor(
    private titleService: Title,
    public authService: AuthService
  ) { }

  ngOnInit(): void {
    this.titleService.setTitle("Home - " + Global.AppName);

    // console.log(this.authService.getSubAdminToken())
  }

}
