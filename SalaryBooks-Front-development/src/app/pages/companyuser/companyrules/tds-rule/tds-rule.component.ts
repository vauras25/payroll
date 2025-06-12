import { DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';
import { disableDebugTools, Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import * as Global from 'src/app/globals';
import { CompanyuserService } from 'src/app/services/companyuser.service';
import swal from 'sweetalert2';

@Component({
  selector: 'companyuser-app-tds-rule',
  templateUrl: './tds-rule.component.html',
  styleUrls: ['./tds-rule.component.css'],
})
export class CMPTdsRuleComponent implements OnInit {
  dtOptions: DataTables.Settings = {};
  dtOptionsHistory: DataTables.Settings = {};
  dtOptionsLibrary: DataTables.Settings = {};
  tdsRuleForm: UntypedFormGroup;
  editActionId: String;
  applicationMethodMaster: any[];
  frequencyMaster: any[];
  deadlineDayMaster: any[];
  deadlineMonthMaster: any[];
  publishStatusMaster: any[];
  viewPolicyDetail: any = null;
  initialValueBeforeUpdate: any = null;
  preferenceGroup: any[] = [];
  Global = Global;
  incomeTaxSlabsList:any[] = []
  regimeMaster:any[] = [{value:'new_regime',description:'New Regime'},{value:'old_regime',description:'Old Regime'}]
  tdsDeductionRulesList:any[] = []
   
  constructor(
    public formBuilder: UntypedFormBuilder,
    private titleService: Title,
    private toastr: ToastrService,
    private router: Router,
    private companyuserService: CompanyuserService,
    private datePipe: DatePipe
  ) {
    this.tdsRuleForm = formBuilder.group({
      template_name: [null, Validators.compose([Validators.required])],
      application_methode: [null, Validators.compose([Validators.required])],
      frequency: [null, Validators.compose([Validators.required])],
      deadline_day: [null, Validators.compose([Validators.required])],
      income_tax_slab: [null, Validators.compose([Validators.required])],
      tds_rule: [null, Validators.compose([Validators.required])],
      regime: [null, Validators.compose([Validators.required])],
      deadline_month: [null, Validators.compose([Validators.required])],
      publish_status: [null, Validators.compose([])],
    });

    this.editActionId = '';

    this.publishStatusMaster = [
      { value: 'privet', description: 'Private' },
      { value: 'published', description: 'Published' },
    ];

    this.applicationMethodMaster = [
      { value: 'assumed', description: 'Assumed' },
      {
        value: 'progreesive_acual_investment',
        description: 'Progressive with Actual Investment',
      },
      {
        value: 'progreesive_assumed_investment',
        description: 'Progressive with Assumed Investment',
      },
      { value: 'one_time', description: 'One Time' },
    ];

    this.frequencyMaster = [
      { value: 'monthly', description: 'Monthly' },
      { value: 'quaterly', description: 'Quaterly' },
      { value: 'half_yearly', description: 'Half Yearly' },
      { value: 'yearly', description: 'Yearly' },
      { value: 'not_defined', description: 'Not Defined' },
    ];

    this.deadlineDayMaster = [];
    for (let index = 1; index <= 31; index++) {
      this.deadlineDayMaster.push({ value: index, description: index });
    }

    this.deadlineMonthMaster = [
      { value: '1', description: 'January' },
      { value: '2', description: 'February' },
      { value: '3', description: 'March' },
      { value: '4', description: 'April' },
      { value: '5', description: 'May' },
      { value: '6', description: 'June' },
      { value: '7', description: 'July' },
      { value: '8', description: 'August' },
      { value: '9', description: 'September' },
      { value: '10', description: 'October' },
      { value: '11', description: 'November' },
      { value: '12', description: 'December' },
    ];
  }

  ngOnInit() {
    this.titleService.setTitle('TDS Template - ' + Global.AppName);

    if (
      !Global.checkCompanyModulePermission({
        company_module: 'gov_tds_rule',
        company_operation: ['customizable', 'default'],
      }) &&
      !Global.checkCompanyModulePermission({
        company_module: 'company_rules_2',
        company_sub_module: 'tds_template',
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

    if (
      Global.checkCompanyModulePermission({
        company_module: 'gov_tds_rule',
        company_operation: 'customizable',
      }) ||
      Global.checkCompanyModulePermission({
        company_module: 'company_rules_2',
        company_sub_module: 'tds_template',
        company_sub_operation: ['view'],
      })
    ) {
      this.preferenceGroup.push('customizable');

      this.getIncomeTaxSlabsList();
      this.getTdsRulesDeductionList()
      this.fetch();
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
              return full.template_name;
            },
          },
          {
            render: function (data, type, full, meta) {
              switch (full.application_methode) {
                case 'assumed':
                  return 'Assumed';
                  break;

                case 'progreesive_acual_investment':
                  return 'Progressive with Actual Investment';
                  break;

                case 'progreesive_assumed_investment':
                  return 'Progressive with Assumed Investment';
                  break;

                case 'one_time':
                  return 'One Time';
                  break;

                default:
                  return full.application_methode;
                  break;
              }
            },
          },
          {
            render: function (data, type, full, meta) {
              switch (full.frequency) {
                case 'monthly':
                  return 'Monthly';
                  break;

                case 'quaterly':
                  return 'Quaterly';
                  break;

                case 'half_yearly':
                  return 'Half Yearly';
                  break;

                case 'yearly':
                  return 'Yearly';
                  break;

                case 'not_defined':
                  return 'Not Defined';
                  break;

                default:
                  return full.frequency;
                  break;
              }
            },
          },
          {
            render: function (data, type, full, meta) {
              return full.deadline_day + '/' + full.deadline_month;
            },
          },
        ],
        searching: true,
        lengthChange: true,
        lengthMenu: Global.DataTableLengthChangeMenu,
        responsive: true,
        language: {
          searchPlaceholder: 'Search...',
          search: '',
        },
      };

      this.fetchTemplateLibrary();
    }

    if (
      Global.checkCompanyModulePermission({
        company_module: 'gov_tds_rule',
        company_operation: 'default',
        // company_sub_module: 'company_rule',
        // company_sub_operation: ['view'],
      }) ||
      Global.checkCompanyModulePermission({
        company_module: 'company_rules_2',
        company_sub_module: 'tds_template',
        company_sub_operation: ['view'],
      })
    ) {
      this.preferenceGroup.push('default');
      this.fetchTemplateLibrary();
    }
  }

  fetch() {
    this.dtOptions = {
      ajax: (dataTablesParameters: any, callback) => {
        this.companyuserService
          .fetchTDSTemplates({
            pageno: Math.floor(
              (dataTablesParameters.start + dataTablesParameters.length) /
                dataTablesParameters.length
            ),
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
                  recordsTotal: res.tds_policy.totalDocs,
                  recordsFiltered: res.tds_policy.totalDocs,
                  data: res.tds_policy.docs,
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
                company_sub_module: 'tds_template',
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
            let html =
              `  <button class="btn btn-info btn-icon mx-1" data-toggle="tooltip" data-placement="top" title="Update History" id="historyButton-` +
              meta.row +
              `">
                      <div style="width:25px; height:25px;"><i class="fa fa-history"></i></div>
                  </button>`;

            if (
              Global.checkCompanyModulePermission({
                company_module: 'company_rules_2',
                company_sub_module: 'tds_template',
                company_sub_operation: ['edit'],
                company_strict: true,
              })
            ) {
              html +=
                `<button class="btn btn-primary btn-icon mx-1" data-toggle="tooltip" data-placement="top" title="Edit" id="editButton-` +
                meta.row +
                `">
                              <div style="width:25px; height:25px;"><i class="fa fa-pen"></i></div>
                          </button>`;
            }
            if (
              Global.checkCompanyModulePermission({
                company_module: 'company_rules_2',
                company_sub_module: 'tds_template',
                company_sub_operation: ['delete'],
                company_strict: true,
              })
            ) {
              html +=
                `
                  
                    <button class="btn btn-danger btn-icon mx-1" data-toggle="tooltip" data-placement="top" title="Delete" id="deleteButton-` +
                meta.row +
                `">
                        <div style="width:25px; height:25px;"><i class="fa fa-trash"></i></div>
                    </button>`;
            }
            return html;
          },
          className: 'text-center',
          orderable: false,
        },
        {
          render: function (data, type, full, meta) {
            return full.template_name;
          },
          orderable: true,
          name: 'template_name',
        },
        {
          render: function (data, type, full, meta) {
            switch (full.application_methode) {
              case 'assumed':
                return 'Assumed';
                break;

              case 'progreesive_acual_investment':
                return 'Progressive with Actual Investment';
                break;

              case 'progreesive_assumed_investment':
                return 'Progressive with Assumed Investment';
                break;

              case 'one_time':
                return 'One Time';
                break;

              default:
                return full.application_methode;
                break;
            }
          },
          orderable: true,
          name: 'application_methode',
        },
        {
          render: function (data, type, full, meta) {
            switch (full.frequency) {
              case 'monthly':
                return 'Monthly';
                break;

              case 'quaterly':
                return 'Quaterly';
                break;

              case 'half_yearly':
                return 'Half Yearly';
                break;

              case 'yearly':
                return 'Yearly';
                break;

              case 'not_defined':
                return 'Not Defined';
                break;

              default:
                return full.frequency;
                break;
            }
          },
          orderable: true,
          name: 'frequency',
        },
        {
          render: function (data, type, full, meta) {
            return full.deadline_day + '/' + full.deadline_month;
          },
          orderable: false,
        },
        {
          render: function (data, type, full, meta) {
            return full.income_tax_slab || 'N/A';
          },
          orderable: true,
        },
        {
          render: function (data, type, full, meta) {
            return full.tds_rule || 'N/A';
          },
          orderable: true,
        },
        {
          render: function (data, type, full, meta) {
            return full.regime || 'N/A';
          },
          orderable: true,
        }
      ],
      drawCallback: function (settings) {
        Global.loadCustomScripts('customJsScript');
      },
      rowCallback: (row: Node, data: any[] | Object, index: number) => {
        const self = this;
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
      .updateTDSTemplateStatus({
        tds_policy_id: item._id,
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
    this.tdsRuleForm.patchValue({
      template_name: item.template_name,

      application_methode: this.applicationMethodMaster.find((obj) => {
        return obj.value == item.application_methode;
      }),

      frequency: this.frequencyMaster.find((obj) => {
        return obj.value == item.frequency;
      }),

      deadline_day: this.deadlineDayMaster.find((obj) => {
        return obj.value == item.deadline_day;
      }),
      income_tax_slab: this.incomeTaxSlabsList.find((obj) => {
        return obj.template_name == item.income_tax_slab;
      }),
      tds_rule: this.tdsDeductionRulesList.find((obj) => {
        return obj.template_name == item.tds_rule;
      }),
      regime: this.regimeMaster.find((obj) => {
        return obj.value == item.regime;
      }),

      deadline_month: this.deadlineMonthMaster.find((obj) => {
        return obj.value == item.deadline_month;
      }),

      publish_status: this.publishStatusMaster.find((obj) => {
        return obj.value == item.publish_status;
      }),
    });

    this.initialValueBeforeUpdate = {
      tds_policy_id: this.editActionId,
      template_name: this.tdsRuleForm.value.template_name.toString().trim(),
      application_methode: this.tdsRuleForm.value.application_methode.value,
      frequency: this.tdsRuleForm.value.frequency.value,
      deadline_day: this.tdsRuleForm.value.deadline_day.value,
      income_tax_slab: this.tdsRuleForm.value.income_tax_slab.template_name,
      tds_rule: this.tdsRuleForm.value.tds_rule.template_name,
      regime: this.tdsRuleForm.value.regime.value,
      deadline_month: this.tdsRuleForm.value.deadline_month.value,
      publish_status:
        this.tdsRuleForm.value.publish_status?.value ?? 'published',
    };

    $('html, body').animate({
      scrollTop: $('#tdsrule-submit-section').position().top,
    });
  }

  cancelEdit() {
    this.editActionId = '';
    this.tdsRuleForm.reset();

    for (const key in this.tdsRuleForm.controls) {
      if (
        Object.prototype.hasOwnProperty.call(this.tdsRuleForm.controls, key)
      ) {
        const element = this.tdsRuleForm.controls[key];

        element.markAsUntouched();
        element.markAsPristine();
      }
    }
  }

  async create(event: any) {
    if (this.tdsRuleForm.valid) {
      var validateData = await this.validate_tds_template();
      if (!validateData) {
        return;
      }

      event.target.classList.add('btn-loading');

      this.companyuserService
        .createTDSTemplate({
          template_name: this.tdsRuleForm.value.template_name,
          application_methode: this.tdsRuleForm.value.application_methode.value,
          frequency: this.tdsRuleForm.value.frequency.value,
          deadline_day: this.tdsRuleForm.value.deadline_day.value,
          income_tax_slab: this.tdsRuleForm.value.income_tax_slab.template_name,
          tds_rule: this.tdsRuleForm.value.tds_rule.template_name,
          regime: this.tdsRuleForm.value.regime.value,
          deadline_month: this.tdsRuleForm.value.deadline_month.value,
          publish_status:
            this.tdsRuleForm.value.publish_status?.value ?? 'published',
        })
        .subscribe(
          (res) => {
            if (res.status == 'success') {
              this.toastr.success(res.message);
              // this.tdsRuleForm.reset();
              this.cancelEdit();
              $('#my-datatable')
                .dataTable()
                .api()
                .ajax.reload(function (json) {}, false);
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
            .deleteTDSTemplate({
              tds_policy_id: item._id,
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
    if (this.tdsRuleForm.valid) {
      var validateData = await this.validate_tds_template();
      if (!validateData) {
        return;
      }

      const documentUpdate = {
        tds_policy_id: this.editActionId,
        template_name: this.tdsRuleForm.value.template_name.toString().trim(),
        application_methode: this.tdsRuleForm.value.application_methode.value,
        frequency: this.tdsRuleForm.value.frequency.value,
        deadline_day: this.tdsRuleForm.value.deadline_day.value,
        income_tax_slab: this.tdsRuleForm.value.income_tax_slab.template_name,
        tds_rule: this.tdsRuleForm.value.tds_rule.template_name,
        regime: this.tdsRuleForm.value.regime.value,
        deadline_month: this.tdsRuleForm.value.deadline_month.value,
        publish_status:
          this.tdsRuleForm.value.publish_status?.value ?? 'published',
      };

      if (
        JSON.stringify(documentUpdate) ===
        JSON.stringify(this.initialValueBeforeUpdate)
      ) {
        this.toastr.warning('No change detected to update');
        return;
      }

      event.target.classList.add('btn-loading');

      this.companyuserService.updateTDSTemplate(documentUpdate).subscribe(
        (res) => {
          if (res.status == 'success') {
            this.toastr.success(res.message);
            this.initialValueBeforeUpdate = documentUpdate;
            $('#my-datatable')
              .dataTable()
              .api()
              .ajax.reload(function (json) {}, false);
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

  showUpdateHistory(item: any) {
    this.viewPolicyDetail = item;
    if (this.viewPolicyDetail.history != null) {
      $('#history-datatable').dataTable().api().ajax.reload();
      $('#historymmodalbutton').click();
    } else {
      this.toastr.warning('No update history found to show');
    }
  }

  getUpdateHistory() {
    if (
      this.viewPolicyDetail != null &&
      this.viewPolicyDetail.history != null &&
      Array.isArray(this.viewPolicyDetail.history)
    ) {
      return this.viewPolicyDetail.history;
    } else {
      return [];
    }
  }

  validate_tds_template() {
    const ele = this;

    return new Promise(function (resolve, reject) {
      if (
        ele.tdsRuleForm.value.application_methode.value == 'one_time' &&
        ele.tdsRuleForm.value.frequency.value != 'yearly'
      ) {
        ele.toastr.error(
          'For One-Time application method, the frequency value must be Yearly'
        );
        resolve(false);
        return;
      }

      if (
        parseInt(ele.tdsRuleForm.value.deadline_month.value) == 2 &&
        parseInt(ele.tdsRuleForm.value.deadline_day.value) > 28
      ) {
        ele.toastr.error(
          'For deadline month selected the deadline day value cannot be more than 28'
        );
        resolve(false);
        return;
      }

      if (
        [4, 6, 9, 11].includes(
          parseInt(ele.tdsRuleForm.value.deadline_month.value)
        ) &&
        parseInt(ele.tdsRuleForm.value.deadline_day.value) > 30
      ) {
        ele.toastr.error(
          'For deadline month selected the deadline day value cannot be more than 30'
        );
        resolve(false);
        return;
      }

      resolve(true);
      return;
    });
  }

  fetchTemplateLibrary() {
    const _this = this;

    this.dtOptionsLibrary = {
      ajax: (dataTablesParameters: any, callback) => {
        this.companyuserService
          .fetchTDSTemplateLibrary({
            pageno: Math.floor(
              (dataTablesParameters.start + dataTablesParameters.length) /
                dataTablesParameters.length
            ),
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
                  recordsTotal: res.tds_policy.totalDocs,
                  recordsFiltered: res.tds_policy.totalDocs,
                  data: res.tds_policy.docs,
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
            return full.template_name;
          },
          orderable: true,
          name: 'template_name',
        },
        {
          render: function (data, type, full, meta) {
            switch (full.application_methode) {
              case 'assumed':
                return 'Assumed';
                break;

              case 'progreesive_acual_investment':
                return 'Progressive with Actual Investment';
                break;

              case 'progreesive_assumed_investment':
                return 'Progressive with Assumed Investment';
                break;

              case 'one_time':
                return 'One Time';
                break;

              default:
                return full.application_methode;
                break;
            }
          },
          orderable: true,
          name: 'application_methode',
        },
        {
          render: function (data, type, full, meta) {
            switch (full.frequency) {
              case 'monthly':
                return 'Monthly';
                break;

              case 'quaterly':
                return 'Quaterly';
                break;

              case 'half_yearly':
                return 'Half Yearly';
                break;

              case 'yearly':
                return 'Yearly';
                break;

              case 'not_defined':
                return 'Not Defined';
                break;

              default:
                return full.frequency;
                break;
            }
          },
          orderable: true,
          name: 'frequency',
        },
        {
          render: function (data, type, full, meta) {
            return full.deadline_day + '/' + full.deadline_month;
          },
          orderable: false,
        },
      ],
      drawCallback: function (settings) {
        Global.loadCustomScripts('customJsScript');
      },
      rowCallback: (row: Node, data: any[] | Object, index: number) => {
        const self = this;
        $('table').on('click', '#cloneButton-' + index, function () {
          self.cloneItem(data);
        });

        return row;
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

    this.tdsRuleForm.patchValue({
      template_name: item.template_name,

      application_methode: this.applicationMethodMaster.find((obj) => {
        return obj.value == item.application_methode;
      }),

      frequency: this.frequencyMaster.find((obj) => {
        return obj.value == item.frequency;
      }),

      deadline_day: this.deadlineDayMaster.find((obj) => {
        return obj.value == item.deadline_day;
      }),

      deadline_month: this.deadlineMonthMaster.find((obj) => {
        return obj.value == item.deadline_month;
      }),

      publish_status: this.publishStatusMaster.find((obj) => {
        return obj.value == item.publish_status;
      }),
    });

    $('html, body').animate({
      scrollTop: $('#tdsrule-submit-section').position().top,
    });
  }

  async getIncomeTaxSlabsList(){
    try {
      const res = await this.companyuserService.fetchITaxTemplates({status:"active"}).toPromise();
      if(res.status !== 'success') throw res;
      this.incomeTaxSlabsList = res.incometax || [];
    } catch (err:any) {
      this.toastr.error(err.message || err || 'Something went wrong')
    }
  }

  async getTdsRulesDeductionList(){
    try {
      const res = await this.companyuserService.geTDSList({pagination:false}).toPromise();
      if(res.status !== 'success') throw res;
      this.tdsDeductionRulesList = res.data || []
    } catch (err:any) {
      this.toastr.error(err.message || err || 'Something went wrong')
    }
  }
}
