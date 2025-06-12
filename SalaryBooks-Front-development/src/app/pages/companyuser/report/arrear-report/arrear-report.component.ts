import { DatePipe } from '@angular/common';
import { Component, ElementRef, Input, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { CompanyuserService } from 'src/app/services/companyuser.service';
import * as Global from 'src/app/globals';
import PaginationOptions from 'src/app/models/PaginationOptions';
import TableFiilterOptions from 'src/app/models/TableFiilterOptions';
import swal from 'sweetalert2';

import jsPDF from 'jspdf';
const pdfMake = require('pdfmake/build/pdfmake')
const pdfFonts = require('pdfmake/build/vfs_fonts')
pdfMake.vfs = pdfFonts.pdfMake.vfs;
const htmlToPdfmake = require('html-to-pdfmake')

import { _arrearReportTempMaster } from '../_arrearReportTempMaster';

@Component({
    selector: 'app-companyuser-arrear-report',
    templateUrl: './arrear-report.component.html',
    styleUrls: ['./arrear-report.component.css'],

})
export class CMPArrearReportComponent implements OnInit {
    @ViewChild('salarysheetreporttable', { static: false }) el!: ElementRef;
    @Input() rivisionFilter: any = {};

    filterForm: UntypedFormGroup;
    templateForm: UntypedFormGroup;
    generateReportForm: UntypedFormGroup;

    monthMaster: any[] = [];
    yearMaster: any[] = [];
    sheetTemplate: any[] = _arrearReportTempMaster;
    _tempSheetTemplate: any[] = this.sheetTemplate;
    sheetTemplateMaster: any[] = [];
    departmentMaster: any[] = [];
    designationMaster: any[] = [];
    branchMaster: any[] = [];
    hodMaster: any[] = [];

    empReportData: any[] = [];
    empReportGenerated: Boolean = false;
    empReportTempData: any = {
        'master_head_includes': [],
        'head_includes': [],
        'extra_earning_data': [],
    };

    rowCheckedAll: Boolean = false;
    checkedRowIds: any[] = [];
    uncheckedRowIds: any[] = [];

    Global = Global;
    paginationOptions: PaginationOptions = Global.resetPaginationOption();
    tableFilterOptions: TableFiilterOptions = Global.resetTableFilterOptions();
    holdedSalarypaginationOptions: PaginationOptions = Global.resetPaginationOption();

    reportType: String = "";

    constructor(
        private titleService: Title,
        private toastr: ToastrService,
        protected companyuserService: CompanyuserService,
        private spinner: NgxSpinnerService,
        public formBuilder: UntypedFormBuilder,
        private datePipe: DatePipe
    ) {
        
    }

    async ngOnInit() {
       
    }
    ngOnChanges()
    {
        this.generateMasterSheet({page:1,options:this.rivisionFilter});
  
    }
   
    employeeListFilter: any = {};
    generateMasterSheet({
        page = <any>null,
        options = <any>{}
    } = {}) {
        this.employeeListFilter =  options
        return new Promise((resolve, reject) => {
            if (this.employeeListFilter) {
                if (page != null) {
                    this.paginationOptions.page = page;
                }
                this.tableFilterOptions = options;

                let payload: any = this.getReportPayload();
                payload.pageno = this.paginationOptions.page;

                payload.perpage = this.paginationOptions.limit;
                if(payload.report_type=='monthlywages')
                {
                    payload.report_type="monthly";
                }
                this.spinner.show();
                this.companyuserService.getRevisionMasterReport(payload).subscribe(res => {
                    this.reportType = this.employeeListFilter.report_type;
                    if (res.status == 'success') {
                        if (this.reportType == 'consolidated') {
                            this.empReportData = res?.data ?? [];
                        } else {
                            this.empReportData = res?.data ?? [];

                        }
                    } else {
                        this.empReportData = [];
                        this.paginationOptions = Global.resetPaginationOption();
                    }

                    this.spinner.hide();
                    Global.loadCustomScripts('customJsScript');
                    resolve(true);
                }, (err) => {
                    this.empReportData = [];
                    this.paginationOptions = Global.resetPaginationOption();
                    this.spinner.hide();
                    Global.loadCustomScripts('customJsScript');
                    resolve(true);
                });
            }
        })
    }

    getReportPayload() {
        let payload: any = {
            'report_type': this.employeeListFilter.report_type ?? "",
            'wage_month': this.employeeListFilter.wage_month ?? "",
            'wage_year': this.employeeListFilter.wage_year ?? "",
            'row_checked_all': this.employeeListFilter?.row_checked_all,
            'checked_row_ids': JSON.stringify(this.employeeListFilter?.checked_row_ids),
            'unchecked_row_ids': JSON.stringify(this.employeeListFilter?.unchecked_row_ids),
            'hod_id': this.employeeListFilter?.hod_id ?? null,
            'department_id': this.employeeListFilter?.department_id ?? null,
            'designation_id': this.employeeListFilter?.designation_id ?? null,
            'branch_id': this.employeeListFilter?.branch_id ?? null,
        }

        return payload;
    }



    generateReportPdf() {
        let pdf = new jsPDF('l', 'pt', 'a1', true)
        pdf.html(this.el.nativeElement, {
            callback: (pdf) => {
                pdf.save("salarysheetreporttable.pdf")
            }
        })
    }

    getIndexValue(obj: any, key: string) {
        return obj[key];
    }

    getSheetTemplateMasterHeadColspan(main_slug: any) {
        let cntr: number = 0;

        let _sTemplate: any[] = this._tempSheetTemplate

        let _mainModule: any = _sTemplate.find((obj: any) => {
            return obj.main_slug == main_slug
        })

        _mainModule.modules.forEach((element: any) => {
            cntr += this.getSheetTemplateHeadColspan(main_slug, element.module_slug, true)
        });

        return cntr
    }

    getSheetTemplateHeadColspan(main_slug: any, module_slug: any, isFromMaster = false) {
        let _sTemplate: any[] = this._tempSheetTemplate

        let _mainModule: any = _sTemplate.find((obj: any) => {
            return obj.main_slug == main_slug
        })

        const module = _mainModule.modules.find((obj: any) => {
            return obj.module_slug == module_slug;
        })

        if (module) {
            let length = (module.fields ?? []).length;

            /** CHECK IF MASTER DYNAMIC HEAD IS PRESENT */
            const dynamicMasterHeadFieldLength = (module.fields ?? []).filter((obj: any) => {
                return obj.slug == 'master-dynamic-heads'
            }).length;

            if (dynamicMasterHeadFieldLength > 0) {
                length += (((this.empReportTempData.master_head_includes ?? []).length * dynamicMasterHeadFieldLength) - dynamicMasterHeadFieldLength);
            } else if (dynamicMasterHeadFieldLength == 0 && isFromMaster == true) {
                // length += 1;
            }

            /** CHECK IF DYNAMIC HEAD IS PRESENT */
            const dynamicHeadFieldLength = (module.fields ?? []).filter((obj: any) => {
                return obj.slug == 'dynamic-heads'
            }).length;

            if (dynamicHeadFieldLength > 0) {
                length += (((this.empReportTempData.head_includes ?? []).length * dynamicHeadFieldLength) - dynamicHeadFieldLength);
            } else if (dynamicHeadFieldLength == 0 && isFromMaster == true) {
                // length += 1;
            }

            /** CHECK IF EXTRAEARNING HEAD IS PRESENT */
            const extraEarningFieldLength = (module.fields ?? []).filter((obj: any) => {
                return obj.slug == 'extra-earnings'
            }).length;

            if (extraEarningFieldLength > 0) {
                length += (((this.empReportTempData.extra_earning_data ?? []).length * extraEarningFieldLength) - extraEarningFieldLength);
            } else if (extraEarningFieldLength == 0 && isFromMaster == true) {
                // length += 1;
            }

            return length;
        } else {
            return 0;
        }
    }

    getSheetTemplateReportValue(main_slug: any, module_slug: any, field_slug: any, report: any) {
        let _sTemplate: any[] = this._tempSheetTemplate

        let _mainModule: any = _sTemplate.find((obj: any) => {
            return obj.main_slug == main_slug
        })

        const module = _mainModule.modules.find((obj: any) => {
            return obj.module_slug == module_slug;
        })

        if (module) {
            const field = (module.fields ?? []).find((obj: any) => {
                return obj.slug == field_slug;
            })

            if (field) {
                let mapping = field.mapping.split('.')
                let first_key=field.first_key;
                if (mapping.length > 0) {
                    if (this.reportType == 'consolidated') {

                        if (['earnings'].includes(_mainModule.main_slug)) {
                            let TOTAL = 0;
                            for (const key in report) {
                                if (Object.prototype.hasOwnProperty.call(report, key)) {
                                    let current_key=key;
                                    let revisionmasterreport_value = report[key];
                                    let masterreport_value = revisionmasterreport_value;
                                    if (masterreport_value) {
                                        mapping.forEach((key: any) => {
                                            if (masterreport_value !== null && masterreport_value !== undefined) {
                                                if(first_key)
                                                {
                                                   if(current_key=='revision_report')
                                                   {
                                                    let new_data=masterreport_value[first_key];
                                                    if(new_data)
                                                   {
                                                    masterreport_value =new_data[key] ?? null;

                                                   }

                                                   }


                                                }
                                                else{
                                                    masterreport_value = masterreport_value[key] ?? null;

                                                }
                                            }
                                        });

                                        mapping.forEach((key: any) => {
                                            if (revisionmasterreport_value !== null && revisionmasterreport_value !== undefined) {
                                                if(first_key!=undefined && first_key!=null && first_key!='')
                                                {

                                                    if(revisionmasterreport_value[first_key])
                                                    {

                                                        revisionmasterreport_value = revisionmasterreport_value[first_key][key] ?? null;

                                                    }
                                                    else{
                                                        revisionmasterreport_value = revisionmasterreport_value[key] ?? null;
                                                    }

                                                }
                                                else{
                                                    revisionmasterreport_value = revisionmasterreport_value[key] ?? null;

                                                }
                                            }
                                        });
                                        if (Number.isInteger(revisionmasterreport_value) && revisionmasterreport_value) {
                                            //TOTAL += revisionmasterreport_value - masterreport_value;
                                            TOTAL = revisionmasterreport_value ?? null

                                        } else {
                                            TOTAL = revisionmasterreport_value ?? null
                                        }
                                    } else {
                                        TOTAL += 0;
                                    }
                                }
                            }

                            return TOTAL;
                        } else {
                            let value = report;

                            mapping.forEach((key: any) => {
                                // console.log(key);
                                if (value !== null && value !== undefined) {

                                    value = value[key] ?? null;

                                }
                            });

                            return value ?? null
                        }
                    } else {
                        if (['earnings'].includes(_mainModule.main_slug)) {
                            let masterreport_value = report;
                            mapping.forEach((key: any) => {
                                if (masterreport_value !== null && masterreport_value !== undefined) {
                                    masterreport_value = masterreport_value[key] ?? null;
                                }
                            });

                            let revisionmasterreport_value = report?.revision_master_report;
                            mapping.forEach((key: any) => {
                                if (revisionmasterreport_value !== null && revisionmasterreport_value !== undefined) {
                                    if(first_key!=undefined && first_key!=null && first_key!='')
                                    {

                                        if(revisionmasterreport_value[first_key])
                                        {

                                            revisionmasterreport_value = revisionmasterreport_value[first_key][key] ?? null;

                                        }
                                        else{
                                            revisionmasterreport_value = revisionmasterreport_value[key] ?? null;
                                        }

                                    }
                                    else{
                                        revisionmasterreport_value = revisionmasterreport_value[key] ?? null;

                                    }
                                }
                            });

                            if (Number.isInteger(revisionmasterreport_value) && revisionmasterreport_value) {
                                //return revisionmasterreport_value - masterreport_value;
                                return revisionmasterreport_value ?? null
                            } else {
                                return revisionmasterreport_value ?? null
                            }
                        } else {
                            let value = report;
                            mapping.forEach((key: any) => {
                                if (value !== null && value !== undefined) {
                                    value = value[key] ?? null;
                                }
                            });

                            return value ?? null
                        }
                    }
                } else {
                    return null
                }
            } else {
                return null;
            }
        } else {
            return null
        }
    }

    /**
     * =========================
     * DYNAMIC BREAKUP Functions
     * =========================
     */

    getHeadValue(report: any, slug: string, head_id: any, key: any) {
        if (this.reportType == 'consolidated') {
            let TOTAL = 0;
            for (const k in report?.revision_data) {
                if (Object.prototype.hasOwnProperty.call(report?.revision_data, k)) {
                    const r: any = report?.revision_data[k];

                    if (report?.emp_id == "emp113") {
                        // console.log('r: ', r)
                    }

                    let revision_head: any = (r?.[slug] ?? []).find((obj: any) => {
                        return obj.head_id == head_id
                    }) ?? null;

                    let master_head: any = (r?.master_report?.[slug] ?? []).find((obj: any) => {
                        return obj.head_id == head_id
                    }) ?? null;


                    if (revision_head && master_head) {
                        let value = (revision_head[key] ?? 0) - (master_head[key] ?? 0);

                        TOTAL += value;
                    } else {
                        TOTAL += 0;
                    }
                }
            }

            return TOTAL;
        } else {
            let revision_heads = report?.revision_master_report?.heads ?? []
            let revision_head = revision_heads.find((obj: any) => {
                return obj.head_id == head_id
            }) ?? null;

            if (revision_head) {
                // console.log('revision_head[key]: ', revision_head[key]);

                let value = revision_head[key] ?? 0;

                /**
                 * ==============================
                 * CHECK IF HEAD EXISTS IN MASTER
                 * ==============================
                 */

                let master_head = (report?.master_report?.heads ?? []).find((obj: any) => {
                    return obj.head_id == head_id
                }) ?? null;

                if (master_head) {
                    value = value - (master_head[key] ?? 0)
                }

                /**
                 * ==============================
                 */

                return value;
            } else {
                return null;
            }
        }
    }

    /**
     * =========================
     * EXTRA EARNING Functions
     * =========================
     */

    getExtraEarningValue(extraEarnings: any[], earning_abbreviation: any, key: any) {
        let earning = extraEarnings.find((obj: any) => {
            return obj.earning_abbreviation == earning_abbreviation
        }) ?? null;

        if (earning) {
            return earning[key] ?? 0;
        } else {
            return 0
        }
    }

    /**
     * =========================
     * Template Create Functions
     * =========================
     */

    initTemplateCreate() {
        this.cancelTemplateCreate();
        $('#settingsTemplateModalOpen')?.click();
    }

    cancelTemplateCreate() {
        $('#settingsTemplateModal')?.find('[data-dismiss="modal"]')?.click();

        Global.resetForm(this.templateForm);
        this.templateForm.reset();
        //$("checkbox").attr("checked",false);
        this.resetSelectedModules();
    }

    async submitTemplate(event: any) {
        this.templateForm.markAllAsTouched();
        setTimeout(() => {
            Global.scrollToQuery('p.text-danger')
        }, 300);

        let modules: any = await this.getSelecteModules();
        if (Object.keys(modules).length < 1) {
            this.toastr.error("Please select atleast one field");
            return;
        }

        if (this.templateForm.valid && Object.keys(modules).length > 0) {
            let document = {
                'template_name': this.templateForm.value.template_name,
                'template_fields': JSON.stringify(modules),
                'temp_module_for':'arrear_sheet'
            }

            event.target.classList.add('btn-loading');
            this.companyuserService.createEmployeeSheetTemplate(document).subscribe(res => {
                if (res.status == 'success') {
                    this.toastr.success(res.message);
                    this.cancelTemplateCreate();
                    this.fetchSettingsTemplate();
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

    getSelecteModules() {
        return new Promise((resolve, reject) => {
            const masterModules: any[] = [];
            this.sheetTemplate.forEach((master: any) => {
                const modules: any[] = []
                master.modules.forEach((row: any) => {
                    const access: any = [];

                    $('input[name="fields[' + row.module_slug + ']"]:checked').each(function () {
                        access.push($(this).val())
                    });

                    if (access.length > 0) {
                        modules.push({
                            'module_slug': row.module_slug,
                            'fields': access
                        });
                    }
                });

                if (modules.length > 0) {
                    masterModules.push({
                        'main_slug': master.main_slug,
                        'modules': modules
                    });
                }
            });

            // console.log('masterModules : ', masterModules);
            resolve(masterModules);
        })
    }

    resetSelectedModules() {
        this.sheetTemplate.forEach(row => {
            $('input[name="fields[' + row.module_slug + ']"]:checked').each(function () {
                $(this).prop('checked', false)
            });
        });
    }

    /**
     * ============================
     * TEMPLATE SELECTION FUNCTIONS
     * ============================
     */

    fetchSettingsTemplate() {
        return new Promise((resolve, reject) => {
            this.sheetTemplateMaster = [];

            this.spinner.show();
            this.companyuserService.fetchEmployeeSheetTemplates({
                'pageno': 1,'temp_module_for':'arrear_sheet'
            }).subscribe(res => {
                this.spinner.hide();
                if (res.status == 'success') {
                    this.sheetTemplateMaster = res?.earning_sheet_temp?.docs ?? [];
                    this.sheetTemplateMaster.push({
                    temp_module_for:'arrear_slip',template_name:'Arrear Slip'    
                    })
                    this.sheetTemplateMaster.push({
                    temp_module_for:'revision_history',template_name:'Revision History'    
                    })
                    resolve(true);
                } else if (res.status == 'val_err') {
                    this.toastr.error(Global.showValidationMessage(res.val_msg));
                    reject(Global.showValidationMessage(res.val_msg));
                } else {
                    this.toastr.error(res.message);
                    reject(res.message);
                }
            }, (err) => {
                this.spinner.hide();
                this.toastr.error(Global.showServerErrorMessage(err));
                reject(Global.showServerErrorMessage(err));
            });
        })
    }

    cancelSheetTemplateSelection() {
        $('#template-selection-form')?.hide(500);
        this._tempSheetTemplate = this.sheetTemplate;
    }

    generateTemplate(template: any) {
        return new Promise((resolve, reject) => {
            if (template) {
                const selectedTemplateFields = template?.template_fields ?? [];
                if (selectedTemplateFields.length < 1) {
                    this.toastr.error("No module available for this template");
                    return;
                }

                let tempTemplateMaster: any[] = []
                selectedTemplateFields.forEach((selectedTemplateField: any) => {
                    let tempMainModule = this.sheetTemplate.find((obj: any) => {
                        return obj.main_slug == selectedTemplateField.main_slug;
                    })

                    if (tempMainModule) {
                        let modules: any[] = [];
                        (selectedTemplateField.modules ?? []).forEach((selectedModule: any) => {
                            let tempModule = tempMainModule.modules.find((obj: any) => {
                                return obj.module_slug == selectedModule.module_slug
                            })

                            let fields: any[] = [];
                            (selectedModule.fields ?? []).forEach((field: any) => {
                                let f = tempModule.fields.find((obj: any) => {
                                    return obj.slug == field;
                                })

                                if (f) {
                                    fields.push(f);
                                }
                            });

                            if (fields.length > 0) {
                                modules.push({
                                    'module_title': tempModule.module_title,
                                    'module_slug': tempModule.module_slug,
                                    'fields': fields,
                                })
                            }
                        });

                        tempTemplateMaster.push({
                            'main_title': tempMainModule.main_title,
                            'main_slug': tempMainModule.main_slug,
                            'modules': modules
                        })
                    }
                });

                if (tempTemplateMaster.length == 0) {
                    this.toastr.error("The template cannot be generated, as no module cannot be pointed");
                    reject("The template cannot be generated, as no module cannot be pointed");
                }

                this._tempSheetTemplate = tempTemplateMaster;
                resolve(true)
            } else {
                this.toastr.error("No Template Found Exception");
                reject("No Template Found Exception");
            }
        })

    }

    /**
     * ============================
     * TEMPLATE FUNCTIONS
     * ============================
     */
    async excelExport() {
        try {
            if (this.empReportData.length > 0) {
                this.spinner.show();
    
                let payload = this.getReportPayload();
                await this.companyuserService.downloadFile('export-master-sheet-data', 'Arrear-Report', payload)
                // this.companyuserService.exportMasterSheet(payload).subscribe((res: any) => {
                //     if (res.status == 'success') {
                //         window.open(res.url);
                //     } else {
                //     }
                    
                //     this.spinner.hide();
                // }, (err: any) => {
                //     this.toastr.error(Global.showServerErrorMessage(err));
                // })
                this.spinner.hide();
            }
        } catch (err:any) {
            this.spinner.hide();
            this.toastr.error(err.message);
        }
    }

    rowSelecion(e: any):void {
      document.getElementsByName(e.target?.name)?.forEach((checkbox:any) => {
        checkbox.checked = e.target.checked;
      });
    }


    template_fields: any[] = [];
    adjustTemplateFields(field: any[], e: any) {
      let arr = field.map((d) => {
        return d.slug;
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
}
