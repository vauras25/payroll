import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  UntypedFormControl,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import * as Global from 'src/app/globals';
import PaginationOptions from 'src/app/models/PaginationOptions';
import TableFilterOptions from 'src/app/models/TableFiilterOptions';
import { CompanyuserService } from 'src/app/services/companyuser.service';
import { CMPMasterSheetReportComponent } from '../../report/master-sheet/master-sheet.component';
import { _salarySheetTempMasterNew } from 'src/app/pages/companyuser/report/_salarySheetTempMaster';
@Component({
  selector: 'app-arrear-report',
  templateUrl: './arrear-report.component.html',
  styleUrls: ['./arrear-report.component.css']
})
export class ArrearReportComponent implements OnInit {
  @Input() rivisionFilterNew: any={};
  @Output() cancelPage= new EventEmitter();;

  Global = Global;
  tableOperationForm: FormGroup;
  bankMaster: any[] = [];
  reportPaginationOptions: PaginationOptions = Global.resetPaginationOption();
  reportTableFilterOptions: TableFilterOptions =
  Global.resetTableFilterOptions();
  currentDate:any='';
  rows:any=[]
  constructor(
    private titleService: Title,
    private formBuilder: FormBuilder,
    private spinner: NgxSpinnerService,
    private companyuserService: CompanyuserService,
    private toastr: ToastrService  

  ) { }

  ngOnInit(): void {
  }
  ngOnChanges()
  {
    this.fetchEmployees({page:1,filter:this.rivisionFilterNew});
  }
  fetchEmployees({
    page = <any>null,
    loading = <boolean>true,
    filter = <any>null,
  } = {}) {
    return new Promise((resolve, reject) => {
      if (page != null) this.reportPaginationOptions.page = page;
      if (filter != null) this.rivisionFilterNew = filter;

      if (!this.rivisionFilterNew) {
        resolve(false);
        return;
      }
      this.currentDate=Global.monthMaster.find(x=>x.index==filter?.wage_month)?.monthLabel+'/'+filter?.wage_year
      let payload:any=filter;
      payload.wage_month_from=payload?.wage_month;
      payload.wage_year_from=payload?.wage_year;

      payload.wage_month_to=payload?.wage_month;
      payload.wage_year_to=payload?.wage_year;

      this.spinner.show();
      this.companyuserService.getArrearReport(payload).subscribe(
        (res) => {
          if (res.status == 'success') {
            var docs: any[] = res?.employees ?? [];
            this.rows = docs;
            resolve(true);
          } else {
            if (res.status == 'val_err')
              this.toastr.error(Global.showValidationMessage(res.val_msg));
               else this.toastr.error(res.message);
             this.rows = [];
            resolve(false);
          }

          this.spinner.hide();
          Global.loadCustomScripts('customJsScript');
        },
        (err) => {
          this.toastr.error(
            Global.showValidationMessage(Global.showServerErrorMessage(err))
          );
          this.rows = [];
          
          Global.loadCustomScripts('customJsScript');
          resolve(false);
        }
      );
    });
  }
  cancell()
  {
    this.cancelPage.emit(true);
  }
  download(){
    // return new Promise((resolve, reject) => {
      
      let payload:any=this.rivisionFilterNew;
      payload.wage_month_from=payload?.wage_month;
      payload.wage_year_from=payload?.wage_year;

      payload.wage_month_to=payload?.wage_month;
      payload.wage_year_to=payload?.wage_year;
      payload.generate='pdf';

      this.spinner.show();
      //   (res) => {
      this.companyuserService.downloadFile('employee-arrear-slip-report','employee-arrear-slip',payload)
      this.spinner.hide()
      // .subscribe(
      //   (res) => {
      //     if (res.status == 'success') {
      //      location.href=res?.url;
      //       resolve(true);
      //     } else {
      //       if (res.status == 'val_err')
      //         this.toastr.error(Global.showValidationMessage(res.val_msg));
      //          else this.toastr.error(res.message);
      //       resolve(false);
      //     }

      //     this.spinner.hide();
      //     Global.loadCustomScripts('customJsScript');
      //   },
      //   (err) => {
      //     this.toastr.error(
      //       Global.showValidationMessage(Global.showServerErrorMessage(err))
      //     );
          
      //     Global.loadCustomScripts('customJsScript');
      //     resolve(false);
      //   }
      // );
    // });  
  }


}
