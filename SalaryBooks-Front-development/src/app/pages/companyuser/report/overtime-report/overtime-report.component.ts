import { Component, OnInit,ViewEncapsulation } from '@angular/core';
import {
  UntypedFormGroup,
  UntypedFormControl,
  FormGroup,
  FormBuilder,
  Validators,
  FormControl,
} from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import * as Global from 'src/app/globals';
import PaginationOptions from 'src/app/models/PaginationOptions';
import TableFilterOptions from 'src/app/models/TableFiilterOptions';
import { CompanyuserService } from 'src/app/services/companyuser.service';
import { _incentiveReportTempMasterNew } from '../../report/_incentiveReportTempMaster';
import { _overtimeReportTempMasterNew } from '../_overtimeReportTempMaster';
import * as moment from 'moment';
import { Router } from '@angular/router';


@Component({
  selector: 'app-overtime-report',
  templateUrl: './overtime-report.component.html',
  styleUrls: ['./overtime-report.component.css'],
  encapsulation: ViewEncapsulation.None

})
export class CMPOvertimeReportComponent implements OnInit {

  isProcessPayout:boolean = false
  Global = Global;
  tableOperationForm: FormGroup;
  bankMaster: any[] = [];
  sheetTemplateMaster: any[] = [];
  reprtTemplateMaster:any=[
    {value:'form-twentythree',description:'OT Register (CLRA) Form 23'},
    {value:'form-four',description:'Form IV - OT Register For Workers'},
    {value:'ot-individual',description:'OT Individual Report'},


];
reportFilter:any={};
reportFilterInd:any={};

  employeePaginationOptions: PaginationOptions = Global.resetPaginationOption();
  employeeTableFilterOptions: TableFilterOptions =
    Global.resetTableFilterOptions();
  employeeFilter: any = null;
  employees: any[] = [];
  monthMaster: any[] = Global.monthMaster;
  yearMaster: any[] = [];

  filterForm:FormGroup = new FormGroup({
    wage_month: new FormControl(),
    wage_year: new FormControl()
  })
  report_type:any = ""
  instruction_type:any="";
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
          company_module: 'over_time',
          company_sub_module: 'ot_report',
          company_sub_operation: ['view'],
          company_strict: true,
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

    let currentYear = new Date().getFullYear();
    this.yearMaster = [];
    for (let index = 4; index >= 0; index--) {
      this.yearMaster.push({
        value: currentYear - index,
        description: currentYear - index,
      });
    }


    this.tableOperationForm = formBuilder.group({
      payout_process: [null],
      payout_bankid: [null],
      report_template: [null],
    });

    this.tableOperationForm
      .get('payout_process')
      ?.valueChanges.subscribe(async (payout_process) => {
        this.tableOperationForm.patchValue({report_template:null})

        this.isProcessPayout = payout_process;

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
  }

  ngOnInit() {
    this.titleService.setTitle('Overtime Sheet Report - ' + Global.AppName);
    this.tableOperationForm.get('payout_process')?.setValue(false);

    this.fetchSettingsTemplate();

    setTimeout(() => {
      let current=new Date();
      this.filterForm.patchValue({
        wage_month: this.monthMaster.find((obj: any) => {
          return obj.index == current.getMonth();
        }),
        wage_year: this.yearMaster.find((obj: any) => {
          return obj.value == current.getFullYear();
        }),

      });
  })
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

  fetchSettingsTemplate({ loading = <boolean>true } = {}) {
    return new Promise((resolve, reject) => {
      if (loading == true) this.spinner.show();
      this.sheetTemplateMaster = [];
      this.tableOperationForm.get('report_template')?.setValue('')
      this.companyuserService
        .fetchEmployeeSheetTemplates({
          pageno: 1,
          temp_module_for: 'overtime_sheet',
        })
        .subscribe(
          (res) => {
            if (loading == true) this.spinner.hide();

            if (res.status == 'success') {
              this.sheetTemplateMaster = res?.earning_sheet_temp?.docs ?? [];
              this.sheetTemplateMaster.push({template_name:'Form IV - OT Register For Workers',report_type:'form-four', default:true});
              this.sheetTemplateMaster.push({template_name:'OT Register (CLRA) Form 23',report_type:'form-twenty-three', default:true});
              this.sheetTemplateMaster.push({template_name:'OT Individual Report',report_type:'individual-report', default:true});

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



  fetchOvertimeListing({
    page = <any>null,
    loading = <boolean>true,
    filter = <any>null,
    options = <any>null,
    reportGeneration = <boolean>false,
  } = {}) {

    return new Promise((resolve, reject) => {
      if (this.reportGenerated == true) this.cancelGenerateReport();
      if (page != null) this.employeePaginationOptions.page = page;
      if (filter != null) this.employeeFilter = filter;

      if (!this.employeeFilter) {
        resolve(false);
        return;
      }
      let payload: any = {
        pageno: this.employeePaginationOptions.page,
        perpage: this.employeePaginationOptions.limit,
        wage_month_from: this.employeeFilter.month?.index,
        wage_year_from: this.employeeFilter.year?.value,
        wage_month_to: this.employeeFilter.month?.index,
        wage_year_to: this.employeeFilter.year?.value,
        hod_id: this.employeeFilter?.hod_id ?? null,
        department_id: this.employeeFilter?.department_id ?? null,
        searchkey: options?.searchkey ?? '',
        designation_id: this.employeeFilter?.designation_id ?? null,
        branch_id: this.employeeFilter?.branch_id ?? null,
        bank_account: this.employeeFilter?.bank_id ?? null,

      };

      if (reportGeneration == true) {
        payload.row_checked_all = this.rowCheckedAll;
        payload.checked_row_ids = JSON.stringify(this.checkedRowIds);
        payload.unchecked_row_ids = JSON.stringify(this.uncheckedRowIds);
      }

      if (loading == true) this.spinner.show();
      this.companyuserService.getOvertimeReport(payload).subscribe(
        (res) => {
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
        },
        (err) => {
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

    if(this.isProcessPayout){
      this.fetchOvertimeListing();
    }else{
      this.fetchOvertimeListing();
    }
  }

  anyRowsChecked(): boolean {
    return (
      this.rowCheckedAll == true ||
      this.checkedRowIds.length > 0 ||
      this.uncheckedRowIds.length > 0
    );
  }
  anytplChecked(): boolean {
    return (
      (this.rowCheckedAll == true ||
      this.checkedRowIds.length > 0 ||
      this.uncheckedRowIds.length > 0) && this.tableOperationForm.value?.report_template!=null && this.tableOperationForm.value?.report_template!=''
    );
  }

  resetCheckedRows() {
    this.rowCheckedAll = false;
    this.checkedRowIds = [];
    this.uncheckedRowIds = [];

    $('.employee-table').find('#select-all').prop('checked', false);

    if(this.isProcessPayout){
      this.fetchOvertimeListing();
    }else{
      this.fetchOvertimeListing();
    }
  }

  employeeCheckBoxIsVisible(report: any): boolean {
    if (this.tableOperationForm.get('payout_process')?.value == true) {
      if (!report?.UAN_no || report?.ot_report?.bank_ins_referance_id) {
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
    if (
      this.anyRowsChecked() &&
      this.tableOperationForm.get('payout_bankid')?.valid
    ) {
      this.spinner.show();
      this.companyuserService
        .generateBankInstruction({
          wage_month: this.employeeFilter?.month?.index ?? '',
          wage_year: this.employeeFilter?.year?.value ?? '',
          bank_temp_id:
            this.tableOperationForm.get('payout_bankid')?.value?._id,
          payment_for: 'ot',
          hod_id: this.employeeFilter?.hod_id ?? null,
          department_id: this.employeeFilter?.department_id ?? null,
          designation_id: this.employeeFilter?.designation_id ?? null,
          branch_id: this.employeeFilter?.branch_id ?? null,
          bank_account: this.employeeFilter?.bank_id ?? null,
          row_checked_all: this.rowCheckedAll.toString(),
          checked_row_ids: (this.checkedRowIds),
          unchecked_row_ids: (this.uncheckedRowIds),
          instruction_type:this.instruction_type
        })
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

  /**
   * Custom Template Functions
   * -----------------------------
   */

  template_fields: any[] = [];
  sheetTemplate: any[] = _overtimeReportTempMasterNew;

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

  isDefaultChecked(match: string, options: string[]): boolean {
    if (options.includes(match)) return true;
    return false;
  }

  perventUnCheck(e: any) {
    e.preventDefault();
    e.stopPropagation();
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
        temp_module_for: 'overtime_sheet',
      };

      e.target.classList.add('btn-loading');
      // console.log(body);

      this.companyuserService.createEmployeeSheetTemplate(body).subscribe(
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
        temp_module_for: 'overtime_sheet',
      };

      e.target.classList.add('btn-loading');
      // console.log(body);

      this.companyuserService.updateEmployeeSheetTemplate(body).subscribe(
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
 

  async generateReportNew() {
  this.report_type=this.tableOperationForm.value?.report_template?.report_type ?? "custom"; 
  this.reportFilter={
    unchecked_row_ids:this.uncheckedRowIds,row_checked_all:this.rowCheckedAll.toString(),checked_row_ids:this.checkedRowIds,
    wage_month:this.employeeFilter.month?.index,wage_year:this.employeeFilter.year?.value,
    template_fields:this.tableOperationForm.value?.report_template,template_id:this.tableOperationForm.value?.report_template?._id ?? null
  }  
   this.reportGenerated=true;
  }

  cancelGenerateReport() {
    this.reportGenerated = false;
    this.generatedReportTemplate = [];
    this.report_type="";
    this.tableOperationForm.patchValue({report_template:null})
    this.resetCheckedRows();
  }

  getReportTdValue(employee: any, field: any) {
    if (field.mapping) {
      if (Array.isArray(field.mapping)) {
        let value = '';
        field.mapping.forEach((mapping: any) => {
          value += this.getMappingValue(mapping, employee) + ' ';
        });

        return value;
      } else {
        return this.getMappingValue(field.mapping, employee);
      }
    } else {
      return null;
    }
  }

  getMappingValue(mappingValue: string, obj: any) {
    let mapping = mappingValue.split('.');
    if (mapping.length > 0) {
      let value = obj;
      mapping.forEach((key: any) => {
        if (value !== null && value !== undefined) {
          value = value[key] ?? null;
        }
      });

      return value ?? null;
    } else {
      return null;
    }
  }

  formatOvertimeType(data:any){
   return data.split("_")[0]
  }
  redirectIndividual(item:any,sl_no:any='')
  {
    this.reportFilter={
      unchecked_row_ids:[],row_checked_all:"false",checked_row_ids:[item],
      wage_month:this.employeeFilter.month?.index,wage_year:this.employeeFilter.year?.value,sl_no:sl_no
    }  
    this.report_type='individual-report';
    this.tableOperationForm.patchValue({report_type:'individual-report'});

    
  }
  redirectformFour(item:any,sl_no:any='')
  {
    this.reportFilter={
      unchecked_row_ids:[],row_checked_all:"false",checked_row_ids:[item],
      wage_month:this.employeeFilter.month?.index,wage_year:this.employeeFilter.year?.value,sl_no:sl_no
    }  
    
    this.tableOperationForm.patchValue({report_type:'form-twenty-three'});

    this.report_type='form-four';

  }
  cancellIndividual(ev:any)
  {
    this.reportGenerated = false;
    this.generatedReportTemplate = [];
    this.report_type="";
    this.tableOperationForm.patchValue({report_template:null})
    this.resetCheckedRows();
    this.fetchOvertimeListing();
  }

  async downloadRegisterReport() {
    try {
      if(! Object.keys(this.reportFilter).length) return
      this.spinner.show()
      let payload:any={};
      payload.row_checked_all = this.reportFilter.row_checked_all,
      payload.checked_row_ids = this.reportFilter.checked_row_ids,
      payload.unchecked_row_ids = this.reportFilter.unchecked_row_ids,
      payload.wage_month = this.reportFilter.wage_month,
      payload.wage_year = this.reportFilter.wage_year,
      payload.generate = 'excel';
      await this.companyuserService.downloadFile('get-register-overtime-data', `register-overtime-report-${payload.wage_month}-${payload.wage_year}`, payload);
    } catch (err:any) {
      this.toastr.error(err.message || err)
    } finally {
      this.spinner.hide()
    }
    // http://dev8.ivantechnology.in/payroll/payroll_backend/company/download-payslip-data
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
