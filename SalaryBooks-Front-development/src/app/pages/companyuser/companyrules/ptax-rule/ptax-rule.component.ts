import { DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormControl,
  FormGroup,
  UntypedFormArray,
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';
import { disableDebugTools, Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { elementAt } from 'rxjs/operators';
import * as Global from 'src/app/globals';
import { CompanyuserService } from 'src/app/services/companyuser.service';
import swal from 'sweetalert2';

@Component({
  selector: 'companyuser-app-ptax-rule',
  templateUrl: './ptax-rule.component.html',
  styleUrls: ['./ptax-rule.component.css'],
})
export class CMPPtaxRuleComponent implements OnInit {
  dtOptions: DataTables.Settings = {};
  dtOptionsHistory: DataTables.Settings = {};
  dtOptionsLibrary: DataTables.Settings = {};
  pTaxRuleForm: UntypedFormGroup;
  editActionId: String;
  stateMaster: any[];
  salaryTypeMaster: any[];
  settlementMaster: any[];
  publishStatusMaster: any[];
  viewPTaxTemplate: any = null;
  viewPTaxTemplateHistory: any = null;
  initialValueBeforeUpdate: any = null;
  preferenceGroup: any[] = [];
  lastSlabControl: AbstractControl;
  Global = Global;
  presentSettlement:any = '';
  constructor(
    public formBuilder: UntypedFormBuilder,
    private titleService: Title,
    private toastr: ToastrService,
    private router: Router,
    private companyuserService: CompanyuserService,
    private spinner: NgxSpinnerService,
    private datePipe: DatePipe
  ) {
    this.pTaxRuleForm = formBuilder.group({
      state: [null, Validators.compose([Validators.required])],
      effective_from: [null, Validators.compose([Validators.required])],
      salary_type: [null, Validators.compose([Validators.required])],
      settlement_frequency: [null, Validators.compose([Validators.required])],
      publish_status: [null, Validators.compose([])],
      tax_range_amount: this.formBuilder.array([]),
      periods: this.formBuilder.array([]),
      template_name: [null, Validators.compose([])],
    });

    this.editActionId = '';
    this.stateMaster = [];

    this.publishStatusMaster = [
      { value: 'privet', description: 'Private' },
      { value: 'published', description: 'Published' },
    ];

    this.salaryTypeMaster = [
      { value: 'fixed', description: 'Fixed Salary' },
      { value: 'earned', description: 'Earned Salary' },
    ];

    this.settlementMaster = [
      { value: 'monthly', description: 'Monthly' },
      { value: 'quaterly', description: 'Quaterly' },
      { value: 'half_yearly', description: 'Half Yearly' },
      { value: 'yearly', description: 'Yearly' },
    ];
  }

  ngOnInit() {
    this.titleService.setTitle('P-TAX Template - ' + Global.AppName);
    if (
      !Global.checkCompanyModulePermission({
        company_module: 'gov_ptax_rule',
        company_operation: ['customizable', 'default'],
      }) &&
      !Global.checkCompanyModulePermission({
        company_module: 'company_rules_2',
        company_sub_module: 'p_tax_rules',
        company_sub_operation: ['view'],
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
    let control = this.pTaxRuleForm.get('tax_range_amount') as FormArray;
    control.push(this.initTemplateRows('tax_range_amount'));
    if (
      Global.checkCompanyModulePermission({
        company_module: 'gov_ptax_rule',
        company_operation: 'customizable',
      }) ||
      Global.checkCompanyModulePermission({
        company_module: 'company_rules_2',
        company_sub_module: 'p_tax_rules',
        company_sub_operation: ['view'],
      })
    ) {
      this.preferenceGroup.push('customizable');

      this.fetch();
      this.fetchTemplateLibrary();
      this.fetchStates();

      this.dtOptionsHistory = {
        ajax: (dataTablesParameters: any, callback) => {
          var result = this.getUpdateHistory();

          callback({
            recordsTotal: result.length,
            recordsFiltered: result.length,
            data: result.reverse(),
          });
        },
        columns: [
          {
            render: function (data, type, full, meta: any) {
              return meta.settings._iDisplayStart + (meta.row + 1);
            },
          },

          {
            render: function (data, type, full, meta) {
              return (
                `<button class="btn btn-info btn-icon mx-1" data-toggle="tooltip" data-placement="top" title="View Details" id="viewHistoryDetailsButton-` +
                meta.row +
                `">
                        <div style="width:25px; height:25px;"><i class="fa fa-eye"></i></div>
                    </button>`
              );
            },
            className: 'text-center',
          },
          {
            render: function (data, type, full, meta) {
              var date = full.created_at ? full.created_at : full.updated_at;

              var datePipe = new DatePipe('en-US');
              let value = datePipe.transform(date, 'dd/MM/yyyy hh:mm a');
              return value;
            },
          },
          {
            render: function (data, type, full, meta) {
              return full.user_name ?? 'N/A';
            },
          },
          {
            render: function (data, type, full, meta) {
              return full.template_name ?? 'N/A';
            },
          },
          {
            render: function (data, type, full, meta) {
              return full.state_name;
            },
          },
          {
            render: function (data, type, full, meta) {
              var datePipe = new DatePipe('en-US');
              let value = datePipe.transform(full.effective_from, 'dd/MM/yyyy');
              return value;
            },
          },
          {
            render: function (data, type, full, meta) {
              return full.salary_type
                ? `<span class="text-capitalize">` +
                    full.salary_type +
                    `</span>`
                : 'N/A';
            },
          },
          {
            render: function (data, type, full, meta) {
              return full.settlement_frequency
                ? `<span class="text-capitalize">` +
                    full.settlement_frequency +
                    `</span>`
                : 'N/A';
            },
          },
        ],
        drawCallback: function (settings) {
          Global.loadCustomScripts('customJsScript');
        },
        rowCallback: (row: Node, data: any[] | Object, index: number) => {
          const self = this;

          $('table').on(
            'click',
            '#viewHistoryDetailsButton-' + index,
            function () {
              self.viewHistoryDetails(data);
            }
          );

          return row;
        },
        searching: true,
        lengthChange: true,
        lengthMenu: Global.DataTableLengthChangeMenu,
        responsive: true,
        language: {
          searchPlaceholder: 'Search...',
          search: '',
        },
      };
    }
    this.pTaxRuleForm.get('settlement_frequency')?.valueChanges.subscribe((res:any)=>{

      this.presentSettlement = res?.value;      
      if (res?.value == 'monthly') {
        const taxRangeArray = this.pTaxRuleForm.get('tax_range_amount') as FormArray;
        taxRangeArray.clear();
        let control = this.pTaxRuleForm.get('periods') as FormArray;
        control.push(this.initPeriodsRows('tax_range_amount'))
      }
      else{
        const taxRangeArray = this.pTaxRuleForm.get('tax_range_amount') as FormArray;
        taxRangeArray.clear();
        const periodsArray = this.pTaxRuleForm.get('periods') as FormArray;
        periodsArray.clear();
        let control = this.pTaxRuleForm.get('tax_range_amount') as FormArray;
        control.push(this.initTemplateRows('tax_range_amount'))
      }
    })
    if (
      Global.checkCompanyModulePermission({
        company_module: 'gov_ptax_rule',
        company_operation: 'default',
      }) ||
      Global.checkCompanyModulePermission({
        company_module: 'company_rules_2',
        company_sub_module: 'p_tax_rules',
        company_sub_operation: ['view'],
      })
    ) {
      this.preferenceGroup.push('default');
      this.fetchTemplateLibrary();
    }
  }

  fetchStates() {
    this.spinner.show();

    this.companyuserService.fetchStates().subscribe(
      (res) => {
        if (res.status == 'success') {
          this.stateMaster = [];
          for (const key in res.state_list[0].states) {
            if (
              Object.prototype.hasOwnProperty.call(
                res.state_list[0].states,
                key
              )
            ) {
              const element = res.state_list[0].states[key];
              this.stateMaster.push({
                id: element.id,
                description: element.name,
              });
            }
          }
          this.stateMaster.push(
            {id:'option_1',description:'Option 1'},
            {id:'option_2',description:'Option 2'},
            {id:'option_3',description:'Option 3'},
            {id:'option_4',description:'Option 4'},
            {id:'option_5',description:'Option 5'},
            {id:'option_6',description:'Option 6'},
          )
        } else {
          this.toastr.error(res.message);
        }

        this.spinner.hide();
      },
      (err) => {
        this.toastr.error(Global.showServerErrorMessage(err));
        this.spinner.hide();
      }
    );
  }

  initTemplateRows(
    type: any,
    amount_from: any = null,
    amount_to: any = null,
    tax_amount: any = null,
    last_slab = false
  ) {
    switch (type) {
      case 'tax_range_amount':
        return this.formBuilder.group({
          amount_from: [amount_from, Validators.compose([Validators.required])],
          amount_to: [amount_to, Validators.compose([Validators.required])],
          tax_amount: [tax_amount, Validators.compose([Validators.required])],
          last_slab: [last_slab, Validators.compose([Validators.required])],
        });
        break;

      default:
        return this.formBuilder.group({});
        break;
    }
  }
  initNestedTemplateRows(
    type: any,
    data: any = null,
  ) {
    switch (type) {
      case 'tax_range_amount':
        return this.formBuilder.group({
          amount_from: [data?.amount_from ?? null, Validators.compose([Validators.required])],
          amount_to: [data?.amount_to ?? null, Validators.compose([Validators.required])],
          tax_amount: [data?.tax_amount ?? null, Validators.compose([Validators.required])],
          last_slab: [data?.last_slab == 'yes' ? true : false, Validators.compose([Validators.required])],
        });
        break;

      default:
        return this.formBuilder.group({});
        break;
    }
  }
  initPeriodsRows(
    type: any,
    from_month: any = null,
    to_month: any = null,
    data: any = null,
  ) {
    switch (type) {
      case 'tax_range_amount':

        const formGroup = this.formBuilder.group({
          from_month: [Global.monthMaster.find((obj: any) => {
                    return obj.index == from_month;
                  }) ?? null, Validators.compose([Validators.required])],
          to_month: [Global.monthMaster.find((obj: any) => {
            return obj.index == to_month;
          }) ?? null, Validators.compose([Validators.required])],
          tax_range_amount: this.formBuilder.array([]),
        });

        const taxRangeAmount = formGroup.get('tax_range_amount') as FormArray;        
        if (data && Array.isArray(data)) {
          data?.forEach((taxItem: any) => {
            taxRangeAmount.push(this.initNestedTemplateRows('tax_range_amount',taxItem));
          });
        } else {
          taxRangeAmount.push(this.initNestedTemplateRows('tax_range_amount'));
        }
        return formGroup;
        break;

      default:
        return this.formBuilder.group({});
        break;
    }
  }
  getTemplateRows(type: any): any {
    return (this.pTaxRuleForm.get(type) as UntypedFormArray).controls;
  }
  getPeriodTempRows(type: any, type_temp: any, templateDataIndex: number) {
    const typeControl = this.pTaxRuleForm.get(type) as FormArray;
    return (typeControl.at(templateDataIndex).get(type_temp) as FormArray).controls;
  }
  removeTemplateRow(type: any, i: number) {
    const control = <UntypedFormArray>this.pTaxRuleForm.get(type);
    control.removeAt(i);
  }
  removeNestedTaxSlab(type: any, type_temp: any, templateDataIndex: number, templateIndex: number) {
    const typeControl = this.pTaxRuleForm.get(type) as FormArray;
    
    const typeTempControl = typeControl.at(templateDataIndex).get(type_temp) as FormArray;

    typeTempControl.removeAt(templateIndex);
  }
  addNestedTaxSlab(type: any, type_temp: any, templateDataIndex: number, data: any = {}) {
    const typeControl = this.pTaxRuleForm.get(type) as FormArray;
    const typeTempControl = typeControl.at(templateDataIndex).get(type_temp) as FormArray;

    typeTempControl.push(this.initTemplateRows('tax_range_amount'));
  }
  addPeriodTemp(type: any, from_month: any = null,
    to_month: any = null,data: any = null) {
    const control: any = this.pTaxRuleForm.get(type) as FormArray;
    control.push(this.initPeriodsRows('tax_range_amount',from_month,to_month,data));
  }
  addTemplateRows(
    type: any,
    amount_from: any = null,
    amount_to: any = null,
    tax_amount: any = null,
    last_slab: any = false
  ) {
    const control = <UntypedFormArray>this.pTaxRuleForm.get(type);
    // if(control?.value && control?.value?.length ){
    // let i = control?.value?.length - 1;
    // if (i >= 0) {

    // let lastControl = this.getTemplateRows('tax_range_amount')[i]
    // lastControl.get('last_slab')?.setValue(false)
    // // lastControl.get('amount_to')?.setValidators([Validators.required])
    // lastControl.get('amount_to')?.setValidators([Validators.required]);
    // lastControl.get('amount_to')?.updateValueAndValidity();
    // }
    // }
    if (last_slab == 'yes') {
      last_slab = true;
    } else if (last_slab == 'no') {
      last_slab = false;
    }
    control.push(
      this.initTemplateRows(type, amount_from, amount_to, tax_amount, last_slab)
    );
  }
  removeperiodTemp(type: any, i: number) {
    const control: any = this.pTaxRuleForm.get(type) as FormArray;
    control.removeAt(i);
  }
  resetAllTemplateRows(isEditing: any = false) {

    let arr = ['tax_range_amount','periods'];
    arr.forEach((element) => {
      const control = <UntypedFormArray>this.pTaxRuleForm.get(element);
      control.clear();
    });
    if (isEditing == false) {
      if (this.pTaxRuleForm.get('settlement_frequency')?.value != 'monthly') {
        arr.forEach((element) => {
          if (element == 'tax_range_amount') {
            this.addTemplateRows(element);
          }
        });
      }
    }
  }

  fetch() {
    this.dtOptions = {
      ajax: (dataTablesParameters: any, callback) => {
        this.companyuserService
          .fetchPTaxRules({
            pageno: dataTablesParameters.start / Global.DataTableLength + 1,
            perpage: dataTablesParameters.length,
            searchkey: dataTablesParameters.search.value,
            sortbyfield: Global.getTableSortingOptions(
              'sortbyfield',
              dataTablesParameters
            ),
            ascdesc: Global.getTableSortingOptions(
              'ascdesc',
              dataTablesParameters
            ),
          })
          .subscribe(
            (res) => {
              if (res.status == 'success') {
                callback({
                  recordsTotal: res.ptax_rule.totalDocs,
                  recordsFiltered: res.ptax_rule.totalDocs,
                  data: res.ptax_rule.docs,
                });
              } else {
                this.toastr.error(res.message);

                callback({
                  recordsTotal: 0,
                  recordsFiltered: 0,
                  data: [],
                });
              }
            },
            (err) => {
              this.toastr.error(Global.showServerErrorMessage(err));

              callback({
                recordsTotal: 0,
                recordsFiltered: 0,
                data: [],
              });
            }
          );
      },
      columns: [
        {
          render: function (data, type, full, meta: any) {
            return meta.settings._iDisplayStart + (meta.row + 1);
          },
          orderable: false,
        },
        {
          render: function (data, type, full, meta) {
            var btnstatus = '';
            if (full.status == 'active') {
              btnstatus = 'on';
            } else {
              btnstatus = 'off';
            }

            if (
              Global.checkCompanyModulePermission({
                company_module: 'company_rules_2',
                company_sub_module: 'p_tax_rules',
                company_sub_operation: ['edit'],
                company_strict: true,
              })
            ) {
              return (
                `<div class="br-toggle br-toggle-rounded br-toggle-primary ` +
                btnstatus +
                `" id="changeStatusButton">\
                        <div class="br-toggle-switch"></div>\
                      </div>`
              );
            } else {
              return full?.status;
            }
          },
          className: 'text-center text-capitalize',
          orderable: true,
          name: 'status',
        },
        {
          render: function (data, type, full, meta) {
            let html = `
            <button class="btn btn-info btn-icon mg-5" data-toggle="tooltip" data-placement="top" title="View Details" id="viewButton-` +
              meta.row +
              `">
                      <div style="width:25px; height:25px;"><i class="fa fa-eye"></i></div>
                    </button>
                    <button class="btn btn-info btn-icon mx-1" data-toggle="tooltip" data-placement="top" title="Update History" id="historyButton-` +
                    meta.row +
                    `">
                              <div style="width:25px; height:25px;"><i class="fa fa-history"></i></div>
                          </button>
            `;

            if(Global.checkCompanyModulePermission({
              company_module: 'company_rules_2',
              company_sub_module: 'p_tax_rules',
              company_sub_operation: ['edit'],
              company_strict: true,
            })){
              html += `
              <button class="btn btn-primary btn-icon mg-5" data-toggle="tooltip" data-placement="top" title="Edit" id="editButton-` +
              meta.row +
              `">
                      <div style="width:25px; height:25px;"><i class="fa fa-pen"></i></div>
                    </button>
              `
            }
            if(Global.checkCompanyModulePermission({
              company_module: 'company_rules_2',
              company_sub_module: 'p_tax_rules',
              company_sub_operation: ['delete'],
              company_strict: true,
            })){
              html += `
              <button class="btn btn-danger btn-icon mg-5" data-toggle="tooltip" data-placement="top" title="Delete" id="deleteButton-` +
              meta.row +
              `">
                      <div style="width:25px; height:25px;"><i class="fa fa-trash"></i></div>
                    </button>
              `
            }

            return html
          },
          className: 'text-center',
          orderable: false,
        },
        // {
        //   render: function (data, type, full, meta) {
        //     return full.template_name ?? "N/A";
        //   },
        //   orderable: true,
        //   name: 'template_name'
        // },
        {
          render: function (data, type, full, meta) {
            return full.state_name;
          },
          orderable: true,
          name: 'state_name',
        },
        {
          render: function (data, type, full, meta) {
            var datePipe = new DatePipe('en-US');
            let value = datePipe.transform(full.effective_from, 'dd/MM/yyyy');
            return value;
          },
          orderable: true,
          name: 'effective_from',
        },
        {
          render: function (data, type, full, meta) {
            return full.salary_type
              ? `<span class="text-capitalize">` + full.salary_type + `</span>`
              : 'N/A';
          },
          orderable: true,
          name: 'salary_type',
        },
        {
          render: function (data, type, full, meta) {
            return full.settlement_frequency
              ? `<span class="text-capitalize">` +
                  full.settlement_frequency +
                  `</span>`
              : 'N/A';
          },
          orderable: true,
          name: 'settlement_frequency',
        },
      ],
      rowCallback: (row: Node, data: any[] | Object, index: number) => {
        const self = this;

        $('table').on('click', '#viewButton-' + index, function () {
          self.view(data);
        });

        $('table').on('click', '#editButton-' + index, function () {
          self.getEdit(data);
        });

        $('table').on('click', '#deleteButton-' + index, function () {
          self.deleteItem(data);
        });

        $('table').on('click', '#historyButton-' + index, function () {
          self.showUpdateHistory(data);
        });

        $('#changeStatusButton', row).bind('click', () => {
          self.changeStatus(data);
        });

        return row;
      },
      drawCallback: function (settings) {
        Global.loadCustomScripts('customJsScript');
      },
      pagingType: 'full_numbers',
      serverSide: true,
      processing: true,
      ordering: true,
      order: [],
      searching: true,
      pageLength: Global.DataTableLength,
      lengthChange: true,
      lengthMenu: Global.DataTableLengthChangeMenu,
      responsive: true,
      language: {
        searchPlaceholder: 'Search...',
        search: '',
      },
    };
  }

  changeStatus(item: any) {
    this.companyuserService
      .updatePTaxRuleStatus({
        ptax_rule_id: item._id,
        status: item.status == 'active' ? 'inactive' : 'active',
      })
      .subscribe(
        (res) => {
          if (res.status == 'success') {
            this.toastr.success(res.message);
            $('#my-datatable')
              .dataTable()
              .api()
              .ajax.reload(function (json) {}, false);
          } else {
            this.toastr.error(res.message);
          }
        },
        (err) => {
          this.toastr.error(Global.showServerErrorMessage(err));
        }
      );
  }

  getEdit(item: any) {
    this.editActionId = item._id;

    this.pTaxRuleForm.patchValue({
      state: this.stateMaster.find((obj: any) => {
        return obj.description == item.state_name;
      }),
      salary_type: this.salaryTypeMaster.find((obj: any) => {
        return obj.value == item.salary_type;
      }),
      settlement_frequency: this.settlementMaster.find((obj: any) => {
        return obj.value == item.settlement_frequency;
      }),
      // state: item.state_name,
      template_name: item.template_name,
      effective_from: this.datePipe.transform(
        item.effective_from,
        'MM/dd/YYYY'
      ),

      publish_status: this.publishStatusMaster.find((obj) => {
        return obj.value == item.publish_status;
      }),
    });

    this.resetAllTemplateRows(true);
    let periods:any = []

    if (item.settlement_frequency != 'monthly') {
      item.tax_range_amount.forEach((element: any) => {
        this.addTemplateRows(
          'tax_range_amount',
          element.amount_from,
          element.amount_to,
          element.tax_amount,
          element.last_slab
        );
      });
    }
    else{
      item?.periods?.forEach((element:any)=>{
        this.addPeriodTemp('periods',element?.from_month,element?.to_month,element?.tax_range_amount)
      })
        periods = this.getPeriods(this.pTaxRuleForm.value.periods);
    }

    this.initialValueBeforeUpdate = {
      ptax_rule_id: this.editActionId,
      // state_id: this.pTaxRuleForm.value.state.id,
      state_name: this.pTaxRuleForm.value.state?.description ?? '',
      template_name: this.pTaxRuleForm.value.template_name
        ? this.pTaxRuleForm.value.template_name.toString().trim()
        : null,
      // state_name: this.pTaxRuleForm.value.state.toString().trim(),
      effective_from: this.datePipe.transform(
        this.pTaxRuleForm.value.effective_from,
        'Y-MM-dd'
      ),
      salary_type: this.pTaxRuleForm.value.salary_type.value,
      settlement_frequency: this.pTaxRuleForm.value.settlement_frequency.value,
      
      tax_range_amount: JSON.stringify(
        this.pTaxRuleForm.value.tax_range_amount
      ),
      periods: JSON.stringify(periods),
      publish_status:
        this.pTaxRuleForm.value.publish_status?.value ?? 'published',
    };

    $('html, body').animate({
      scrollTop: $('#ptax-submit-section').position().top,
    });
  }

  cancelEdit() {
    this.editActionId = '';
    this.pTaxRuleForm.reset();

    for (const key in this.pTaxRuleForm.controls) {

      if (
        Object.prototype.hasOwnProperty.call(this.pTaxRuleForm.controls, key)
      ) {
        const element = this.pTaxRuleForm.controls[key];

        element.markAsUntouched();
        element.markAsPristine();
      }
    }

    this.resetAllTemplateRows();

    $('html, body').animate({
      scrollTop: $('#ptax-submit-section').position().top,
    });
  }
  getPeriods(periods:any){
   const tempData:any =  [];
   periods?.forEach((val:any)=>{    
   tempData.push(
    {
      from_month:(val?.from_month?.index).toString(),
      to_month:(val?.to_month?.index)?.toString(),
      tax_range_amount:val?.tax_range_amount,
    }
   )
   });

   return tempData;
  }

  
  async create(event: any) {

    if (this.pTaxRuleForm.valid) {
      event.target.classList.add('btn-loading');

     
      let periods:any = []
      if (this.presentSettlement == 'monthly') {
        const validateData = await this.validatePeriods();
        if (!validateData) {
          event.target.classList.remove('btn-loading');
          return;
        }
        periods = this.getPeriods(this.pTaxRuleForm.value.periods);
      }else{
        const validateData = await this.validate_ptax_data();
        if (!validateData) {
          event.target.classList.remove('btn-loading');
          return;
        }
      }
      this.companyuserService
        .createPTaxRule({
          // state_id: this.pTaxRuleForm.value.state.id,
          state_name: this.pTaxRuleForm.value.state?.description ?? '',
          template_name: this.pTaxRuleForm.value.template_name,
          // state_name: this.pTaxRuleForm.value.state,
          effective_from: this.datePipe.transform(
            this.pTaxRuleForm.value.effective_from,
            'Y-MM-dd'
          ),
          salary_type: this.pTaxRuleForm.value.salary_type.value,
          settlement_frequency:
            this.pTaxRuleForm.value.settlement_frequency.value,
          tax_range_amount: JSON.stringify(
            this.pTaxRuleForm.value.tax_range_amount
          ),
          periods:JSON.stringify(periods),
          publish_status:
            this.pTaxRuleForm.value.publish_status?.value ?? 'published',
        })
        .subscribe(
          (res) => {
            if (res.status == 'success') {
              this.toastr.success(res.message);
              // this.pTaxRuleForm.reset();
              // this.resetAllTemplateRows();
              this.cancelEdit();

              $('#my-datatable')
                .dataTable()
                .api()
                .ajax.reload(function (json) {}, false);
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
            .deletePTaxRule({
              ptax_rule_id: item._id,
            })
            .subscribe(
              (res) => {
                if (res.status == 'success') {
                  this.toastr.success(res.message);
                  $('#my-datatable')
                    .dataTable()
                    .api()
                    .ajax.reload(function (json) {}, false);
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


  async update(event: any) {
    if (this.pTaxRuleForm.valid) {      
      let periods:any = []
      if (this.pTaxRuleForm.get('settlement_frequency')?.value.value == 'monthly') {
         periods = this.getPeriods(this.pTaxRuleForm.value.periods);        
      }
      const documentUpdate = {
        ptax_rule_id: this.editActionId,
        // state_id: this.pTaxRuleForm.value.state.id,
        state_name: this.pTaxRuleForm.value.state?.description ?? '',
        template_name: this.pTaxRuleForm.value.template_name.toString().trim(),
        // state_name: this.pTaxRuleForm.value.state.toString().trim(),
        effective_from: this.datePipe.transform(
          this.pTaxRuleForm.value.effective_from,
          'Y-MM-dd'
        ),
        salary_type: this.pTaxRuleForm.value.salary_type.value,
        settlement_frequency:
          this.pTaxRuleForm.value.settlement_frequency.value,
        tax_range_amount: JSON.stringify(
          this.pTaxRuleForm.value.tax_range_amount
        ),
        periods:JSON.stringify(periods),
        publish_status:
          this.pTaxRuleForm.value.publish_status?.value ?? 'published',
      };

      if (
        JSON.stringify(documentUpdate) ===
        JSON.stringify(this.initialValueBeforeUpdate)
      ) {
        this.toastr.warning('No change detected to update');
        return;
      }

      event.target.classList.add('btn-loading');

      const validateData = await this.validate_ptax_data();
      if (!validateData) {
        event.target.classList.remove('btn-loading');
        return;
      }

      this.companyuserService.updatePTaxRule(documentUpdate).subscribe(
        (res) => {
          if (res.status == 'success') {
            this.toastr.success(res.message);
            this.initialValueBeforeUpdate = documentUpdate;
            $('#my-datatable')
              .dataTable()
              .api()
              .ajax.reload(function (json) {}, false);
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

  view(item: any) {
    $('#viewmmodalbutton').click();
  // console.log(item);

    this.viewPTaxTemplate = item;
  }

  showUpdateHistory(item: any) {
    this.viewPTaxTemplate = item;
    if (this.viewPTaxTemplate.history != null) {
      $('#history-datatable').dataTable().api().ajax.reload();
      $('#historymmodalbutton').click();
    } else {
      this.toastr.warning('No update history found to show');
    }
  }

  getUpdateHistory() {
    if (
      this.viewPTaxTemplate != null &&
      this.viewPTaxTemplate.history != null &&
      Array.isArray(this.viewPTaxTemplate.history)
    ) {
      return this.viewPTaxTemplate.history;
    } else {
      return [];
    }
  }

  viewHistoryDetails(item: any) {
    $('#viewhistorymodalbutton').click();
    this.viewPTaxTemplateHistory = item;
  }

  formatDate(date: Date) {
    var datePipe = new DatePipe('en-US');
    let value = datePipe.transform(date, 'dd/MM/yyyy');
    return value;
  }

  validate_ptax_data() {
    const ele = this;

    return new Promise(function (resolve, reject) {
      /** Validating Income Tax Slab Range */
      for (const key in ele.pTaxRuleForm.value.tax_range_amount) {
        if (
          Object.prototype.hasOwnProperty.call(
            ele.pTaxRuleForm.value.tax_range_amount,
            key
          )
        ) {
          const element = ele.pTaxRuleForm.value.tax_range_amount[key];
          if (!element.last_slab && element.amount_to <= element.amount_from) {
            ele.toastr.error(
              'For Income Tax Slab ' +
                (parseInt(key) + 1) +
                ': The amount range entered is not acceptable'
            );
            resolve(false);
            return;
          }

          if (
            parseInt(key) > 0 &&
            element.amount_from <=
              ele.pTaxRuleForm.value.tax_range_amount[parseInt(key) - 1]
                ?.amount_to
          ) {
            ele.toastr.error(
              'For Income Tax Slab ' +
                (parseInt(key) + 1) +
                ': The amount range starting should be greater than the previous one'
            );
            resolve(false);
            return;
          }
        }
      }
      /** End of Validating Income Tax Slab Range */

      resolve(true);
      return;
    });
  }
  validatePeriods() {
    const ele = this;
  
    return new Promise(function (resolve, reject) {
      /** Validating Tax Slab Ranges in Periods */
      for (let i = 0; i < ele.pTaxRuleForm.value.periods.length; i++) {
        const period = ele.pTaxRuleForm.value.periods[i];
  
        if (!period.tax_range_amount || !Array.isArray(period.tax_range_amount)) {
          ele.toastr.error(`Period ${i + 1}: Invalid tax range data.`);
          resolve(false);
          return;
        }
  
        for (let j = 0; j < period.tax_range_amount.length; j++) {
          const slab = period.tax_range_amount[j];
  
          // Validate "last_slab" and "amount_to <= amount_from"
          if (!slab.last_slab && slab.amount_to <= slab.amount_from) {
            ele.toastr.error(
              `Period ${i + 1}, Slab ${j + 1}: The amount range entered is not acceptable.`
            );
            resolve(false);
            return;
          }
  
          // Validate "amount_from" of the current slab against the previous slab's "amount_to"
          if (
            j > 0 &&
            slab.amount_from <= period.tax_range_amount[j - 1]?.amount_to
          ) {
            ele.toastr.error(
              `Period ${i + 1}, Slab ${j + 1}: The amount range starting should be greater than the previous slab's range.`
            );
            resolve(false);
            return;
          }
        }
      }
      /** End of Validating Tax Slab Ranges in Periods */
  
      resolve(true);
      return;
    });
  }
  
  fetchTemplateLibrary() {
    const _this = this;

    this.dtOptionsLibrary = {
      ajax: (dataTablesParameters: any, callback) => {
        this.companyuserService
          .fetchPTaxRuleLibrary({
            pageno: dataTablesParameters.start / Global.DataTableLength + 1,
            perpage: dataTablesParameters.length,
            searchkey: dataTablesParameters.search.value,
            sortbyfield: Global.getTableSortingOptions(
              'sortbyfield',
              dataTablesParameters
            ),
            ascdesc: Global.getTableSortingOptions(
              'ascdesc',
              dataTablesParameters
            ),
          })
          .subscribe(
            (res) => {
              if (res.status == 'success') {
                callback({
                  recordsTotal: res.ptax_rule.totalDocs,
                  recordsFiltered: res.ptax_rule.totalDocs,
                  data: res.ptax_rule.docs,
                });
              } else {
                this.toastr.error(res.message);

                callback({
                  recordsTotal: 0,
                  recordsFiltered: 0,
                  data: [],
                });
              }
            },
            (err) => {
              this.toastr.error(Global.showServerErrorMessage(err));

              callback({
                recordsTotal: 0,
                recordsFiltered: 0,
                data: [],
              });
            }
          );
      },
      columns: [
        {
          render: function (data, type, full, meta: any) {
            return meta.settings._iDisplayStart + (meta.row + 1);
          },
          orderable: false,
        },
        {
          render: function (data, type, full, meta) {
            let html = '';

            html +=
              `<button class="btn btn-info btn-icon mg-5" data-toggle="tooltip" data-placement="top" title="View Details" id="viewPTaxButton-` +
              meta.row +
              `">
                      <div style="width:25px; height:25px;"><i class="fa fa-eye"></i></div>
                    </button>`;

            if (_this.preferenceGroup.includes('customizable')) {
              html +=
                `<button class="btn btn-primary btn-icon mx-1" data-toggle="tooltip" data-placement="top" title="Clone" id="cloneButton-` +
                meta.row +
                `">
                            <div style="width:25px; height:25px;"><i class="fa fa-copy"></i></div>
                        </button>`;
            }

            return html ? html : 'N/A';
          },
          className: 'text-center',
          orderable: false,
        },
        {
          render: function (data, type, full, meta) {
            return full.state_name;
          },
          orderable: true,
          name: 'state_name',
        },
        {
          render: function (data, type, full, meta) {
            var datePipe = new DatePipe('en-US');
            let value = datePipe.transform(full.effective_from, 'dd/MM/yyyy');
            return value;
          },
          orderable: true,
          name: 'effective_from',
        },
        {
          render: function (data, type, full, meta) {
            return full.salary_type
              ? `<span class="text-capitalize">` + full.salary_type + `</span>`
              : 'N/A';
          },
          orderable: true,
          name: 'salary_type',
        },
        {
          render: function (data, type, full, meta) {
            return full.settlement_frequency
              ? `<span class="text-capitalize">` +
                  full.settlement_frequency +
                  `</span>`
              : 'N/A';
          },
          orderable: true,
          name: 'settlement_frequency',
        },
      ],
      rowCallback: (row: Node, data: any[] | Object, index: number) => {
        const self = this;

        $('table').on('click', '#viewPTaxButton-' + index, function () {
          self.view(data);
        });

        $('table').on('click', '#cloneButton-' + index, function () {
          self.cloneItem(data);
        });

        return row;
      },
      drawCallback: function (settings) {
        Global.loadCustomScripts('customJsScript');
      },
      pagingType: 'full_numbers',
      serverSide: true,
      processing: true,
      ordering: true,
      order: [],
      searching: true,
      pageLength: Global.DataTableLength,
      lengthChange: true,
      lengthMenu: Global.DataTableLengthChangeMenu,
      responsive: true,
      language: {
        searchPlaceholder: 'Search...',
        search: '',
      },
    };
  }

  openTemplateLibrary() {
    $('#librarymmodalbutton').click();
  }

  cloneItem(item: any) {
    $('[data-dismiss="modal"]')?.click();
    this.cancelEdit();

    this.pTaxRuleForm.patchValue({
      // state: this.stateMaster.find((obj: any) => {
      //   return obj.id == item.state_id
      // }),
      salary_type: this.salaryTypeMaster.find((obj: any) => {
        return obj.value == item.salary_type;
      }),
      settlement_frequency: this.settlementMaster.find((obj: any) => {
        return obj.value == item.settlement_frequency;
      }),
      // state: item.state_name,
      state: this.stateMaster.find((obj: any) => {
        return obj.description == item.state_name;
      }),
      effective_from: this.datePipe.transform(
        item.effective_from,
        'MM/dd/YYYY'
      ),
      publish_status: this.publishStatusMaster.find((obj) => {
        return obj.value == item.publish_status;
      }),
    });

    this.resetAllTemplateRows(true);
    if (item.settlement_frequency != 'monthly') {
     item.tax_range_amount.forEach((element: any) => {
      this.addTemplateRows(
        'tax_range_amount',
        element.amount_from,
        element.amount_to,
        element.tax_amount,
        element.last_slab
      );
     });
    }
    else{
      item?.periods?.forEach((element:any)=>{
        this.addPeriodTemp('periods',element?.from_month,element?.to_month,element?.tax_range_amount)
      })
    }

    $('html, body').animate({
      scrollTop: $('#ptax-submit-section').position().top,
    });
  }
  configLastSlab(t: any) {
    let i = this.pTaxRuleForm.get('tax_range_amount')?.value?.length - 1;
    if (i >= 0) {
      const contol: AbstractControl =
        this.getTemplateRows('tax_range_amount')[i];
      if (t.checked) {
        contol.get('amount_to')?.disable();
        contol.get('amount_to')?.clearValidators();
        contol.get('amount_to')?.setValue(0);
        contol.get('amount_to')?.updateValueAndValidity();
      } else {
        contol.get('amount_to')?.enable();
        contol.get('amount_to')?.setValidators([Validators.required]);
        contol.get('amount_to')?.setValue(null);
        contol.get('amount_to')?.updateValueAndValidity();
      }
    }
  }
  configLastSlabNested(t: any, type:any,temp_type:any,tempInd:number) {
    // let i = this.pTaxRuleForm.get('tax_range_amount')?.value?.length - 1;
    const typeControl = this.pTaxRuleForm.get(type) as FormArray;
    const i = typeControl.at(tempInd).get(temp_type)?.value?.length - 1;
    
    if (i >= 0) {
      const contol: AbstractControl = this.getPeriodTempRows(type,temp_type,tempInd)[i];
      if (t.checked) {
        contol.get('amount_to')?.disable();
        contol.get('amount_to')?.clearValidators();
        contol.get('amount_to')?.setValue(0);
        contol.get('amount_to')?.updateValueAndValidity();
      } else {
        contol.get('amount_to')?.enable();
        contol.get('amount_to')?.setValidators([]);
        contol.get('amount_to')?.setValue(null);
        contol.get('amount_to')?.updateValueAndValidity();
      }
    }
  }
}
