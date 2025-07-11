import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
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
  selector: 'app-extra-earning-run',
  templateUrl: './extra-earning-run.component.html',
  styleUrls: ['./extra-earning-run.component.css']
})
export class ExtraEarningRunComponent implements OnInit {
  Global = Global;
  employeePaginationOptions: PaginationOptions = Global.resetPaginationOption();
  employeeTableFilterOptions: TableFilterOptions =
  Global.resetTableFilterOptions();
  filterForm: UntypedFormGroup;
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
    this.approveForm = this.formBuilder.group({
      
      status:["", Validators.compose([Validators.required])],
      note:[null, Validators.compose([])],

      


   });
  }

  async ngOnInit() {
    this.titleService.setTitle("Extra Earning Deduction - " + Global.AppName);

   
    await this.fetchMasters();
    await this.fetchEarningHeads();
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
      wage_month: this.employeeFilter?.month?.index ?? '',
      wage_year: this.employeeFilter?.year?.value ?? '',
      approval_status:this.employeeFilter?.approval_status?.value ?? '',
    };
    return payload;
  }
  private isRowChecked(rowId: any) {
    if (!this.rowCheckedAll)
      return this.checkedRowIds.indexOf(rowId) >= 0 ? true : false;
    else return this.uncheckedRowIds.indexOf(rowId) >= 0 ? false : true;
  }

  rowSelecion(e: any): void {
    document.getElementsByName(e.target?.name)?.forEach((checkbox: any) => {
      checkbox.checked = e.target.checked;
    });
  }

  rowCheckBoxChecked(event: any, row: any) {
    let rowId: any = row?._id;
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
      payload.type="";
      payload.approval_status="approved";
      payload.wage_month=payload.wage_month.toString();
      payload.wage_year=payload.wage_year.toString();


      if (loading == true) this.spinner.show();
      this.companyuserService.getextraEarning(payload).subscribe((res: any) => {
        if (res.status == 'success') {
          var docs: any[] = res?.employees?.docs ?? [];
           docs.forEach((doc: any) => {
              doc.checked = this.isRowChecked(doc.employees?._id);
            });
          this.sheetMonth = payload?.wage_month;
          this.sheetYear = payload?.wage_year;
          this.employees = docs;
          this.employees.forEach((element:any,index:any) => {
            this.employees[index].month=Global.monthMaster.find(x=>x.index==element.wage_month)  
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

    this.fetchEmployees();
  }

  anyRowsChecked(): boolean {
    return (
      this.rowCheckedAll == true ||
      this.checkedRowIds.length > 0 ||
      this.uncheckedRowIds.length > 0
    );
  }
  runextraEarning()
  {
    let payload =  this.getReportPayload();
    payload={
      "row_checked_all": this.rowCheckedAll.toString(),
      "checked_row_ids": JSON.stringify(this.checkedRowIds),
      "unchecked_row_ids": JSON.stringify(this.uncheckedRowIds),
      "attendance_month": payload?.wage_month.toString(),
      "attendance_year": payload?.wage_year.toString(),
  };
    return new Promise((resolve, reject) => {
      this.spinner.show();
      
      this.companyuserService.runextraEarning(payload)
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
  clearFormData()
  {
    this.approveForm.patchValue({status:'',note:''});
  }
  bulkAction()
  {
    $("#TemplateModalOpen").click();
  }
  getSheetGenerationStatus(emp_details: any): { status: string, label: string, checkbox: boolean } {
    if (
        emp_details?.employee_monthly_reports &&
        emp_details?.employee_monthly_reports?.bank_ins_referance_id &&
        emp_details?.employee_monthly_reports?.bank_instruction_status === 'confirm'
    ) {
        return { 'status': "confirm", 'label': "Confirmed", 'checkbox': false };
    } else if (
        emp_details?.employee_monthly_reports &&
        emp_details?.employee_monthly_reports?.bank_ins_referance_id &&
        !emp_details?.employee_monthly_reports?.pf_challan_referance_id
    ) {
        return { 'status': "filegenerated", 'label': emp_details?.employee_monthly_reports?.bank_ins_referance_id, 'checkbox': false };
    } else if (
        emp_details?.employee_monthly_reports &&
        !emp_details?.employee_monthly_reports?.bank_ins_referance_id
    ) {
        return { 'status': "rerun", 'label': "Re-Run", 'checkbox': true };
    } else {
        return { 'status': "rerun", 'label': "Let's Run", 'checkbox': true };
    }
}

}
