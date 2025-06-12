import { DatePipe } from '@angular/common';
import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { FormArray, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { CompanyuserService } from 'src/app/services/companyuser.service';
import * as Global from 'src/app/globals';
import PaginationOptions from 'src/app/models/PaginationOptions';
import TableFiilterOptions from 'src/app/models/TableFiilterOptions';
import swal from 'sweetalert2';
import { Router } from '@angular/router';
@Component({
  selector: 'app-bank-instruction',
  templateUrl: './bank-instruction.component.html',
  styleUrls: ['./bank-instruction.component.css']
})
export class BankInstructionComponent implements OnInit {
  Global = Global;
  paginationOptions: PaginationOptions = Global.resetPaginationOption();
  tableFilterOptions: TableFiilterOptions = Global.resetTableFilterOptions();
  empReportData:any=[];
  @Input() bankFilter: any;
   zeroPad = (num:any, places:any) => String(num).padStart(places, '0')

  days:any=[];

  rowCheckedAll: Boolean = false;
  checkedRowIds: any[] = [];
  uncheckedRowIds: any[] = [];
  rows:any=[];
  constructor(
    private toastr: ToastrService,
    private companyuserService: CompanyuserService,
    private spinner: NgxSpinnerService,
    private datePipe: DatePipe  ,
    private titleService: Title,
    private router: Router

  ) { }

  ngOnInit(): void {
  }
  ngOnChanges()
  {
    alert("HII");
    let filter_optins={
      "wage_month_from": this.bankFilter?.wage_month_from,
      "wage_year_from": this.bankFilter?.wage_year_from,
      "wage_month_to":this.bankFilter?.wage_month_to,
      "wage_year_to":this.bankFilter?.wage_year_to,
      "branch_id": this.bankFilter?.branch_id,
      "designation_id": this.bankFilter?.designation_id,
      "department_id": this.bankFilter?.department_id,
      "hod_id": this.bankFilter?.hod_id,
      "client_id": this.bankFilter?.client_id,
      "unchecked_row_ids":[],
      "checked_row_ids":[],
      "row_checked_all":"false",

  }
  

    this.tableFilterOptions = Global.resetTableFilterOptions();
    this.tableFilterOptions =Object.assign(filter_optins, this.tableFilterOptions);
    this.getFiltered(1);

  }
 
  getFiltered(page:any=null)
  {
    return new Promise((resolve, reject) => {
          
        
          this.spinner.show();
          let payload:any={};
          payload=this.tableFilterOptions;
          payload.pageno=page;
          payload.perpage=this.tableFilterOptions.length;

          this.companyuserService.leaveencashBank(this.tableFilterOptions).subscribe(res => {
              if (res.status == 'success') {
                  this.rows = [];
                  let master_data = res?.employees?.docs ?? [];
                // console.log(res?.employees?.docs);
                 
              } else {
                  this.rows = [];
              }

              this.spinner.hide();
              Global.loadCustomScripts('customJsScript');
              resolve(true);
          }, (err) => {
              this.rows = [];
              this.spinner.hide();
              Global.loadCustomScripts('customJsScript');
              resolve(true);
          });

  })
  }


  allRowsCheckboxChecked(event: any) {
    if (this.rowCheckedAll) {
      this.uncheckedRowIds.length = 0;
      this.rowCheckedAll = false;
    } else {
      this.checkedRowIds.length = 0;
      this.rowCheckedAll = true;
    }

    this.getFiltered();
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
}
