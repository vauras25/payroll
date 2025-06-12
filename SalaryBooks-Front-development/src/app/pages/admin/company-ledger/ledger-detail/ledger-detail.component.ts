import { DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { disableDebugTools, DomSanitizer, Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import * as Global from 'src/app/globals';
import { AdminService } from 'src/app/services/admin.service';
import swal from 'sweetalert2';
@Component({
  selector: 'app-ledger-detail',
  templateUrl: './ledger-detail.component.html',
  styleUrls: ['./ledger-detail.component.css']
})
export class LedgerDetailComponent implements OnInit {
  Global = Global;
  dtOptions: DataTables.Settings = {};
  rowCheckedAll: Boolean = false;
  checkedRowIds: any[] = [];
  uncheckedRowIds: any[] = [];
  @Input() filterOptions: any = {};
  @Output() resetFilter:any =  new EventEmitter();;
  rows: any=[];
  showContent:any=false;
  ledgerDetails:any={};
  constructor(
    public formBuilder: UntypedFormBuilder,
    private titleService: Title,
    private toastr: ToastrService,
    private router: Router,
    private adminService: AdminService,
    private spinner: NgxSpinnerService,
    private datePipe: DatePipe,
    private sanitizer: DomSanitizer


  ) { }

  ngOnInit(): void {
    let self=this;
    this.dtOptions = {
      processing: true,
      ordering: false,
      paging:false,
      order: [],
      searching: false,
      lengthChange: true, lengthMenu: Global.DataTableLengthChangeMenu,
      scrollX:true,
      responsive:false,
      language: {
        searchPlaceholder: 'Search...',
        search: ""
      }
    };  
  
  }
  ngOnChanges()
  {
    this.fetch();
  }
  fetch() {
    let filterOptions={
      'pageno': 1,
      'wage_date_from': this.filterOptions.wage_from_date ?? null,
      'wage_date_to': this.filterOptions.wage_to_date ?? null,
      'corporate_id': this.filterOptions.corporate_id ?? null,
      'reseller_id': this.filterOptions?.reseller_id?this.filterOptions?.reseller_id : [],
      'unchecked_row_ids': this.filterOptions?.unchecked_row_ids,
      'row_checked_all': this.filterOptions?.row_checked_all?.toString(),
      'checked_row_ids': this.filterOptions?.checked_row_ids,
      
    }
    
    this.adminService.ledgerDetail(filterOptions).subscribe(res => {
      if (res.status == 'success') {
        
        var docs: any=[];
       
         docs = res.company;
        if(docs)
        {
          let sl_no=1;
          docs.forEach((doc: any) => {
          doc.credit_purchases.forEach((subDoc:any) => {
          subDoc.checked = this.isRowChecked(doc._id);
          subDoc.sl_no= sl_no ;
          sl_no++;
          });  


          });
        }
        else{
          docs=[];
        }
       
        
        
        this.showContent=true;
        $('#my-datatable').dataTable().api().clear();
        this.rows=docs;
        $('#my-datatable').dataTable().api().draw();

      } else if (res.status == 'val_err') {
        this.toastr.error(Global.showValidationMessage(res.val_msg));
      } else {
        this.toastr.error(res.message);
      }

    }, (err) => {
      this.toastr.error("Internal server error occured. Please try again later.");
    });
  }
   

  
  anyRowsChecked(): boolean {
    return (
      this.rowCheckedAll == true ||
      this.checkedRowIds.length > 0 ||
      this.uncheckedRowIds.length > 0
    );
  }
  allRowsCheckboxChecked(event: any) {
    if (this.rowCheckedAll) {
      this.uncheckedRowIds.length = 0;
      this.rowCheckedAll = false;
    } else {
      this.checkedRowIds.length = 0;
      this.rowCheckedAll = true;
    }
    
    this.fetch();
  }
  private isRowChecked(rowId: any) {
    if (!this.rowCheckedAll) {
      return this.checkedRowIds.indexOf(rowId) >= 0 ? true : false;
    }
    else {
      return this.uncheckedRowIds.indexOf(rowId) >= 0 ? false : true;
    }
  }

  rowCheckBoxChecked(event: any, row: any) {
    let rowId: any = row._id;
    let checkbox: any = document.querySelectorAll('[data-checkbox-id="' + rowId + '"]');

    if (checkbox.length > 0) {
      if (checkbox[0].checked) {
        this.uncheckedRowIds.splice(this.uncheckedRowIds.indexOf(rowId), 1);
        if (!this.rowCheckedAll) {
          this.checkedRowIds.push(rowId);
        }
      }
      else {
        this.checkedRowIds.splice(this.checkedRowIds.indexOf(rowId), 1);
        if (this.rowCheckedAll) {
          this.uncheckedRowIds.push(rowId);
        }
      }
    }
  }
  async exportData(file_type:any='')
  {
    let filterOptions={
      'pageno': 1,
      'wage_date_from': this.filterOptions.wage_from_date ?? null,
      'wage_date_to': this.filterOptions.wage_to_date ?? null,
      'corporate_id': this.filterOptions.corporate_id ?? null,
      'reseller_id': this.filterOptions?.reseller_id?this.filterOptions?.reseller_id : [],
      'unchecked_row_ids': this.uncheckedRowIds,
      'row_checked_all': this.rowCheckedAll.toString(),
      'checked_row_ids': this.checkedRowIds,
      generate:file_type
  }
  
  await this.adminService.downloadFile('get-company-ledgers-details-list', 'Company-leadgers-details-list', filterOptions) 

  // this.adminService.ledgerDetail(filterOptions).subscribe(res => {
  //   if (res.status == 'success') {
  //     this.toastr.success("Downloaded Successfully");

  //   location.href= res?.url;

  //   } else if (res.status == 'val_err') {
  //     this.toastr.error(Global.showValidationMessage(res.val_msg));
  //   } else {
  //     this.toastr.error(res.message);
  //   }

  // }, (err) => {
  //   this.toastr.error("Internal server error occured. Please try again later.");
  // });




  }

  exportSingleData(item:any='')
  {
    this.ledgerDetails=item;
    this.ledgerDetails.file_path=this.sanitizer.bypassSecurityTrustResourceUrl(Global.BACKEND_URL+this.ledgerDetails?.file_path);
    $("#historymmodalbutton").click();



  }



  cancellData()
  {
    this.resetFilter.emit(true);
  }


}
