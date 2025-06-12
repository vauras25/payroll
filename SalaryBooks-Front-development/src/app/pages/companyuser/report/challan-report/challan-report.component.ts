import { DatePipe } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { CompanyuserService } from 'src/app/services/companyuser.service';
import * as Global from 'src/app/globals';
import PaginationOptions from 'src/app/models/PaginationOptions';
import TableFiilterOptions from 'src/app/models/TableFiilterOptions';
import { _salarySheetTempMaster } from '../_salarySheetTempMaster';
import swal from 'sweetalert2';
import { CompanyuserTableFilterComponent } from '../../includes/table-filter/table-filter.component';
import { ActivatedRoute } from '@angular/router';

@Component({
    selector: 'app-companyuser-challan-report',
    templateUrl: './challan-report.component.html',
    styleUrls: ['./challan-report.component.css']
})
export class CMPChallanReportComponent implements OnInit {
    @ViewChild(CompanyuserTableFilterComponent) filterTableComponent: CompanyuserTableFilterComponent;
    @ViewChild('salarysheetreporttable', { static: false }) el!: ElementRef;

    templateForm: UntypedFormGroup;
    generateReportForm: UntypedFormGroup;

    monthMaster: any[] = [];
    yearMaster: any[] = [];
    sheetTemplate: any[] = _salarySheetTempMaster;
    _tempSheetTemplate: any[] = this.sheetTemplate;
    sheetTemplateMaster: any[] = [];
    bankSheetMaster: any[] = [];

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

    challanType: string = "";

    constructor(
        private titleService: Title,
        private toastr: ToastrService,
        protected companyuserService: CompanyuserService,
        private spinner: NgxSpinnerService,
        public formBuilder: UntypedFormBuilder,
        private datePipe: DatePipe,
        private activatedRoute: ActivatedRoute
    ) {
        this.monthMaster = Global.monthMaster;

        let currentYear = new Date().getFullYear();
        this.yearMaster = [];
        for (let index = 4; index >= 0; index--) {
            this.yearMaster.push({ value: (currentYear - index), description: (currentYear - index) });
        }

        this.templateForm = formBuilder.group({
            'template_name': [null, Validators.compose([Validators.required])],
        });

        this.generateReportForm = formBuilder.group({
            'template': [null, Validators.compose([])],
        });

        this.generateReportForm.get('template')?.valueChanges.subscribe(async val => {
            if (val?._id) {
                await this.generateTemplate(val);
            } else {
                this.cancelSheetTemplateSelection();
            }

            Global.loadCustomScripts('customJsScript');
        })
    }

    async ngOnInit() {
        switch (this.activatedRoute.snapshot.url[1].path) {
            case "pf-challan-report":
                this.challanType = "pf";
                break;

            case "esic-challan-report":
                this.challanType = "esic";
                break;
        }

        this.titleService.setTitle(this.challanType.toUpperCase() + " Challan Report - " + Global.AppName);
        setTimeout(async () => {
            this.filterPayload = {
                'month': this.filterTableComponent.monthMaster?.find((obj: any) => {
                    return obj.index == 0;
                    return obj.index == new Date().getMonth();
                }) ?? null,

                'year': this.filterTableComponent.yearMaster?.find((obj: any) => {
                    return obj.value == new Date().getFullYear();
                }) ?? null,
            }

            this.filterTableComponent.setFormControlValue({
                refresh: false,
                payload: this.filterPayload
            });

            await this.generateMasterSheet({ resetCheckboxed: true });
            await this.fetchBankTemplates();
        });
    }

    fetchBankTemplates() {
        return new Promise((resolve, reject) => {
            this.spinner.show();
            this.companyuserService.fetchBankSheets({
                'pageno': 1,
                'perpage': 20
            }).subscribe((res: any) => {
                if (res.status == 'success') {
                    this.bankSheetMaster = res?.templates?.docs ?? []
                } else {
                    this.toastr.error(res.message);
                    this.bankSheetMaster = [];
                }

                this.spinner.hide();
                resolve(true);
            }, (err) => {
                this.bankSheetMaster = [];
                this.spinner.hide();
                this.toastr.error(Global.showServerErrorMessage(err));
                resolve(true);
            });
        })
    }

    filterPayload: any = {};
    filterTable(payload: any) {
        this.filterPayload = payload;
        this.generateMasterSheet({ resetCheckboxed: true });
    }

    generateMasterSheet({
        page = <any>null,
        options = <TableFiilterOptions>this.tableFilterOptions,
        resetCheckboxed = <boolean>false
    } = {}) {
        return new Promise((resolve, reject) => {
            if (resetCheckboxed == true) { this.resetCheckboxChecked(); }

            if (page != null) {
                this.paginationOptions.page = page;
            }

            this.tableFilterOptions = options;

            let payload: any = this.getReportPayload();
            payload.pageno = this.paginationOptions.page;
            payload.perpage = this.tableFilterOptions.length;

            this.spinner.show();
            this.companyuserService.getMasterSheet(payload).subscribe(res => {
                if (res.status == 'success') {
                    this.empReportData = [];
                    let master_data = res?.master_data?.docs ?? [];
                    master_data.forEach((element: any) => {
                        element.master_report.checked = this.isRowChecked(element._id);

                        this.empReportData.push(element.master_report);
                    });

                    this.paginationOptions = {
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
                } else {
                    this.empReportData = [];
                    this.paginationOptions = Global.resetPaginationOption();
                }

                this.spinner.hide();
                this.restoreReportTempData()
                Global.loadCustomScripts('customJsScript');
                resolve(true);
            }, (err) => {
                this.empReportData = [];
                this.paginationOptions = Global.resetPaginationOption();
                this.spinner.hide();
                this.restoreReportTempData()
                Global.loadCustomScripts('customJsScript');
                resolve(true);
            });
        })
    }

    getReportPayload() {
        let payload: any = {
            'wage_month': this.filterPayload.month?.index ?? "",
            'wage_year': this.filterPayload.year?.value ?? "",
            'branch_id': this.filterPayload?.branch_id ?? "",
            'designation_id': this.filterPayload?.designation_id ?? "",
            'department_id': this.filterPayload?.department_id ?? "",
            'hod_id': this.filterPayload?.hod_id ?? "",
            'client_id': this.filterPayload?.client_id ?? "",
            'row_checked_all': this.rowCheckedAll,
            'checked_row_ids': JSON.stringify(this.checkedRowIds),
            'unchecked_row_ids': JSON.stringify(this.uncheckedRowIds),
        }

        // Remove key if value not exist
        for (const key in payload) {
            if (Object.prototype.hasOwnProperty.call(payload, key)) {
                const value = payload[key];
                if (value === "") {
                    delete payload[key];
                }
            }
        }

        return payload;
    }

    private isRowChecked(rowId: any) {
        if (!this.rowCheckedAll) {
            return this.checkedRowIds.indexOf(rowId) >= 0 ? true : false;
        }
        else {
            return this.uncheckedRowIds.indexOf(rowId) >= 0 ? false : true;
        }
    }

    rowCheckBoxChecked(event: any, row: any) {
        let rowId: any = row?.emp_data?._id;
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

    resetCheckboxChecked() {
        $('#rowcheckedall').prop("checked", false);
        this.rowCheckedAll = false;
        this.checkedRowIds = [];
        this.uncheckedRowIds = [];
    }

    allRowsCheckboxChecked(event: any) {
        if (this.rowCheckedAll) {
            this.uncheckedRowIds.length = 0;
            this.rowCheckedAll = false;
        } else {
            this.checkedRowIds.length = 0;
            this.rowCheckedAll = true;
        }

        this.generateMasterSheet()
        // this.fetchEmployees()
    }

    restoreReportTempData() {
        let master_head_includes: any[] = []
        let head_includes: any[] = []
        let extra_earning_data: any[] = []

        if (this.empReportData.length > 0) {
            // Generating Report Available Heads
            this.empReportData.forEach(reportData => {
                (reportData.heads_rate ?? []).forEach((head: any) => {
                    let exist = master_head_includes.find((obj: any) => {
                        return obj.head_id == head.head_id
                    }) ?? null;

                    if (!exist) {
                        master_head_includes.push({
                            amount: head.amount,
                            head_id: head.head_id,
                            head_rate: head.head_rate,
                            head_rate_type: head.head_rate_type,
                            head_title: head.head_title,
                            head_abbreviation: head.head_abbreviation,
                        });
                    }
                });
            });

            // Generating Report Available Heads
            this.empReportData.forEach(reportData => {
                (reportData.heads ?? []).forEach((head: any) => {
                    let exist = head_includes.find((obj: any) => {
                        return obj.head_id == head.head_id
                    }) ?? null;

                    if (!exist) {
                        head_includes.push({
                            head_id: head.head_id,
                            head_rate: head.head_rate,
                            head_rate_type: head.head_rate_type,
                            head_title: head.head_title,
                            head_abbreviation: head.head_abbreviation,
                        });
                    }
                });
            });

            // Generate Extra Earning Heads
            this.empReportData.forEach(reportData => {
                (reportData.extra_earning_data ?? []).forEach((extraEarning: any) => {
                    let exist = extra_earning_data.find((obj: any) => {
                        return obj.earning_abbreviation == extraEarning.earning_abbreviation
                    }) ?? null;

                    if (!exist) {
                        extra_earning_data.push({
                            earning_title: extraEarning.earning_title,
                            earning_abbreviation: extraEarning.earning_abbreviation,
                        });
                    }
                });
            });
        }

        // console.log('master_head_includes : ', master_head_includes)
        // console.log('head_includes : ', head_includes)
        // console.log('extra_earning_data : ', extra_earning_data)

        this.empReportTempData = {
            master_head_includes: master_head_includes,
            head_includes: head_includes,
            extra_earning_data: extra_earning_data
        }

        // console.log('empReportTempData : ', this.empReportTempData);
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
                if (field_slug == 'month_days' && module_slug == 'attendance') {
                    let monthIndex = report?.emp_data?.attendance_summaries?.attendance_month;
                    let year = report?.emp_data?.attendance_summaries?.attendance_year

                    let month = this.monthMaster.find((obj: any) => {
                        return obj.index == monthIndex;
                    })

                    if (month) {
                        let days = month.days;

                        if (year % 4 == 0 && month.index == 1) { // For Feb & Leap Year
                            days++;
                        }

                        return days
                    }
                }

                let mapping = field.mapping.split('.')

                if (mapping.length > 0) {
                    let value = report;
                    mapping.forEach((key: any) => {
                        if (value !== null && value !== undefined) {
                            value = value[key] ?? null;
                        }
                    });

                    return value ?? null
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

    getHeadValue(heads: any[], head_id: any, key: any) {
        let head = heads.find((obj: any) => {
            return obj.head_id == head_id
        }) ?? null;

        if (head) {
            return head[key] ?? 0;
        } else {
            return 0
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
     * ============================
     * TEMPLATE SELECTION FUNCTIONS
     * ============================
     */

    fetchSettingsTemplate() {
        return new Promise((resolve, reject) => {
            this.sheetTemplateMaster = [];

            this.spinner.show();
            this.companyuserService.fetchSalarySheetTemplates({
                'pageno': 1,
            }).subscribe(res => {
                this.spinner.hide();
                if (res.status == 'success') {
                    this.sheetTemplateMaster = res?.earning_sheet_temp?.docs ?? [];
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
    generateReport() {
        let payload: any = this.getReportPayload();

        this.spinner.show();
        this.companyuserService.generateChallanReport(payload, this.challanType)
            .subscribe((res: any) => {
                if (res.status == 'success') {
                    this.toastr.success("Report Generated Successfully");

                    this.generateMasterSheet({ resetCheckboxed: true });
                } else {
                    this.toastr.error(res.message);
                }

                this.spinner.hide();
            }, (err: any) => {
                this.toastr.error(Global.showServerErrorMessage(err));
                this.spinner.hide();
            })
    }
}
