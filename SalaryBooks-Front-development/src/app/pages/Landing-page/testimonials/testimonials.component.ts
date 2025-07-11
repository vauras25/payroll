import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { LandingPageService } from 'src/app/services/landing-page.service';
import * as Global from 'src/app/globals';
@Component({
  selector: 'app-testimonials',
  templateUrl: './testimonials.component.html',
  styleUrls: ['./testimonials.component.css']
})
export class TestimonialsComponent implements OnInit {
  testimonialPageData:any
  testimonialData:any
  socialLinksData:any
  constructor(
    private landingPageService:LandingPageService,
    private toastr: ToastrService
  ) {
    this.fetchTestimonialPageData()
    this.fetchTestimonial()
    this.fetchFooterDynamicData()
  }
  ngOnInit(): void {
  }

  async fetchTestimonialPageData(){
    try {
      let res = await this.landingPageService.fetchLandingPages({
        page_slug:'testimonials',
      }).toPromise();

      if (res) {
        if (res.status == 'success') {
         return this.testimonialPageData = res.docs[0];
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

  async fetchTestimonial(){
    try {
      let res = await this.landingPageService.fetchPagePosts({category:'testimonial'}).toPromise();

      if (res) {
        if (res.status == 'success') {
          return (this.testimonialData = res.docs);
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
