import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { UntypedFormBuilder, FormControl, UntypedFormGroup, Validators, FormGroup } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { AppComponent } from 'src/app/app.component';
import * as Global from 'src/app/globals';
import { AuthService } from 'src/app/services/auth.service';
import { CommonService } from 'src/app/services/common.service';
import { DatePipe } from '@angular/common';
import PaginationOptions from 'src/app/models/PaginationOptions';
@Component({
  selector: 'app-view-document',
  templateUrl: './view-document.component.html',
  styleUrls: ['../../employee-user-layout.component.css'],
  encapsulation: ViewEncapsulation.None


})
export class ViewDocumentComponent implements OnInit {
  Global=Global;
  employee_details:any='';
  leave_cat_lists:any=[];
  leave_requests:any=[];
  paginationOptions: PaginationOptions;
  libraryPaginationOptions: PaginationOptions;
  rows:any=[];
  selectedItem:any={};
  constructor(
    private titleService: Title,
    private authService: AuthService,
    private toastr: ToastrService,
    private router: Router,
    private AppComponent: AppComponent,
    private commonService: CommonService,
    private spinner: NgxSpinnerService,
    private datePipe: DatePipe,
    private activatedRoute: ActivatedRoute

  ) { }

  ngOnInit(): void {
  this.fetchDocuments();  

  }
  fetchDocuments()
  {
    let id=this.activatedRoute.snapshot.paramMap.get('id');

    this.spinner.show();
      this.commonService.postDataRaw("employee/employee-file-document-list-details",{upload_for:id}).subscribe(res => {
        if (res.status == 'success') {
          this.rows = res.data;
        } else {
          this.toastr.error(res.message);
          this.rows = [];
          
        }
  
        this.spinner.hide();
        Global.loadCustomScripts('customJsScript');
      }, (err) => {
        this.rows = [];
        
  
        this.spinner.hide();
        this.toastr.error(Global.showServerErrorMessage(err));
        Global.loadCustomScripts('customJsScript');
      }); 
   
  }

}
