import { DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { disableDebugTools, Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import * as Global from 'src/app/globals';
import { AdminService } from 'src/app/services/admin.service';
import swal from 'sweetalert2';

@Component({
  selector: 'admin-app-attendance-policy',
  templateUrl: './attendance-policy.component.html',
  styleUrls: ['./attendance-policy.component.css']
})
export class ADAttendancePolicyComponent implements OnInit {
  dtOptions: DataTables.Settings = {};
  dtOptionsHistory: DataTables.Settings = {};
  attendancePolicyForm: UntypedFormGroup;
  editActionId: String;
  registerTypes: any[];
  calendarDaysMaster: any[];
  calendarDaysTwoMaster: any[];
  viewPolicyDetail: any = null;
  initialValueBeforeUpdate: any = null;
  publishStatusMaster: any[];

  constructor(
    public formBuilder: UntypedFormBuilder,
    private titleService: Title,
    private toastr: ToastrService,
    private router: Router,
    private adminService: AdminService,
    private spinner: NgxSpinnerService,
    private datePipe: DatePipe
  ) {
    this.editActionId = '';
    this.registerTypes = [
      { 'value': 'time', 'description': 'Time' },
      { 'value': 'wholeday', 'description': 'Whole Day' },
      { 'value': 'halfday', 'description': 'Half Day' },
      { 'value': 'monthly', 'description': 'Monthly' },
    ];

    this.attendancePolicyForm = formBuilder.group({
      cut_off_day_custom: [null, Validators.compose([])],
      no_of_days: [null, [Validators.pattern("^[0-9]*$"), Validators.min(1), Validators.max(28)]],
      absent: [null, Validators.compose([Validators.pattern("^[0-9]*$"), Validators.min(1), Validators.max(28)])],
      grace_period: [null, Validators.compose([Validators.pattern("^[0-9]*$")])],
      full_day_max_hours: [null, Validators.compose([])],
      half_day_max_hours: [null, Validators.compose([])],
      custom_days: [null, Validators.compose([])],
      reporting_time: [null, Validators.compose([Validators.required])],
      closing_time: [null, Validators.compose([Validators.required])],
      template_name: [null, Validators.compose([Validators.required])],
      register_type: [null, Validators.compose([Validators.required])],
      // last_day_of_month: [null, Validators.compose([Validators.required])],
      // full_month_days: [null, Validators.compose([Validators.required])],
      publish_status: [null, Validators.compose([Validators.required])],
    });

    this.calendarDaysMaster = [];
    for (let index = 1; index <= 28; index++) {
      this.calendarDaysMaster.push({ value: index, description: index })
    }

    this.calendarDaysTwoMaster = [];
    for (let index = 1; index <= 31; index++) {
      this.calendarDaysTwoMaster.push({ value: index, description: index })
    }

    this.publishStatusMaster = [
      { 'value': 'privet', 'description': 'Private' },
      { 'value': 'published', 'description': 'Published' },
    ];
  }

  ngOnInit() {
    this.titleService.setTitle("Attendance Policy Rule - " + Global.AppName);
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
            return (full.template_name) ? full.template_name : 'N/A';
          }
        },
        {
          render: function (data, type, full, meta) {
            return (full.cut_off_day_custom) ? full.cut_off_day_custom : 'N/A';
          }
        },
        {
          render: function (data, type, full, meta) {
            return (full.no_of_days) ? full.no_of_days : 'N/A';
          }
        },
        {
          render: function (data, type, full, meta) {
            return (full.absent) ? full.absent : 'N/A';
          }
        },
        {
          render: function (data, type, full, meta) {
            return (full.grace_period) ? full.grace_period : 'N/A';
          }
        },
        {
          render: function (data, type, full, meta) {
            let html = "";

            if (Array.isArray(full.register_type)) {
              full.register_type.forEach((element: any) => {
                html += `<span class='text-capitalize badge badge-primary rg-badges'>` + element.replace(/_/gi, " ") + `</span>`;
              });
            } else {
              html += `<span class='text-capitalize badge badge-primary rg-badges'>` + full.register_type.replace(/_/gi, " ").replace(/_/gi, " ") + `</span>`;
            }

            return html;
          },
          className: "text-center"
        },
        {
          render: function (data, type, full, meta) {
            return (full.full_day_max_hours) ? full.full_day_max_hours : 'N/A';
          }
        },
        {
          render: function (data, type, full, meta) {
            return (full.half_day_max_hours) ? full.half_day_max_hours : 'N/A';
          }
        },
        {
          render: function (data, type, full, meta) {
            return (full.reporting_time) ? full.reporting_time : 'N/A';
          }
        },
        {
          render: function (data, type, full, meta) {
            return (full.closing_time) ? full.closing_time : 'N/A';
          }
        },
        {
          render: function (data, type, full, meta) {
            let res = (full.comp_off) ? full.comp_off : 'N/A';
            return `<span class="text-uppercase">` + res + `</span>`;
          },
        },
        {
          render: function (data, type, full, meta) {
            let res = (full.sandwich_leave) ? full.sandwich_leave : 'N/A';
            return `<span class="text-uppercase">` + res + `</span>`;
          },
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
      // console.log(Global.DataTableLength);
        // 
        this.adminService.fetchAttendancePolicies({
          'pageno': Math.round(Math.floor((dataTablesParameters.start + dataTablesParameters.length) / dataTablesParameters.length)), 'perpage': dataTablesParameters.length,
          'searchkey': dataTablesParameters.search.value,
          'sortbyfield': Global.getTableSortingOptions('sortbyfield', dataTablesParameters),
          'ascdesc': Global.getTableSortingOptions('ascdesc', dataTablesParameters)
        }).subscribe(res => {
          if (res.status == 'success') {
            callback({
              recordsTotal: res.attendancerule.totalDocs,
              recordsFiltered: res.attendancerule.totalDocs,
              data: res.attendancerule.docs,
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
            return (full.template_name) ? full.template_name : 'N/A';
          },
          orderable: true,
          name: 'template_name',
        },
        {
          render: function (data, type, full, meta) {
            return (full.cut_off_day_custom) ? full.cut_off_day_custom : 'N/A';
          },
          orderable: true,
          name: 'cut_off_day_custom',
        },
        {
          render: function (data, type, full, meta) {
            return (full.no_of_days) ? full.no_of_days : 'N/A';
          },
          orderable: true,
          name: 'no_of_days',
        },
        {
          render: function (data, type, full, meta) {
            return (full.absent) ? full.absent : 'N/A';
          },
          orderable: true,
          name: 'absent',
        },
        {
          render: function (data, type, full, meta) {
            return (full.grace_period) ? full.grace_period : 'N/A';
          },
          orderable: true,
          name: 'grace_period',
        },
        {
          render: function (data, type, full, meta) {
            let html = "";

            if (Array.isArray(full.register_type)) {
              full.register_type.forEach((element: any) => {
                html += `<span class='text-capitalize badge badge-primary rg-badges'>` + element.replace(/_/gi, " ") + `</span>`;
              });
            } else {
              html += `<span class='text-capitalize badge badge-primary rg-badges'>` + full.register_type.replace(/_/gi, " ").replace(/_/gi, " ") + `</span>`;
            }

            return html;
          },
          className: "text-center",
          orderable: false,
        },
        {
          render: function (data, type, full, meta) {
            return (full.full_day_max_hours) ? full.full_day_max_hours : 'N/A';
          },
          orderable: true,
          name: 'full_day_max_hours'
        },
        {
          render: function (data, type, full, meta) {
            return (full.half_day_max_hours) ? full.half_day_max_hours : 'N/A';
          },
          orderable: true,
          name: 'half_day_max_hours'
        },
        {
          render: function (data, type, full, meta) {
            return (full.reporting_time) ? full.reporting_time : 'N/A';
          },
          orderable: true,
          name: 'reporting_time'
        },
        {
          render: function (data, type, full, meta) {
            return (full.closing_time) ? full.closing_time : 'N/A';
          },
          orderable: true,
          name: 'closing_time'
        },
        {
          render: function (data, type, full, meta) {
            let res = (full.comp_off) ? full.comp_off : 'N/A';
            return `<span class="text-uppercase">` + res + `</span>`;
          },
          orderable: true,
          name: 'comp_off',
        },
        {
          render: function (data, type, full, meta) {
            let res = (full.sandwich_leave) ? full.sandwich_leave : 'N/A';
            return `<span class="text-uppercase">` + res + `</span>`;
          },
          orderable: true,
          name: 'sandwich_leave',
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

        // $('#changeStatusButton', row).bind('click', () => {
        //   self.changeStatus(data);
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
      lengthChange: true, lengthMenu: Global.DataTableLengthChangeMenu,
      responsive: true,
      language: {
        searchPlaceholder: 'Search...',
        search: ""
      }
    };
  }

  changePublishStatus(item: any) {
    this.adminService.updateAttendancePublishStatus({
      'attedance_id': item._id,
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
    this.attendancePolicyForm.patchValue({
      cut_off_day_custom: this.calendarDaysMaster.find(obj => {
        return obj.value === item.cut_off_day_custom
      }),
      no_of_days: item.no_of_days,
      absent: item.absent,
      grace_period: item.grace_period,
      full_day_max_hours: item.full_day_max_hours,
      half_day_max_hours: item.half_day_max_hours,
      custom_days: this.calendarDaysTwoMaster.find(obj => {
        return obj.value === item.custom_days
      }),
      reporting_time: item.reporting_time,
      closing_time: item.closing_time,
      template_name: item.template_name,
      register_type: item.register_type,
      publish_status: this.publishStatusMaster.find(obj => {
        return obj.value == item.publish_status
      }),
    });

    // this.checkRegisterTypesforEdit(item.register_type);

    if (item.last_day_of_month == 'yes') {
      $('#policy-last-day-of-month').addClass("on");
    } else {
      $('#policy-last-day-of-month').removeClass("on");
    }

    if (item.full_month_days == 'yes') {
      $('#policy-full-month-days').addClass("on");
    } else {
      $('#policy-full-month-days').removeClass("on");
    }

    if (item.comp_off == 'yes') {
      $('#comp-off').addClass("on");
    } else {
      $('#comp-off').removeClass("on");
    }

    if (item.sandwich_leave == 'yes') {
      $('#sandwich-leave').addClass("on");
    } else {
      $('#sandwich-leave').removeClass("on");
    }

    this.fieldsChanged('policy-last-day-of-month');
    this.fieldsChanged('register-types');
    this.fieldsChanged('policy-full-month-days');

    this.initialValueBeforeUpdate = {
      'attedance_id': this.editActionId,
      'last_day_of_month': item.last_day_of_month,
      'full_month_days': item.full_month_days,
      'register_type': this.attendancePolicyForm.value.register_type,
      'cut_off_day_custom': this.attendancePolicyForm.value.cut_off_day_custom?.value ?? "",
      'no_of_days': ((this.attendancePolicyForm.value.no_of_days) ? this.attendancePolicyForm.value.no_of_days : "").toString().trim(),
      'absent': ((this.attendancePolicyForm.value.absent) ? this.attendancePolicyForm.value.absent : "").toString().trim(),
      'grace_period': ((this.attendancePolicyForm.value.grace_period) ? this.attendancePolicyForm.value.grace_period : "").toString().trim(),
      'full_day_max_hours': ((this.attendancePolicyForm.value.full_day_max_hours) ? this.attendancePolicyForm.value.full_day_max_hours : "").toString().trim(),
      'half_day_max_hours': ((this.attendancePolicyForm.value.half_day_max_hours) ? this.attendancePolicyForm.value.half_day_max_hours : "").toString().trim(),
      'custom_days': this.attendancePolicyForm.value.custom_days?.value ?? "",
      'reporting_time': ((this.attendancePolicyForm.value.reporting_time) ? this.attendancePolicyForm.value.reporting_time : "").toString().trim(),
      'closing_time': ((this.attendancePolicyForm.value.closing_time) ? this.attendancePolicyForm.value.closing_time : "").toString().trim(),
      'template_name': ((this.attendancePolicyForm.value.template_name) ? this.attendancePolicyForm.value.template_name : "").toString().trim(),
      'comp_off': item.comp_off,
      'sandwich_leave': item.sandwich_leave,
      'publish_status': this.attendancePolicyForm.value.publish_status.value,
    }

    $('html, body').animate({
      'scrollTop': $("#policy-submit-section").position().top
    });
  }

  cancelEdit() {
    this.editActionId = '';
    this.attendancePolicyForm.reset();
    this.resetSelectedRegisterTypes();

    for (const key in this.attendancePolicyForm.controls) {
      if (Object.prototype.hasOwnProperty.call(this.attendancePolicyForm.controls, key)) {
        const element = this.attendancePolicyForm.controls[key];

        element.markAsUntouched();
        element.markAsPristine();
      }
    }
  }

  create(event: any) {
    this.attendancePolicyForm.markAllAsTouched();
    setTimeout(function () {
      let $_errFormControl = document.querySelectorAll("p.error-element");
      if ($_errFormControl.length > 0) {
        const firstErr: Element = $_errFormControl[0];
        firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);

    if (this.attendancePolicyForm.valid) {
      let last_day_of_month = ($('#policy-last-day-of-month').hasClass('on') == true) ? 'yes' : 'no';
      let full_month_days = ($('#policy-full-month-days').hasClass('on') == true) ? 'yes' : 'no';
      let comp_off = ($('#comp-off').hasClass('on') == true) ? 'yes' : 'no';
      let sandwich_leave = ($('#sandwich-leave').hasClass('on') == true) ? 'yes' : 'no';

      // let register_type = this.getSelectedRegisterTypes();
      // if (register_type.length == 0) {
      //   this.toastr.error("You must select atleast on register type");
      //   return;
      // }

      event.target.classList.add('btn-loading');

      this.adminService.createAttendancePolicy({
        'last_day_of_month': last_day_of_month,
        'full_month_days': full_month_days,
        'register_type': this.attendancePolicyForm.value.register_type,
        'cut_off_day_custom': this.attendancePolicyForm.value.cut_off_day_custom?.value ?? "",
        'no_of_days': (this.attendancePolicyForm.value.no_of_days) ? this.attendancePolicyForm.value.no_of_days : "",
        'absent': (this.attendancePolicyForm.value.absent) ? this.attendancePolicyForm.value.absent : "",
        'grace_period': (this.attendancePolicyForm.value.grace_period) ? this.attendancePolicyForm.value.grace_period : "",
        'full_day_max_hours': (this.attendancePolicyForm.value.full_day_max_hours) ? this.attendancePolicyForm.value.full_day_max_hours : "",
        'half_day_max_hours': (this.attendancePolicyForm.value.half_day_max_hours) ? this.attendancePolicyForm.value.half_day_max_hours : "",
        'custom_days': this.attendancePolicyForm.value.custom_days?.value ?? "",
        'reporting_time': (this.attendancePolicyForm.value.reporting_time) ? this.attendancePolicyForm.value.reporting_time : "",
        'closing_time': (this.attendancePolicyForm.value.closing_time) ? this.attendancePolicyForm.value.closing_time : "",
        'template_name': (this.attendancePolicyForm.value.template_name) ? this.attendancePolicyForm.value.template_name : "",
        'comp_off': comp_off,
        'sandwich_leave': sandwich_leave,
        'publish_status': this.attendancePolicyForm.value.publish_status.value,
      }).subscribe(res => {
        if (res.status == 'success') {
          this.toastr.success(res.message);
          // this.attendancePolicyForm.reset();
          // this.resetSelectedRegisterTypes();
          this.cancelEdit()
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
        this.adminService.deleteAttendancePolicy({
          'attedance_id': item._id,
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
    this.attendancePolicyForm.markAllAsTouched();
    setTimeout(function () {
      let $_errFormControl = document.querySelectorAll("p.error-element");
      if ($_errFormControl.length > 0) {
        const firstErr: Element = $_errFormControl[0];
        firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);

    if (this.attendancePolicyForm.valid) {
      let last_day_of_month = ($('#policy-last-day-of-month').hasClass('on') == true) ? 'yes' : 'no';
      let full_month_days = ($('#policy-full-month-days').hasClass('on') == true) ? 'yes' : 'no';
      let comp_off = ($('#comp-off').hasClass('on') == true) ? 'yes' : 'no';
      let sandwich_leave = ($('#sandwich-leave').hasClass('on') == true) ? 'yes' : 'no';

      // let register_type = this.getSelectedRegisterTypes();
      // if (register_type.length == 0) {
      //   this.toastr.error("You must select atleast on register type");
      //   return;
      // }

      const documentUpdate = {
        'attedance_id': this.editActionId,
        'last_day_of_month': last_day_of_month,
        'full_month_days': full_month_days,
        'register_type': this.attendancePolicyForm.value.register_type,
        'cut_off_day_custom': this.attendancePolicyForm.value.cut_off_day_custom?.value ?? "",
        'no_of_days': ((this.attendancePolicyForm.value.no_of_days) ? this.attendancePolicyForm.value.no_of_days : "").toString().trim(),
        'absent': ((this.attendancePolicyForm.value.absent) ? this.attendancePolicyForm.value.absent : "").toString().trim(),
        'grace_period': ((this.attendancePolicyForm.value.grace_period) ? this.attendancePolicyForm.value.grace_period : "").toString().trim(),
        'full_day_max_hours': ((this.attendancePolicyForm.value.full_day_max_hours) ? this.attendancePolicyForm.value.full_day_max_hours : "").toString().trim(),
        'half_day_max_hours': ((this.attendancePolicyForm.value.half_day_max_hours) ? this.attendancePolicyForm.value.half_day_max_hours : "").toString().trim(),
        'custom_days': this.attendancePolicyForm.value.custom_days?.value ?? "",
        'reporting_time': ((this.attendancePolicyForm.value.reporting_time) ? this.attendancePolicyForm.value.reporting_time : "").toString().trim(),
        'closing_time': ((this.attendancePolicyForm.value.closing_time) ? this.attendancePolicyForm.value.closing_time : "").toString().trim(),
        'template_name': ((this.attendancePolicyForm.value.template_name) ? this.attendancePolicyForm.value.template_name : "").toString().trim(),
        'comp_off': comp_off,
        'sandwich_leave': sandwich_leave,
        'publish_status': this.attendancePolicyForm.value.publish_status.value,
      }

      if (JSON.stringify(documentUpdate) === JSON.stringify(this.initialValueBeforeUpdate)) {
        this.toastr.warning("No change detected to update");
        return;
      }

      event.target.classList.add('btn-loading');

      this.adminService.updateAttendancePolicy(
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

  getSelectedRegisterTypes() {
    const register_types: any = []

    $('input[name="register_type[]"]:checked').each(function () {
      register_types.push($(this).val())
    });

    return register_types;
  }

  resetSelectedRegisterTypes() {
    $('input[name="register_type[]"]:checked').each(function () {
      $(this).prop('checked', false)
    });

    $('#policy-last-day-of-month').addClass("on");
    $('#policy-full-month-days').addClass("on");
    $('#comp-off').addClass("on");
    $('#sandwich-leave').addClass("on");

    this.fieldsChanged('policy-last-day-of-month');
    this.fieldsChanged('register-types');
    this.fieldsChanged('policy-full-month-days');
  }

  checkRegisterTypesforEdit(register_types: any) {
    this.resetSelectedRegisterTypes();

    for (const key in register_types) {
      if (Object.prototype.hasOwnProperty.call(register_types, key)) {
        const element = register_types[key];
        $('input[name="register_type[]"][value="' + element + '"]').prop('checked', true);
      }
    }
  }

  fieldsChanged(target: any) {
    var vle = this;

    setTimeout(function () {
      switch (target) {
        case 'policy-last-day-of-month':

          if ($('#policy-last-day-of-month').hasClass('on') == false) {
            vle.attendancePolicyForm.controls['cut_off_day_custom'].setValidators([Validators.required]);
            $('.cut-off-day-custom-fields').show(300);
          } else {
            vle.attendancePolicyForm.controls['cut_off_day_custom'].clearValidators();
            $('.cut-off-day-custom-fields').hide(300);
          }

          vle.attendancePolicyForm.controls['cut_off_day_custom'].updateValueAndValidity();
          break;

        case 'register-types':
          if (vle.attendancePolicyForm.value.register_type && ['time', 'halfday'].includes(vle.attendancePolicyForm.value.register_type)) {
            vle.attendancePolicyForm.controls['full_day_max_hours'].setValidators([Validators.required]);
            vle.attendancePolicyForm.controls['half_day_max_hours'].setValidators([Validators.required]);
            $('.full-day-max-hours-fields').show(300);
            $('.half-day-max-hours-fields').show(300);
          } else {
            vle.attendancePolicyForm.controls['full_day_max_hours'].clearValidators();
            vle.attendancePolicyForm.controls['half_day_max_hours'].clearValidators();
            $('.full-day-max-hours-fields').hide(300);
            $('.half-day-max-hours-fields').hide(300);
          }

          vle.attendancePolicyForm.controls['full_day_max_hours'].updateValueAndValidity();
          vle.attendancePolicyForm.controls['half_day_max_hours'].updateValueAndValidity();
          break;

        case 'policy-full-month-days':
          if ($('#policy-full-month-days').hasClass('on') == false) {
            vle.attendancePolicyForm.controls['custom_days'].setValidators([Validators.required]);
            $('.custom-days-fields').show(300);
          } else {
            vle.attendancePolicyForm.controls['custom_days'].clearValidators();
            $('.custom-days-fields').hide(300);
          }

          vle.attendancePolicyForm.controls['custom_days'].updateValueAndValidity();
          break;

        default:
          alert(target);
          break;
      }
    }, 100);
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
