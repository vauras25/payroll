import { DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { disableDebugTools, Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import * as Global from 'src/app/globals';
import { AdminService } from 'src/app/services/admin.service';
import swal from 'sweetalert2';

@Component({
  selector: 'admin-app-tds-rule',
  templateUrl: './tds-rule.component.html',
  styleUrls: ['./tds-rule.component.css']
})

export class ADTdsRuleComponent implements OnInit {
  dtOptions: DataTables.Settings = {};
  dtOptionsHistory: DataTables.Settings = {};
  tdsRuleForm: UntypedFormGroup;
  editActionId: String;
  applicationMethodMaster: any[];
  frequencyMaster: any[];
  deadlineDayMaster: any[];
  deadlineMonthMaster: any[];
  publishStatusMaster: any[];
  viewPolicyDetail: any = null;
  initialValueBeforeUpdate: any = null;

  constructor(
    public formBuilder: UntypedFormBuilder,
    private titleService: Title,
    private toastr: ToastrService,
    private router: Router,
    private adminService: AdminService,
    private datePipe: DatePipe
  ) {
    this.tdsRuleForm = formBuilder.group({
      template_name: [null, Validators.compose([Validators.required])],
      application_methode: [null, Validators.compose([Validators.required])],
      frequency: [null, Validators.compose([Validators.required])],
      deadline_day: [null, Validators.compose([Validators.required])],
      deadline_month: [null, Validators.compose([Validators.required])],
      publish_status: [null, Validators.compose([Validators.required])],
    });

    this.editActionId = '';

    this.publishStatusMaster = [
      { 'value': 'privet', 'description': 'Private' },
      { 'value': 'published', 'description': 'Published' },
    ];

    this.applicationMethodMaster = [
      { 'value': 'assumed', 'description': 'Assumed' },
      { 'value': 'progreesive_acual_investment', 'description': 'Progressive with Actual Investment' },
      { 'value': 'progreesive_assumed_investment', 'description': 'Progressive with Assumed Investment' },
      { 'value': 'one_time', 'description': 'One Time' },
    ];

    this.frequencyMaster = [
      { 'value': 'monthly', 'description': 'Monthly' },
      { 'value': 'quaterly', 'description': 'Quaterly' },
      { 'value': 'half_yearly', 'description': 'Half Yearly' },
      { 'value': 'yearly', 'description': 'Yearly' },
      { 'value': 'not_defined', 'description': 'Not Defined' },
    ];

    this.deadlineDayMaster = [];
    for (let index = 1; index <= 31; index++) {
      this.deadlineDayMaster.push({ 'value': index, 'description': index })
    }

    this.deadlineMonthMaster = [
      { 'value': '1', 'description': 'January' },
      { 'value': '2', 'description': 'February' },
      { 'value': '3', 'description': 'March' },
      { 'value': '4', 'description': 'April' },
      { 'value': '5', 'description': 'May' },
      { 'value': '6', 'description': 'June' },
      { 'value': '7', 'description': 'July' },
      { 'value': '8', 'description': 'August' },
      { 'value': '9', 'description': 'September' },
      { 'value': '10', 'description': 'October' },
      { 'value': '11', 'description': 'November' },
      { 'value': '12', 'description': 'December' },
    ];
  }

  ngOnInit() {
    this.titleService.setTitle("TDS Template - " + Global.AppName);
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
            return meta.settings._iDisplayStart + (meta.row + 1)
          },
        },
        {
          render: function (data, type, full, meta) {
            var date = full.created_at ? full.created_at : full.updated_at;

            var datePipe = new DatePipe("en-US");
            let value = datePipe.transform(date, 'dd/MM/yyyy hh:mm a');
            return value;
          }
        },
        {
          render: function (data, type, full, meta) {
            return full.user_name ?? 'N/A';
          }
        },
        {
          render: function (data, type, full, meta) {
            return full.template_name
          }
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
                return full.application_methode
                break;
            }
          }
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
                return full.frequency
                break;
            }
          }
        },
        {
          render: function (data, type, full, meta) {
            return full.deadline_day + '/' + full.deadline_month
          }
        },
      ],
      searching: true,
      lengthChange: true, lengthMenu: Global.DataTableLengthChangeMenu,
      responsive: true,
      language: {
        searchPlaceholder: 'Search...',
        search: ""
      }
    }
  }

  fetch() {
    this.dtOptions = {
      ajax: (dataTablesParameters: any, callback) => {
        this.adminService.fetchTDSTemplates({
          'pageno': Math.floor((dataTablesParameters.start + dataTablesParameters.length) / dataTablesParameters.length), 'perpage': dataTablesParameters.length,
          'searchkey': dataTablesParameters.search.value,
          'sortbyfield': Global.getTableSortingOptions('sortbyfield', dataTablesParameters),
          'ascdesc': Global.getTableSortingOptions('ascdesc', dataTablesParameters)
        }).subscribe(res => {
          if (res.status == 'success') {
            callback({
              recordsTotal: res.tds_policy.totalDocs,
              recordsFiltered: res.tds_policy.totalDocs,
              data: res.tds_policy.docs,
            });
          } else {
            this.toastr.error(res.message);
          }
        }, (err) => {
          this.toastr.error("Internal server error occured. Please try again later.");
        });
      },
      columns: [
        {
          render: function (data, type, full, meta: any) {
            return meta.settings._iDisplayStart + (meta.row + 1)
          },
          orderable: false
        },
        {
          render: function (data, type, full, meta) {
            var btnstatus = "";
            if (full.publish_status == "published") {
              btnstatus = 'on';
            } else {
              btnstatus = 'off';
            }

            return `<div class="br-toggle br-toggle-rounded br-toggle-primary ` + btnstatus + `" id="publishStatusButton">\
                      <div class="br-toggle-switch"></div>\
                    </div>`;
          },
          className: 'text-center',
          orderable: true,
          name: 'status',
        },
        {
          render: function (data, type, full, meta) {
            return `<button class="btn btn-primary btn-icon mx-1" data-toggle="tooltip" data-placement="top" title="Edit" id="editButton-` + meta.row + `">
                        <div style="width:25px; height:25px;"><i class="fa fa-pen"></i></div>
                    </button>
                    <button class="btn btn-info btn-icon mx-1" data-toggle="tooltip" data-placement="top" title="Update History" id="historyButton-` + meta.row + `">
                        <div style="width:25px; height:25px;"><i class="fa fa-history"></i></div>
                    </button>
                    <button class="btn btn-danger btn-icon mx-1" data-toggle="tooltip" data-placement="top" title="Delete" id="deleteButton-`+ meta.row + `">
                        <div style="width:25px; height:25px;"><i class="fa fa-trash"></i></div>
                    </button>`;
          },
          className: 'text-center',
          orderable: false
        },
        {
          render: function (data, type, full, meta) {
            return full.template_name
          },
          orderable: true,
          name: 'template_name'
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
                return full.application_methode
                break;
            }
          },
          orderable: true,
          name: 'application_methode'
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
                return full.frequency
                break;
            }
          },
          orderable: true,
          name: 'frequency'
        },
        {
          render: function (data, type, full, meta) {
            return full.deadline_day + '/' + full.deadline_month
          },
          orderable: false
        },
      ],
      drawCallback: function (settings) {
        Global.loadCustomScripts('customJsScript');
      },
      rowCallback: (row: Node, data: any[] | Object, index: number) => {
        const self = this;
        $("table").on('click', '#editButton-' + index, function () {
          self.getEdit(data);
        });

        $("table").on('click', '#deleteButton-' + index, function () {
          self.deleteItem(data);
        });

        $("table").on('click', '#historyButton-' + index, function () {
          self.showUpdateHistory(data);
        });

        $('#publishStatusButton', row).bind('click', () => {
          self.changePublishStatus(data);
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
      lengthChange: true, lengthMenu: Global.DataTableLengthChangeMenu,
      responsive: true,
      language: {
        searchPlaceholder: 'Search...',
        search: ""
      }
    };
  }

  changePublishStatus(item: any) {
    this.adminService.updateTdsPublishStatus({
      'tds_policy_id': item._id,
      'status': (item.publish_status == "published") ? 'privet' : 'published',
    }).subscribe(res => {
      if (res.status == 'success') {
        this.toastr.success(res.message);
        $('#my-datatable').dataTable().api().ajax.reload(function (json) { }, false);
      } else {
        this.toastr.error(res.message);
      }

    }, (err) => {
      this.toastr.error("Internal server error occured. Please try again later.");
    });
  }

  getEdit(item: any) {
    this.editActionId = item._id;
    this.tdsRuleForm.patchValue({
      template_name: item.template_name,

      application_methode: this.applicationMethodMaster.find(obj => {
        return obj.value == item.application_methode
      }),

      frequency: this.frequencyMaster.find(obj => {
        return obj.value == item.frequency
      }),

      deadline_day: this.deadlineDayMaster.find(obj => {
        return obj.value == item.deadline_day
      }),

      deadline_month: this.deadlineMonthMaster.find(obj => {
        return obj.value == item.deadline_month
      }),

      publish_status: this.publishStatusMaster.find(obj => {
        return obj.value == item.publish_status
      }),
    });

    this.initialValueBeforeUpdate = {
      'tds_policy_id': this.editActionId,
      'template_name': this.tdsRuleForm.value.template_name.toString().trim(),
      'application_methode': this.tdsRuleForm.value.application_methode.value,
      'frequency': this.tdsRuleForm.value.frequency.value,
      'deadline_day': this.tdsRuleForm.value.deadline_day.value,
      'deadline_month': this.tdsRuleForm.value.deadline_month.value,
      'publish_status': this.tdsRuleForm.value.publish_status.value,
    }

    $('html, body').animate({
      'scrollTop': $("#tdsrule-submit-section").position().top
    });
  }

  cancelEdit() {
    this.editActionId = '';
    this.tdsRuleForm.reset();

    for (const key in this.tdsRuleForm.controls) {
      if (Object.prototype.hasOwnProperty.call(this.tdsRuleForm.controls, key)) {
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

      this.adminService.createTDSTemplate({
        'template_name': this.tdsRuleForm.value.template_name,
        'application_methode': this.tdsRuleForm.value.application_methode.value,
        'frequency': this.tdsRuleForm.value.frequency.value,
        'deadline_day': this.tdsRuleForm.value.deadline_day.value,
        'deadline_month': this.tdsRuleForm.value.deadline_month.value,
        'publish_status': this.tdsRuleForm.value.publish_status.value,
      }).subscribe(res => {
        if (res.status == 'success') {
          this.toastr.success(res.message);
          // this.tdsRuleForm.reset();
          this.cancelEdit()
          $('#my-datatable').dataTable().api().ajax.reload(function (json) { }, false);
        } else {
          this.toastr.error(res.message);
        }

        event.target.classList.remove('btn-loading');
      }, (err) => {
        event.target.classList.remove('btn-loading');
        this.toastr.error("Internal server error occured. Please try again later.");
      });
    }
  }

  deleteItem(item: any) {
    swal.fire({
      title: 'Are you sure want to remove?',
      text: 'You will not be able to recover this data!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'No, keep it'
    }).then((result) => {
      if (result.value) {
        this.adminService.deleteTDSTemplate({
          'tds_policy_id': item._id,
        }).subscribe(res => {
          if (res.status == 'success') {
            this.toastr.success(res.message);
            $('#my-datatable').dataTable().api().ajax.reload(function (json) { }, false);
          } else {
            this.toastr.error(res.message);
          }
        }, (err) => {
          this.toastr.error("Internal server error occured. Please try again later.");
        });
      } else if (result.dismiss === swal.DismissReason.cancel) {
        swal.fire(
          'Cancelled',
          'Your data is safe :)',
          'error'
        )
      }
    })
  }

  async update(event: any) {
    if (this.tdsRuleForm.valid) {
      var validateData = await this.validate_tds_template();
      if (!validateData) {
        return;
      }

      const documentUpdate = {
        'tds_policy_id': this.editActionId,
        'template_name': this.tdsRuleForm.value.template_name.toString().trim(),
        'application_methode': this.tdsRuleForm.value.application_methode.value,
        'frequency': this.tdsRuleForm.value.frequency.value,
        'deadline_day': this.tdsRuleForm.value.deadline_day.value,
        'deadline_month': this.tdsRuleForm.value.deadline_month.value,
        'publish_status': this.tdsRuleForm.value.publish_status.value,
      }

      if (JSON.stringify(documentUpdate) === JSON.stringify(this.initialValueBeforeUpdate)) {
        this.toastr.warning("No change detected to update");
        return;
      }

      event.target.classList.add('btn-loading');

      this.adminService.updateTDSTemplate(
        documentUpdate
      ).subscribe(res => {
        if (res.status == 'success') {
          this.toastr.success(res.message);
          this.initialValueBeforeUpdate = documentUpdate;
          $('#my-datatable').dataTable().api().ajax.reload(function (json) { }, false);
        } else {
          this.toastr.error(res.message);
        }

        event.target.classList.remove('btn-loading');
      }, (err) => {
        event.target.classList.remove('btn-loading');
        this.toastr.error("Internal server error occured. Please try again later.");
      });
    }
  }

  showUpdateHistory(item: any) {
    this.viewPolicyDetail = item;
    if (this.viewPolicyDetail.history != null) {
      $('#history-datatable').dataTable().api().ajax.reload();
      $('#historymmodalbutton').click();
    } else {
      this.toastr.warning("No update history found to show")
    }
  }

  getUpdateHistory() {
    if (this.viewPolicyDetail != null && this.viewPolicyDetail.history != null && Array.isArray(this.viewPolicyDetail.history)) {
      return this.viewPolicyDetail.history;
    } else {
      return [];
    }
  }

  validate_tds_template() {
    const ele = this;

    return new Promise(function (resolve, reject) {
      if (ele.tdsRuleForm.value.application_methode.value == 'one_time' && ele.tdsRuleForm.value.frequency.value != 'yearly') {
        ele.toastr.error("For One-Time application method, the frequency value must be Yearly");
        resolve(false);
        return;
      }

      if (parseInt(ele.tdsRuleForm.value.deadline_month.value) == 2 && parseInt(ele.tdsRuleForm.value.deadline_day.value) > 28) {
        ele.toastr.error("For deadline month selected the deadline day value cannot be more than 28");
        resolve(false);
        return;
      }

      if ([4, 6, 9, 11].includes(parseInt(ele.tdsRuleForm.value.deadline_month.value)) && parseInt(ele.tdsRuleForm.value.deadline_day.value) > 30) {
        ele.toastr.error("For deadline month selected the deadline day value cannot be more than 30");
        resolve(false);
        return;
      }

      resolve(true);
      return;
    })
  }
}
