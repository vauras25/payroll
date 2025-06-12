import { Component, OnInit } from '@angular/core';
import {
  FormArray,
  FormControl,
  FormGroup,
  UntypedFormArray,
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import * as Global from 'src/app/globals';
import { CompanyuserService } from 'src/app/services/companyuser.service';

@Component({
  selector: 'app-employee-kpi-appraisal',
  templateUrl: './employee-kpi-appraisal.component.html',
  styleUrls: ['./employee-kpi-appraisal.component.css'],
})
export class CMPEmployeeKpiAppraisalComponent implements OnInit {
  Global = Global;
  kpiAppraisalDetail: any;
  isCalcMatch: boolean = true;
  assignKpiRows: any[] = [];
  employee_id: any;

  employeeKpiDetailForm: UntypedFormGroup;

  constructor(
    public formBuilder: UntypedFormBuilder,
    private companyuserService: CompanyuserService,
    private toastr: ToastrService,
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {
    this.employee_id = activatedRoute.snapshot.params['employee_id'];

    this.employeeKpiDetailForm = formBuilder.group({
      self_assign_rate: [
        null,
        Validators.compose([
          Validators.required,
          Validators.min(0),
          Validators.max(100),
        ]),
      ],
      lvl_1_assign_rate: [
        null,
        Validators.compose([
          Validators.required,
          Validators.min(0),
          Validators.max(100),
        ]),
      ],
      lvl_2_assign_rate: [
        null,
        Validators.compose([
          Validators.required,
          Validators.min(0),
          Validators.max(100),
        ]),
      ],
      status: [null, Validators.compose([Validators.required])],
      kpi_assign_data: this.formBuilder.array([]),
    });
  }

  calcMaxValueOfField(): number {
    let val = this.getTemplateRows('kpi_assign_data')
      ?.map((row) => {
        return row?.value?.assign_rating;
      })
      ?.reduce((partialSum, a) => partialSum + a, 0);
    return val || 0;
  }

  initTemplateRows(type: any, head_name: any = null, head_value: any = null) {
    switch (type) {
      case 'kpi_assign_data':
        return this.formBuilder.group({
          head_name: [head_name, Validators.compose([Validators.required])],
          assign_rating: [
            head_value,
            Validators.compose([
              Validators.required,
              Validators.min(0),
              Validators.max(100 - this.calcMaxValueOfField()),
            ]),
          ],
        });
        break;

      default:
        return this.formBuilder.group({});
        break;
    }
  }

  getTemplateRows(type: any) {
    return (this.employeeKpiDetailForm.get(type) as UntypedFormArray).controls;
  }

  removeTemplateRow(type: any, i: number) {
    const control = <UntypedFormArray>this.employeeKpiDetailForm.get(type);
    control.removeAt(i);
  }

  addTemplateRows(type: any, head_name: any = null, head_value: any = null) {
    const control = <UntypedFormArray>this.employeeKpiDetailForm.get(type);
    control.push(this.initTemplateRows(type, head_name, head_value));
  }

  sumOfTheFields() {
    this.isCalcMatch = true;
    let totalVal =
      this.employeeKpiDetailForm.get('self_assign_rate')?.value +
      this.employeeKpiDetailForm.get('lvl_1_assign_rate')?.value +
      this.employeeKpiDetailForm.get('lvl_2_assign_rate')?.value;
    if (totalVal > 100) this.isCalcMatch = false;
  }

  async ngOnInit() {
    await this.fetchEmployeeDetails();
    this.employeeKpiDetailForm.patchValue({
      self_assign_rate: this.kpiAppraisalDetail?.self_assignee?.assign_value,
      lvl_1_assign_rate: this.kpiAppraisalDetail?.lvl_1_assignee?.assign_value,
      lvl_2_assign_rate: this.kpiAppraisalDetail?.lvl_2_assignee?.assign_value,
      status: this.kpiAppraisalDetail?.status.toUpperCase(),
    });
    this.kpiAppraisalDetail?.rating_heads.forEach((d: any) => {
      this.addTemplateRows(
        'kpi_assign_data',
        d?.head_name,
        d?.head_value
      );
    });
  }

  async updateEmployeeKpiDetail(e: any) {
    try {
      if (this.employeeKpiDetailForm.invalid) {
        return this.employeeKpiDetailForm.markAllAsTouched();
      }
      let payload = this.employeeKpiDetailForm.value;
      payload.employee_id = this.employee_id;
      payload.status = payload?.status?.toLowerCase();

      let res = await this.companyuserService
        .updateEmployeeKpiDetail(payload)
        .toPromise();
      if (res.status !== 'success') throw res;
      this.toastr.success(res.message);
      // this.employeeKpiDetailForm.reset();
      // console.log(res);
    } catch (err: any) {
      e.target.classList.remove('btn-loading');
      if (err.status == 'val_err') {
        this.toastr.error(Global.showValidationMessage(err.val_msg));
      } else {
        this.toastr.error(Global.showServerErrorMessage(err));
        this.toastr.error(err.message);
      }
    }
  }

  async fetchEmployeeDetails() {
    try {
      let res = await this.companyuserService
        .getEmployeeDetails({ employee_id: this.employee_id })
        .toPromise();
      if (res.status !== 'success') throw res;
      this.kpiAppraisalDetail = res?.employee_det?.emp_det?.kpi_and_appraisal;
    } catch (err: any) {
      if (err.status == 'val_err') {
        this.toastr.error(Global.showValidationMessage(err.val_msg));
      } else {
        this.toastr.error(Global.showServerErrorMessage(err));
        this.toastr.error(err.message);
      }
    }
  }

  checkChangesOnForm(item: any) {}
}
