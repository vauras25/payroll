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
  selector: 'app-smtp',
  templateUrl: './smtp.component.html',
})
export class SmtpComponent implements OnInit {
  dtOptions: DataTables.Settings = {};
  dtOptionsHistory: DataTables.Settings = {};
  smtpForm: UntypedFormGroup;
  editActionId: String;
  registerTypes: any[];

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


    this.smtpForm = formBuilder.group({

      smtp_name: [null, Validators.compose([Validators.required])],
      host_address: [null, Validators.compose([Validators.required])],
      username: [null, Validators.compose([Validators.required])],
      from_email_address: [null, Validators.compose([Validators.required,Validators.email])],
      password: [null, Validators.compose([Validators.required])],
      smtp_method: [null, Validators.compose([Validators.required])],
      port: [null, Validators.compose([Validators.required,Validators.pattern("^[0-9]*$")])],


    });


  }

  ngOnInit() {
    this.titleService.setTitle("Attendance Policy Rule - " + Global.AppName);
    this.fetch();


  }

  fetch() {
    this.dtOptions = {
      ajax: (dataTablesParameters: any, callback) => {
        this.adminService.fetchcompanySmtp({
          'pageno': Math.floor((dataTablesParameters.start + dataTablesParameters.length) / dataTablesParameters.length), 'perpage': dataTablesParameters.length,
          'searchkey': dataTablesParameters.search.value,
          'sortbyfield': Global.getTableSortingOptions('sortbyfield', dataTablesParameters),
          'ascdesc': Global.getTableSortingOptions('ascdesc', dataTablesParameters)
        }).subscribe(res => {
          if (res.status == 'success') {
            callback({
              recordsTotal: res.smtp_list.totalDocs,
              recordsFiltered: res.smtp_list.totalDocs,
              data: res.smtp_list.docs,
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
            if (full.status == "active") {
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

                    <button class="btn btn-danger btn-icon mx-1" data-toggle="tooltip" data-placement="top" title="Delete" id="deleteButton-`+ meta.row + `">
                        <div style="width:25px; height:25px;"><i class="fa fa-trash"></i></div>
                    </button>`;
          },
          className: 'text-center',
          orderable: false
        },
        {
          render: function (data, type, full, meta) {
            return (full.smtp_name) ? full.smtp_name : 'N/A';
          },
          orderable: false,
          name: 'smtp_name',
        },
        {
          render: function (data, type, full, meta) {
            return (full.host_address) ? full.host_address : 'N/A';
          },
          orderable: false,
          name: 'host_address',
        },
        {
          render: function (data, type, full, meta) {
            return (full.username) ? full.username : 'N/A';
          },
          orderable: false,
          name: 'username',
        },

        {
          render: function (data, type, full, meta) {
            return (full.from_email_address) ? full.from_email_address : 'N/A';
          },
          orderable: false,
          name: 'from_email_address',
        },
        {
          render: function (data, type, full, meta) {
            return (full.password) ? full.password : 'N/A';
          },
          orderable: false,
          name: 'password',
        },

        {
          render: function (data, type, full, meta) {
            return (full.method) ? full.method : 'N/A';
          },
          orderable: false,
          name: 'method'
        },
        {
          render: function (data, type, full, meta) {
            return (full.port) ? full.port : 'N/A';
          },
          orderable: false,
          name: 'port'
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
          self.changeStatus(data);
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

  changeStatus(item: any) {
    // console.log(item.publish_status);
    this.adminService.updatecompanysmtpStatus({
      'smtp_id': item._id,
      'status': item.status=='inactive'?'active':'inactive',
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
    this.smtpForm.patchValue({

      smtp_name: item.smtp_name,
      host_address: item.host_address,
      username: item.username,
      from_email_address: item.from_email_address,
      password: item.password,
      smtp_method: item.method,
      port: item.port,


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


    $('html, body').animate({
      'scrollTop': $("#policy-submit-section").position().top
    });
  }

  cancelEdit() {
    this.editActionId = '';
    this.smtpForm.reset();

    for (const key in this.smtpForm.controls) {
      if (Object.prototype.hasOwnProperty.call(this.smtpForm.controls, key)) {
        const element = this.smtpForm.controls[key];

        element.markAsUntouched();
        element.markAsPristine();
      }
    }
  }

  create(event: any) {
    this.smtpForm.markAllAsTouched();
    setTimeout(function () {
      let $_errFormControl = document.querySelectorAll("p.error-element");
      if ($_errFormControl.length > 0) {
        const firstErr: Element = $_errFormControl[0];
        firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);

    if (this.smtpForm.valid) {

      event.target.classList.add('btn-loading');

      this.adminService.createcompanySmtp({
        'smtp_name': this.smtpForm.value.smtp_name ?? "",
        'host_address': this.smtpForm.value.host_address ?? "",
        'username': this.smtpForm.value.username ?? "",
        'from_email_address': this.smtpForm.value.from_email_address ?? "",
        'password': this.smtpForm.value.password ?? "",
        'method': this.smtpForm.value.smtp_method ?? "",
        'port': this.smtpForm.value.port ?? "",

      }).subscribe(res => {
        if (res.status == 'success') {
          this.toastr.success(res.message);
          // this.smtpForm.reset();
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
        this.adminService.deletecompanySmtp({
          'smtp_id': item._id,
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
    this.smtpForm.markAllAsTouched();
    setTimeout(function () {
      let $_errFormControl = document.querySelectorAll("p.error-element");
      if ($_errFormControl.length > 0) {
        const firstErr: Element = $_errFormControl[0];
        firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);

    if (this.smtpForm.valid) {
      const documentUpdate = {
        'smtp_id':this.editActionId,
        'smtp_name': this.smtpForm.value.smtp_name ?? "",
        'host_address': this.smtpForm.value.host_address ?? "",
        'username': this.smtpForm.value.username ?? "",
        'from_email_address': this.smtpForm.value.from_email_address ?? "",
        'password': this.smtpForm.value.password ?? "",
        'method': this.smtpForm.value.smtp_method ?? "",
        'port': this.smtpForm.value.port ?? "",




      }

      if (JSON.stringify(documentUpdate) === JSON.stringify(this.initialValueBeforeUpdate)) {
        this.toastr.warning("No change detected to update");
        return;
      }

      event.target.classList.add('btn-loading');

      this.adminService.updatecompanySmtp(
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


  checkRegisterTypesforEdit(register_types: any) {

    for (const key in register_types) {
      if (Object.prototype.hasOwnProperty.call(register_types, key)) {
        const element = register_types[key];
        $('input[name="register_type[]"][value="' + element + '"]').prop('checked', true);
      }
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
