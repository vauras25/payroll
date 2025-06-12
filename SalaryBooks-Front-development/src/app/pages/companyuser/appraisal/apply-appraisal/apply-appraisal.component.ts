import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import PaginationOptions from 'src/app/models/PaginationOptions';
import TableFilterOptions from 'src/app/models/TableFiilterOptions';
import { CompanyuserService } from 'src/app/services/companyuser.service';
import * as Global from 'src/app/globals';


@Component({
  selector: 'app-apply-appraisal',
  templateUrl: './apply-appraisal.component.html',
  styleUrls: ['./apply-appraisal.component.css']
})
export class CMPApplyAppraisalComponent implements OnInit {
  Global = Global;
  appraisalListing: any[] = [];
  showDetailedData: boolean = false;
  employeeListFilter: any = {};
  rowCheckedAll: Boolean = false;
  checkedRowIds: any[] = [];
  uncheckedRowIds: any[] = [];
  layoffListType = 'summary';
  empId = JSON.parse(localStorage.getItem("payroll-companyuser-user")!)._id

  reportPaginationOptions: PaginationOptions = Global.resetPaginationOption();
  reportTableFilterOptions: TableFilterOptions =
    Global.resetTableFilterOptions();

    employee_id:any
    company_id:any = JSON.parse(localStorage.getItem('payroll-companyuser-details')!).company_id;
  constructor(
    private companyuserService: CompanyuserService,
    private toastr: ToastrService,
    private router: Router
  ) {}

  ngOnInit() {
  }

  allRowsCheckboxChecked(event: any) {
    if (this.rowCheckedAll) {
      this.uncheckedRowIds.length = 0;
      this.rowCheckedAll = false;
    } else {
      this.checkedRowIds.length = 0;
      this.rowCheckedAll = true;
    }

    this.fetchAppraisalListing();
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

  anyRowsChecked(): boolean {
    return (
      this.rowCheckedAll == true ||
      this.checkedRowIds.length > 0 ||
      this.uncheckedRowIds.length > 0
    );
  }

  private isRowChecked(rowId: any) {
    if (!this.rowCheckedAll)
      return this.checkedRowIds.indexOf(rowId) >= 0 ? true : false;
    else return this.uncheckedRowIds.indexOf(rowId) >= 0 ? false : true;
  }

  getPayload() {
    let payload: any = {
      hod_id: this.employeeListFilter?.hod_id ?? '',
      searchkey: this.reportTableFilterOptions?.searchkey ?? '',
      department_id: this.employeeListFilter?.department_id ?? '',
      designation_id: this.employeeListFilter?.designation_id ?? '',
      branch_id: this.employeeListFilter?.branch_id ?? '',
      pageno: this.reportPaginationOptions.page,
      perpage: this.reportPaginationOptions.limit,
    };
    return payload;
  }

  async fetchAppraisalListing() {
    try {
      let payload = this.getPayload() || {};

      let res = await this.companyuserService.getAppraisalListing(payload)
        .toPromise();

      if (res) {
        if (res.status == 'success') {
          this.appraisalListing = res?.docs?.docs;
          this.appraisalListing.forEach((doc: any) => {
            doc.checked = this.isRowChecked(doc._id);
          });

          this.reportPaginationOptions = {
            hasNextPage: res?.docs?.hasNextPage,
            hasPrevPage: res?.docs?.hasPrevPage,
            limit: res?.docs?.limit,
            nextPage: res?.docs?.nextPage,
            page: res?.docs?.page,
            pagingCounter: res?.docs?.pagingCounter,
            prevPage: res?.docs?.prevPage,
            totalDocs: res?.docs?.totalDocs,
            totalPages: res?.docs?.totalPages,
          };
          return res;
        } else if (res.status == 'val_err') {
          this.toastr.error(Global.showValidationMessage(res.val_msg));
        } else {
          throw res.message;
        }
      }
    } catch (err: any) {
      this.toastr.error(err?.message || err);
    }
  }

  showRateEmployee(empId:any) {
    this.employee_id = empId
    $('.earning-desc').show();

  }
  hideRateEmployee(e:any) {
    if(e ==='submit'){
      this.employee_id = null
      this.fetchAppraisalListing()
    }
    $('.earning-desc').hide();
  }

  isCanRate(assignees:any){
    if(assignees?.self_assignee?.assignee_id == this.empId){
      return true
    }else if(assignees?.lvl_1_assignee?.assignee_id == this.empId){
      return true
    }else if(assignees?.lvl_2_assignee?.assignee_id == this.empId){
      return true
    }
    return false
  }

}
