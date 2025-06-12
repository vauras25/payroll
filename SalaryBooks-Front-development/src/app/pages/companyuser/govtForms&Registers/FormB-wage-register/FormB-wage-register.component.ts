import { Component, OnInit } from '@angular/core';
import { _salarySheetTempMasterNew } from '../../report/_salarySheetTempMaster';
import { CompanyuserService } from 'src/app/services/companyuser.service';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Title } from 'chart.js';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import * as Global from 'src/app/globals';
import PaginationOptions from 'src/app/models/PaginationOptions';
import TableFilterOptions from 'src/app/models/TableFiilterOptions';
import { _wageRegisterMasterNew } from '../../report/_wageRegister';

@Component({
  selector: 'app-FormB-wage-register',
  templateUrl: './FormB-wage-register.component.html',
  styleUrls: ['./FormB-wage-register.component.css'],
})
export class CMPFormBWageRegisterComponent implements OnInit {
  Global = Global;
  tableOperationForm: FormGroup;
  bankMaster: any[] = [];
  reportPaginationOptions: PaginationOptions = Global.resetPaginationOption();
  employeeListFilter: any = {};
  salaryHeads:any = {};
  salaryHeadsLength:number = 0;
  tablefilterOptios: TableFilterOptions =
    Global.resetTableFilterOptions();
  // employeeListFilter: any = null;
  reports: any[] = [];
  sheetTemplate: any[] = _salarySheetTempMasterNew;
  sheetTemplateMaster: any[] = [];
  templateReportGenerated: boolean = false;
  sheetTemplateForm: FormGroup;
  isViewSalaryReport: boolean = false;
  selectedSheetTemplate: any;
  commomTableFilterData: any = {};
  empReportData: any[] = [];
  isReportView:boolean = false;
  viewAllemp:any[]=[]
  form_wageL:any[] = _wageRegisterMasterNew
  constructor(
    private companyuserService: CompanyuserService,
    private formBuilder: FormBuilder,
    private spinner: NgxSpinnerService,
    private toastr: ToastrService
  ) {
    this.tableOperationForm = formBuilder.group({
      payout_process: [null],
      payout_bankid: [null],
      report_template: null,
    });
  }

  empReportTempData: any = {
    master_head_includes: [],
    attendance_head_includes: [],
    head_includes: [],
    extra_earning_data: [],
  };

  monthMaster: any[] = [
    { index: 0, value: 1, description: 'January', days: 31 },
    { index: 1, value: 2, description: 'February', days: 28 },
    { index: 2, value: 3, description: 'March', days: 31 },
    { index: 3, value: 4, description: 'April', days: 30 },
    { index: 4, value: 5, description: 'May', days: 31 },
    { index: 5, value: 6, description: 'June', days: 30 },
    { index: 6, value: 7, description: 'July', days: 31 },
    { index: 7, value: 8, description: 'August', days: 31 },
    { index: 8, value: 9, description: 'September', days: 30 },
    { index: 9, value: 10, description: 'October', days: 31 },
    { index: 10, value: 11, description: 'November', days: 30 },
    { index: 11, value: 12, description: 'December', days: 31 },
  ];
  ngOnInit() {
    // this.generateTemplateReport({});
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

  async generateTemplateReport({ page = <any>null, filter = <any>null }) {
    if (page != null) this.reportPaginationOptions.page = page;
    if (filter != null) this.employeeListFilter = filter;

    if (!this.employeeListFilter) {
      return;
    }

    this.selectedSheetTemplate = null;
    let generatedReportTemplate =
      this.tableOperationForm.get('report_template')?.value ||
      _salarySheetTempMasterNew;

    this.selectedSheetTemplate = await this.generateTemplate(
      generatedReportTemplate
    );

    let res = await this.companyuserService
      .getSalarySheetDetails({
        pageno: this.reportPaginationOptions.page,
        perpage: this.employeeListFilter.length,
        wage_month: this.employeeListFilter?.month?.index ?? '',
        wage_year: this.employeeListFilter?.year?.value ?? '',
        hod_id: this.employeeListFilter?.hod_id ?? null,
        department_id: this.employeeListFilter?.department_id ?? null,
        designation_id: this.employeeListFilter?.designation_id ?? null,
        branch_id: this.employeeListFilter?.branch_id ?? null,
        salary_type: this.employeeListFilter?.salary_type ?? 'salary',
        row_checked_all: true,
        checked_row_ids: JSON.stringify([]),
        unchecked_row_ids: JSON.stringify([]),
      })
      .toPromise();


    if (res.status == 'success') {
      this.empReportData = res?.master_data;
    } else {
      this.empReportData = [];
    }
  }

  rowCheckedAll: Boolean = false;
  checkedRowIds: any[] = [];
  uncheckedRowIds: any[] = [];
  getReportPayload() {
    let payload: any = {
      pageno: this.reportPaginationOptions.page,
      perpage: this.reportPaginationOptions.limit,
      searchkey: this.tablefilterOptios.searchkey,
      wage_month_from: this.employeeListFilter?.month?.index,
      wage_year_from: this.employeeListFilter?.year?.value,
      wage_month_to: this.employeeListFilter?.month?.index,
      wage_year_to: this.employeeListFilter?.year?.value,
      branch_id: this.employeeListFilter?.branch_id ?? '',
      department_id: this.employeeListFilter?.department_id ?? '',
      designation_id: this.employeeListFilter?.designation_id ?? '',
      hod_id: this.employeeListFilter?.hod_id ?? '',
      checked_row_ids: JSON.stringify(this.checkedRowIds),
      unchecked_row_ids: JSON.stringify(this.uncheckedRowIds),
      row_checked_all: this.rowCheckedAll,
      salary_type: this.employeeListFilter?.salary_type ?? 'salary',
    };
    return payload;
  }

  employees: any[] = [];
  company: any = {}

veiwEmpDocData:any[]= [];
veiwEmpDoc:any[]= [];
  rowCheckBoxChecked(event: any, row: any) {
    let rowId: any = row._id;
    let checkbox: any = document.querySelectorAll(
        '[data-checkbox-id="' + rowId + '"]'
    );

    let rowObj:any = {};

    rowObj.emp_first_name = row?.emp_first_name 
    rowObj.emp_last_name = row?.emp_last_name 
    rowObj.rate_of_wage = row?.employee_monthly_reports?.master_report?.gross_earning  
    rowObj.no_of_days_worked = row?.employee_monthly_reports?.attendance_summaries?.paydays 
    rowObj.overtime_hours_worked = row?.employee_monthly_reports?.attendance_summaries?.total_overtime 
    rowObj.basic = row?.earn_heads_amounts?.head_1?.amount 
    rowObj.hra = row?.earn_heads_amounts?.head_2?.amount 
    rowObj.others = row?.earn_heads_amounts?.head_3?.amount 
    rowObj.overtime = row?.employee_monthly_reports?.salary_report?.total_ot_wages 
    rowObj.gross_wages = row?.employee_monthly_reports?.salary_report?.gross_earning 
    rowObj.pf = row?.employee_monthly_reports?.salary_report?.pf_data?.emoloyee_contribution 
    rowObj.pt = row?.employee_monthly_reports?.salary_report?.pt_amount 
    rowObj.esi = row?.employee_monthly_reports?.salary_report?.esic_data?.emoloyee_contribution 
    rowObj.advance = row?.employee_monthly_reports?.salary_report?.advance_recovered 
    rowObj.total_deduction = ( (row?.employee_monthly_reports?.salary_report?.pf_data?.emoloyee_contribution || 0) +
    (row?.employee_monthly_reports?.salary_report?.pt_amount || 0) +
    (row?.employee_monthly_reports?.salary_report?.esic_data?.emoloyee_contribution || 0) +
    (row?.employee_monthly_reports?.salary_report?.advance_recovered || 0) ) ?? 0
    rowObj.net_payment = row?.employee_monthly_reports?.salary_report?.net_take_home 
    rowObj.employer_share = row?.employee_monthly_reports?.salary_report?.pf_data?.emoloyee_contribution 
    rowObj.reciept_by_emp_bnk = row?.employee_monthly_reports?.salary_report?.bank_ins_referance_id 
    rowObj.date_of_payment = ''
    rowObj.remarks = ''
    this.veiwEmpDocData.push(rowObj)
  
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
getSheetTemplateHeadColspan(
  main_slug: any,
  module_slug: any,
  isFromMaster = false
) {
  let _sTemplate: any[] = this.form_wageL;

  let _mainModule: any = _sTemplate.find((obj: any) => {
    return obj.main_slug == main_slug;
  });

  const module = _mainModule.modules.find((obj: any) => {
    return obj.module_slug == module_slug;
  });

  if (module) {
    let length = (module.fields ?? []).length;

    /** CHECK IF MASTER DYNAMIC HEAD IS PRESENT */
    const dynamicMasterHeadFieldLength = (module.fields ?? []).filter(
      (obj: any) => {
        return obj.slug == 'master-dynamic-heads';
      }
    ).length;

    const dynamicAttendanceHeadFieldLength = (module.fields ?? []).filter(
      (obj: any) => {
        return obj.slug == 'attendance-dynamic-heads';
      }
    ).length;
    // const dynamicAttendanceHeadFieldLength = (module.fields ?? []).filter(
    //   (obj: any) => {
    //     return obj.slug == 'attendance-dynamic-heads';
    //   }
    // ).length;

    if (dynamicMasterHeadFieldLength > 0) {
      length +=
        (this.empReportTempData.master_head_includes ?? []).length *
          dynamicMasterHeadFieldLength -
        dynamicMasterHeadFieldLength;
    } else if (dynamicMasterHeadFieldLength == 0 && isFromMaster == true) {
      // length += 1;
    }

    if (dynamicAttendanceHeadFieldLength > 0) {
      length +=
        (this.empReportTempData.attendance_head_includes ?? []).length *
          dynamicAttendanceHeadFieldLength -
        dynamicAttendanceHeadFieldLength;
    } else if (
      dynamicAttendanceHeadFieldLength == 0 &&
      isFromMaster == true
    ) {
      // length += 1;
    }

    /** CHECK IF DYNAMIC HEAD IS PRESENT */
    const dynamicHeadFieldLength = (module.fields ?? []).filter(
      (obj: any) => {
        return obj.slug == 'dynamic-heads';
      }
    ).length;

    if (dynamicHeadFieldLength > 0) {
      length +=
        (this.empReportTempData.head_includes ?? []).length *
          dynamicHeadFieldLength -
        dynamicHeadFieldLength;
    } else if (dynamicHeadFieldLength == 0 && isFromMaster == true) {
      // length += 1;
    }

    /** CHECK IF EXTRAEARNING HEAD IS PRESENT */
    const extraEarningFieldLength = (module.fields ?? []).filter(
      (obj: any) => {
        return obj.slug == 'extra-earnings';
      }
    ).length;

    if (extraEarningFieldLength > 0) {
      length +=
        (this.empReportTempData.extra_earning_data ?? []).length *
          extraEarningFieldLength -
        extraEarningFieldLength;
    } else if (extraEarningFieldLength == 0 && isFromMaster == true) {
      // length += 1;
    }


    return length;
  } else {
    return 0;
  }
}

private isRowChecked(rowId: any) {
  if (!this.rowCheckedAll) return this.checkedRowIds.indexOf(rowId) >= 0 ? true : false;
  else return this.uncheckedRowIds.indexOf(rowId) >= 0 ? false : true;
}

  async fetchEmployees() {
    try {
      let payload = this.getReportPayload();
      payload.checked_row_ids = JSON.stringify([]),
      payload.unchecked_row_ids = JSON.stringify([]),
      payload.row_checked_all = false;
      // console.log(payload);
      
      // payload.pageno = 1;
      // payload.perpage = 20
      // payload.generate = 'excel';

      const res = await this.companyuserService
        .fetchWagesFormB(payload)
        .toPromise();

      if (res.status !== 'success') throw res;
      this.employees = res.employees;
      this.viewAllemp = res.employees;
      this.company = res.company;
      this.employees?.map(employee => {
        // docs.forEach((doc: any) => {
          employee.checked = this.isRowChecked(employee._id);
          
      // });
        // employee?.employee_monthly_reports?.salary_report?.heads?.forEach((head:any) => {
        //   this.salaryHeads[head?.head_abbreviation.toLowerCase()] = 0.00;
        //   employee['salaryHeads'] = {};
        //   employee['salaryHeads'][head?.head_abbreviation.toLowerCase()] = head?.amount;
        // });
      })
      // console.log(this.salaryHeads);
      // this.salaryHeadsLength = Object.keys(this.salaryHeads)?.length ?? 0
      
      // this.employees?.map((employee) => {
      //   // employee?.employee_monthly_reports?.salary_report?.heads?.forEach((head:any) => {
      //   //   this.salaryHeads[head?.head_abbreviation] = '0.00';
      //   //   employee['salaryHeads'] = {};
      //   // });
      //   employee['salaryHeads']={...this.salaryHeads, ...employee?.salaryHeads};
      // })      

      return;
    } catch (err: any) {
      if (err.status == 'val_err') {
        return this.toastr.error(Global.showValidationMessage(err.val_msg));
      }
      return this.toastr.error(err?.message || err);
    }
  }
  
  // getObjectKeys(obj:any = {}){
  //   return Object.keys(obj) ?? []
  // }
  
  // getObjectValues(obj:any = {}){
  //   return Object.values(obj) ?? []
  // }
  viewReport(){
    if (this.rowCheckedAll == true) {
      this.veiwEmpDoc = this.viewAllemp
    }
    else{
      this.veiwEmpDoc = this.veiwEmpDocData
    }
    this.isReportView = true;
    
  }
  cancelGenerateReport() {
    this.isReportView = false;
    this.veiwEmpDoc = []
    this.veiwEmpDocData=[]
    this.viewAllemp=[]
    this.resetCheckedRows();
}
  
  async downloadExcelReport(event: HTMLElement) {
    try {
      if(!this.anyRowsChecked()) return
      // event.setAttribute('disabled', 'true')
      // event.target.classList.add('btn-loading');
      
      let payload = this.getReportPayload();
      payload.generate = 'excel';
      await this.companyuserService.downloadFile(
        'get-employee-form-b-register-report',
        'wage-register-form-b',
        payload
      );
      
      // saveAs(file,'Employee-Sample');

      // event.removeAttribute('disabled')

    } catch (err: any) {
      // event.removeAttribute('disabled')
      this.toastr.error(err.message);
    }
  }

  getSheetTemplateReportValue(
    main_slug: any,
    module_slug: any,
    field_slug: any,
    report: any
  ) {
    // console.log({
    //   main_slug,
    //   module_slug,
    //   field_slug,
    //   report,
    // });
    
    let _sTemplate: any[] = this.form_wageL;

    let _mainModule: any = _sTemplate.find((obj: any) => {
      return obj.main_slug == main_slug;
    });

    const module = _mainModule.modules.find((obj: any) => {
      return obj.module_slug == module_slug;
    });
// console.log(module,'mod',_mainModule,'_ma');

    if (module) {
      const field = (module.fields ?? []).find((obj: any) => {
        return obj.slug == field_slug;
      });

      if (field) {
        
         
         if (Array.isArray(field.mapping)) {
          let value = '';
          field.mapping.forEach((mapping: any) => {
              value += this.getMappingValue(mapping, report) + ' ';
          });

          return value ?? 'N/A';
          }
          else{
            let value = report;
            // mapping.forEach((key: any) => {
              if (value !== null && value !== undefined) {
                
                value = value[field_slug] ?? 'N/A';
              }
              return value ?? 'N/A';
          }
       
      } else {
        return 'N/A';
      }
    } else {
      return 'N/A';
    }
  }

  getMappingValue(mappingValue: string, obj: any) {
  
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
  
        return value ?? "N/A"
    } else {
        return "N/A";
    }
  }
  getField(f:any){
    
  }
}
