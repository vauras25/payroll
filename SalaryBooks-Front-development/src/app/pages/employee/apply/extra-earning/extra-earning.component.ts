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
import { fileSizeValidator } from 'src/app/globals';

@Component({
  selector: 'app-extra-earning',
  templateUrl: './extra-earning.component.html',
  styleUrls: ['./extra-earning.component.css']
})
export class ExtraEarningComponent implements OnInit {
  extraeariningapplyForm: FormGroup;
  Global=Global;
  employee_details:any='';
  leave_cat_lists:any=[];
  leave_requests:any=[];
  paginationOptions: PaginationOptions;
  libraryPaginationOptions: PaginationOptions;
  extra_earnings:any='';
  extra_earning_heads:any=[];
  yearMaster: any[] = [];
  max_upload_limit: number=0;
  net_uploaded_size: number=0;
  rowDetail:any={};
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
    this.extraeariningapplyForm = formBuilder.group({
      amount: [null, Validators.compose([Validators.required])],
      head_id: [null, Validators.compose([Validators.required])],
      wage_month:[null, Validators.compose([Validators.required])],
      wage_year:[null, Validators.compose([Validators.required])],
      earning_id:[null],
      extra_earnings_document:[null],
      document_preview:[],
      remark:[null]

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
  this.fetchextraEarning();  
  let currentYear = new Date().getFullYear();
    this.yearMaster = [];
    for (let index = 4; index >= 0; index--) {
      this.yearMaster.push({ value: (currentYear - index), description: (currentYear - index) });
    }
    this.fetchearningHead();
    this.fetchaccountDetails()
  }


submitForm(event:any)
{
    this.extraeariningapplyForm.markAllAsTouched();

    if (this.extraeariningapplyForm.valid) {
        event.target.classList.add('btn-loading');
        this.spinner.show();
        let submit_data={
          earning_id:this.extraeariningapplyForm.value?.earning_id,
          head_id:this.extraeariningapplyForm.value?.head_id?.value,
          amount:this.extraeariningapplyForm.value?.amount,
          wage_month:this.extraeariningapplyForm.value?.wage_month?.index,
          wage_year:this.extraeariningapplyForm.value?.wage_year?.value,
          extra_earnings_document:this.extraeariningapplyForm.value?.extra_earnings_document ,
          remark: this.extraeariningapplyForm.value?.remark
        };
        let end_point="employee/add-extra-earning-data";
        
       
        this.commonService.postData(end_point,submit_data).subscribe(res => {
            this.spinner.hide();
            if (res.status == 'success') {
                this.toastr.success(res.message);
                this.fetchextraEarning();
                this.fetchaccountDetails();
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
fetchearningHead()
{
  this.spinner.show();
  this.commonService.postDataRaw("employee/get-extra-earning-head",{})
      .subscribe((res: any) => {
          this.spinner.hide();
          if (res.status == 'success') {
           let extra_earning_heads=  res.temp_head ;
           extra_earning_heads.forEach((element:any) => {
            this.extra_earning_heads.push({value:element?.earning_head_id,description:element?.earning_category});
           });

          } else {
              this.toastr.error(res.message);
          }

          this.spinner.hide();
      }, (err) => {
          this.spinner.hide();
          this.toastr.error(Global.showServerErrorMessage(err));
      });
}
cancelEntry() {
    Global.resetForm(this.extraeariningapplyForm);
    $('#reimbursementModal').find('[data-dismiss="modal"]').click();
}
fetchextraEarning(page: any = null) {
  return new Promise((resolve, reject) => {
    if (page != null) {
      this.paginationOptions.page = page;
    }

    this.spinner.show();
    this.commonService.postDataRaw("employee/get-extra-earning",{
      'pageno': this.paginationOptions.page,
    }).subscribe(res => {
      if (res.status == 'success') {
        this.extra_earnings = res.data.docs;
        this.extra_earnings.forEach((elem:any,index:any) => {
          this.extra_earnings[index].month=Global.monthMaster.find(x=>x.index==elem?.wage_month)  
          this.extra_earnings[index].year=this.yearMaster.find(x=>x.value==elem?.wage_year)  

        });
        
        this.paginationOptions = {
          hasNextPage: res.data.hasNextPage,
          hasPrevPage: res.data.hasPrevPage,
          limit: res.data.limit,
          nextPage: res.data.nextPage,
          page: res.data.page,
          pagingCounter: res.data.pagingCounter,
          prevPage: res.data.prevPage,
          totalDocs: res.data.totalDocs,
          totalPages: res.data.totalPages,
        };
      } else {
        this.toastr.error(res.message);

        this.extra_earnings = [];
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
      this.extra_earnings = [];
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
getEdit(item:any)
{
  this.extraeariningapplyForm.patchValue({
    amount: item?.amount,
    head_id:this.extra_earning_heads.find((x:any)=> x.value==item?.head_id),
    wage_month:Global.monthMaster.find((x:any)=> x.index==item?.wage_month),
    wage_year:this.yearMaster.find((x:any)=> x.value==item?.wage_year),  
    earning_id:item?._id,
    document_preview:item?.document,remark: item?.remark

  });
  $("#reimbursementModal_modal_btn").click();
}

onsingleFileChanged(event: any, target: any) {
  if (event.target.files.length > 0) {
    let max_upload_file_size=this.max_upload_limit-this.net_uploaded_size;
    if(max_upload_file_size<0)
    {
        max_upload_file_size=0;
    }
    this.extraeariningapplyForm?.get([target])?.setValidators([fileSizeValidator(event.target.files[0],Global.maxFileSize(max_upload_file_size))]);
    this.extraeariningapplyForm?.get([target])?.updateValueAndValidity();
      this.extraeariningapplyForm.patchValue({
          [target]: event.target.files[0]
      });
  }
}
fetchaccountDetails() {
  this.spinner.show();
  this.commonService.postDataRaw("employee/get-account",{})
      .subscribe((res: any) => {
          this.spinner.hide();
          if (res.status == 'success') {
              // console.log(res.employee_det);
                  this.employee_details = res.employee_data[0];

                  this.max_upload_limit=+this.employee_details?.package?.employee_vault;    
                  this.net_uploaded_size=+this.employee_details?.total_file_size;
                 
                  if(isNaN(this.max_upload_limit))
                  {
                      this.max_upload_limit=0;
                  }
                  if(isNaN(this.net_uploaded_size))
                  {
                      this.net_uploaded_size=0;
                  }
                  if(this.net_uploaded_size>=this.max_upload_limit )
                  {
                      this.extraeariningapplyForm.controls['extra_earnings_document'].disable();
                  }
                 

          } else {
              this.toastr.error(res.message);
          }

          this.spinner.hide();
      }, (err) => {
          this.spinner.hide();
          this.toastr.error(Global.showServerErrorMessage(err));
      });
 

}
openRemark(item:any)
{
  this.rowDetail=item;
  $("#empextraearnremarkmodalbutton").click();
}
}
