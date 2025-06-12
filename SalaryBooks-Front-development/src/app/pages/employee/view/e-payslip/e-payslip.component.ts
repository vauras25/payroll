import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import * as Global from 'src/app/globals';
import PaginationOptions from 'src/app/models/PaginationOptions';
import TableFilterOptions from 'src/app/models/TableFiilterOptions';
import { WebService } from 'src/app/services/web.service';
import { ToastrService } from 'ngx-toastr';
import { DomSanitizer } from '@angular/platform-browser';
import { CommonService } from 'src/app/services/common.service';

@Component({
  selector: 'app-e-payslip',
  templateUrl: './e-payslip.component.html',
  styleUrls: ['./e-payslip.component.css']
})
export class EPayslipComponent implements OnInit {
  yearMaster: any = [];
  employeePaginationOptions: PaginationOptions = Global.resetPaginationOption();
  employeeTableFilterOptions: TableFilterOptions =
    Global.resetTableFilterOptions();

  payslipData!: any
  employees: any[] = [];

  wage_month:any = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec']
  getEmployeesPayslip(payload: any = {}) {
    return this.webService.post('employee/get-generated-payslip-data', payload);
  }




  paySlipForm: FormGroup = new FormGroup({
    year: new FormControl('')
  })

  constructor(private http: HttpClient, private webService: WebService, private toastr: ToastrService, private sanitizer: DomSanitizer, private commonService: CommonService) {
    let currentYear = new Date().getFullYear();
    this.yearMaster = [];
    for (let index = 4; index >= 0; index--) {
      this.yearMaster.push({
        value: currentYear - index,
        description: currentYear - index,
      });
    }

  }

  ngOnInit(): void {
    this.paySlipForm.patchValue({
      year: this.yearMaster.find((obj: any) => {
        return obj.value == new Date().getFullYear();
      })
    })
    this.fetchPayslip()
  }


  async fetchPayslip() {
    let payload = await this.getReportPayload();
    payload.row_checked_all = true;
    payload.checked_row_ids = '[]';
    payload.unchecked_row_ids = '[]';

   this.commonService.postData('employee/get-generated-payslip-data', payload).subscribe((res) => {
      if (res.status == 'success') {
        var docs: any[] = res?.master_data?.docs ?? [];
        this.employees = docs;
      } else {
        if (res.status == 'val_err')
          this.toastr.error(Global.showValidationMessage(res.val_msg));
        else this.toastr.error(res.message);

      }
    },
      (err:any) => {
        this.toastr.error(
          Global.showValidationMessage(Global.showServerErrorMessage(err))
        );
        this.employees = [];
      })
  }

  getReportPayload() {

    let payload: any = {
      pageno: this.employeePaginationOptions.page,
      perpage: this.employeeTableFilterOptions.length,
      wage_year: this.paySlipForm?.value?.year?.value ?? ''
    };
    return payload;
  }

  pdfLink: any = '';
  async viewPayslipModal(report: any, hidePopup: boolean = false) {
    if (report?.pdf_link) {
      this.pdfLink = ''
      this.pdfLink = await this.sanitizer.bypassSecurityTrustResourceUrl(Global.BACKEND_URL + report?.pdf_link);

      if (!hidePopup) {
        setTimeout(() => {
          $('#viewTemplate')?.click();
        }, 100);
      }
    }

    return;
  }

  async downloadPdfOfSlip(id: any) {
let payload = this.getReportPayload()
payload.checked_row_ids = JSON.stringify([id]),
payload.row_checked_all= "false",
payload.unchecked_row_ids= "[]",
payload.type = "download"

    // let payload: any = {
    //   "checked_row_ids": "[\"648058e919bdb07695fe4bb2\"]",
    //   "row_checked_all": "false",
    //   "unchecked_row_ids": "[]",
    //   "type": "download"
    // }

    await this.commonService.downloadFile('download-payslip-data', `payslip`, payload);

  }


  payslipTemplateKeys:any;
  payslipTemplateKeyValues:any;
   viewPayslipTemplate(report:any){
    try {
      if(!report?.payslip_temp_data) return;
      this.payslipTemplateKeys = null
      this.payslipTemplateKeyValues = null
      this.payslipTemplateKeys = report?.payslip_temp_data
      this.payslipTemplateKeyValues = report
      
      $('#viewTemplate')?.click();
    } catch (err:any) {
      this.toastr.error(err.message || err)
    }
  }

}
