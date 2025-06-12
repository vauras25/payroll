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
import { Router } from '@angular/router';

@Component({
  selector: 'app-form-fifteen',
  templateUrl: './form-fifteen.component.html',
  styleUrls: ['./form-fifteen.component.css']
})
export class FormFifteenComponent implements OnInit {
  @Input() leaveencashFilter: any = {};
  Global = Global;
  paginationOptions: PaginationOptions = Global.resetPaginationOption();
  tableFilterOptions: TableFiilterOptions = Global.resetTableFilterOptions();
  leaveData:any=[];
  rows:any = [];
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
          // console.log(page);
          let payload: any = this.leaveencashFilter;
          payload.pageno = this.paginationOptions.page;
          payload.perpage = this.tableFilterOptions.length;
        

          this.spinner.show();
          this.companyuserService.formfifteenleaveReport(payload).subscribe(res => {
              if (res.status == 'success') {
                  let master_data=res?.employee;
                  this.rows=master_data;
              
              } else {
                  this.leaveData = [];
                  this.paginationOptions = Global.resetPaginationOption();
              }

              this.spinner.hide();
              Global.loadCustomScripts('customJsScript');
              resolve(true);
          }, (err) => {
              this.leaveData = [];
              this.paginationOptions = Global.resetPaginationOption();
              this.spinner.hide();
              Global.loadCustomScripts('customJsScript');
              resolve(true);
          });

  })
  }

}
