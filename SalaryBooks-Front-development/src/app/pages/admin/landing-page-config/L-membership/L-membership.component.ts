import { Component, OnInit } from '@angular/core';
import { FormArray } from '@angular/forms';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import * as Global from 'src/app/globals';
import { LandingPageService } from 'src/app/services/landing-page.service';

@Component({
  selector: 'app-L-membership',
  templateUrl: './L-membership.component.html',
  styleUrls: ['./L-membership.component.css'],
})
export class ADLMembershipComponent implements OnInit {
  Global = Global;
  membershipPlansList: any[] = [];
  editActionId = null;

  membershipForm: FormGroup = new FormGroup({
    title: new FormControl('', Validators.required),
    amount: new FormControl('', Validators.required),
    features: new FormArray([]),
    duration: new FormControl(''),
    discount: new FormControl(''),
  });

  tenureMaster = [
    { value: 'Annualy', description: 'Annually' },
    { value: 'Quaterly', description: 'Quaterly' },
    { value: 'Monthly', description: 'Monthly' },
  ];

  constructor(
    private landingPageService: LandingPageService,
    private toastr: ToastrService
  ) {}

  get features(): FormArray {
    return this.membershipForm.get('features') as FormArray;
  }

  newFeature(): FormGroup {
    return new FormGroup({
      feature: new FormControl('', Validators.required),
    });
  }

  addFeature() {
    this.features.push(this.newFeature());
  }

  removeFeature(i: number) {
    this.features.removeAt(i);
  }

  ngOnInit() {
    this.fetchPlan();
  }

  async createPlan(e: any) {
    try {
      if (this.membershipForm.invalid)
        return this.membershipForm.markAllAsTouched();
      e.target.classList.add('btn-loading');
      let payload = this.membershipForm.value;
      payload.features = JSON.stringify(
        payload.features.map((val: any) => val.feature)
      );
      payload.duration = payload.duration.value ?? null;
      let res = await this.landingPageService
        .createMembershipPlan(payload)
        .toPromise();
      if (res) {
        if (res.status == 'success') {
          this.toastr.success(res.message);
          this.features.clear();
          this.membershipForm.reset();
          e.target.classList.remove('btn-loading');
          return this.fetchPlan();
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

  async updatePlan(e: any) {
    try {
      if (this.membershipForm.invalid)
        return this.membershipForm.markAllAsTouched();
      let payload = this.membershipForm.value;
      payload.plan_id = this.editActionId;
      payload.features = JSON.stringify(
        payload.features.map((val: any) => val.feature)
      );
      payload.duration = payload.duration.value ?? null;

      e.target.classList.add('btn-loading');
      let res = await this.landingPageService
        .updateMembershipPlan(payload)
        .toPromise();
      if (res) {
        if (res.status == 'success') {
          this.toastr.success(res.message);
          this.cancelPlanUpdation();
          e.target.classList.remove('btn-loading');
          return this.fetchPlan();
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

  async fetchPlan() {
    try {
      let res = await this.landingPageService
        .getMembershipPlans(null)
        .toPromise();

      if (res) {
        if (res.status == 'success') {
          return (this.membershipPlansList = res.docs);
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

  async updatePlanStatus(plan: any, status: any) {
    try {
      if (status == 'active') status = 'inActive';
      else status = 'active';

      let res = await this.landingPageService
        .updateMembershipPlan({ ...plan, plan_id: plan._id, status })
        .toPromise();
      if (res) {
        if (res.status == 'success') {
          this.toastr.success('Plan Status Updated Sucessfully');
          this.features.clear();
          return this.fetchPlan();
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

  setPlanFormValue(data: any) {
    this.cancelPlanUpdation();
    this.membershipForm.patchValue({
      title: data.title,
      amount: data.amount,
      duration: this.tenureMaster.find(d => d.value == data.duration),
    });
    if (data.features.length) {
      data.features.forEach((feature: any) => {
        this.features.push(
          new FormGroup({
            feature: new FormControl(feature, Validators.required),
          })
        );
        return;
      });
    }

    this.editActionId = data._id;
    window.scroll({ top: 0 });
  }

  cancelPlanUpdation() {
    this.membershipForm.reset();
    this.features.clear();
    this.editActionId = null;
  }
}
