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
  selector: 'app-contract-details',
  templateUrl: './contract-details.component.html',
})
export class ContractDetailsComponent implements OnInit {
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

  ) { 
    this.employeeContractForm = formBuilder.group({
      start_date: [null, Validators.compose([])],
      end_date: [null, Validators.compose([])],
      description: [null, Validators.compose([])],
      comments: [null, Validators.compose([])],
      contract_file_image: [null, Validators.compose([])],
      contract_file_image_file: [null, Validators.compose([])],
  });

  this.contract_id = "";
  }
  ngOnInit(): void {
    this.titleService.setTitle("Employees - " + Global.AppName);
    this.activatedRoute.params.subscribe(
        params => this.employee_id = params['employee_id'] ?? null
    )

}

onFileChanged(event: any, formGroup: UntypedFormGroup, file: any, target: any) {
    if (event.target.files.length > 0) {
        const file = event.target.files[0];
        formGroup.patchValue({
            [target]: file
        });
    }
}


cancelEntry() {
    Global.resetForm(this.employeeContractForm);
}

getEdit(item: any) {
    this.contract_id = item._id;
    this.employeeContractForm.patchValue({
        start_date: item.start_date,
        end_date: item.end_date,
        description: item.description,
        comments: item.comments,
    });
    this.contract_file_image=item.
    Global.scrollToQuery("#contract-submit-section");
}

}
