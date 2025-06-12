import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router, ActivatedRoute } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { CompanyuserService } from 'src/app/services/companyuser.service';
import * as Global from 'src/app/globals';

@Component({
  selector: 'app-employee-vault',
  templateUrl: './employee-vault.component.html',
  styleUrls: ['./employee-vault.component.css']
})
export class EmployeeVaultComponent implements OnInit {
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

  async ngOnInit() {
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

        this.fetchEmployeeDetails();
    }
  this.fetchDocuments();
  }
  fetchEmployeeDetails() {
      this.spinner.show();
      this.companyuserService.getEmployeeDetails({ employee_id: this.employee_id })
          .subscribe((res: any) => {
              if (res.status == 'success') {
                  this.employee_details = res.employee_det
              } else {
                  this.toastr.error(res.message);
              }
              this.spinner.hide();
          }, (err) => {
              this.spinner.hide();
              this.toastr.error(Global.showServerErrorMessage(err));
          });
  }


  fetchDocuments()
  {
    this.spinner.show();
      this.companyuserService.getEmployeeDocumentList({ employee_id: this.employee_id }).subscribe(res => {
        if (res.status == 'success') {
          this.rows = res.data;
        
        } else {
          this.toastr.error(res.message);
          this.rows = [];
        }
  
        this.spinner.hide();
        Global.loadCustomScripts('customJsScript');
      }, (err:any) => {
        this.rows = [];
        this.spinner.hide();
        this.toastr.error(Global.showServerErrorMessage(err));
        Global.loadCustomScripts('customJsScript');
      }); 
    
  }
}
