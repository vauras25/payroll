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
  selector: 'admin-app-subscription-plans',
  templateUrl: './subscription-plans.component.html',
  styleUrls: ['./subscription-plans.component.css']
})
export class ADSubscriptionPlansComponent implements OnInit {
  dtOptions: DataTables.Settings = {};
  dtOptionsHistory: DataTables.Settings = {};

  subscriptionPlanForm: UntypedFormGroup;
  editActionId: String;
  packageMaster: any[];
  filterForm: UntypedFormGroup;
  initialValueBeforeUpdate: any = null;
  viewPlanDetails: any = null;

  constructor(
    public formBuilder: UntypedFormBuilder,
    private titleService: Title,
    private toastr: ToastrService,
    private router: Router,
    private adminService: AdminService,
    private spinner: NgxSpinnerService,
    private datePipe: DatePipe
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
      // trigger_suspend_no: [null, Validators.compose([Validators.required, Validators.pattern("^[0-9]*$")])],
      trigger_suspend_no: [0, Validators.compose([Validators.required, Validators.pattern("^[0-9]*$"), Validators.min(0)])],
      max_suspend_period: [0, Validators.compose([Validators.required, Validators.pattern("^[0-9]*$")])],
      package_id: [null, [Validators.required]],
      valid_from: [null, [Validators.required]],
    });

    this.filterForm = formBuilder.group({
      "plan_name": [null],
      "package": [null],
      "package_id": [null],
      "free_emp_no": [null],
      "free_staff_no": [null],
      "free_sallary_temp_no": [null],
      "free_sallary_head_no": [null],
      "status_selected": [null],
      "status": [null],
    });

    this.editActionId = '';
    this.packageMaster = [];
  }

  ngOnInit() {
    this.titleService.setTitle("Subscription Plan Management - " + Global.AppName);

    this.fetch();
    this.fetchMaster();

    this.dtOptionsHistory = {
      ajax: (dataTablesParameters: any, callback) => {
        var result = this.getUpdateHistory();

        callback({
          recordsTotal: result.length,
          recordsFiltered: result.length,
          data: result.reverse(),
        });
      },
      columns: [
        {
          render: function (data, type, full, meta: any) {
            return meta.settings._iDisplayStart + (meta.row + 1)
          },
        },
        {
          render: function (data, type, full, meta) {
            var date = full.created_at ? full.created_at : full.updated_at;

            var datePipe = new DatePipe("en-US");
            let value = datePipe.transform(date, 'dd/MM/yyyy hh:mm a');
            return value;
          }
        },
        {
          render: function (data, type, full, meta) {
            return full.user_name ?? 'N/A';
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
            return datePipe.transform(full.valid_from, 'dd/MM/yyyy');
          }
        },
        {
          render: function (data, type, full, meta) {
            return full.monthly_rental_date;
          },
          className: 'text-center'
        },
        {
          render: function (data, type, full, meta) {
            return full.free_emp_no;
          },
          className: 'text-center'
        },
        {
          render: function (data, type, full, meta) {
            return full.additional_emp_cost;
          },
          className: 'text-center'
        },
        {
          render: function (data, type, full, meta) {
            return full.free_staff_no;
          },
          className: 'text-center'
        },
        {
          render: function (data, type, full, meta) {
            return full.additional_staff_cost;
          },
          className: 'text-center'
        },
        {
          render: function (data, type, full, meta) {
            return full.free_sallary_temp_no;
          },
          className: 'text-center'
        },
        {
          render: function (data, type, full, meta) {
            return full.additional_sallary_temp_cost;
          },
          className: 'text-center'
        },
        {
          render: function (data, type, full, meta) {
            return full.free_sallary_head_no;
          },
          className: 'text-center'
        },
        {
          render: function (data, type, full, meta) {
            return full.additional_sallary_head_cost;
          },
          className: 'text-center'
        },
        {
          render: function (data, type, full, meta) {
            return full.trigger_suspend_no;
          },
          className: 'text-center'
        },
        {
          render: function (data, type, full, meta) {
            return full.max_suspend_period;
          },
          className: 'text-center'
        },
        {
          render: function (data, type, full, meta) {
            if (full.package_data?.package_name) {
              return full.package_data.package_name;
            } else {
              return "N/A";
            }
          }
        },
      ],
      searching: true,
      lengthChange: true, lengthMenu: Global.DataTableLengthChangeMenu,
      responsive: true,
      language: {
        searchPlaceholder: 'Search...',
        search: ""
      }
    }
  }

  filterDataTable() {
    if (this.filterForm.value.package != null) {
      this.filterForm.value.package_id = this.filterForm.value.package.id;
    }

    if (this.filterForm.value.status_selected != null) {
      this.filterForm.value.status = this.filterForm.value.status_selected.value;
    }

    $('#my-datatable_filter').find('[type="search"]').val('');
    $('#my-datatable').DataTable().search('').draw();
  }

  resetDataTableFilter() {
    this.filterForm.reset();
  }

  fetchMaster() {
    this.spinner.show();

    this.adminService.fetchPackagePlanMaster()
      ?.subscribe(res => {
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
        this.toastr.error("Internal server error occured. Please try again later.");
        this.spinner.hide();
      });
  }

  fetch() {
    this.dtOptions = {
      ajax: (dataTablesParameters: any, callback) => {
        if (dataTablesParameters.search.value != "") {
          this.resetDataTableFilter()
        }

        this.adminService.fetchSubscriptionPlans({
          'pageno': Math.floor((dataTablesParameters.start + dataTablesParameters.length) / dataTablesParameters.length), 'perpage': dataTablesParameters.length,
          'searchkey': dataTablesParameters.search.value,
          'plan_name': this.filterForm.value.plan_name,
          'package_id': this.filterForm.value.package_id,
          'free_emp_no': this.filterForm.value.free_emp_no,
          'free_staff_no': this.filterForm.value.free_staff_no,
          'free_sallary_temp_no': this.filterForm.value.free_sallary_temp_no,
          'free_sallary_head_no': this.filterForm.value.free_sallary_head_no,
          'status': this.filterForm.value.status,
          'sortbyfield': Global.getTableSortingOptions('sortbyfield', dataTablesParameters),
          'ascdesc': Global.getTableSortingOptions('ascdesc', dataTablesParameters)
        })?.subscribe(res => {
          if (res.status == 'success') {
            callback({
              recordsTotal: res.plans.totalDocs,
              recordsFiltered: res.plans.totalDocs,
              data: res.plans.docs,
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
          name: 'status',
          orderable: true
        },
        {
          render: function (data, type, full, meta) {
            return `<button class="btn btn-primary btn-icon mx-1" data-toggle="tooltip" data-placement="top" title="Edit" id="editButton-` + meta.row + `">
                        <div style="width:25px; height:25px;"><i class="fa fa-pen"></i></div>
                    </button>
                    <button class="btn btn-info btn-icon mx-1" data-toggle="tooltip" data-placement="top" title="Update History" id="historyButton-` + meta.row + `">
                        <div style="width:25px; height:25px;"><i class="fa fa-history"></i></div>
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
            return full.plan_name;
          },
          orderable: true,
          name: 'plan_name',
        },
        {
          render: function (data, type, full, meta) {
            var datePipe = new DatePipe("en-US");
            let value = datePipe.transform(full.valid_from, 'dd/MM/yyyy');
            return value;
          },
          orderable: true,
          name: 'valid_from',
        },
        {
          render: function (data, type, full, meta) {
            return full.monthly_rental_date;
          },
          className: 'text-center',
          orderable: true,
          name: 'monthly_rental_date',
        },
        {
          render: function (data, type, full, meta) {
            return full.free_emp_no;
          },
          className: 'text-center',
          orderable: true,
          name: 'free_emp_no',
        },
        {
          render: function (data, type, full, meta) {
            return full.additional_emp_cost;
          },
          className: 'text-center',
          orderable: true,
          name: 'additional_emp_cost',
        },
        {
          render: function (data, type, full, meta) {
            return full.free_staff_no;
          },
          className: 'text-center',
          orderable: true,
          name: 'free_staff_no',
        },
        {
          render: function (data, type, full, meta) {
            return full.additional_staff_cost;
          },
          className: 'text-center',
          orderable: true,
          name: 'additional_staff_cost',
        },
        {
          render: function (data, type, full, meta) {
            return full.free_sallary_temp_no;
          },
          className: 'text-center',
          orderable: true,
          name: 'free_sallary_temp_no',
        },
        {
          render: function (data, type, full, meta) {
            return full.additional_sallary_temp_cost;
          },
          className: 'text-center',
          orderable: true,
          name: 'additional_sallary_temp_cost',
        },
        {
          render: function (data, type, full, meta) {
            return full.free_sallary_head_no;
          },
          className: 'text-center',
          orderable: true,
          name: 'free_sallary_head_no',
        },
        {
          render: function (data, type, full, meta) {
            return full.additional_sallary_head_cost;
          },
          className: 'text-center',
          orderable: true,
          name: 'additional_sallary_head_cost',
        },
        {
          render: function (data, type, full, meta) {
            return full.trigger_suspend_no;
          },
          className: 'text-center',
          orderable: true,
          name: 'trigger_suspend_no',
        },
        {
          render: function (data, type, full, meta) {
            return full.max_suspend_period;
          },
          className: 'text-center',
          orderable: true,
          name: 'max_suspend_period',
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
          },
          orderable: false
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

        $('#changeStatusButton', row).bind('click', () => {
          self.changeStatus(data);
        });

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

  getEdit(item: any) {
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
        return obj.id === item.package[0]?._id
      }),
      valid_from: this.datePipe.transform(item.valid_from, 'MM/dd/YYYY'),
    });

    this.initialValueBeforeUpdate = {
      'plan_id': this.editActionId,
      'plan_name': this.subscriptionPlanForm.value.plan_name.toString().trim(),
      'monthly_rental_date': this.subscriptionPlanForm.value.monthly_rental_date.toString().trim(),
      'free_emp_no': this.subscriptionPlanForm.value.free_emp_no.toString().trim(),
      'additional_emp_cost': this.subscriptionPlanForm.value.additional_emp_cost.toString().trim(),
      'free_staff_no': this.subscriptionPlanForm.value.free_staff_no.toString().trim(),
      'additional_staff_cost': this.subscriptionPlanForm.value.additional_staff_cost.toString().trim(),
      'free_sallary_temp_no': this.subscriptionPlanForm.value.free_sallary_temp_no.toString().trim(),
      'additional_sallary_temp_cost': this.subscriptionPlanForm.value.additional_sallary_temp_cost.toString().trim(),
      'free_sallary_head_no': this.subscriptionPlanForm.value.free_sallary_head_no.toString().trim(),
      'additional_sallary_head_cost': this.subscriptionPlanForm.value.additional_sallary_head_cost.toString().trim(),
      'trigger_suspend_no': this.subscriptionPlanForm.value.trigger_suspend_no.toString().trim(),
      'max_suspend_period': this.subscriptionPlanForm.value.max_suspend_period.toString().trim(),
      'package_id': this.subscriptionPlanForm.value.package_id?.id?.toString().trim() ?? "",
      'package_name': this.subscriptionPlanForm.value.package_id?.description?.toString().trim() ?? "",
      'valid_from': this.datePipe.transform(this.subscriptionPlanForm.value.valid_from, 'Y-MM-dd'),
    }

    $('html, body').animate({
      'scrollTop': $("#bonus-submit-section").position().top
    });
  }

  cancelEdit() {
    this.editActionId = '';
    this.subscriptionPlanForm.reset();

    for (const key in this.subscriptionPlanForm.controls) {
      if (Object.prototype.hasOwnProperty.call(this.subscriptionPlanForm.controls, key)) {
        const element = this.subscriptionPlanForm.controls[key];

        element.markAsUntouched();
        element.markAsPristine();
      }
    }
  }

  create(event: any) {
    if (this.subscriptionPlanForm.valid) {
      event.target.classList.add('btn-loading');

      this.adminService.createSubscriptionPlan({
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
        'package_name': this.subscriptionPlanForm.value.package_id.description,
        'valid_from': this.datePipe.transform(this.subscriptionPlanForm.value.valid_from, 'Y-MM-dd'),
      })?.subscribe(res => {
        if (res.status == 'success') {
          this.toastr.success(res.message);
          // this.subscriptionPlanForm.reset();
          this.cancelEdit();
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
        this.adminService.deleteSubscriptionPlan({
          'plan_id': item._id,
        })?.subscribe(res => {
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
    if (this.subscriptionPlanForm.valid) {
      const documentUpdate = {
        'plan_id': this.editActionId,
        'plan_name': this.subscriptionPlanForm.value.plan_name.toString().trim(),
        'monthly_rental_date': this.subscriptionPlanForm.value.monthly_rental_date.toString().trim(),
        'free_emp_no': this.subscriptionPlanForm.value.free_emp_no.toString().trim(),
        'additional_emp_cost': this.subscriptionPlanForm.value.additional_emp_cost.toString().trim(),
        'free_staff_no': this.subscriptionPlanForm.value.free_staff_no.toString().trim(),
        'additional_staff_cost': this.subscriptionPlanForm.value.additional_staff_cost.toString().trim(),
        'free_sallary_temp_no': this.subscriptionPlanForm.value.free_sallary_temp_no.toString().trim(),
        'additional_sallary_temp_cost': this.subscriptionPlanForm.value.additional_sallary_temp_cost.toString().trim(),
        'free_sallary_head_no': this.subscriptionPlanForm.value.free_sallary_head_no.toString().trim(),
        'additional_sallary_head_cost': this.subscriptionPlanForm.value.additional_sallary_head_cost.toString().trim(),
        'trigger_suspend_no': this.subscriptionPlanForm.value.trigger_suspend_no.toString().trim(),
        'max_suspend_period': this.subscriptionPlanForm.value.max_suspend_period.toString().trim(),
        'package_id': this.subscriptionPlanForm.value.package_id.id.toString().trim(),
        'package_name': this.subscriptionPlanForm.value.package_id.description.toString().trim(),
        'valid_from': this.datePipe.transform(this.subscriptionPlanForm.value.valid_from, 'Y-MM-dd'),
      };

      if (JSON.stringify(documentUpdate) === JSON.stringify(this.initialValueBeforeUpdate)) {
        this.toastr.warning("No change detected to update");
        return;
      }

      event.target.classList.add('btn-loading');
      this.adminService.updateSubscriptionPlan(
        documentUpdate
      )?.subscribe(res => {
        if (res.status == 'success') {
          this.initialValueBeforeUpdate = documentUpdate;
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

  changeStatus(item: any) {
    this.adminService.changeSubscriptionPlanStatus({
      'plan_id': item._id,
      'status': (item.status == "active") ? 'inactive' : 'active',
    })?.subscribe(res => {
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

  showUpdateHistory(item: any) {
    this.viewPlanDetails = item;

    if (this.viewPlanDetails.history != null) {
      $('#history-datatable').dataTable().api().ajax.reload();
      $('#historymmodalbutton').click();
    } else {
      this.toastr.warning("No update history found to show")
    }
  }

  getUpdateHistory() {
    if (this.viewPlanDetails != null && this.viewPlanDetails.history != null && Array.isArray(this.viewPlanDetails.history)) {
      return this.viewPlanDetails.history;
    } else {
      return [];
    }
  }
}
