import { DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { disableDebugTools, Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { AppComponent } from 'src/app/app.component';
import * as Global from 'src/app/globals';
import { AdminService } from 'src/app/services/admin.service';
import { SubadminService } from 'src/app/services/subadmin.service';
import swal from 'sweetalert2';

@Component({
  selector: 'subadmin-app-clientpackages',
  templateUrl: './clientpackages.component.html',
  styleUrls: ['./clientpackages.component.css']
})
export class SADClientpackagesComponent implements OnInit {
  dtOptions: DataTables.Settings = {};
  packageForm: UntypedFormGroup;
  editActionId: String;
  pfRulesMaster: any;
  gratuityRulesMaster: any;
  esicRulesMaster: any;
  permissionMaster: any;

  constructor(
    public formBuilder: UntypedFormBuilder,
    private titleService: Title,
    private toastr: ToastrService,
    private router: Router,
    private subadminService: SubadminService,
    private spinner: NgxSpinnerService,
    public AppComponent: AppComponent
  ) {
    this.pfRulesMaster = [
      { 'id': 'default', 'description': 'Default PF Rule' },
      { 'id': 'customizable', 'description': 'Customizable PF Rule' },
      { 'id': 'na', 'description': 'Not Applicable' },
    ];

    this.gratuityRulesMaster = [
      { 'id': 'default', 'description': 'Default Gratuity Rule' },
      { 'id': 'customizable', 'description': 'Customizable Gratuity Rule' },
      { 'id': 'na', 'description': 'Not Applicable' },
    ];

    this.esicRulesMaster = [
      { 'id': 'default', 'description': 'Default ESIC Rule' },
      { 'id': 'customizable', 'description': 'Customizable ESIC Rule' },
      { 'id': 'na', 'description': 'Not Applicable' },
    ];

    this.permissionMaster = [];

    this.packageForm = formBuilder.group({
      package_name: [null, Validators.compose([Validators.required])],
      gratuity_rule: [null, Validators.compose([Validators.required])],
      pf_rule: [null, Validators.compose([Validators.required])],
      esic_rule: [null, Validators.compose([Validators.required])],
    });

    this.editActionId = '';
  }

  ngOnInit() {
    this.titleService.setTitle("Client Package - " + Global.AppName);

    if (this.AppComponent.checkModulePermission('subadmin', 'client_package_master', 'view')) {
      this.fetch();
    }

    if (this.AppComponent.checkModulePermission('subadmin', 'client_package_master', ['add', 'edit'])) {
      this.fetchPermissions();
    }
  }

  fetchPermissions() {
    this.spinner.show();

    this.subadminService.fetchPackagePermissionList()
      .subscribe(res => {
        if (res.status == "success") {
          this.permissionMaster = res.package_option
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
        this.subadminService.fetchClientPackages({
          'pageno': Math.floor((dataTablesParameters.start + dataTablesParameters.length) / dataTablesParameters.length), 'perpage': dataTablesParameters.length,
          'searchkey': dataTablesParameters.search.value
        }).subscribe(res => {
          if (res.status == 'success') {
            callback({
              recordsTotal: res.package_list.totalDocs,
              recordsFiltered: res.package_list.totalDocs,
              data: res.package_list.docs,
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
          render: function (data, type, full, meta: any) {
            return meta.settings._iDisplayStart + (meta.row + 1)
          }
        },
        {
          render: function (data, type, full, meta) {
            return full.package_name;
          }
        },
        {
          render: function (data, type, full, meta) {
            var datePipe = new DatePipe("en-US");
            let value = datePipe.transform(full.created_at, 'dd/MM/yyyy');
            return value;
          }
        },
        {
          render: function (data, type, full, meta) {
            let html = ``;
            let flag: boolean = false;

            if (Global.checkModulePermission('subadmin', 'client_package_master', 'edit')) {
              html += `<button class="btn btn-primary btn-icon mg-5" id="editButton-` + meta.row + `">
                  <div style="width:25px; height:25px;"><i class="fa fa-pen"></i></div>
              </button>`

              flag = true;
            }

            if (Global.checkModulePermission('subadmin', 'client_package_master', 'delete')) {
              html += `<button class="btn btn-danger btn-icon mg-5" id="deleteButton-`+ meta.row + `">
                  <div style="width:25px; height:25px;"><i class="fa fa-trash"></i></div>
              </button>`

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

        $("table").on('click', '#deleteButton-' + index, function () {
          self.deleteItem(data);
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

  getEdit(item: any) {
    if (!this.AppComponent.checkModulePermission('subadmin', 'client_package_master', 'edit')) {
      this.toastr.error("Permission not granted.");
      return;
    }

    this.editActionId = item._id;

    this.checkPermissionsforEdit(item.permission[0]);

    this.packageForm.setValue({
      package_name: item.package_name,

      gratuity_rule: this.gratuityRulesMaster.find((obj: any) => {
        return obj.id === item.gratuity_rule
      }),

      pf_rule: this.pfRulesMaster.find((obj: any) => {
        return obj.id === item.pf_rule
      }),

      esic_rule: this.esicRulesMaster.find((obj: any) => {
        return obj.id === item.esic_rule
      }),
    });

    setTimeout(function () {
      $('html, body').animate({
        'scrollTop': $("#clientpackage-submit-section").position().top
      });
    }, 10);
  }

  cancelEdit() {
    this.editActionId = '';
    this.packageForm.reset();
    this.resetSelectedPermissions();
    this.permissionCheckboxChanged();
  }

  create(event: any) {
    if (this.packageForm.valid) {
      let permission = this.getSelectedPermissions();
      if (Object.keys(permission).length < 1) {
        this.toastr.error("You need to select atleast one permission for submitting");
        return;
      }

      event.target.classList.add('btn-loading');

      this.subadminService.createClientPackage({
        'package_name': this.packageForm.value.package_name,
        'gratuity_rule': this.packageForm.value.gratuity_rule.id,
        'pf_rule': this.packageForm.value.pf_rule.id,
        'esic_rule': this.packageForm.value.esic_rule.id,
        'permission': JSON.stringify(permission),
      }).subscribe(res => {
        if (res.status == 'success') {
          this.toastr.success(res.message);
          this.packageForm.reset();
          this.resetSelectedPermissions();

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

  deleteItem(item: any) {
    if (!this.AppComponent.checkModulePermission('subadmin', 'client_package_master', 'delete')) {
      this.toastr.error("Permission not granted.");
      return;
    }

    swal.fire({
      title: 'Are you sure want to remove?',
      text: 'You will not be able to recover this data!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'No, keep it'
    }).then((result) => {
      if (result.value) {
        this.subadminService.deleteClientPackage({
          'package_id': item._id,
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
    if (this.packageForm.valid) {
      let permission = this.getSelectedPermissions();
      if (Object.keys(permission).length < 1) {
        this.toastr.error("You need to select atleast one permission for submitting");
        return;
      }

      event.target.classList.add('btn-loading');

      this.subadminService.updateClientPackage({
        'package_id': this.editActionId,
        'package_name': this.packageForm.value.package_name,
        'gratuity_rule': this.packageForm.value.gratuity_rule.id,
        'pf_rule': this.packageForm.value.pf_rule.id,
        'esic_rule': this.packageForm.value.esic_rule.id,
        'permission': JSON.stringify(permission),
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

  getSelectedPermissions() {
    const permission: any = {}
    this.permissionMaster.forEach((element: any) => {
      const access: any = [];

      $('input[name="permission[' + element._id + ']"]:checked').each(function () {
        access.push($(this).val())
      });

      if (access.length > 0) {
        permission[element._id] = access;
      }
    });

    return permission;
  }

  resetSelectedPermissions() {
    this.permissionMaster.forEach((element: any) => {
      $('input[name="permission[' + element._id + ']"]:checked').each(function () {
        $(this).prop('checked', false)
      });
    });
  }

  checkPermissionsforEdit(permissions: any) {
    this.resetSelectedPermissions();

    for (const key in permissions) {
      if (Object.prototype.hasOwnProperty.call(permissions, key)) {
        const element = permissions[key];
        // console.log(element);
        if (Array.isArray(element)) {
          element.forEach((access: any) => {
            $('input[name="permission[' + key + ']"][value="' + access + '"]').prop('checked', true);
          });
        }
      }
    }

    this.permissionCheckboxChanged();
  }

  permissionCheckboxChanged(event: any = null, type: any = null, _id: any = null) {
    switch (type) {
      case 'selectpermission':
        $('input[name="permission[' + _id + ']"]').each(function () {
          $(this).prop('checked', event.target.checked)
        });
        break;
    }

    this.permissionMaster.forEach((element: any) => {
      let permissionAllChecked = true;
      $('input[name="permission[' + element._id + ']"]').each(function () {
        if ($(this).prop('checked') == false) {
          permissionAllChecked = false;
        }
      });

      $('#permission-' + element._id + '-select').prop('checked', permissionAllChecked);
    });
  }
}
