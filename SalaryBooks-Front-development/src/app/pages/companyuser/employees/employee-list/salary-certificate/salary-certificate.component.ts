import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { CompanyuserService } from 'src/app/services/companyuser.service';
import * as Global from 'src/app/globals';
@Component({
  selector: 'app-salary-certificate',
  templateUrl: './salary-certificate.component.html',
  styleUrls: ['./salary-certificate.component.css']
})
export class SalaryCertificateComponent implements OnInit {
  employees: any[] = [];
  companyDetails?:any
  payload: any;

  constructor(
    private companyuserService: CompanyuserService,
    private toastr: ToastrService,
    private router: Router
  ) {
    this.companyuserService.exportedSalaryCertificate?.subscribe((res) => {
      
      this.employees = res?.docs;
      this.payload = res.payload;
    });

    this. companyuserService.getComDetails?.subscribe((res)=>{
      this.companyDetails = res?.company_det;
    })
    
   }

  ngOnInit(): void {
  }

  async downloadSalaryCertificates() {
    try {
      const request = this.payload
      let payload = {
          row_checked_all:request?.row_checked_all,
          checked_row_ids:request?.checked_row_ids,
          unchecked_row_ids:request?.unchecked_row_ids,
          "is_view":null
        }
      
      
      
      const res = await this.companyuserService.downloadFile('earning-certificate-export-pdf' ,'salary-certificates', payload);

      // if (res.status !== 'success') throw res;

      // this.companyuserService.setPrintDoc({
      //   docs: res?.employees,
      //   companyDetails: res?.company,
      //   payload,
      // });
      
      // this.router.navigate([`/company/employees/form-a`]);
      return;
    } catch (err: any) {
      if (err.status == 'val_err') {
        return this.toastr.error(Global.showValidationMessage(err.val_msg));
      }
      return this.toastr.error(err?.message || err);
    }
  }
}
