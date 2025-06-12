import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { AbstractControl, UntypedFormBuilder, FormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { CompanyuserService } from 'src/app/services/companyuser.service';
import * as Global from 'src/app/globals';
import swal from 'sweetalert2';
import { DatePipe } from '@angular/common';
import { AppComponent } from 'src/app/app.component';
import { CommonService } from 'src/app/services/common.service';
@Component({
  selector: 'app-hr-policy',
  templateUrl: './hr-policy.component.html',
})
export class HrPolicyComponent implements OnInit {
  Global = Global;
  operation: any;
  employee_id: any;
  contract_id: any;
  @Input() employee_details: any;
  employeeContractForm: UntypedFormGroup;
  @Input() isReadOnly:boolean;
  @Output() submitContract = new EventEmitter<any>();
  contract_file_image:any='';
  constructor(
    public formBuilder: UntypedFormBuilder,
    private titleService: Title,
    private toastr: ToastrService,
    private router: Router,
    private companyuserService: CompanyuserService,
    private spinner: NgxSpinnerService,
    private activatedRoute: ActivatedRoute,
    private datePipe: DatePipe,
    private AppComponent: AppComponent,
    public commonService: CommonService

  ) { }

  ngOnInit(): void {
  }

}
