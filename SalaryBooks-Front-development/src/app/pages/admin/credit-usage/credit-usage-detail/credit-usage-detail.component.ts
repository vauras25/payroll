import { DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormGroup, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { disableDebugTools, DomSanitizer, Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import * as Global from 'src/app/globals';
import { AdminService } from 'src/app/services/admin.service';
import swal from 'sweetalert2';
@Component({
  selector: 'app-credit-usage-detail',
  templateUrl: './credit-usage-detail.component.html',
  styleUrls: ['./credit-usage-detail.component.css']
})
export class CreditUsageDetailComponent  implements OnInit {
  Global = Global;
  dtOptions: DataTables.Settings = {};
  rowCheckedAll: Boolean = false;
  checkedRowIds: any[] = [];
  uncheckedRowIds: any[] = [];
  @Input() filterOptions: any = {};
  @Output() resetFilter:any =  new EventEmitter();;
  rows: any=[];
  showContent:any=false;
  subscriptionUserSearchForm:FormGroup
  creditDetails:any={};
  constructor(
    public formBuilder: UntypedFormBuilder,
    private titleService: Title,
    private toastr: ToastrService,
    private router: Router,
    private adminService: AdminService,
    private spinner: NgxSpinnerService,
    private datePipe: DatePipe,
    private sanitizer: DomSanitizer

  ) { 

    this.subscriptionUserSearchForm = formBuilder.group({
      'wage_to_date': [null],
      'wage_from_date': [null],
    });

  }

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
   
    
      this.subscriptionUserSearchForm.patchValue({
        wage_from_date:  this.filterOptions?.wage_from_date,wage_to_date:this.filterOptions?.wage_to_date
      });
     
      this.fetch();
    
    
  }
  fetch() {
    let date = new Date(), y = date.getFullYear(), m = date.getMonth();
    this.showContent=false;   
    let filterOptions={
      'pageno': 1, 
      'wage_month_from': this.subscriptionUserSearchForm?.value?.wage_from_date?(new Date(this.subscriptionUserSearchForm?.value?.wage_from_date).getMonth()+1) : m,

      'wage_year_from': this.subscriptionUserSearchForm?.value?.wage_from_date?(new Date(this.subscriptionUserSearchForm?.value?.wage_from_date).getFullYear()) :y,

      'wage_month_to': this.subscriptionUserSearchForm?.value?.wage_to_date?(new Date(this.subscriptionUserSearchForm?.value?.wage_to_date).getMonth()+1) : m,

      'wage_year_to': this.subscriptionUserSearchForm?.value?.wage_to_date?(new Date(this.subscriptionUserSearchForm?.value?.wage_to_date).getFullYear()) : y,

      'corporate_id': this.filterOptions?.corporate_id ?? null,

      'reseller_id': this.filterOptions?.reseller_id?this.filterOptions?.reseller_id : [],

      'unchecked_row_ids': this.filterOptions?.unchecked_row_ids,

      'row_checked_all':this.filterOptions?.row_checked_all,

      'checked_row_ids': this.filterOptions?.checked_row_ids,
      
    }
    this.adminService.fetchCreditUsageView(filterOptions).subscribe(res => {
      if (res.status == 'success') {
        var docs: any=[];
         docs = res.company;
         let sl_no=1;
        if(docs)
        {
          docs.forEach((doc: any) => {
            
            doc?.company_credit_history_logs.forEach((elem:any) => {
              let particular=elem.type;
              if(particular=='consumed')
              {
                particular="Consumed";
              }
              if(particular=='credit_coupon')
              {
                particular="Promo";
              }
              if(particular=='credit')
              {
                particular="Purchase";
              }   
              elem.particular = particular;
              let inv_id;
              if(elem.type=='credit' || elem.type=='credit_coupon')
              {
                inv_id=elem?.details?.inv_id;
              }
              if(elem?.type=='consumed')
              {
                inv_id=Global.monthMaster.find(x=>x.index==elem?.details?.wage_month)?.sf+'-'+elem?.details?.wage_year
              }
              elem.inv_id=inv_id;

              let credited_amnt;
              if(elem.type=='credit' || elem?.type=='credit_coupon')
               {
                credited_amnt=elem?.details?.credit_amount;
               }
               elem.credited_amnt=credited_amnt ?? '';
    
               let deduct_amnt;
              if(elem?.type=='consumed' )
                {
                  deduct_amnt=elem?.balance;
                }
                elem.deduct_amnt=deduct_amnt ?? '';
                elem.sl_no=sl_no;
                elem.checked = this.isRowChecked(doc._id);

                sl_no++;
            });
  
          
  
           
          });


        }
        else{
          docs=[];
        }
       
        $('#my-datatable').dataTable().api().clear()
        this.rows=docs;
        $('#my-datatable').dataTable().api().draw(); 
       
       
        this.showContent=true;   
      
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
  exportData()
  {
    let date = new Date(), y = date.getFullYear(), m = date.getMonth();

    let filterOptions={
      'pageno': 1, 
      'wage_month_from': this.subscriptionUserSearchForm?.value?.wage_from_date?(new Date(this.subscriptionUserSearchForm?.value?.wage_from_date).getMonth()+1) : m,

      'wage_year_from': this.subscriptionUserSearchForm?.value?.wage_from_date?(new Date(this.subscriptionUserSearchForm?.value?.wage_from_date).getFullYear()) :y,

      'wage_month_to': this.subscriptionUserSearchForm?.value?.wage_to_date?(new Date(this.subscriptionUserSearchForm?.value?.wage_to_date).getMonth()+1) : m,

      'wage_year_to': this.subscriptionUserSearchForm?.value?.wage_to_date?(new Date(this.subscriptionUserSearchForm?.value?.wage_to_date).getFullYear()) : y,

      'corporate_id': this.filterOptions?.corporate_id ?? null,

      'reseller_id': this.filterOptions?.reseller_id?this.filterOptions?.reseller_id : [],

      'unchecked_row_ids': this.uncheckedRowIds,

      'row_checked_all':this.rowCheckedAll.toString(),

      'checked_row_ids': this.checkedRowIds,
      'generate':'excel'
      
    }  

   this.adminService.downloadFile('get-company-credit-usage-details-list', 'Company-credit-usage-details-list', filterOptions) 

  // this.adminService.fetchCreditUsageView(filterOptions).subscribe(res => {
  //   if (res.status == 'success') {
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
viewData(item:any={}){
this.creditDetails={
  total_free_employee:item?.details?.total_free_employee ?? "",
  total_additional_employee:item?.details?.total_additional_employee ?? "",
  total_free_staff:item?.details?.total_free_staff ?? "",
  total_additional_staff:item?.details?.total_additional_staff ?? "",
  plan:item?.details?.plan?.plan_name ?? "",
  type:item?.type,file_path:item?.details?.file_path?(this.sanitizer.bypassSecurityTrustResourceUrl(Global.BACKEND_URL+item?.details?.file_path)) : '',
  total_employee_cost:item?.details?.total_employee_cost,total_staff_cost:item?.details?.total_staff_cost,credit_balance:item?.details?.credit_balance


}

$("#historymmodalbutton").click();
}
 
  cancellData()
  {
    this.resetFilter.emit(true);
  }


}
