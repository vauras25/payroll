import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import * as Global from 'src/app/globals';
import { LandingPageService } from 'src/app/services/landing-page.service';
@Component({
  selector: 'app-membership',
  templateUrl: './membership.component.html',
  styleUrls: ['./membership.component.css'],
})
export class MembershipComponent implements OnInit {
  membershipPageData: any;
  postData: any;
  socialLinksData: any;
  membershipPlans:any[] = []
  constructor(
    private landingPageService: LandingPageService,
    private toastr: ToastrService
  ) {
    this.fetchMembershipPageData();
    this.fetchTestimonial();
    this.fetchFooterDynamicData();
    this.fetchPlans()
  }
  ngOnInit(): void {}

  async fetchMembershipPageData() {
    try {
      let res = await this.landingPageService
        .fetchLandingPages({
          page_slug: 'membership',
        })
        .toPromise();

      if (res) {
        if (res.status == 'success') {
          return (this.membershipPageData = res.docs[0]);
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
  async fetchTestimonial() {
    try {
      let res = await this.landingPageService
        .fetchPagePosts(null)
        .toPromise();

      if (res) {
        if (res.status == 'success') {
          return (this.postData = res.docs);
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
  async fetchFooterDynamicData() {
    try {
      let res = await this.landingPageService.getSettings(null).toPromise();

      if (res) {
        if (res.status == 'success') {
          return (this.socialLinksData = res?.docs[0]);
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
  async fetchPlans() {
    try {
      let res = await this.landingPageService
        .getMembershipPlans({status:'active'})
        .toPromise();

      if (res) {
        if (res.status == 'success') {
          return (this.membershipPlans = res.docs);
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
