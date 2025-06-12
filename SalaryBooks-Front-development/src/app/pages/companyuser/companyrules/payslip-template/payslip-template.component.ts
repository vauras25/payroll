import { Component, OnInit } from '@angular/core';
import {
  FormControl,
  FormGroup,
    UntypedFormBuilder,
    UntypedFormGroup,
    Validators,
} from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { CompanyuserService } from 'src/app/services/companyuser.service';
import * as Global from 'src/app/globals';
import { DatePipe } from '@angular/common';
import swal from 'sweetalert2';
import { AdminService } from 'src/app/services/admin.service';

@Component({
    selector: 'companyuser-app-payslip-template',
    templateUrl: './payslip-template.component.html',
    styleUrls: ['./payslip-template.component.css'],
})
export class CMPPayslipTemplateComponent implements OnInit {
    Global = Global;
    dtOptions: DataTables.Settings = {};
    dtOptionsLibrary: DataTables.Settings = {};
    paySlipForm: UntypedFormGroup;
    editActionId: String;

    employeeDetailsMaster: any[];
    salaryDeductionsMaster: any[];
    // salaryContributionsMaster: any[];
    otherPaymentMaster: any[];
    otherDeductionMaster: any[];
    salaryHeads: any[];


    constructor(
        public formBuilder: UntypedFormBuilder,
        private titleService: Title,
        private toastr: ToastrService,
        private router: Router,
        private companyuserService: CompanyuserService,
        private adminService: AdminService,
        private spinner: NgxSpinnerService,
        private datePipe: DatePipe
    ) {
        if (
            !Global.checkCompanyModulePermission({
              company_module: 'company_rules_2',
              company_sub_module: 'pay_slip_template',
              company_sub_operation: ['view'],
              company_strict: true
            })
          ) {
            // const _this = this;
            // setTimeout(function () {
            router.navigate(['company/errors/unauthorized-access'], {
              skipLocationChange: true,
            });
            return;
            // }, 500);
            // return;
          }
        this.editActionId = '';

        this.employeeDetailsMaster = [
            { value: 'company_info', description: 'Company Information' },
            { value: 'payslip_period', description: 'Pay Slip Period' },
            { value: 'emp_code', description: 'Emp Code' },
            { value: 'emp_name', description: 'Emp Name' },
            { value: 'client', description: 'Client' },
            { value: 'branch', description: 'Branch' },
            { value: 'department', description: 'Department' },
            { value: 'hod', description: 'HOD' },
            { value: 'gender', description: 'Gender' },
            { value: 'dob', description: 'DOB' },
            { value: 'doj', description: 'DOJ' },
            { value: 'email_id', description: 'Email ID' },
            { value: 'phone', description: 'Phone' },
            { value: 'bank_name', description: 'Bank Name' },
            { value: 'account_no', description: 'Account No' },
            { value: 'ifsc_code', description: 'IFSC Code' },
            { value: 'account_type', description: 'Account Type' },
            { value: 'aadhar_no', description: 'Aadhar No' },
            { value: 'pan_no', description: 'PAN No' },
            { value: 'uan_no', description: 'UAN No' },
            { value: 'pf_no', description: 'PF No' },
            { value: 'esic_ip_no', description: 'ESIC/IP No' },
            { value: 'month_days', description: 'Month Days' },
            { value: 'week_off', description: 'Week Offs' },
            { value: 'pay_days', description: 'Pay days' },
            { value: 'paid_leave', description: 'Paid Leave' },
            { value: 'holidays', description: 'Holidays' },
            { value: 'present_days', description: 'Present Days' },
            { value: 'lop_days', description: 'LOP Days' },
            { value: 'arrear_leave', description: 'Arrear Period' },
        ];

        this.salaryDeductionsMaster = [
            { value: 'salary_heads', description: 'Salary Heads' },
            { value: 'incentive', description: 'Incentive' },
            { value: 'bonus', description: 'Bonus' },
            { value: 'ex_gratia', description: 'Ex-Gratia' },
            { value: 'ot', description: 'Overtime' },
            { value: 'arrear', description: 'Arrear' },
            { value: 'leave_encash', description: 'Leave Encash' },
            { value: 'extra_earnings', description: 'Extra Earnings' },
            { value: 'deduction', description: 'Deductions' },
            { value: 'er_contri', description: 'ER Contri' },
            { value: 'gross', description: 'Gross' },
            { value: 'net_pay', description: 'Net Pay' },
            { value: 'ctc', description: 'CTC' },
            { value: 'shift_allowance', description: 'Shift Allowance' },
        ];

        this.otherPaymentMaster = [
            { value: 'advance', description: 'Advance' },
            { value: 'reimbursement', description: 'Reimbursement' },
            { value: 'leave_details', description: 'Leave Details' },
            { value: 'advance_details', description: 'Advance Details' },
        ];

        this.otherDeductionMaster = [
            { value: 'advance-recover1', description: 'Advance Recover 1' },
            { value: 'advance-recover2', description: 'Advance Recover 2' },
            { value: 'advance-recover3', description: 'Advance Recover 3' },
            { value: 'advance-recover4', description: 'Advance Recover 4' },
        ];

        this.paySlipForm = formBuilder.group({
            template_name: [null, Validators.compose([Validators.required])],
            company_info: [null, Validators.compose([Validators.required])],
            employee_details: [null],
            payroll_details: [null],
            other_details: [null],
            other_payment: [null],
            other_deduction: [null],
            signature_message: [null, Validators.compose([])],
            leave_status: [true],
            tds_status: [true],

            payslip_temp_company_logo: [
                null,
                Validators.compose([Validators.required]),
            ],
            payslip_temp_company_logo_file: [
                null,
                Validators.compose([Validators.required]),
            ],
            logo_path: [null],
            logo_status: [null],
        });

        this.fetch();
        this.fetchTemplateLibrary();
    }

    ngOnInit(): void {
        this.titleService.setTitle('Pay Slip Template - ' + Global.AppName);
        this.fetchSalaryHeads();
    }

    onFileChanged(
        event: any,
        formGroup: UntypedFormGroup,
        file: any,
        target: any
    ) {
        if (event.target.files.length > 0) {
            const file = event.target.files[0];
            formGroup.patchValue({
                [target]: file,
                logo_status: 'changed',
                logo_path: null,
            });
        }

        if (!this.editActionId && formGroup.value.logo_status != 'unchanged') {
            formGroup.controls['payslip_temp_company_logo'].setValidators([
                Validators.required,
            ]);
            formGroup.controls['payslip_temp_company_logo_file'].setValidators([
                Validators.required,
            ]);
            formGroup.controls['payslip_temp_company_logo'].updateValueAndValidity();
            formGroup.controls[
                'payslip_temp_company_logo_file'
            ].updateValueAndValidity();
        }
    }

    create(event: any) {
        try {
            this.paySlipForm.markAllAsTouched();
            setTimeout(function () {
                let $_errFormControl = document.querySelectorAll('p.error-element');
                if ($_errFormControl.length > 0) {
                    const firstErr: Element = $_errFormControl[0];
                    firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 100);
    
            if (this.paySlipForm.valid) {
                event.target.classList.add('btn-loading');
    
                this.companyuserService
                    .createPaySlipTemplate({
                        template_name: this.paySlipForm.value.template_name ?? '',
                        company_info: this.paySlipForm.value.company_info ?? '',
                        employee_details: JSON.stringify(
                            this.getSelectedModules('employee_details')
                        ),
                        payroll_details: JSON.stringify(
                            this.getSelectedModules('payroll_details')
                        ),
                        other_details: JSON.stringify(
                            this.getSelectedModules('other_details')
                        ),
                        other_payment: JSON.stringify(
                            this.getSelectedModules('other_payment')
                        ),
                        other_deduction: JSON.stringify(
                            this.getSelectedModules('other_deduction')
                        ),
                        signature_message: this.paySlipForm.value.signature_message ?? '',
                        leave_status: this.paySlipForm.value.leave_status ?? '',
                        tds_status: this.paySlipForm.value.tds_status ?? '',
                        payslip_temp_company_logo:
                            this.paySlipForm.value.payslip_temp_company_logo_file ?? '',
                        logo_path: this.paySlipForm.value.logo_path ?? '',
                        logo_status:
                            this.paySlipForm.value.logo_status == 'unchanged'
                                ? 'unchanged'
                                : 'changed',
                    })
                    .subscribe(
                        (res) => {
                            if (res.status == 'success') {
                                this.toastr.success(res.message);
                                this.cancelEntry();
    
                                $('#my-datatable')
                                    .dataTable()
                                    .api()
                                    .ajax.reload(function (json) { }, false);
                            } else if (res.status == 'val_err') {
                                this.toastr.error(Global.showValidationMessage(res.val_msg));
                            } else {
                                this.toastr.error(res.message);
                            }
    
                            event.target.classList.remove('btn-loading');
                        },
                        (err) => {
                            event.target.classList.remove('btn-loading');
                            this.toastr.error(Global.showServerErrorMessage(err));
                        }
                    );
            }
        } catch (err) {
            
        }
    }

    update(event: any) {
        this.paySlipForm.markAllAsTouched();
        setTimeout(function () {
            let $_errFormControl = document.querySelectorAll('p.error-element');
            if ($_errFormControl.length > 0) {
                const firstErr: Element = $_errFormControl[0];
                firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 100);

        if (this.paySlipForm.valid) {
            event.target.classList.add('btn-loading');

            this.companyuserService
                .updatePaySlipTemplate({
                    template_name: this.paySlipForm.value.template_name ?? '',
                    company_info: this.paySlipForm.value.company_info ?? '',
                    employee_details: JSON.stringify(
                        this.getSelectedModules('employee_details')
                    ),
                    payroll_details: JSON.stringify(
                        this.getSelectedModules('payroll_details')
                    ),
                    other_details: JSON.stringify(
                        this.getSelectedModules('other_details')
                    ),
                    other_payment: JSON.stringify(
                        this.getSelectedModules('other_payment')
                    ),
                    other_deduction: JSON.stringify(
                        this.getSelectedModules('other_deduction')
                    ),
                    signature_message: this.paySlipForm.value.signature_message ?? '',
                    leave_status: this.paySlipForm.value.leave_status ?? '',
                    tds_status: this.paySlipForm.value.tds_status ?? '',
                    payslip_temp_company_logo:
                        this.paySlipForm.value.payslip_temp_company_logo_file ?? '',
                    payslip_temp_id: this.editActionId,
                })
                .subscribe(
                    (res) => {
                        if (res.status == 'success') {
                            this.toastr.success(res.message);
                            $('#my-datatable')
                                .dataTable()
                                .api()
                                .ajax.reload(function (json) { }, false);
                        } else if (res.status == 'val_err') {
                            this.toastr.error(Global.showValidationMessage(res.val_msg));
                        } else {
                            this.toastr.error(res.message);
                        }

                        event.target.classList.remove('btn-loading');
                    },
                    (err) => {
                        event.target.classList.remove('btn-loading');
                        this.toastr.error(Global.showServerErrorMessage(err));
                    }
                );
        }
    }

    fetch() {
        this.dtOptions = {
            ajax: (dataTablesParameters: any, callback) => {
                this.companyuserService
                    .fetchPaySlipTemplates({
                        pageno: dataTablesParameters.start / Global.DataTableLength + 1,
                        perpage: dataTablesParameters.length,
                        searchkey: dataTablesParameters.search.value,
                        sortbyfield: Global.getTableSortingOptions(
                            'sortbyfield',
                            dataTablesParameters
                        ),
                        ascdesc: Global.getTableSortingOptions(
                            'ascdesc',
                            dataTablesParameters
                        ),
                    })
                    .subscribe(
                        (res) => {
                            if (res.status == 'success') {
                                callback({
                                    recordsTotal: res.payslip_temp.totalDocs,
                                    recordsFiltered: res.payslip_temp.totalDocs,
                                    data: res.payslip_temp.docs,
                                });
                            } else {
                                this.toastr.error(res.message);

                                callback({
                                    recordsTotal: 0,
                                    recordsFiltered: 0,
                                    data: [],
                                });
                            }
                        },
                        (err) => {
                            this.toastr.error(Global.showServerErrorMessage(err));

                            callback({
                                recordsTotal: 0,
                                recordsFiltered: 0,
                                data: [],
                            });
                        }
                    );
            },
            columns: [
                {
                    render: function (data, type, full, meta: any) {
                        return meta.settings._iDisplayStart + (meta.row + 1);
                    },
                    orderable: false,
                },
                {
                    render: function (data, type, full, meta) {
                        let html = ``;
                        let flag: boolean = false;

                      

                        if (
                            Global.checkCompanyModulePermission({
                                company_module: 'company_rules_2',
                                company_sub_module: 'pay_slip_template',
                                company_sub_operation: ['view'],
                                company_strict: true
                            })
                        ) {
                            html +=
                                `<button class="btn btn-primary btn-icon mx-1" data-toggle="tooltip" data-placement="top" title="View" id="viewButton-` +
                                meta.row +
                                `">
                          <div style="width:25px; height:25px;"><i class="fa fa-eye"></i></div>
                      </button>`;

                            flag = true;
                        }
                        if (
                            Global.checkCompanyModulePermission({
                                company_module: 'company_rules_2',
                                company_sub_module: 'pay_slip_template',
                                company_sub_operation: ['edit'],
                                company_strict: true
                            })
                        ) {
                            html +=
                                `<button class="btn btn-primary btn-icon mx-1" data-toggle="tooltip" data-placement="top" title="Edit" id="editButton-` +
                                meta.row +
                                `">
                          <div style="width:25px; height:25px;"><i class="fa fa-pen"></i></div>
                      </button>`;

                            flag = true;
                        }

                        if (
                            Global.checkCompanyModulePermission({
                                company_module: 'company_rules_2',
                            company_sub_module: 'pay_slip_template',
                            company_sub_operation: ['delete'],
                            company_strict: true
                            })
                        ) {
                            html +=
                                `<button class="btn btn-danger btn-icon mx-1" data-toggle="tooltip" data-placement="top" title="Delete" id="deleteButton-` +
                                meta.row +
                                `">
                          <div style="width:25px; height:25px;"><i class="fa fa-trash"></i></div>
                      </button>`;

                            flag = true;
                        }

                        if (flag) return html;
                        else return '-';
                    },
                    className: 'text-center',
                    orderable: false,
                },
                {
                    render: function (data, type, full, meta) {
                        return full.template_name ?? 'N/A';
                    },
                    orderable: true,
                    name: 'template_name',
                },
                {
                    render: function (data, type, full, meta) {
                        return (
                            `<img class="img-thumbnail" style="max-width: 75px" src=` +
                            Global.BACKEND_URL +
                            `/` +
                            full.company_logo +
                            `>`
                        );
                    },
                    orderable: false,
                    name: 'company_logo',
                    className: 'text-center',
                },
                {
                    render: function (data, type, full, meta) {
                        return full.company_info;
                    },
                    orderable: true,
                    name: 'company_info',
                },
                {
                    render: function (data, type, full, meta) {
                        var datePipe = new DatePipe('en-US');
                        let value = datePipe.transform(
                            full.created_at,
                            'dd/MM/yyyy hh:mm a'
                        );
                        return value;
                    },
                    orderable: true,
                    name: 'created_at',
                },
            ],
            drawCallback: function (settings) {
                Global.loadCustomScripts('customJsScript');
            },
            rowCallback: (row: Node, data: any[] | Object, index: number) => {
                const self = this;

                $('table').on('click', '#viewButton-' + index, function () {
                    self.showTemplate(data);
                });

                $('table').on('click', '#editButton-' + index, function () {
                    self.getEdit(data);
                });

                $('table').on('click', '#deleteButton-' + index, function () {
                    self.deleteItem(data);
                });

                return row;
            },
            pagingType: 'full_numbers',
            serverSide: true,
            processing: true,
            ordering: true,
            searching: true,
            pageLength: Global.DataTableLength,
            lengthChange: true,
            lengthMenu: Global.DataTableLengthChangeMenu,
            responsive: true,
            order: [],
            language: {
                searchPlaceholder: 'Search...',
                search: '',
            },
        };
    }

    getEdit(item: any) {
        this.cancelEntry();

        this.paySlipForm.patchValue({
            template_name: item.template_name ?? null,
            company_info: item.company_info,
            signature_message: item.signature_message,
            leave_status: item.leave_status,
            tds_status: item.tds_status,
        });

        this.checkModulesForEdit('employee_details', item.employee_details);
        this.checkModulesForEdit('payroll_details', item.payroll_details);
        this.checkModulesForEdit(
            'other_details',
            item.other_details
        );
        this.checkModulesForEdit('other_payment', item.other_payment);
        this.checkModulesForEdit('other_deduction', item.other_deduction);

        this.paySlipForm.controls['payslip_temp_company_logo'].clearValidators();
        this.paySlipForm.controls[
            'payslip_temp_company_logo_file'
        ].clearValidators();
        this.paySlipForm.controls[
            'payslip_temp_company_logo'
        ].updateValueAndValidity();
        this.paySlipForm.controls[
            'payslip_temp_company_logo_file'
        ].updateValueAndValidity();

        this.editActionId = item._id;
    }

    cancelEntry() {
        this.editActionId = '';
        this.resetSelectedModules();
        Global.resetForm(this.paySlipForm);

        this.paySlipForm.controls['payslip_temp_company_logo'].setValidators([
            Validators.required,
        ]);
        this.paySlipForm.controls['payslip_temp_company_logo_file'].setValidators([
            Validators.required,
        ]);
        this.paySlipForm.controls[
            'payslip_temp_company_logo'
        ].updateValueAndValidity();
        this.paySlipForm.controls[
            'payslip_temp_company_logo_file'
        ].updateValueAndValidity();

        $('html, body').animate({
            scrollTop: $('#rule-submit-section').position().top,
        });
    }

    getSelectedModules(formName: any) {
        const modules: any[] = [];
        $('input[name="' + formName + '[]"]:checked').each(function () {
            modules.push($(this).val());
        });

        return modules;
    }

    checkModulesForEdit(formName: any, modules: any) {
        // this.resetSelectedModules();

        // console.log(formName)
        // console.log(modules)

        for (const key in modules) {
            if (Object.prototype.hasOwnProperty.call(modules, key)) {
                const element = modules[key];
                $('input[name="' + formName + '[]"][value="' + element + '"]').prop(
                    'checked',
                    true
                );
            }
        }
    }

    resetSelectedModules() {
        let arr = [
            'employee_details',
            'payroll_details',
            'other_details',
            'other_payment',
            'other_deduction',
        ];
        arr.forEach((element) => {
            $('input[name="' + element + '[]"]:checked').each(function () {
                $(this).prop('checked', false);
            });
        });
    }

    deleteItem(item: any) {
        swal
            .fire({
                title: 'Are you sure want to remove?',
                text: 'You will not be able to recover this data!',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Yes, delete it!',
                cancelButtonText: 'No, keep it',
            })
            .then((result) => {
                if (result.value) {
                    this.companyuserService
                        .deletePaySlipTemplate({
                            payslip_temp_id: item._id,
                        })
                        .subscribe(
                            (res) => {
                                if (res.status == 'success') {
                                    this.toastr.success(res.message);
                                    $('#my-datatable')
                                        .dataTable()
                                        .api()
                                        .ajax.reload(function (json) { }, false);
                                } else {
                                    this.toastr.error(res.message);
                                }
                            },
                            (err) => {
                                this.toastr.error(Global.showServerErrorMessage(err));
                            }
                        );
                } else if (result.dismiss === swal.DismissReason.cancel) {
                    swal.fire('Cancelled', 'Your data is safe :)', 'error');
                }
            });
    }

    openTemplateLibrary() {
        $('#librarymmodalbutton').click();
    }

    fetchTemplateLibrary() {
        const _this = this;

        this.dtOptionsLibrary = {
            ajax: (dataTablesParameters: any, callback) => {
                this.companyuserService
                    .fetchPaySlipTemplateLibrary({
                        pageno: dataTablesParameters.start / Global.DataTableLength + 1,
                        perpage: dataTablesParameters.length,
                        searchkey: dataTablesParameters.search.value,
                        sortbyfield: Global.getTableSortingOptions(
                            'sortbyfield',
                            dataTablesParameters
                        ),
                        ascdesc: Global.getTableSortingOptions(
                            'ascdesc',
                            dataTablesParameters
                        ),
                    })
                    .subscribe(
                        (res) => {
                            if (res.status == 'success') {
                                callback({
                                    recordsTotal: res.spaysliptemp_rule.totalDocs,
                                    recordsFiltered: res.spaysliptemp_rule.totalDocs,
                                    data: res.spaysliptemp_rule.docs,
                                });
                            } else {
                                this.toastr.error(res.message);

                                callback({
                                    recordsTotal: 0,
                                    recordsFiltered: 0,
                                    data: [],
                                });
                            }
                        },
                        (err) => {
                            this.toastr.error(Global.showServerErrorMessage(err));

                            callback({
                                recordsTotal: 0,
                                recordsFiltered: 0,
                                data: [],
                            });
                        }
                    );
            },
            columns: [
                {
                    render: function (data, type, full, meta: any) {
                        return meta.settings._iDisplayStart + (meta.row + 1);
                    },
                    orderable: false,
                },
                {
                    render: function (data, type, full, meta) {
                        let html = '';

                        html +=
                            `<button class="btn btn-primary btn-icon mx-1" data-toggle="tooltip" data-placement="top" title="Clone" id="cloneButton-` +
                            meta.row +
                            `">
                          <div style="width:25px; height:25px;"><i class="fa fa-copy"></i></div>
                      </button>`;

                        return html ? html : 'N/A';
                    },
                    className: 'text-center',
                    orderable: false,
                },
                {
                    render: function (data, type, full, meta) {
                        return full.template_name ?? 'N/A';
                    },
                    orderable: true,
                    name: 'template_name',
                },
                {
                    render: function (data, type, full, meta) {
                        return (
                            `<img class="img-thumbnail" style="max-width: 75px" src=` +
                            Global.BACKEND_URL +
                            `/` +
                            full.company_logo +
                            `>`
                        );
                    },
                    orderable: false,
                    name: 'company_logo',
                    className: 'text-center',
                },
                {
                    render: function (data, type, full, meta) {
                        return full.company_info;
                    },
                    orderable: true,
                    name: 'company_info',
                },
                {
                    render: function (data, type, full, meta) {
                        var datePipe = new DatePipe('en-US');
                        let value = datePipe.transform(
                            full.created_at,
                            'dd/MM/yyyy hh:mm a'
                        );
                        return value;
                    },
                    orderable: true,
                    name: 'created_at',
                },
            ],
            drawCallback: function (settings) {
                Global.loadCustomScripts('customJsScript');
            },
            rowCallback: (row: Node, data: any[] | Object, index: number) => {
                const self = this;
                $('table').on('click', '#cloneButton-' + index, function () {
                    self.cloneItem(data);
                });

                return row;
            },
            pagingType: 'full_numbers',
            serverSide: true,
            processing: true,
            ordering: true,
            order: [],
            searching: true,
            pageLength: Global.DataTableLength,
            lengthChange: true,
            lengthMenu: Global.DataTableLengthChangeMenu,
            responsive: true,
            language: {
                searchPlaceholder: 'Search...',
                search: '',
            },
        };
    }

    cloneItem(item: any) {
        $('[data-dismiss="modal"]')?.click();
        this.cancelEntry();

        this.paySlipForm.patchValue({
            template_name: item.template_name ?? null,
            company_info: item.company_info,
            signature_message: item.signature_message,
            leave_status: item.leave_status,
            tds_status: item.tds_status,
            logo_path: item.company_logo,
            logo_status: 'unchanged',
        });

        this.checkModulesForEdit('employee_details', item.employee_details);
        this.checkModulesForEdit('payroll_details', item.payroll_details);
        this.checkModulesForEdit(
            'other_details',
            item.other_details
        );
        this.checkModulesForEdit('other_payment', item.other_payment);
        this.checkModulesForEdit('other_deduction', item.other_deduction);

        this.paySlipForm.controls['payslip_temp_company_logo'].clearValidators();
        this.paySlipForm.controls['payslip_temp_company_logo_file'].clearValidators();
        this.paySlipForm.controls['payslip_temp_company_logo'].updateValueAndValidity();
        this.paySlipForm.controls['payslip_temp_company_logo_file'].updateValueAndValidity();
    }

    fetchSalaryHeads() {
        this.spinner.show();

        this.companyuserService.fetchSalaryHeads().subscribe(
            (res) => {
                if (res.status == 'success') {
                    this.salaryHeads = res.temp_head.map((element: any) => {
                        return {
                            id: element._id,
                            description: element.full_name,
                            full_name: element.full_name,
                            abbreviation: element.abbreviation,
                            head_type: element.head_type,
                            rate: '00.00',
                            amount: '00.00',
                        };
                    });
                } else if (res.status == 'val_err') {
                    this.toastr.error(Global.showValidationMessage(res.val_msg));
                } else {
                    this.toastr.error(res.message);
                }

                this.spinner.hide();
            },
            (err) => {
                this.spinner.hide();
                this.toastr.error(Global.showServerErrorMessage(err));
            }
        );
    }

    templateData: any = {};
    showTemplate(data: any) {
        this.templateData = data;

        this.spinner.show();
        setTimeout(() => {
            $('#viewTemplate')?.click();
            this.spinner.hide();
        }, 100);

        // console.log('templateData: ', this.templateData)
        return;



        this.templateData = { ...data };
        // console.log(this.templateData);

        this.templateData.employee_details = data.employee_details?.map((detail: any) => {
            return this.employeeDetailsMaster.find((d) => d?.value == detail)?.description;
        });

        this.templateData.other_details = [
            ...this.templateData.other_details,
            ...this.salaryHeads.filter((head) => head.head_type === 'earning'),
        ];
        this.templateData.payroll_details = [
            ...this.templateData.payroll_details,
            ...this.salaryHeads.filter((head) => head.head_type === 'deduction'),
        ];

        let btn: any = $('#viewTemplate');
        btn.click();
    }

    checkSectionAllCheckBox(sectionName:string, target:HTMLInputElement){
        const els:any = document.getElementsByName(sectionName);
        
        els?.forEach((el:HTMLInputElement) => {
            el.checked = target?.checked;
        })
    }
}
