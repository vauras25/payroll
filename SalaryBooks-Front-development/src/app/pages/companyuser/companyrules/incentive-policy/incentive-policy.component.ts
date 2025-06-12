import { DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';
import { disableDebugTools, Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import * as Global from 'src/app/globals';
import { CompanyuserService } from 'src/app/services/companyuser.service';
import swal from 'sweetalert2';

@Component({
  selector: 'admin-app-incentive-policy',
  templateUrl: './incentive-policy.component.html',
  styleUrls: ['./incentive-policy.component.css'],
})
export class CMPIncentivePolicyComponent implements OnInit {
  dtOptions: DataTables.Settings = {};
  dtOptionsHistory: DataTables.Settings = {};
  dtOptionsLibrary: DataTables.Settings = {};
  incentiveTemplateForm: UntypedFormGroup;
  editActionId: String;
  settlementFrequencyMaster: any[];
  viewPolicyDetail: any = null;
  initialValueBeforeUpdate: any = null;
  publishStatusMaster: any[];
  Global = Global;

  constructor(
    public formBuilder: UntypedFormBuilder,
    private titleService: Title,
    private toastr: ToastrService,
    private router: Router,
    private companyuserService: CompanyuserService,
    private spinner: NgxSpinnerService,
    private datePipe: DatePipe
  ) {
    if (
      !Global.checkCompanyModulePermission({
        company_module: 'company_rules_1',
        company_sub_module: 'incentive_policy',
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

    this.editActionId = '';

    this.settlementFrequencyMaster = [
      // { 'value': 'daily', 'description': 'Daily' },
      // { 'value': 'weekly', 'description': 'Weekly' },
      // { 'value': 'fortnightly', 'description': 'Fortnightly' },
      // { 'value': 'monthly', 'description': 'Monthly' },
      // { 'value': 'quaterly', 'description': 'Quaterly' },
      // { 'value': 'yearly', 'description': 'Yearly' },

      { value: 'monthly', description: 'Monthly' },
      { value: 'quaterly', description: 'Quaterly' },
      { value: 'half_yearly', description: 'Half Yearly' },
      { value: 'yearly', description: 'Yearly' },
    ];

    this.incentiveTemplateForm = formBuilder.group({
      template_name: [null, Validators.compose([Validators.required])],
      min_hold: [
        null,
        Validators.compose([
          Validators.required,
          Validators.pattern('^[0-9]*$'),
        ]),
      ],
      max_hold: [
        null,
        Validators.compose([
          Validators.required,
          Validators.pattern('^[0-9]*$'),
        ]),
      ],
      settlement_frequency: [null, Validators.compose([Validators.required])],
      // tds_apply: [null, Validators.compose([Validators.required])],
      // esic_apply: [null, Validators.compose([Validators.required])],
      // pf_apply: [null, Validators.compose([Validators.required])],
      // pt_apply: [null, Validators.compose([Validators.required])],
      // eligble_disburse: [null, Validators.compose([Validators.required])],
      publish_status: [null, Validators.compose([])],
    });

    this.publishStatusMaster = [
      { value: 'privet', description: 'Private' },
      { value: 'published', description: 'Published' },
    ];
  }

  ngOnInit() {
    this.titleService.setTitle('Incentive Policy Template - ' + Global.AppName);
    this.fetch();
    this.fetchTemplateLibrary();

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
            return full.eligble_disburse;
          },
        },
        {
          render: function (data, type, full, meta) {
            return full.min_hold;
          },
        },
        {
          render: function (data, type, full, meta) {
            return full.max_hold;
          },
        },
        {
          render: function (data, type, full, meta) {
            return full.settlement_frequency;
          },
          className: 'text-capitalize',
        },
        {
          render: function (data, type, full, meta) {
            return full.esic_apply;
          },
          className: 'text-capitalize',
        },
        {
          render: function (data, type, full, meta) {
            return full.pf_apply;
          },
          className: 'text-capitalize',
        },
        {
          render: function (data, type, full, meta) {
            return full.pt_apply;
          },
          className: 'text-capitalize',
        },
        {
          render: function (data, type, full, meta) {
            return full.tds_apply;
          },
          className: 'text-capitalize',
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
  }

  fetch() {
    this.dtOptions = {
      ajax: (dataTablesParameters: any, callback) => {
        this.companyuserService
          .fetchIncentiveTemplates({
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
                  recordsTotal: res.incentive_policy.totalDocs,
                  recordsFiltered: res.incentive_policy.totalDocs,
                  data: res.incentive_policy.docs,
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
                company_module: 'company_rules_1',
                company_sub_module: 'incentive_policy',
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
              `<button class="btn btn-info btn-icon mx-1" data-toggle="tooltip" data-placement="top" title="Update History" id="historyButton-` +
              meta.row +
              `">
            <div style="width:25px; height:25px;"><i class="fa fa-history"></i></div>
        </button>`;

            if (
              Global.checkCompanyModulePermission({
                company_module: 'company_rules_1',
                company_sub_module: 'incentive_policy',
                company_sub_operation: ['edit'],
                company_strict: true,
              })
            ) {
              html +=
                `<button class="btn btn-primary btn-icon mx-1" data-toggle="tooltip" data-placement="top" title="Edit" id="editButton-` +
                meta.row +
                `">
        <div style="width:25px; height:25px;"><i class="fa fa-pen"></i></div>
    </button> `;
            }
            if (
              Global.checkCompanyModulePermission({
                company_module: 'company_rules_1',
                company_sub_module: 'incentive_policy',
                company_sub_operation: ['delete'],
                company_strict: true,
              })
            ) {
              html +=
                `<button class="btn btn-danger btn-icon mx-1" data-toggle="tooltip" data-placement="top" title="Delete" id="deleteButton-` +
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
            return full.eligble_disburse;
          },
          orderable: true,
          name: 'eligble_disburse',
        },
        {
          render: function (data, type, full, meta) {
            return full.min_hold;
          },
          orderable: true,
          name: 'min_hold',
        },
        {
          render: function (data, type, full, meta) {
            return full.max_hold;
          },
          orderable: true,
          name: 'max_hold',
        },
        {
          render: function (data, type, full, meta) {
            return full.settlement_frequency;
          },
          className: 'text-capitalize',
          orderable: true,
          name: 'settlement_frequency',
        },
        {
          render: function (data, type, full, meta) {
            return full.esic_apply;
          },
          className: 'text-capitalize',
          orderable: true,
          name: 'esic_apply',
        },
        {
          render: function (data, type, full, meta) {
            return full.pf_apply;
          },
          className: 'text-capitalize',
          orderable: true,
          name: 'pf_apply',
        },
        {
          render: function (data, type, full, meta) {
            return full.pt_apply;
          },
          className: 'text-capitalize',
          orderable: true,
          name: 'pt_apply',
        },
        {
          render: function (data, type, full, meta) {
            return full.tds_apply;
          },
          className: 'text-capitalize',
          orderable: true,
          name: 'tds_apply',
        },
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

        // $('#publishStatusButton', row).bind('click', () => {
        //   self.changePublishStatus(data);
        // });

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

  changePublishStatus(item: any) {
    this.companyuserService
      .updateIncentiveTemplatePublishStatus({
        incentive_policy_id: item._id,
        status: item.publish_status == 'published' ? 'privet' : 'published',
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

  changeStatus(item: any) {
    this.companyuserService
      .updateIncentiveTemplateStatus({
        incentive_policy_id: item._id,
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
    this.incentiveTemplateForm.patchValue({
      template_name: item.template_name,
      min_hold: item.min_hold,
      max_hold: item.max_hold,
      settlement_frequency: this.settlementFrequencyMaster.find((obj) => {
        return obj.value === item.settlement_frequency;
      }),
      publish_status: this.publishStatusMaster.find((obj) => {
        return obj.value == item.publish_status;
      }),
    });

    if (item.tds_apply == 'yes') {
      $('#template-tds-apply').addClass('on');
    } else {
      $('#template-tds-apply').removeClass('on');
    }

    if (item.esic_apply == 'yes') {
      $('#template-esic-apply').addClass('on');
    } else {
      $('#template-esic-apply').removeClass('on');
    }

    if (item.pf_apply == 'yes') {
      $('#template-pf-apply').addClass('on');
    } else {
      $('#template-pf-apply').removeClass('on');
    }

    if (item.pt_apply == 'yes') {
      $('#template-pt-apply').addClass('on');
    } else {
      $('#template-pt-apply').removeClass('on');
    }

    if (item.eligble_disburse == 'yes') {
      $('#template-eligble-disburse').addClass('on');
    } else {
      $('#template-eligble-disburse').removeClass('on');
    }

    this.initialValueBeforeUpdate = {
      incentive_policy_id: this.editActionId,
      template_name: this.incentiveTemplateForm.value.template_name
        .toString()
        .trim(),
      min_hold: this.incentiveTemplateForm.value.min_hold.toString().trim(),
      max_hold: this.incentiveTemplateForm.value.max_hold.toString().trim(),
      settlement_frequency:
        this.incentiveTemplateForm.value.settlement_frequency.value,
      tds_apply: item.tds_apply,
      esic_apply: item.esic_apply,
      pf_apply: item.pf_apply,
      pt_apply: item.pt_apply,
      eligble_disburse: item.eligble_disburse,
      publish_status:
        this.incentiveTemplateForm.value.publish_status?.value ?? 'published',
    };

    $('html, body').animate({
      scrollTop: $('#template-submit-section').position().top,
    });
  }

  cancelEdit() {
    this.editActionId = '';
    this.incentiveTemplateForm.reset();
    this.resetFormFields();

    for (const key in this.incentiveTemplateForm.controls) {
      if (
        Object.prototype.hasOwnProperty.call(
          this.incentiveTemplateForm.controls,
          key
        )
      ) {
        const element = this.incentiveTemplateForm.controls[key];

        element.markAsUntouched();
        element.markAsPristine();
      }
    }
  }

  create(event: any) {
    if (this.incentiveTemplateForm.valid) {
      let tds_apply =
        $('#template-tds-apply').hasClass('on') == true ? 'yes' : 'no';
      let esic_apply =
        $('#template-esic-apply').hasClass('on') == true ? 'yes' : 'no';
      let pf_apply =
        $('#template-pf-apply').hasClass('on') == true ? 'yes' : 'no';
      let pt_apply =
        $('#template-pt-apply').hasClass('on') == true ? 'yes' : 'no';
      let eligble_disburse =
        $('#template-eligble-disburse').hasClass('on') == true ? 'yes' : 'no';

      event.target.classList.add('btn-loading');

      this.companyuserService
        .createIncentiveTemplate({
          template_name: this.incentiveTemplateForm.value.template_name,
          min_hold: this.incentiveTemplateForm.value.min_hold,
          max_hold: this.incentiveTemplateForm.value.max_hold,
          settlement_frequency:
            this.incentiveTemplateForm.value.settlement_frequency.value,
          tds_apply: tds_apply,
          esic_apply: esic_apply,
          pf_apply: pf_apply,
          pt_apply: pt_apply,
          eligble_disburse: eligble_disburse,
          publish_status:
            this.incentiveTemplateForm.value.publish_status?.value ??
            'published',
        })
        .subscribe(
          (res) => {
            if (res.status == 'success') {
              this.toastr.success(res.message);
              // this.incentiveTemplateForm.reset();
              // this.resetFormFields();
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
            .deleteIncentiveTemplate({
              incentive_policy_id: item._id,
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

  update(event: any) {
    if (this.incentiveTemplateForm.valid) {
      let tds_apply =
        $('#template-tds-apply').hasClass('on') == true ? 'yes' : 'no';
      let esic_apply =
        $('#template-esic-apply').hasClass('on') == true ? 'yes' : 'no';
      let pf_apply =
        $('#template-pf-apply').hasClass('on') == true ? 'yes' : 'no';
      let pt_apply =
        $('#template-pt-apply').hasClass('on') == true ? 'yes' : 'no';
      let eligble_disburse =
        $('#template-eligble-disburse').hasClass('on') == true ? 'yes' : 'no';

      const documentUpdate = {
        incentive_policy_id: this.editActionId,
        template_name: this.incentiveTemplateForm.value.template_name
          .toString()
          .trim(),
        min_hold: this.incentiveTemplateForm.value.min_hold.toString().trim(),
        max_hold: this.incentiveTemplateForm.value.max_hold.toString().trim(),
        settlement_frequency:
          this.incentiveTemplateForm.value.settlement_frequency.value,
        tds_apply: tds_apply,
        esic_apply: esic_apply,
        pf_apply: pf_apply,
        pt_apply: pt_apply,
        eligble_disburse: eligble_disburse,
        publish_status:
          this.incentiveTemplateForm.value.publish_status?.value ?? 'published',
      };

      if (
        JSON.stringify(documentUpdate) ===
        JSON.stringify(this.initialValueBeforeUpdate)
      ) {
        this.toastr.warning('No change detected to update');
        return;
      }

      event.target.classList.add('btn-loading');

      this.companyuserService.updateIncentiveTemplate(documentUpdate).subscribe(
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

  resetFormFields() {
    $('#template-tds-apply').addClass('on');
    $('#template-esic-apply').addClass('on');
    $('#template-pf-apply').addClass('on');
    $('#template-pt-apply').addClass('on');
    $('#template-eligble-disburse').addClass('on');
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

  openTemplateLibrary() {
    $('#librarymmodalbutton').click();
  }

  fetchTemplateLibrary() {
    const _this = this;

    this.dtOptionsLibrary = {
      ajax: (dataTablesParameters: any, callback) => {
        this.companyuserService
          .fetchIncentivePolicyLibrary({
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
                  recordsTotal: res.incentive_rule.totalDocs,
                  recordsFiltered: res.incentive_rule.totalDocs,
                  data: res.incentive_rule.docs,
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
              `<button class="btn btn-primary btn-icon mx-1" data-toggle="tooltip" data-placement="top" title="Clone" id="cloneButton-` +
              meta.row +
              `">
                          <div style="width:25px; height:25px;"><i class="fa fa-copy"></i></div>
                      </button>`;

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
            return full.eligble_disburse;
          },
          orderable: true,
          name: 'eligble_disburse',
        },
        {
          render: function (data, type, full, meta) {
            return full.min_hold;
          },
          orderable: true,
          name: 'min_hold',
        },
        {
          render: function (data, type, full, meta) {
            return full.max_hold;
          },
          orderable: true,
          name: 'max_hold',
        },
        {
          render: function (data, type, full, meta) {
            return full.settlement_frequency;
          },
          className: 'text-capitalize',
          orderable: true,
          name: 'settlement_frequency',
        },
        {
          render: function (data, type, full, meta) {
            return full.esic_apply;
          },
          className: 'text-capitalize',
          orderable: true,
          name: 'esic_apply',
        },
        {
          render: function (data, type, full, meta) {
            return full.pf_apply;
          },
          className: 'text-capitalize',
          orderable: true,
          name: 'pf_apply',
        },
        {
          render: function (data, type, full, meta) {
            return full.pt_apply;
          },
          className: 'text-capitalize',
          orderable: true,
          name: 'pt_apply',
        },
        {
          render: function (data, type, full, meta) {
            return full.tds_apply;
          },
          className: 'text-capitalize',
          orderable: true,
          name: 'tds_apply',
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

  cloneItem(item: any) {
    $('[data-dismiss="modal"]')?.click();
    this.cancelEdit();

    this.incentiveTemplateForm.patchValue({
      template_name: item.template_name,
      min_hold: item.min_hold,
      max_hold: item.max_hold,
      settlement_frequency: this.settlementFrequencyMaster.find((obj) => {
        return obj.value === item.settlement_frequency;
      }),
      publish_status: this.publishStatusMaster.find((obj) => {
        return obj.value == item.publish_status;
      }),
    });

    if (item.tds_apply == 'yes') {
      $('#template-tds-apply').addClass('on');
    } else {
      $('#template-tds-apply').removeClass('on');
    }

    if (item.esic_apply == 'yes') {
      $('#template-esic-apply').addClass('on');
    } else {
      $('#template-esic-apply').removeClass('on');
    }

    if (item.pf_apply == 'yes') {
      $('#template-pf-apply').addClass('on');
    } else {
      $('#template-pf-apply').removeClass('on');
    }

    if (item.pt_apply == 'yes') {
      $('#template-pt-apply').addClass('on');
    } else {
      $('#template-pt-apply').removeClass('on');
    }

    if (item.eligble_disburse == 'yes') {
      $('#template-eligble-disburse').addClass('on');
    } else {
      $('#template-eligble-disburse').removeClass('on');
    }

    $('html, body').animate({
      scrollTop: $('#template-submit-section').position().top,
    });
  }
}
