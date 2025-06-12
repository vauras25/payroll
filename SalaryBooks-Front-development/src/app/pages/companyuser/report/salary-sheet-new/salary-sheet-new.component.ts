import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import * as Global from 'src/app/globals';
import PaginationOptions from 'src/app/models/PaginationOptions';
import TableFilterOptions from 'src/app/models/TableFiilterOptions';
import TableFiilterOptions from 'src/app/models/TableFiilterOptions';
import { CompanyuserService } from 'src/app/services/companyuser.service';
import swal from 'sweetalert2';

@Component({
    selector: 'app-salary-sheet-new',
    templateUrl: './salary-sheet-new.component.html',
    styleUrls: ['./salary-sheet-new.component.css']
})
export class CMPSalarySheetReportNewComponent implements OnInit {
    Global = Global;
    employees: any[] = [];
    employeeListFilter: any = null;
    employeePaginationOptions: PaginationOptions = Global.resetPaginationOption();
    employeeTableFilterOptions: TableFiilterOptions = Global.resetTableFilterOptions();

    empSalaryHoldForm: FormGroup;
    holdedEmpSalaries: any[] = [];
    holdTypeMaster: any[] = [];
    holdedSalaryPaginationOptions: PaginationOptions = Global.resetPaginationOption();

    constructor(
        private titleService: Title,
        private spinner: NgxSpinnerService,
        private companyuserService: CompanyuserService,
        private toastr: ToastrService,
        private router:Router,
        private formBuilder: FormBuilder
    ) {
        if (
            !Global.checkCompanyModulePermission({
              company_module: 'salary',
              company_sub_module: 'run_payroll',
              company_sub_operation:['view'],
              company_strict:true
            })
          ) {
            setTimeout(() => {
              this.router.navigate(['company/errors/unauthorized-access'], {
                skipLocationChange: true,
              });
            }, 500);
            return;
          }
        this.empSalaryHoldForm = formBuilder.group({
            'emp_details': [null],
            'hold_type': [null, Validators.compose([Validators.required])],
        });

        this.holdTypeMaster = [
            { 'value': "salaryWithCom", 'description': "Salary with Compliance" },
            { 'value': "salary", 'description': "Salary" },
        ];
    }

    ngOnInit() {
        this.titleService.setTitle("Run Payroll - " + Global.AppName);
        this.spinner.show();
    }

    fetchEmployees({
        page = <any>null,
        loading = <boolean>true,
        filter = <any>null,
        options = <TableFilterOptions>this.employeeTableFilterOptions,
    } = {}) {
        return new Promise((resolve, reject) => {
            this.employeeTableFilterOptions = options;

            if (page != null) this.employeePaginationOptions.page = page;
            if (filter != null) this.employeeListFilter = filter

            if (!this.employeeListFilter) {
                resolve(false);
                return;
            }
          
            let payload: any = {
                'pageno': this.employeePaginationOptions.page,
                'perpage': this.employeeTableFilterOptions.length,
                'searchkey': this.employeeListFilter.searchkey ?? "",
                'attendance_month': this.employeeListFilter?.month?.index ?? "",
                'attendance_year': this.employeeListFilter?.year?.value ?? "",
                'hod_id': this.employeeListFilter?.hod_id ?? null,
                'department_id': this.employeeListFilter?.department_id ?? null,
                'designation_id': this.employeeListFilter?.designation_id ?? null,
                'branch_id': this.employeeListFilter?.branch_id ?? null,
                'bank_id': this.employeeListFilter?.bank_id ?? null,

            };

            if (loading == true) this.spinner.show();
            this.companyuserService.getEarningSheetEmployeeList(payload).subscribe(res => {
                if (res.status == 'success') {
                    var docs: any[] = res?.employees?.docs ?? [];

                    docs.forEach((doc: any) => {
                        doc.checked = this.isRowChecked(doc._id);
                    });

                    this.employees = docs;
                    this.employeePaginationOptions = {
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

                    resolve(true);
                } else {
                    if (res.status == 'val_err') this.toastr.error(Global.showValidationMessage(res.val_msg));
                    else this.toastr.error(res.message);

                    this.employees = [];
                    this.employeePaginationOptions = Global.resetPaginationOption();

                    this.rowCheckedAll = false;
                    this.checkedRowIds = [];
                    this.uncheckedRowIds = [];

                    resolve(false);
                }

                if (loading == true) this.spinner.hide();
                Global.loadCustomScripts('customJsScript');
            }, (err) => {
                this.toastr.error(Global.showValidationMessage(Global.showServerErrorMessage(err)));
                this.employees = [];
                this.employeePaginationOptions = Global.resetPaginationOption();
                this.rowCheckedAll = false;
                this.checkedRowIds = [];
                this.uncheckedRowIds = [];
                if (loading == true) this.spinner.hide();
                Global.loadCustomScripts('customJsScript');
                resolve(false);
            });
        })
    }

    async generateReport() {
        return new Promise((resolve, reject) => {
            if (this.rowCheckedAll == false && (this.checkedRowIds.length == 0 && this.uncheckedRowIds.length == 0)) {
                // this.toastr.error("Please select atleast one employee to continue");
                return;
            }

            this.spinner.show();
            this.companyuserService.runSalarySheet({
                'row_checked_all': this.rowCheckedAll,
                'checked_row_ids': JSON.stringify(this.checkedRowIds),
                'unchecked_row_ids': JSON.stringify(this.uncheckedRowIds),
                'attendance_month': this.employeeListFilter?.month?.index ?? "",
                'attendance_year': this.employeeListFilter?.year?.value ?? "",
            }).subscribe(res => {
                this.spinner.hide();
                if (res.status == 'success') {
                    this.toastr.success(res?.message)
                    resolve(true);
                } else if (res.status == 'val_err') {
                    this.toastr.error(Global.showValidationMessage(res.val_msg));
                    resolve(false);
                } else {
                    this.toastr.error(res.message);
                    resolve(false);
                }
            }, (err) => {
                this.toastr.error(Global.showServerErrorMessage(err));
                this.spinner.hide();
                resolve(false);
            });
        })
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

    /**
     * Multiple Row Checkbox Functions
     * -------------------------------
     */
    rowCheckedAll: Boolean = false;
    checkedRowIds: any[] = [];
    uncheckedRowIds: any[] = [];

    private isRowChecked(rowId: any) {
        if (!this.rowCheckedAll) return this.checkedRowIds.indexOf(rowId) >= 0 ? true : false;
        else return this.uncheckedRowIds.indexOf(rowId) >= 0 ? false : true;
    }

    rowCheckBoxChecked(event: any, row: any) {
        let rowId: any = row._id;
        let checkbox: any = document.querySelectorAll('[data-checkbox-id="' + rowId + '"]');

        if (checkbox.length > 0) {
            if (checkbox[0].checked) {
                this.uncheckedRowIds.splice(this.uncheckedRowIds.indexOf(rowId), 1);
                if (!this.rowCheckedAll) {
                    if (!this.checkedRowIds.includes(rowId)) {
                        this.checkedRowIds.push(rowId);
                    }
                }
            }
            else {
                this.checkedRowIds.splice(this.checkedRowIds.indexOf(rowId), 1);
                if (this.rowCheckedAll) {
                    if (!this.uncheckedRowIds.includes(rowId)) {
                        this.uncheckedRowIds.push(rowId);
                    }
                }
            }
        }
    }

    allRowsCheckboxChecked(event: any) {
        if (this.rowCheckedAll) {
            this.uncheckedRowIds.length = 0;
            this.rowCheckedAll = false;
        } else {
            this.checkedRowIds.length = 0;
            this.rowCheckedAll = true;
        }

        this.fetchEmployees()
    }

    /**
     * =====================
     * HOLD SALARY FUNCTIONS
     * =====================
     */

    initHoldSalary(emp: any) {
        this.cancelHoldSalaryEntry()
        this.empSalaryHoldForm.get('emp_details')?.patchValue(emp)

        if (emp?.hold_salary_emps) {
            this.empSalaryHoldForm.get('hold_type')?.patchValue(
                this.holdTypeMaster.find((obj: any) => {
                    return obj.value == emp?.hold_salary_emps?.hold_type
                })
            )
        }

        $('#salaryHoldModalOpen')?.click();
    }

    cancelHoldSalaryEntry() {
        Global.resetForm(this.empSalaryHoldForm);
        $('#salaryHoldModal')?.find('[data-dismiss="modal"]')?.click();
    }

    submitEmpSalaryHold(event: any) {
        this.empSalaryHoldForm.markAllAsTouched();
        setTimeout(() => {
            Global.scrollToQuery('p.text-danger')
        }, 300);

        if (this.empSalaryHoldForm.valid) {
            let payload = {
                'hold_type': this.empSalaryHoldForm.value.hold_type?.value ?? "",
                'emp_id': this.empSalaryHoldForm.value?.emp_details?.emp_id ?? "",
                'emp_db_id': this.empSalaryHoldForm.value?.emp_details?._id ?? "",
                'wage_month': this.employeeListFilter?.month?.index ?? "",
                'wage_year': this.employeeListFilter?.year?.value ?? "",
            }

            event.target.classList.add('btn-loading');
            this.companyuserService.employeeSalaryHold(payload).subscribe(res => {
                if (res.status == 'success') {
                    this.toastr.success(res.message);
                    this.cancelHoldSalaryEntry();
                    this.fetchEmployees();
                } else if (res.status == 'val_err') {
                    this.toastr.error(Global.showValidationMessage(res.val_msg));
                } else {
                    this.toastr.error(res.message);
                }
                event.target.classList.remove('btn-loading');
            }, (err) => {
                event.target.classList.remove('btn-loading');
                this.toastr.error(Global.showServerErrorMessage(err));
            });
        }
    }

    revokeHoldSalary(item: any) {
        let hold_sal_id: any[] = []
        if (item == 'multiple') {
            hold_sal_id = this.salaryHold_checkedRowIds;
        } else {
            hold_sal_id.push(item._id);
        }

        if (hold_sal_id.length > 0) {
            swal.fire({
                title: 'Are you sure want to revoke the salary hold?',
                // text: 'You will not be able to recover this data!',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Yes, proceed!',
                cancelButtonText: 'No, cancel'
            }).then((result) => {
                if (result.value) {
                    this.spinner.show();
                    this.companyuserService.removeEmployeeSalaryHold({
                        'hold_sal_emp_list': JSON.stringify(hold_sal_id),
                    }).subscribe(res => {
                        if (res.status == 'success') {
                            this.toastr.success(res.message);
                            this.cancelHoldSalaryEntry();
                            this.getHoldSalaries();
                            this.fetchEmployees();
                        } else {
                            this.toastr.error(res.message);
                            this.spinner.hide();
                        }
                    }, (err) => {
                        this.toastr.error(Global.showServerErrorMessage(err));
                        this.spinner.hide();
                    });
                }
            })
        }
    }

    getHoldSalaries({
        openmodal = <boolean>false,
        page = <any>null,
    } = {}) {
        if (page != null) {
            this.holdedSalaryPaginationOptions.page = page;
        }

        this.salaryHold_rowCheckedAll = false
        this.salaryHold_checkedRowIds = []

        if (this.employeeListFilter) {
            let payload = {
                'wage_month': this.employeeListFilter?.month?.index ?? "",
                'wage_year': this.employeeListFilter?.year?.value ?? "",
                'pageno': this.holdedSalaryPaginationOptions.page,
                'bank_id': this.employeeListFilter?.bank_id ?? ""

            }

            this.spinner.show();
            this.companyuserService.fetchEmployeeSalaryHold(payload).subscribe(res => {
                if (res.status == 'success') {
                    this.holdedEmpSalaries = res?.employees?.docs ?? [];
                    this.holdedSalaryPaginationOptions = {
                        hasNextPage: res.employees.hasNextPage,
                        hasPrevPage: res.employees.hasPrevPage,
                        limit: res.employees.limit,
                        nextPage: res.employees.nextPage,
                        page: res.employees.page,
                        pagingCounter: res.employees.pagingCounter,
                        prevPage: res.employees.prevPage,
                        totalDocs: res.employees.totalDocs,
                        totalPages: res.employees.totalPages,
                    }

                    if (openmodal) $('#salaryHoldModalEmpOpen')?.click();

                    setTimeout(() => {
                        Global.loadCustomScripts('customJsScript');
                    });
                } else {
                    this.toastr.error(res.message);
                    this.holdedEmpSalaries = [];
                    this.holdedSalaryPaginationOptions = Global.resetPaginationOption();
                }

                this.spinner.hide();
            }, (err) => {
                this.spinner.hide();
                this.toastr.error(Global.showServerErrorMessage(err));
                this.holdedEmpSalaries = [];
                this.holdedSalaryPaginationOptions = Global.resetPaginationOption();
            });
        }
    }

    salaryHold_rowCheckedAll: Boolean = false;
    salaryHold_checkedRowIds: any[] = [];
    salaryHold_uncheckedRowIds: any[] = [];

    salaryHold_allRowsCheckboxChecked(event: any) {
        if (this.salaryHold_rowCheckedAll) {
            this.salaryHold_rowCheckedAll = false;
            this.salaryHold_checkedRowIds = [];
        } else {
            this.salaryHold_rowCheckedAll = true;
            this.salaryHold_checkedRowIds = [];
            this.holdedEmpSalaries.forEach(element => {
                this.salaryHold_checkedRowIds.push(element._id);
            });
        }

        this.holdedEmpSalaries.forEach(element => {
            element.checked = this.salaryHold_isRowChecked(element._id);
        });
    }

    private salaryHold_isRowChecked(rowId: any) {
        if (this.salaryHold_checkedRowIds.includes(rowId)) {
            return true;
        } else {
            return false;
        }
    }

    salaryHold_rowCheckBoxChecked(event: any, row: any) {
        let rowId: any = row._id;
        let checkbox: any = document.querySelectorAll('[data-checkbox-id="' + rowId + '"]');

        if (checkbox.length > 0) {
            if (checkbox[0].checked) {
                if (!this.salaryHold_checkedRowIds.includes(rowId)) {
                    this.salaryHold_checkedRowIds.push(rowId);
                }
            } else {
                if (this.salaryHold_checkedRowIds.includes(rowId)) {
                    this.salaryHold_checkedRowIds.splice(this.salaryHold_checkedRowIds.indexOf(rowId), 1);
                }
            }
        }
    }

    /**
     * ============================
     * Supplementary Salary Options
     * ============================
     */
    supplementaryForm: FormGroup = this.formBuilder.group({
        'supplement_adjust_day': [null],
        'emp_details': [null, Validators.compose([Validators.required])],
    });

    initSupplementarySalary(emp: any) {
        this.cancelSupplementarySalaryEntry();

        this.supplementaryForm.get('emp_details')?.setValue(emp);
        this.supplementaryForm.get('supplement_adjust_day')?.setValidators([Validators.required, Validators.pattern(/^-?(0|[1-9]\d*)?$/), Validators.min(1), Validators.max(emp?.attendance_summaries[0]?.total_lop)]);
        this.supplementaryForm.get('supplement_adjust_day')?.updateValueAndValidity();

        $('#supplementaryModalOpen')?.click();
    }

    cancelSupplementarySalaryEntry() {
        Global.resetForm(this.supplementaryForm);

        this.supplementaryForm.get('supplement_adjust_day')?.clearValidators();
        this.supplementaryForm.get('supplement_adjust_day')?.updateValueAndValidity();

        $('#supplementaryModal')?.find('[data-dismiss="modal"]')?.click()
    }

    submitEmpSalarySupplementary(event: any) {
        this.supplementaryForm.markAllAsTouched();
        if (this.supplementaryForm.valid) {
            event.target.classList.add('btn-loading');
            this.companyuserService.runSupplementSalary({
                'supplement_adjust_day': this.supplementaryForm.value.supplement_adjust_day ?? "",
                'emp_id': this.supplementaryForm.value?.emp_details?.emp_id ?? "",
                'emp_db_id': this.supplementaryForm.value?.emp_details?._id ?? "",
                'attendance_month': this.employeeListFilter?.month?.index ?? "",
                'attendance_year': this.employeeListFilter?.year?.value ?? "",
            }).subscribe(res => {
                if (res.status == 'success') {
                    this.toastr.success(res.message);
                    this.cancelSupplementarySalaryEntry();
                    this.fetchEmployees()
                } else if (res.status == 'val_err') {
                    this.toastr.error(Global.showValidationMessage(res.val_msg));
                } else {
                    this.toastr.error(res.message);
                }

                event.target.classList.remove('btn-loading');
            }, err => {
                this.toastr.error(Global.showServerErrorMessage(err));
                event.target.classList.remove('btn-loading');
            })
        }
    }
}
