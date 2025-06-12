import { DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { disableDebugTools, Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { AppComponent } from 'src/app/app.component';
import * as Global from 'src/app/globals';
import { SubadminService } from 'src/app/services/subadmin.service';
import swal from 'sweetalert2';

@Component({
  selector: 'subadmin-app-subscription-plans',
  templateUrl: './subscription-plans.component.html',
  styleUrls: ['./subscription-plans.component.css']
})
export class SADSubscriptionPlansComponent implements OnInit {
  dtOptions: DataTables.Settings = {};
  subscriptionPlanForm: UntypedFormGroup;
  editActionId: String;
  packageMaster: any[];

  constructor(
    public formBuilder: UntypedFormBuilder,
    private titleService: Title,
    private toastr: ToastrService,
    private router: Router,
    private subadminService: SubadminService,
    private spinner: NgxSpinnerService,
    private datePipe: DatePipe,
    public AppComponent: AppComponent
  ) {
    this.subscriptionPlanForm = formBuilder.group({
      plan_name: [null, Validators.compose([Validators.required])],
      monthly_rental_date: [null, Validators.compose([Validators.required, Validators.pattern("^[0-9]*$")])],
      free_emp_no: [null, Validators.compose([Validators.required, Validators.pattern("^[0-9]*$")])],
      additional_emp_cost: [null, Validators.compose([Validators.required, Validators.pattern("^[0-9]+(.[0-9]{0,2})?$")])],
      free_staff_no: [null, Validators.compose([Validators.required, Validators.pattern("^[0-9]*$")])],
      additional_staff_cost: [null, Validators.compose([Validators.required, Validators.pattern("^[0-9]+(.[0-9]{0,2})?$")])],
      free_sallary_temp_no: [null, Validators.compose([Validators.required, Validators.pattern("^[0-9]*$")])],
      additional_sallary_temp_cost: [null, Validators.compose([Validators.required, Validators.pattern("^[0-9]+(.[0-9]{0,2})?$")])],
      free_sallary_head_no: [null, Validators.compose([Validators.required, Validators.pattern("^[0-9]*$")])],
      additional_sallary_head_cost: [null, Validators.compose([Validators.required, Validators.pattern("^[0-9]+(.[0-9]{0,2})?$")])],
      trigger_suspend_no: [null, Validators.compose([Validators.required, Validators.pattern("^[0-9]*$")])],
      max_suspend_period: [null, Validators.compose([Validators.required, Validators.pattern("^[0-9]*$")])],
      package_id: [null, [Validators.required]],
      valid_from: [null, [Validators.required]],
    });

    this.editActionId = '';
    this.packageMaster = [];
  }

  ngOnInit() {
    this.titleService.setTitle("Subscription Plan Management - " + Global.AppName);

    if (this.AppComponent.checkModulePermission('subadmin', 'plan_manager', 'view')) {
      this.fetch();
    }

    if (this.AppComponent.checkModulePermission('subadmin', 'plan_manager', ['add', 'edit'])) {
      this.fetchMaster();
    }
  }

  fetchMaster() {
    this.spinner.show();

    this.subadminService.fetchPackagePlanMaster()
      .subscribe(res => {
        if (res.status == "success") {
          this.packageMaster = [];
          for (const key in res.masters.packages) {
            if (Object.prototype.hasOwnProperty.call(res.masters.packages, key)) {
              const element = res.masters.packages[key];
              this.packageMaster.push({ "id": element._id, "description": element.package_name });
            }
          }
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
        this.subadminService.fetchSubscriptionPlans({
          'pageno': Math.floor((dataTablesParameters.start + dataTablesParameters.length) / dataTablesParameters.length), 'perpage': dataTablesParameters.length,
          'searchkey': dataTablesParameters.search.value
        }).subscribe(res => {
          if (res.status == 'success') {
            callback({
              recordsTotal: res.plans.totalDocs,
              recordsFiltered: res.plans.totalDocs,
              data: res.plans.docs,
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
            return full.plan_name;
          }
        },
        {
          render: function (data, type, full, meta) {
            var datePipe = new DatePipe("en-US");
            let value = datePipe.transform(full.valid_from, 'dd/MM/yyyy');
            return value;
          }
        },
        {
          render: function (data, type, full, meta) {
            return full.monthly_rental_date;
          }
        },
        {
          render: function (data, type, full, meta) {
            return full.free_emp_no;
          }
        },
        {
          render: function (data, type, full, meta) {
            return full.additional_emp_cost;
          }
        },
        {
          render: function (data, type, full, meta) {
            return full.free_staff_no;
          }
        },
        {
          render: function (data, type, full, meta) {
            return full.additional_staff_cost;
          }
        },
        {
          render: function (data, type, full, meta) {
            return full.free_sallary_temp_no;
          }
        },
        {
          render: function (data, type, full, meta) {
            return full.additional_sallary_temp_cost;
          }
        },
        {
          render: function (data, type, full, meta) {
            return full.free_sallary_head_no;
          }
        },
        {
          render: function (data, type, full, meta) {
            return full.additional_sallary_head_cost;
          }
        },
        {
          render: function (data, type, full, meta) {
            return full.trigger_suspend_no;
          }
        },
        {
          render: function (data, type, full, meta) {
            return full.max_suspend_period;
          }
        },
        {
          render: function (data, type, full, meta) {
            if (full.package.length > 0) {
              let html: any = '';

              full.package.forEach((element: any) => {
                html += element.package_name + `<br>`;
              });

              return html;
            } else {
              return 'N/A';
            }
          }
        },
        {
          render: function (data, type, full, meta) {
            let html = ``;
            let flag: boolean = false;

            if (Global.checkModulePermission('subadmin', 'plan_manager', 'edit')) {
              html += `<button class="btn btn-primary btn-icon mg-5" id="editButton-` + meta.row + `">
                  <div style="width:25px; height:25px;"><i class="fa fa-pen"></i></div>
              </button>`

              flag = true;
            }

            if (Global.checkModulePermission('subadmin', 'plan_manager', 'delete')) {
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
    if (!this.AppComponent.checkModulePermission('subadmin', 'plan_manager', 'edit')) {
      this.toastr.error("Permission not granted.");
      return;
    }

    this.editActionId = item._id;
    this.subscriptionPlanForm.patchValue({
      plan_name: item.plan_name,
      monthly_rental_date: item.monthly_rental_date,
      free_emp_no: item.free_emp_no,
      additional_emp_cost: item.additional_emp_cost,
      free_staff_no: item.free_staff_no,
      additional_staff_cost: item.additional_staff_cost,
      free_sallary_temp_no: item.free_sallary_temp_no,
      additional_sallary_temp_cost: item.additional_sallary_temp_cost,
      free_sallary_head_no: item.free_sallary_head_no,
      additional_sallary_head_cost: item.additional_sallary_head_cost,
      trigger_suspend_no: item.trigger_suspend_no,
      max_suspend_period: item.max_suspend_period,
      package_id: this.packageMaster.find((obj: any) => {
        return obj.id === item.package[0]._id
      }),
      valid_from: this.datePipe.transform(item.valid_from, 'MM/dd/YYYY'),
    });

    setTimeout(function () {
      $('html, body').animate({
        'scrollTop': $("#bonus-submit-section").position().top
      });
    }, 10);
  }

  cancelEdit() {
    this.editActionId = '';
    this.subscriptionPlanForm.reset();
  }

  create(event: any) {
    if (this.subscriptionPlanForm.valid) {
      event.target.classList.add('btn-loading');

      this.subadminService.createSubscriptionPlan({
        'plan_name': this.subscriptionPlanForm.value.plan_name,
        'monthly_rental_date': this.subscriptionPlanForm.value.monthly_rental_date,
        'free_emp_no': this.subscriptionPlanForm.value.free_emp_no,
        'additional_emp_cost': this.subscriptionPlanForm.value.additional_emp_cost,
        'free_staff_no': this.subscriptionPlanForm.value.free_staff_no,
        'additional_staff_cost': this.subscriptionPlanForm.value.additional_staff_cost,
        'free_sallary_temp_no': this.subscriptionPlanForm.value.free_sallary_temp_no,
        'additional_sallary_temp_cost': this.subscriptionPlanForm.value.additional_sallary_temp_cost,
        'free_sallary_head_no': this.subscriptionPlanForm.value.free_sallary_head_no,
        'additional_sallary_head_cost': this.subscriptionPlanForm.value.additional_sallary_head_cost,
        'trigger_suspend_no': this.subscriptionPlanForm.value.trigger_suspend_no,
        'max_suspend_period': this.subscriptionPlanForm.value.max_suspend_period,
        'package_id': this.subscriptionPlanForm.value.package_id.id,
        'valid_from': this.datePipe.transform(this.subscriptionPlanForm.value.valid_from, 'Y-MM-dd'),
      }).subscribe(res => {
        if (res.status == 'success') {
          this.toastr.success(res.message);
          this.subscriptionPlanForm.reset();
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
    if (!this.AppComponent.checkModulePermission('subadmin', 'plan_manager', 'delete')) {
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
        this.subadminService.deleteSubscriptionPlan({
          'plan_id': item._id,
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
    if (this.subscriptionPlanForm.valid) {
      event.target.classList.add('btn-loading');

      this.subadminService.updateSubscriptionPlan({
        'plan_id': this.editActionId,
        'plan_name': this.subscriptionPlanForm.value.plan_name,
        'monthly_rental_date': this.subscriptionPlanForm.value.monthly_rental_date,
        'free_emp_no': this.subscriptionPlanForm.value.free_emp_no,
        'additional_emp_cost': this.subscriptionPlanForm.value.additional_emp_cost,
        'free_staff_no': this.subscriptionPlanForm.value.free_staff_no,
        'additional_staff_cost': this.subscriptionPlanForm.value.additional_staff_cost,
        'free_sallary_temp_no': this.subscriptionPlanForm.value.free_sallary_temp_no,
        'additional_sallary_temp_cost': this.subscriptionPlanForm.value.additional_sallary_temp_cost,
        'free_sallary_head_no': this.subscriptionPlanForm.value.free_sallary_head_no,
        'additional_sallary_head_cost': this.subscriptionPlanForm.value.additional_sallary_head_cost,
        'trigger_suspend_no': this.subscriptionPlanForm.value.trigger_suspend_no,
        'max_suspend_period': this.subscriptionPlanForm.value.max_suspend_period,
        'package_id': this.subscriptionPlanForm.value.package_id.id,
        'valid_from': this.datePipe.transform(this.subscriptionPlanForm.value.valid_from, 'Y-MM-dd'),
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
}
