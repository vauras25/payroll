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
  selector: 'app-esic37and7a',
  templateUrl: './esic37and7a.component.html',
  styleUrls: ['./esic37and7a.component.css'],
})
export class Esic37and7aComponent implements OnInit {
  employeePaginationOptions: PaginationOptions = Global.resetPaginationOption();
  employeeTableFilterOptions: TableFilterOptions =
    Global.resetTableFilterOptions();
  Global = Global;
  employees: any[] = [];
  showDetailedData: boolean = false;
  employeeListFilter: any = {};
  rowCheckedAll: Boolean = false;
  checkedRowIds: any[] = [];
  uncheckedRowIds: any[] = [];
  layoffListType = 'summary';
  employeeIdBucket: any[] = [];
  layoff_emp_id: any;
  templateSheetMaster: any[] = [
    {label:"Form 37", value:"37A"},
    {label:"Form 7A", value:"7A"},
  ];
  isReportView:boolean = false;
  esicFormType:string;
  viewAllemp:any[]=[]

  formType:{
    label:string,
    value:string
  };
  constructor(
    private companyuserService: CompanyuserService,
    private toastr: ToastrService,
    private router: Router
  ) {
    
  }

  layoffUpdateForm: FormGroup = new FormGroup({
    wage_value: new FormControl(),
    wage_month_from: new FormControl(),
    wage_month_to: new FormControl(),
    wage_year_from: new FormControl(),
    wage_year_to: new FormControl(),
  });

  ngOnInit() {
    this.fetchEmployees();
  }

  allRowsCheckboxChecked(event: any) {
    if (this.rowCheckedAll) {
      this.uncheckedRowIds.length = 0;
      this.rowCheckedAll = false;
    } else {
      this.checkedRowIds.length = 0;
      this.rowCheckedAll = true;
    }

    this.fetchEmployees();
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
      client_id: this.employeeListFilter?.client_id ?? '',
      pageno: this.employeePaginationOptions.page,
      perpage: this.employeePaginationOptions.limit,
      searchkey: this.employeeTableFilterOptions.searchkey || '',
      branch_id: this.employeeListFilter?.branch_id ?? '',
      department_id: this.employeeListFilter?.department_id ?? '',
      designation_id: this.employeeListFilter?.designation_id ?? '',
      hod_id: this.employeeListFilter?.hod_id ?? '',
      row_checked_all: this.rowCheckedAll,
      checked_row_ids: JSON.stringify(this.checkedRowIds),
      unchecked_row_ids: JSON.stringify(this.uncheckedRowIds),
      form_type:null,
      generate:'listing'
    };
    return payload;
  }

  async fetchEmployees() {
    try {
      let payload = this.getPayload() || {};

      let res = await this.companyuserService
        .fetchForm37And7A(payload)
        .toPromise();

      if (res) {
        if (res.status == 'success') {
          this.employees = res.employees;
          this.viewAllemp = res.employees;
          this.employees.forEach((doc: any) => {
            doc.checked = this.isRowChecked(doc._id);
          });
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

  async exportForm() {
    try {
      if(!this.formType?.value) return;
      let payload = this.getPayload() || {};
      payload.form_type = this.formType?.value
      payload.generate = ""
      await this.companyuserService.downloadFile('get-esic-form-export', this.formType?.label, payload)
    } catch (err: any) {
      this.toastr.error(err?.message || err);
    }
  }
  viewEmpDoc:any[]=[]
  viewReport(){
    this.esicFormType = this.formType?.value;
    if (this.rowCheckedAll == true) {
      this.viewEmpDoc = this.viewAllemp
    }
    else{
      this.viewEmpDoc = this.checkedRowIds
    }
    this.isReportView = true;
  }
  cancelGenerateReport() {
    this.isReportView = false;
    this.viewEmpDoc = []
    this.viewAllemp = []
    this.resetCheckedRows();
}
resetCheckedRows() {
  this.rowCheckedAll = false
  this.checkedRowIds = []
  this.uncheckedRowIds = []
  
  $('.employee-table').find('#srNo').prop('checked', false)
  $('.employee-table').find('.typeid').prop('checked', false)

  this.fetchEmployees();
}
}
