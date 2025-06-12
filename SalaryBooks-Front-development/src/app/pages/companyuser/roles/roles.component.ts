import { Component, OnInit } from '@angular/core';
import {
  FormArray,
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { AppComponent } from 'src/app/app.component';
import * as Global from 'src/app/globals';
import { CompanyuserService } from 'src/app/services/companyuser.service';
import swal from 'sweetalert2';
import { _rolesManagmentMaster } from '../report/_rolesManagmentMaster';
@Component({
  selector: 'companyuser-app-roles',
  templateUrl: './roles.component.html',
  styleUrls: ['./roles.component.css'],
})
export class CMPRolesComponent implements OnInit {
  dtOptions: DataTables.Settings = {};
  roleForm: UntypedFormGroup;
  permissions: any[];
  editActionId: String;
  rolesTemp: typeof _rolesManagmentMaster = _rolesManagmentMaster;
  company_module_name: String = 'role_management';
  Global = Global
  constructor(
    public formBuilder: UntypedFormBuilder,
    private titleService: Title,
    private companyuserService: CompanyuserService,
    private toastr: ToastrService,
    private spinner: NgxSpinnerService,
    public AppComponent: AppComponent,
    private router: Router
  ) {
    this.roleForm = formBuilder.group({
      role_name: [null, Validators.compose([Validators.required])],
      role_activity: [null, Validators.compose([Validators.required])],
    });

    this.permissions = [];
    this.editActionId = '';

    if (
      JSON.parse(localStorage.getItem('payroll-companyuser-user') as any)
        ?.user_type == 'staff'
    ) {
      this.company_module_name = 'sub_admin';
    }
  }

  ngOnInit(): void {
    this.titleService.setTitle('Roles - ' + Global.AppName);

    if (
      Global.checkCompanyModulePermission({
        company_module: this.company_module_name,
        company_operation: 'role_management',
        company_sub_module: 'role_&_rights',
        company_sub_operation: ['view'],
      })
    ) {
      this.fetchPermissions();
    }

    if (
      Global.checkCompanyModulePermission({
        company_module: this.company_module_name,
        company_operation: 'role_management',
        company_sub_module: 'role_&_rights',
        company_sub_operation: ['view'],
      })
    ) {
      this.fetch();
    }

    if (
      !this.AppComponent.checkCompanyModulePermission({
        company_module: this.company_module_name,
        company_operation: 'role_management',
        company_sub_module: 'role_&_rights',
        company_sub_operation: ['view'],
      })
    ) {
      setTimeout(() => {
        this.router.navigate(['company/errors/unauthorized-access'], {
          skipLocationChange: true,
        });
      }, 500);
      return;
    }
  }

  fetchPermissions() {
    this.spinner.show();

    this.companyuserService.fetchPermissions({}).subscribe(
      (res) => {
        if (res.status == 'success') {
          this.permissions = this.filterModuleList(res.module_list);
          // this.permissions = ;
          // this.permissions = this.permissions.sort((a, b) => (a.module_name > b.module_name ? -1 : 1))
          // console.log(this.permissions);

          // this.permissions.forEach((permission:any)=>{
          //   if(permission.modules.length){
          //   }
          // })
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

  fetch() {
    this.dtOptions = {
      ajax: (dataTablesParameters: any, callback) => {
        this.companyuserService
          .fetchRoles({
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
                // let doc = res.role_list?.docs?.find((d:any) => d._id == '65266f7ef1b9e2a872f63a1b')
                // this.getEdit(doc)
                callback({
                  recordsTotal: res.role_list.totalDocs,
                  recordsFiltered: res.role_list.totalDocs,
                  data: res.role_list.docs,
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

            if(
              Global.checkCompanyModulePermission({
              company_module: 'sub_admin',
              company_operation: 'role_management',
              company_sub_module: 'role_&_rights',
              company_sub_operation: ['edit'],
              company_strict: true,
            })){
              return (
                `<div class="br-toggle br-toggle-rounded br-toggle-primary ` +
                btnstatus +
                `" id="changeStatusButton">\
                        <div class="br-toggle-switch"></div>\
                      </div>`
              );
            }else{
              
              return `<p style="text-transform: capitalize;">${full.status}</p>`;

            }
          },
          className: 'text-center',
          orderable: true,
          name: 'status',
        },
        {
          render: function (data, type, full, meta) {
            if (full.approve == 'yes') {
              return `<span class="badge badge-success">Approved</span>`;
            } else if(Global.checkCompanyModulePermission({
              company_module: 'sub_admin',
              company_operation: 'role_management',
              company_sub_module: 'role_&_rights',
              company_sub_operation: ['edit'],
              company_strict: true,
            })){
              return `<button class="btn btn-sm btn-primary" id="approveButton">Approve Now</button>`;
            }else{
              return `<p class="badge badge-secondary px-3 py-2 rounded-20" style="font-size: 13px; padding: 9px 15px;">Pending</p>`;

            }
          },
          className: 'text-center',
          orderable: true,
          name: 'approve',
        },
        {
          render: function (data, type, full, meta) {
            let html = ``;
            let flag: boolean = false;

            if (
              Global.checkCompanyModulePermission({
                company_module: 'sub_admin',
                company_operation: 'role_management',
                company_sub_module: 'role_&_rights',
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

              flag = true;
            }

            if (flag) return html;
            else return '-';
          },
          className: 'text-center',
          orderable: false,
        },
        {
          render: function (data, type, full, meta) {
            return full.role_name;
          },
          orderable: true,
          name: 'role_name',
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
        $('table').on('click', '#editButton-' + index, function () {
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
      lengthChange: true,
      lengthMenu: Global.DataTableLengthChangeMenu,
      responsive: true,
      order: [],
      language: {
        searchPlaceholder: 'Search...',
        search: '',
      },
    };
  }

  changeStatus(item: any) {
    // if (
    //   !Global.checkCompanyModulePermission({
    //     staff_module: 'role',
    //     staff_operation: ['edit'],
    //     company_strict: true,
    //   })
    // ) {
    //   // this.toastr.error("Permission not granted.");
    //   return;
    // }

    this.companyuserService
      .changeRoleStatus({
        role_id: item._id,
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

  approve(item: any) {
    swal
      .fire({
        title: 'Are you sure want to approve?',
        text: 'You will not be able to reserve this action!',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, approve it!',
        cancelButtonText: 'No, cancel it',
      })
      .then((result) => {
        if (result.value) {
          this.companyuserService
            .approveRole({
              approve: 'yes',
              role_id: item._id,
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
          swal.fire('Cancelled', 'Data not updated :)', 'error');
        }
      });
  }

  create(event: any) {
    if (this.roleForm.valid) {
      event.target.classList.add('btn-loading');

      let modules = this.getSelecteModules();
      let role_id_name = this.roleForm.value.role_name
        .split(' ')
        .join('')
        .toLowerCase();
      let role_status =
        $('.role-status-name').hasClass('on') == true ? 'active' : 'inactive';

      this.companyuserService
        .createRole({
          role_name: this.roleForm.value.role_name,
          role_activity: this.roleForm.value.role_activity,
          role_id_name: role_id_name,
          status: role_status,
          modules: modules,
          approve: 'no',
        })
        .subscribe(
          (res) => {
            if (res.status == 'success') {
              this.toastr.success(res.message);
              this.roleForm.reset();
              this.resetSelectedModules();
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

  getEdit(item: any) {
    this.editActionId = item._id;
    this.roleForm.setValue({
      role_name: item.role_name,
      role_activity: item.role_activity ? item.role_activity : '',
    });

    this.checkModulesforEdit(item.modules);

    if (item.status == 'active') {
      $('.role-status-name').addClass('on');
    } else {
      $('.role-status-name').removeClass('on');
    }

    $('html, body').animate({
      scrollTop: $('#role-submit-section').position().top,
    });
  }

  cancelEdit() {
    this.editActionId = '';
    this.roleForm.reset();
    this.resetSelectedModules();
  }

  update(event: any) {
    try {
      if (this.roleForm.valid) {
        event.target.classList.add('btn-loading');

        let modules = this.getSelecteModules();
        let role_status =
          $('.role-status-name').hasClass('on') == true ? 'active' : 'inactive';

        this.companyuserService
          .updateRole({
            role_name: this.roleForm.value.role_name,
            role_activity: this.roleForm.value.role_activity,
            role_id: this.editActionId,
            status: role_status,
            modules: modules,
            approve: 'no',
          })
          .subscribe(
            (res) => {
              if (res.status == 'success') {
                this.toastr.success(res.message);
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
    } catch (err: any) {
      this.toastr.error(err);
    }
  }

  getSelecteModules() {
    try {
      const modules: any = {};
      this.permissions.forEach((element) => {
        element.modules.forEach((module: any) => {
          const access: any = [];
          // $(`input[name="modules[${element.slug}_${module.module_slug}]"]:checked`).each(function () {
          //   access.push($(this).val())
          // });
          document
            .getElementsByName(`modules[${element.slug}_${module.module_slug}]`)
            .forEach((cb: any) => {
              if (cb.checked) {
                access.push(cb.value);
              }
              // modules;
            });
          if (modules[element.slug]) {
            modules[element.slug] = modules[element.slug];
          } else {
            modules[element.slug] = [];
          }
          modules[element.slug].push({ [module.module_slug]: access });
        });
      });

      return JSON.stringify(modules);
    } catch (err) {
      throw err;
    }
  }

  resetSelectedModules() {
    this.permissions.forEach((element) => {
      element.modules.forEach((module: any) => {
        $(`input[name="modules[${element.slug}_${module.module_slug}]"]`).each(
          function () {
            $(this).prop('checked', false);
          }
        );
      });
    });
    // this.permissions.forEach(element => {
    //   $('input[name="modules[' + element.slug + ']"]:checked').each(function () {
    //     $(this).prop('checked', false)
    //   });
    // });

    $('.role-status-name').addClass('on');
    this.moduleCheckboxChanged();
  }

  checkModulesforEdit(table: any) {
    this.resetSelectedModules();
    // let table = modules
    this.permissions.forEach((permission) => {
      if (Array.isArray(table[permission.slug])) {
        table[permission.slug].forEach((modules: any) => {
          permission.modules.forEach((m: any) => {
            if (Array.isArray(modules[m.module_slug])) {
              modules[m.module_slug].forEach((k: any) => {
                $(
                  `input[name="modules[${permission.slug}_${m.module_slug}]"][value="${k}"]`
                ).prop('checked', true);
              });
            }
          });
        });
      }
    });
    // for (const key in modules) {
    //   if (Object.prototype.hasOwnProperty.call(modules, key)) {
    //     const element = modules[key];
    //     if (Array.isArray(element)) {
    //       let module_names =
    //       element.forEach((el: any) => {
    //         el.forEach((el:any) =>{
    //           $('input[name="modules[' + key + ']"][value="' + el + '"]').prop('checked', true);
    //         });
    //         })
    //     }
    //   }
    // }

    // this.moduleCheckboxChanged();
  }

  moduleCheckboxChanged(
    event: any = null,
    type: any = null,
    module: any = null
  ) {
    switch (type) {
      case 'selectall':
        this.permissions.forEach((element) => {
          element.modules.forEach((module: any) => {
            $(
              `input[name="modules[${element.slug}_${module.module_slug}]"]`
            ).each(function () {
              $(this).prop('checked', event.target.checked);
            });
          });
        });
        break;

      case 'selectmodule':
        module?.modules.forEach((el: any) => {
          {
            $(`input[name="modules[${module.slug}_${el.module_slug}]"]`).each(
              function () {
                $(this).prop('checked', event.target.checked);
              }
            );
          }
        });
        break;
      case 'selectByValue':
        this.permissions.forEach((element) => {
          // element.modules.forEach((module:any) =>{
          //   $(`input[name="modules[${element.slug}_${module.module_slug}]"]`).each(function () {
          //     $(this).prop('checked', event.target.checked)
          //   });
          // })
        });
        // module?.modules.forEach((el:any) =>{{
        //   $(`input[name="modules[${module.slug}_${el.module_slug}]"]`).each(function () {
        //     $(this).prop('checked', event.target.checked)
        //   });
        // }})
        break;
    }

    /** Enable VIEW permission always for ['add', 'edit', 'delete'] */
    // this.permissions.forEach(element => {
    //   $('input[name="modules[' + element.slug + ']"]').each(function () {
    //     let currentOperation: any = $(this).val();
    //     if ($(this).prop('checked') == true && ['add', 'edit', 'delete'].includes(currentOperation)) {
    //       $('input[name="modules[' + element.slug + ']"][value="' + 'view' + '"]').prop('checked', true);
    //     }
    //   });
    // })

    // let selectAllChecked = true;
    // this.permissions.forEach(element => {
    //   let moduleAllChecked = true;
    //   $('input[name="modules[' + element.slug + ']"]').each(function () {
    //     if ($(this).prop('checked') == false) {
    //       selectAllChecked = false;
    //       moduleAllChecked = false;
    //     }
    //   });

    //   $('#module-' + element.slug + '-select').prop('checked', moduleAllChecked);
    // });

    // $(`#${event.target.id}`).prop('checked', selectAllChecked);
  }

  filterModuleList(permissions: any[]) {
    let user_data = JSON.parse(
      localStorage.getItem('payroll-companyuser-user') as any
    );

    let user_package = JSON.parse(
      localStorage.getItem('payroll-companyuser-permission') as any
    )[0];

    return this.rolesTemp?.map((role) => {
      let permission = permissions.find((p) => p.slug == role.slug);
      if (user_data?.user_type == 'company') {
        if (role.package_slug !== '') {
          permission.modules = role?.modules?.filter((m: any) => {
            if (role.slug == 'government_rules') {
              if (user_package[m.package_module_slug]?.rule_apply == 'yes') {
                return m;
              }
            } else if (
              user_package?.module[role?.package_slug]?.includes(
                m?.package_module_slug
              )
            ) {
              return m;
            }
          });
        }

        if (permission.slug == 'government_rules') {
        }
      } else {
        const formatedRole= role?.modules?.map((m: any) => {
          let obj:any = null;
          if (user_package?.modules[role?.slug]) {
            user_package?.modules[role?.slug]?.forEach((rm: any) => {
              if (rm[m.module_slug] && rm[m.module_slug]?.length)  {
                obj = {}
                obj['access'] = rm[m.module_slug] ;
                obj['module_name'] = m.module_name;
                obj['module_slug'] =  m?.module_slug
                obj['package_module_name'] =  m?.package_module_name
                obj['package_module_slug'] =  m?.package_module_slug
              }
            });
          }
          return obj
        }).filter((m:any) => m !== null)

        permission.modules = formatedRole;
      }

      // if(permission.slug == 'government_rules'){
      //   for (let i = 0; i < permission.module.length; i++) {
      //     const module = permission.module[i];
      //     switch (module.slug) {
      //       case 'pf_rules':
      //         let pf_rule = user_package.gov_pf_rule
      //         if(pf_rule.rule_apply == 'yes'){
      //           if(pf_rule.rule_type =='default'){
      //             module.access = ['view']
      //           }else{
      //             module.access = ['view', 'add', 'edit', 'delete']
      //           }
      //         }else{
      //           permission.module.splice(i, 1)
      //         }
      //         break;
      //       case 'esi_rules':
      //         let esi_rule = user_package.gov_esi_rule
      //         if(esi_rule.rule_apply == 'yes'){
      //           if(esi_rule.rule_type =='default'){
      //             module.access = ['view']
      //           }else{
      //             module.access = ['view', 'add', 'edit', 'delete']
      //           }
      //         }else{
      //           permission.module.splice(i, 1)
      //         }
      //         break;
      //       case 'bonus_rules':
      //         let bonus_rule = user_package.gov_bonus_rule
      //         if(bonus_rule.rule_apply == 'yes'){
      //           if(bonus_rule.rule_type =='default'){
      //             module.access = ['view']
      //           }else{
      //             module.access = ['view', 'add', 'edit', 'delete']
      //           }
      //         }else{
      //           permission.module.splice(i, 1)
      //         }
      //         break;
      //       case 'gratuity':
      //          let gratuity_rule = user_package.gov_gratuity_rule
      //         if(gratuity_rule.rule_apply == 'yes'){
      //           if(gratuity_rule.rule_type =='default'){
      //             module.access = ['view']
      //           }else{
      //             module.access = ['view', 'add', 'edit', 'delete']
      //           }
      //         }else{
      //           permission.module.splice(i, 1)
      //         }
      //         break;
      //       // case 'gratuity':
      //       //   let gratuity_rule = user_package.gov_esi_rule
      //       //   if(esi_rule.rule_apply == 'yes'){
      //       //     if(esi_rule.rule_type =='default'){
      //       //       module.access = ['view']
      //       //     }else{
      //       //       module.access = ['view', 'add', 'edit', 'delete']
      //       //     }
      //       //   }else{
      //       //     permission.module.splice(i, 1)
      //       //   }
      //       //   break;

      //       default:
      //         break;
      //     }
      //   }
      //   // permission = permission.modules.forEach((m:any) =>{
      //   //   switch (m.module_slug) {
      //   //     case 'pf_rules':
      //   //       if(){

      //   //       }
      //   //       break;
      //   //     case 'esi_rules':

      //   //       break;
      //   //     case 'bonus_rules':

      //   //       break;
      //   //     case 'gratuity':

      //   //       break;
      //   //     case 'gratuity':
      //   //       break;

      //   //     default:
      //   //       break;
      //   //   }
      //   // })
      // }
      if(user_data.user_type == 'company'){
        return permission
      }else{
        return permission?.modules?.length  ? permission : null;
      }
    }).filter((role:any) => role != null);
  }
}
