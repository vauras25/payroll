import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { LandingPageService } from 'src/app/services/landing-page.service';
import * as Global from 'src/app/globals';

@Component({
  selector: 'app-about-us',
  templateUrl: './about-us.component.html',
  styleUrls: ['./about-us.component.css']
})
export class AboutUsComponent implements OnInit {
  Global = Global
  aboutPageData:any
  aboutPostData:any

  constructor(
    private landingPageService:LandingPageService,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    this.fetchAboutPageData();
    this.fetchAboutPostData();
  }

  async fetchAboutPageData(){
    try {
      let res = await this.landingPageService.fetchLandingPages({
        page_slug:'about_us',
      }).toPromise();

      if (res) {
        if (res.status == 'success') {
         return this.aboutPageData = res.docs[0];
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

  async fetchAboutPostData(){
    try {
      let res = await this.landingPageService.fetchPagePosts(null).toPromise();

      if (res) {
        if (res.status == 'success') {
          return (this.aboutPostData = res.docs);
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
