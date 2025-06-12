import { Component, OnInit } from '@angular/core';
import {
  UntypedFormArray,
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import * as Global from 'src/app/globals';
import { CompanyuserService } from 'src/app/services/companyuser.service';
import { AuthService } from 'src/app/services/auth.service';
import { CommonService } from 'src/app/services/common.service';

@Component({
  selector: 'app-employee-topbar',
  templateUrl: './topbar.component.html',
  styleUrls: ['../../employee-user-layout.component.css'],
})
export class EMPTopbarComponent implements OnInit {
  notificationList: any[] = [
    {
      img: 'https://via.placeholder.com/500',
      content:
        '<strong>Suzzeth Bungaos</strong> tagged you and 18 others in a post.',
      date: 'January 03, 2021 8:45am',
    },
    {
      img: 'https://via.placeholder.com/500',
      content:
        '<strong>Mellisa Brown</strong> appreciated your work <strong>The Social Network</strong>',
      date: 'January 02, 2021 12:44am',
    },
    {
      img: 'https://via.placeholder.com/500',
      content:
        '20+ new items added are for sale in your <strong>Sale Group</strong>',
      date: 'January 01, 2021 10:20pm',
    },
    {
      img: 'https://via.placeholder.com/500',
      content:
        '<strong>Julius Erving</strong> wants to connect with you on your conversation with <strong>Ronnie Mara</strong>',
      date: 'January 01, 2021 6:08pm',
    },
  ];

  Global = Global;
  employee_details: any = null;
  appraisal_details: any;
  isCalcMatch: boolean = true;
  assignKpiRows: any[] = [];
  employee_id: any;
  yearMaster: any[] = [];

  employeeKpiDetailForm: UntypedFormGroup;

  constructor(
    public formBuilder: UntypedFormBuilder,
    // private companyuserService: CompanyuserService,
    private commonService: CommonService,
    private toastr: ToastrService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private authService: AuthService
  ) {
    if(localStorage.getItem('payroll-companyemp-user')){
      this.employee_id = JSON.parse(
        localStorage.getItem('payroll-companyemp-user') || '{}'
      )?._id;
    }

    let currentYear = new Date().getFullYear();
    this.yearMaster = [];
    for (let index = 4; index >= 0; index--) {
      this.yearMaster.push({
        value: currentYear - index,
        description: currentYear - index,
      });
    }
    this.employeeKpiDetailForm = formBuilder.group({
      rating_year: [null, Validators.compose([Validators.required])],
      kpi_rating_data: this.formBuilder.array([]),
    });
  }

  initTemplateRows(
    type: any,
    head_name: any = null,
    head_value: any = null,
    assign_value: any = null
  ) {
    switch (type) {
      case 'kpi_rating_data':
        return this.formBuilder.group({
          head_name: [head_name, Validators.compose([Validators.required])],
          head_value: [head_value, Validators.compose([Validators.required])],
          assign_value: [
            assign_value,
            Validators.compose([
              Validators.required,
              Validators.min(0),
              Validators.max(head_value),
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

  addTemplateRows(
    type: any,
    head_name: any = 0,
    head_value: any = 0,
    assign_value: any = 0
  ) {
    const control = <UntypedFormArray>this.employeeKpiDetailForm.get(type);
    control.push(
      this.initTemplateRows(type, head_name, head_value, assign_value)
    );
  }

  async ngOnInit() {
    await this.fetchEmployeeDetails();
    let containter;
    if (this.appraisal_details) {
      containter = this.appraisal_details?.heads_data;
    } else {
      containter = this.employee_details?.kpi_and_appraisal?.rating_heads;
    }
    if(containter)
    {
      containter.forEach((d: any) => {
        this.addTemplateRows(
          'kpi_rating_data',
          d?.head_name || 0,
          d?.head_value || 0,
          d?.assign_value || 0
        );
      });
    }


    this.employeeKpiDetailForm.get('rating_year')?.setValue(
      this.yearMaster.find((obj: any) => {
        return obj.value == new Date().getFullYear();
      })
    );
  }

  async updateEmployeeKpiDetail(e: any) {
    try {
      // console.log(this.employeeKpiDetailForm.valid);

      if (this.employeeKpiDetailForm.invalid) {
        return this.employeeKpiDetailForm.markAllAsTouched();
      }
      let payload = this.employeeKpiDetailForm.value;
      payload.emp_id = this.employee_details.emp_id;
      payload.employee_id = this.employee_id;
      payload.rating_year = payload.rating_year.value;

      payload.contributors= [
        this.employee_details?.kpi_and_appraisal?.self_assignee,
        this.employee_details?.kpi_and_appraisal?.lvl_1_assignee,
        this.employee_details?.kpi_and_appraisal?.lvl_2_assignee
      ];

      let res = await this.commonService
        .postDataRaw('employee/add_employee_appraisal', payload)
        .toPromise();
      if (res.status !== 'success') throw res;
      $('#close_btn').click();
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
      let res = await this.commonService
        .postDataRaw('employee/get_employee_appraisal', {
          pageno: 1,
          employee_id: this.employee_id,
        })
        .toPromise();
      if (res.status !== 'success') throw res;
      res?.docs?.docs.forEach((d: any) => {
        this.employee_details = d.employee_detail;
        this.appraisal_details = d.appraisal;
        this.employee_details['emp_id'] = d.emp_id;
      });
    } catch (err: any) {
      if (err.status == 'val_err') {
        this.toastr.error(Global.showValidationMessage(err.val_msg));
      } else {
        this.toastr.error(Global.showServerErrorMessage(err));
        this.toastr.error(err.message);
      }
    }
  }
  logOut() {
    this.authService.empLogout();
  }

  openRateNowModal() {
    $('#rateNowModalButton').click();
  }
}
