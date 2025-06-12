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
  selector: 'app-advance-requests',
  templateUrl: './advance-requests.component.html',
})
export class AdvanceRequestsComponent implements OnInit {
  advancerequestForm: FormGroup; 
  Global=Global;
  employee_details:any='';
  leave_cat_lists:any=[];
  advance_requests:any=[];
  paginationOptions: PaginationOptions;
  libraryPaginationOptions: PaginationOptions;
  recovery_items:any=[{key:"incentive",value:"Incentive"},
  {key:"bonus",value:"Bonus"},
  {key:"gross_earning",value:"Gross Earning"},
  {key:"annual_earning",value:"Annual Earning"},
];
frequencies:any=[{key:"monthly",value:"Monthly"},
  {key:"quaterly",value:"Quaterly"},
  {key:"halfyearly",value:"Half Yearly"},
  {key:"annually",value:"Annually"},
];
monthMaster: any[] = [];
yearMaster: any[] = [];
advance_detail:any={};
sum_footer:any=''
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


  ) { 
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

  ngOnInit(): void {
   
    this.fetchleaveRequest();
    }
    
fetchleaveRequest(page: any = null) {
    return new Promise((resolve, reject) => {
      if (page != null) {
        this.paginationOptions.page = page;
      }

      this.spinner.show();
      this.commonService.postDataRaw("employee/employee-get-advance-list",{
        'pageno': this.paginationOptions.page,
      }).subscribe(res => {
        if (res.status == 'success') {
          this.advance_requests = res.advance_data.docs;
          this.paginationOptions = {
            hasNextPage: res.advance_data.hasNextPage,
            hasPrevPage: res.advance_data.hasPrevPage,
            limit: res.advance_data.limit,
            nextPage: res.advance_data.nextPage,
            page: res.advance_data.page,
            pagingCounter: res.advance_data.pagingCounter,
            prevPage: res.advance_data.prevPage,
            totalDocs: res.advance_data.totalDocs,
            totalPages: res.advance_data.totalPages,
          };
        } else {
          this.toastr.error(res.message);

          this.advance_requests = [];
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
        this.advance_requests = [];
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
  setValue(item:any)
  {
   
    this.advance_detail=item;
    this.sum_footer=this.advance_detail.instalment_history.reduce((accum:any=0, curr:any) => parseFloat(accum) + parseFloat(curr.advance_amount), 0);
  }
  

}
