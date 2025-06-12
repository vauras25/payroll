import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import * as Global from 'src/app/globals';
import PaginationOptions from 'src/app/models/PaginationOptions';
import TableFilterOptions from 'src/app/models/TableFiilterOptions';
import { CompanyuserService } from 'src/app/services/companyuser.service';
import { _wageRegisterMasterNew } from '../../report/_wageRegister';

@Component({
  selector: 'app-gratuity-Form-L',
  templateUrl: './gratuity-Form-L.component.html',
  styleUrls: ['./gratuity-Form-L.component.css']
})
export class GratuityFormLComponent implements OnInit {
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
  sheetTemplate:any[] = _wageRegisterMasterNew;
  isReportView:boolean = false;
  viewAllemp:any[]=[]
  constructor(
    private companyuserService: CompanyuserService,
    private toastr: ToastrService,
  ) {
    
  }

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
      pageno:this.employeePaginationOptions.page,
      perpage:this.employeePaginationOptions.limit,
      client_id: this.employeeListFilter?.client_id ?? '',
      branch_id: this.employeeListFilter?.branch_id ?? '',
      searchkey: this.employeeTableFilterOptions?.searchkey ?? '',
      department_id: this.employeeListFilter?.department_id ?? '',
      designation_id: this.employeeListFilter?.designation_id ?? '',
      hod_id: this.employeeListFilter?.hod_id ?? '',
      row_checked_all: this.rowCheckedAll,
      checked_row_ids: JSON.stringify(this.checkedRowIds),
      unchecked_row_ids: JSON.stringify(this.uncheckedRowIds),
      form_type:null
    };

    return payload;
  }

  async fetchEmployees() {
    try {

      let payload = this.getPayload() || {};

      let res = await this.companyuserService
        .fetchGratuityFormL(payload)
        .toPromise();

      if (res) {
        if (res.status == 'success') {
          this.employees = res.employees?.docs;
          this.viewAllemp = res.employees?.docs;
          this.employees.forEach((doc: any) => {
            doc.checked = this.isRowChecked(doc._id);
          });

          this.employeePaginationOptions = {
            hasNextPage: res.employees.hasNextPage,
            hasPrevPage: res.employees.hasPrevPage,
            limit: res.employees.limit,
            nextPage: res.employees.nextPage,
            page: res.employees.page,
            pagingCounter: res.employees.pagingCounter,
            prevPage: res.employees.prevPage,
            totalDocs: res.employees.totalDocs,
            totalPages: res.employees.totalPages,
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

  async exportForm() {
    try {
      let payload = this.getPayload() || {};
      payload.generate = 'excel'
      await this.companyuserService.downloadFile('get-gratuity-form-report','gratuity-form-l', payload)
    } catch (err: any) {
      this.toastr.error(err?.message || err);
    }
  }
  viewEmpDoc:any[]= []
  viewReport(){
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
  printDoc() {
    // console.log(elements.target);
    var printContents = $("#sectionToPrint").html();
  
    document.body.innerHTML = printContents;
  
    window.print();
    window.location.reload();
  
    // if (this.employees.revisions !== 'null') {
    //   window.close();
    // } else {
    //   this.location.back();
    // }
    // let divContents = $("#sectionToPrint").html();
    // a.document.write(divContents);
    // a.document.close();
    // a.print();
  }
}
