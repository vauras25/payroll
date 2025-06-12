import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router, ActivatedRoute } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { CompanyuserService } from 'src/app/services/companyuser.service';
import * as Global from 'src/app/globals';

@Component({
  selector: 'app-employee-vault-doc-detail',
  templateUrl: './employee-vault-doc-detail.component.html',
  styleUrls: ['./employee-vault-doc-detail.component.css']
})
export class EmployeeVaultDocDetailComponent implements OnInit {

  Global = Global;
  operation:any;
  employee_id:any;
  employee_details:any;
  rows:any=[];

  constructor(
   private titleService: Title,
   private toastr: ToastrService,
   private router: Router,
   private companyuserService: CompanyuserService,
   private spinner: NgxSpinnerService,
   private activatedRoute: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.titleService.setTitle("Employees - " + Global.AppName);
          
    this.activatedRoute.params.subscribe(
        params => this.employee_id = params['employee_id'] ?? null
    )

    if (!this.employee_id) {
        this.operation = 'add';
        $('#current-address-fields').hide(500);
    } else {
        let r = this.router.url.split('/')
        if (r[4] == 'view') {
            this.operation = 'view';
            $('input').attr('disabled', 'true')
        } else if (r[4] == 'edit') {
            this.operation = 'edit';
        }

    }
      this.fetchDocumentsDetails();
  }

  fetchDocumentsDetails()
  {
    let id=this.activatedRoute.snapshot.paramMap.get('id');

    this.spinner.show();
      this.companyuserService.getEmployeeDocumentDetalis({employee_id:this.employee_id,upload_for:id}).subscribe(res => {
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
