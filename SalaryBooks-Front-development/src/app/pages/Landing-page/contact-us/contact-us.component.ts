import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { LandingPageService } from 'src/app/services/landing-page.service';
import * as Global from 'src/app/globals';
@Component({
  selector: 'app-contact-us',
  templateUrl: './contact-us.component.html',
  styleUrls: ['./contact-us.component.css']
})
export class ContactUsComponent implements OnInit {

  Global = Global
  contactPageData:any
  socialLinksData:any

  constructor(
    private landingPageService:LandingPageService,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    this.fetchContactPageData();
    this.fetchFooterDynamicData();
  }

  async fetchContactPageData(){
    try {
      let res = await this.landingPageService.fetchLandingPages({
        page_slug:'contact_us',
      }).toPromise();

      if (res) {
        if (res.status == 'success') {
         return this.contactPageData = res.docs[0];
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
  async fetchFooterDynamicData(){
    try {
      let res = await this.landingPageService.getSettings(null).toPromise();

      if (res) {
        if (res.status == 'success') {
          return this.socialLinksData = res?.docs[0];
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
