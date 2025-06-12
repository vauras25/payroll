import { Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import * as moment from 'moment';
import { ToastrService } from 'ngx-toastr';
import { CompanyuserService } from 'src/app/services/companyuser.service';
import * as Global from 'src/app/globals';
import { Router } from '@angular/router';

@Component({
  selector: 'app-pf-bulk-template',
  templateUrl: './pf-bulk-template.component.html',
  styleUrls: ['./pf-bulk-template.component.css'],
})
export class CMPPfBulkTemplateComponent implements OnInit {
  date = Date;
  employeesList: any[] = [];
  template_type: any;
  payload:any

  constructor(
    private companyuserService: CompanyuserService,
    private location: Location,
    private toastr: ToastrService,
    private router:Router
  ) {
    this.companyuserService.exportedPrintDocs.subscribe((res) => {
      this.employeesList = res?.docs;
      this.template_type = res?.template_type;
      this.payload = res?.payload;
    });
    if(!this.employeesList || !this.employeesList.length) router.navigate(['/company/employees']);
  }

  // async printDoc(elements: any) {
  //   try {
  //     let res = await this.companyuserService
  //       .downloadPFBulkExcel({})
  //       .toPromise();
  //     if (res) {
  //       if (res.status == 'success') {
  //         this.toastr.success(res.message);
  //         this.location.back();
  //         return res
  //       } else if (res.status == 'val_err') {
  //         return this.toastr.error(Global.showValidationMessage(res.val_msg));
  //       } else {
  //         throw res.message;
  //       }
  //     }
  //   } catch (e: any) {
  //     this.toastr.error(e?.message || e);
  //     return
  //   }
  // };

  async excelExport() {
    try {
      if (this.employeesList.length > 0) {
        let payload = this.payload;
        let res;

        if(this.template_type == 'join'){
          res = await this.companyuserService.downloadFile('export-employee-bluk-joining-report','pf-bulk-join',payload)
        }else{
          res = await this.companyuserService.downloadFile('export-exit-bluk-employee-joining-report','pf-bulk-exit',payload)
          // res = await this.companyuserService.employeeExitExcelDownload(payload).toPromise();
        }
        // if(res.status !== 'success') throw res;
        
        return res;
      }
    } catch (err:any) {
      if (err.status == 'val_err') {
        return this.toastr.error(Global.showValidationMessage(err.val_msg));
      }
      return this.toastr.error(err?.message || err);
    }
  };

  closeWindow() {
    this.location.back();
  };

  ngOnInit() {}

  formatDate(date: any) {
    return moment(date).format('DD-MM-YYYY');
  };
}
