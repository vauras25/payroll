import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import * as Global from 'src/app/globals';
import { LandingPageService } from 'src/app/services/landing-page.service';

@Component({
  selector: 'app-L-page-config',
  templateUrl: './L-page-config.component.html',
  styleUrls: ['./L-page-config.component.css'],
})
export class ADLPageConfigComponent implements OnInit {
  Global = Global;
  pagesList: any[] = [];
  editActionId = null;

  pageForm: FormGroup = new FormGroup({
    page_title: new FormControl('', Validators.required),
    page_slug: new FormControl(''),
    page_content: new FormControl(''),
    page_img: new FormControl(''),
    img_path: new FormControl(''),
  });

  constructor(
    private landingPageService: LandingPageService,
    private toastr: ToastrService
  ) {}

  ngOnInit() {
    this.fetchPages();
  }

  onFileChanged(event: any, formGroup: FormGroup, target: any) {
    if (event.target.files.length > 0) {
      const file = event.target.files[0];
      formGroup.patchValue({
        [target]: file,
      });
    }
  }

  async createPage(e: any) {
    try {
      if (this.pageForm.invalid) return this.pageForm.markAllAsTouched();
      let payload = this.pageForm.value;
      payload.page_img = payload.img_path;
      delete payload.img_path;
      e.target.classList.add('btn-loading');
      let res = await this.landingPageService.createPage(payload).toPromise();
      if (res) {
        if (res.status == 'success') {
          this.toastr.success(res.message);
          this.pageForm.reset();
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

  async updatePage(e: any) {
    try {
      if (this.pageForm.invalid) return this.pageForm.markAllAsTouched();
      let payload = this.pageForm.value;
      payload.page_id = this.editActionId;
      payload.page_img = payload.img_path;
      delete payload.img_path;
      delete payload.page_slug;
      e.target.classList.add('btn-loading');
      let res = await this.landingPageService.updatePage(payload).toPromise();
      if (res) {
        if (res.status == 'success') {
          this.toastr.success(res.message);
          this.cancelPageUpdation();
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

  async generatePageSlug(): Promise<any> {
    try {
      if (this.pageForm.invalid) {
        this.pageForm.get('page_slug')?.setValue(null);
        return this.pageForm.markAllAsTouched;
      }
      let page_slug = this.pageForm
        .get('page_title')
        ?.value?.split(' ')
        .join('_')
        .toLowerCase();
      let res = await this.landingPageService
        .generatePageSlug({ page_slug })
        .toPromise();
      if (res) {
        if (res.status == 'success') {
          return this.pageForm.get('page_slug')?.setValue(res.page_slug);
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

  async fetchPages() {
    try {
      let res = await this.landingPageService
        .fetchLandingPages(null)
        .toPromise();

      if (res) {
        if (res.status == 'success') {
          return (this.pagesList = res.docs);
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

  async updatePageStatus(page: any, status: any) {
    try {
      if (status == 'active') status = 'inActive';
      else status = 'active';

      let res = await this.landingPageService
        .updatePage({ ...page, page_id: page._id, status })
        .toPromise();
      if (res) {
        if (res.status == 'success') {
          this.toastr.success('Page Status Updated Sucessfully');
          return this.fetchPages();
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

  setPageFormValue(data: any) {
    this.cancelPageUpdation();
    this.pageForm.patchValue({
      page_title: data.page_title,
      page_slug: data.page_slug,
      page_content: data.page_content,
    });

    this.editActionId = data._id;
    window.scroll({ top: 0 });
  }

  cancelPageUpdation() {
    this.pageForm.reset();
    this.editActionId = null;
  }
}
