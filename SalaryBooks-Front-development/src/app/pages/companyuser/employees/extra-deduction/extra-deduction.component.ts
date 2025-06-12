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

@Component({
  selector: 'companyuser-app-extra-deduction',
  templateUrl: './extra-deduction.component.html',
  styleUrls: ['./extra-deduction.component.css']
})

export class CMPExtraDeductionComponent implements OnInit {
  Global = Global;
  filterForm: UntypedFormGroup;
  addEmployeeExpenseForm: UntypedFormGroup;
  paginationOptions: PaginationOptions;

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

  constructor(
    public formBuilder: UntypedFormBuilder,
    private titleService: Title,
    private companyuserService: CompanyuserService,
    private toastr: ToastrService,
    private router: Router,
    private spinner: NgxSpinnerService
  ) {
    this.filterForm = formBuilder.group({
      "month": [null, Validators.compose([Validators.required])],
      "year": [null, Validators.compose([Validators.required])],
      "searchkey":[null],
      "emp_first_name": [null],
      "emp_last_name": [null],
      "email_id": [null],
      "pan_no": [null],

      "department": [null],
      "designation": [null],
      "branch": [null],
      "hod": [null],

      "department_id": [null],
      "designation_id": [null],
      "branch_id": [null],
      "hod_id": [null],
    });

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
  }

  async ngOnInit() {
    this.titleService.setTitle("Extra Earning Deduction - " + Global.AppName);

    this.filterForm.patchValue({
      'month': this.monthMaster.find((obj: any) => {
        return obj.index == 0
        return obj.index == new Date().getMonth()
      }) ?? null,

      'year': this.yearMaster.find((obj: any) => {
        return obj.value == 2022
        return obj.value == new Date().getFullYear()
      }) ?? null,
    })

    await this.fetchMasters();
    await this.fetchEarningHeads();
    await this.fetch();
  }

  filterDataTable() {
    if (this.filterForm.valid) {
      if (this.filterForm.value.hod != null) {
        if (Array.isArray(this.filterForm.value.hod)) {
          this.filterForm.value.hod_id = [];
          this.filterForm.value.hod.forEach((element: any) => {
            this.filterForm.value.hod_id.push(element.id)
          });

          if (this.filterForm.value.hod_id.length > 0) {
            this.filterForm.value.hod_id = JSON.stringify(this.filterForm.value.hod_id)
          } else {
            this.filterForm.value.hod_id = null;
          }
        } else {
          this.filterForm.value.hod_id = this.filterForm.value.hod.id;
        }
      }

      if (this.filterForm.value.department != null) {
        if (Array.isArray(this.filterForm.value.department)) {
          this.filterForm.value.department_id = [];
          this.filterForm.value.department.forEach((element: any) => {
            this.filterForm.value.department_id.push(element.id)
          });

          if (this.filterForm.value.department_id.length > 0) {
            this.filterForm.value.department_id = JSON.stringify(this.filterForm.value.department_id)
          } else {
            this.filterForm.value.department_id = null;
          }
        } else {
          this.filterForm.value.department_id = this.filterForm.value.department.id;
        }
      }

      if (this.filterForm.value.designation != null) {
        if (Array.isArray(this.filterForm.value.designation)) {
          this.filterForm.value.designation_id = [];
          this.filterForm.value.designation.forEach((element: any) => {
            this.filterForm.value.designation_id.push(element.id)
          });

          if (this.filterForm.value.designation_id.length > 0) {
            this.filterForm.value.designation_id = JSON.stringify(this.filterForm.value.designation_id)
          } else {
            this.filterForm.value.designation_id = null;
          }
        } else {
          this.filterForm.value.designation_id = this.filterForm.value.designation.id;
        }
      }

      if (this.filterForm.value.branch != null) {
        if (Array.isArray(this.filterForm.value.branch)) {
          this.filterForm.value.branch_id = [];
          this.filterForm.value.branch.forEach((element: any) => {
            this.filterForm.value.branch_id.push(element.id)
          });

          if (this.filterForm.value.branch_id.length > 0) {
            this.filterForm.value.branch_id = JSON.stringify(this.filterForm.value.branch_id)
          } else {
            this.filterForm.value.branch_id = this.filterForm.value.designation.id;
          }
        } else {
          this.filterForm.value.branch_id = this.filterForm.value.branch.id;
        }
      }

      this.fetch();
    }
  }

  resetDataTableFilter() {
    Global.resetForm(this.filterForm)
  }

  fetch(page: any = null,searchkey:any='') {
    return new Promise((resolve, reject) => {
      if (this.filterForm.valid) {
        if (page != null) {
          this.paginationOptions.page = page;
        }

        let document = {
          'pageno': this.paginationOptions.page,
          'perpage': this.paginationOptions.limit,
          // 'searchkey': searchkey || '',
          'department_id': this.filterForm.value.department_id ?? "",
          'designation_id': this.filterForm.value.designation_id ?? "",
          'branch_id': this.filterForm.value.branch_id ?? "",
          'wage_month': this.filterForm.value.month?.index ?? "",
          'wage_year': this.filterForm.value.year?.value ?? "",
          'searchkey': this.filterForm.value.searchkey ?? "",

        }

        this.spinner.show();
        this.companyuserService.getEmployeeExtraEarnings(document)
          .subscribe((res: any) => {
            if (res.status == 'success') {
              this.sheetMonth = this.filterForm.value.month;
              this.sheetYear = this.filterForm.value.year;

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
            resolve(true);
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
            resolve(true);
          });
      } else {
        resolve(false);
      }
    })
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
              // if (['earning', 'deduction'].includes(element.earning_status)) {
              //   this.earningHeadsMaster.push({
              //     _id: element._id,
              //     head_name: element.head_name,
              //   })
              // }
              this.earningHeadsMaster.push({
                _id: element._id,
                head_name: element.head_name,
              })
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
}
