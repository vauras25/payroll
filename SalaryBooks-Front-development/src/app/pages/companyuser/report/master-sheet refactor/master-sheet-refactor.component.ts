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
import swal from 'sweetalert2';

import jsPDF from 'jspdf';
const pdfMake = require('pdfmake/build/pdfmake')
const pdfFonts = require('pdfmake/build/vfs_fonts')
pdfMake.vfs = pdfFonts.pdfMake.vfs;
const htmlToPdfmake = require('html-to-pdfmake')
import { _salarySheetTempMaster } from '../_salarySheetTempMaster';

@Component({
  selector: 'app-companyuser-master-sheet-report-refactor',
  templateUrl: './master-sheet-refactor.component.html',
  styleUrls: ['./master-sheet-refactor.component.css'],
})
export class CMPMasterSheetReportRefactorComponent implements OnInit {
  @ViewChild('salarysheetreporttable', { static: false }) el!: ElementRef;

  filterForm: UntypedFormGroup;
  templateForm: UntypedFormGroup;
  generateReportForm: UntypedFormGroup;

  monthMaster: any[] = [];
  yearMaster: any[] = [];
  sheetTemplate: any[] = _salarySheetTempMaster;
  private _tempSheetTemplate: any[] = this.sheetTemplate;
  sheetTemplateMaster: any[] = [];
  departmentMaster: any[] = [];
  designationMaster: any[] = [];
  branchMaster: any[] = [];
  hodMaster: any[] = [];

  empReportData: any[] = [];
  empReportGenerated: Boolean = false;
  empReportTempData: any = {
    master_head_includes: [],
    head_includes: [],
    extra_earning_data: [],
  };

  rowCheckedAll: Boolean = false;
  checkedRowIds: any[] = [];
  uncheckedRowIds: any[] = [];

  Global = Global;
  paginationOptions: PaginationOptions = Global.resetPaginationOption();
  // tableFilterOptions: TableFiilterOptions = Global.resetTableFilterOptions();
  holdedSalarypaginationOptions: PaginationOptions =
    Global.resetPaginationOption();
  employeeListFilter: any = {};

  constructor(
    private titleService: Title,
    private toastr: ToastrService,
    protected companyuserService: CompanyuserService,
    private spinner: NgxSpinnerService,
    public formBuilder: UntypedFormBuilder,
    private datePipe: DatePipe
  ) {
    this.filterForm = formBuilder.group({
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

    let currentYear = new Date().getFullYear();
    this.yearMaster = [];
    for (let index = 4; index >= 0; index--) {
      this.yearMaster.push({
        value: currentYear - index,
        description: currentYear - index,
      });
    }

    this.templateForm = formBuilder.group({
      template_name: [null, Validators.compose([Validators.required])],
    });

    this.generateReportForm = formBuilder.group({
      template: [null, Validators.compose([])],
    });

    // this.generateReportForm.get('template')?.valueChanges.subscribe(async val => {
    //     if (val?._id) {
    //         await this.generateTemplate(val);
    //     } else {
    //         this.cancelSheetTemplateSelection();
    //     }

    //     Global.loadCustomScripts('customJsScript');
    // })
  }

  async ngOnInit() {
    this.titleService.setTitle('Salary Sheet - ' + Global.AppName);

    this.filterForm.patchValue({
      month:
        this.monthMaster.find((obj: any) => {
          return obj.index == 0;
          return obj.index == new Date().getMonth();
        }) ?? null,

      year:
        this.yearMaster.find((obj: any) => {
          // return obj.value == 2022
          return obj.value == new Date().getFullYear();
        }) ?? null,
    });

    // await this.fetchMasters();
    // await this.generateMasterSheet();
    // await this.fetchSettingsTemplate();
  }

  fetchMasters() {
    return new Promise((resolve, reject) => {
      this.spinner.show();
      this.companyuserService.getEmployeeMaster().subscribe(
        (res: any) => {
          if (res.status == 'success') {
            this.branchMaster = [];
            if (
              res.masters.branch?.company_branch &&
              Array.isArray(res.masters.branch?.company_branch)
            ) {
              res.masters.branch?.company_branch.forEach((element: any) => {
                this.branchMaster.push({
                  id: element._id,
                  description: element.branch_name,
                });
              });
            }

            if (
              res.masters.designation &&
              Array.isArray(res.masters.designation)
            ) {
              this.designationMaster = [];
              res.masters.designation.forEach((element: any) => {
                this.designationMaster.push({
                  id: element._id,
                  description: element.designation_name,
                });
              });
            }

            if (
              res.masters.department &&
              Array.isArray(res.masters.department)
            ) {
              this.departmentMaster = [];
              res.masters.department.forEach((element: any) => {
                this.departmentMaster.push({
                  id: element._id,
                  description: element.department_name,
                });
              });
            }
          } else {
            this.toastr.error(res.message);
          }

          this.spinner.hide();
          resolve(true);
        },
        (err) => {
          this.spinner.hide();
          this.toastr.error(Global.showServerErrorMessage(err));
          resolve(true);
        }
      );
    });
  }

  generateMasterSheet({ page = <any>null, options = <any>{} } = {}) {
    this.employeeListFilter = options;
    return new Promise((resolve, reject) => {
      if (this.employeeListFilter) {
        if (page != null) {
          this.paginationOptions.page = page;
        }

        let payload: any = this.getReportPayload();
        payload.pageno = this.paginationOptions.page;
        // payload.perpage = this.tableFilterOptions.length;

        this.spinner.show();

        this.companyuserService.getMasterSheet(payload).subscribe(
          (res) => {
            if (res.status == 'success') {
              this.empReportData = [];
              let master_data = res?.master_data?.docs ?? [];
              master_data.forEach((element: any) => {
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
            this.restoreReportTempData();
            Global.loadCustomScripts('customJsScript');
            resolve(true);
          },
          (err) => {
            this.empReportData = [];
            this.paginationOptions = Global.resetPaginationOption();
            this.spinner.hide();
            this.restoreReportTempData();
            Global.loadCustomScripts('customJsScript');
            resolve(true);
          }
        );
      }
    });
  }

  getReportPayload() {
    let payload: any = {
      wage_month: this.employeeListFilter.month?.index ?? '',
      wage_year: this.employeeListFilter.year?.value ?? '',
      row_checked_all: this.rowCheckedAll,
      checked_row_ids: JSON.stringify(this.checkedRowIds),
      unchecked_row_ids: JSON.stringify(this.uncheckedRowIds),
      hod_id: this.employeeListFilter?.hod_id ?? null,
      department_id: this.employeeListFilter?.department_id ?? null,
      designation_id: this.employeeListFilter?.designation_id ?? null,
      branch_id: this.employeeListFilter?.branch_id ?? null,
    };

    // if (this.filterForm.value.hod != null) {
    //     if (Array.isArray(this.filterForm.value.hod)) {
    //         payload.hod_id = [];
    //         this.filterForm.value.hod.forEach((element: any) => {
    //             payload.hod_id.push(element.id)
    //         });

    //         if (payload.hod_id.length > 0) {
    //             payload.hod_id = JSON.stringify(payload.hod_id)
    //         } else {
    //             payload.hod_id = null;
    //         }
    //     } else {
    //         payload.hod_id = this.filterForm.value.hod.id;
    //     }
    // }

    // if (this.filterForm.value.department != null) {
    //     if (Array.isArray(this.filterForm.value.department)) {
    //         payload.department_id = [];
    //         this.filterForm.value.department.forEach((element: any) => {
    //             payload.department_id.push(element.id)
    //         });

    //         if (payload.department_id.length > 0) {
    //             payload.department_id = JSON.stringify(payload.department_id)
    //         } else {
    //             payload.department_id = null;
    //         }
    //     } else {
    //         payload.department_id = this.filterForm.value.department.id;
    //     }
    // }

    // if (this.filterForm.value.designation != null) {
    //     if (Array.isArray(this.filterForm.value.designation)) {
    //         payload.designation_id = [];
    //         this.filterForm.value.designation.forEach((element: any) => {
    //             payload.designation_id.push(element.id)
    //         });

    //         if (payload.designation_id.length > 0) {
    //             payload.designation_id = JSON.stringify(payload.designation_id)
    //         } else {
    //             payload.designation_id = null;
    //         }
    //     } else {
    //         payload.designation_id = this.filterForm.value.designation.id;
    //     }
    // }

    // if (this.filterForm.value.branch != null) {
    //     if (Array.isArray(this.filterForm.value.branch)) {
    //         payload.branch_id = [];
    //         this.filterForm.value.branch.forEach((element: any) => {
    //             payload.branch_id.push(element.id)
    //         });

    //         if (payload.branch_id.length > 0) {
    //             payload.branch_id = JSON.stringify(payload.branch_id)
    //         } else {
    //             payload.branch_id = this.filterForm.value.designation.id;
    //         }
    //     } else {
    //         payload.branch_id = this.filterForm.value.branch.id;
    //     }
    // }

    return payload;
  }

  private isRowChecked(rowId: any) {
    if (!this.rowCheckedAll) {
      return this.checkedRowIds.indexOf(rowId) >= 0 ? true : false;
    } else {
      return this.uncheckedRowIds.indexOf(rowId) >= 0 ? false : true;
    }
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

    // this.fetchEmployees()
  }

  restoreReportTempData() {
    let master_head_includes: any[] = [];
    let head_includes: any[] = [];
    let extra_earning_data: any[] = [];

    if (this.empReportData.length > 0) {
      // Generating Report Available Heads
      this.empReportData.forEach((reportData) => {
        (reportData.heads_rate ?? []).forEach((head: any) => {
          let exist =
            master_head_includes.find((obj: any) => {
              return obj.head_id == head.head_id;
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
      this.empReportData.forEach((reportData) => {
        (reportData.heads ?? []).forEach((head: any) => {
          let exist =
            head_includes.find((obj: any) => {
              return obj.head_id == head.head_id;
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
      this.empReportData.forEach((reportData) => {
        (reportData.extra_earning_data ?? []).forEach((extraEarning: any) => {
          let exist =
            extra_earning_data.find((obj: any) => {
              return (
                obj.earning_abbreviation == extraEarning.earning_abbreviation
              );
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
      extra_earning_data: extra_earning_data,
    };

    // console.log('empReportTempData : ', this.empReportTempData);
  }

  generateReportPdf() {
    let pdf = new jsPDF('l', 'pt', 'a1', true);
    pdf.html(this.el.nativeElement, {
      callback: (pdf) => {
        pdf.save('salarysheetreporttable.pdf');
      },
    });
  }

  getIndexValue(obj: any, key: string) {
    return obj[key];
  }

  getSheetTemplateMasterHeadColspan(main_slug: any) {
    let cntr: number = 0;

    let _sTemplate: any[] = this._tempSheetTemplate;

    let _mainModule: any = _sTemplate.find((obj: any) => {
      return obj.main_slug == main_slug;
    });

    _mainModule.modules.forEach((element: any) => {
      cntr += this.getSheetTemplateHeadColspan(
        main_slug,
        element.module_slug,
        true
      );
    });

    return cntr;
  }

  getSheetTemplateHeadColspan(
    main_slug: any,
    module_slug: any,
    isFromMaster = false
  ) {
    let _sTemplate: any[] = this._tempSheetTemplate;

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

      if (dynamicMasterHeadFieldLength > 0) {
        length +=
          (this.empReportTempData.master_head_includes ?? []).length *
            dynamicMasterHeadFieldLength -
          dynamicMasterHeadFieldLength;
      } else if (dynamicMasterHeadFieldLength == 0 && isFromMaster == true) {
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

  getSheetTemplateReportValue(
    main_slug: any,
    module_slug: any,
    field_slug: any,
    report: any
  ) {
    let _sTemplate: any[] = this._tempSheetTemplate;

    let _mainModule: any = _sTemplate.find((obj: any) => {
      return obj.main_slug == main_slug;
    });

    const module = _mainModule.modules.find((obj: any) => {
      return obj.module_slug == module_slug;
    });

    if (module) {
      const field = (module.fields ?? []).find((obj: any) => {
        return obj.slug == field_slug;
      });

      if (field) {
        if (field_slug == 'month_days' && module_slug == 'attendance') {
          let monthIndex =
            report?.emp_data?.attendance_summaries?.attendance_month;
          let year = report?.emp_data?.attendance_summaries?.attendance_year;

          let month = this.monthMaster.find((obj: any) => {
            return obj.index == monthIndex;
          });

          if (month) {
            let days = month.days;

            if (year % 4 == 0 && month.index == 1) {
              // For Feb & Leap Year
              days++;
            }

            return days;
          }
        }

        let mapping = field.mapping.split('.');

        if (mapping.length > 0) {
          let value = report;
          mapping.forEach((key: any) => {
            if (value !== null && value !== undefined) {
              value = value[key] ?? null;
            }
          });

          return value ?? null;
        } else {
          return null;
        }
      } else {
        return null;
      }
    } else {
      return null;
    }
  }

  /**
   * =========================
   * DYNAMIC BREAKUP Functions
   * =========================
   */

  getHeadValue(heads: any[], head_id: any, key: any) {
    let head =
      heads.find((obj: any) => {
        return obj.head_id == head_id;
      }) ?? null;

    if (head) {
      return head[key] ?? 0;
    } else {
      return 0;
    }
  }

  /**
   * =========================
   * EXTRA EARNING Functions
   * =========================
   */

  getExtraEarningValue(
    extraEarnings: any[],
    earning_abbreviation: any,
    key: any
  ) {
    let earning =
      extraEarnings.find((obj: any) => {
        return obj.earning_abbreviation == earning_abbreviation;
      }) ?? null;

    if (earning) {
      return earning[key] ?? 0;
    } else {
      return 0;
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
    this.resetSelectedModules();
  }

  async submitTemplate(event: any) {
    this.templateForm.markAllAsTouched();
    setTimeout(() => {
      Global.scrollToQuery('p.text-danger');
    }, 300);

    let modules: any = await this.getSelecteModules();
    if (Object.keys(modules).length < 1) {
      this.toastr.error('Please select atleast one field');
      return;
    }

    if (this.templateForm.valid && Object.keys(modules).length > 0) {
      let document = {
        template_name: this.templateForm.value.template_name,
        template_fields: JSON.stringify(modules),
      };

      event.target.classList.add('btn-loading');
      this.companyuserService.createEmployeeSheetTemplate(document).subscribe(
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
          event.target.classList.remove('btn-loading');
        },
        (err) => {
          event.target.classList.remove('btn-loading');
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

  resetSelectedModules() {
    this.sheetTemplate.forEach((row) => {
      $('input[name="fields[' + row.module_slug + ']"]:checked').each(
        function () {
          $(this).prop('checked', false);
        }
      );
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
      this.companyuserService
        .fetchSalarySheetTemplates({
          pageno: 1,
        })
        .subscribe(
          (res) => {
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
          },
          (err) => {
            this.spinner.hide();
            this.toastr.error(Global.showServerErrorMessage(err));
            reject(Global.showServerErrorMessage(err));
          }
        );
    });
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
          this.toastr.error('No module available for this template');
          return;
        }

        let tempTemplateMaster: any[] = [];
        selectedTemplateFields.forEach((selectedTemplateField: any) => {
          let tempMainModule = this.sheetTemplate.find((obj: any) => {
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
                    return obj.slug == field;
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

        this._tempSheetTemplate = tempTemplateMaster;
        resolve(true);
      } else {
        this.toastr.error('No Template Found Exception');
        reject('No Template Found Exception');
      }
    });
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
        await this.companyuserService.downloadFile(
          'export-master-sheet-data',
          'Master-Sheet-Data',
          payload
        );
        // this.companyuserService.exportMasterSheet(payload).subscribe((res: any) => {
        //     if (res.status == 'success') {
        //         window.open(res.url);
        //     } else {
        //     }

        // }, (err: any) => {
        //     this.toastr.error(Global.showServerErrorMessage(err));
        //     this.spinner.hide();
        // })
      }
    } catch (err: any) {
      this.toastr.error(err.message);
      this.spinner.hide();
    }
  }

  rowSelecion(e: any): void {
    document.getElementsByName(e.target?.name)?.forEach((checkbox: any) => {
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
