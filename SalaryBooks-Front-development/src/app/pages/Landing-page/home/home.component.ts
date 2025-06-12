import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { LandingPageService } from 'src/app/services/landing-page.service';
import * as Global from 'src/app/globals';
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  Global = Global
  homePageData:any
  homePostData:any[] = []

  constructor(
    private landingPageService:LandingPageService,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    this.fetchHomePageData();
    this.fetchHomePostData()
  }

  async fetchHomePageData(){
    try {
      let res = await this.landingPageService.fetchLandingPages({
        page_slug:'home',
      }).toPromise();

      if (res) {
        if (res.status == 'success') {
         return this.homePageData = res.docs[0];
        } else if (res.status == 'val_err') {
          return this.toastr.error(Global.showValidationMessage(res.val_msg));
        } else {
          throw res.message;
        }
      }
    } catch (err:any) {
      return this.toastr.error(err?.message || err);
    }
  }
  async fetchHomePostData(){
    try {
      let res = await this.landingPageService.fetchPagePosts(null).toPromise();

      if (res) {
        if (res.status == 'success') {
          return (this.homePostData = res.docs);
        } else if (res.status == 'val_err') {
          return this.toastr.error(Global.showValidationMessage(res.val_msg));
        } else {
          throw res.message;
        }
      }
    } catch (err: any) {
      return this.toastr.error(err?.message || err);
    }
  }

}
