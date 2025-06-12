import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import TableFilterOptions from 'src/app/models/TableFiilterOptions';
import { CompanyuserService } from 'src/app/services/companyuser.service';
import * as Global from 'src/app/globals';
import PaginationOptions from 'src/app/models/PaginationOptions';


@Component({
  selector: 'app-audit-variance-report',
  templateUrl: './audit-variance-report.component.html',
  styleUrls: ['./audit-variance-report.component.css']
})
export class CMPAuditVarianceReportComponent implements OnInit {
  rowCheckedAll: Boolean = false;
  checkedRowIds: any[] = [];
  uncheckedRowIds: any[] = [];
  varianceReportListing:any[] = []
  reportTableFilterOptions: TableFilterOptions =
  Global.resetTableFilterOptions();
  employeeListFilter: any = {};
  reportPaginationOptions: PaginationOptions = Global.resetPaginationOption();


  constructor(
    private companyuserService: CompanyuserService,
    private toastr: ToastrService,
    private router: Router
  ) {}

  ngOnInit() {
  }


  private isRowChecked(rowId: any) {
    if (!this.rowCheckedAll) {
      return this.checkedRowIds.indexOf(rowId) >= 0 ? true : false;
    } else {
      return this.uncheckedRowIds.indexOf(rowId) >= 0 ? false : true;
    }
  }

  rowCheckBoxChecked(event: any, row: any) {
    let rowId: any = row._id;
    let checkbox: any = document.querySelectorAll(
      '[data-checkbox-id="' + rowId + '"]'
    );

    if (checkbox.length > 0) {
      if (checkbox[0].checked) {
        this.uncheckedRowIds.splice(this.uncheckedRowIds.indexOf(rowId), 1);
        if (!this.rowCheckedAll) {
          if (!this.checkedRowIds.includes(rowId)) {
            this.checkedRowIds.push(rowId);
          }
        }
      } else {
        this.checkedRowIds.splice(this.checkedRowIds.indexOf(rowId), 1);
        if (this.rowCheckedAll) {
          if (!this.uncheckedRowIds.includes(rowId)) {
            this.uncheckedRowIds.push(rowId);
          }
        }
      }
    }
  }

  allRowsCheckboxChecked(event: any) {
    if (this.rowCheckedAll) {
      this.uncheckedRowIds.length = 0;
      this.rowCheckedAll = false;
    } else {
      this.checkedRowIds.length = 0;
      this.rowCheckedAll = true;
    }

    this.fetchVarinaceReport()
  }


  anyRowsChecked(): boolean {
    return (
      this.rowCheckedAll == true ||
      this.checkedRowIds.length > 0 ||
      this.uncheckedRowIds.length > 0
    );
  }
  async fetchVarinaceReport(){
    try {
      let payload = {
        pageno: this.reportPaginationOptions.page || 1,
        perpage: this.reportPaginationOptions.limit || 20,
        searchkey: this.reportTableFilterOptions.searchkey || '',
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
    let res = await this.companyuserService.getVarianceReportData(payload).toPromise();
    if(res.status !== 'success') throw res;

    this.reportPaginationOptions = {
      hasNextPage: res.variance_data?.hasNextPage,
      hasPrevPage: res.variance_data?.hasPrevPage,
      limit: res.variance_data?.limit,
      nextPage: res.variance_data?.nextPage,
      page: res.variance_data?.page,
      pagingCounter: res.variance_data?.pagingCounter,
      prevPage: res.variance_data?.prevPage,
      totalDocs: res.variance_data?.totalDocs,
      totalPages: res.variance_data?.totalPages,
    };

    res.variance_data.docs.forEach((doc: any) => {
      doc.checked = this.isRowChecked(doc._id);
    });

    this.varianceReportListing = res.variance_data.docs
    // this.varianceReportListing = res.variance_data.docs.map((doc:any) =>{
    //   return {
    //     group:res.variance_data.docs.filter((d:any) => d.emp_id === doc.emp_id)
    //   }
    // })
    // console.log(this.varianceReportListing);
    
    } catch (err:any) {
      this.toastr.error(err.message || err)
    }
  }
  async downloadExcelReport(e: any) {
    try {
      if(!e) return
      let payload = {
        pageno: this.reportPaginationOptions.page || 1,
        wage_month_from: this.employeeListFilter.wage_month_from,
        wage_month_to: this.employeeListFilter.wage_month_to,
        wage_year_from: this.employeeListFilter.wage_year_from,
        wage_year_to: this.employeeListFilter.wage_year_to,
        client_id: this.employeeListFilter?.client_id ?? '',
        hod_id: this.employeeListFilter?.hod_id ?? '',
        department_id: this.employeeListFilter?.department_id ?? '',
        designation_id: this.employeeListFilter?.designation_id ?? '',
        branch_id: this.employeeListFilter?.branch_id ?? '',
        row_checked_all: this.rowCheckedAll,
        checked_row_ids: JSON.stringify(this.checkedRowIds),
        unchecked_row_ids: JSON.stringify(this.uncheckedRowIds),
        generate:"excel"
      };
      // if (e) {
      //   payload.checked_row_ids = ;
      //   payload.unchecked_row_ids = ;
      // }
      await this.companyuserService.downloadFile('get-variance-report','variance-report',payload)
   
      this.fetchVarinaceReport();
    } catch (err: any) {
      if (err.status == 'val_err') {
        this.toastr.error(Global.showValidationMessage(err.val_msg));
      } else {
        this.toastr.error(Global.showServerErrorMessage(err));
        this.toastr.error(err.message);
      }
    }
  }

  getMonthFromIndex(month:any){
  return Global.monthMaster.find((x:any) => x.index== month)?.sf
  }

}
