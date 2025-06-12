import { Component, OnInit } from '@angular/core';
import {
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';
import { disableDebugTools, Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AppComponent } from 'src/app/app.component';
import * as Global from 'src/app/globals';
import { CompanyuserService } from 'src/app/services/companyuser.service';
import swal from 'sweetalert2';

@Component({
  selector: 'companyuser-app-designation',
  templateUrl: './designation.component.html',
  styleUrls: ['./designation.component.css'],
})
export class CMPDesignationComponent implements OnInit {
  dtOptions: DataTables.Settings = {};
  designationForm: UntypedFormGroup;
  designations: any[];
  editActionId: String;

  constructor(
    public formBuilder: UntypedFormBuilder,
    private titleService: Title,
    private toastr: ToastrService,
    private router: Router,
    private companyuserService: CompanyuserService,
    public AppComponent: AppComponent
  ) {
    this.designationForm = formBuilder.group({
      designation_name: [null, Validators.compose([Validators.required])],
    });

    this.designations = [];
    this.editActionId = '';
  }

  ngOnInit() {
    this.titleService.setTitle('Designation - ' + Global.AppName);

    if (
      this.AppComponent.checkCompanyModulePermission({
        company_module: 'master',
        company_sub_module: 'designation',
        company_sub_operation: ['view'],
        company_strict: true,
      })
    ) {
      this.fetch();
    }

    if (
      !this.AppComponent.checkCompanyModulePermission({
        company_module: 'master',
        company_sub_module: 'designation',
        company_sub_operation: ['add', 'edit', 'delete', 'view'],
        company_strict: true,
      })
    ) {
      const _this = this;
      setTimeout(function () {
        _this.router.navigate(['company/errors/unauthorized-access'], {
          skipLocationChange: true,
        });
      }, 500);
      return;
    }
  }

  fetch() {
    this.dtOptions = {
      ajax: (dataTablesParameters: any, callback) => {
        this.companyuserService
          .fetchDesignations({
            pageno: Math.floor(
              (dataTablesParameters.start + dataTablesParameters.length) /
                dataTablesParameters.length
            ),
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
                callback({
                  recordsTotal: res.designations.totalDocs,
                  recordsFiltered: res.designations.totalDocs,
                  data: res.designations.docs,
                });
              } else {
                this.toastr.error(res.message);
              }
            },
            (err) => {
              this.toastr.error(Global.showServerErrorMessage(err));
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
            if (
              Global.checkCompanyModulePermission({
                company_module: 'master',
                company_sub_module: 'designation',
                company_sub_operation: ['edit'],
                company_strict: true,
              })
            ) {

              return (
                `<div class="br-toggle br-toggle-rounded br-toggle-primary ` +
                btnstatus +
                `" id="changeStatusButton">\
                        <div class="br-toggle-switch"></div>\
                      </div>`
              );
            }else{
              return full?.status
            }
          },
          className: 'text-center text-capitalize',
          orderable: true,
          name: 'status',
        },
        {
          render: function (data, type, full, meta) {
            let html = ``;
            let flag: boolean = false;

            if (
              Global.checkCompanyModulePermission({
                company_module: 'master',
                company_sub_module: 'designation',
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

            if (
              Global.checkCompanyModulePermission({
                company_module: 'master',
                company_sub_module: 'designation',
                company_sub_operation: ['delete'],
                company_strict: true,
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

            if (flag) return html;
            else return '-';
          },
          className: 'text-center',
          orderable: false,
        },
        {
          render: function (data, type, full, meta) {
            return full.designation_name;
          },
          orderable: true,
          name: 'designation_name',
        },
      ],
      drawCallback: function (settings) {
        Global.loadCustomScripts('customJsScript');
      },
      rowCallback: (row: Node, data: any[] | Object, index: number) => {
        const self = this;
        $('table').on('click', '#editButton-' + index, function () {
          self.getEdit(data);
        });

        $('table').on('click', '#deleteButton-' + index, function () {
          self.deleteItem(data);
        });

        $('#changeStatusButton', row).bind('click', () => {
          self.changeStatus(data);
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

  getEdit(item: any) {
    this.editActionId = item._id;
    this.designationForm.setValue({
      designation_name: item.designation_name,
    });

    $('html, body').animate({
      scrollTop: $('#designation-submit-section').position().top,
    });
  }

  cancelEdit() {
    this.editActionId = '';
    this.designationForm.reset();
  }

  create(event: any) {
    if (this.designationForm.valid) {
      event.target.classList.add('btn-loading');

      this.companyuserService
        .createDesignation({
          designation_name: this.designationForm.value.designation_name,
          status: 'active',
        })
        .subscribe(
          (res) => {
            if (res.status == 'success') {
              this.toastr.success(res.message);
              this.designationForm.reset();
              $('#my-datatable')
                .dataTable()
                .api()
                .ajax.reload(function (json) {}, false);
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
            .deleteDesignation({
              designation_id: item._id,
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

  update(event: any) {
    if (this.designationForm.valid) {
      event.target.classList.add('btn-loading');

      this.companyuserService
        .updateDesignation({
          designation_name: this.designationForm.value.designation_name,
          designation_id: this.editActionId,
          status: 'active',
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

            event.target.classList.remove('btn-loading');
          },
          (err) => {
            event.target.classList.remove('btn-loading');
            this.toastr.error(Global.showServerErrorMessage(err));
          }
        );
    }
  }

  changeStatus(item: any) {
    if (
      !this.AppComponent.checkCompanyModulePermission({
        company_module: 'master',
        company_sub_module: 'designation',
        company_sub_operation: ['edit'],
        company_strict: true,
      })
    ) {
      return;
    }

    this.companyuserService
      .updateDesignation({
        designation_name: item.designation_name,
        designation_id: item._id,
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
}
