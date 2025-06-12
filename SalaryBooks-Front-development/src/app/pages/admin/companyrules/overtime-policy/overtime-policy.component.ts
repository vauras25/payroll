import { DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ToastrService } from 'ngx-toastr';
import * as Global from 'src/app/globals';
import { AdminService } from 'src/app/services/admin.service';
import swal from 'sweetalert2';

@Component({
  selector: 'admin-app-overtime-policy',
  templateUrl: './overtime-policy.component.html',
  styleUrls: ['./overtime-policy.component.css']
})
export class ADOvertimePolicyComponent implements OnInit {
  dtOptions: DataTables.Settings = {};
  dtOptionsHistory: DataTables.Settings = {};
  overtimePolicyForm: UntypedFormGroup;
  editActionId: String;
  overTimeMaster: any[];
  registerTypes: any[] = [];
  viewPolicyDetail: any = null;
  initialValueBeforeUpdate: any = null;
  publishStatusMaster: any[];

  constructor(
    public formBuilder: UntypedFormBuilder,
    private titleService: Title,
    private toastr: ToastrService,
    private adminService: AdminService,
    private datePipe: DatePipe
  ) {
    this.editActionId = '';
    this.overTimeMaster = [
      { 'value': 'hourly_fix', 'description': 'Amount Rate Hourly Basis' },
      { 'value': 'daily_fix', 'description': 'Amount Rate Daily Basis' },
      { 'value': 'hourly_per', 'description': 'Percentage Rate Hourly Basis' },
      { 'value': 'daily_per', 'description': 'Percentage Daily Basis' },
    ];

    this.overtimePolicyForm = formBuilder.group({
      template_name: [null, Validators.compose([Validators.required])],
      overtime_type: [null, Validators.compose([Validators.required])],
      overtime_rate: [null, Validators.compose([Validators.required, Validators.pattern("^[0-9]+(.[0-9]{0,2})?$")])],
      publish_status: [null, Validators.compose([Validators.required])],
    });

    this.publishStatusMaster = [
      { 'value': 'privet', 'description': 'Private' },
      { 'value': 'published', 'description': 'Published' },
    ];

  }

  ngOnInit() {
    this.titleService.setTitle("Over Time Policy Rule - " + Global.AppName);
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
            return full.template_name;
          }
        },
        {
          render: function (data, type, full, meta) {
            switch (full.overtime_type) {
              case 'hourly_fix':
                return 'Amount Rate Hourly Basis';
                break;
              case 'daily_fix':
                return 'Amount Rate Daily Basis';
                break;
              case 'hourly_per':
                return 'Percentage Rate Hourly Basis';
                break;
              case 'daily_per':
                return 'Percentage Daily Basis';
                break;

              default:
                return full.overtime_type
                break;
            }
          }
        },
        {
          render: function (data, type, full, meta) {
            return full.overtime_rate;
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
        this.adminService.fetchOvertimePolicies({
          'pageno': Math.floor((dataTablesParameters.start + dataTablesParameters.length) / dataTablesParameters.length), 'perpage': dataTablesParameters.length,
          'searchkey': dataTablesParameters.search.value,
          'sortbyfield': Global.getTableSortingOptions('sortbyfield', dataTablesParameters),
          'ascdesc': Global.getTableSortingOptions('ascdesc', dataTablesParameters)
        }).subscribe(res => {
          if (res.status == 'success') {
            callback({
              recordsTotal: res.overtime_policy.totalDocs,
              recordsFiltered: res.overtime_policy.totalDocs,
              data: res.overtime_policy.docs,
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
            return full.template_name;
          },
          orderable: true,
          name: 'template_name'
        },
        {
          render: function (data, type, full, meta) {
            switch (full.overtime_type) {
              case 'hourly_fix':
                return 'Amount Rate Hourly Basis';
                break;
              case 'daily_fix':
                return 'Amount Rate Daily Basis';
                break;
              case 'hourly_per':
                return 'Percentage Rate Hourly Basis';
                break;
              case 'daily_per':
                return 'Percentage Daily Basis';
                break;

              default:
                return full.overtime_type
                break;
            }
          },
          orderable: true,
          name: 'overtime_type'
        },
        {
          render: function (data, type, full, meta) {
            return full.overtime_rate;
          },
          orderable: true,
          name: 'overtime_rate'
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

        // $('#changeStatusButton', row).bind('click', () => {
        //   self.changeStatus(data);
        // });

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
    this.adminService.updateOvertimePublishStatus({
      'overtime_policy_id': item._id,
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
    this.overtimePolicyForm.setValue({
      template_name: item.template_name,
      overtime_type: item.overtime_type,
      overtime_rate: item.overtime_rate,
      publish_status: this.publishStatusMaster.find(obj => {
        return obj.value == item.publish_status
      }),
    });

    this.initialValueBeforeUpdate = {
      'overtime_policy_id': this.editActionId,
      'template_name': this.overtimePolicyForm.value.template_name.toString().trim(),
      'overtime_type': this.overtimePolicyForm.value.overtime_type.toString().trim(),
      'overtime_rate': this.overtimePolicyForm.value.overtime_rate.toString().trim(),
      'publish_status': this.overtimePolicyForm.value.publish_status.value,
    }

    $('html, body').animate({
      'scrollTop': $("#policy-submit-section").position().top
    });
  }

  cancelEdit() {
    this.editActionId = '';
    this.overtimePolicyForm.reset();

    for (const key in this.overtimePolicyForm.controls) {
      if (Object.prototype.hasOwnProperty.call(this.overtimePolicyForm.controls, key)) {
        const element = this.overtimePolicyForm.controls[key];

        element.markAsUntouched();
        element.markAsPristine();
      }
    }
  }

  create(event: any) {
    if (this.overtimePolicyForm.valid) {
      event.target.classList.add('btn-loading');

      this.adminService.createOvertimePolicy({
        'template_name': this.overtimePolicyForm.value.template_name,
        'overtime_type': this.overtimePolicyForm.value.overtime_type,
        'overtime_rate': this.overtimePolicyForm.value.overtime_rate,
        'publish_status': this.overtimePolicyForm.value.publish_status.value,
      }).subscribe(res => {
        if (res.status == 'success') {
          this.toastr.success(res.message);
          this.cancelEdit();
          // this.overtimePolicyForm.reset();
          $('#my-datatable').dataTable().api().ajax.reload(function (json) { }, false);
        } else if (res.status == 'val_err') {
          this.toastr.error(Global.showValidationMessage(res.val_msg));
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
        this.adminService.deleteOvertimePolicy({
          'overtime_policy_id': item._id,
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

  update(event: any) {
    if (this.overtimePolicyForm.valid) {
      const documentUpdate = {
        'overtime_policy_id': this.editActionId,
        'template_name': this.overtimePolicyForm.value.template_name.toString().trim(),
        'overtime_type': this.overtimePolicyForm.value.overtime_type.toString().trim(),
        'overtime_rate': this.overtimePolicyForm.value.overtime_rate.toString().trim(),
        'publish_status': this.overtimePolicyForm.value.publish_status.value,
      }

      if (JSON.stringify(documentUpdate) === JSON.stringify(this.initialValueBeforeUpdate)) {
        this.toastr.warning("No change detected to update");
        return;
      }

      event.target.classList.add('btn-loading');

      this.adminService.updateOvertimePolicy(
        documentUpdate
      ).subscribe(res => {
        if (res.status == 'success') {
          this.toastr.success(res.message);
          this.initialValueBeforeUpdate = documentUpdate;
          $('#my-datatable').dataTable().api().ajax.reload(function (json) { }, false);
        } else if (res.status == 'val_err') {
          this.toastr.error(Global.showValidationMessage(res.val_msg));
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
}
