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
  selector: 'app-tds-report-listing',
  templateUrl: './tds-report-listing.component.html',
  styleUrls: ['./tds-report-listing.component.css'],

})
export class CMPTdsReportListingComponent implements OnInit {

  isProcessPayout:boolean = false
  Global = Global;
  tableOperationForm: FormGroup;
  bankMaster: any[] = [];
  sheetTemplateMaster: any[] = [];
 
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
        company_module: 'tds_management',
        company_operation: 'tds_report',
        company_sub_module:['tds_report'],
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
  fetchSettingsTemplate({ loading = <boolean>true } = {}) {
    this.sheetTemplateMaster.push({template_name:'TDS Report Custom',report_type:'tds-report-custom'});
    this.sheetTemplateMaster.push({template_name:'Form 16 A',report_type:'form-sixteen-a'});
    this.sheetTemplateMaster.push({template_name:'Form 16 B',report_type:'form-sixteen-b'});
    // return new Promise((resolve, reject) => {
    //   if (loading == true) this.spinner.show();

    //   this.companyuserService
    //     .fetchEmployeeSheetTemplates({
    //       pageno: 1,
    //       temp_module_for: 'overtime_sheet',
    //     })
    //     .subscribe(
    //       (res) => {
    //         if (loading == true) this.spinner.hide();

    //         if (res.status == 'success') {
    //           this.sheetTemplateMaster = res?.earning_sheet_temp?.docs ?? [];
    //           this.sheetTemplateMaster.push({template_name:'Form IV - OT Register For Workers',report_type:'form-four'});
    //           this.sheetTemplateMaster.push({template_name:'OT Register (CLRA) Form 23',report_type:'form-twenty-three'});
    //           this.sheetTemplateMaster.push({template_name:'OT Individual Report',report_type:'individual-report'});

    //           resolve(true);
    //         } else if (res.status == 'val_err') {
    //           this.sheetTemplateMaster = [];
    //           this.toastr.error(Global.showValidationMessage(res.val_msg));
    //           resolve(false);
    //         } else {
    //           this.sheetTemplateMaster = [];
    //           this.toastr.error(res.message);
    //           resolve(false);
    //         }
    //       },
    //       (err) => {
    //         if (loading == true) this.spinner.hide();
    //         this.toastr.error(Global.showServerErrorMessage(err));
    //         this.sheetTemplateMaster = [];
    //         resolve(false);
    //       }
    //     );
    // });
  }



  fetchtdsListing({
    page = <any>null,
    loading = <boolean>true,
    filter = <any>null,
    reportGeneration = <boolean>false,
    options = <any>null
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
        wage_month_from: this.employeeFilter?.wage_month_from,
        wage_year_from: this.employeeFilter?.wage_year_from,
        wage_month_to: this.employeeFilter?.wage_month_to,
        wage_year_to: this.employeeFilter?.wage_year_to,
        hod_id: this.employeeFilter?.hod_id ?? null,
        department_id: this.employeeFilter?.department_id ?? null,
        designation_id: this.employeeFilter?.designation_id ?? null,
        searchkey: options?.searchkey ?? '',
        branch_id: this.employeeFilter?.branch_id ?? null,
        row_checked_all:false,
        checked_row_ids:[],
        unchecked_row_ids:[],
      };

    
      if (loading == true) this.spinner.show();
      this.companyuserService.gettdsConsole(payload).subscribe(
        (res) => {
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
    this.fetchtdsListing();

   
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
    this.fetchtdsListing();
   
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
   * Custom Template Functions
   * -----------------------------
   */

  template_fields: any[] = [];
  sheetTemplate: any[] = _overtimeReportTempMasterNew;

  templateForm: UntypedFormGroup = new UntypedFormGroup({
    template_name: new UntypedFormControl(null, Validators.required),
  });


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
  }

  /**
   * Report Generation Functions
   * ---------------------------
   */

  reportGenerated: boolean = false;
  generatedReportTemplate: any[] = [];
  

  async generateReportNew() {
  this.report_type=this.tableOperationForm.value?.report_template?.report_type ?? "tds-report-custom"; 
  this.reportFilter = {
   
    wage_month_from: this.employeeFilter?.wage_month_from,
    wage_year_from: this.employeeFilter?.wage_year_from,
    wage_month_to: this.employeeFilter?.wage_month_to,
    wage_year_to: this.employeeFilter?.wage_year_to,
    hod_id: this.employeeFilter?.hod_id ?? null,
    department_id: this.employeeFilter?.department_id ?? null,
    designation_id: this.employeeFilter?.designation_id ?? null,
    branch_id: this.employeeFilter?.branch_id ?? null,
    row_checked_all:this.rowCheckedAll.toString(),
    checked_row_ids:this.checkedRowIds,
    unchecked_row_ids:this.uncheckedRowIds,
  };
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

  
  
}
