import { Component, OnInit } from '@angular/core';
import { FormArray, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { AppComponent } from 'src/app/app.component';
import * as Global from 'src/app/globals';
import { SubadminService } from 'src/app/services/subadmin.service';

@Component({
  selector: 'subadmin-app-roles',
  templateUrl: './roles.component.html',
  styleUrls: ['./roles.component.css']
})
export class SADRolesComponent implements OnInit {
  dtOptions: DataTables.Settings = {};
  roleForm: UntypedFormGroup;
  permissions: any[];
  editActionId: String;

  constructor(
    public formBuilder: UntypedFormBuilder,
    private titleService: Title,
    private subadminService: SubadminService,
    private toastr: ToastrService,
    private spinner: NgxSpinnerService,
    public AppComponent: AppComponent
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

    if (this.AppComponent.checkModulePermission('subadmin', 'role', ['add', 'edit'])) {
      this.fetchPermissions();
    }

    if (this.AppComponent.checkModulePermission('subadmin', 'role', 'view')) {
      this.fetch();
    }
  }

  fetchPermissions() {
    this.spinner.show();

    this.subadminService.fetchPermissions({})
      .subscribe(res => {
        if (res.status == 'success') {
          this.permissions = [];

          let module_list = res.module_list;
          module_list.forEach((module: any) => {
            let access_list: any = [];
            module.access.forEach((access: any) => {
              if (this.AppComponent.checkModulePermission('subadmin', module.module_id_name, access)) {
                access_list.push(access);
              }
            });

            if (access_list.length > 0) {
              module.access = access_list;
              this.permissions.push(module);
            }
          });
        } else {
          this.toastr.error(res.message);
        }
        this.spinner.hide();
      }, (err) => {
        this.toastr.error(Global.showServerErrorMessage(err));
        this.spinner.hide();
      });
  }

  fetch() {
    this.dtOptions = {
      ajax: (dataTablesParameters: any, callback) => {
        this.subadminService.fetchRoles({
          'pageno': Math.floor((dataTablesParameters.start + dataTablesParameters.length) / dataTablesParameters.length), 'perpage': dataTablesParameters.length,
          'searchkey': dataTablesParameters.search.value
        }).subscribe(res => {
          if (res.status == 'success') {
            callback({
              recordsTotal: res.role_list.totalDocs,
              recordsFiltered: res.role_list.totalDocs,
              data: res.role_list.docs,
            });
          } else {
            callback({
              recordsTotal: 0,
              recordsFiltered: 0,
              data: [],
            });

            this.toastr.error(res.message);
          }
        }, (err) => {
          callback({
            recordsTotal: 0,
            recordsFiltered: 0,
            data: [],
          });

          this.toastr.error(Global.showServerErrorMessage(err));
        });
      },
      columns: [
        {
          render: function (data, type, full, meta) {
            return full.role_name;
          }
        },
        {
          render: function (data, type, full, meta) {
            return full.role_id_name;
          }
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
          className: 'text-center'
        },
        {
          render: function (data, type, full, meta) {
            let html = ``;
            let flag: boolean = false;

            if (Global.checkModulePermission('subadmin', 'role', 'edit')) {
              html += `<button class="btn btn-primary btn-icon mg-5" id="editButton-` + meta.row + `">
                  <div style="width:25px; height:25px;"><i class="fa fa-pen"></i></div>
              </button>`;

              flag = true;
            }

            if (flag) return html;
            else return '-';
          },
          className: 'text-center'
        },
      ],
      rowCallback: (row: Node, data: any[] | Object, index: number) => {
        const self = this;
        $("table").on('click', '#editButton-' + index, function () {
          self.getEdit(data);
        });

        $('#changeStatusButton', row).bind('click', () => {
          self.changeStatus(data);
        });
        return row;
      },
      pagingType: 'full_numbers',
      serverSide: true,
      processing: true,
      ordering: false,
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
    if (!this.AppComponent.checkModulePermission('subadmin', 'role', 'edit')) {
      // this.toastr.error("Permission not granted.");
      return;
    }

    this.subadminService.changeRoleStatus({
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
      this.toastr.error(Global.showServerErrorMessage(err));
    });
  }

  create(event: any) {
    if (this.roleForm.valid) {
      event.target.classList.add('btn-loading');

      let modules = this.getSelecteModules();
      let role_id_name = this.roleForm.value.role_name.split(' ').join('').toLowerCase();
      let role_status = ($('.role-status-name').hasClass('on') == true) ? 'active' : 'inactive'

      this.subadminService.createRole({
        'role_name': this.roleForm.value.role_name,
        'role_activity': this.roleForm.value.role_activity,
        'role_id_name': role_id_name,
        'status': role_status,
        'modules': modules,
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
        this.toastr.error(Global.showServerErrorMessage(err));
      });
    }
  }

  getEdit(item: any) {
    if (!this.AppComponent.checkModulePermission('subadmin', 'role', 'edit')) {
      this.toastr.error("Permission not granted.");
      return;
    }

    this.editActionId = item._id;
    this.roleForm.setValue({
      role_name: item.role_name,
      role_activity: (item.role_activity) ? item.role_activity : "",
    });

    this.checkModulesforEdit(item.modules);

    if (item.status == 'active') { $('.role-status-name').addClass("on"); }
    else { $('.role-status-name').removeClass("on"); }

    setTimeout(function () {
      $('html, body').animate({
        'scrollTop': $("#role-submit-section").position().top
      });
    }, 10);
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

      this.subadminService.updateRole({
        'role_name': this.roleForm.value.role_name,
        'role_activity': this.roleForm.value.role_activity,
        'role_id': this.editActionId,
        'status': role_status,
        'modules': modules,
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
        this.toastr.error(Global.showServerErrorMessage(err));
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
