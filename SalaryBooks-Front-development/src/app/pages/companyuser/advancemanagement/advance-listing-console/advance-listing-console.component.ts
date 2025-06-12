import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { _advanceReportTempMasterNew } from '../../report/_advanceReportTempMaster';
import * as Global from '../../../../globals';
import {
  UntypedFormGroup,
  UntypedFormControl,
  FormBuilder,
  FormGroup,
  Validators,
  FormControl,
} from '@angular/forms';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { CompanyuserService } from 'src/app/services/companyuser.service';
import PaginationOptions from 'src/app/models/PaginationOptions';
import TableFilterOptions from 'src/app/models/TableFiilterOptions';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';

@Component({
  selector: 'app-advance-listing-console',
  templateUrl: './advance-listing-console.component.html',
  styleUrls: ['./advance-listing-console.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class CMPAdvanceListingConsoleComponent implements OnInit {
  reportGenerated:any;
  selectedSheetTemplate:any;
  advanceReportData:any;
  isViewReport:boolean = false;
  templateForm: UntypedFormGroup = new UntypedFormGroup({
    template_name: new UntypedFormControl(null, Validators.required),
  });

  Global = Global;
  sheetTemplate: any[] = _advanceReportTempMasterNew;
  template_fields: any[] = [];
  bankMaster: any[] = [];
  sheetTemplateMaster: any[] = [];
  tableOperationForm: FormGroup;
  employeePaginationOptions: PaginationOptions = Global.resetPaginationOption();
  employeeTableFilterOptions: TableFilterOptions =
    Global.resetTableFilterOptions();
  employeeFilter: any = null;
  employees: any[] = [];
  filterForm: FormGroup = new FormGroup({
    wage_month: new FormControl(),
    wage_year: new FormControl(),
  });
  yearMaster: any = [];
  monthMaster: any[] = Global.monthMaster;

  constructor(
    private spinner: NgxSpinnerService,
    private companyuserService: CompanyuserService,
    private toastr: ToastrService,
    private titleService: Title,
    private formBuilder: FormBuilder,
    private router:Router
  ) {
    if (
      !Global.checkCompanyModulePermission({
        company_module: 'advance',
        company_sub_module: 'advance_report',
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
      report_template: [null, Validators.compose([Validators.required])],
    });

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
  }

  ngOnInit() {
    this.titleService.setTitle('Advance Listing Console - ' + Global.AppName);
    this.tableOperationForm.get('payout_process')?.setValue(false);
    this.fetchSettingsTemplate();
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

  getPayload() {
    let payload: any = {
      row_checked_all: this.rowCheckedAll,
      checked_row_ids: JSON.stringify(this.checkedRowIds),
      unchecked_row_ids: JSON.stringify(this.uncheckedRowIds),
      hod_id: this.employeeFilter?.hod_id ?? '',
      department_id: this.employeeFilter?.department_id ?? '',
      bank_account: this.employeeFilter?.bank_id ?? '',
      designation_id: this.employeeFilter?.designation_id ?? '',
      branch_id: this.employeeFilter?.branch_id ?? '',
      wage_month_from: this.employeeFilter?.wage_month_from ?? '',
      wage_month_to: this.employeeFilter?.wage_month_to ?? '',
      wage_year_from: this.employeeFilter?.wage_year_from ?? '',
      wage_year_to: this.employeeFilter?.wage_year_to ?? '',
      pageno: this.employeePaginationOptions.page,
      searchkey: this.employeeTableFilterOptions.searchkey,
      perpage: this.employeePaginationOptions.limit,
      list_type: 'report',
    };
    return payload;
  }

  async fetchEmployees() {
    try {
      this.spinner.show();

      let payload = this.getPayload() || {};
      if(!payload.wage_month_from && !payload.wage_month_to && !payload.wage_year_from && !payload.wage_year_to) return
      if(this.tableOperationForm.get('payout_process')?.value === true){
        payload.list_type = 'payout';
        payload.wage_month = this.filterForm.get("wage_month")?.value?.index ?? '';
        payload.wage_year = this.filterForm.get("wage_year")?.value?.value ?? '';
      }


      let res = await this.companyuserService
        .getAdvanceListing(payload)
        ?.toPromise();

      if (res) {
        if (res.status !== 'success') throw res;
        this.employees = res?.employees?.docs;
        this.spinner.hide();

        this.employees.forEach((doc: any) => {
          doc.checked = this.isRowChecked(doc._id);
        });
      }
    } catch (err: any) {
      if (err.status == 'val_err') {
        this.spinner.hide();

        this.toastr.error(Global.showValidationMessage(err.val_msg));
      } else {
        this.spinner.hide();

        this.toastr.error(Global.showServerErrorMessage(err));
        // this.toastr.error(err.message);
      }
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
      if (report?.advance_report?.bank_ins_referance_id) {
        return false;
      }
    }

    return true;
  }

  /**
   * Generate Bank Instruction Functions
   * ------------------------------------
   */

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
        temp_module_for: 'advance_sheet',
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
        temp_module_for: 'advance_sheet',
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

  fetchSettingsTemplate() {
    return new Promise((resolve, reject) => {
      this.sheetTemplateMaster = [];
      this.tableOperationForm.get('report_template')?.setValue('')

      this.spinner.show();
      this.companyuserService
        .fetchEmployeeSheetTemplates({
          pageno: 1,
          temp_module_for: 'advance_sheet',
        })
        ?.subscribe(
          (res) => {
            this.spinner.hide();
            if (res.status == 'success') {
              this.sheetTemplateMaster = res?.earning_sheet_temp?.docs ?? [];
              this.sheetTemplateMaster.push({template_name:"Form 22-Advance Register", default:true})
              this.tableOperationForm.get('report_template')?.setValue(this.sheetTemplateMaster.find((temp:any) => temp.template_name == 'Master Sheet'))

              resolve(true);
            } else if (res.status == 'val_err') {
              this.toastr.error(Global.showValidationMessage(res.val_msg));
              reject(Global.showValidationMessage(res.val_msg));
            } else {
              this.toastr.error(res.message);
              reject(res.message);
            }
          },
          (err) => {
            this.spinner.hide();
            this.toastr.error(Global.showServerErrorMessage(err));
            reject(Global.showServerErrorMessage(err));
          }
        );
    });
  }

  cancelTemplateCreate() {
    $('#settingsTemplateModal')?.find('[data-dismiss="modal"]')?.click();
    Global.resetForm(this.templateForm);
    this.resetSelectedModules();
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

    /**
   * Generate Bank Instruction Functions
   * ------------------------------------
   */

    generateBankInstruction(event: any, isVoucher:boolean = false) {
      if (
        this.anyRowsChecked() &&
        this.tableOperationForm.get('payout_bankid')?.valid
      ) {
        this.spinner.show();
        this.companyuserService
          .generateAdvanceBankInstruction({
            wage_month: this.filterForm.get("wage_month")?.value?.index ?? '',
            wage_year: this.filterForm.get("wage_year")?.value?.value ?? '',
            bank_temp_id:
              this.tableOperationForm.get('payout_bankid')?.value?._id,
            payment_for: 'advance',
            hod_id: this.employeeFilter?.hod_id ?? null,
            department_id: this.employeeFilter?.department_id ?? null,
            bank_account: this.employeeFilter?.bank_id ?? null,
            designation_id: this.employeeFilter?.designation_id ?? null,
            branch_id: this.employeeFilter?.branch_id ?? null,
            row_checked_all: this.rowCheckedAll,
            checked_row_ids: JSON.stringify(this.checkedRowIds),
            unchecked_row_ids: JSON.stringify(this.uncheckedRowIds),
            instruction_type:isVoucher ? 'voucher' : ''
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

    async generateTemplateReport() {
      if(this.tableOperationForm.get('report_template')?.invalid) return;
      let res;
      this.selectedSheetTemplate = [];
      let generatedReportTemplate =  this.tableOperationForm.get('report_template')?.value;

      let payload = this.getPayload()
      payload.list_type = 'report_view'

      if(generatedReportTemplate.template_name == 'Form C'){
        delete payload.wage_month_from
        delete payload.wage_month_to
        delete payload.wage_year_from
        delete payload.wage_month_to

        payload.wage_month = this.filterForm.get("wage_month")?.value?.index ?? '';
        payload.wage_year = this.filterForm.get("wage_year")?.value?.value ?? '';

        res = await this.companyuserService.fetchAdvanceFormCReport(payload)?.toPromise();
      }else if(generatedReportTemplate.template_name == 'Form 22-Advance Register'){
        delete payload.wage_month_from
        delete payload.wage_month_to
        delete payload.wage_year_from
        delete payload.wage_month_to

        payload.wage_month = this.filterForm.get("wage_month")?.value?.index ?? '';
        payload.wage_year = this.filterForm.get("wage_year")?.value?.value ?? '';
        res = await this.companyuserService.fetchAdvanceRegisterReport(payload)?.toPromise();
        
      }else{
        this.selectedSheetTemplate = await this.generateTemplate(generatedReportTemplate);
          
        res = await this.companyuserService.getAdvanceListing(payload)?.toPromise();
      }


      if(res.status == 'success'){
        this.companyuserService.setPrintDoc({
          templateName:this.tableOperationForm.get("report_template")?.value?.template_name,
          generatedReportTemplate: this.selectedSheetTemplate[0] ??  null,
          employees: res?.employees?.docs,
          company: res?.company_name ??  null,
        });
        this.advanceReportData = res?.master_data;
        this.isViewReport = true;
      }
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
            let tempMainModule = _advanceReportTempMasterNew.find((obj: any) => {
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

    cancelGenerateReport() {
      this.isViewReport = false;
      this.selectedSheetTemplate = [];
      this.resetCheckedRows();
    }

    async downloadExcelReport(e: any) {
      try {
      let payload = this.getPayload();
      let generatedReportTemplate = this.tableOperationForm.get('report_template')?.value
      payload.template_id = generatedReportTemplate?._id;
      payload.generate = "excel";
      if(generatedReportTemplate.template_name == 'Form 22-Advance Register' || generatedReportTemplate.template_name == 'Form C' ){
        delete payload.wage_month_from
        delete payload.wage_month_to
        delete payload.wage_year_from
        delete payload.wage_month_to
        
        payload.wage_month = this.filterForm.get("wage_month")?.value?.index ?? '';
        payload.wage_year = this.filterForm.get("wage_year")?.value?.value ?? '';
        // res = await this.companyuserService.fetchAdvanceRegisterReport(payload)?.toPromise();
        if(generatedReportTemplate.template_name == 'Form 22-Advance Register'){
          await this.companyuserService.downloadFile('advance-register-report','advance-register-report', payload);
        }else{
          await this.companyuserService.downloadFile('advance-form-c','advance-form-c-report', payload);
        }
        
      } else{
        await this.companyuserService.downloadFile('advance_report_excel_export','advance-report', payload);
      }
        // let res = await this.companyuserService
        //   .exportAdvanceReportExcel(payload)
        //   ?.toPromise();
        // if (res.status !== 'success') throw res;

        this.fetchEmployees();
      this.cancelGenerateReport()

      } catch (err: any) {
        e.target.classList.remove('btn-loading');
        if (err.status == 'val_err') {
          this.toastr.error(Global.showValidationMessage(err.val_msg));
        } else {
          this.toastr.error(Global.showServerErrorMessage(err));
          // this.toastr.error(err.message);
        }
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
