import { DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';
import { disableDebugTools, Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { AppComponent } from 'src/app/app.component';
import * as Global from 'src/app/globals';
import { CompanyuserService } from 'src/app/services/companyuser.service';
import swal from 'sweetalert2';

@Component({
  selector: 'companyuser-app-employee-packages',
  templateUrl: './employee-packages.component.html',
  styleUrls: ['./employee-packages.component.css'],
})
export class CMPEmployeePackagesComponent implements OnInit {
  dtOptions: DataTables.Settings = {};
  employeePackageForm: UntypedFormGroup;
  editActionId: String;

  attendanceRuleMaster: any[] = [];
  tdsRuleMaster: any[] = [];
  bonusTempMaster: any[] = [];
  incentiveTempMaster: any[] = [];
  overtimeTempMaster: any[] = [];
  ptaxRuleMaster: any[] = [];
  leaveTempMaster: any[] = [];
  lwfTempMaster: any[] = [];
  paySlipTempMaster: any[] = [];
  arrearSlipMaster: any[] = [];
  bonusMaster: any[] = [];
  isSubmitted: any = false;
  constructor(
    public formBuilder: UntypedFormBuilder,
    private titleService: Title,
    private toastr: ToastrService,
    private spinner: NgxSpinnerService,
    private companyuserService: CompanyuserService,
    private datePipe: DatePipe,
    public AppComponent: AppComponent,
    public router: Router
  ) {
    this.employeePackageForm = formBuilder.group({
      package_name: [null, Validators.compose([Validators.required])],
      attendance_temp: [null, Validators.compose([Validators.required])],
      incentive_temp: [null, Validators.compose([Validators.required])],
      bonus_temp: [null, Validators.compose([Validators.required])],
      overtime_temp: [null, Validators.compose([Validators.required])],
      tds_temp: [null, Validators.compose([Validators.required])],
      ptax_temp: [null, Validators.compose([Validators.required])],
      leave_temp: [null, Validators.compose([Validators.required])],
      lwf_temp: [null, Validators.compose([Validators.required])],
      payslip_temp: [null, Validators.compose([Validators.required])],
      arrear_slip_temp: [null, Validators.compose([Validators.required])],
      bonus_slip_temp: [null, Validators.compose([Validators.required])],
    });

    this.editActionId = '';
  }

  ngOnInit() {
    this.titleService.setTitle('Employee Packages - ' + Global.AppName);

    if (
      this.AppComponent.checkCompanyModulePermission({
        company_module: 'company_rules_1',
        company_sub_module: 'policy_package',
        company_sub_operation: ['view'],
        company_strict: true,
      })
    ) {
      this.fetch();
    }

    if (
      this.AppComponent.checkCompanyModulePermission({
        company_module: 'company_rules_1',
        company_sub_module: 'policy_package',
        company_sub_operation: ['add', 'edit'],
        company_strict: true,
      })
    ) {
      this.fetchEmployeePackageMaster();
    }

    if (
      !this.AppComponent.checkCompanyModulePermission({
        company_module: 'company_rules_1',
        company_sub_module: 'policy_package',
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

  fetchEmployeePackageMaster() {
    this.spinner.show();

    this.companyuserService.fetchEmployeePackageMaster().subscribe(
      (res) => {
        if (res.status == 'success') {
          if (res.masters?.Tdsrule?.length > 0) {
            this.tdsRuleMaster = [];

            res.masters.Tdsrule.forEach((element: any) => {
              this.tdsRuleMaster.push({
                id: element._id,
                description: element.template_name,
                n_a_applicable: element?.n_a_applicable,
              });
            });
          }
          if (res.masters?.arrearslipTemp?.length > 0) {
            this.arrearSlipMaster = [];

            res.masters.arrearslipTemp.forEach((element: any) => {
              this.arrearSlipMaster.push({
                id: element._id,
                description: element.template_name,
                n_a_applicable: element?.n_a_applicable,
              });
            });
          }

          if (res.masters?.bonusslipTemp?.length > 0) {
            this.bonusMaster = [];

            res.masters.bonusslipTemp.forEach((element: any) => {
              this.bonusMaster.push({
                id: element._id,
                description: element.template_name,
                n_a_applicable: element?.n_a_applicable,
              });
            });
          }

          if (res.masters?.attendancerule?.length > 0) {
            this.attendanceRuleMaster = [];

            res.masters.attendancerule.forEach((element: any) => {
              this.attendanceRuleMaster.push({
                id: element._id,
                description: element.template_name,
                n_a_applicable: element?.n_a_applicable,
              });
            });
          }

          if (res.masters?.bonusTemp?.length > 0) {
            this.bonusTempMaster = [];

            res.masters.bonusTemp.forEach((element: any) => {
              this.bonusTempMaster.push({
                id: element._id,
                description: element.template_name,
                n_a_applicable: element?.n_a_applicable,
              });
            });
          }

          if (res.masters?.incentiveTemp?.length > 0) {
            this.incentiveTempMaster = [];
            res.masters.incentiveTemp.forEach((element: any) => {
              this.incentiveTempMaster.push({
                id: element._id,
                description: element.template_name,
                n_a_applicable: element?.n_a_applicable,
              });
            });
          }

          if (res.masters?.overtimeTemp?.length > 0) {
            this.overtimeTempMaster = [];

            res.masters.overtimeTemp.forEach((element: any) => {
              this.overtimeTempMaster.push({
                id: element._id,
                description: element.template_name,
                n_a_applicable: element?.n_a_applicable,
              });
            });
          }

          if (res.masters?.ptaxrule?.length > 0) {
            this.ptaxRuleMaster = [];

            res.masters.ptaxrule.forEach((element: any) => {
              this.ptaxRuleMaster.push({
                id: element._id,
                description: element.template_name,
                n_a_applicable: element?.n_a_applicable,
              });
            });
          }

          if (res.masters?.leaverule?.length > 0) {
            this.leaveTempMaster = [];

            res.masters.leaverule.forEach((element: any) => {
              this.leaveTempMaster.push({
                id: element._id,
                description: element.template_name,
                n_a_applicable: element?.n_a_applicable,
              });
            });
          }

          if (res.masters?.lwfrule?.length > 0) {
            this.lwfTempMaster = [];

            res.masters.lwfrule.forEach((element: any) => {
              this.lwfTempMaster.push({
                id: element._id,
                description: element.state,
                n_a_applicable: element?.n_a_applicable,
              });
            });
          }

          if (res.masters?.payslipTemp?.length > 0) {
            this.paySlipTempMaster = [];

            res.masters.payslipTemp.forEach((element: any) => {
              this.paySlipTempMaster.push({
                id: element._id,
                description: element.template_name,
                n_a_applicable: element?.n_a_applicable,
              });
            });
          }

          this.employeePackageForm.patchValue({
            attendance_temp:
              this.attendanceRuleMaster.find(
                (item: any) => item.n_a_applicable == 'yes'
              ) ?? null,

            incentive_temp:
              this.incentiveTempMaster.find(
                (item: any) => item.n_a_applicable == 'yes'
              ) ?? null,

            bonus_temp:
              this.bonusTempMaster.find(
                (item: any) => item.n_a_applicable == 'yes'
              ) ?? null,

            overtime_temp:
              this.overtimeTempMaster.find(
                (item: any) => item.n_a_applicable == 'yes'
              ) ?? null,

            tds_temp:
              this.tdsRuleMaster.find(
                (item: any) => item.n_a_applicable == 'yes'
              ) ?? null,

            ptax_temp:
              this.ptaxRuleMaster.find(
                (item: any) => item.n_a_applicable == 'yes'
              ) ?? null,

            leave_temp:
              this.leaveTempMaster.find(
                (item: any) => item.n_a_applicable == 'yes'
              ) ?? null,

            lwf_temp:
              this.lwfTempMaster.find(
                (item: any) => item.n_a_applicable == 'yes'
              ) ?? null,

            payslip_temp:
              this.paySlipTempMaster.find(
                (item: any) => item.n_a_applicable == 'yes'
              ) ?? null,

            arrear_slip_temp:
              this.arrearSlipMaster.find(
                (item: any) => item.n_a_applicable == 'yes'
              ) ?? null,

            bonus_slip_temp:
              this.bonusMaster.find(
                (item: any) => item.n_a_applicable == 'yes'
              ) ?? null,
          });
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
          .fetchEmployeePackages({
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
                  recordsTotal: res.packages.totalDocs,
                  recordsFiltered: res.packages.totalDocs,
                  data: res.packages.docs,
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
            let html = ``;
            let flag: boolean = false;

            if (
              Global.checkCompanyModulePermission({
                company_module: 'company_rules_1',
                company_sub_module: 'policy_package',
                company_sub_operation: ['edit'],
                company_strict: true,
              }) && full.assigned_status == 'pending'
            ) {
              html +=
                `<button class="btn btn-primary btn-icon mx-1" data-toggle="tooltip" data-placement="top" title="Edit" id="editButton-` +
                meta.row +
                `">
                          <div style="width:25px; height:25px;"><i class="fa fa-pen"></i></div>
                      </button>`;

              flag = true;
            }

            // if (Global.checkCompanyModulePermission({ 'staff_module': 'package', 'staff_operation': ['delete'], 'company_strict': true })) {
            //   html += `<button class="btn btn-danger btn-icon mx-1 d-none" data-toggle="tooltip" data-placement="top" title="Delete" id="deleteButton-` + meta.row + `">
            //               <div style="width:25px; height:25px;"><i class="fa fa-trash"></i></div>
            //           </button>`;

            //   flag = true;
            // }

            if (flag) return html;
            else return '-';
          },
          className: 'text-center',
          orderable: false,
        },
        {
          render: function (data, type, full, meta) {
            return full.package_name;
          },
          orderable: true,
          name: 'package_name',
        },
        {
          render: function (data, type, full, meta) {
            var datePipe = new DatePipe('en-US');
            let value = datePipe.transform(full.updated_at, 'dd/MM/yyyy H:mm');
            return value;
          },
          orderable: true,
          name: 'updated_at',
        },
        {
          render: function (data, type, full, meta) {
            return full.corporate_id;
          },
          orderable: true,
          name: 'corporate_id',
        },
      ],
      rowCallback: (row: Node, data: any[] | Object, index: number) => {
        const self = this;
        $('table').on('click', '#editButton-' + index, function () {
          self.getEdit(data);
        });

        // $("table").on('click', '#deleteButton-' + index, function () {
        //   self.deleteItem(data);
        // });

        // $('#changeStatusButton', row).bind('click', () => {
        //   self.changeStatus(data);
        // });
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

  getEdit(item: any) {
    this.editActionId = item._id;
    this.employeePackageForm.patchValue({
      package_name: item.package_name,

      attendance_temp: this.attendanceRuleMaster.find((obj: any) => {
        return obj.id == item.attendance_temp;
      }),

      incentive_temp: this.incentiveTempMaster.find((obj: any) => {
        return obj.id == item.incentive_temp;
      }),

      bonus_temp: this.bonusTempMaster.find((obj: any) => {
        return obj.id == item.bonus_temp;
      }),

      overtime_temp: this.overtimeTempMaster.find((obj: any) => {
        return obj.id == item.overtime_temp;
      }),

      tds_temp: this.tdsRuleMaster.find((obj: any) => {
        return obj.id == item.tds_temp;
      }),

      ptax_temp: this.ptaxRuleMaster.find((obj: any) => {
        return obj.id == item.ptax_temp;
      }),

      leave_temp: this.leaveTempMaster.find((obj: any) => {
        return obj.id == item.leave_temp;
      }),

      lwf_temp: this.lwfTempMaster.find((obj: any) => {
        return obj.id == item.lwf_temp;
      }),

      payslip_temp: this.paySlipTempMaster.find((obj: any) => {
        return obj.id == item.payslip_temp;
      }),

      arrear_slip_temp: this.arrearSlipMaster.find((obj: any) => {
        return obj.id == item.arrear_slip_temp;
      }),
      bonus_slip_temp: this.bonusMaster.find((obj: any) => {
        return obj.id == item.bonus_slip_temp;
      }),
    });

    $('html, body').animate({
      scrollTop: $('#package-submit-section').position().top,
    });
  }

  cancelEdit() {
    this.editActionId = '';
    this.employeePackageForm.reset();
    this.isSubmitted = false;
    this.employeePackageForm.patchValue({
      attendance_temp:
        this.attendanceRuleMaster.find(
          (item: any) => item.n_a_applicable == 'yes'
        ) ?? null,

      incentive_temp:
        this.incentiveTempMaster.find(
          (item: any) => item.n_a_applicable == 'yes'
        ) ?? null,

      bonus_temp:
        this.bonusTempMaster.find(
          (item: any) => item.n_a_applicable == 'yes'
        ) ?? null,

      overtime_temp:
        this.overtimeTempMaster.find(
          (item: any) => item.n_a_applicable == 'yes'
        ) ?? null,

      tds_temp:
        this.tdsRuleMaster.find((item: any) => item.n_a_applicable == 'yes') ??
        null,

      ptax_temp:
        this.ptaxRuleMaster.find((item: any) => item.n_a_applicable == 'yes') ??
        null,

      leave_temp:
        this.leaveTempMaster.find(
          (item: any) => item.n_a_applicable == 'yes'
        ) ?? null,

      lwf_temp:
        this.lwfTempMaster.find((item: any) => item.n_a_applicable == 'yes') ??
        null,

      payslip_temp:
        this.paySlipTempMaster.find(
          (item: any) => item.n_a_applicable == 'yes'
        ) ?? null,

      arrear_slip_temp:
        this.arrearSlipMaster.find(
          (item: any) => item.n_a_applicable == 'yes'
        ) ?? null,

      bonus_slip_temp:
        this.bonusMaster.find((item: any) => item.n_a_applicable == 'yes') ??
        null,
    });
    for (const key in this.employeePackageForm.controls) {
      if (
        Object.prototype.hasOwnProperty.call(
          this.employeePackageForm.controls,
          key
        )
      ) {
        const element = this.employeePackageForm.controls[key];

        element.markAsUntouched();
        element.markAsPristine();
      }
    }
  }

  create(event: any) {
    this.isSubmitted = true;
    if (this.employeePackageForm.valid) {
      event.target.classList.add('btn-loading');

      this.companyuserService
        .createEmployeePackage({
          package_name: this.employeePackageForm.value.package_name,
          attendance_temp:
            this.employeePackageForm.value.attendance_temp?.id ?? '',
          incentive_temp:
            this.employeePackageForm.value.incentive_temp?.id ?? '',
          bonus_temp: this.employeePackageForm.value.bonus_temp?.id ?? '',
          overtime_temp: this.employeePackageForm.value.overtime_temp?.id ?? '',
          tds_temp: this.employeePackageForm.value.tds_temp?.id ?? '',
          ptax_temp: this.employeePackageForm.value.ptax_temp?.id ?? '',
          leave_temp: this.employeePackageForm.value.leave_temp?.id ?? '',
          lwf_temp: this.employeePackageForm.value.lwf_temp?.id ?? '',
          payslip_temp: this.employeePackageForm.value.payslip_temp?.id ?? '',
          arrear_slip_temp:
            this.employeePackageForm.value.arrear_slip_temp?.id ?? '',
          bonus_slip_temp:
            this.employeePackageForm.value.bonus_slip_temp?.id ?? '',
        })
        .subscribe(
          (res) => {
            if (res.status == 'success') {
              this.toastr.success(res.message);
              this.cancelEdit();
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

  // deleteItem(item: any) {
  //   swal.fire({
  //     title: 'Are you sure want to remove?',
  //     text: 'You will not be able to recover this data!',
  //     icon: 'warning',
  //     showCancelButton: true,
  //     confirmButtonText: 'Yes, delete it!',
  //     cancelButtonText: 'No, keep it'
  //   }).then((result) => {
  //     if (result.value) {
  //       this.companyuserService.deleteEmployeePackage({
  //         'package_id': item._id,
  //       }).subscribe(res => {
  //         if (res.status == 'success') {
  //           this.toastr.success(res.message);
  //           $('#my-datatable').dataTable().api().ajax.reload(function (json) { }, false);
  //         } else {
  //           this.toastr.error(res.message);
  //         }
  //       }, (err) => {
  //         this.toastr.error(Global.showServerErrorMessage(err));
  //       });
  //     } else if (result.dismiss === swal.DismissReason.cancel) {
  //       swal.fire(
  //         'Cancelled',
  //         'Your data is safe :)',
  //         'error'
  //       )
  //     }
  //   })
  // }

  update(event: any) {
    this.isSubmitted = true;
    if (this.employeePackageForm.valid) {
      event.target.classList.add('btn-loading');

      this.companyuserService
        .updateEmployeePackage({
          package_name: this.employeePackageForm.value.package_name,
          attendance_temp:
            this.employeePackageForm.value.attendance_temp?.id ?? '',
          incentive_temp:
            this.employeePackageForm.value.incentive_temp?.id ?? '',
          bonus_temp: this.employeePackageForm.value.bonus_temp?.id ?? '',
          overtime_temp: this.employeePackageForm.value.overtime_temp?.id ?? '',
          tds_temp: this.employeePackageForm.value.tds_temp?.id ?? '',
          ptax_temp: this.employeePackageForm.value.ptax_temp?.id ?? '',
          leave_temp: this.employeePackageForm.value.leave_temp?.id ?? '',
          lwf_temp: this.employeePackageForm.value.lwf_temp?.id ?? '',
          payslip_temp: this.employeePackageForm.value.payslip_temp?.id ?? '',
          package_id: this.editActionId,
          arrear_slip_temp:
            this.employeePackageForm.value.arrear_slip_temp?.id ?? '',
          bonus_slip_temp:
            this.employeePackageForm.value.bonus_slip_temp?.id ?? '',
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

  // changeStatus(item: any) {
  //   this.companyuserService.updateDesignation({
  //     'designation_name': item.designation_name,
  //     'designation_id': item._id,
  //     'status': (item.status == "active") ? 'inactive' : 'active',
  //   }).subscribe(res => {
  //     if (res.status == 'success') {
  //       this.toastr.success(res.message);
  //       $('#my-datatable').dataTable().api().ajax.reload(function (json) { }, false);
  //     } else {
  //       this.toastr.error(res.message);
  //     }

  //   }, (err) => {
  //     this.toastr.error(Global.showServerErrorMessage(err));
  //   });
  // }
}
