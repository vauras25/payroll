import { Component, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import * as saveAs from 'file-saver';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { AppComponent } from 'src/app/app.component';
import * as Global from 'src/app/globals';
import PaginationOptions from 'src/app/models/PaginationOptions';
import { CompanyuserService } from 'src/app/services/companyuser.service';
import { Subject } from 'rxjs';
@Component({
  selector: 'app-apply-reimbursement',
  templateUrl: './apply-reimbursement.component.html',
  styleUrls: ['./apply-reimbursement.component.css']
})
export class ApplyReimbursementComponent implements OnInit {
    Global = Global;
    employeeFilter: any = null;
    
    addEmployeeReimbursementForm: UntypedFormGroup;
    paginationOptions: PaginationOptions = new PaginationOptions();
  
    departmentMaster: any[];
    designationMaster: any[];
    branchMaster: any[];
    hodMaster: any[];
    monthMaster: any[] = [];
    yearMaster: any[] = [];
    reimbursementStatusMaster: any[] = [];
  
    employees: any[] = [];
  
    sheetMonth: any = null;
    sheetYear: any = null;
  
    constructor(
      public formBuilder: UntypedFormBuilder,
      private titleService: Title,
      private companyuserService: CompanyuserService,
      private toastr: ToastrService,
      private router: Router,
      private spinner: NgxSpinnerService
    ) {
    
      this.departmentMaster = [];
      this.designationMaster = [];
      this.branchMaster = [];
      this.hodMaster = [];
  
      this.addEmployeeReimbursementForm = formBuilder.group({
        "emp_id": [null, Validators.compose([Validators.required])],
        "amount": [null, Validators.compose([Validators.required])],
        "head_id": [null, Validators.compose([Validators.required])],
      });
  
      this.reimbursementStatusMaster = [
        { value: "earning", description: "Earning" },
        { value: "deduction", description: "Deduction" },
      ];
    }
  
    async ngOnInit() {
      this.titleService.setTitle("Apply Reimbursement - " + Global.AppName);
      // await this.fetch();
    }
  
    fetch() {
      // return new Promise((resolve, reject) => {
        // if (this.filterForm.valid) {
          let document = {
            'pageno': this.paginationOptions.page ?? 1,
            'perpage': this.paginationOptions.limit ?? 20,
            'department_id': this.employeeFilter?.department_id ?? "",
            'designation_id': this.employeeFilter?.designation_id ?? "",
            'branch_id': this.employeeFilter?.branch_id ?? "",
            'wage_month': this.employeeFilter?.month?.index ?? "",
            'wage_year': this.employeeFilter?.year?.value ?? "",
            'searchkey': this.employeeFilter?.searchkey ?? "",
          }
  
          this.spinner.show();
          this.companyuserService.getApplyReimbursement(document)
            .subscribe((res: any) => {
              if (res.status == 'success') {
                this.sheetMonth = this.employeeFilter?.month;
                this.sheetYear = this.employeeFilter?.year;
  
                this.employees = res.employees.docs;
                this.paginationOptions = {
                  hasNextPage: res.employees.hasNextPage,
                  hasPrevPage: res.employees.hasPrevPage,
                  limit: res.employees.limit,
                  nextPage: res.employees.nextPage,
                  page: res.employees.page,
                  pagingCounter: res.employees.pagingCounter,
                  prevPage: res.employees.prevPage,
                  totalDocs: res.employees.totalDocs,
                  totalPages: res.employees.totalPages,
                };
              } else {
                this.employees = [];
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
              // resolve(true);
            }, (err) => {
              this.employees = [];
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
              // resolve(true);
            });
        // } else {
        //   resolve(false);
        // }
      // })
    }

    async addEmployeeReimbursement(event: any) {
      if(this.addEmployeeReimbursementForm.invalid){
        this.addEmployeeReimbursementForm.markAllAsTouched();
        return
      }
      try {
        let document = {
          'emp_id': this.addEmployeeReimbursementForm.value.emp_id,
          'head_id': this.addEmployeeReimbursementForm.value.head_id,
          'amount': this.addEmployeeReimbursementForm.value.amount,
          'wage_month': this.sheetMonth.index,
          'wage_year': this.sheetYear.value,
        }

        const res = await this.companyuserService.addEmployeeReimbursement(document).toPromise();

        if(res.status !== 'success')throw res;
        this.cancelEmployeeExpenseAdd()
        this.toastr.success(res.message);
        this.fetch();

      } catch (err:any) {
        if (err.status == 'val_err') {
          this.toastr.error(Global.showValidationMessage(err.val_msg));
        } else if (err.message){
          this.toastr.error(err.message);
        }else{
          this.toastr.error(Global.showServerErrorMessage(err));
        }
      }
    }

    submitEarningValue(payload: any, action: any) {
      return new Promise((resolve, reject) => {
        this.spinner.show();
        this.companyuserService.updateEmployeeReimbursement(payload)
          .subscribe((res: any) => {
            this.spinner.hide();
            if (res.status == 'success') {
              this.toastr.success(res.message);
              this.fetch();
              resolve(true);
            } else {
              this.toastr.error(res.message);
              resolve(false);
            }
  
          }, (err) => {
            this.spinner.hide();
            this.toastr.error(Global.showServerErrorMessage(err));
            resolve(false);
          });
      })
    }

    async updateEarningValue(event: any, employeeId: any, keyUpdate: any, reimbursementObject: any = null) {
      
      let document: any = {
        earning_data: JSON.stringify([
          {
            wage_month: this.sheetMonth.index,
            wage_year: this.sheetYear.value,
            amount: reimbursementObject?.amount,
            head_id: reimbursementObject?.head_id,
            reimbursement_id: reimbursementObject?._id,
            [keyUpdate]: $('#' + event).val()
          }
        ])
      }
  
      if (!$('#' + event).val()) {
        this.toastr.error("Please select atleast one option");
        return;
      }

      try {
      
        const res = await this.companyuserService.updateEmployeeReimbursement(document).toPromise();

        if(res.status !== 'success')throw res;
        this.cancelEmployeeExpenseAdd()
        this.toastr.success(res.message);
        this.fetch();

      } catch (err:any) {
        if (err.status == 'val_err') {
          this.toastr.error(Global.showValidationMessage(err.val_msg));
        } else if (err.message){
          this.toastr.error(err.message);
        }else{
          this.toastr.error(Global.showServerErrorMessage(err));
        }
      }
  
    }

    initEmployeeExpenseAdd(empDetails: any) {
      this.cancelEmployeeExpenseAdd();
      this.addEmployeeReimbursementForm.patchValue({
        'emp_id': empDetails?.emp_id
      })
  
      $('#addEmployeeExpenseModalButton')?.click();
    }

    cancelEmployeeExpenseAdd() {
      Global.resetForm(this.addEmployeeReimbursementForm);
      $('#addEmployeeExpenseModal')?.find('[data-dismiss="modal"]')?.click();
    }
  
    getDefinedEarningAmount(emp_details: any, earning_id: any) {
      return (emp_details?.employee_details?.annual_earnings ?? []).find((obj: any) => {
        return obj.earning_head_id == earning_id
      }) ?? null
    }
  
    async updateReimbursetment(emp_id: any, reimbursements:any[]) {
      if (!emp_id) {
        this.toastr.error("The employee details received is blank");
        return;
      }
  
      let flag: boolean = true;
  
      let doc: any = [];
      let cntr: number = 1;
    // console.log(reimbursements);
      
      reimbursements.forEach((reimbursetment: any, index:number) => {
        let head_id = $(`#${emp_id}-${index}-head`).val();
        let amount = $(`#${emp_id}-${index}-amount`).val();      
        
        if (!head_id || !amount) {
          this.toastr.error(`Row ${cntr}: Please check all fields properly`);
          flag = false;
        }
  
        doc.push({
          wage_month: this.sheetMonth.index,
          wage_year: this.sheetYear.value,
          head_id: head_id,
          amount: amount,
          reimbursement_id: reimbursetment?._id,
        })
  
        cntr++;
      });
  
      if (!flag) { return; }
  
      let document = {
        earning_data: JSON.stringify(doc)
      }
  
      await this.submitEarningValue(document, 'edit');
    }
  
  }
