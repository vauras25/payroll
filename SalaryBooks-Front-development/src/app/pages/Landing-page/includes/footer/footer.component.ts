import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { LandingPageService } from 'src/app/services/landing-page.service';
import * as Global from 'src/app/globals';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css']
})
export class FooterComponent implements OnInit {
  footerDynamicData:any
  constructor(
    private landingPageService: LandingPageService,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    this.fetchFooterDynamicData()
  }

  async fetchFooterDynamicData(){
    try {
      let res = await this.landingPageService.getSettings(null).toPromise();

      if (res) {
        if (res.status == 'success') {
          return this.footerDynamicData = res?.docs[0];
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
