import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import * as Global from 'src/app/globals';
import PaginationOptions from 'src/app/models/PaginationOptions';
import TableFilterOptions from 'src/app/models/TableFiilterOptions';
import { CompanyuserService } from 'src/app/services/companyuser.service';
import { _bonusReportTempMasterNew } from '../../report/_bonusReportTempMaster';
import { Router } from '@angular/router';

@Component({
    selector: 'app-bonus-report-listing',
    templateUrl: './bonus-report-listing.component.html',
    styleUrls: ['./bonus-report-listing.component.css']
})
export class CMPBonusReportListingComponent implements OnInit {
    Global = Global;
    tableOperationForm: FormGroup;
    bankMaster: any[] = [];
    sheetTemplateMaster: any[] = [];
    employeePaginationOptions: PaginationOptions = Global.resetPaginationOption();
    employeeTableFilterOptions: TableFilterOptions = Global.resetTableFilterOptions();
    employeeFilter: any = null;
    employees: any[] = [];
    instruction_type:any='';
    form_c =  [
                "Sl. No.",
                "Name of the employee	",
                "Father’s name	",
                "Whether he has completed 15 years of age at the beginning of the accounting year	",
                "Designation	",
                "No. of days worked in the year	",
                "Total salary or wage in respect of the accounting year	",
                "Amount of bonus payable under section 10 or section 11 as the case may be	",
                "Puja bonus or other customary bonus during the accounting year	",
                "Interim bonus of bonus paid advance	",
                "_ftn1	",
                "Deduction on account of financial loss, if any, caused by misconduct of employee	",
                "[Total sum deducted under columns 9, 10, 10A and 11]	",
                "Net Amount Payable (Column 8 minus Column 12)",
                "Amount actually paid	",
                "Date on which paid	",
                "Signature/thumb impression of the employee"
        
    ];
    form_d = [
        "Tota amount payable as bonus under Section 10 or 11 of the Payment of Bonus Act, 1965, as the case may be",
        "Settlement if any, reached under Section 18(1) or 12 (3) of the Industrial Disputes Act, 1947 with date",
        "Percentage of bonus declared to be paid",
        "Total amount of bonus actually paid",
        "Date on which payment made",
        "Whether bonus has been paid to all the employees if not, reason for non-payment",
        "Remarks",
    ]
    isFormC:boolean = false
    isFormD:boolean = false
    filterForm: FormGroup = new FormGroup({
        wage_month: new FormControl(),
        wage_year: new FormControl(),
      });

      monthMaster: any[] = Global.monthMaster;
      yearMaster: any;
    constructor(
        private titleService: Title,
        private formBuilder: FormBuilder,
        private spinner: NgxSpinnerService,
        private companyuserService: CompanyuserService,
        private toastr: ToastrService,
        private router:Router,
    ) {
        if (
            !Global.checkCompanyModulePermission({
              company_module: 'bonus',
              company_sub_module: 'bonus_report',
              company_sub_operation:['view'],
              company_strict:true
            })
          ) {
            setTimeout(() => {
              router.navigate(['company/errors/unauthorized-access'], {
                skipLocationChange: true,
              });
            }, 500);
            return;
          }

        let currentYear = new Date().getFullYear();
        this.yearMaster = [];
        for (let index = 4; index >= 0; index--) {
          this.yearMaster.push({
            value: currentYear - index,
            description: currentYear - index,
          });
        }
        this.tableOperationForm = formBuilder.group({
            'payout_process': [null],
            'report_template': [null],
            'bonus_slip':[null],
            'payout_bankid': [null],
        });

        this.tableOperationForm.get('payout_process')?.valueChanges?.subscribe(async (payout_process) => {
            this.tableOperationForm.get('payout_bankid')?.reset();
            this.tableOperationForm.get('payout_bankid')?.markAsUntouched();

            this.tableOperationForm.get('report_template')?.reset();
            this.tableOperationForm.get('report_template')?.markAsUntouched();

            if (payout_process == true) {
                await this.fetchBanks();
                this.tableOperationForm.get('payout_bankid')?.setValidators([Validators.required]);
                this.tableOperationForm.get('report_template')?.clearValidators();
            } else {
                await this.fetchSettingsTemplate();
                this.tableOperationForm.get('payout_bankid')?.clearValidators();
                this.tableOperationForm.get('report_template')?.setValidators([Validators.required]);
            }

            this.tableOperationForm.get('payout_bankid')?.updateValueAndValidity();
            this.tableOperationForm.get('report_template')?.updateValueAndValidity();

            this.resetCheckedRows();
        });

        this.tableOperationForm.get('bonus_slip')?.valueChanges?.subscribe(async (bonus_slip) => {
            if (bonus_slip == true) {
                await this.fetchEmployees();
                this.tableOperationForm.get('payout_process')?.reset();
                this.tableOperationForm.get('payout_bankid')?.reset();
                this.tableOperationForm.get('report_template')?.reset()
            }
            this.resetCheckedRows();
        });
    }

    ngOnInit() {
        this.titleService.setTitle('Bonus Report Listing - ' + Global.AppName);
        this.tableOperationForm.get('payout_process')?.setValue(false);
        setTimeout(() => {
            this.filterForm.patchValue({
              wage_month: this.monthMaster.find((obj: any) => {
                return obj.index == new Date().getMonth();
              }),
              wage_year: this.yearMaster.find((obj: any) => {
                return obj.value == 2023;
              }),
            });
          });
    }

    fetchBanks({ loading = <boolean>true } = {}) {
        return new Promise((resolve, reject) => {
            if (loading == true) this.spinner.show();
            this.companyuserService.fetchBankSheets({
                pageno: 1,
            })?.subscribe((res) => {
                if (loading == true) this.spinner.hide();
                if (res.status == 'success') {
                    this.bankMaster = res?.templates?.docs;
                    resolve(true);
                } else {
                    this.toastr.error(res?.message);
                    resolve(false);
                }
            }, (err) => {
                if (loading == true) this.spinner.hide();
                this.toastr.error(Global.showServerErrorMessage(err));
                resolve(false);
            });
        });
    }

    fetchSettingsTemplate({ loading = <boolean>true } = {}) {
        return new Promise((resolve, reject) => {
            if (loading == true) this.spinner.show();
            this.sheetTemplateMaster = [];
            this.tableOperationForm.get('report_template')?.setValue('')
            this.companyuserService.fetchEmployeeSheetTemplates({
                'pageno': 1,
                temp_module_for: 'bonus_sheet'
            })?.subscribe(res => {
                if (loading == true) this.spinner.hide();

                if (res.status == 'success') {
                    this.sheetTemplateMaster = res?.earning_sheet_temp?.docs ?? [];
                    this.sheetTemplateMaster.push({template_name:"Form C", default:true})
                    this.sheetTemplateMaster.push({template_name:"Form D", default:true})
                    resolve(true);
                } else if (res.status == 'val_err') {
                    this.sheetTemplateMaster = [];
                    this.toastr.error(Global.showValidationMessage(res.val_msg));
                    resolve(false);
                } else {
                    this.sheetTemplateMaster = [];
                    this.toastr.error(res.message);
                    resolve(false);
                }
            }, (err) => {
                if (loading == true) this.spinner.hide();
                this.toastr.error(Global.showServerErrorMessage(err));
                this.sheetTemplateMaster = [];
                resolve(false);
            });
        })
    }

    fetchEmployees({
        page = <any>null,
        loading = <boolean>true,
        filter = <any>null,
        reportGeneration = <boolean>false,
        options = <any>null
    } = {}) {
        return new Promise((resolve, reject) => {
            if (this.reportGenerated == true) this.cancelGenerateReport();
            if (page) this.employeePaginationOptions.page = page;
            if (filter) this.employeeFilter = filter;

            if (!this.employeeFilter) {
                resolve(false);
                return;
            }

            let payload: any = {
                pageno: this.employeePaginationOptions.page,
                perpage: this.employeePaginationOptions.limit,
                bank_account: this.employeeFilter?.bank_id ?? null,
                wage_month_from: this.employeeFilter?.wage_month_from,
                wage_month_to: this.employeeFilter?.wage_month_to,
                wage_year_from: this.employeeFilter?.wage_year_from,
                wage_year_to: this.employeeFilter?.wage_year_to,
                hod_id: this.employeeFilter?.hod_id ?? null,
                department_id: this.employeeFilter?.department_id ?? null,
                searchkey: options?.searchkey ?? '',
                designation_id: this.employeeFilter?.designation_id ?? null,
                branch_id: this.employeeFilter?.branch_id ?? null,
                client_id: this.employeeFilter?.client_id ?? null,
            };
            // let payload = this.employeeFilter
            // if (this.tableOperationForm.get('payout_process')?.value) {
            //     payload.wage_month =
            //       this.filterForm.get('wage_month')?.value?.index ?? '';
            //     payload.wage_year =
            //       this.filterForm.get('wage_year')?.value?.value ?? '';
            //   }
                   if (this.tableOperationForm.get('payout_process')?.value || this.tableOperationForm.get('bonus_slip')?.value) {
                payload.wage_month =
                  this.filterForm.get('wage_month')?.value?.index ?? '';
                payload.wage_year =
                  this.filterForm.get('wage_year')?.value?.value ?? '';
                  delete payload.wage_month_from
                  delete payload.wage_month_to
                  delete payload.wage_year_from
                  delete payload.wage_year_to
              }


            if (reportGeneration == true) {
                payload.row_checked_all = this.rowCheckedAll;
                payload.checked_row_ids = JSON.stringify(this.checkedRowIds);
                payload.unchecked_row_ids = JSON.stringify(this.uncheckedRowIds);
            }else{
                payload.row_checked_all =  true;
                payload.checked_row_ids = JSON.stringify([]);
                payload.unchecked_row_ids = JSON.stringify([]);
            }

            if (loading == true) this.spinner.show();
            this.companyuserService.getBonusSheet(payload)?.subscribe((res) => {
                if (res.status == 'success') {
                    var docs: any[] = res?.master_data?.docs ?? [];

                    docs.forEach((doc: any) => {
                        doc.checked = this.isRowChecked(doc._id);
                    });

                    this.employees = docs;
                    this.employeePaginationOptions = {
                        hasNextPage: res.master_data.hasNextPage,
                        hasPrevPage: res.master_data.hasPrevPage,
                        limit: res.master_data.limit,
                        nextPage: res.master_data.nextPage,
                        page: res.master_data.page,
                        pagingCounter: res.master_data.pagingCounter,
                        prevPage: res.master_data.prevPage,
                        totalDocs: res.master_data.totalDocs,
                        totalPages: res.master_data.totalPages,
                    };

                    resolve(true);
                } else {
                    if (res.status == 'val_err')
                        this.toastr.error(Global.showValidationMessage(res.val_msg));
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
                this.toastr.error(
                    Global.showValidationMessage(Global.showServerErrorMessage(err))
                );
                this.employees = [];
                this.employeePaginationOptions = Global.resetPaginationOption();
                this.rowCheckedAll = false;
                this.checkedRowIds = [];
                this.uncheckedRowIds = [];
                if (loading == true) this.spinner.hide();
                Global.loadCustomScripts('customJsScript');
                resolve(false);
            });
        });
    }

    employeesReportData:any[] =[]
    fetchEmployeesReportData() {
        return new Promise((resolve, reject) => {
        
            let payload: any = {
                pageno: this.employeePaginationOptions.page,
                perpage: this.employeeTableFilterOptions.length,
                bank_account: this.employeeFilter?.bank_id ?? null,
                wage_month_from: this.employeeFilter?.wage_month_from,
                wage_month_to: this.employeeFilter?.wage_month_to,
                wage_year_from: this.employeeFilter?.wage_year_from,
                wage_year_to: this.employeeFilter?.wage_year_to,
                hod_id: this.employeeFilter?.hod_id ?? null,
                department_id: this.employeeFilter?.department_id ?? null,
                designation_id: this.employeeFilter?.designation_id ?? null,
                branch_id: this.employeeFilter?.branch_id ?? null,
                client_id: this.employeeFilter?.client_id ?? null,
                template_id:this.tableOperationForm.get("report_template")?.value?._id

            };
            // let payload = this.employeeFilter
            // if (this.tableOperationForm.get('payout_process')?.value || this.tableOperationForm.get('bonus_slip')?.value) {
            //     payload.wage_month =
            //       this.filterForm.get('wage_month')?.value?.index ?? '';
            //     payload.wage_year =
            //       this.filterForm.get('wage_year')?.value?.value ?? '';
            //       delete payload.wage_month_from
            //       delete payload.wage_month_to
            //       delete payload.wage_year_from
            //       delete payload.wage_year_to
            //   }

       
                payload.row_checked_all = this.rowCheckedAll;
                payload.checked_row_ids = JSON.stringify(this.checkedRowIds);
                payload.unchecked_row_ids = JSON.stringify(this.uncheckedRowIds);
            

            // if (loading == true) this.spinner.show();
            this.companyuserService.employeeBonusReport(payload)?.subscribe((res) => {
                if (res.status == 'success') {
                    this.employeesReportData = res.employees;
                    resolve(true);
                } else {
                    if (res.status == 'val_err')
                        this.toastr.error(Global.showValidationMessage(res.val_msg));
                    else this.toastr.error(res.message);

                    this.employeesReportData = [];
                    resolve(false);
                }

                // if (loading == true) this.spinner.hide();
                // Global.loadCustomScripts('customJsScript');
            }, (err) => {
                this.toastr.error(
                    Global.showValidationMessage(Global.showServerErrorMessage(err))
                );
                this.employeesReportData = [];
         
                resolve(false);
            });
        });
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
        return (this.rowCheckedAll == true || (this.checkedRowIds.length > 0 || this.uncheckedRowIds.length > 0))
    }

    resetCheckedRows() {
        this.rowCheckedAll = false
        this.checkedRowIds = []
        this.uncheckedRowIds = []

        $('.employee-table').find('#select-all').prop('checked', false)

        this.fetchEmployees();
    }

    employeeCheckBoxIsVisible(report: any): boolean {
        if (this.tableOperationForm.get('payout_process')?.value == true) {
            if (!report?.UAN_no || report?.bonus_report?.bank_ins_referance_id) {
                return false;
            }
        }

        return true;
    }

    /**
     * Generate Bank Instruction Functions
     * ------------------------------------
     */

    generateBankInstruction(event: any) {
        if (this.anyRowsChecked() && this.tableOperationForm.get('payout_bankid')?.valid) {
            this.spinner.show();
            this.companyuserService.generateBankInstruction({
                wage_month: this.filterForm.get("wage_month")?.value?.index ?? '',
                wage_year: this.filterForm.get("wage_year")?.value?.value ?? '',
                // wage_month: this.employeeFilter?.month?.index ?? '',
                // wage_year: this.employeeFilter?.year?.value ?? '',
                bank_temp_id: this.tableOperationForm.get('payout_bankid')?.value?._id,
                payment_for: 'bonus',
                hod_id: this.employeeFilter?.hod_id ?? null,
                department_id: this.employeeFilter?.department_id ?? null,
                designation_id: this.employeeFilter?.designation_id ?? null,
                bank_account: this.employeeFilter?.bank_id ?? null,
                branch_id: this.employeeFilter?.branch_id ?? null,
                row_checked_all: this.rowCheckedAll.toString(),
                checked_row_ids: (this.checkedRowIds),
                unchecked_row_ids:(this.uncheckedRowIds),
                instruction_type:this.instruction_type

            })?.subscribe((res) => {
                this.spinner.hide();
                if (res.status == 'success') {
                    this.toastr.success(res.message);
                    this.resetCheckedRows()
                } else if (res.status == 'val_err') {
                    this.toastr.error(res.message);
                } else {
                    this.toastr.error(res.message);
                }
            }, (err) => {
                this.toastr.error(Global.showServerErrorMessage(err));
                this.spinner.hide();
            })
        }
    }

    /**
     * Custom Template Functions
     * -----------------------------
     */

    template_fields: any[] = [];
    sheetTemplate: any[] = _bonusReportTempMasterNew;

    templateForm: UntypedFormGroup = new UntypedFormGroup({
        template_name: new UntypedFormControl(null, Validators.required),
    });

    customFieldTemplate: any[] = [
        {
            section: 'Heads',
            values: [
                { label: 'Head ID', value: 'head_id' },
                { label: 'Title', value: 'head_title' },
                { label: 'Abbreviation', value: 'head_abbreviation' },
                { label: 'Rate', value: 'head_rate' },
                { label: 'Rate Type', value: 'head_rate_type' },
                { label: 'Amount', value: 'amount' },
            ],
        },
        {
            section: 'Incentive Report',
            values: [
                { label: 'CTC', value: 'ctc' },
                { label: 'Total PF Bucket', value: 'total_pf_bucket' },
                { label: 'Total PF Wages', value: 'total_pf_wages' },
                { label: "Total ESIC Bucket", value: 'total_esic_bucket' },
                { label: 'Total ESIC Wages', value: 'total_esic_wages' },
                { label: 'Total PT Wages', value: 'total_pt_wages' },
                { label: 'Net Take Home', value: 'net_take_home' },
                { label: 'Gross Earning', value: 'gross_earning' },
                { label: 'Total Bonus Wages', value: 'total_bonus_wages' },
            ],
        },
        {
            section: 'ESIC',
            values: [
                { label: 'Employee Contribution', value: 'emoloyee_contribution' },
                { label: 'Employer Contribution', value: 'emoloyer_contribution' },
            ],
        },
        {
            section: 'PF',
            values: [
                { label: 'Employee Contribution', value: 'emoloyee_contribution' },
                { label: 'Total Employer Contribution', value: 'total_employer_contribution' },
                { label: 'Employer PF Contribution', value: 'emoloyer_pf_contribution' },
                { label: 'Employer EPS Contribution', value: 'emoloyer_eps_contribution' },
                { label: 'Employer EDLIS Contribution', value: 'emoloyer_edlis_contribution' },
                { label: 'Employer EPF Admin Contribution', value: 'emoloyer_epf_admin_contribution' },
                { label: 'Employer EDLIS Admin Contribution', value: 'emoloyer_edlis_admin_contribution' },
                { label: 'EPS Wages', value: 'eps_wages' },
                { label: 'EDLIS Wages', value: 'edlis_wages' },
                { label: 'Total PF Wages', value: 'total_pf_wages' },
                { label: 'Restricted PF Wages', value: 'restricted_pf_wages' },
            ],
        },
    ];

    rowSelecion(e: any): void {
        document.getElementsByName(e.target?.name)?.forEach((checkbox: any) => {
            checkbox.checked = e.target.checked;
        });
    }

    adjustTemplateFields(field: any[], e: any) {
        let arr = field.map((d) => {
            return d.value;
        });
        if (e.target.checked) {
            this.template_fields.push(...arr);
        } else {
            arr.forEach((element) => {
                let i = this.template_fields.indexOf(element);
                if (i > -1) {
                    this.template_fields.splice(i, 1);
                }
            });
        }
    }

    resetSelectedModules() {
        this.sheetTemplate[0]?.modules?.forEach((row: any) => {
            $('input[name="fields[' + row.module_slug + ']"]:checked').each(function () {
                $(this).prop('checked', false);
            });
        });
    }

    clearFormData() {
        this.resetSelectedModules();
        Global.resetForm(this.templateForm);
    }

    perventUnCheck(e: any) {
        e.preventDefault();
        e.stopPropagation();
    }

    isDefaultChecked(match: string, options: string[]): boolean {
        if (options.includes(match)) return true;
        return false;
    }

    async createTemplate(e: any) {
        this.templateForm.markAllAsTouched();
        setTimeout(() => {
            Global.scrollToQuery('p.text-danger');
        }, 300);
        let modules: any = await this.getSelecteModules();
        if (!Object.keys(modules).length)
            throw this.toastr.error('Please select atleast one field');
        if (this.templateForm.valid) {
            let body = {
                template_name: this.templateForm.value.template_name,
                template_fields: JSON.stringify(modules),
                temp_module_for: 'bonus_sheet'
            };

            e.target.classList.add('btn-loading');
            // console.log(body);

            this.companyuserService.createEmployeeSheetTemplate(body)?.subscribe(
                (res) => {
                    if (res.status == 'success') {
                        this.toastr.success(res.message);
                        this.cancelTemplateCreate();
                        this.fetchSettingsTemplate();
                    } else if (res.status == 'val_err') {
                        this.toastr.error(Global.showValidationMessage(res.val_msg));
                    } else {
                        this.toastr.error(res.message);
                    }
                    e.target.classList.remove('btn-loading');
                },
                (err) => {
                    e.target.classList.remove('btn-loading');
                    this.toastr.error(Global.showServerErrorMessage(err));
                }
            );
        }
    }

    async updateTemplate(e: any) {
        this.templateForm.markAllAsTouched();
        setTimeout(() => {
            Global.scrollToQuery('p.text-danger');
        }, 300);
        let modules: any = await this.getSelecteModules();
        if (!Object.keys(modules).length)
            throw this.toastr.error('Please select atleast one field');
        if (this.templateForm.valid) {
            let body = {
                template_id:this.tableOperationForm.get('report_template')?.value?._id,
                template_name: this.templateForm.value.template_name,
                template_fields: JSON.stringify(modules),
                temp_module_for: 'bonus_sheet'
            };

            e.target.classList.add('btn-loading');
            // console.log(body);

            this.companyuserService.updateEmployeeSheetTemplate(body)?.subscribe(
                (res) => {
                    if (res.status == 'success') {
                        this.toastr.success(res.message);
                        this.cancelTemplateCreate();
                        this.fetchSettingsTemplate();
                    } else if (res.status == 'val_err') {
                        this.toastr.error(Global.showValidationMessage(res.val_msg));
                    } else {
                        this.toastr.error(res.message);
                    }
                    e.target.classList.remove('btn-loading');
                },
                (err) => {
                    e.target.classList.remove('btn-loading');
                    this.toastr.error(Global.showServerErrorMessage(err));
                }
            );
        }
    }

    getSelecteModules() {
        return new Promise((resolve, reject) => {
            const masterModules: any[] = [];
            this.sheetTemplate.forEach((master: any) => {
                const modules: any[] = [];
                master.modules.forEach((row: any) => {
                    const access: any = [];

                    $('input[name="fields[' + row.module_slug + ']"]:checked').each(
                        function () {
                            access.push($(this).val());
                        }
                    );

                    if (access.length > 0) {
                        modules.push({
                            module_slug: row.module_slug,
                            fields: access,
                        });
                    }
                });

                if (modules.length > 0) {
                    masterModules.push({
                        main_slug: master.main_slug,
                        modules: modules,
                    });
                }
            });

            // console.log('masterModules : ', masterModules);
            resolve(masterModules);
        });
    }

    cancelTemplateCreate() {
        $('#settingsTemplateModal')?.find('[data-dismiss="modal"]')?.click();
        Global.resetForm(this.templateForm);
        this.resetSelectedModules();
    }

    /**
     * Report Generation Functions
     * ---------------------------
     */

    reportGenerated: boolean = false;
    generatedReportTemplate: any[] = [];
    form_c_employees:any[] = []
    form_d_employees:any[] = []
    form_c_company_data:any
    form_d_company_data:any
    async generateReport() {
        if(this.tableOperationForm.get('report_template')?.value?.template_name == 'Form C') {
            let res = await this.fetchFormData('FormC');
            this.form_c_employees = res.employees
            this.form_c_company_data = res.company_data
            this.isFormC = true;
            this.isFormD = false;
            return
        }
        if(this.tableOperationForm.get('report_template')?.value?.template_name == 'Form D') {
            
            let res = await this.fetchFormData('FormD');
            this.form_d_employees = res.employees
            this.form_d_company_data = res.company_data
            
            this.isFormD = true;
            this.isFormC = false;
            return
        }

        await this.fetchEmployeesReportData()
        this.isFormC = false
        this.isFormD = false
        let template = _bonusReportTempMasterNew[0]?.modules ?? [];

        if (this.tableOperationForm.get('report_template')?.value) {
            let modules = this.tableOperationForm.get('report_template')?.value?.template_fields[0]?.modules ?? [];

            let tempTemplate: any[] = [];
            modules.forEach((module: any) => {
                let m = template.find((obj: any) => {
                    return obj.module_slug = module.module_slug
                })

                if (m && (m.fields ?? []).length > 0) {
                    // console.log('m: ', m);
                    let fields: any[] = [];
                    module.fields.forEach((field: any) => {
                        let f = m.fields.find((obj: any) => {
                            return field == obj.slug
                        })

                        if (f) {
                            fields.push(f);
                        }
                    });

                    if (fields.length > 0) {
                        tempTemplate.push({
                            module_title: m.module_title,
                            module_slug: m.module_slug,
                            fields: fields
                        })
                    }
                }
            });

            template = tempTemplate;
        }

        if (template.length == 0) {
            this.toastr.error("Template not found to generate");
            // console.log('template: ', template);
            return;
        }

        this.reportGenerated = true;
        this.generatedReportTemplate = template
    }

    async exportExcelReport(){
        try {
            let payload: any = {
                pageno: this.employeePaginationOptions.page,
                perpage: this.employeeTableFilterOptions.length,
                wage_month_from: this.employeeFilter?.wage_month_from,
                wage_month_to: this.employeeFilter?.wage_month_to,
                wage_year_from: this.employeeFilter?.wage_year_from,
                wage_year_to: this.employeeFilter?.wage_year_to,
                hod_id: this.employeeFilter?.hod_id ?? null,
                department_id: this.employeeFilter?.department_id ?? null,
                designation_id: this.employeeFilter?.designation_id ?? null,
                branch_id: this.employeeFilter?.branch_id ?? null,
                client_id: this.employeeFilter?.client_id ?? null,
                template_id:this.tableOperationForm.get("report_template")?.value?._id
            };

             payload.row_checked_all = this.rowCheckedAll;
             payload.checked_row_ids = JSON.stringify(this.checkedRowIds);
             payload.unchecked_row_ids = JSON.stringify(this.uncheckedRowIds);
              
            await this.companyuserService.downloadFile('employee-bonus-report-form-vii-export','Bonus-report-form-vii', payload)
            // let res = await this.companyuserService.bonusReportExport(payload)?.toPromise();
            // if(res.status !== 'success') throw res;
            this.cancelGenerateReport()
        } catch (err:any) {
            // e.target.classList.remove('btn-loading');
            if (err.status == 'val_err') {
              this.toastr.error(Global.showValidationMessage(err.val_msg));
            } else {
              this.toastr.error(Global.showServerErrorMessage(err));
            //   this.toastr.error(err.message);
            }
        }
    }

    async generateBonusSlip(){
        try {
            let payload: any = {
                pageno: this.employeePaginationOptions.page,
                perpage: this.employeeTableFilterOptions.length,
                // wage_month_from: this.employeeFilter?.wage_month_from,
                // wage_month_to: this.employeeFilter?.wage_month_to,
                // wage_year_from: this.employeeFilter?.wage_year_from,
                // wage_year_to: this.employeeFilter?.wage_year_to,
                wage_month: this.filterForm.get("wage_month")?.value?.index ?? '',
                wage_year: this.filterForm.get("wage_year")?.value?.value ?? '',
                hod_id: this.employeeFilter?.hod_id ?? null,
                department_id: this.employeeFilter?.department_id ?? null,
                designation_id: this.employeeFilter?.designation_id ?? null,
                branch_id: this.employeeFilter?.branch_id ?? null,
                client_id: this.employeeFilter?.client_id ?? null,
                generate:"pdf"
            };

             payload.row_checked_all = this.rowCheckedAll;
             payload.checked_row_ids = JSON.stringify(this.checkedRowIds);
             payload.unchecked_row_ids = JSON.stringify(this.uncheckedRowIds);
              
            let res = await this.companyuserService.generateBonusSlip(payload)?.toPromise();
            if(res.status !== 'success') throw res;
            this.toastr.success(res?.message|| 'Bonus Slip Generated Successfully')
        } catch (err:any) {
            // e.target.classList.remove('btn-loading');
            if (err.status == 'val_err') {
              this.toastr.error(Global.showValidationMessage(err.val_msg));
            } else {
              this.toastr.error(Global.showServerErrorMessage(err));
            //   this.toastr.error(err.message);
            }
        }
    }

  async fetchFormData(form_type:string){
        try {
            let payload: any = {
                pageno: this.employeePaginationOptions.page,
                perpage: this.employeeTableFilterOptions.length,
                wage_month_from: this.employeeFilter?.wage_month_from,
                wage_month_to: this.employeeFilter?.wage_month_to,
                wage_year_from: this.employeeFilter?.wage_year_from,
                wage_year_to: this.employeeFilter?.wage_year_to,
                hod_id: this.employeeFilter?.hod_id ?? null,
                department_id: this.employeeFilter?.department_id ?? null,
                designation_id: this.employeeFilter?.designation_id ?? null,
                branch_id: this.employeeFilter?.branch_id ?? null,
                client_id: this.employeeFilter?.client_id ?? null,
            };

             payload.row_checked_all = this.rowCheckedAll;
             payload.checked_row_ids = JSON.stringify(this.checkedRowIds);
             payload.unchecked_row_ids = JSON.stringify(this.uncheckedRowIds);
             
            let apiUrl:any = this.companyuserService 
            let res = await apiUrl[`bonus${form_type}Report`](payload)?.toPromise();
            if(res.status !== 'success') throw res;
            if(form_type ==  'FormC'){
                return {
                    employees:res.employees,
                    company_data:{...res.company_name, financial_year:res.financial_year,total_paydays:res.total_paydays },

                }
            }else{
                return {
                    employees:res.employees,
                    company_data:res.data[0],
                }
            }
        } catch (err) {
            throw err
        }
    }
    
    async exportFormReport(form_type:string){
        try {
            let payload: any = {
                pageno: this.employeePaginationOptions.page,
                perpage: this.employeeTableFilterOptions.length,
                wage_month_from: this.employeeFilter?.wage_month_from,
                wage_month_to: this.employeeFilter?.wage_month_to,
                wage_year_from: this.employeeFilter?.wage_year_from,
                wage_year_to: this.employeeFilter?.wage_year_to,
                hod_id: this.employeeFilter?.hod_id ?? null,
                department_id: this.employeeFilter?.department_id ?? null,
                designation_id: this.employeeFilter?.designation_id ?? null,
                branch_id: this.employeeFilter?.branch_id ?? null,
                client_id: this.employeeFilter?.client_id ?? null,
            };

             payload.row_checked_all = this.rowCheckedAll;
             payload.checked_row_ids = JSON.stringify(this.checkedRowIds);
             payload.unchecked_row_ids = JSON.stringify(this.uncheckedRowIds);
             
            // let apiUrl:any = this.companyuserService 
            // employee-form-c-bonus-report-export
            // employee-form-d-bonus-report-export
            if(form_type == 'FormC'){
                form_type = 'form-c'
            }else{
                form_type = 'form-d'
            }
            await this.companyuserService.downloadFile(`employee-${form_type}-bonus-report-export`,`bonus-${form_type}-report`, payload)
            // let res = await apiUrl[`bonus${form_type}ReportExport`](payload)?.toPromise();/
            // if(res.status !== 'success') throw res;
        } catch (err) {
            throw err
        }
    }

    cancelGenerateReport() {
        this.reportGenerated = false;
        this.generatedReportTemplate = [];
        this.isFormC = false
        this.isFormD = false
        this.form_c_employees = []
        this.form_d_employees = []
        this.form_c_company_data = null
        this.form_d_company_data = null
        this.resetCheckedRows();
    }

    getReportTdValue(employee: any, field: any) {
      // console.log(employee,'emp');
      // console.log(field,'emp');
        
        if (field.mapping) {
            if (Array.isArray(field.mapping)) {
                let value:any = '';
                field.mapping.forEach((mapping: any) => {
                    value += this.getMappingValue(mapping, employee) + ' ';
                });

                if(typeof value !== 'string'){
                    value = value?.toFixed(2)
                }
                return value ?? 'N/A';
            } else {
                return this.getMappingValue(field.mapping, employee) ?? 'N/A';
            }
        } else {
            return 'N/A';
        }
    }

    getMappingValue(mappingValue: string, obj: any) {
// console.log(mappingValue,'map',obj);

        let mapping = mappingValue.split('.');
        if (mapping.length > 0) {
            let value = obj;
            mapping.forEach((key: any) => {
                
                if (value !== null && value !== undefined) {
                    // if(value[]){

                    // }
                    value = value[key] ?? "N/A";
                }
            });

            if(typeof value !== 'string'){
                value = value?.toFixed(2)
            }
            return value ?? "N/A"
        } else {
            return "N/A";
        }
    }

    isSheetTemplateEdit:boolean = false;

  openSettingsTemplateModal() {
    let selectedTempate = this.tableOperationForm.get('report_template')?.value;
  // console.log(selectedTempate);
    
    if (Array.isArray(selectedTempate))
      selectedTempate.length ? null : (selectedTempate = null);
    if (selectedTempate) {
      this.isSheetTemplateEdit = true
      this.cancelTemplateCreate();
      this.templateForm.get("template_name")?.setValue(selectedTempate?.template_name)

      selectedTempate?.template_fields[0]?.modules[0]?.fields?.forEach((field: any) => {
          const el: any = document.getElementById(field);
          if (el) {
            el.checked = true;
          }
      });

     
    }else{
      this.cancelTemplateCreate();
      this.isSheetTemplateEdit = false
    }
    
    $('#TemplateModalOpen').click();
  }
}
