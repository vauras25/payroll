import { DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  FormControl,
  FormGroup,
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';
import { disableDebugTools, Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import * as Global from 'src/app/globals';
import { AdminService } from 'src/app/services/admin.service';
import swal from 'sweetalert2';

@Component({
  selector: 'admin-app-subscription-users',
  templateUrl: './subscription-users.component.html',
  styleUrls: ['./subscription-users.component.css'],
})
export class ADSubscriptionUsersComponent implements OnInit, OnDestroy {
  Global = Global;
  dtOptions: DataTables.Settings = {};

  subscriptionUserSearchForm: UntypedFormGroup;
  subscriptionCompanyForm: UntypedFormGroup;
  customerCreditForm: UntypedFormGroup;
  customerHoldCreditForm: UntypedFormGroup;

  packageMaster: any[];
  planMaster: any[];
  statusMaster: any[];
  sortingMaster: any[];
  holdTypeMaster: any[];

  editActionId: String;

  rowCheckedAll: Boolean = false;
  checkedRowIds: any[] = [];
  uncheckedRowIds: any[] = [];
  resellerMaster: any[] = [];
  filter?: any;


  constructor(
    public formBuilder: UntypedFormBuilder,
    private titleService: Title,
    private toastr: ToastrService,
    private router: Router,
    private adminService: AdminService,
    private spinner: NgxSpinnerService,
    private datePipe: DatePipe,
    private activatedRoute: ActivatedRoute,
  ) {
    this.editActionId = '';

    this.packageMaster = [];
    this.planMaster = [];
    this.statusMaster = [
      { id: 'active', description: 'Active' },
      { id: 'inactive', description: 'De-active' },
    ];

    this.sortingMaster = [
      { id: 'asc', description: 'Ascending' },
      { id: 'desc', description: 'Descending' },
    ];

    this.holdTypeMaster = [
      { value: 'hold', description: 'Hold' },
      { value: 'release', description: 'Release' },
    ];

    this.filter = this.activatedRoute.snapshot.queryParams['filter'];
    
    this.subscriptionUserSearchForm = formBuilder.group({
      corporate_id: [null],
      establishment_name: [null],
      email_id: [null],
      phone_no: [null,  Validators.compose([
        Validators.required,
        Validators.pattern('^[0-9]*$'),
        Validators.minLength(10),
        Validators.maxLength(11),
      ])],
      package_id: [null],
      plan_id: [null],
      status: [null],
      orderby: [null],
    });

    if(this.filter){
      this.subscriptionUserSearchForm.get('status')?.setValue(this.statusMaster?.find(m => m.id == this.filter) ?? null)
    }

    this.subscriptionCompanyForm = formBuilder.group({
      corporate_id: [null, Validators.compose([Validators.required])],
      establishment_name: [null, Validators.compose([Validators.required])],
      userid: [null, Validators.compose([Validators.required])],
      email_id: [
        null,
        Validators.compose([Validators.required, Validators.email]),
      ],
      phone_no: [
        null,
        Validators.compose([
          Validators.required,
          Validators.pattern('^[0-9]*$'),
          Validators.minLength(10),
          Validators.maxLength(11),
        ]),
      ],
      // 'package_id': [null, Validators.compose([Validators.required])],
      plan_id: [null, Validators.compose([Validators.required])],
      reseller_id: [null, Validators.compose([])],
      password: [null, Validators.compose([Validators.required, Validators.minLength(6),])],
    });

    this.customerCreditForm = formBuilder.group({
      type: [null, Validators.compose([Validators.required])],
      amount: [null, Validators.compose([Validators.required])],
      company_id: [null, Validators.compose([Validators.required])],
      credit_bal: [null, Validators.compose([])],
    });

    this.customerHoldCreditForm = formBuilder.group({
      type: [null, Validators.compose([Validators.required])],
      amount: [null, Validators.compose([Validators.required])],
      company_id: [null, Validators.compose([Validators.required])],
      hold_bal: [null, Validators.compose([])],
    });

  
  }

  ngOnInit() {
    this.titleService.setTitle(
      'Subscription User Management - ' + Global.AppName
    );

    this.fetch();
    this.fetchMaster();
    this.fetchreSeller();

    const _this = this;
    $(document).on('click', 'button.action-btn', function () {
      if ($(this).hasClass('awardcredit')) {
        let company_id = $(this).attr('action-data');
        _this.initCreditStatusUpdate(company_id, 'credit');
      } else if ($(this).hasClass('deductcredit')) {
        let company_id = $(this).attr('action-data');
        _this.initCreditStatusUpdate(company_id, 'deduct');
      } else if ($(this).hasClass('suspenduser')) {
        let company_id = $(this).attr('action-data');
        _this.initUserSuspension(company_id);
      } else if ($(this).hasClass('deactiveuser')) {
        let company_id = $(this).attr('action-data');
        _this.initCompanyStatus(company_id);
      } else if ($(this).hasClass('holdcredit')) {
        let company_id = $(this).attr('action-data');
        _this.initUserHoldCredit(company_id);
      } else if ($(this).hasClass('changePlan')) {
        let data = JSON.parse($(this).attr('action-data') as any);
        _this.initUserChangePlan(data);
      }
    });
  }

  ngOnDestroy(): void {
    $(document).off('click', 'button.action-btn');
  }

  fetchMaster() {
    this.spinner.show();

    this.adminService.fetchPackagePlanMaster().subscribe(
      (res) => {
        if (res.status == 'success') {
          this.packageMaster = [];
          for (const key in res.masters.packages) {
            if (
              Object.prototype.hasOwnProperty.call(res.masters.packages, key)
            ) {
              const element = res.masters.packages[key];
              this.packageMaster.push({
                id: element._id,
                description: element.package_name,
              });
            }
          }
          this.planMaster = [];
          if (res.masters.plans) {
            res.masters.plans.forEach((element: any) => {
              this.planMaster.push({
                id: element._id,
                description: element.plan_name,
              });
            });
            // console.log(this.planMaster, 'Plan Maters');
          }
        } else {
          this.toastr.error(res.message);
        }

        this.spinner.hide();
      },
      (err) => {
        this.toastr.error(
          'Internal server error occured. Please try again later.'
        );
        this.spinner.hide();
      }
    );
  }
  fetchreSeller() {
    this.spinner.show();

    this.adminService.fetchSubAdminPageMasters().subscribe(
      (res) => {
        if (res.status == 'success') {
          if (res.masters.reseller && Array.isArray(res.masters.reseller)) {
            this.resellerMaster = [];
            res.masters.reseller?.forEach((element: any) => {
              this.resellerMaster.push({
                id: element._id,
                description: element.reseller_name,
              });
            });
          }
          for (const key in res.masters.plans) {
            if (Object.prototype.hasOwnProperty.call(res.masters.plans, key)) {
              const element = res.masters.plans[key];
              this.planMaster.push({
                id: element._id,
                description: element.plan_name,
              });
            }
          }
        } else {
          this.toastr.error(res.message);
        }

        this.spinner.hide();
      },
      (err) => {
        this.toastr.error(
          'Internal server error occured. Please try again later.'
        );
        this.spinner.hide();
      }
    );
  }
  fetch() {
    const self = this;

    this.dtOptions = {
      ajax: (dataTablesParameters: any, callback) => {
        const nextPage = Math.floor((dataTablesParameters.start + dataTablesParameters.length) / dataTablesParameters.length);

        this.adminService
          .fetchSubscriptionUsers({
            // pageno: dataTablesParameters.start / Global.DataTableLength + 1,
            pageno: nextPage,
            perpage: dataTablesParameters.length,
            searchkey: dataTablesParameters.search.value,
            corporate_id: this.subscriptionUserSearchForm.value.corporate_id,
            establishment_name:
              this.subscriptionUserSearchForm.value.establishment_name,
            email_id: this.subscriptionUserSearchForm.value.email_id,
            phone_no: this?.subscriptionUserSearchForm?.value?.phone_no?.toString() ?? "",
            package_id:
              this.subscriptionUserSearchForm.value.package_id != null
                ? this.subscriptionUserSearchForm.value.package_id.id
                : '',
            plan_id:
              this.subscriptionUserSearchForm.value.plan_id != null
                ? this.subscriptionUserSearchForm.value.plan_id.id
                : '',
            status:
              this.subscriptionUserSearchForm.value.status != null
                ? this.subscriptionUserSearchForm.value.status.id
                : '',
            orderby:
              this.subscriptionUserSearchForm.value.orderby != null
                ? this.subscriptionUserSearchForm.value.orderby.id
                : '',
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
                var docs: any[] = res.company.docs;

                docs.forEach((doc: any) => {
                  doc.checked = this.isRowChecked(doc._id);
                });

                callback({
                  recordsTotal: res.company.totalDocs,
                  recordsFiltered: res.company.totalDocs,
                  data: res.company.docs,
                });
              } else {
                this.toastr.error(res.message);
              }
            },
            (err) => {
              this.toastr.error(
                'Internal server error occured. Please try again later.'
              );
            }
          );
      },
      columns: [
        {
          render: function (data, type, full, meta) {
            let checked = full.checked == true ? 'checked' : '';
            return (
              `<input type="checkbox" ` +
              checked +
              ` id="checkrow-` +
              meta.row +
              `" data-checkbox-id="` +
              full._id +
              `">`
            );
          },
          orderable: false,
        },
        {
          render: function (data, type, full, meta: any) {
            return meta.settings._iDisplayStart + (meta.row + 1);
          },
          orderable: false,
        },
        {
          render: function (data, type, full, meta) {
            let button = ``;
            let html = '';

            button +=
              `<button action-data="` +
              full?._id +
              `" class="awardcredit dropdown-item action-btn"  type="button">Award Credit</button>`;
            button +=
              `<button action-data="` +
              full?._id +
              `" class="deductcredit dropdown-item action-btn"  type="button">Deduct Credit</button>`;
            button +=
              `<button action-data="` + full?._id + ` 
              " class="suspenduser dropdown-item action-btn"  type="button">` +
              (full?.suspension == 'active'
                ? `Suspend User`
                : `User Suspended`) +
              `</button>`;
            button +=
              `<button action-data="` +
              full?._id +
              `" class="deactiveuser dropdown-item action-btn"  type="button">` +
              (full?.status == 'active'
                ? `Deactivate User`
                : `Activate User`) +
              `</button>`;
            // button +=
            //   `<button action-data="` +
            //   full?._id +
            //   `" class="deactiveuser dropdown-item action-btn"  type="button">Deactivate User</button>`;
            button +=
              `<button action-data="` +
              full?._id +
              `" class="holdcredit dropdown-item action-btn"  type="button">Hold Credit</button>`;
            button +=
              `<button action-data="` +
              full?._id +
              `" class="resetpwd dropdown-item action-btn"  type="button">Reset Password</button>`;
            button +=
              `<button action-data='{"plan_id":"` +
              full?.plan_id +
              `","company_id":"` +
              full?._id +
              `"}' class="changePlan dropdown-item action-btn"  type="button">Change Plan</button>`;
            html +=
              `<a class="dropdown">
                            <button class="btn btn-info btn-icon btn-drp dropdown-toggle mt-0" type="button" id="dropdownMenu2" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                Action
                            </button>
                            <div class="dropdown-menu" aria-labelledby="dropdownMenu2">
                                ` +
              button +
              `
                            </div>
                        </a>`;

            return html;
          },
          className: 'text-center',
          orderable: false,
        },
        {
          render: function (data, type, full, meta) {
            return `<span class="text-capitalize">` + (full?.status ?? "N/A") + `</span>`;
          },
          orderable: true,
          name: 'status',
        },
        {
          render: function (data, type, full, meta) {
            return full?.corporate_id ?? "N/A";
          },
          orderable: true,
          name: 'corporate_id',
        },
        {
          render: function (data, type, full, meta) {
            return full?.establishment_name ?? "N/A";
          },
          orderable: true,
          name: 'establishment_name',
        },
        {
          render: function (data, type, full, meta) {
            return (
              `<span class="text-capitalize">` +
              (full?.plan?.plan_name ?? "N/A") +
              `</span>`
            );
          },
          orderable: true,
          name: 'plan',
        },
        {
          render: function (data, type, full, meta) {
            return full?.credit_stat ?? "N/A";
          },
          orderable: true,
          name: 'credit_stat',
        },
       
       
        // {
        //   render: function (data, type, full, meta) {
        //     return full?.resellers?.reseller_name ?? 'N/A';
        //   },
        //   orderable: false,
        //   name: 'resellers',
        // },
        // {
        //   render: function (data, type, full, meta) {
        //     return full?.sub_seller?.reseller_name ?? 'N/A';
        //   },
        //   orderable: false,
        //   name: 'sub_seller',
        // },
        // {
        //   render: function (data, type, full, meta) {
        //     return (
        //       full?.company_details?.company_branch[0]?.branch_name ?? 'N/A'
        //     );
        //   },
        //   orderable: false,
        //   name: 'company_branch',
        // },
       
        // {
        //   render: function (data, type, full, meta) {
        //     return (
        //       (full?.company_details?.reg_office_address?.street_name ?? '') +
        //       ' ' +
        //       (full?.company_details?.reg_office_address?.locality ?? '') +
        //       ' ' +
        //       (full?.company_details?.reg_office_address?.district_name ?? '') +
        //       ' ' +
        //       (full?.company_details?.reg_office_address?.pin_code ?? '') +
        //       ' ' +
        //       (full.reg_office_address?.state ?? '')
        //     );
        //   },
        //   orderable: true,
        //   name: 'reg_office_address',
        // },
        // {
        //   render: function (data, type, full, meta) {
        //     return (
        //       full?.company_details?.company_branch[0]?.branch_contact_person ??
        //       'N/A'
        //     );
        //   },
        //   orderable: true,
        //   name: 'company_branch',
        // },
        // {
        //   render: function (data, type, full, meta) {
        //     return (
        //       full?.company_details?.company_branch[0]?.contact_person_number ??
        //       'N/A'
        //     );
        //   },
        //   orderable: true,
        //   name: 'company_branch',
        // },
        // {
        //   render: function (data, type, full, meta) {
        //     return full?.company_details?.reg_office_address?.state ?? 'N/A';
        //   },
        //   orderable: true,
        //   name: 'reg_office_address',
        // },
        // {
        //   render: function (data, type, full, meta) {
        //     return full?.company_details?.establishment?.gst_no ?? 'N/A';
        //   },
        //   orderable: true,
        //   name: 'establishment',
        // },

        // {
        //   render: function (data, type, full, meta) {
        //     return full?.company_details?.establishment?.pan_numberc ?? 'N/A';
        //   },
        //   orderable: true,
        //   name: 'pan_numberc',
        // },
        // {
        //   render: function (data, type, full, meta) {
        //     var datePipe = new DatePipe('en-US');
        //     let value = datePipe.transform(full?.created_at, 'dd/MM/yyyy');
        //     return value ?? "N/A";
        //   },
        //   orderable: true,
        //   name: 'created_at',
        // },
        // {
        //   render: function (data, type, full, meta) {
        //     return full?.last_wm_credit_consumption ?? "N/A";
        //   },
        //   orderable: true,
        //   name: 'crealast_wm_credit_consumptionted_at',
        // },
       
      ],
      rowCallback: (row: Node, data: any | Object, index: number) => {
        $('table').on('click', '#checkrow-' + index, function () {
          self.rowCheckBoxChecked(event, data);
        });

        return row;
      },
      pagingType: 'full_numbers',
      serverSide: true,
      processing: true,
      ordering: true,
      order: [],
      searching: false,
      pageLength: Global.DataTableLength,
      lengthChange: true,
      lengthMenu: Global.DataTableLengthChangeMenu,
      responsive: false,
      scrollX: true,
      language: {
        searchPlaceholder: 'Search...',
        search: '',
      },
    };
  }

  searchSubmit(event: any) {
    $('#my-datatable_filter').find('[type="search"]').val('');
    $('#my-datatable').DataTable().search('').draw();
  }

  addCompany() {
    $('.company-desc').show();
  }

  cancelCompanyEntry() {
    $('.company-desc').hide();
  }

  createCompany(event: any) {
    if (this.subscriptionCompanyForm.valid) {
      event.target.classList.add('btn-loading');

      this.adminService
        .createSubscriptionUser({
          corporate_id: this.subscriptionCompanyForm.value.corporate_id,
          establishment_name:
            this.subscriptionCompanyForm.value.establishment_name,
          userid: this.subscriptionCompanyForm.value.userid,
          email_id: this.subscriptionCompanyForm.value.email_id,
          phone_no: this.subscriptionCompanyForm.value.phone_no,
          // 'package_id' : this.subscriptionCompanyForm.value.package_id.id,
          plan_id: this.subscriptionCompanyForm.value.plan_id.id,
          password: this.subscriptionCompanyForm.value.password,
          reseller_id: this.subscriptionCompanyForm.value.reseller_id?.id,
        })
        .subscribe(
          (res) => {
            if (res.status == 'success') {
              this.toastr.success(res.message);
              this.subscriptionCompanyForm.reset();
              this.cancelCompanyEntry();
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
            this.toastr.error(
              'Internal server error occured. Please try again later.'
            );
          }
        );
    }
  }

  private isRowChecked(rowId: any) {
    if (!this.rowCheckedAll) {
      return this.checkedRowIds.indexOf(rowId) >= 0 ? true : false;
    } else {
      return this.uncheckedRowIds.indexOf(rowId) >= 0 ? false : true;
    }
  }

  rowCheckBoxChecked(event: any, row: any) {
    let rowId: any = row._id;
    let checkbox: any = document.querySelectorAll(
      '[data-checkbox-id="' + rowId + '"]'
    );

    if (checkbox.length > 0) {
      if (checkbox[0].checked) {
        this.uncheckedRowIds.splice(this.uncheckedRowIds.indexOf(rowId), 1);
        if (!this.rowCheckedAll) {
          this.checkedRowIds.push(rowId);
        }
      } else {
        this.checkedRowIds.splice(this.checkedRowIds.indexOf(rowId), 1);
        if (this.rowCheckedAll) {
          this.uncheckedRowIds.push(rowId);
        }
      }
    }
  }

  allRowsCheckboxChecked(event: any) {
    if (this.rowCheckedAll) {
      this.uncheckedRowIds.length = 0;
      this.rowCheckedAll = false;
    } else {
      this.checkedRowIds.length = 0;
      this.rowCheckedAll = true;
    }

    $('#my-datatable')
      .dataTable()
      .api()
      .ajax.reload(function (json) {}, false);
  }

  fetchCompanyUserDetails(company_id: any) {
    return new Promise((resolve, reject) => {
      this.spinner.show();
      this.adminService
        .fetchCompanyUserDetails({
          company_id: company_id,
        })
        .subscribe(
          (res) => {
            this.spinner.hide();

            if (res.status == 'success') {
              resolve(res.company);
            } else {
              this.toastr.error(res.message);
              resolve(false);
            }
          },
          (err) => {
            this.spinner.hide();
            this.toastr.error(
              'Internal server error occured. Please try again later.'
            );
            resolve(false);
          }
        );
    });
  }

  async initCreditStatusUpdate(company_id: any, type: any) {
    let company_details: any = await this.fetchCompanyUserDetails(company_id);
    if (company_details) {
      Global.resetForm(this.customerCreditForm);

      this.customerCreditForm.patchValue({
        type: type,
        company_id: company_id,
        credit_bal: company_details.credit_stat ?? 0,
      });

      $('#creditUpdateModalButton')?.click();
    }
  }

  async initUserSuspension(company_id: any) {
    let company_details: any = await this.fetchCompanyUserDetails(company_id);
    if (company_details) {
      let operation = 'active';
      let swalmessage =
        'Are you sure, you want to activate ' +
        company_details.establishment_name +
        '?';
      if (company_details.suspension == 'active') {
        operation = 'input_suspended';
        swalmessage =
          'Are you sure, you want to suspend ' +
          company_details.establishment_name +
          '?';
      }

      swal
        .fire({
          title: 'Please Confirm',
          text: swalmessage,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Yes, Proceed',
          cancelButtonText: 'Cancel',
        })
        .then((result) => {
          if (result.value) {
            this.spinner.show();
            this.adminService
              .updateCompanySuspensionStatus({
                company_id: company_details._id,
                update_type: operation,
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

                  this.spinner.hide();
                },
                (err) => {
                  this.toastr.error(Global.showServerErrorMessage(err));
                  this.spinner.hide();
                }
              );
          }
        });
    }
  }

  async initCompanyStatus(company_id: any) {
    let company_details: any = await this.fetchCompanyUserDetails(company_id);
    if (company_details) {
      let operation = 'active';
      let swalmessage =
        'Are you sure, you want to activate ' +
        company_details.establishment_name +
        '?';
      if (company_details.status == 'active') {
        operation = 'deactivated';
        swalmessage =
          'Are you sure, you want to deactivate ' +
          company_details.establishment_name +
          '?';
      }

      swal
        .fire({
          title: 'Please Confirm',
          text: swalmessage,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Yes, Proceed',
          cancelButtonText: 'Cancel',
        })
        .then((result) => {
          if (result.value) {
            this.spinner.show();
            this.adminService
              .updateCompanyStatus({
                company_id: company_details._id,
                update_type: operation,
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

                  this.spinner.hide();
                },
                (err) => {
                  this.toastr.error(Global.showServerErrorMessage(err));
                  this.spinner.hide();
                }
              );
          }
        });
    }
  }

  updateCompanyCredit(event: any) {
    if (this.customerCreditForm.valid) {
      switch (this.customerCreditForm.value.type) {
        case 'deduct':
          if (
            this.customerCreditForm.value.amount >
            this.customerCreditForm.value.credit_bal
          ) {
            this.toastr.error('Insuffiecient wallet balance in company wallet');
            return;
          }
          break;

        case 'credit':
          break;

        default:
          this.toastr.error('Invalid operation request received');
          return;
      }

      event.target.classList.add('btn-loading');
      this.adminService
        .updateCompanyUserCredit({
          company_id: this.customerCreditForm.value.company_id,
          update_amount: this.customerCreditForm.value.amount,
          update_type: this.customerCreditForm.value.type,
        })
        .subscribe(
          (res) => {
            if (res.status == 'success') {
              $('#my-datatable')
                .dataTable()
                .api()
                .ajax.reload(function (json) {}, false);
              $('#creditUpdateModal').find('[data-dismiss="modal"]').click();
              this.toastr.success(res.message);
            } else if (res.status == 'val_err') {
              this.toastr.error(Global.showValidationMessage(res.val_msg));
            } else {
              this.toastr.error(res.message);
            }

            this.spinner.hide();
            event.target.classList.remove('btn-loading');
          },
          (err) => {
            this.spinner.hide();
            this.toastr.error(
              'Internal server error occured. Please try again later.'
            );
            event.target.classList.remove('btn-loading');
          }
        );
    }
  }

  async initUserHoldCredit(company_id: any) {
    let company_details: any = await this.fetchCompanyUserDetails(company_id);
    if (company_details) {
      // console.log(company_details);
      Global.resetForm(this.customerHoldCreditForm);

      this.customerHoldCreditForm.patchValue({
        company_id: company_id,
        hold_bal: company_details.hold_credit ?? 0,
      });

      $('#creditHoldUpdateModalButton')?.click();
    }
  }

  async fetchPlans() {
    try {
      let res = await this.adminService
        .fetchSubscriptionPlans({
          pageno: 1,
        })
        .toPromise();
      if (res.status !== 'success') throw res;
      return res?.plans?.docs;
    } catch (err) {
      throw err;
    }
  }

  updateCompanyHoldCredit(event: any) {
    if (this.customerHoldCreditForm.valid) {
      switch (this.customerHoldCreditForm.value.type?.value) {
        case 'release':
          if (
            this.customerHoldCreditForm.value.amount >
            this.customerHoldCreditForm.value.hold_bal
          ) {
            this.toastr.error(
              'Insuffiecient hold credit balance in company wallet'
            );
            return;
          }
          break;

        case 'hold':
          break;

        default:
          this.toastr.error('Invalid operation request received');
          return;
      }

      event.target.classList.add('btn-loading');
      this.adminService
        .updateCompanyUserHoldCredit({
          company_id: this.customerHoldCreditForm.value.company_id,
          update_amount: this.customerHoldCreditForm.value.amount,
          update_type: this.customerHoldCreditForm.value.type?.value ?? '',
        })
        .subscribe(
          (res) => {
            if (res.status == 'success') {
              $('#my-datatable')
                .dataTable()
                .api()
                .ajax.reload(function (json) {}, false);
              $('#creditHoldUpdateModal')
                .find('[data-dismiss="modal"]')
                .click();
              this.toastr.success(res.message);
            } else if (res.status == 'val_err') {
              this.toastr.error(Global.showValidationMessage(res.val_msg));
            } else {
              this.toastr.error(res.message);
            }

            this.spinner.hide();
            event.target.classList.remove('btn-loading');
          },
          (err) => {
            this.spinner.hide();
            this.toastr.error(
              'Internal server error occured. Please try again later.'
            );
            event.target.classList.remove('btn-loading');
          }
        );
    }
  }

  planListing: any[] = [];
  async initUserChangePlan(data: any) {
    try {
      // this.planListing = await this.fetchPlans();
      await this.fetchMaster();
      $('#companyPlanUpdateModalButton')?.click();

      if (this.planMaster.length) {
        
        this.companyPlan.patchValue({
          plan_id: this.planMaster.find((plan) => plan.id == data.plan_id),
          company_id: data.company_id,
        });
      }
    } catch (err: any) {
      this.toastr.error(err);
    }
  }

  companyPlan: FormGroup = new FormGroup({
    plan_id: new FormControl('', Validators.required),
    company_id: new FormControl('', Validators.required),
  });

  async changeCompanyPlan(e: any, modalClose: any) {
    try {
      if (this.companyPlan.invalid) return;
      let res = await this.adminService
        .changeCompanyPlan({
          plan_id:this.companyPlan.value.plan_id.id,
          company_id:this.companyPlan.value.company_id
        })
        .toPromise();
      if (res.status !== 'success') throw res;
      modalClose.click();
      $('#my-datatable')
      .dataTable()
      .api()
      .ajax.reload(function (json) {}, false);
    } catch (err: any) {
      this.toastr.error(err);
    }
  }

  anyRowsChecked(): boolean {
    return (
      this.rowCheckedAll == true ||
      this.checkedRowIds.length > 0 ||
      this.uncheckedRowIds.length > 0
    );
  }

  async exportCompanies(){
    try {
      if(!this.anyRowsChecked) return;
      const payload = {
        pageno:1,
        row_checked_all: this.rowCheckedAll,
        checked_row_ids: JSON.stringify(this.checkedRowIds),
        unchecked_row_ids: JSON.stringify(this.uncheckedRowIds),
        generate:"excel"        
      }

      await this.adminService.downloadFile('get_company_list', 'companies-list',payload)
    } catch (err:any) {
      this.toastr.error(err.message ?? err)
    }
  }
}
