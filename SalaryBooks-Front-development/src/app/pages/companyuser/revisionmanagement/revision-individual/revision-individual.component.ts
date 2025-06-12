import { Component, ElementRef, Inject, Input, OnInit, ViewChild } from '@angular/core';
import { AbstractControl, UntypedFormBuilder, FormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { CompanyuserService } from 'src/app/services/companyuser.service';
import * as Global from 'src/app/globals';
import swal from 'sweetalert2';
import { DOCUMENT, DatePipe } from '@angular/common';
import { AppComponent } from 'src/app/app.component';
import { Location } from '@angular/common';

@Component({
  selector: 'app-revision-individual',
  templateUrl: './revision-individual.component.html',
  styleUrls: ['./revision-individual.component.css']
})
export class RevisionIndividualComponent implements OnInit {
  Global = Global;
  operation: any;
  employee_id: any;
  employee_details: any;
  employees:any=[];
  salaryTempateDetails:any={};

  constructor(
    public formBuilder: UntypedFormBuilder,
    private titleService: Title,
    private toastr: ToastrService,
    private router: Router,
    private companyuserService: CompanyuserService,
    private spinner: NgxSpinnerService,
    private activatedRoute: ActivatedRoute,
    private datePipe: DatePipe,
    public AppComponent: AppComponent,
    public location: Location,
    @Inject(DOCUMENT) document: Document

  ) { }

  ngOnInit(): void {
    this.employee_id=this.activatedRoute.snapshot.paramMap.get('id')  ;
    this.fetchEmployeeDetails();
  }
  fetchEmployeeDetails() {
    return new Promise((resolve, reject) => {
       let payload:any={pageno:1,perpage:20,unchecked_row_ids:[],checked_row_ids:[this.employee_id],row_checked_all:"false",generate:''};
        this.spinner.show();
        this.companyuserService.getRivisionDetails(payload)
            .subscribe((res: any) => {
                if (res.status == 'success') {
                    // console.log(res.employee_det);
                    this.employees = res.employees;
                    // let revisions:any=[];
                    // if(employees)
                    // {
                    //   employees.forEach((element:any) => {
                    //     this.employees={
                    //       emp_id:  element.emp_id,
                    //       emp_first_name:element?.emp_first_name,
                    //       emp_last_name:element?.emp_last_name,
                    //       prev_gross_salary:element?.revision_logs?.prev_gross_salary,
                    //       // gross_salary:element?.salery_templates?.prev_gross_salary,
                    //       pre_salary_template:element?.pre_salary_template,
                    //       salery_templates:element?.salery_templates
                    //     } 
                    //     element.revision.forEach((elem:any,i:any) => {
                    //       elem.prev_sal_tpl= element?.salery_templates?.template_name;
                    //       elem.rev_sal_tpl= elem?.template_data?.salary_temp_data?.template_name;
                    //       revisions.push(elem);
                    //     });
                    //     });
                    //     this.employees.revisions=revisions;
                    // }
                    
                  
                    resolve(true);
                } else {
                    this.toastr.error(res.message);
                    resolve(false);
                }

                this.spinner.hide();
            }, (err) => {
                this.spinner.hide();
                this.toastr.error(Global.showServerErrorMessage(err));
                resolve(false);
            });
    })
}
viewSalaryTemplate(item: any) {
  this.salaryTempateDetails = item;
  $('#viewSalaryTemplateModalButton').click();
}
closeWindow()
{
  this.router.navigateByUrl('/company/revision-management/manage');
}
printDoc(elements:any) {
  // console.log(elements.target);
  var printContents = $("#sectionToPrint").html();

  document.body.innerHTML = printContents;

  window.print();
  window.location.reload();

  // if (this.employees.revisions !== 'null') {
  //   window.close();
  // } else {
  //   this.location.back();
  // }
  // let divContents = $("#sectionToPrint").html();
  // a.document.write(divContents);
  // a.document.close();
  // a.print();
}
}
