import { Component, OnInit,ViewEncapsulation } from '@angular/core';
import {
  UntypedFormGroup,
  UntypedFormControl,
  FormGroup,
  FormBuilder,
  Validators,
  FormControl,
} from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import * as Global from 'src/app/globals';
import PaginationOptions from 'src/app/models/PaginationOptions';
import TableFilterOptions from 'src/app/models/TableFiilterOptions';
import { CompanyuserService } from 'src/app/services/companyuser.service';

import * as moment from 'moment';
@Component({
  selector: 'app-invoice',
  templateUrl: './invoice.component.html',
  styleUrls: ['./invoice.component.css']
})
export class InvoiceComponent implements OnInit {
  Global = Global;
  employeeTableFilterOptions: TableFilterOptions =
  Global.resetTableFilterOptions();
  transactionHistory: any[] = [];
  paginationOptions:PaginationOptions = Global.resetPaginationOption();
  rowCheckedAll:any=false;
  uncheckedRowIds:any=[];
  checkedRowIds:any=[]
  constructor(
    private titleService: Title,
    private formBuilder: FormBuilder,
    private spinner: NgxSpinnerService,
    private companyuserService: CompanyuserService,
    private toastr: ToastrService  
  ) { }

  ngOnInit(): void {
  this.fetchTransactionHistory();  
  }

  fetchTransactionHistory(pageno:any=null,searchkey:any='') {
    this.spinner.show();
    this.companyuserService.fetchCreditPurchaseTransactionHistory({
      'pageno':pageno==null?1:pageno,
      'perpage':this.paginationOptions.limit,
      'searchkey':searchkey || '',
      orderby:'desc'
    }).subscribe(res => {
      if (res.status == "success") {
        
        this.transactionHistory = res?.payment_history?.docs ?? [];
        this.transactionHistory.forEach((element: any,index:any) => {
          element.checked = this.isRowChecked(element._id);
  
        });
        
        this.paginationOptions = {
          hasNextPage: res.payment_history.hasNextPage,
          hasPrevPage: res.payment_history.hasPrevPage,
          limit: res.payment_history.limit,
          nextPage: res.payment_history.nextPage,
          page: res.payment_history.page,
          pagingCounter: res.payment_history.pagingCounter,
          prevPage: res.payment_history.prevPage,
          totalDocs: res.payment_history.totalDocs,
          totalPages: res.payment_history.totalPages,
      };

      } else {
        this.toastr.error(res.message);
        this.transactionHistory = [];
      }
      this.spinner.hide();
    }, (err) => {
      this.toastr.error(Global.showServerErrorMessage(err));
      this.transactionHistory = [];
      this.spinner.hide();
    });
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
    this.fetchTransactionHistory(1);
   
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
  exportData()
  {
   
  
    this.spinner.show();
    this.companyuserService.downloadFile('get-payment-history','payment-history',{
      'unchecked_row_ids': this.uncheckedRowIds,
      'row_checked_all': this.rowCheckedAll.toString(),
      'checked_row_ids': this.checkedRowIds,
      generate:'excel',pageno:1
      
    })
    this.spinner.hide()
    // .subscribe(res => {
    //   this.spinner.hide();
    //   if (res.status == 'success') {
    //   location.href= res?.url;
    //   } else {
    //     this.toastr.error(res.message);
    //   }
    // }, (err) => {
    //   this.spinner.hide();

    //   this.toastr.error("Internal server error occured. Please try again later.");
    // });
  }

  exportsingleData(id:any)
  {
    this.spinner.show();
    this.companyuserService.downloadFile('get-payment-history','payment-history',{
      'unchecked_row_ids': [],
      'row_checked_all': "false",
      'checked_row_ids': [id],
      generate:'excel',pageno:1
      
    })
    this.spinner.hide()

    // .subscribe(res => {
    //   this.spinner.hide();
    //   if (res.status == 'success') {
    //   location.href= res?.url;
    //   } else {
    //     this.toastr.error(res.message);
    //   }
    // }, (err) => {
    //   this.spinner.hide();
    //   this.toastr.error("Internal server error occured. Please try again later.");
    // });
  }



}
