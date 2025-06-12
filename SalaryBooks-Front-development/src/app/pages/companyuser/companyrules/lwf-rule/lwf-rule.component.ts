import { Component, OnInit } from '@angular/core';
import {
  UntypedFormArray,
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
  FormArray,
  AbstractControl,
} from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { CompanyuserService } from 'src/app/services/companyuser.service';
import * as Global from 'src/app/globals';
import swal from 'sweetalert2';
import PaginationOptions from 'src/app/models/PaginationOptions';
import { DatePipe } from '@angular/common';
import { json } from 'stream/consumers';
import { Router } from '@angular/router';

@Component({
  selector: 'companyuser-app-lwf-rule',
  templateUrl: './lwf-rule.component.html',
  styleUrls: ['./lwf-rule.component.css'],
})
export class CMPLwfRuleComponent implements OnInit {
  lwfRuleForm: UntypedFormGroup;
  editActionId: String;
  dtOptions: DataTables.Settings = {};
  dtOptionsLibrary: DataTables.Settings = {};
  Global = Global;
  stateMaster: any[] = [];
  tenureMaster: any[] = [];
  templateRows: any[] = [];
  libraryTemplateRows: any[] = [];
  paginationOptions: PaginationOptions;
  libraryPaginationOptions: PaginationOptions;

  constructor(
    public formBuilder: UntypedFormBuilder,
    private titleService: Title,
    private toastr: ToastrService,
    private companyuserService: CompanyuserService,
    private router: Router,
    private spinner: NgxSpinnerService,
    private datePipe: DatePipe
  ) {

    if (
      !Global.checkCompanyModulePermission({
        company_module: 'company_rules_2',
        company_sub_module: 'lwf_rules',
        company_sub_operation: ['view'],
        company_strict: true,
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

    this.lwfRuleForm = formBuilder.group({
      state: [null, Validators.compose([Validators.required])],
      effective_form: [null, Validators.compose([Validators.required])],
      from_date: [null, Validators.compose([Validators.required])],
      to_date: [null, Validators.compose([Validators.required])],
      wage_band: [null, Validators.compose([])],
      gross_type: [null, Validators.compose([Validators.required])],
      from_date_2: [null, Validators.compose([Validators.required])],
      to_date_2: [null, Validators.compose([Validators.required])],
      wage_band_2: [null, Validators.compose([])],
      template_data: this.formBuilder.array([
        this.initTemplateRows('template_data'),
      ]),
      template_data_2: this.formBuilder.array([
        this.initTemplateRows('template_data'),
      ]),
    });

    if(!this.lwfRuleForm.get('wage_band')?.value){
      if(this.lwfRuleForm.get('template_data')?.value?.length){
        const contol: AbstractControl = this.getTemplateRows('template_data')[0];
        contol.get('last_slab')?.disable()
        // this.lwfRuleForm.get('template_data')?.value[0]?.get('last_slab').disable()
      }
    }
    if(!this.lwfRuleForm.get('wage_band_2')?.value){
      if(this.lwfRuleForm.get('template_data_2')?.value?.length){
        const contol: AbstractControl = this.getTemplateRows('template_data_2')[0];
        contol.get('last_slab')?.disable()
        // this.lwfRuleForm.get('template_data')?.value[0]?.get('last_slab').disable()
      }
    }

    this.editActionId = '';

    this.tenureMaster = [
      { value: 'Annualy', description: 'Annually' },
      { value: 'Quaterly', description: 'Quaterly' },
      { value: 'Monthly', description: 'Monthly' },
    ];

    this.paginationOptions = this.libraryPaginationOptions = {
      hasNextPage: false,
      hasPrevPage: false,
      limit: Global.DataTableLength,
      nextPage: null,
      page: 1,
      pagingCounter: 1,
      prevPage: null,
      totalDocs: 0,
      totalPages: 1,
    };
  }

  async ngOnInit() {
    this.titleService.setTitle('LWF Rule - ' + Global.AppName);

    await this.fetchStateMaster();
    await this.fetch();
    await this.fetchTemplateLibrary();
  }

  initTemplateRows(type: any, data: any = {}, last_slab = false) {
    const form = this.lwfRuleForm
    switch (type) {
      case 'template_data':
        // data = {
        //   from_date: "2022-01-01",
        //   to_date: "2022-01-12",
        //   wage_band: "",
        //   wage_from: "",
        //   wage_to: "",
        //   employee_contribution: 1500,
        //   employer_contribution: 1500,
        //   gross_type: "na",
        //   effective_form: "2022-01-01",
        // }

       const form = this.formBuilder.group({
          wage_from: [data.wage_from ?? null, Validators.compose([])],
          wage_to: [data.wage_to ?? null, Validators.compose([])],
          employee_contribution: [
            data.employee_contribution ?? null,
            Validators.compose([Validators.required]),
          ],
          employer_contribution: [
            data.employer_contribution ?? null,
            Validators.compose([Validators.required]),
          ],
          last_slab: [last_slab, Validators.compose([Validators.required])],
        });

        return form
        break;

      case 'template_data_2':
        // data = {
        //   from_date: "2022-01-01",
        //   to_date: "2022-01-12",
        //   wage_band: "",
        //   wage_from: "",
        //   wage_to: "",
        //   employee_contribution: 1500,
        //   employer_contribution: 1500,
        //   gross_type: "na",
        //   effective_form: "2022-01-01",
        // }

        return this.formBuilder.group({
          wage_from: [data.wage_from ?? null, Validators.compose([])],
          wage_to: [data.wage_to ?? null, Validators.compose([])],
          employee_contribution: [
            data.employee_contribution ?? null,
            Validators.compose([Validators.required]),
          ],
          employer_contribution: [
            data.employer_contribution ?? null,
            Validators.compose([Validators.required]),
          ],
          last_slab: [last_slab, Validators.compose([Validators.required])],

        });
        break;

      default:
        return this.formBuilder.group({});
        break;
    }
  }

  getTemplateRows(type: any) {
    return (this.lwfRuleForm.get(type) as UntypedFormArray).controls;
  }

  removeTemplateRow(type: any, i: number) {
    const control = <UntypedFormArray>this.lwfRuleForm.get(type);
    control.removeAt(i);
  }

  addTemplateRows(type: any, data: any = {}, last_slab: any = false) {
    const control = <UntypedFormArray>this.lwfRuleForm.get(type);
    if (last_slab == 'yes') {
      last_slab = true;
    } else if (last_slab == 'no') {
      last_slab = false;
    }
    control.push(this.initTemplateRows(type, data, last_slab));

    if(last_slab){
      this.configLastSlab({checked:last_slab}, type)
    }

    Global.loadCustomScripts('customJsScript');
  }

  resetAllTemplateRows(isEditing: any = false) {
    let arr = ['template_data'];
    arr.forEach((element) => {
      const control = <UntypedFormArray>this.lwfRuleForm.get(element);
      control.clear();
    });

    if (isEditing == false) {
      arr.forEach((element) => {
        this.addTemplateRows(element);
      });
    }
  }

  fetchStateMaster() {
    const _this = this;
    return new Promise((resolve, reject) => {
      _this.spinner.show();
      _this.companyuserService.fetchStates().subscribe(
        (res) => {
          if (res.status == 'success') {
            _this.stateMaster = [];

            for (const key in res.state_list[0].states) {
              if (
                Object.prototype.hasOwnProperty.call(
                  res.state_list[0].states,
                  key
                )
              ) {
                const element = res.state_list[0].states[key];
                _this.stateMaster.push({
                  state_code: element.state_code,
                  description: element.name,
                });
              }
            }
          } else {
            _this.toastr.error(res.message);
          }

          _this.spinner.hide();
          resolve(true);
        },
        (err) => {
          _this.toastr.error(Global.showServerErrorMessage(err));
          _this.spinner.hide();
          resolve(true);
        }
      );
    });
  }

  cancelEntry(isEditing: any = false) {
    this.editActionId = '';
    this.resetAllTemplateRows(isEditing);
    Global.resetForm(this.lwfRuleForm);
    (this.lwfRuleForm.controls['template_data'] as FormArray).clear();
    this.addTemplateRows('template_data');
    (this.lwfRuleForm.controls['template_data_2'] as FormArray).clear();
    this.addTemplateRows('template_data_2');
    Global.scrollToQuery('#lwf-rule-form');
  }

  getEdit(item: any) {
    this.cancelEntry(true);
    this.editActionId = item._id;
    var datePipe = new DatePipe('en-US');
    this.lwfRuleForm.patchValue({
      state:
        this.stateMaster.find((obj: any) => {
          return obj.state_code == item.state;
        }) ?? null,
      gross_type: item.gross_type,
      effective_form: item.effective_form
        ? datePipe.transform(item.effective_form, 'yyyy-MM-dd')
        : null,
      wage_band: item.period_one.wage_band == 'yes' ? true : false,
      wage_band_2: item.period_two.wage_band == 'yes' ? true : false,
      from_date:
        Global.monthMaster.find((obj: any) => {
          return obj.index == item.period_one.from_month;
        }) ?? null,
      to_date:
        Global.monthMaster.find((obj: any) => {
          return obj.index == item.period_one.to_month;
        }) ?? null,
      from_date_2:
        Global.monthMaster.find((obj: any) => {
          return obj.index == item.period_two.from_month;
        }) ?? null,
      to_date_2:
        Global.monthMaster.find((obj: any) => {
          return obj.index == item.period_two.to_month;
        }) ?? null,
    });

    (this.lwfRuleForm.controls['template_data'] as FormArray).clear();

    item.period_one.lwf_slab.forEach((element: any) => {
      let data: any = {
        wage_from: element.wage_from ?? null,
        wage_to: element.wage_to ?? null,
        employee_contribution: element.employee_contribution ?? null,
        employer_contribution: element.employer_contribution ?? null,
        last_slab:element.last_slab
      };

      this.addTemplateRows('template_data', data, element.last_slab);
    });
    (this.lwfRuleForm.controls['template_data_2'] as FormArray).clear();
    item.period_two.lwf_slab.forEach((element: any) => {
      let data: any = {
        wage_from: element.wage_from ?? null,
        wage_to: element.wage_to ?? null,
        employee_contribution: element.employee_contribution ?? null,
        employer_contribution: element.employer_contribution ?? null,
        last_slab:element.last_slab
      };

      this.addTemplateRows('template_data_2', data, element.last_slab);
    });
    Global.scrollToQuery('#lwf-rule-form');
  }

  add(event: any) {
    this.lwfRuleForm.markAllAsTouched();
    Global.scrollToQuery('p.text-danger');

    let template_data: any = this.getTemplateDataForSubmit();
    let template_data_2: any = this.getTemplateDataForSubmit_2();

    if (this.lwfRuleForm.valid && template_data) {
      event.target.classList.add('btn-loading');
      let form_data = this.lwfRuleForm.value;

      form_data = {
        state: this.lwfRuleForm.value.state?.state_code ?? '',
        gross_type: this.lwfRuleForm.value?.gross_type ?? '',
        effective_form: this.lwfRuleForm.value?.effective_form ?? '',
        period_one: JSON.stringify({
          wage_band: this.lwfRuleForm.value?.wage_band ? 'yes' : 'no',
          from_month: this.lwfRuleForm.value.from_date?.index ?? '',
          to_month: this.lwfRuleForm.value.to_date?.index ?? '',
          lwf_slab: template_data,
        }),
        period_two: JSON.stringify({
          wage_band: this.lwfRuleForm.value?.wage_band_2 ? 'yes' : 'no',
          from_month: this.lwfRuleForm.value.from_date_2?.index ?? '',
          to_month: this.lwfRuleForm.value.to_date_2.index ?? '',
          lwf_slab: template_data_2,
        }),
      };

      this.companyuserService.createLwfRule(form_data).subscribe(
        (res) => {
          if (res.status == 'success') {
            this.toastr.success(res.message);
            this.cancelEntry();

            this.fetch();
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

  edit(event: any) {
    this.lwfRuleForm.markAllAsTouched();
    Global.scrollToQuery('p.text-danger');

    let template_data: any = this.getTemplateDataForSubmit();
    let template_data_2: any = this.getTemplateDataForSubmit_2();

    if (this.lwfRuleForm.valid && template_data) {
      event.target.classList.add('btn-loading');
      let form_data = this.lwfRuleForm.value;

      form_data = {
        template_id: this.editActionId,
        publish_status: 'published',
        state: this.lwfRuleForm.value.state?.state_code ?? '',
        gross_type: this.lwfRuleForm.value?.gross_type ?? '',
        effective_form: this.lwfRuleForm.value?.effective_form ?? '',
        period_one: JSON.stringify({
          wage_band: this.lwfRuleForm.value?.wage_band ? 'yes' : 'no',
          from_month: this.lwfRuleForm.value.from_date?.index ?? '',
          to_month: this.lwfRuleForm.value.to_date?.index ?? '',
          lwf_slab: template_data,
        }),
        period_two: JSON.stringify({
          wage_band: this.lwfRuleForm.value?.wage_band_2 ? 'yes' : 'no',
          from_month: this.lwfRuleForm.value.from_date_2?.index ?? '',
          to_month: this.lwfRuleForm.value.to_date_2.index ?? '',
          lwf_slab: template_data_2,
        }),
      };
      this.companyuserService.updateLwfRule(form_data).subscribe(
        (res) => {
          if (res.status == 'success') {
            this.toastr.success(res.message);
            this.fetch();
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

  fetch(page: any = null,searchkey:any='') {
    return new Promise((resolve, reject) => {
      if (page != null) {
        this.paginationOptions.page = page;
      }

      this.spinner.show();
      this.companyuserService
        .fetchLwfRules({
          pageno: this.paginationOptions.page,
          perpage: this.paginationOptions.limit,
          searchkey:searchkey
        })
        .subscribe(
          (res) => {
            if (res.status == 'success') {
              this.templateRows = res.lwf_rule.docs;
              this.paginationOptions = {
                hasNextPage: res.lwf_rule.hasNextPage,
                hasPrevPage: res.lwf_rule.hasPrevPage,
                limit: res.lwf_rule.limit,
                nextPage: res.lwf_rule.nextPage,
                page: res.lwf_rule.page,
                pagingCounter: res.lwf_rule.pagingCounter,
                prevPage: res.lwf_rule.prevPage,
                totalDocs: res.lwf_rule.totalDocs,
                totalPages: res.lwf_rule.totalPages,
              };
            } else {
              this.toastr.error(res.message);

              this.templateRows = [];
              this.paginationOptions = {
                hasNextPage: false,
                hasPrevPage: false,
                limit: Global.DataTableLength,
                nextPage: null,
                page: 1,
                pagingCounter: 1,
                prevPage: null,
                totalDocs: 0,
                totalPages: 1,
              };
            }

            this.spinner.hide();
            Global.loadCustomScripts('customJsScript');
            resolve(true);
          },
          (err) => {
            this.templateRows = [];
            this.paginationOptions = {
              hasNextPage: false,
              hasPrevPage: false,
              limit: Global.DataTableLength,
              nextPage: null,
              page: 1,
              pagingCounter: 1,
              prevPage: null,
              totalDocs: 0,
              totalPages: 1,
            };

            this.spinner.hide();
            this.toastr.error(Global.showServerErrorMessage(err));
            Global.loadCustomScripts('customJsScript');
            resolve(true);
          }
        );
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
            .deleteLwfRule({
              template_id: item._id,
            })
            .subscribe(
              (res) => {
                if (res.status == 'success') {
                  this.toastr.success(res.message);
                  this.fetch();
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

  getStateDetails(code: any, key: any = null) {
    let leave_type = this.stateMaster.find((obj: any) => {
      return obj.state_code == code;
    });

    if (leave_type) {
      if (key) {
        return leave_type[key];
      } else {
        return leave_type;
      }
    } else {
      return null;
    }
  }

  getTemplateDataForSubmit() {
    let template_data: any = [];
    let flag = true;
    let row = 1;

    this.lwfRuleForm.value.template_data.forEach((element: any) => {
      if (
        element.wage_band == true &&
        !(element.wage_from && element.wage_to)
      ) {
        flag = false;
        this.toastr.error(
          'For Row ' +
            row +
            ': When the wage band is enabled, please enter starting and ending wage value'
        );
      }

      template_data.push({
        wage_from: element.wage_from ?? '',
        wage_to: element.wage_to ?? '',
        employee_contribution: element.employee_contribution ?? '',
        employer_contribution: element.employer_contribution ?? '',
        last_slab:element.last_slab
      });

      row++;
    });

    if (!flag) {
      return false;
    }

    if (template_data.length > 0) {
      return template_data;
    } else {
      this.toastr.error(
        'You must add atleast one template to submit the details'
      );
      return false;
    }
  }
  getTemplateDataForSubmit_2() {
    let template_data: any = [];
    let flag = true;
    let row = 1;

    this.lwfRuleForm.value.template_data_2.forEach((element: any) => {
      if (
        element.wage_band == true &&
        !(element.wage_from && element.wage_to)
      ) {
        flag = false;
        this.toastr.error(
          'For Row ' +
            row +
            ': When the wage band is enabled, please enter starting and ending wage value'
        );
      }

      template_data.push({
        wage_from: element.wage_from ?? '',
        wage_to: element.wage_to ?? '',
        employee_contribution: element.employee_contribution ?? '',
        employer_contribution: element.employer_contribution ?? '',
        last_slab:element.last_slab
      });

      row++;
    });

    if (!flag) {
      return false;
    }

    if (template_data.length > 0) {
      return template_data;
    } else {
      this.toastr.error(
        'You must add atleast one template to submit the details'
      );
      return false;
    }
  }

  openTemplateLibrary() {
    $('#librarymmodalbutton').click();
  }

  fetchTemplateLibrary(page: any = null) {
    return new Promise((resolve, reject) => {
      if (page != null) {
        this.libraryPaginationOptions.page = page;
      }

      this.spinner.show();
      this.companyuserService
        .fetchLwfRulesLibrary({
          pageno: this.libraryPaginationOptions.page,
        })
        .subscribe(
          (res) => {
            if (res.status == 'success') {
              this.libraryTemplateRows = res.ptax_rule.docs;
              this.libraryPaginationOptions = {
                hasNextPage: res.ptax_rule.hasNextPage,
                hasPrevPage: res.ptax_rule.hasPrevPage,
                limit: res.ptax_rule.limit,
                nextPage: res.ptax_rule.nextPage,
                page: res.ptax_rule.page,
                pagingCounter: res.ptax_rule.pagingCounter,
                prevPage: res.ptax_rule.prevPage,
                totalDocs: res.ptax_rule.totalDocs,
                totalPages: res.ptax_rule.totalPages,
              };
            } else {
              this.toastr.error(res.message);

              this.libraryTemplateRows = [];
              this.libraryPaginationOptions = {
                hasNextPage: false,
                hasPrevPage: false,
                limit: Global.DataTableLength,
                nextPage: null,
                page: 1,
                pagingCounter: 1,
                prevPage: null,
                totalDocs: 0,
                totalPages: 1,
              };
            }

            this.spinner.hide();
            Global.loadCustomScripts('customJsScript');
            resolve(true);
          },
          (err) => {
            this.libraryTemplateRows = [];
            this.libraryPaginationOptions = {
              hasNextPage: false,
              hasPrevPage: false,
              limit: Global.DataTableLength,
              nextPage: null,
              page: 1,
              pagingCounter: 1,
              prevPage: null,
              totalDocs: 0,
              totalPages: 1,
            };

            this.spinner.hide();
            this.toastr.error(Global.showServerErrorMessage(err));
            Global.loadCustomScripts('customJsScript');
            resolve(true);
          }
        );
    });
  }

  cloneItem(item: any) {
    $('[data-dismiss="modal"]')?.click();
    this.cancelEntry(true);
    // var datePipe = new DatePipe('en-US');
    var datePipe = new DatePipe('en-US');
    this.lwfRuleForm.patchValue({
      state:
        this.stateMaster.find((obj: any) => {
          return obj.state_code == item.state;
        }) ?? null,
      gross_type: item.gross_type,
      effective_form: item.effective_form
        ? datePipe.transform(item.effective_form, 'yyyy-MM-dd')
        : null,
      wage_band: item.period_one.wage_band == 'yes' ? true : false,
      wage_band_2: item.period_two.wage_band == 'yes' ? true : false,
      from_date:
        Global.monthMaster.find((obj: any) => {
          return obj.index == item.period_one.from_month;
        }) ?? null,
      to_date:
        Global.monthMaster.find((obj: any) => {
          return obj.index == item.period_one.to_month;
        }) ?? null,
      from_date_2:
        Global.monthMaster.find((obj: any) => {
          return obj.index == item.period_two.from_month;
        }) ?? null,
      to_date_2:
        Global.monthMaster.find((obj: any) => {
          return obj.index == item.period_two.to_month;
        }) ?? null,
    });

    (this.lwfRuleForm.controls['template_data'] as FormArray).clear();

    item.period_one.lwf_slab.forEach((element: any) => {
      let data: any = {
        wage_from: element.wage_from ?? null,
        wage_to: element.wage_to ?? null,
        employee_contribution: element.employee_contribution ?? null,
        employer_contribution: element.employer_contribution ?? null,
        last_slab:element.last_slab
      };

      this.addTemplateRows('template_data', data, element.last_slab);
    });
    (this.lwfRuleForm.controls['template_data_2'] as FormArray).clear();
    item.period_two.lwf_slab.forEach((element: any) => {
      let data: any = {
        wage_from: element.wage_from ?? null,
        wage_to: element.wage_to ?? null,
        employee_contribution: element.employee_contribution ?? null,
        employer_contribution: element.employer_contribution ?? null,
        last_slab:element.last_slab
      };

      this.addTemplateRows('template_data_2', data, element.last_slab);
    });
    Global.scrollToQuery('#lwf-rule-form');
  }

  show_addmore(ev: any, tpl: any = 'template_data') {
    if (!ev.target.checked) {
      let data = this.lwfRuleForm.controls[tpl].value[0];
      this.lwfRuleForm.get(tpl)?.setValue(this.initTemplateRows(tpl, data));
      (this.lwfRuleForm.controls[tpl] as FormArray).reset();
      this.addTemplateRows(tpl, data);
      
      let i = this.lwfRuleForm.get(tpl)?.value?.length - 1;
      if (i >= 0) {
        const contol: AbstractControl = this.getTemplateRows(tpl)[i];
        contol.get('last_slab')?.disable();
      }
    }else{
      let i = this.lwfRuleForm.get(tpl)?.value?.length - 1;
      if (i >= 0) {
        const contol: AbstractControl = this.getTemplateRows(tpl)[i];
        contol.get('last_slab')?.enable();
      }
    }
  }
  showMonth(i: any) {
    return Global.monthMaster.find((x: any) => x.index == i)?.sf;
  }

  configLastSlab(t: any, formField: any) {
    let i = this.lwfRuleForm.get(formField)?.value?.length - 1;
    if (i >= 0) {
      const contol: AbstractControl = this.getTemplateRows(formField)[i];
      if (t.checked) {
        contol.get('wage_to')?.disable();
        contol.get('wage_to')?.clearValidators();
        contol.get('wage_to')?.setValue(null);
        contol.get('wage_to')?.updateValueAndValidity();
      } else {
        contol.get('wage_to')?.enable();
        contol.get('wage_to')?.setValidators([Validators.required]);
        contol.get('wage_to')?.setValue(null);
        contol.get('wage_to')?.updateValueAndValidity();
      }
    }
    // console.log(this.pTaxRuleForm.get("tax_range_amount")?.value);
  }
}
