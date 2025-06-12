import { Component, OnInit } from '@angular/core';
import { FormArray, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import * as Global from 'src/app/globals';
import { AdminService } from 'src/app/services/admin.service';
import swal from 'sweetalert2';

@Component({
  selector: 'admin-app-roles',
  templateUrl: './roles.component.html',
  styleUrls: ['./roles.component.css']
})
export class ADRolesComponent implements OnInit {
  dtOptions: DataTables.Settings = {};
  roleForm: UntypedFormGroup;
  permissions: any[];
  editActionId: String;

  constructor(
    public formBuilder: UntypedFormBuilder,
    private titleService: Title,
    private adminService: AdminService,
    private toastr: ToastrService,
    private spinner: NgxSpinnerService
  ) {
    this.roleForm = formBuilder.group({
      'role_name': [null, Validators.compose([Validators.required])],
      'role_activity': [null, Validators.compose([Validators.required])],
    });

    this.permissions = [];
    this.editActionId = '';
  }

  ngOnInit(): void {
    this.titleService.setTitle("Roles - " + Global.AppName);

    this.fetchPermissions();
    this.fetch();
  }

  fetchPermissions() {
    this.spinner.show();

    this.adminService.fetchPermissions({})
      .subscribe(res => {
        if (res.status == 'success') {
          this.permissions = res.module_list;
        } else {
          this.toastr.error(res.message);
        }
        this.spinner.hide();
      }, (err) => {
        this.toastr.error("Internal server error occured. Please try again later.");
        this.spinner.hide();
      });
  }

  fetch() {
    this.dtOptions = {
      ajax: (dataTablesParameters: any, callback) => {
        this.adminService.fetchRoles({
          'pageno': Math.floor((dataTablesParameters.start + dataTablesParameters.length) / dataTablesParameters.length), 'perpage': dataTablesParameters.length,
          'searchkey': dataTablesParameters.search.value,
          'sortbyfield': Global.getTableSortingOptions('sortbyfield', dataTablesParameters),
          'ascdesc': Global.getTableSortingOptions('ascdesc', dataTablesParameters)
        }).subscribe(res => {
          if (res.status == 'success') {
            callback({
              recordsTotal: res.role_list.totalDocs,
              recordsFiltered: res.role_list.totalDocs,
              data: res.role_list.docs,
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
          orderable: false,
        },
        {
          render: function (data, type, full, meta) {
            var btnstatus = "";
            if (full.status == "active") {
              btnstatus = 'on';
            } else {
              btnstatus = 'off';
            }

            return `<div class="br-toggle br-toggle-rounded br-toggle-primary ` + btnstatus + `" id="changeStatusButton">\
                      <div class="br-toggle-switch"></div>\
                    </div>`;
          },
          className: 'text-center',
          orderable: true,
          name: 'status',
        },
        {
          render: function (data, type, full, meta) {
            if (full.approve == "yes") {
              return `<span class="badge badge-success">Approved</span>`
            } else {
              return `<button class="btn btn-sm btn-primary" id="approveButton">Approve Now</button>`
            }
          },
          className: 'text-center',
          orderable: true,
          name: 'approve',
        },
        {
          render: function (data, type, full, meta) {
            return `<button class="btn btn-primary btn-icon mx-1" data-toggle="tooltip" data-placement="top" title="Edit" id="editButton-` + meta.row + `">
                        <div style="width:25px; height:25px;"><i class="fa fa-pen"></i></div>
                    </button>`;
          },
          className: 'text-center',
          orderable: false,
        },
        {
          render: function (data, type, full, meta) {
            return full.role_name;
          },
          orderable: true,
          name: 'role_name'
        },
        // {
        //   render: function (data, type, full, meta) {
        //     return full.role_id_name;
        //   }
        // },
      ],
      drawCallback: function (settings) {
        Global.loadCustomScripts('customJsScript');
      },
      rowCallback: (row: Node, data: any[] | Object, index: number) => {
        const self = this;
        $("table").on('click', '#editButton-' + index, function () {
          self.getEdit(data);
        });

        $('#changeStatusButton', row).bind('click', () => {
          self.changeStatus(data);
        });

        $('#approveButton', row).bind('click', () => {
          self.approve(data);
        });
        return row;
      },
      pagingType: 'full_numbers',
      serverSide: true,
      processing: true,
      ordering: true,
      searching: true,
      pageLength: Global.DataTableLength,
      lengthChange: true, lengthMenu: Global.DataTableLengthChangeMenu,
      responsive: true,
      order: [],
      language: {
        searchPlaceholder: 'Search...',
        search: ""
      },
    };
  }

  changeStatus(item: any) {
    this.adminService.changeRoleStatus({
      'role_id': item._id,
      'status': (item.status == "active") ? 'inactive' : 'active',
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

  approve(item: any) {
    swal.fire({
      title: 'Are you sure want to approve?',
      text: 'You will not be able to reserve this action!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, approve it!',
      cancelButtonText: 'No, cancel it'
    }).then((result) => {
      if (result.value) {
        this.adminService.approveReseller({
          'approve': "yes",
          'role_id': item._id,
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
          'Data not updated :)',
          'error'
        )
      }
    })
  }

  create(event: any) {
    if (this.roleForm.valid) {
      event.target.classList.add('btn-loading');

      let modules = this.getSelecteModules();
      let role_id_name = this.roleForm.value.role_name.split(' ').join('').toLowerCase();
      let role_status = ($('.role-status-name').hasClass('on') == true) ? 'active' : 'inactive'

      this.adminService.createRole({
        'role_name': this.roleForm.value.role_name,
        'role_activity': this.roleForm.value.role_activity,
        'role_id_name': role_id_name,
        'status': role_status,
        'modules': modules,
        'approve': 'no',
      }).subscribe(res => {
        if (res.status == 'success') {
          this.toastr.success(res.message);
          this.roleForm.reset();
          this.resetSelectedModules();
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

  getEdit(item: any) {
    this.editActionId = item._id;
    this.roleForm.setValue({
      role_name: item.role_name,
      role_activity: (item.role_activity) ? item.role_activity : "",
    });

    this.checkModulesforEdit(item.modules);

    if (item.status == 'active') { $('.role-status-name').addClass("on"); }
    else { $('.role-status-name').removeClass("on"); }

    $('html, body').animate({
      'scrollTop': $("#role-submit-section").position().top
    });
  }

  cancelEdit() {
    this.editActionId = '';
    this.roleForm.reset();
    this.resetSelectedModules();
  }

  update(event: any) {
    if (this.roleForm.valid) {
      event.target.classList.add('btn-loading');

      let modules = this.getSelecteModules();
      let role_status = ($('.role-status-name').hasClass('on') == true) ? 'active' : 'inactive'

      this.adminService.updateRole({
        'role_name': this.roleForm.value.role_name,
        'role_activity': this.roleForm.value.role_activity,
        'role_id': this.editActionId,
        'status': role_status,
        'modules': modules,
        'approve': 'no',
      }).subscribe(res => {
        if (res.status == 'success') {
          this.toastr.success(res.message);
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

  getSelecteModules() {
    const modules: any = {}
    this.permissions.forEach(element => {
      const access: any = [];

      $('input[name="modules[' + element.module_id_name + ']"]:checked').each(function () {
        access.push($(this).val())
      });

      modules[element.module_id_name] = access;
    });

    return JSON.stringify(modules);
  }

  resetSelectedModules() {
    this.permissions.forEach(element => {
      $('input[name="modules[' + element.module_id_name + ']"]:checked').each(function () {
        $(this).prop('checked', false)
      });
    });

    $('.role-status-name').addClass("on");
    this.moduleCheckboxChanged()
  }

  checkModulesforEdit(modules: any) {
    this.resetSelectedModules();

    for (const key in modules) {
      if (Object.prototype.hasOwnProperty.call(modules, key)) {
        const element = modules[key];
        if (Array.isArray(element)) {
          element.forEach((access: any) => {
            $('input[name="modules[' + key + ']"][value="' + access + '"]').prop('checked', true);
          });
        }
      }
    }

    this.moduleCheckboxChanged();
  }

  moduleCheckboxChanged(event: any = null, type: any = null, module: any = null) {
    switch (type) {
      case 'selectall':
        this.permissions.forEach(element => {
          $('input[name="modules[' + element.module_id_name + ']"]').each(function () {
            $(this).prop('checked', event.target.checked)
          });
        });
        break;

      case 'selectmodule':
        $('input[name="modules[' + module + ']"]').each(function () {
          $(this).prop('checked', event.target.checked)
        });
        break;
    }

    /** Enable VIEW permission always for ['add', 'edit', 'delete'] */
    this.permissions.forEach(element => {
      $('input[name="modules[' + element.module_id_name + ']"]').each(function () {
        let currentOperation: any = $(this).val();
        if ($(this).prop('checked') == true && ['add', 'edit', 'delete'].includes(currentOperation)) {
          $('input[name="modules[' + element.module_id_name + ']"][value="' + 'view' + '"]').prop('checked', true);
        }
      });
    })

    let selectAllChecked = true;
    this.permissions.forEach(element => {
      let moduleAllChecked = true;
      $('input[name="modules[' + element.module_id_name + ']"]').each(function () {
        if ($(this).prop('checked') == false) {
          selectAllChecked = false;
          moduleAllChecked = false;
        }
      });

      $('#module-' + element.module_id_name + '-select').prop('checked', moduleAllChecked);
    });

    $('#module-all-select').prop('checked', selectAllChecked);
  }
}
