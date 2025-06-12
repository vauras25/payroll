import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import * as Global from 'src/app/globals';
import { LandingPageService } from 'src/app/services/landing-page.service';

@Component({
  selector: 'app-L-settings',
  templateUrl: './L-settings.component.html',
  styleUrls: ['./L-settings.component.css'],
})
export class ADLSettingsComponent implements OnInit {
  isUpdateDisable: boolean = true;
  settingsDoc: any;

  Global = Global;
  socialLinks = [
    {
      title: 'Facebook',
      item_slug: 'facebook',
      link: null,
    },
    {
      title: 'LinkedIn',
      item_slug: 'linkedin',
      link: null,
    },
    {
      title: 'YouTube',
      item_slug: 'youtube',
      link: null,
    },
    {
      title: 'Instagram',
      item_slug: 'instagram',
      link: null,
    },
    {
      title: 'Twitter',
      item_slug: 'twitter',
      link: null,
    },
  ];

  settingFrom: FormGroup = new FormGroup({
    title: new FormControl('', Validators.required),
    description: new FormControl(''),
    social_links: new FormControl([]),
  });

  constructor(
    private landingPageService: LandingPageService,
    private toastr: ToastrService
  ) {}

  ngOnInit() {
    this.settingFrom.valueChanges.subscribe((d) => {
      this.isUpdateDisable = false;
      // console.log(d, this.isUpdateDisable);
    });
    this.fetchPages();
  }

  setSocialLink(e: any, target: any) {
    // if (e.target.value) {
      this.socialLinks = this.socialLinks.map((item) =>
        item.item_slug === target.item_slug
          ? { ...item, link: e.target.value }
          : item
      );
    // }
    // console.log(this.socialLinks);

  }

  async fetchPages(): Promise<any> {
    try {
      let res = await this.landingPageService.getSettings(null).toPromise();

      if (res) {
        if (res.status == 'success') {
          this.settingsDoc = res?.docs[0];
          this.settingFrom?.patchValue({
            title: this.settingsDoc?.title,
            description: this.settingsDoc?.description,
          });
          this.socialLinks.map((item) => {
            item.link = this.settingsDoc?.social_links?.find(
              (el: any) => el?.slug_name === item?.item_slug
            )?.link;
          });
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

  async updateSettings(e: any) {
    try {
      if (this.settingFrom.invalid) return this.settingFrom.markAllAsTouched();
      let payload = this.settingFrom.value;
      payload.social_links = [] = JSON.stringify(
        this.socialLinks.map((item) => {
          return {
            slug_name: item?.item_slug,
            link: item?.link,
          };
        })
      );
      if (this.settingsDoc) payload.setting_id = this.settingsDoc?._id;
      e.target.classList.add('btn-loading');
      let res = await this.landingPageService
        .updateSettings(payload)
        .toPromise();
      if (res) {
        if (res.status == 'success') {
          this.toastr.success('Settings updated successfully!')
          this.isUpdateDisable = true;
          e.target.classList.remove('btn-loading');
          return this.fetchPages();
        } else if (res.status == 'val_err') {
          e.target.classList.remove('btn-loading');
          return this.toastr.error(Global.showValidationMessage(res.val_msg));
        } else {
          throw res.message;
        }
      }
    } catch (err: any) {
      e.target.classList.remove('btn-loading');
      this.toastr.error(err?.message || err);
    }
  }

  // async update
  //
}
