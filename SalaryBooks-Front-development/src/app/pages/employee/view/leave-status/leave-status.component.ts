import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { UntypedFormBuilder, FormControl, UntypedFormGroup, Validators, FormGroup } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { AppComponent } from 'src/app/app.component';
import * as Global from 'src/app/globals';
import { AuthService } from 'src/app/services/auth.service';
import { CommonService } from 'src/app/services/common.service';
import { DatePipe } from '@angular/common';
import PaginationOptions from 'src/app/models/PaginationOptions';
@Component({
  selector: 'app-leave-status',
  templateUrl: './leave-status.component.html',
})
export class LeaveStatusComponent implements OnInit {
  leaveapplyForm: FormGroup; 
  Global=Global;
  employee_details:any='';
  leave_cat_lists:any=[];
  leave_requests:any=[];
  paginationOptions: PaginationOptions;
  libraryPaginationOptions: PaginationOptions;
  rows:any=[];
  selectedItem:any={};
  constructor(
    public formBuilder: UntypedFormBuilder,
        private titleService: Title,
        private authService: AuthService,
        private toastr: ToastrService,
        private router: Router,
        private AppComponent: AppComponent,
        private commonService: CommonService,
        private spinner: NgxSpinnerService,
        private datePipe: DatePipe,

  ) { }

  ngOnInit(): void {

    this.fetchleaveRequest();
    this.paginationOptions = this.libraryPaginationOptions = {
      hasNextPage: false,
      hasPrevPage: false,
      limit: Global.DataTableLength,
      nextPage: null,
      page: 1,
      pagingCounter: 1,
      prevPage: null,
      totalDocs: 0,
      totalPages: 1,
    };
  }
  fetchleaveRequest(page: any = null) {
    return new Promise((resolve, reject) => {
      
      this.spinner.show();
      this.commonService.postDataRaw("employee/employee-view-leave-status-list",{}).subscribe(res => {
        if (res.status == 'success') {
          this.leave_requests = res.leave_status_list;
     
        } else {
          this.toastr.error(res.message);

       
        }

        this.spinner.hide();
        Global.loadCustomScripts('customJsScript');
        resolve(true);
      }, (err) => {
        this.leave_requests = [];
       

        this.spinner.hide();
        this.toastr.error(Global.showServerErrorMessage(err));
        Global.loadCustomScripts('customJsScript');
        resolve(true);
      });
    });
  }
  getEdit(item:any,page:any=1)
  {
    if (page != null) {
      this.paginationOptions.page = page;
    }
    this.selectedItem=item;
    this.fetchLeaveSatus();
    

  }
  fetchLeaveSatus(event:any='')
  {
    return new Promise((resolve, reject) => {
      this.spinner.show();
      this.commonService.postDataRaw("employee/employee-view-leave-status-list-details",{
        'pageno': this.paginationOptions.page,'leave_abbreviation':this.selectedItem.abbreviation,perpage:10
      }).subscribe(res => {
        if (res.status == 'success') {
          this.rows = res.leave_list.docs;
          this.paginationOptions = {
            hasNextPage: res.leave_list.hasNextPage,
            hasPrevPage: res.leave_list.hasPrevPage,
            limit: res.leave_list.limit,
            nextPage: res.leave_list.nextPage,
            page: res.leave_list.page,
            pagingCounter: res.leave_list.pagingCounter,
            prevPage: res.leave_list.prevPage,
            totalDocs: res.leave_list.totalDocs,
            totalPages: res.leave_list.totalPages,
          };
          $('#leave_history_btn').click();
        } else {
          this.toastr.error(res.message);
          this.rows = [];
          this.paginationOptions = {
            hasNextPage: false,
            hasPrevPage: false,
            limit: Global.DataTableLength,
            nextPage: null,
            page: 1,
            pagingCounter: 1,
            prevPage: null,
            totalDocs: 0,
            totalPages: 1,
          };
        }
  
        this.spinner.hide();
        Global.loadCustomScripts('customJsScript');
        resolve(true);
      }, (err) => {
        this.rows = [];
        this.paginationOptions = {
          hasNextPage: false,
          hasPrevPage: false,
          limit: Global.DataTableLength,
          nextPage: null,
          page: 1,
          pagingCounter: 1,
          prevPage: null,
          totalDocs: 0,
          totalPages: 1,
        };
  
        this.spinner.hide();
        this.toastr.error(Global.showServerErrorMessage(err));
        Global.loadCustomScripts('customJsScript');
        resolve(true);
      }); 
    
    });
   
  }


}
