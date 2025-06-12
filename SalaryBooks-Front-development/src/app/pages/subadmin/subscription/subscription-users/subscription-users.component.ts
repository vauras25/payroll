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
  selector: 'subadmin-app-subscription-users',
  templateUrl: './subscription-users.component.html',
  styleUrls: ['./subscription-users.component.css']
})
export class SADSubscriptionUsersComponent implements OnInit {
  dtOptions: DataTables.Settings = {};
  subscriptionUserSearchForm: UntypedFormGroup;
  subscriptionCompanyForm: UntypedFormGroup;
  editActionId: String;
  packageMaster: any[];
  planMaster: any[];
  statusMaster: any[];
  sortingMaster: any[];

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
    this.subscriptionUserSearchForm = formBuilder.group({
      'corporate_id': [null],
      'establishment_name': [null],
      'email_id': [null],
      'phone_no': [null],
      'package_id': [null],
      'plan_id': [null],
      'status': [null],
      'orderby': [null],
    });

    this.subscriptionCompanyForm = formBuilder.group({
      'corporate_id': [null, Validators.compose([Validators.required])],
      'establishment_name': [null, Validators.compose([Validators.required])],
      'userid': [null, Validators.compose([Validators.required])],
      'email_id': [null, Validators.compose([Validators.required, Validators.email])],
      "phone_no": [null, Validators.compose([Validators.required, Validators.minLength(10), Validators.maxLength(10)])],
      'package_id': [null, Validators.compose([Validators.required])],
      'plan_id': [null, Validators.compose([Validators.required])],
      'password': [null, Validators.compose([Validators.required])],
    });

    this.editActionId = '';

    this.packageMaster = [];
    this.planMaster = [];
    this.statusMaster = [
      { 'id': 'active', 'description': 'Active' },
      { 'id': 'inactive', 'description': 'De-active' },
    ];

    this.sortingMaster = [
      { 'id': 'asc', 'description': 'Ascending' },
      { 'id': 'desc', 'description': 'Descending' },
    ];
  }

  ngOnInit() {
    this.titleService.setTitle("Subscription Plan Management - " + Global.AppName);

    if (this.AppComponent.checkModulePermission('subadmin', 'user_manager', 'view')) {
      this.fetch();
    }

    if (this.AppComponent.checkModulePermission('subadmin', 'user_manager', ['add', 'edit'])) {
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

          this.planMaster = [];
          for (const key in res.masters.plans) {
            if (Object.prototype.hasOwnProperty.call(res.masters.plans, key)) {
              const element = res.masters.plans[key];
              this.planMaster.push({ "id": element._id, "description": element.plan_name });
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
        this.subadminService.fetchSubscriptionUsers({
          'pageno': Math.floor((dataTablesParameters.start + dataTablesParameters.length) / dataTablesParameters.length), 'perpage': dataTablesParameters.length,
          'searchkey': dataTablesParameters.search.value,
          'corporate_id': this.subscriptionUserSearchForm.value.corporate_id,
          'establishment_name': this.subscriptionUserSearchForm.value.establishment_name,
          'email_id': this.subscriptionUserSearchForm.value.email_id,
          'phone_no': this.subscriptionUserSearchForm.value.phone_no,
          'package_id': (this.subscriptionUserSearchForm.value.package_id != null) ? this.subscriptionUserSearchForm.value.package_id.id : '',
          'plan_id': (this.subscriptionUserSearchForm.value.plan_id != null) ? this.subscriptionUserSearchForm.value.plan_id.id : '',
          'status': (this.subscriptionUserSearchForm.value.status != null) ? this.subscriptionUserSearchForm.value.status.id : '',
          'orderby': (this.subscriptionUserSearchForm.value.orderby != null) ? this.subscriptionUserSearchForm.value.orderby.id : '',
        }).subscribe(res => {
          if (res.status == 'success') {
            callback({
              recordsTotal: res.company.totalDocs,
              recordsFiltered: res.company.totalDocs,
              data: res.company.docs,
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
            return full.establishment_name;
          }
        },
        {
          render: function (data, type, full, meta) {
            return `<button class="btn btn-sm btn-primary">Award Credit</button>
            <button class="btn btn-sm btn-danger">Deduct Credit</button>
            <button class="btn btn-sm btn-teal">Suspend User</button>
            <button class="btn btn-sm btn-info">Deactivate User</button>
            <button class="btn btn-sm btn-indigo">Hold Credit</button>
            <button class="btn btn-sm btn-warning">Reset Password</button>`;
          },
          className: 'text-center'
        },
        {
          render: function (data, type, full, meta) {
            return full.corporate_id;
          }
        },
        // {
        //   render: function (data, type, full, meta) {
        //     if (full.package && full.package.length > 0) {
        //       let html: any = '';

        //       full.package.forEach((element: any) => {
        //         html += element.package_name + `<br>`;
        //       });

        //       return html;
        //     } else {
        //       return 'N/A';
        //     }
        //   }
        // },
        {
          render: function (data, type, full, meta) {
            if (full.plan && full.plan.length > 0) {
              let html: any = '';

              full.plan.forEach((element: any) => {
                html += element.plan_name + `<br>`;
              });

              return html;
            } else {
              return 'N/A';
            }
          }
        },
        {
          render: function (data, type, full, meta) {
            return full.email_id;
          }
        },
        {
          render: function (data, type, full, meta) {
            return full.phone_no;
          }
        },
        {
          render: function (data, type, full, meta) {
            return (full.status) ? full.status : 'N/A';
          }
        },
        {
          render: function (data, type, full, meta) {
            return (full.credit_status) ? full.credit_status : 'N/A';
          }
        },
        {
          render: function (data, type, full, meta) {
            return (full.user_credit) ? full.credit_status : 'N/A';
          }
        },
      ],
      rowCallback: (row: Node, data: any[] | Object, index: number) => {
        const self = this;

        // $("table").on('click', '#editButton-' + index, function () {
        //   self.getEdit(data);
        // });

        return row;
      },
      pagingType: 'full_numbers',
      serverSide: true,
      processing: true,
      ordering: false,
      searching: false,
      pageLength: Global.DataTableLength,
      lengthChange: true, lengthMenu: Global.DataTableLengthChangeMenu,
      responsive: true,
      language: {
        searchPlaceholder: 'Search...',
        search: ""
      }
    };
  }

  searchSubmit(event: any) {
    $('#my-datatable_filter').find('[type="search"]').val('');
    $('#my-datatable').DataTable().search('').draw();
  }

  addCompany() {
    if (!this.AppComponent.checkModulePermission('subadmin', 'user_manager', ['add'])) {
      this.toastr.error("Permission not granted.");
      return;
    }
    $('.company-desc').show();
  }

  cancelCompanyEntry() {
    $('.company-desc').hide();
  }

  createCompany(event: any) {
    if (this.subscriptionCompanyForm.valid) {
      event.target.classList.add('btn-loading');

      this.subadminService.createSubscriptionUser({
        'corporate_id': this.subscriptionCompanyForm.value.corporate_id,
        'establishment_name': this.subscriptionCompanyForm.value.establishment_name,
        'userid': this.subscriptionCompanyForm.value.userid,
        'email_id': this.subscriptionCompanyForm.value.email_id,
        'phone_no': this.subscriptionCompanyForm.value.phone_no,
        'package_id': this.subscriptionCompanyForm.value.package_id.id,
        'plan_id': this.subscriptionCompanyForm.value.plan_id.id,
        'password': this.subscriptionCompanyForm.value.password,
      }).subscribe(res => {
        if (res.status == 'success') {
          this.toastr.success(res.message);
          this.subscriptionCompanyForm.reset();
          this.cancelCompanyEntry();
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
