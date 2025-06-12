import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import * as Global from 'src/app/globals';
import PaginationOptions from 'src/app/models/PaginationOptions';
import TableFilterOptions from 'src/app/models/TableFiilterOptions';
import TableFiilterOptions from 'src/app/models/TableFiilterOptions';
import { CompanyuserService } from 'src/app/services/companyuser.service';
import swal from 'sweetalert2';

@Component({
    selector: 'app-companyuser-advance-run',
    templateUrl: './run.component.html',
    styleUrls: ['./run.component.css']
}) export class CMPAdvanceRunComponent implements OnInit {
    Global = Global;
    employees: any[] = [];
    employeeListFilter: any = null;
    employeePaginationOptions: PaginationOptions = Global.resetPaginationOption();
    employeeTableFilterOptions: TableFiilterOptions = Global.resetTableFilterOptions();
    recoveryFromMaster:any[] = []
    constructor(
        private titleService: Title,
        private spinner: NgxSpinnerService,
        private companyuserService: CompanyuserService,
        private toastr: ToastrService,
        private formBuilder: FormBuilder
    ) {
        this.recoveryFromMaster = [
            { value: 'incentive', description: 'Incentive' },
            { value: 'bonus', description: 'Bonus' },
            { value: 'gross_earning', description: 'Gross Earning' },
            { value: 'annual_earning', description: 'Annual Earning' },
            { value: 'reimbursement', description: 'Reimbursement' },
          ];
    }

    ngOnInit() {
        this.titleService.setTitle("Run Advance - " + Global.AppName);
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
                'searchkey': this.employeeTableFilterOptions.searchkey ?? "",
                'attendance_month': this.employeeListFilter?.month?.index ?? "",
                'attendance_year': this.employeeListFilter?.year?.value ?? "",
                'hod_id': this.employeeListFilter?.hod_id ?? null,
                'department_id': this.employeeListFilter?.department_id ?? null,
                'designation_id': this.employeeListFilter?.designation_id ?? null,
                'branch_id': this.employeeListFilter?.branch_id ?? null,
            };

            if (loading == true) this.spinner.show();
            this.companyuserService.getAdvanceEmployeeList(payload)?.subscribe(res => {
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
    getRecoveryFromName(name:any){
       let recoveryName:any = this.recoveryFromMaster.find((val:any) => val.value == name);
       return recoveryName ? recoveryName?.description : 'N/A';
    }
    async generateReport() {
        return new Promise((resolve, reject) => {
            if (this.rowCheckedAll == false && (this.checkedRowIds.length == 0 && this.uncheckedRowIds.length == 0)) {
                // this.toastr.error("Please select atleast one employee to continue");
                return;
            }

            this.spinner.show();
            this.companyuserService.runAdvanceSheet({
                'row_checked_all': this.rowCheckedAll,
                'checked_row_ids': JSON.stringify(this.checkedRowIds),
                'unchecked_row_ids': JSON.stringify(this.uncheckedRowIds),
                'attendance_month': this.employeeListFilter?.month?.index ?? "",
                'attendance_year': this.employeeListFilter?.year?.value ?? "",
            })?.subscribe(res => {
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
            emp_details?.employee_monthly_reports?.pf_challan_referance_id
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
}
