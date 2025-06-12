import { Component, Input, OnInit } from '@angular/core';
import { UntypedFormGroup, UntypedFormControl } from '@angular/forms';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import * as Global from 'src/app/globals';
import { CompanyuserService } from 'src/app/services/companyuser.service';
import { _incentiveReportTempMasterNew } from '../_incentiveReportTempMaster';
import { _overtimeReportTempMasterNew } from '../_overtimeReportTempMaster';

@Component({
  selector: 'app-tds-report-listing',
  templateUrl: './leave-report-listing.component.html',
  styleUrls: ['./leave-report-listing.component.css'],
})
export class CMPLeaveReportListingComponent implements OnInit {
 constructor(){
 }
 ngOnInit(): void {

 }
}
