import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { CompanyuserService } from 'src/app/services/companyuser.service';

@Component({
  selector: 'app-attendance-form-d-report-export',
  templateUrl: './attendance-form-d-report-export.component.html',
  styleUrls: ['./attendance-form-d-report-export.component.css']
})
export class AttendanceFormDReportExportComponent implements OnInit {
  employees: any[] = []

  payload: any;
  constructor(
    private companyuserService: CompanyuserService,
    private toastr: ToastrService,
    private router: Router
  ) {
    this.companyuserService.exportedPrintDocs?.subscribe((res) => {
      this.employees = res?.docs;
      this.payload = res.payload;
    });
   
  }

  ngOnInit() {
    if(!this?.employees?.length){
      this.router.navigateByUrl('/company/employees')
    }
  }


}
