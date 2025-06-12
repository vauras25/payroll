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
    selector: 'employee-app-apply',
    templateUrl: './apply.component.html',
    styleUrls: ['../employee-user-layout.component.css'],
    encapsulation: ViewEncapsulation.None,

})
export class EMPApplyComponent implements OnInit {
    leaveapplyForm: FormGroup;
    Global=Global;
    employee_details:any='';
    leave_cat_lists:any=[];
    leave_requests:any=[];
    paginationOptions: PaginationOptions;
    libraryPaginationOptions: PaginationOptions;
    permission:any;
    max_upload_limit: number=0;
    net_uploaded_size: number=0;
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
        this.leaveapplyForm=formBuilder.group({
            leave_id: ["", Validators.compose([Validators.required])] ,
            note: ["", Validators.compose([Validators.required])] ,

            leave_temp_head: ["", Validators.compose([Validators.required])],
            leave_from_date: [null, Validators.compose([Validators.required])] ,
            leave_to_date: [null, Validators.compose([Validators.required])],
            leave_remain: [null, Validators.compose([])],
            no_of_days: [null, Validators.compose([Validators.required])],
            leave_balance: [null, Validators.compose([Validators.required,Validators.min(0)])]

        });
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
    this.permission=this.authService.getempPermission();  
    this.fetchEmployeeDetails();
    this.fetchleaveRequest();
    }

    fetchEmployeeDetails() {

        this.spinner.show();
        this.commonService.postDataRaw("employee/employee-leave-type-list",{})
            .subscribe((res: any) => {
                this.spinner.hide();
                if (res.status == 'success') {
                 this.leave_cat_lists=  res.leave_type ;

                } else {
                    this.toastr.error(res.message);
                }

                this.spinner.hide();
            }, (err) => {
                this.spinner.hide();
                this.toastr.error(Global.showServerErrorMessage(err));
            });

}




settotalDays(ev:any)
{
    let item = this.leave_cat_lists.find((x:any) => x._id === ev.target.value);
    // console.log(item);

    if(item)
    {

        this.leaveapplyForm.patchValue({leave_remain:item.total_balance,leave_temp_head:item.abbreviation});
    }
}
getDays()
{
    if(this.leaveapplyForm.value.leave_from_date && this.leaveapplyForm.value.leave_to_date)
    {
        let currentDate = new Date(this.leaveapplyForm.value.leave_to_date);
        let dateSent = new Date(this.leaveapplyForm.value.leave_from_date);

      let days=Math.floor((Date.UTC(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()) - Date.UTC(dateSent.getFullYear(), dateSent.getMonth(), dateSent.getDate()) ) /(1000 * 60 * 60 * 24));
      if(days>0)
      {
        let leave_balance=this.leaveapplyForm.value.leave_remain-days;

        this.leaveapplyForm.patchValue({no_of_days:days,leave_balance:leave_balance});

      }
      else{
        this.leaveapplyForm.patchValue({no_of_days:"",leave_balance:""});

      }
    }
}
submitForm(event:any)
{
    this.leaveapplyForm.markAllAsTouched();

    if (this.leaveapplyForm.valid) {
        event.target.classList.add('btn-loading');
        this.spinner.show();
        let submit_data={
            leave_id:this.leaveapplyForm.value.leave_id,
            leave_temp_head:this.leaveapplyForm.value.leave_temp_head.toUpperCase(),
            leave_from_date:this.leaveapplyForm.value.leave_from_date,
            leave_to_date:this.leaveapplyForm.value.leave_to_date,
            leave_balance:this.leaveapplyForm.value.leave_balance,
            note:this.leaveapplyForm.value.note

        }
        this.commonService.postDataRaw("employee/employee-apply-leave",submit_data).subscribe(res => {
            this.spinner.hide();
            if (res.status == 'success') {
                this.toastr.success(res.message);
                this.fetchleaveRequest();
                this.cancelEntry();
            } else if (res.status == 'val_err') {
                this.toastr.error(Global.showValidationMessage(res.val_msg));
            } else {
                this.toastr.error(res.message);
            }

            event.target.classList.remove('btn-loading');
        }, (err) => {
            this.spinner.hide();
            event.target.classList.remove('btn-loading');
            this.toastr.error(Global.showServerErrorMessage(err));
        });
    }
}
cancelEntry() {
    Global.resetForm(this.leaveapplyForm);
    $('#leaveapplyModal').find('[data-dismiss="modal"]').click();
}

fetchleaveRequest(page: any = null) {
    return new Promise((resolve, reject) => {
      if (page != null) {
        this.paginationOptions.page = page;
      }

      this.spinner.show();
      this.commonService.postDataRaw("employee/employee-leave-list",{
        'pageno': this.paginationOptions.page,
      }).subscribe(res => {
        if (res.status == 'success') {
          this.leave_requests = res.leave_list.docs;
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
        } else {
          this.toastr.error(res.message);

          this.leave_requests = [];
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
        this.leave_requests = [];
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
