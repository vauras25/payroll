import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { CompanyuserService } from 'src/app/services/companyuser.service';
import * as Global from 'src/app/globals';

@Component({
  selector: 'app-summary-briefcase',
  templateUrl: './summary-briefcase.component.html',
  styleUrls: ['./summary-briefcase.component.css'],
})
export class SummaryBriefcaseComponent implements OnInit {
  isDownloadable: boolean = false;
  employeeListFilter: any = null;
  employeeListFilterCopy: any = null;
  count = 0
  constructor(
    private companyuserService: CompanyuserService,
    private toastr: ToastrService
  ) {}

  ngOnInit() {}
  changeBtn() {
    this.isDownloadable = false;
    if (this.employeeListFilter) {
      this.isDownloadable = true;
    } else {
      this.isDownloadable = false;
    }
  }

  async downloadSummaryBriefcase(e: any) {
    try {
    
      this.isDownloadable = false
      let payload = {
        wage_month_from: this.employeeListFilter.wage_month_from,
        wage_month_to: this.employeeListFilter.wage_month_to,
        wage_year_from: this.employeeListFilter.wage_year_from,
        wage_year_to: this.employeeListFilter.wage_year_to,
        client_id: this.employeeListFilter?.client_id ?? '',
        hod_id: this.employeeListFilter?.hod_id ?? '',
        department_id: this.employeeListFilter?.department_id ?? '',
        designation_id: this.employeeListFilter?.designation_id ?? '',
        branch_id: this.employeeListFilter?.branch_id ?? '',
      };

      await this.companyuserService.downloadFile('export-summary-briefcase','summary-briefcase-report',payload)
      // let res = await this.companyuserService
      //   .download_summary_briefcase(payload)
      //   .toPromise();
      // if (res.status !== 'success') throw res;
   
    
    } catch (err: any) {
    
      if (err.status == 'val_err') {
        this.toastr.error(Global.showValidationMessage(err.val_msg));
      } else {
        this.toastr.error(Global.showServerErrorMessage(err));
        this.toastr.error(err.message);
      }
    }
  }
  increase_count(){
    this.count++
  }
}
