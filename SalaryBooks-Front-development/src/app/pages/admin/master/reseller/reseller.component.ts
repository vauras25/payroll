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
  selector: 'admin-app-reseller',
  templateUrl: './reseller.component.html',
  styleUrls: ['./reseller.component.css']
})
export class ADResellerComponent implements OnInit {
  dtOptions: DataTables.Settings = {};
  resellerForm: UntypedFormGroup;
  editActionId: String;
  branchMaster: any[];
  subSellerMaster: any[];
  stateMaster: any[];
  cityMaster: any[];
  bankAccountTypeMaster: any[];

  constructor(
    public formBuilder: UntypedFormBuilder,
    private titleService: Title,
    private toastr: ToastrService,
    private router: Router,
    private adminService: AdminService,
    private spinner: NgxSpinnerService
  ) {
    this.resellerForm = formBuilder.group({
      reseller_name: [null, Validators.compose([Validators.required])],
      reseller_of: [null],
      branch_id: [null, Validators.compose([Validators.required])],
      address: [null, Validators.compose([Validators.required])],
      state: [null, Validators.compose([Validators.required])],
      city: [null, Validators.compose([Validators.required])],
      bank_details: [null, Validators.compose([])],
      bank_name: [null, Validators.compose([])],
      bank_beneficiary: [null, Validators.compose([])],
      bank_ifsc: [null, Validators.compose([])],
      bank_acc_no: [null, Validators.compose([Validators.pattern("^[0-9]*$")])],
      bank_acc_type: [null, Validators.compose([])],
      pan_no: [null, Validators.compose([Validators.required, Validators.pattern("^([a-zA-Z]){5}([0-9]){4}([a-zA-Z]){1}?$")])],
      gst_no: [null, Validators.compose([Validators.required])],

      // aadharcard_no: [null, Validators.compose([Validators.required, Validators.pattern("^[0-9]*$"), Validators.minLength(12), Validators.maxLength(12)])],
      // pincode: [null, Validators.compose([Validators.required, Validators.pattern("^[0-9]*$"), Validators.minLength(6), Validators.maxLength(6)])],
    });

    this.editActionId = '';
    this.branchMaster = [];
    this.subSellerMaster = [];
    this.stateMaster = [];
    this.cityMaster = [];

    this.bankAccountTypeMaster = [
      { value: "Current account", description: "Current account" },
      { value: "Savings account", description: "Savings account" },
      { value: "Salary account", description: "Salary account" },
      { value: "Fixed deposit account", description: "Fixed deposit account" },
      { value: "Recurring deposit account", description: "Recurring deposit account" },
      { value: "NRI accounts", description: "NRI accounts" },
    ];
  }

  ngOnInit() {
    this.titleService.setTitle("Reseller - " + Global.AppName);

    this.fetch();
    this.fetchStateMaster();
  }

  fetchStateMaster() {
    this.adminService.fetchStateCityMaster().subscribe(res => {
      if (res.status == 'success') {
        let states = res.state_list[0].states;
        this.stateMaster = [];
        for (const key in states) {
          if (Object.prototype.hasOwnProperty.call(states, key)) {
            const element = states[key];
            this.stateMaster.push({ "id": element.id, "description": element.name, "cities": element.cities });
          }
        }
      } else {
        this.toastr.error(res.message);
      }
    }, (err) => {
      this.toastr.error("Internal server error occured. Please try again later.");
    });
  }

  stateChanged(event: any) {
    let state = this.resellerForm.value.state;
    this.cityMaster = [];

    if (Object.keys(state).length == 0) {
      return;
    }

    let cities = state.cities;
    for (const key in cities) {
      if (Object.prototype.hasOwnProperty.call(cities, key)) {
        const element = cities[key];
        this.cityMaster.push({ "id": element.id, "description": element.name });
      }
    }
  }

  fetch() {
    this.dtOptions = {
      ajax: (dataTablesParameters: any, callback) => {
        const nextPage = Math.floor((dataTablesParameters.start + dataTablesParameters.length) / dataTablesParameters.length);
        this.adminService.fetchRellers({
          pageno:nextPage ?? 1,
          perpage: dataTablesParameters.length,
          // 'pageno': Math.floor((dataTablesParameters.start + dataTablesParameters.length) / dataTablesParameters.length), 'perpage': dataTablesParameters.length,
          'searchkey': dataTablesParameters.search.value,
          'sortbyfield': Global.getTableSortingOptions('sortbyfield', dataTablesParameters),
          'ascdesc': Global.getTableSortingOptions('ascdesc', dataTablesParameters)
        }).subscribe(res => {
          if (res.status == 'success') {
            this.branchMaster = [];
            for (const key in res.masters.branch) {
              if (Object.prototype.hasOwnProperty.call(res.masters.branch, key)) {
                const element = res.masters.branch[key];
                this.branchMaster.push({ "id": element._id, "description": element.branch_name });
              }
            }

            this.subSellerMaster = [];
            for (const key in res.masters.reseller_of) {
              if (Object.prototype.hasOwnProperty.call(res.masters.reseller_of, key)) {
                const element = res.masters.reseller_of[key];
                this.subSellerMaster.push({ "id": element._id, "description": element.reseller_name });
              }
            }

            callback({
              recordsTotal: res.resellers.totalDocs,
              recordsFiltered: res.resellers.totalDocs,
              data: res.resellers.docs,
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
            return `<button class="btn btn-primary btn-icon mx-1" data-toggle="tooltip" data-placement="top" title="Edit" id="editButton-` + meta.row + `">
                        <div style="width:25px; height:25px;"><i class="fa fa-pen"></i></div>
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
            return full.reseller_name;
          },
          orderable: true,
          name: 'reseller_name',
        },
        {
          render: function (data, type, full, meta) {
            return full.corporate_id;
          },
          orderable: true,
          name: 'corporate_id',
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
        {
          render: function (data, type, full, meta) {
            if (full.reseller.length > 0) {
              let html: any = '';

              full.reseller.forEach((element: any) => {
                html += element.reseller_name + `<br>`;
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
            return full.address;
          },
          orderable: true,
          name: 'address',
        },
        {
          render: function (data, type, full, meta) {
            return full.state;
          },
          orderable: true,
          name: 'state',
        },
        {
          render: function (data, type, full, meta) {
            return full.city;
          },
          orderable: true,
          name: 'city',
        },
        {
          render: function (data, type, full, meta) {
            return full.pan_no;
          },
          className: "text-uppercase",
          orderable: true,
          name: 'pan_no',
        },
        {
          render: function (data, type, full, meta) {
            return full.gst_no;
          },
          className: "text-uppercase",
          orderable: true,
          name: 'gst_no',
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

        return row;
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
        search: ""
      }
    };
  }

  getEdit(item: any) {
    this.spinner.show();

    this.adminService.getResellerDetails({
      'reseller_id': item._id
    }).subscribe(res => {
      if (res.status == 'success') {
        let reseller_of = null;
        if (res.reseller.reseller_of != "NULL") {
          reseller_of = this.subSellerMaster.find(obj => {
            return obj.id === res.reseller.reseller_of
          });
        }

        let branch_id = this.branchMaster.find(obj => {
          return obj.id === res.reseller.branch_id
        });

        let state = this.stateMaster.find(obj => {
          return obj.description === res.reseller.state
        });

        let city = null;
        if (state) {
          let cities = state.cities;
          for (const key in cities) {
            if (Object.prototype.hasOwnProperty.call(cities, key)) {
              const element = cities[key];
              this.cityMaster.push({ "id": element.id, "description": element.name });
            }
          }

          city = this.cityMaster.find(obj => {
            return obj.description === res.reseller.city
          });
        } else {
          state = null
        }

        if (res.reseller.status == 'active') { $('.reseller-status-name').addClass("on"); }
        else { $('.reseller-status-name').removeClass("on"); }

        this.editActionId = res.reseller._id;
        this.resellerForm.setValue({
          reseller_name: res.reseller.reseller_name,
          reseller_of: reseller_of,
          branch_id: branch_id,
          address: res.reseller.address,
          state: state,
          city: city,
          bank_details: res.reseller.bank_details,
          bank_name: res.reseller.bank_name,
          bank_beneficiary: res.reseller.bank_beneficiary,
          bank_ifsc: res.reseller.bank_ifsc,
          bank_acc_no: res.reseller.bank_acc_no,
          bank_acc_type: this.bankAccountTypeMaster.find((obj: any) => {
            return obj.value == res.reseller.bank_acc_type
          }) ?? null,
          pan_no: res.reseller.pan_no,
          gst_no: res.reseller.gst_no,
        });

        $('html, body').animate({
          'scrollTop': $("#reseller-submit-section").position().top
        });
      } else {
        this.toastr.error(res.message);
      }
      this.spinner.hide();
    }, (err) => {
      this.toastr.error("Internal server error occured. Please try again later.");
      this.spinner.hide();
    });
  }

  cancelEdit() {
    this.editActionId = '';
    this.resellerForm.reset();

    for (const key in this.resellerForm.controls) {
      if (Object.prototype.hasOwnProperty.call(this.resellerForm.controls, key)) {
        const element = this.resellerForm.controls[key];

        element.markAsUntouched();
        element.markAsPristine();
      }
    }

    $('.reseller-status-name').addClass("on");
  }

  create(event: any) {
    if (this.resellerForm.valid) {
      event.target.classList.add('btn-loading');
      let reseller_status = ($('.reseller-status-name').hasClass('on') == true) ? 'active' : 'inactive'

      this.adminService.createReseller({
        'reseller_name': this.resellerForm.value.reseller_name,
        'reseller_of': this.resellerForm.value.reseller_of.id,
        'branch_id': this.resellerForm.value.branch_id.id,
        'address': this.resellerForm.value.address,
        'state': this.resellerForm.value.state.description,
        'city': this.resellerForm.value.city.description,
        'bank_details': this.resellerForm.value.bank_details,
        'bank_name': this.resellerForm.value.bank_name,
        'bank_beneficiary': this.resellerForm.value.bank_beneficiary,
        'bank_ifsc': this.resellerForm.value.bank_ifsc,
        'bank_acc_no': this.resellerForm.value.bank_acc_no,
        'bank_acc_type': this.resellerForm.value.bank_acc_type?.value ?? null,
        'pan_no': this.resellerForm.value.pan_no,
        'gst_no': this.resellerForm.value.gst_no,
        'status': reseller_status,
      }).subscribe(res => {
        if (res.status == 'success') {
          this.toastr.success(res.message);
          this.resellerForm.reset();
          $('.reseller-status-name').addClass("on");
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
    // console.log(item);
    swal.fire({
      title: 'Are you sure want to remove?',
      text: 'You will not be able to recover this data!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'No, keep it'
    }).then((result) => {
      if (result.value) {
        this.adminService.deleteReseller({
          'reseller_id': item._id,
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

  update(event: any) {
    if (this.resellerForm.valid) {
      event.target.classList.add('btn-loading');
      let reseller_status = ($('.reseller-status-name').hasClass('on') == true) ? 'active' : 'inactive'

      this.adminService.updateReseller({
        'reseller_id': this.editActionId,
        'reseller_name': this.resellerForm.value.reseller_name,
        'reseller_of': this.resellerForm.value.reseller_of.id,
        'branch_id': this.resellerForm.value.branch_id.id,
        'address': this.resellerForm.value.address,
        'state': this.resellerForm.value.state.description,
        'city': this.resellerForm.value.city.description,
        'bank_details': this.resellerForm.value.bank_details,
        'bank_name': this.resellerForm.value.bank_name,
        'bank_beneficiary': this.resellerForm.value.bank_beneficiary,
        'bank_ifsc': this.resellerForm.value.bank_ifsc,
        'bank_acc_no': this.resellerForm.value.bank_acc_no,
        'bank_acc_type': this.resellerForm.value.bank_acc_type?.value ?? null,
        'pan_no': this.resellerForm.value.pan_no,
        'gst_no': this.resellerForm.value.gst_no,
        'status': reseller_status,
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
}

