import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import * as ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import * as Global from 'src/app/globals';
import { LandingPageService } from 'src/app/services/landing-page.service';

@Component({
  selector: 'app-L-posts',
  templateUrl: './L-posts.component.html',
  styleUrls: ['./L-posts.component.css'],
})
export class ADLPostsComponent implements OnInit {
  public Editor = ClassicEditor;
  Global = Global;
  postsList: any[] = [];
  editActionId = null;

  postForm: FormGroup = new FormGroup({
    title: new FormControl('', Validators.required),
    category: new FormControl('', Validators.required),
    content: new FormControl(null),
    post_img: new FormControl(''),
    img_path: new FormControl(''),
  });

  constructor(
    private landingPageService: LandingPageService,
    private toastr: ToastrService
  ) {}

  ngOnInit() {
    this.fetchPosts();
  }

  onFileChanged(event: any, formGroup: FormGroup, target: any) {
    if (event.target.files.length > 0) {
      const file = event.target.files[0];
      formGroup.patchValue({
        [target]: file,
      });
    }
  }

  async createPost(e: any) {
    try {
      if (this.postForm.invalid) return this.postForm.markAllAsTouched();
      let payload = this.postForm.value;
      payload.post_img = payload.img_path;
      delete payload.img_path;
      e.target.classList.add('btn-loading');
      let res = await this.landingPageService.createPost(payload).toPromise();
      if (res) {
        if (res.status == 'success') {
          this.toastr.success(res.message);
          this.postForm.reset();
          e.target.classList.remove('btn-loading');

          return this.fetchPosts();
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

  async updatePost(e: any) {
    try {
      if (this.postForm.invalid) return this.postForm.markAllAsTouched();
      let payload = this.postForm.value;
      payload.post_id = this.editActionId;
      payload.post_img = payload.img_path;
      delete payload.img_path;
      e.target.classList.add('btn-loading');
      let res = await this.landingPageService.updatePost(payload).toPromise();
      if (res) {
        if (res.status == 'success') {
          this.toastr.success(res.message);
          this.cancelPostUpdation();
          e.target.classList.remove('btn-loading');
          return this.fetchPosts();
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

  async fetchPosts() {
    try {
      let res = await this.landingPageService.fetchPagePosts(null).toPromise();

      if (res) {
        if (res.status == 'success') {
          return (this.postsList = res.docs);
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

  async updatePostStatus(post: any, status: any) {
    // console.log(post);

    try {
      if (status == 'active') status = 'inActive';
      else status = 'active';

      let res = await this.landingPageService
        .updatePost({ ...post, post_id: post._id, status })
        .toPromise();
      if (res) {
        if (res.status == 'success') {
          this.toastr.success('Post status updated successfully!');
          return this.fetchPosts();
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
  setPostFormValue(data: any) {
    this.cancelPostUpdation();

    this.postForm.patchValue({
      title: data.title,
      category: data.category,
      content: data?.content ?? null,
    });

    this.editActionId = data._id;
    window.scroll({ top: 0 });
  }

  cancelPostUpdation() {
    this.postForm.reset();
    this.editActionId = null;
  }
}
