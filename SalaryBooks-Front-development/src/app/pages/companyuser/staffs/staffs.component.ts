import { Component, OnInit } from '@angular/core';
import {
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ToastrService } from 'ngx-toastr';
import * as Global from 'src/app/globals';
import swal from 'sweetalert2';
import { NgxSpinnerService } from 'ngx-spinner';
import { CompanyuserService } from 'src/app/services/companyuser.service';
import { AppComponent } from 'src/app/app.component';
import { Router } from '@angular/router';

@Component({
  selector: 'companyuser-app-staffs',
  templateUrl: './staffs.component.html',
  styleUrls: ['./staffs.component.css'],
})
export class CMPStaffsComponent implements OnInit {
  Global = Global;
  dtOptions: DataTables.Settings = {};
  staffForm: UntypedFormGroup;
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
    private companyuserService: CompanyuserService,
    private toastr: ToastrService,
    private spinner: NgxSpinnerService,
    public AppComponent: AppComponent,
    private router: Router
  ) {
    this.designationMaster = [];
    this.departmentMaster = [];
    this.branchMaster = [];
    this.roleMaster = [];
    this.hodMaster = [];
    this.editActionId = '';

    this.staffForm = formBuilder.group({
      first_name: [null, Validators.compose([Validators.required])],
      last_name: [null, Validators.compose([Validators.required])],
      email_id: [
        null,
        Validators.compose([Validators.required, Validators.email]),
      ],
      userid: [null, Validators.compose([Validators.required])],
      password: [null, Validators.compose([Validators.required])],
      password_confirmation: [null, Validators.compose([Validators.required])],
      phone_no: [
        null,
        Validators.compose([
          // Validators.required,
          Validators.minLength(10),
          Validators.maxLength(10),
        ]),
      ],
      is_hod: [null, Validators.compose([Validators.required])],
      hod_id: [null, Validators.compose([Validators.required])],
      designation_id: [null],
      branch_id: [null],
      department_id: [null],
    });

    this.changePasswordForm = formBuilder.group({
      staff_id: [null, Validators.compose([Validators.required])],
      password: [null, Validators.compose([Validators.required])],
      password_confirmation: [null, Validators.compose([Validators.required])],
    });

    this.filterForm = formBuilder.group({
      first_name: [null],
      last_name: [null],
      email_id: [null],
      phone_no: [null],
      designation: [null],
      department: [null],
      designation_id: [null],
      department_id: [null],
    });

    if (
      this.AppComponent.checkCompanyModulePermission({
        company_module: 'sub_admin',
        company_operation: '',
        company_sub_module: 'staff_management',
        company_sub_operation: [ 'view'],
        company_strict: true,
      })
    ) {
      this.fetchMasters();
    }

    if (
      this.AppComponent.checkCompanyModulePermission({
        company_module: 'sub_admin',
        company_operation: '',
        company_sub_module: 'staff_management',
        company_sub_operation: [ 'view'],
        company_strict: true
      })
    ) {
      this.fetch();
    }
  }

  ngOnInit(): void {
    this.titleService.setTitle('Staff - ' + Global.AppName);

    if (
      !this.AppComponent.checkCompanyModulePermission({
        company_module: 'sub_admin',
        company_operation: '',
        company_sub_module: 'staff_management',
        company_sub_operation: [ 'view'],
        company_strict: true
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

  fetchMasters() {
    this.spinner.show();

    this.companyuserService.fetchStaffPageMasters().subscribe(
      (res) => {
        if (res.status == 'success') {
          this.roleMaster = [];
          for (const key in res.masters.role) {
            if (Object.prototype.hasOwnProperty.call(res.masters.role, key)) {
              const element = res.masters.role[key];
              this.roleMaster.push({
                id: element._id,
                description: element.role_name,
              });
            }
          }

          this.designationMaster = [];
          for (const key in res.masters.designation) {
            if (
              Object.prototype.hasOwnProperty.call(res.masters.designation, key)
            ) {
              const element = res.masters.designation[key];
              this.designationMaster.push({
                id: element._id,
                description: element.designation_name,
              });
            }
          }

          this.departmentMaster = [];
          for (const key in res.masters.department) {
            if (
              Object.prototype.hasOwnProperty.call(res.masters.department, key)
            ) {
              const element = res.masters.department[key];
              this.departmentMaster.push({
                id: element._id,
                description: element.department_name,
              });
            }
          }

          this.branchMaster = [];
          for (const key in res.masters.branch?.company_branch) {
            if (
              Object.prototype.hasOwnProperty.call(
                res.masters.branch?.company_branch,
                key
              )
            ) {
              const element = res.masters.branch?.company_branch[key];
              this.branchMaster.push({
                id: element._id,
                description: element.branch_name,
              });
            }
          }

          this.hodMaster = [];
          for (const key in res.masters.staff) {
            if (Object.prototype.hasOwnProperty.call(res.masters.staff, key)) {
              const element = res.masters.staff[key];
              this.hodMaster.push({
                id: element._id,
                description: element.first_name + ' ' + element.last_name,
              });
            }
          }
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

  create(event: any) {
    if (!Global.isCreditAvailable('company_user')) {
      this.toastr.error(
        "You don't have sufficient credit value to create a staff"
      );
      return;
    }

    if (this.staffForm.valid) {
      let staffRoles = this.getSelectedRoles();
      if (staffRoles.length < 1) {
        this.toastr.error('Please assign atleast one role to continue');
        return;
      }

      if (
        this.staffForm.value.password !=
        this.staffForm.value.password_confirmation
      ) {
        this.toastr.error('Password confirmation doesnot matched');
        return;
      }

      event.target.classList.add('btn-loading');

      this.companyuserService
        .createStaff({
          first_name: this.staffForm.value.first_name || '',
          last_name: this.staffForm.value.last_name || '',
          email_id: this.staffForm.value.email_id || '',
          userid: this.staffForm.value.userid || '',
          password: this.staffForm.value.password || '',
          phone_no: this.staffForm.value.phone_no || '',
          is_hod: this.staffForm.value.is_hod || '',
          hod_id: this.staffForm.value.hod_id?.id || '',
          designation_id: this.staffForm.value.designation_id?.id || '',
          branch_id: this.staffForm.value.branch_id?.id || '',
          department_id: this.staffForm.value.department_id?.id || '',
          'roles[]': JSON.stringify(staffRoles),
        })
        .subscribe(
          (res) => {
            if (res.status == 'success') {
              swal.fire({
                title: 'Account Created Successfully',
                html:
                  '<h4 class="text-uppercase">Login Credentials</h4>\
            <p class="m-1">Email: <b>' +
                  this.staffForm.value.email_id +
                  '</b></p>\
            <p>Password: <b>' +
                  this.staffForm.value.password +
                  '</b></p>',
                icon: 'success',
                confirmButtonText: 'OKAY',
              });

              $('#my-datatable')
                .dataTable()
                .api()
                .ajax.reload(function (json) {}, false);
              this.cancelEntry();
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

  fetch() {
    this.dtOptions = {
      ajax: (dataTablesParameters: any, callback) => {
        if (dataTablesParameters.search.value != '') {
          this.resetDataTableFilter();
        }

        this.companyuserService
          .fetchStaffs({
            pageno: Math.floor(
              (dataTablesParameters.start + dataTablesParameters.length) /
                dataTablesParameters.length
            ),
            perpage: dataTablesParameters.length,
            searchkey: dataTablesParameters.search.value,
            first_name: this.filterForm.value.first_name,
            last_name: this.filterForm.value.last_name,
            email_id: this.filterForm.value.email_id,
            phone_no: this.filterForm.value.phone_no,
            designation_id: this.filterForm.value.designation_id,
            department_id: this.filterForm.value.department_id,
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
                  recordsTotal: res.staff.totalDocs,
                  recordsFiltered: res.staff.totalDocs,
                  data: res.staff.docs,
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
          render: function (data, type, full, meta) {
            return full.userid ? full.userid : '-';
          },
          orderable: true,
          name: 'userid',
        },
        {
          render: function (data, type, full, meta) {
            let html = ``;
            let flag: boolean = false;

            if (
              Global.checkCompanyModulePermission({
                company_module: 'sub_admin',
                company_operation: '',
                company_sub_module: 'staff_management',
                company_sub_operation: [ 'edit'],
                company_strict: true
              })
            ) {
              html +=
                `<button class="btn btn-primary btn-icon mx-1" data-toggle="tooltip" data-placement="top" title="Edit" id="editButton-` +
                meta.row +
                `">
                          <div style="width:25px; height:25px;"><i class="fa fa-pen"></i></div>
                      </button>
                      <button class="btn btn-dark btn-icon mx-1" data-toggle="tooltip" data-placement="top" title="Change Password" id="changePassword-` +
                meta.row +
                `">
                          <div style="width:25px; height:25px;"><i class="fa fa-lock"></i></div>
                      </button>`;

              flag = true;
            }

            if (
              Global.checkCompanyModulePermission({
                company_module: 'sub_admin',
                company_operation: '',
                company_sub_module: 'staff_management',
                company_sub_operation: [ 'delete'],
                company_strict: true
              })
            ) {
              html +=
                `<button class="btn btn-danger btn-icon mx-1" data-toggle="tooltip" data-placement="top" title="Delete" id="deleteButton-` +
                meta.row +
                `">
                          <div style="width:25px; height:25px;"><i class="fa fa-trash"></i></div>
                      </button>`;

              flag = true;
            }

            let currentuser: any = localStorage.getItem(
              'payroll-companyuser-user'
            );
            if (currentuser) {
              currentuser = JSON.parse(currentuser);
              if (currentuser._id == full._id) return '-';
            }

            if (flag) return html;
            else return '-';
          },
          className: 'text-center',
          orderable: false,
        },
        {
          render: function (data, type, full, meta) {
            return full.first_name;
          },
          orderable: true,
          name: 'first_name',
        },
        {
          render: function (data, type, full, meta) {
            return full.last_name;
          },
          orderable: true,
          name: 'last_name',
        },
        {
          render: function (data, type, full, meta) {
            return full.email_id;
          },
          orderable: true,
          name: 'email_id',
        },
        {
          render: function (data, type, full, meta) {
            return full.phone_no;
          },
          orderable: true,
          name: 'phone_no',
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

        $('table').on('click', '#editButton-' + index, function () {
          self.getEdit(data);
        });

        $('table').on('click', '#deleteButton-' + index, function () {
          self.deleteItem(data);
        });

        $('table').on('click', '#changePassword-' + index, function () {
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

  getSelectedRoles() {
    const roles: any = [];
    $('input[name="roles[]"]:checked').each(function () {
      roles.push($(this).val());
    });

    return roles;
  }

  checkRolesforEdit(roles: any) {
    this.resetSelectedRoles();

    for (const key in roles) {
      if (Object.prototype.hasOwnProperty.call(roles, key)) {
        const element = roles[key];
        $('input[name="roles[]"][value="' + element + '"]').prop(
          'checked',
          true
        );
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
    this.staffForm.reset();

    for (const key in this.staffForm.controls) {
      if (Object.prototype.hasOwnProperty.call(this.staffForm.controls, key)) {
        const element = this.staffForm.controls[key];

        element.markAsUntouched();
        element.markAsPristine();
      }
    }

    this.resetSelectedRoles();
  }

  filterDataTable() {
    if (this.filterForm.value.designation != null) {
      this.filterForm.value.designation_id =
        this.filterForm.value.designation.id;
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
            .deleteStaff({
              staff_id: item._id,
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

  getEdit(item: any) {
    this.editActionId = item._id;

    let branch_id = this.branchMaster.find((obj) => {
      return obj.id === item.branch_id;
    });

    let department_id = this.departmentMaster.find((obj) => {
      return obj.id === item.department_id;
    });

    let designation_id = this.designationMaster.find((obj) => {
      return obj.id === item.designation_id;
    });

    let hod_id = this.hodMaster.find((obj) => {
      return obj.id === item.hod_id;
    });

    this.checkRolesforEdit(item.roles);

    this.staffForm.patchValue({
      first_name: item.first_name,
      last_name: item.last_name,
      email_id: item.email_id,
      userid: 'none',
      password: 'none',
      password_confirmation: 'none',
      phone_no: item.phone_no,
      is_hod: item.is_hod,
      hod_id: hod_id != undefined ? hod_id : null,
      designation_id: designation_id,
      branch_id: branch_id,
      department_id: department_id,
    });

    $('html, body').animate({
      scrollTop: $('#staff-submit-section').position().top,
    });
  }

  update(event: any) {
    if (this.staffForm.valid) {
      let staffRoles = this.getSelectedRoles();
      if (staffRoles.length < 1) {
        this.toastr.error('Please assign atleast one role to continue');
        return;
      }

      event.target.classList.add('btn-loading');

      this.companyuserService
        .updateStaff({
          staff_id: this.editActionId ?? '',
          first_name: this.staffForm.value.first_name ?? '',
          last_name: this.staffForm.value.last_name ?? '',
          email_id: this.staffForm.value.email_id ?? '',
          phone_no: this.staffForm.value.phone_no ?? '',
          is_hod: this.staffForm.value.is_hod ?? '',
          hod_id: this.staffForm.value?.hod_id?.id ?? '',
          designation_id: this.staffForm.value?.designation_id?.id ?? '',
          branch_id: this.staffForm.value?.branch_id?.id ?? '',
          department_id: this.staffForm.value?.department_id?.id ?? '',
          'roles[]': JSON.stringify(staffRoles),
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
  }

  getChangePassword(item: any) {
    this.changePasswordForm.setValue({
      staff_id: item._id,
      password: null,
      password_confirmation: null,
    });

    $('#changePasswordModalButton').click();
  }

  updatePassword(event: any) {
    if (this.changePasswordForm.valid) {
      if (
        this.changePasswordForm.value.password !=
        this.changePasswordForm.value.password_confirmation
      ) {
        this.toastr.error('Password confirmation doesnot matched');
        return;
      }

      event.target.classList.add('btn-loading');

      this.companyuserService
        .updateStaffPassword({
          staff_id: this.changePasswordForm.value.staff_id,
          password: this.changePasswordForm.value.password,
        })
        .subscribe(
          (res) => {
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
          },
          (err) => {
            event.target.classList.remove('btn-loading');
            this.toastr.error(Global.showServerErrorMessage(err));
          }
        );
    }
  }
}
