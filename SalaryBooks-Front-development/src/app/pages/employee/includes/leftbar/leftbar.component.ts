import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { CommonService } from 'src/app/services/common.service';

@Component({
    selector: 'app-employee-leftbar',
    templateUrl: './leftbar.component.html',
    // styleUrls: ['../../employee-user-layout.component.css']
})
export class EMPLeftbarComponent implements OnInit {
    permission:any;
    constructor(private authService: AuthService, private commonService: CommonService,) {

    }

    ngOnInit(): void {
     this.commonService.postDataRaw("employee/get-account","").subscribe(async res => {
        if (res.status == 'success') {
          if (res.employee_data) {
            let emp_role_data:any;
            emp_role_data=res.employee_data[0]?.employee_details?.employment_hr_details?.emp_role_data;
            this.permission=emp_role_data;
            let empData:any=localStorage.getItem('payroll-companyemp-user');
            empData=JSON.parse(empData);
            empData.emp_role_data=emp_role_data;
            localStorage.setItem('payroll-companyemp-user',JSON.stringify(empData));
           
          } else {
            return;
          }
        } 
        else if (res.status == 'val_err') {
          return;
        } 
        else {
          return;
        }
      }, (err) => {
       
      });  
    }
}