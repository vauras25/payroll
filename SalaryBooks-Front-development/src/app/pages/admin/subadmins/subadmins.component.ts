import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ToastrService } from 'ngx-toastr';
import { AdminService } from 'src/app/services/admin.service';
import * as Global from 'src/app/globals';
import swal from 'sweetalert2';
import { NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'admin-app-subadmins',
  templateUrl: './subadmins.component.html',
  styleUrls: ['./subadmins.component.css']
})
export class ADSubadminsComponent implements OnInit {
  dtOptions: DataTables.Settings = {};
  subAdminForm: UntypedFormGroup;
  filterForm: UntypedFormGroup;
  changePasswordForm: UntypedFormGroup;
  designationMaster: any[];
  departmentMaster: any[];
  branchMaster: any[];
  hodMaster: any[];
  roleMaster: any[];
  editActionId: String;

  constructor(
    public formBuilder: UntypedFormBuilder,
    private titleService: Title,
    private adminService: AdminService,
    private toastr: ToastrService,
    private spinner: NgxSpinnerService
  ) {
    this.designationMaster = [];
    this.departmentMaster = [];
    this.branchMaster = [];
    this.roleMaster = [];
    this.hodMaster = [];
    this.editActionId = '';

    this.subAdminForm = formBuilder.group({
      "first_name": [null, Validators.compose([Validators.required])],
      "last_name": [null, Validators.compose([Validators.required])],
      "email_id": [null, Validators.compose([Validators.required, Validators.email])],
      "userid": [null, Validators.compose([Validators.required])],
      "password": [null, Validators.compose([Validators.required])],
      "password_confirmation": [null, Validators.compose([Validators.required])],
      "phone_no": [null, Validators.compose([Validators.required, Validators.minLength(10), Validators.maxLength(10)])],
      "is_hod": [null, Validators.compose([Validators.required])],
      "hod_id": [null, Validators.compose([Validators.required])],
      "designation_id": [null, Validators.compose([Validators.required])],
      "branch_id": [null, Validators.compose([Validators.required])],
      "department_id": [null, Validators.compose([Validators.required])],
    });

    this.changePasswordForm = formBuilder.group({
      "user_id": [null, Validators.compose([Validators.required])],
      "password": [null, Validators.compose([Validators.required])],
      "password_confirmation": [null, Validators.compose([Validators.required])],
    });

    this.filterForm = formBuilder.group({
      "first_name": [null],
      "last_name": [null],
      "email_id": [null],
      "phone_no": [null],
      "designation": [null],
      "department": [null],
      "designation_id": [null],
      "department_id": [null],
    });

    this.fetchMasters();
    this.fetch();
  }

  ngOnInit(): void {
    this.titleService.setTitle("Sub Admin - " + Global.AppName);
  }

  fetchMasters() {
    this.spinner.show();

    this.adminService.fetchSubAdminPageMasters()
      .subscribe(res => {
        if (res.status == "success") {
          this.roleMaster = [];
          for (const key in res.masters.roles) {
            if (Object.prototype.hasOwnProperty.call(res.masters.roles, key)) {
              const element = res.masters.roles[key];
              this.roleMaster.push({ "id": element._id, "description": element.role_name });
            }
          }

          this.designationMaster = [];
          for (const key in res.masters.designation) {
            if (Object.prototype.hasOwnProperty.call(res.masters.designation, key)) {
              const element = res.masters.designation[key];
              this.designationMaster.push({ "id": element._id, "description": element.designation_name });
            }
          }

          this.departmentMaster = [];
          for (const key in res.masters.department) {
            if (Object.prototype.hasOwnProperty.call(res.masters.department, key)) {
              const element = res.masters.department[key];
              this.departmentMaster.push({ "id": element._id, "description": element.department_name });
            }
          }

          this.branchMaster = [];
          for (const key in res.masters.branch) {
            if (Object.prototype.hasOwnProperty.call(res.masters.branch, key)) {
              const element = res.masters.branch[key];
              this.branchMaster.push({ "id": element._id, "description": element.branch_name });
            }
          }

          this.hodMaster = [];
          for (const key in res.masters.hod) {
            if (Object.prototype.hasOwnProperty.call(res.masters.hod, key)) {
              const element = res.masters.hod[key];
              this.hodMaster.push({ "id": element._id, "description": element.first_name + ' ' + element.last_name });
            }
          }
        } else {
          this.toastr.error(res.message);
        }

        this.spinner.hide();
      }, (err) => {
        this.toastr.error("Internal server error occured. Please try again later.");
        this.spinner.hide();
      });
  }

  create(event: any) {
    if (this.subAdminForm.valid) {
      let subAdminRoles = this.getSelectedRoles();
      if (subAdminRoles.length < 0) {
        this.toastr.error("Please assign atleast one Role to continue");
        return;
      }

      if (this.subAdminForm.value.password != this.subAdminForm.value.password_confirmation) {
        this.toastr.error("Password confirmation doesnot matched");
        return;
      }

      event.target.classList.add('btn-loading');

      this.adminService.createSubAdmin({
        'first_name': this.subAdminForm.value.first_name,
        'last_name': this.subAdminForm.value.last_name,
        'email_id': this.subAdminForm.value.email_id,
        'userid': this.subAdminForm.value.userid,
        'password': this.subAdminForm.value.password,
        'phone_no': this.subAdminForm.value.phone_no,
        'is_hod': this.subAdminForm.value.is_hod,
        'hod_id': this.subAdminForm.value.hod_id.id,
        'designation_id': this.subAdminForm.value.designation_id.id,
        'branch_id': this.subAdminForm.value.branch_id.id,
        'department_id': this.subAdminForm.value.department_id.id,
        'roles[]': JSON.stringify(subAdminRoles),
      }).subscribe(res => {
        if (res.status == 'success') {
          swal.fire({
            title: 'Account Created Successfully',
            html: '<h4 class="text-uppercase">Login Credentials</h4>\
            <p class="m-1">Email: <b>'+ this.subAdminForm.value.email_id + '</b></p>\
            <p>Password: <b>' + this.subAdminForm.value.password + '</b></p>',
            icon: 'success',
            confirmButtonText: 'OKAY',
          })

          $('#my-datatable').dataTable().api().ajax.reload(function (json) { }, false);
          this.cancelEntry();
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

  fetch() {
    this.dtOptions = {
      ajax: (dataTablesParameters: any, callback) => {
        if (dataTablesParameters.search.value != "") {
          this.resetDataTableFilter();
        }

        this.adminService.fetchSubAdmins({
          'pageno': Math.floor((dataTablesParameters.start + dataTablesParameters.length) / dataTablesParameters.length), 'perpage': dataTablesParameters.length,
          'searchkey': dataTablesParameters.search.value,
          'first_name': this.filterForm.value.first_name,
          'last_name': this.filterForm.value.last_name,
          'email_id': this.filterForm.value.email_id,
          'phone_no': this.filterForm.value.phone_no,
          'designation_id': this.filterForm.value.designation_id,
          'department_id': this.filterForm.value.department_id,
          'sortbyfield': Global.getTableSortingOptions('sortbyfield', dataTablesParameters),
          'ascdesc': Global.getTableSortingOptions('ascdesc', dataTablesParameters)
        }).subscribe(res => {
          if (res.status == 'success') {
            callback({
              recordsTotal: res.subadmin.totalDocs,
              recordsFiltered: res.subadmin.totalDocs,
              data: res.subadmin.docs,
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
          render: function (data, type, full, meta) {
            return (full.userid) ? full.userid : '-';
          },
          orderable: true,
          name: 'userid'
        },
        {
          render: function (data, type, full, meta) {
            return `<button class="btn btn-primary btn-icon mx-1" data-toggle="tooltip" data-placement="top" title="Edit" id="editButton-` + meta.row + `">
                        <div style="width:25px; height:25px;"><i class="fa fa-pen"></i></div>
                    </button>
                    <button class="btn btn-dark btn-icon mx-1" data-toggle="tooltip" data-placement="top" title="Change Password" id="changePassword-`+ meta.row + `">
                        <div style="width:25px; height:25px;"><i class="fa fa-lock"></i></div>
                    </button>
                    <button class="btn btn-danger btn-icon mx-1" data-toggle="tooltip" data-placement="top" title="Delete" id="deleteButton-`+ meta.row + `">
                        <div style="width:25px; height:25px;"><i class="fa fa-trash"></i></div>
                    </button>`;
          },
          className: 'text-center',
          orderable: false,
        },
        {
          render: function (data, type, full, meta) {
            return full.first_name;
          },
          orderable: true,
          name: 'first_name'
        },
        {
          render: function (data, type, full, meta) {
            return full.last_name;
          },
          orderable: true,
          name: 'last_name'
        },
        {
          render: function (data, type, full, meta) {
            return full.email_id;
          },
          orderable: true,
          name: 'email_id'
        },
        {
          render: function (data, type, full, meta) {
            return full.phone_no;
          },
          orderable: true,
          name: 'phone_no'
        },
        {
          render: function (data, type, full, meta) {
            if (full.designations.length > 0) {
              let html: any = '';

              full.designations.forEach((element: any) => {
                html += element.designation_name + `<br>`;
              });

              return html;
            } else {
              return 'N/A';
            }
          },
          orderable: false,
        },
        {
          render: function (data, type, full, meta) {
            if (full.departments.length > 0) {
              let html: any = '';

              full.departments.forEach((element: any) => {
                html += element.department_name + `<br>`;
              });

              return html;
            } else {
              return 'N/A';
            }
          },
          orderable: false,
        },
        {
          render: function (data, type, full, meta) {
            if (full.hod.length > 0) {
              let html: any = '';

              full.hod.forEach((element: any) => {
                html += element.first_name + ' ' + element.last_name + `<br>`;
              });

              return html;
            } else {
              return 'N/A';
            }
          },
          orderable: false,
        },
        {
          render: function (data, type, full, meta) {
            if (full.branches.length > 0) {
              let html: any = '';

              full.branches.forEach((element: any) => {
                html += element.branch_name + `<br>`;
              });

              return html;
            } else {
              return 'N/A';
            }
          },
          orderable: false,
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

        $("table").on('click', '#changePassword-' + index, function () {
          self.getChangePassword(data);
        });

        return row;
      },
      drawCallback: function (settings) {
        Global.loadCustomScripts('customJsScript');
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
        search: "",
      }
    };
  }

  getSelectedRoles() {
    const roles: any = []
    $('input[name="roles[]"]:checked').each(function () {
      roles.push($(this).val())
    });

    return roles;
  }

  checkRolesforEdit(roles: any) {
    this.resetSelectedRoles();

    for (const key in roles) {
      if (Object.prototype.hasOwnProperty.call(roles, key)) {
        const element = roles[key];
        $('input[name="roles[]"][value="' + element + '"]').prop('checked', true);
      }
    }
  }

  resetSelectedRoles() {
    $('input[name="roles[]"]:checked').each(function () {
      $(this).prop('checked', false);
    });
  }

  cancelEntry() {
    this.editActionId = '';
    this.subAdminForm.reset();

    for (const key in this.subAdminForm.controls) {
      if (Object.prototype.hasOwnProperty.call(this.subAdminForm.controls, key)) {
        const element = this.subAdminForm.controls[key];

        element.markAsUntouched();
        element.markAsPristine();
      }
    }

    this.resetSelectedRoles();
  }

  filterDataTable() {
    if (this.filterForm.value.designation != null) {
      this.filterForm.value.designation_id = this.filterForm.value.designation.id;
    }

    if (this.filterForm.value.department != null) {
      this.filterForm.value.department_id = this.filterForm.value.department.id;
    }

    $('#my-datatable_filter').find('[type="search"]').val('');
    $('#my-datatable').DataTable().search('').draw();
  }

  resetDataTableFilter() {
    this.filterForm.reset();
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
        this.adminService.deleteSubAdmin({
          'user_id': item._id,
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

  getEdit(item: any) {
    this.editActionId = item._id;

    let branch_id = this.branchMaster.find(obj => {
      return obj.id === item.branch_id
    });

    let department_id = this.departmentMaster.find(obj => {
      return obj.id === item.department_id
    });

    let designation_id = this.designationMaster.find(obj => {
      return obj.id === item.designation_id
    });

    let hod_id = this.hodMaster.find(obj => {
      return obj.id === item.hod_id
    });

    this.checkRolesforEdit(item.roles);

    this.subAdminForm.patchValue({
      "first_name": item.first_name,
      "last_name": item.last_name,
      "email_id": item.email_id,
      "userid": "none",
      "password": "none",
      "password_confirmation": "none",
      "phone_no": item.phone_no,
      "is_hod": item.is_hod,
      "hod_id": (hod_id != undefined) ? hod_id : null,
      "designation_id": designation_id,
      "branch_id": branch_id,
      "department_id": department_id,
    });

    $('html, body').animate({
      'scrollTop': $("#subadmin-submit-section").position().top
    });
  }

  update(event: any) {
    if (this.subAdminForm.valid) {
      let subAdminRoles = this.getSelectedRoles();
      if (subAdminRoles.length < 0) {
        this.toastr.error("Please assign atleast one Role to continue");
        return;
      }

      event.target.classList.add('btn-loading');

      this.adminService.updateSubAdmin({
        'user_id': this.editActionId,
        'first_name': this.subAdminForm.value.first_name,
        'last_name': this.subAdminForm.value.last_name,
        'email_id': this.subAdminForm.value.email_id,
        'phone_no': this.subAdminForm.value.phone_no,
        'is_hod': this.subAdminForm.value.is_hod,
        'hod_id': this.subAdminForm.value.hod_id.id,
        'designation_id': this.subAdminForm.value.designation_id.id,
        'branch_id': this.subAdminForm.value.branch_id.id,
        'department_id': this.subAdminForm.value.department_id.id,
        'roles[]': JSON.stringify(subAdminRoles),
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

  getChangePassword(item: any) {
    this.changePasswordForm.setValue({
      "user_id": item._id,
      "password": null,
      "password_confirmation": null,
    });

    $('#changePasswordModalButton').click();
  }

  updatePassword(event: any) {
    if (this.changePasswordForm.valid) {
      if (this.changePasswordForm.value.password != this.changePasswordForm.value.password_confirmation) {
        this.toastr.error("Password confirmation doesnot matched");
        return;
      }

      event.target.classList.add('btn-loading');

      this.adminService.updateSubAdminPassword({
        'user_id': this.changePasswordForm.value.user_id,
        'password': this.changePasswordForm.value.password,
      }).subscribe(res => {
        if (res.status == 'success') {
          this.toastr.success(res.message);
          this.changePasswordForm.reset();
          $('#changePasswordModal').find('[data-dismiss="modal"]').click();
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
}
