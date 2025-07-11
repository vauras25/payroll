import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { Subject } from 'rxjs';
import * as Global from 'src/app/globals';
import PaginationOptions from 'src/app/models/PaginationOptions';
import { CompanyuserService } from 'src/app/services/companyuser.service';
import TableFilterOptions from 'src/app/models/TableFiilterOptions';
@Component({
  selector: 'app-extra-earning-report',
  templateUrl: './extra-earning-report.component.html',
  styleUrls: ['./extra-earning-report.component.css']
})
export class ExtraEarningReportComponent implements OnInit {
  Global = Global;
  tableOperationForm: FormGroup;
  sheetTemplateForm: FormGroup;

  employeePaginationOptions: PaginationOptions = Global.resetPaginationOption();
  employeeTableFilterOptions: TableFilterOptions =
  Global.resetTableFilterOptions();
  filterForm: FormGroup = new FormGroup({
    wage_month: new FormControl(),
    wage_year: new FormControl(),
  });
  addEmployeeExpenseForm: UntypedFormGroup;
  paginationOptions: PaginationOptions;
  employeeFilter: any = null;
  commomTableFilterData: any = {};
  departmentMaster: any[];
  designationMaster: any[];
  branchMaster: any[];
  hodMaster: any[];
  monthMaster: any[] = [];
  yearMaster: any[] = [];
  earningHeadsMaster: any[] = [];
  earningStatusMaster: any[] = [];
  employeeEarningHeadMaster: any[] = [];
  employees: any[] = [];
  sheetMonth: any = null;
  sheetYear: any = null;
  rowCheckedAll: Boolean = false;
  checkedRowIds: any[] = [];
  uncheckedRowIds: any[] = [];
  approveForm: UntypedFormGroup;
  isViewSalaryReport: boolean = true;
  sheetTemplateMaster: any[] = [];
  bankMaster: any[] = [];
  bankData:any[] = [];
  earningHeads:any[] = [];
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
    this.tableOperationForm = formBuilder.group({
      payout_process: [false],
      payout_bankid: [null],
      report_template: null,
    });
    this.monthMaster = [
      { index: 0, value: 1, description: "January", days: 31 },
      { index: 1, value: 2, description: "February", days: 28 },
      { index: 2, value: 3, description: "March", days: 31 },
      { index: 3, value: 4, description: "April", days: 30 },
      { index: 4, value: 5, description: "May", days: 31 },
      { index: 5, value: 6, description: "June", days: 30 },
      { index: 6, value: 7, description: "July", days: 31 },
      { index: 7, value: 8, description: "August", days: 31 },
      { index: 8, value: 9, description: "September", days: 30 },
      { index: 9, value: 10, description: "October", days: 31 },
      { index: 10, value: 11, description: "November", days: 30 },
      { index: 11, value: 12, description: "December", days: 31 },
    ];

    let currentYear = new Date().getFullYear();
    this.yearMaster = [];
    for (let index = 4; index >= 0; index--) {
      this.yearMaster.push({ value: (currentYear - index), description: (currentYear - index) });
    }

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

    this.addEmployeeExpenseForm = formBuilder.group({
      "emp_id": [null, Validators.compose([Validators.required])],
      "amount": [null, Validators.compose([Validators.required])],
      "head_id": [null, Validators.compose([Validators.required])],
    });

    this.earningStatusMaster = [
      { value: "earning", description: "Earning" },
      { value: "deduction", description: "Deduction" },
    ];
  
   this.sheetTemplateForm = formBuilder.group({});

    this.tableOperationForm
      .get('payout_process')
      ?.valueChanges.subscribe(async (payout_process) => {
        this.tableOperationForm.get('payout_bankid')?.reset();
        this.tableOperationForm.get('payout_bankid')?.markAsUntouched();

        this.tableOperationForm.get('report_template')?.reset();
        this.tableOperationForm.get('report_template')?.markAsUntouched();

        if (payout_process == true) {
          await this.fetchBanks();
          this.tableOperationForm
            .get('payout_bankid')
            ?.setValidators([Validators.required]);
          this.tableOperationForm.get('report_template')?.clearValidators();
          this.isViewSalaryReport=false;
          let currentDate=new Date();
          this.filterForm.patchValue({
            wage_month:this.monthMaster.find(x=>x.index==currentDate.getMonth()),wage_year:currentDate.getFullYear()
          });
        } else {
          this.tableOperationForm.get('payout_bankid')?.clearValidators();
          this.tableOperationForm
            .get('report_template')
            ?.setValidators([Validators.required]);
            this.isViewSalaryReport=true;
        }

        this.tableOperationForm.get('payout_bankid')?.updateValueAndValidity();
        this.tableOperationForm
          .get('report_template')
          ?.updateValueAndValidity();

        this.resetCheckedRows();
      });
  }

  async ngOnInit() {
    this.titleService.setTitle("Extra Earning Deduction - " + Global.AppName);

   
    await this.fetchMasters();
    await this.fetchEarningHeads();
    this.tableOperationForm.get('payout_process')?.setValue(false);

  }
  resetCheckedRows() {
    this.rowCheckedAll = false;
    this.checkedRowIds = [];
    this.uncheckedRowIds = [];

    $('.employee-table').find('#select-all').prop('checked', false);
    if(this.tableOperationForm.get('payout_process')?.value==true)
    {
      this.fetchBankData();
    }
    else{
      this.fetchEmployees();

    }
  }
  fetchBanks({ loading = <boolean>true } = {}) {
    return new Promise((resolve, reject) => {
      if (loading == true) this.spinner.show();
      this.companyuserService
        .fetchBankSheets({
          pageno: 1,
        })
        .subscribe(
          (res) => {
            if (loading == true) this.spinner.hide();
            if (res.status == 'success') {
              this.bankMaster = res?.templates?.docs;
              resolve(true);
            } else {
              this.toastr.error(res?.message);
              resolve(false);
            }
          },
          (err) => {
            if (loading == true) this.spinner.hide();
            this.toastr.error(Global.showServerErrorMessage(err));
            resolve(false);
          }
        );
    });
  }



  resetDataTableFilter() {
    Global.resetForm(this.filterForm)
  }



  fetchMasters() {
    return new Promise((resolve, reject) => {
      this.spinner.show();
      this.companyuserService.getEmployeeMaster().subscribe((res: any) => {
        if (res.status == 'success') {
          this.branchMaster = [];
          if (res.masters.branch?.company_branch && Array.isArray(res.masters.branch?.company_branch)) {
            res.masters.branch?.company_branch.forEach((element: any) => {
              this.branchMaster.push({ id: element._id, description: element.branch_name })
            });
          }

          if (res.masters.designation && Array.isArray(res.masters.designation)) {
            this.designationMaster = [];
            res.masters.designation.forEach((element: any) => {
              this.designationMaster.push({ id: element._id, description: element.designation_name })
            });
          }

          if (res.masters.department && Array.isArray(res.masters.department)) {
            this.departmentMaster = [];
            res.masters.department.forEach((element: any) => {
              this.departmentMaster.push({ id: element._id, description: element.department_name })
            });
          }
        } else {
          this.toastr.error(res.message);
        }

        this.spinner.hide();
        resolve(true);
      }, (err) => {
        this.spinner.hide();
        this.toastr.error(Global.showServerErrorMessage(err));
        resolve(true);
      });
    })
  }

  async updateEarningValue(event: any, employeeId: any, keyUpdate: any, earningObject: any = null) {
    let document: any = {
      earning_data: JSON.stringify([
        {
          // emp_id: employeeId,
          wage_month: this.sheetMonth.index,
          wage_year: this.sheetYear.value,
          amount: earningObject?.amount,
          head_id: earningObject?.head_id,
          earning_id: earningObject?._id,
          [keyUpdate]: $('#' + event).val()
        }
      ])
    }

    if (!$('#' + event).val()) {
      this.toastr.error("Please select atleast one option");
      return;
    }

    await this.submitEarningValue(document, 'edit');
  }

  submitEarningValue(payload: any, action: any) {
    return new Promise((resolve, reject) => {
      this.spinner.show();
      this.companyuserService.updateEmployeeExtraEarning(payload, action)
        .subscribe((res: any) => {
          this.spinner.hide();
          if (res.status == 'success') {
            this.toastr.success(res.message);
            this.fetchEmployees();
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

  initEmployeeExpenseAdd(empDetails: any) {
    this.cancelEmployeeExpenseAdd();
    this.addEmployeeExpenseForm.patchValue({
      'emp_id': empDetails?.emp_id
    })

    // const annualEarnings = empDetails?.employee_details?.annual_earnings ?? []
    // annualEarnings.forEach((element: any) => {
    //   this.employeeEarningHeadMaster.push({
    //     _id: element._id,
    //     head_name: element.earning_head,
    //   })

    //   // earning_amount: "1000"
    //   // earning_category: "Earning"
    //   // earning_head: "EHEAD - 1"
    //   // _id: "62a9940db73c8b012bffc3a2"
    // });

    $('#addEmployeeExpenseModalButton')?.click();
  }

  async addEmployeeExpense(event: any) {
    if (this.addEmployeeExpenseForm.valid) {
      let document = {
        'emp_id': this.addEmployeeExpenseForm.value.emp_id,
        'wage_month': this.sheetMonth.index,
        'wage_year': this.sheetYear.value,
        'amount': this.addEmployeeExpenseForm.value.amount,
        'head_id': this.addEmployeeExpenseForm.value.head_id?._id,
      }

      if (await this.submitEarningValue(document, 'new') == true) {
        this.cancelEmployeeExpenseAdd();
      }
    }
  }

  cancelEmployeeExpenseAdd() {
    this.employeeEarningHeadMaster = [];
    Global.resetForm(this.addEmployeeExpenseForm);
    $('#addEmployeeExpenseModal')?.find('[data-dismiss="modal"]')?.click();
  }

  fetchEarningHeads() {
    return new Promise((resolve, reject) => {
      this.spinner.show();
      this.companyuserService.getExtraEarningHeads({})
        .subscribe((res: any) => {
          if (res.status == 'success') {
            this.earningHeadsMaster = [];
            res?.temp_head.forEach((element: any) => {
              if (['earning', 'deduction'].includes(element.earning_status)) {
                this.earningHeadsMaster.push({
                  _id: element._id,
                  head_name: element.head_name,
                })
              }
            });

          } else {
            this.toastr.error(res.message);
          }

          this.spinner.hide();
          resolve(true);
        }, (err) => {
          this.spinner.hide();
          this.toastr.error(Global.showServerErrorMessage(err));
          resolve(true);
        });

    })
  }

  getDefinedEarningAmount(emp_details: any, earning_id: any) {
    return (emp_details?.employee_details?.annual_earnings ?? []).find((obj: any) => {
      return obj.earning_head_id == earning_id
    }) ?? null
  }

  async employeeExpenseUpdate(emp_details: any) {
    if (!emp_details) {
      this.toastr.error("The employee details received is blank");
      return;
    }

    let flag: boolean = true;

    let doc: any = [];
    let cntr: number = 1;
    emp_details.extra_earnings.forEach((earning: any) => {
      let head_id = $(`#emp-earningfield-head-${earning._id}`).find('select').val();
      let amount = $(`#emp-earningfield-amount-${earning._id}`).find('input[type="number"]').val();      

      if (!head_id || !amount) {
        this.toastr.error(`Row ${cntr}: Please check all fields properly`);
        flag = false;
      }

      doc.push({
        // emp_id: emp_details?_id,
        wage_month: this.sheetMonth.index,
        wage_year: this.sheetYear.value,
        head_id: head_id,
        amount: amount,
        earning_id: earning?._id,
      })

      cntr++;
    });

    if (!flag) { return; }

    let document = {
      earning_data: JSON.stringify(doc)
    }

    await this.submitEarningValue(document, 'edit');
  }

  /**
   * For Extra Deduction Head Master
   * -------------------------------
   * -------------------------------
   */

  extraDeductionHeadMasterEventSubject: Subject<void> = new Subject<void>();
  initEarningHeadEntry() {
    this.extraDeductionHeadMasterEventSubject.next();
  }
  getReportPayload() {
    let payload: any = {
      row_checked_all: this.rowCheckedAll,
      checked_row_ids: JSON.stringify(this.checkedRowIds),
      unchecked_row_ids: JSON.stringify(this.uncheckedRowIds),
      client_id: this.employeeFilter?.client_id ?? '',
      hod_id: this.employeeFilter?.hod_id ?? '',
      searchkey: this.employeeFilter?.searchkey ?? '',
      department_id: this.employeeFilter?.department_id ?? '',
      designation_id: this.employeeFilter?.designation_id ?? '',
      branch_id: this.employeeFilter?.branch_id ?? '',
      pageno: this.paginationOptions.page,
      perpage: this.paginationOptions.limit,
      wage_month_from: this.employeeFilter?.wage_month_from ?? '',
      wage_year_from: this.employeeFilter?.wage_year_from ?? '',
      wage_month_to: this.employeeFilter?.wage_month_to ?? '',
      wage_year_to: this.employeeFilter?.wage_year_to ?? '',
      
    };
    return payload;
  }
  private isRowChecked(rowId: any) {
    if (!this.rowCheckedAll)
      return this.checkedRowIds.indexOf(rowId) >= 0 ? true : false;
      else {console.log(this.uncheckedRowIds.indexOf(rowId));return this.uncheckedRowIds.indexOf(rowId) >= 0 ? false : true};
  }

  rowSelecion(e: any): void {
    document.getElementsByName(e.target?.name)?.forEach((checkbox: any) => {
      checkbox.checked = e.target.checked;
    });
  }

  rowCheckBoxChecked(event: any, row: any) {
    let rowId: any = row._id;
    let checkbox: any = document.querySelectorAll(
      '[data-checkbox-id="' + rowId + '"]'
    );

    if (checkbox.length > 0) {
      if (checkbox[0].checked) {
        this.uncheckedRowIds.splice(this.uncheckedRowIds.indexOf(rowId), 1);
        if (!this.rowCheckedAll) {
          if (!this.checkedRowIds.includes(rowId)) {
            this.checkedRowIds.push(rowId);
          }
        }
      } else {
        this.checkedRowIds.splice(this.checkedRowIds.indexOf(rowId), 1);
        if (this.rowCheckedAll) {
          if (!this.uncheckedRowIds.includes(rowId)) {
            this.uncheckedRowIds.push(rowId);
          }
        }
      }
    }
  }


  fetchEmployees({
    page = <any>null,
    loading = <boolean>true,
    filter = <any>null,
  } = {}) {
   
    return new Promise(async (resolve, reject) => {
      if (page != null) 
      {
        this.paginationOptions.page = page;

      }
      if (filter != null) 
      {
      this.employeeFilter = filter;
      }

      if (!this.employeeFilter) {
        resolve(false);
        return;
      }
      this.commomTableFilterData = filter;
   
      let payload = await this.getReportPayload();
      // payload.row_checked_all = true;
      payload.checked_row_ids = "[]";
      payload.unchecked_row_ids = "[]";
      payload.type="extra_earning";
      payload.approval_status="approved";
      payload.monthly_reports_generate="yes";

      if (loading == true) this.spinner.show();
      this.companyuserService.getReimbursementReport(payload).subscribe((res: any) => {
        if (res.status == 'success') {
          var docs: any[] = res?.employees?.docs ?? [];
        
          let heads:any[]=res.heads;
          this.earningHeads=heads;
           docs.forEach((doc: any) => {
              let net_amnt:any=0;
              doc.checked = this.isRowChecked(doc._id);
              doc.employee_monthly_reports.forEach((element:any) => {
              element.wage_month=this.monthMaster.find(x=>x.index==element.wage_month);
               heads.forEach((head:any) => {
               let find_index:any=doc?.total_data?.heads.findIndex((x:any)=>x.head==head._id);  
               
               if(find_index!=-1)
               {
                let net_elem:any=doc?.total_data?.heads[0];
                doc?.total_data?.heads.splice(find_index,1);
                doc?.total_data?.heads.push(net_elem);
                net_amnt+=net_elem?.amount;

               } 
               else{
                doc.total_data.heads.push({amount:0,head:head._id});
               }
 
              });  
              });
              doc.net_amnt=net_amnt;

            });
         
          this.employees = docs;


         
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
        resolve(true);
      }, 
      (err) => {
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
        resolve(true);
      });
    });
  }

  allRowsCheckboxChecked(event: any) {
    if (this.rowCheckedAll) {
      this.uncheckedRowIds.length = 0;
      this.rowCheckedAll = false;
    } else {
      this.checkedRowIds.length = 0;
      this.rowCheckedAll = true;
    }
    if(this.tableOperationForm.get('payout_process')?.value==true)
    {
      this.fetchBankData();
    }
    else{
      this.fetchEmployees();

    }
  }

  anyRowsChecked(): boolean {
    return (
      this.rowCheckedAll == true ||
      this.checkedRowIds.length > 0 ||
      this.uncheckedRowIds.length > 0
    );
  }
  bulkApprove(ev:any)
  {
    return new Promise((resolve, reject) => {
      this.spinner.show();
      let payload={row_checked_all:this.rowCheckedAll.toString(),checked_row_ids:this.checkedRowIds,
        unchecked_row_ids:this.uncheckedRowIds,status:this.approveForm.value.status,remark:this.approveForm.value.note,type:'reimbursement'};
      this.companyuserService.approvextraEarning(payload)
        .subscribe((res: any) => {
          this.spinner.hide();
          if (res.status == 'success') {
            this.toastr.success(res.message);
            this.fetchEmployees();
            resolve(true);
            $('#settingsTemplateModal')?.find('[data-dismiss="modal"]')?.click();

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
  clearFormData()
  {
    this.approveForm.patchValue({status:'',note:''});
  }
  bulkAction()
  {
    $("#TemplateModalOpen").click();
  }
  cancelExcelExport() {
    //this.isViewSalaryReport = false;
  }

 async excelExport()
  {
    // return new Promise(async (resolve, reject) => {

   
      let payload = await this.getReportPayload();
      // payload.row_checked_all = true;
      payload.checked_row_ids = this.checkedRowIds;
      payload.unchecked_row_ids = this.uncheckedRowIds;
      payload.row_checked_all=this.rowCheckedAll.toString();
      payload.type="extra_earning";
      payload.approval_status="approved";
      payload.monthly_reports_generate="yes";
      payload.generate="excel";

      this.spinner.show();

      await this.companyuserService.downloadFile('extra-earning-report', 'extra-earning-report', payload)
      // this.companyuserService.getReimbursementReport(payload).subscribe((res: any) => {
      //   if (res.status == 'success') {
      //   location.href=  res.url;
      //   } else {
          
      //     this.toastr.error(res.message);
      //   }

      //   this.spinner.hide();
      //   resolve(true);
      // }, 
      // (err) => {
        

      //   this.spinner.hide();
      //   this.toastr.error(Global.showServerErrorMessage(err));
      //   resolve(true);
      // });
    // });
  }

  getSheetGenerationStatus(emp_details: any): { status: string, label: string, checkbox: boolean } {
    if (
        emp_details?.employee_monthly_reports?.extra_earning_report &&
        emp_details?.employee_monthly_reports?.extra_earning_report?.bank_ins_referance_id &&
        emp_details?.employee_monthly_reports?.extra_earning_report?.bank_instruction_status === 'confirm'
    ) {
        return { 'status': "confirm", 'label':  emp_details?.employee_monthly_reports?.extra_earning_report?.bank_ins_referance_id, 'checkbox': false };
    } 
    
    else if (
        emp_details?.employee_monthly_reports &&
        !emp_details?.employee_monthly_reports?.extra_earning_report?.bank_ins_referance_id
    ) 
    {
        return { 'status': "rerun", 'label': "Pending", 'checkbox': true };
    } else {
        return { 'status': "rerun", 'label': "Generated", 'checkbox': false };
    }
}


generateBankInstruction(instruction_type: any='') {
  if (
    this.anyRowsChecked() &&
    this.tableOperationForm.get('payout_bankid')?.valid
  ) {
    this.spinner.show();
    let payload:any={
    wage_month: this.filterForm?.value?.wage_month?.index ?? '',
    wage_year: this.filterForm?.value?.wage_year ?? '',
    bank_temp_id:
    this.tableOperationForm.get('payout_bankid')?.value?._id,
    payment_for:  'extra_earning',
    hod_id: this.employeeFilter?.hod_id ?? null,
    department_id: this.employeeFilter?.department_id ?? null,
    designation_id: this.employeeFilter?.designation_id ?? null,
    branch_id: this.employeeFilter?.branch_id ?? null,
    bank_account:this.employeeFilter?.bank_id ?? null,
    row_checked_all: this.rowCheckedAll,
    instruction_type:instruction_type,
    checked_row_ids: JSON.stringify(this.checkedRowIds),
    unchecked_row_ids: JSON.stringify(this.uncheckedRowIds),
  }
    this.companyuserService
      .generateBankInstruction(payload)
      .subscribe(
        (res) => {
          this.spinner.hide();
          if (res.status == 'success') {
            this.toastr.success(res.message);
            this.resetCheckedRows();
          } else if (res.status == 'val_err') {
            this.toastr.error(res.message);
          } else {
            this.toastr.error(res.message);
          }
        },
        (err) => {
          this.toastr.error(Global.showServerErrorMessage(err));
          this.spinner.hide();
        }
      );
  }
}

fetchBankData({
  page = <any>null,
  loading = <boolean>true,
  filter = <any>null,
} = {}) {
 
  return new Promise(async (resolve, reject) => {
    if (page != null) 
    {
      this.paginationOptions.page = page;

    }
    if (filter != null) 
    {
    this.employeeFilter = filter;
    }

    if (!this.employeeFilter) {
      resolve(false);
      return;
    }
    this.commomTableFilterData = filter;
 
    let payload = await this.getReportPayload();
    payload.checked_row_ids = "[]";
    payload.unchecked_row_ids = "[]";
    payload.wage_month=(this.filterForm.value?.wage_month?.index).toString();
    payload.wage_year=(this.filterForm.value?.wage_year).toString();
    delete payload.wage_month_from;
    delete payload.wage_month_to;
    delete payload.wage_year_from;
    delete payload.wage_year_to;

    if (loading == true) this.spinner.show();
    this.companyuserService.getextraEarning(payload).subscribe((res: any) => {
      if (res.status == 'success') {
        var docs: any[] = res?.employees?.docs ?? [];
         docs.forEach((doc: any) => {
            doc.checked = this.isRowChecked(doc._id);
          });
        this.sheetMonth = payload?.wage_month;
        this.sheetYear = payload?.wage_year;
        this.bankData = docs;
        this.bankData.forEach((element:any,index:any) => {
          this.bankData[index].month=Global.monthMaster.find(x=>x.index==element.wage_month)  
        });
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
        this.bankData = [];
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
      this.bankData = [];
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
