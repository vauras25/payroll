import { Location } from '@angular/common';
import { Component, OnInit, Input } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import * as Global from 'src/app/globals';
import { CompanyuserService } from 'src/app/services/companyuser.service';

@Component({
  selector: 'companyuser-payslip-print',
  templateUrl: './payslip-print.component.html',
  styleUrls: ['./payslip-print.component.css'],
})
export class CMPPayslipPrintComponent implements OnInit {
  Global = Global;
  items: any[] = [];
  templateData: any[] = [];
  templateDetails: any;
  wage_month:any
  wage_year:any
  employeeFilter:any

  constructor(
    private activatedRoute: ActivatedRoute,
    private companyuserService: CompanyuserService,
    private location: Location
  ) {
    // console.log(this.activatedRoute.paramMap);

    this.companyuserService.exportedPrintDocs?.subscribe((res) => {
      this.items = res;
      // console.log(res);
      this.templateData = res?.empData;
      this.templateDetails = res?.tempDetails
      this.wage_month = res?.wageMonth
      this.wage_month = res?.wageYear
      this.employeeFilter = res?.filterData
    });
  }

  async ngOnInit() {}

  async printDoc(elements:any) {
    
    await this.downloadBatch()
  }

  async downloadBatch(isGenerate: boolean = false, emp_id?: any) {
    try {
    
      // this.isBatchDownloading = false;

      // let payload: any = {
      //   wage_month: this.employeeFilter?.month?.index ?? '',
      //   wage_year: this.employeeFilter?.year?.value ?? '',
      //   hod_id: this.employeeFilter?.hod_id ?? null,
      //   department_id: this.employeeFilter?.department_id ?? null,
      //   designation_id: this.employeeFilter?.designation_id ?? null,
      //   branch_id: this.employeeFilter?.branch_id ?? null,
      //   row_checked_all: this.rowCheckedAll,
      //   checked_row_ids: JSON.stringify(this.checkedRowIds),
      //   unchecked_row_ids: JSON.stringify(this.uncheckedRowIds),
      // };
      
      // if (isGenerate) {
        this.employeeFilter.generate = 'yes';
        await this.companyuserService.downloadFile(
          'get-generated-payslip-data',
          'Payslip-Data',
          this.employeeFilter
        );

        // let res = await this.companyuserService.getEmployeesPayslip(this.employeeFilter)
        //   ?.toPromise();
        // if (res.status !== 'success') throw res;
        // window.open(res.url);
        // this.location.back();

        return;
      // }
    } catch (err) {
      console.error(err);
    }
  }

  closeWindow() {
    this.location.back();
  }
}
