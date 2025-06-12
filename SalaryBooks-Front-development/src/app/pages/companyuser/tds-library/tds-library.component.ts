import { Component, OnInit } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormGroup, Validators,FormArray, FormGroup } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { CompanyuserService } from 'src/app/services/companyuser.service';
import * as Global from 'src/app/globals';
import swal from 'sweetalert2';
import PaginationOptions from 'src/app/models/PaginationOptions';
import { DatePipe } from '@angular/common';
import { json } from 'stream/consumers';
import { ActivatedRoute } from '@angular/router';
@Component({
  selector: 'app-tds-library',
  templateUrl: './tds-library.component.html',
  styleUrls: ['./tds-library.component.css']
})
export class TdsLibraryComponent implements OnInit {
  tdsForm: UntypedFormGroup;
  editActionId: String;
  paginationOptions: PaginationOptions;

  Global=Global;
  
  tdsData:any=[];

  constructor(
    public formBuilder: UntypedFormBuilder,
    private titleService: Title,
    private toastr: ToastrService,
    private companyuserService: CompanyuserService,
    private spinner: NgxSpinnerService,
    private datePipe: DatePipe,
    private activatedRoute: ActivatedRoute,  
  ) { 
    

  }
  async ngOnInit() {
  
  this.fetch();

  }
 
  cancelEntry() {
    Global.resetForm(this.tdsForm);
  }
 
  fetch(page:any=1) {

    return new Promise(async (resolve, reject) => {
      
     this.spinner.show();
      this.companyuserService.geTDSLibrary({page:page}).subscribe((res: any) => {
        if (res.status == 'success') {
          var docs: any[] = res?.data?.docs ?? [];
          this.tdsData=docs;

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
          this.tdsData = [];
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

          this.toastr.error(res.message);
        }

        this.spinner.hide();
        resolve(true);
      }, 
      (err) => {
        this.tdsData = [];
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
        resolve(true);
      });
    });  






  }

  


}
