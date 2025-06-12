import { Component, OnInit, ViewChild } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  UntypedFormControl,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import * as Global from 'src/app/globals';
import PaginationOptions from 'src/app/models/PaginationOptions';
import TableFilterOptions from 'src/app/models/TableFiilterOptions';
import { CompanyuserService } from 'src/app/services/companyuser.service';
import { CMPMasterSheetReportComponent } from '../../report/master-sheet/master-sheet.component';
import { _salarySheetTempMasterNew } from 'src/app/pages/companyuser/report/_salarySheetTempMaster';
import { Router } from '@angular/router';

@Component({
  selector: 'app-revision-report',
  templateUrl: './revision-report.component.html',
  styleUrls: ['./revision-report.component.css'],
})
export class RevisionReportComponent implements OnInit  {
  @ViewChild('masterSheet') masterSheetComponent: CMPMasterSheetReportComponent;

  Global = Global;
  tableOperationForm: FormGroup;
  bankMaster: any[] = [];
  reportPaginationOptions: PaginationOptions = Global.resetPaginationOption();
  reportTableFilterOptions: TableFilterOptions =
  Global.resetTableFilterOptions();
  reportFilter: any = null;
  reports: any[] = [];
  sheetTemplate: any[] = _salarySheetTempMasterNew;
  sheetTemplateMaster: any[] = [];
  templateReportGenerated: boolean = false;
  sheetTemplateForm: FormGroup;
  isViewSalaryReport: boolean = false;
  selectedSheetTemplate: any;
  commomTableFilterData: any = {};
  empReportData: any[] = [];
  monthMaster: any[] = [];
  yearMaster: any[] = [];
  reportType:any="";
  filterForm: UntypedFormGroup;
  rivisionFilter:any = {};
  rivisionFilterNew:any = {};

  isViewArrearReport:any=false;
  constructor(
    private titleService: Title,
    private formBuilder: FormBuilder,
    private spinner: NgxSpinnerService,
    private companyuserService: CompanyuserService,
    private toastr: ToastrService,
    private router:Router
    ) {
  
      if (
        !Global.checkCompanyModulePermission({
          company_module: 'revision_management',
          company_sub_module:['revision_report', 'arrear_report'],
          company_sub_operation: ['view'],
          company_strict: true
        })
      ) {
        const _this = this;
        setTimeout(function () {
          _this.router.navigate(['company/errors/unauthorized-access'], {
            skipLocationChange: true,
          });
        }, 500);
        return;
      }
  
    this.tableOperationForm = formBuilder.group({
      payout_process: [null],
      payout_bankid: [null],
      report_template: null,
    });

    this.sheetTemplateForm = formBuilder.group({});
    this.filterForm = formBuilder.group({
      report_type: [null, Validators.compose([Validators.required])],

      month: [null, Validators.compose([Validators.required])],
      year: [null, Validators.compose([Validators.required])],

      department: [null],
      designation: [null],
      branch: [null],
      hod: [null],

      department_id: [null],
      designation_id: [null],
      branch_id: [null],
      hod_id: [null],
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
    this.tableOperationForm
      .get('payout_process')
      ?.valueChanges?.subscribe(async (payout_process) => {
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
        } else {
          await this.fetchSettingsTemplate();
          this.tableOperationForm.get('payout_bankid')?.clearValidators();
          this.tableOperationForm
            .get('report_template')
            ?.setValidators([Validators.required]);
        }

        this.tableOperationForm.get('payout_bankid')?.updateValueAndValidity();
        this.tableOperationForm
          .get('report_template')
          ?.updateValueAndValidity();

        this.resetCheckedRows();
      });

      this.filterForm.get('report_type')?.valueChanges?.subscribe(val => {
        if (val == 'consolidated') {
            this.filterForm.get('month')?.clearValidators()
            this.filterForm.get('year')?.clearValidators()

            $('#month-form-field')?.hide(300);
            $('#year-form-field')?.hide(300);
        } else {
            this.filterForm.get('month')?.setValidators([Validators.required])
            this.filterForm.get('year')?.setValidators([Validators.required])

            $('#month-form-field')?.show(300);
            $('#year-form-field')?.show(300);
        }

        this.filterForm.get('month')?.updateValueAndValidity()
        this.filterForm.get('year')?.updateValueAndValidity()
    })



  }

  ngOnInit() {
    this.titleService.setTitle('Salary Sheet Report - ' + Global.AppName);
    this.tableOperationForm.get('payout_process')?.setValue(false);
    this.reportType = 'monthlywages';
    this.filterForm.patchValue({
        'report_type': 'monthlywages',
        'month': this.monthMaster.find((obj: any) => {
            return obj.index == 0
            return obj.index == new Date().getMonth()
        }) ?? null,

        'year': this.yearMaster.find((obj: any) => {
            // return obj.value == 2022
            return obj.value == new Date().getFullYear()
        }) ?? null,
    })


  }

  fetchBanks({ loading = <boolean>true } = {}) {
    return new Promise((resolve, reject) => {
      if (loading == true) this.spinner.show();
      this.companyuserService
        .fetchBankSheets({
          pageno: 1,
        })
        ?.subscribe(
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

  fetchSettingsTemplate({ loading = <boolean>true } = {}) {
    return new Promise((resolve, reject) => {
      if (loading == true) this.spinner.show();
      this.sheetTemplateMaster = [];
      this.tableOperationForm.get('report_template')?.setValue('')
      this.companyuserService
        .fetchEmployeeSheetTemplates({
          pageno: 1,
          temp_module_for: 'arrear_sheet',
        })
        ?.subscribe(
          (res) => {
            if (loading == true) this.spinner.hide();

            if (res.status == 'success') {
              this.sheetTemplateMaster = res?.earning_sheet_temp?.docs ?? [];
             
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
          },
          (err) => {
            if (loading == true) this.spinner.hide();
            this.toastr.error(Global.showServerErrorMessage(err));
            this.sheetTemplateMaster = [];
            resolve(false);
          }
        );
    });
  }

  fetchEmployees({
    page = <any>null,
    loading = <boolean>true,
    filter = <any>null,
    options = <any>null
  } = {}) {
    return new Promise((resolve, reject) => {
      if (page != null) this.reportPaginationOptions.page = page;
      if (filter != null) this.reportFilter = filter;

      if (!this.reportFilter) {
        resolve(false);
        return;
      }
      this.commomTableFilterData = filter;
      console.log(options);
      
      let payload: any = {
        pageno: this.reportPaginationOptions.page,
        perpage: this.reportPaginationOptions.limit,
        wage_month: this.reportFilter?.month?.index ?? '',
        wage_year: this.reportFilter?.year?.value ?? '',
        hod_id: this.reportFilter?.hod_id ?? null,
        department_id: this.reportFilter?.department_id ?? null,
        designation_id: this.reportFilter?.designation_id ?? null,
        branch_id: this.reportFilter?.branch_id ?? null,
        bank_account: this.reportFilter?.bank_id ?? null,
        salary_type: this.reportFilter?.salary_type ?? 'salary',
        searchkey: options?.searchkey || ''
      };
      // if(payload.salary_type === 'earning')payload.salary_type ='salary';

      if (loading == true) this.spinner.show();
      this.companyuserService.getSalaryReport(payload)?.subscribe(
        (res) => {
          if (res.status == 'success') {
            var docs: any[] = res?.employees?.docs ?? [];

            docs.forEach((doc: any) => {
              doc.checked = this.isRowChecked(doc._id);
            });

            this.reports = docs;
            this.reportPaginationOptions = {
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
            if (res.status == 'val_err')
              this.toastr.error(Global.showValidationMessage(res.val_msg));
            else this.toastr.error(res.message);

            this.reports = [];
            this.reportPaginationOptions = Global.resetPaginationOption();

            this.rowCheckedAll = false;
            this.checkedRowIds = [];
            this.uncheckedRowIds = [];

            resolve(false);
          }

          if (loading == true) this.spinner.hide();
          Global.loadCustomScripts('customJsScript');
        },
        (err) => {
          this.toastr.error(
            Global.showValidationMessage(Global.showServerErrorMessage(err))
          );
          this.reports = [];
          this.reportPaginationOptions = Global.resetPaginationOption();
          this.rowCheckedAll = false;
          this.checkedRowIds = [];
          this.uncheckedRowIds = [];
          if (loading == true) this.spinner.hide();
          Global.loadCustomScripts('customJsScript');
          resolve(false);
        }
      );
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
    if (!this.rowCheckedAll)
      return this.checkedRowIds.indexOf(rowId) >= 0 ? true : false;
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
    return (
      this.rowCheckedAll == true ||
      this.checkedRowIds.length > 0 ||
      this.uncheckedRowIds.length > 0
    );
  }

  resetCheckedRows() {
    this.rowCheckedAll = false;
    this.checkedRowIds = [];
    this.uncheckedRowIds = [];

    $('.employee-table').find('#select-all').prop('checked', false);

    this.fetchEmployees();
  }

  employeeCheckBoxIsVisible(report: any): boolean {
    if (this.tableOperationForm.get('payout_process')?.value == true) {
      if (!report?.emp_uan_no) {
        return false;
      }
    }
    else if (this.tableOperationForm.get('payout_process')?.value == true) {

      if (report?.bank_ins_status!='active') {
        return false;
      }
    }

    return true;
  }

  /**
   * Generate Bank Instruction Functions
   * ------------------------------------
   */

  generateBankInstruction(event: any, instruction_type:any = '') {
    if (
      this.anyRowsChecked() &&
      this.tableOperationForm.get('payout_bankid')?.valid
    ) {
      this.spinner.show();
      this.companyuserService
        .generateRivisionInstructionNew({
          wage_month: this.reportFilter?.month?.index ?? '',
          wage_year: this.reportFilter?.year?.value ?? '',
          bank_temp_id:
            this.tableOperationForm.get('payout_bankid')?.value?._id,
          payment_for: this.reportFilter?.salary_type ?? '',
          hod_id: this.reportFilter?.hod_id ?? null,
          department_id: this.reportFilter?.department_id ?? null,
          bank_account: this.reportFilter?.bank_id ?? null,
          designation_id: this.reportFilter?.designation_id ?? null,
          branch_id: this.reportFilter?.branch_id ?? null,
          row_checked_all: this.rowCheckedAll,
          checked_row_ids: JSON.stringify(this.checkedRowIds),
          unchecked_row_ids: JSON.stringify(this.uncheckedRowIds),
          instruction_type:instruction_type,
        })
        ?.subscribe(
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

  /**
   * Template Report Generate Functions
   * -----------------------------------
   */

  async generateTemplateReport() {
    this.selectedSheetTemplate = null;
    let generatedReportTemplate =
      this.tableOperationForm.get('report_template')?.value ||
      _salarySheetTempMasterNew;

    this.selectedSheetTemplate = await this.generateTemplate(
      generatedReportTemplate
    );

    if (!this.rowCheckedAll) {
      this.empReportData = this.reports.filter((report) =>
        this.checkedRowIds.includes(report?._id)
      );
    } else {
      this.empReportData = this.reports;
    }
    this.isViewSalaryReport = true;
  }
  async generateTemplateReportNew() {
  let payload:any={
    report_type:this.filterForm?.value?.report_type,wage_month:this.reportFilter?.month?.index,
    wage_year: this.reportFilter?.year?.value,
    row_checked_all: this.rowCheckedAll.toString(),
    checked_row_ids: this.checkedRowIds,
    unchecked_row_ids: this.uncheckedRowIds,
    hod_id: this.reportFilter?.hod_id ?? '',
    department_id: this.reportFilter?.department_id ?? '',
    designation_id: this.reportFilter?.designation_id ?? '',
    branch_id: this.reportFilter?.branch_id ?? '',
    bank_account: this.reportFilter?.bank_id ?? '',
  }  
  this.isViewSalaryReport=true;
  if(payload.report_type=='monthlywages')
    {
        payload.report_type="monthly";
    }
    this.rivisionFilter=payload;

  }

  async generateArrearReport() {
    let payload:any={
      report_type:this.filterForm?.value?.report_type,wage_month:this.reportFilter?.month?.index,
      wage_year: this.reportFilter?.year?.value,
      row_checked_all: this.rowCheckedAll.toString(),
      checked_row_ids: this.checkedRowIds,
      unchecked_row_ids: this.uncheckedRowIds,
      hod_id: this.reportFilter?.hod_id ?? '',
      department_id: this.reportFilter?.department_id ?? '',
      designation_id: this.reportFilter?.designation_id ?? '',
      branch_id: this.reportFilter?.branch_id ?? '',
      bank_account: this.reportFilter?.bank_id ?? '',
    }  
    this.rivisionFilter=payload;
    this.isViewArrearReport=true;
  
  
    }


  generateTemplate(template: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (template) {
        const selectedTemplateFields =
          template?.template_fields || template || [];

        if (selectedTemplateFields.length < 1) {
          this.toastr.error('No module available for this template');
          // console.log('No module available for this template');

          return;
        }

        let tempTemplateMaster: any[] = [];
        selectedTemplateFields.forEach((selectedTemplateField: any) => {
          let tempMainModule = _salarySheetTempMasterNew.find((obj: any) => {
            return obj.main_slug == selectedTemplateField.main_slug;
          });

          if (tempMainModule) {
            let modules: any[] = [];
            (selectedTemplateField.modules ?? []).forEach(
              (selectedModule: any) => {
                let tempModule = tempMainModule.modules.find((obj: any) => {
                  return obj.module_slug == selectedModule.module_slug;
                });

                let fields: any[] = [];

                (selectedModule.fields ?? []).forEach((field: any) => {
                  let f = tempModule.fields.find((obj: any) => {
                    return obj.slug == field || obj.slug == field.slug;
                  });

                  if (f) {
                    fields.push(f);
                  }
                });

                if (fields.length > 0) {
                  modules.push({
                    module_title: tempModule.module_title,
                    module_slug: tempModule.module_slug,
                    fields: fields,
                  });
                }
              }
            );

            tempTemplateMaster.push({
              main_title: tempMainModule.main_title,
              main_slug: tempMainModule.main_slug,
              modules: modules,
            });
          }
        });

        if (tempTemplateMaster.length == 0) {
          this.toastr.error(
            'The template cannot be generated, as no module cannot be pointed'
          );
          reject(
            'The template cannot be generated, as no module cannot be pointed'
          );
        }

        resolve(tempTemplateMaster);
      } else {
        this.toastr.error('No Template Found Exception');
        reject('No Template Found Exception');
      }
    });
  }

  resetTemplateReportGeneration() {
    this.resetCheckedRows();
    this.templateReportGenerated = false;
  }

  template_fields: any[] = [];

  templateForm: FormGroup = new FormGroup({
    template_name: new UntypedFormControl(
      null,
      Validators.compose([Validators.required])
    ),
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
        { label: 'Total ESIC Bucket', value: 'total_esic_bucket' },
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
        {
          label: 'Total Employer Contribution',
          value: 'total_employer_contribution',
        },
        {
          label: 'Employer PF Contribution',
          value: 'emoloyer_pf_contribution',
        },
        {
          label: 'Employer EPS Contribution',
          value: 'emoloyer_eps_contribution',
        },
        {
          label: 'Employer EDLIS Contribution',
          value: 'emoloyer_edlis_contribution',
        },
        {
          label: 'Employer EPF Admin Contribution',
          value: 'emoloyer_epf_admin_contribution',
        },
        {
          label: 'Employer EDLIS Admin Contribution',
          value: 'emoloyer_edlis_admin_contribution',
        },
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

  // resetSelectedModules() {
  //   this.customFieldTemplate.forEach((row: any) => {
  //     $('input[name="fields[' + row.section + ']"]:checked').each(function () {
  //       $(this).prop('checked', false);
  //     });
  //   });
  // }

  resetSelectedModules() {
    this.sheetTemplate[0]?.modules?.forEach((module: any) => {
      if (
        !this.isDefaultChecked(module.module_slug, [
          'personal_details',
          'master_breakup',
          'breakup',
        ])
      ) {
        $('input[name="fields[' + module.module_slug + ']"]:checked').each(
          function () {
            $(this).prop('checked', false);
          }
        );
      }
    });
    this.sheetTemplate[1]?.modules?.forEach((module: any) => {
      if (
        !this.isDefaultChecked(module.module_slug, [
          'personal_details',
          'master_breakup',
          'breakup',
        ])
      ) {
        $('input[name="fields[' + module.module_slug + ']"]:checked').each(
          function () {
            $(this).prop('checked', false);
          }
        );
      }
    });
    this.sheetTemplate[2]?.modules?.forEach((module: any) => {
      if (
        !this.isDefaultChecked(module.module_slug, [
          'personal_details',
          'master_breakup',
          'breakup',
        ])
      ) {
        $('input[name="fields[' + module.module_slug + ']"]:checked').each(
          function () {
            $(this).prop('checked', false);
          }
        );
      }
    });
    this.sheetTemplate[3]?.modules?.forEach((module: any) => {
      if (
        !this.isDefaultChecked(module.module_slug, [
          'personal_details',
          'master_breakup',
          'breakup',
        ])
      ) {
        $('input[name="fields[' + module.module_slug + ']"]:checked').each(
          function () {
            $(this).prop('checked', false);
          }
        );
      }
    });
    this.sheetTemplate[4]?.modules?.forEach((module: any) => {
      if (
        !this.isDefaultChecked(module.module_slug, [
          'personal_details',
          'master_breakup',
          'breakup',
        ])
      ) {
        $('input[name="fields[' + module.module_slug + ']"]:checked').each(
          function () {
            $(this).prop('checked', false);
          }
        );
      }
    });

    // this.customFieldTemplate.forEach((row: any) => {
    //   $('input[name="fields[' + row.section + ']"]:checked').each(function () {
    //     $(this).prop('checked', false);
    //   });
    // });
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

  async createSheetTemplate(e: any) {
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
        temp_module_for: 'arrear_sheet',
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

  async updateSheetTemplate(e: any) {
    this.templateForm.markAllAsTouched();
    setTimeout(() => {
      Global.scrollToQuery('p.text-danger');
    }, 300);
    let modules: any = await this.getSelecteModules();
    if (!Object.keys(modules).length)
      throw this.toastr.error('Please select atleast one field');
    if (this.templateForm.valid) {
      let body = {
        template_id: this.tableOperationForm.get('report_template')?.value?._id,
        template_name: this.templateForm.value.template_name,
        template_fields: JSON.stringify(modules),
        temp_module_for: 'arrear_sheet',
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

  // map selected module in custom template

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

      resolve(masterModules);
    });
  }

  cancelTemplateCreate() {
    $('#settingsTemplateModal')?.find('[data-dismiss="modal"]')?.click();
    Global.resetForm(this.templateForm);
    this.resetSelectedModules();
  }

  /**
   * ============================
   * EXCEL EXPORT FUNCTIONS
   * ============================
   */

  getReportPayload() {
    let payload: any = {
      wage_month: this.reportFilter.month?.index ?? '',
      wage_year: this.reportFilter.year?.value ?? '',
      row_checked_all: this.rowCheckedAll.toString(),
      checked_row_ids: JSON.stringify(this.checkedRowIds),
      unchecked_row_ids: JSON.stringify(this.uncheckedRowIds),
      hod_id: this.reportFilter?.hod_id ?? '',
      department_id: this.reportFilter?.department_id ?? '',
      designation_id: this.reportFilter?.designation_id ?? '',
      branch_id: this.reportFilter?.branch_id ?? '',
      bank_account: this.reportFilter?.bank_id ?? '',

    };
    return payload;
  }

  async excelExport() {
    try {
      if (this.reports.length > 0) {
        this.spinner.show();
        let payload = this.getReportPayload();
        await this.companyuserService.downloadFile(
          'export-master-sheet-data',
          'master-sheet-data',
          payload
        );

        
        // this.companyuserService.exportMasterSheet(payload)?.subscribe(
        //   (res: any) => {
        //     if (res.status == 'success') {
        //       window.open(res.url);
        //     } else {

        //     }
            
        //   },
        //   (err: any) => {
        //     this.toastr.error(Global.showServerErrorMessage(err));
        //     this.spinner.hide();
        //   }
        //   );
        }
        
      } catch (err:any) {
        this.spinner.hide();
        this.toastr.error(err.message);
    }
  }

  cancelExcelExport() {
    this.isViewSalaryReport = false;
    this.selectedSheetTemplate = null;
    this.empReportData = [];
  }

  async generateEmployeePayslip(e: any) {
    try {
      this.spinner.show();
      let payload = this.getReportPayload();
      // let model = {
      //   emp_ids: JSON.parse(payload.checked_row_ids),
      //   wage_month: payload.wage_month,
      //   wage_year:payload.wage_year,
      // };
      let resp = await this.companyuserService
        .generateEmployeePayslip(payload)
        ?.toPromise();

      if (resp.status !== 'success') throw resp;
      this.spinner.hide();
      return this.toastr.success(resp.message);
    } catch (err: any) {
      this.spinner.hide();
      if (err.status == 'val_err') {
        return this.toastr.error(Global.showValidationMessage(err.val_msg));
      }
      return this.toastr.error(err?.message || err);
    }
  }
  cancell()
  {
    this.reportType = 'monthlywages';
    this.filterForm.patchValue({
        'report_type': 'monthlywages',
        'month': this.monthMaster.find((obj: any) => {
            return obj.index == 0
            return obj.index == new Date().getMonth()
        }) ?? null,

        'year': this.yearMaster.find((obj: any) => {
            // return obj.value == 2022
            return obj.value == new Date().getFullYear()
        }) ?? null,
    })
    this.isViewSalaryReport=false;
    this.isViewArrearReport=false;

    this.fetchEmployees();

  }

  isSheetTemplateEdit:Boolean = false;
  openSettingsTemplateModal() {
    let selectedTempate = this.tableOperationForm.get('report_template')?.value;
  // console.log(selectedTempate);
    
    if (Array.isArray(selectedTempate))
      selectedTempate.length ? null : (selectedTempate = null);
    if (selectedTempate) {
      this.isSheetTemplateEdit = true
      this.cancelTemplateCreate();
      this.templateForm.get("template_name")?.setValue(selectedTempate?.template_name)
      selectedTempate?.template_fields[0]?.modules?.forEach((module: any) => {
        module?.fields.forEach((field: any) => {
          const el: any = document.getElementById(
            selectedTempate?.template_fields[0]?.main_slug +
              '-' +
              module.module_slug +
              '-' +
              field
          );
          if (el) {
            el.checked = true;
          }
        });
      });

      selectedTempate?.template_fields[1]?.modules?.forEach((module: any) => {
        module?.fields.forEach((field: any) => {
          const el: any = document.getElementById(
            selectedTempate?.template_fields[1]?.main_slug +
              '-' +
              module.module_slug +
              '-' +
              field
          );
          if (el) {
            el.checked = true;
          }
        });
      });

      selectedTempate?.template_fields[2]?.modules?.forEach((module: any) => {
        module?.fields.forEach((field: any) => {
          const el: any = document.getElementById(
            selectedTempate?.template_fields[2]?.main_slug +
              '-' +
              module.module_slug +
              '-' +
              field
          );
          if (el) {
            el.checked = true;
          }
        });
      });

      selectedTempate?.template_fields[3]?.modules?.forEach((module: any) => {
        module?.fields.forEach((field: any) => {
          const el: any = document.getElementById(
            selectedTempate?.template_fields[3]?.main_slug +
              '-' +
              module.module_slug +
              '-' +
              field
          );
          if (el) {
            el.checked = true;
          }
        });
      });

      selectedTempate?.template_fields[4]?.modules?.forEach((module: any) => {
        module?.fields.forEach((field: any) => {
          const el: any = document.getElementById(
            selectedTempate?.template_fields[4]?.main_slug +
              '-' +
              module.module_slug +
              '-' +
              field
          );
          if (el) {
            el.checked = true;
          }
        });
      });
    }else{
      this.cancelTemplateCreate()
      this.isSheetTemplateEdit = false
    }
    
    $('#TemplateModalOpen').click();
  }
}
