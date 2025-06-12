import { DatePipe } from '@angular/common';
import { Component, ElementRef, Input, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormArray, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { CompanyuserService } from 'src/app/services/companyuser.service';
import * as Global from 'src/app/globals';
import PaginationOptions from 'src/app/models/PaginationOptions';
import TableFiilterOptions from 'src/app/models/TableFiilterOptions';
import swal from 'sweetalert2';
import { Router, ActivatedRoute } from "@angular/router";

@Component({
  selector: 'app-register-form-twentythree',
  templateUrl: './register-form-twentythree.component.html',
  styleUrls: ['./register-form-twentythree.component.css'],
  encapsulation: ViewEncapsulation.None

})
export class RegisterFormTwentythreeComponent implements OnInit {
  @Input() reportFilter: any = {};
  days:any=[];
  Global = Global;
  start_date:any='';
  end_date:any='';
  paginationOptions: PaginationOptions = Global.resetPaginationOption();
  tableFilterOptions: TableFiilterOptions = Global.resetTableFilterOptions();
  empReportData:any=[];
  zeroPad = (num:any, places:any) => String(num).padStart(places, '0');
  current_date:any=new Date();
  rowCheckedAll: Boolean = false;
  checkedRowIds: any[] = [];
  uncheckedRowIds: any[] = [];
  report_type:any='';
  itemDetail:any={};
  constructor(
    public formBuilder: UntypedFormBuilder,
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
    this.getFiltered();
  }

  getFiltered(page:any=null)
  {
    return new Promise((resolve, reject) => {
          if (page != null) {
              this.paginationOptions.page = page;
          }
          let payload:any={};
          payload.pageno = this.paginationOptions.page;
          payload.perpage = this.tableFilterOptions.length;
          payload.row_checked_all = this.reportFilter.row_checked_all,
          payload.checked_row_ids = this.reportFilter.checked_row_ids,
          payload.unchecked_row_ids = this.reportFilter.unchecked_row_ids,
          payload.wage_month = this.reportFilter.wage_month,
          payload.wage_year = this.reportFilter.wage_year,

          this.spinner.show();
          this.companyuserService.overtimeReportTwentythree(payload).subscribe(res => {
              if (res.status == 'success') {
                  this.empReportData = [];
                  let master_data = res?.data?.docs ?? []
                  this.empReportData=master_data;
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
                  this.empReportData = [];
                  this.paginationOptions = Global.resetPaginationOption();
              }

              this.spinner.hide();
              Global.loadCustomScripts('customJsScript');
              resolve(true);
          }, (err) => {
              this.empReportData = [];
              this.paginationOptions = Global.resetPaginationOption();
              this.spinner.hide();
              Global.loadCustomScripts('customJsScript');
              resolve(true);
          });

  })
  }
}
