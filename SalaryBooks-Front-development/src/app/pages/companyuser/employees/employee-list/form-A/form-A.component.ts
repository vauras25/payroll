import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { CompanyuserService } from 'src/app/services/companyuser.service';
import * as Global from 'src/app/globals';

class employeeReport {
  _id: string | null;
  corporate_id: string | null;
  emp_id: string | null;
  emp_first_name: string | null;
  emp_last_name: string | null;
  emp_father_name: string | null;
  email_id: string | null;
  mobile_no: string | null;
  emp_dob: string | null;
  sex: string | null;
  pan_no: string | null;
  aadhar_no: string | null;
  status: string | null;
  approval_status: string | null;
  emp_hod: string | null;
  client_code: string | null;
  created_at: string | null;
  hod: {
    first_name: string | null;
    last_name: string | null;
  };
  branch: string | null;
  designation: string | null;
  department: string | null;
  emp_age: string | number | null;
}

@Component({
  selector: 'app-form-A',
  templateUrl: './form-A.component.html',
  styleUrls: ['./form-A.component.css'],
})
export class FormAComponent implements OnInit {
  employees: employeeReport[] = [];
  companyDetails?:any

  payload: any;
  constructor(
    private companyuserService: CompanyuserService,
    private toastr: ToastrService,
    private router: Router
  ) {
    this.companyuserService.exportedPrintDocs?.subscribe((res) => {
      this.employees = res?.docs;
      this.companyDetails = res.companyDetails
      this.payload = res.payload;
    });
   
  }

  ngOnInit() {
    if(!this?.employees?.length){
      this.router.navigateByUrl('/company/employees')
    }
  }

  async exportExcel() {
    try {
      let payload = this.payload;
      payload.pageno = 1;
      payload.perpage = 20;
      payload.generate = 'excel';

      const res = await this.companyuserService.downloadFile('get-employee-master-roll-form-a-report','employees-form-a', payload)

      this.router.navigate([`/company/employees`]);
      return;
    } catch (err: any) {
      if (err.status == 'val_err') {
        return this.toastr.error(Global.showValidationMessage(err.val_msg));
      }
      return this.toastr.error(err?.message || err);
    }
  }
}
