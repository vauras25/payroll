import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import * as Global from 'src/app/globals';
import { CompanyuserService } from 'src/app/services/companyuser.service';
import { _incentiveReportTempMasterNew } from '../../report/_incentiveReportTempMaster';
import PaginationOptions from 'src/app/models/PaginationOptions';
import { FormControl, FormGroup } from '@angular/forms';
import { DatePipe } from '@angular/common';
import TableFilterOptions from 'src/app/models/TableFiilterOptions';
import { Router } from '@angular/router';

@Component({
  selector: 'app-apply-layoff',
  templateUrl: './apply-layoff.component.html',
  styleUrls: ['./apply-layoff.component.css'],
})
export class CMPApplyLayoffComponent implements OnInit {
  employeePaginationOptions: PaginationOptions = Global.resetPaginationOption();
  employeeTableFilterOptions: TableFilterOptions =
    Global.resetTableFilterOptions();
  Global = Global;
  layoffListing: any[] = [];
  showDetailedData: boolean = false;
  employeeListFilter: any = {};
  rowCheckedAll: Boolean = false;
  checkedRowIds: any[] = [];
  uncheckedRowIds: any[] = [];
  layoffListType = 'summary';
  employeeIdBucket: any[] = [];
  layoff_emp_id:any

  constructor(
    private companyuserService: CompanyuserService,
    private toastr: ToastrService,
    private router:Router
  ) {
    if (
      !Global.checkCompanyModulePermission({
        company_module: 'layoff_management',
        company_sub_module: 'apply_lay-off',
        company_sub_operation: ['view'],
        company_strict: true
      })
    ) {
      const _this = this;
      setTimeout(function () {
        _this.router.navigate(['company/errors/unauthorized-access'], {
          skipLocationChange: true,
        });
      }, 500);
      return;
    }
  }

  layoffUpdateForm: FormGroup = new FormGroup({
    wage_value: new FormControl(),
    wage_month_from: new FormControl(),
    wage_month_to: new FormControl(),
    wage_year_from: new FormControl(),
    wage_year_to: new FormControl(),
  });

  ngOnInit() {
    this.fetchLayoffListing();
  }

  allRowsCheckboxChecked(event: any) {
    if (this.rowCheckedAll) {
      this.uncheckedRowIds.length = 0;
      this.rowCheckedAll = false;
    } else {
      this.checkedRowIds.length = 0;
      this.rowCheckedAll = true;
    }

    this.fetchLayoffListing()
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
      pageno: this.employeePaginationOptions.page,
      perpage: this.employeePaginationOptions.limit,
      row_checked_all: this.rowCheckedAll,
      checked_row_ids: JSON.stringify(this.checkedRowIds),
      unchecked_row_ids: JSON.stringify(this.uncheckedRowIds),
      hod_id: this.employeeListFilter?.hod_id ?? '',
      department_id: this.employeeListFilter?.department_id ?? '',
      designation_id: this.employeeListFilter?.designation_id ?? '',
      branch_id: this.employeeListFilter?.branch_id ?? '',
      disbursement_frequency:
        this.employeeListFilter?.disbursement_frequency ?? '',
      disbursement_type: this.employeeListFilter?.disbursement_type ?? '',
      wage_month_from: this.employeeListFilter?.wage_month_from ?? '',
      wage_month_to: this.employeeListFilter?.wage_month_to ?? '',
      wage_year_from: this.employeeListFilter?.wage_year_from ?? '',
      wage_year_to: this.employeeListFilter?.wage_year_to ?? '',
      wage_month: this.employeeListFilter?.month?.index ?? '',
      wage_year: this.employeeListFilter?.year?.value ?? '',
      reportListType: this.layoffListType,
    };
    return payload;
  }

  async fetchLayoffListing(searchkey:any='') {
    try {
      let payload = this.getPayload() || {};
      payload.searchkey = searchkey || '';

      let res = await this.companyuserService
        .applyLayoffListing(payload)
        .toPromise();

      if (res) {
        if (res.status == 'success') {
          this.layoffListing = res.docs.docs;
          this.layoffListing.forEach((doc: any) => {
            doc.checked = this.isRowChecked(doc._id);
          });

          this.employeePaginationOptions = {
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
          // console.log(this.layoffListing);
          return res;
        } else if (res.status == 'val_err') {
          return this.toastr.error(Global.showValidationMessage(res.val_msg));
        } else {
          throw res.message;
        }
      }
    } catch (err: any) {
      return this.toastr.error(err?.message || err);
    }
  }

  async openLayoffEditModal(
    submitType:any,
    type?: any,
    employee_id?: any,
    data?: any
  ) {

     if(submitType === 'single'){
      let db =''
      if(this.layoffListType === 'summary') db = 'layoff_modules';
      if(this.layoffListType === 'detailed'){
        db = 'layoff_history_logs';
        data?.[db]?.reverse()
      }

      Global.resetForm(this.layoffUpdateForm);
      this.employeeIdBucket = [];

        this.layoffUpdateForm.patchValue({
          wage_value: data?.[db][0]?.wage_value ?? null,
          wage_month_from:
            Global.monthMaster.find((obj: any) => {
              return (
                obj.index == data?.[db][0]?.wage_month_from ?? null
              );
            }) ?? null,
          wage_year_from: data?.[db][0]?.wage_year_from ?? null,
          wage_month_to:
            Global.monthMaster.find((obj: any) => {
              return (
                obj.index == data?.[db][0]?.wage_month_to ?? null
              );
            }) ?? null,
          wage_year_to: data?.[db][0]?.wage_year_to ?? null,
        });

        this.employeeIdBucket.push(employee_id);
        this.layoff_emp_id = employee_id

        if (this.employeeIdBucket.length < 0) {
          this.toastr.warning('No Employee IDs available for the Operation');
        }

     }

      $('#updateLayoffModalButton').click();


    }



  updateLayoff(e: any) {
    try {
      if(this.layoffUpdateForm.invalid){
        return this.layoffUpdateForm.markAllAsTouched()
      }

      let payload = this.getPayload();
      payload.wage_value = this.layoffUpdateForm.value.wage_value ?? '';
      payload.wage_month_from = this.layoffUpdateForm.value.wage_month_from?.index ?? '';
      payload.wage_year_from = this.layoffUpdateForm.value.wage_year_from ?? '';
      payload.wage_month_to = this.layoffUpdateForm.value.wage_month_to?.index ?? '';
      payload.wage_year_to = this.layoffUpdateForm.value.wage_year_to ?? '';

      if(!payload.row_checked_all && !JSON.parse(payload.checked_row_ids).length){
        payload.checked_row_ids = JSON.parse(payload.checked_row_ids)
        payload.checked_row_ids.push(this.layoff_emp_id)
        payload.checked_row_ids = JSON.stringify(payload.checked_row_ids);
      }
      // console.log(payload);


      e.target.classList.add('btn-loading');
      this.companyuserService.updateLayoffData(payload).subscribe(
        (res) => {
            if (res.status == 'success') {
                this.employeeIdBucket = [];
                this.toastr.success(res.message);
                Global.resetForm(this.layoffUpdateForm);
                $('#updateLayoffModal').find('[data-dismiss="modal"]').click();
                this.fetchLayoffListing()

            } else if (res.status == 'val_err') {
                this.toastr.error(Global.showValidationMessage(res.val_msg));
            } else {
                this.toastr.error(res.message);
            }

            e.target.classList.remove('btn-loading');
        },
        (err) => {
            e.target.classList.remove('btn-loading');
            this.toastr.error(Global.showServerErrorMessage(err));
        }
    );


    } catch (err: any) {
      return this.toastr.error(err?.message || err);
    }
  }

  utilizeMonth(m:any){
    return Global.monthMaster.find(d => d.index == m)?.sf
  }
}
