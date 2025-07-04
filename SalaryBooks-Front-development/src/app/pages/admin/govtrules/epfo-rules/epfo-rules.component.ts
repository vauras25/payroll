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
  selector: 'admin-app-epfo-rules',
  templateUrl: './epfo-rules.component.html',
  styleUrls: ['./epfo-rules.component.css']
})
export class ADEpfoRulesComponent implements OnInit {
  dtOptions: DataTables.Settings = {};
  dtOptionsHistory: DataTables.Settings = {};

  epfoRuleForm: UntypedFormGroup;
  editActionId: String;
  viewRuleDetails: any = null;
  initialValueBeforeUpdate: any = null;

  constructor(
    public formBuilder: UntypedFormBuilder,
    private titleService: Title,
    private toastr: ToastrService,
    private router: Router,
    private adminService: AdminService,
    private spinner: NgxSpinnerService,
    private datePipe: DatePipe
  ) {
    this.epfoRuleForm = formBuilder.group({
      circular_no: [null, Validators.compose([Validators.required])],
      pf_employer_contribution: [null, Validators.compose([Validators.required, Validators.pattern("^[0-9]+(.[0-9]{0,2})?$")])],
      total_employer_contribution: [null, Validators.compose([Validators.required, Validators.pattern("^[0-9]+(.[0-9]{0,2})?$")])],
      pf_employee_contribution: [null, Validators.compose([Validators.required, Validators.pattern("^[0-9]+(.[0-9]{0,2})?$")])],
      total_employee_contribution: [null, Validators.compose([Validators.required, Validators.pattern("^[0-9]+(.[0-9]{0,2})?$")])],
      pension_employer_contribution: [null, Validators.compose([Validators.required, Validators.pattern("^[0-9]+(.[0-9]{0,2})?$")])],
      pension_employer_contribution_restrict: [false],
      retirement_age: [null, Validators.compose([Validators.required, Validators.pattern("^[0-9]+(.[0-9]{0,2})?$")])],
      edli_employer_contribution: [null, Validators.compose([Validators.required, Validators.pattern("^[0-9]+(.[0-9]{0,2})?$")])],
      edli_employer_contribution_restrict: [false],
      wage_ceiling: [null, Validators.compose([Validators.required, Validators.pattern("^[0-9]+(.[0-9]{0,2})?$")])],
      admin_charges: [null, Validators.compose([Validators.required, Validators.pattern("^[0-9]+(.[0-9]{0,2})?$")])],
      admin_charges_restrict: [false],
      minimum_admin_charges: [null, Validators.compose([Validators.required, Validators.pattern("^[0-9]+(.[0-9]{0,2})?$")])],
      edli_admin_charges: [null, Validators.compose([Validators.required, Validators.pattern("^[0-9]+(.[0-9]{0,2})?$")])],
      edli_admin_charges_restrict: [false],
      round_off: [null, [Validators.required]],
      effective_date: [null, [Validators.required]],
    });

    this.editActionId = '';
  }

  ngOnInit() {
    this.titleService.setTitle("EPFO Rule - " + Global.AppName);
    this.fetch();

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
            return full.circular_no;
          }
        },
        {
          render: function (data, type, full, meta) {
            var datePipe = new DatePipe("en-US");
            let value = datePipe.transform(full.effective_date, 'dd/MM/yyyy');
            return value;
          }
        },
        {
          render: function (data, type, full, meta) {
            return full.pf_employer_contribution + '%';
          }
        },
        {
          render: function (data, type, full, meta) {
            return full.pension_employer_contribution + '%';
          }
        },
        {
          render: function (data, type, full, meta) {
            return full.pf_employee_contribution + '%';
          }
        },
        {
          render: function (data, type, full, meta) {
            return full.edli_employer_contribution + '%';
          }
        },
        {
          render: function (data, type, full, meta) {
            return full.edli_admin_charges + '%';
          }
        },
        {
          render: function (data, type, full, meta) {
            return full.admin_charges;
          }
        },
        {
          render: function (data, type, full, meta) {
            return full.minimum_admin_charges;
          }
        },
        {
          render: function (data, type, full, meta) {
            return full.retirement_age;
          }
        },
        {
          render: function (data, type, full, meta) {
            return full.wage_ceiling;
          }
        },
        {
          render: function (data, type, full, meta) {
            return full.total_employer_contribution;
          }
        },
        {
          render: function (data, type, full, meta) {
            return full.total_employee_contribution;
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

  fetch() {
    this.dtOptions = {
      ajax: (dataTablesParameters: any, callback) => {
        const nextPage = Math.floor((dataTablesParameters.start + dataTablesParameters.length) / dataTablesParameters.length);
        this.adminService.fetchEpfoRules({
          pageno:nextPage ?? 1,
          perpage: dataTablesParameters.length,
          // 'pageno': Math.floor((dataTablesParameters.start + dataTablesParameters.length) / dataTablesParameters.length), 'perpage': dataTablesParameters.length,
          'searchkey': dataTablesParameters.search.value,
          'sortbyfield': Global.getTableSortingOptions('sortbyfield', dataTablesParameters),
          'ascdesc': Global.getTableSortingOptions('ascdesc', dataTablesParameters)
        }).subscribe(res => {
          if (res.status == 'success') {
            callback({
              recordsTotal: res.epfo.totalDocs,
              recordsFiltered: res.epfo.totalDocs,
              data: res.epfo.docs,
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
            var datePipe = new DatePipe("en-US");
            let value = datePipe.transform(full.updated_at, 'dd/MM/yyyy');
            return value;
          },
          orderable: true,
          name: 'updated_at'
        },
        {
          render: function (data, type, full, meta) {
            return full.circular_no;
          },
          orderable: true,
          name: 'circular_no'
        },
        {
          render: function (data, type, full, meta) {
            var datePipe = new DatePipe("en-US");
            let value = datePipe.transform(full.effective_date, 'dd/MM/yyyy');
            return value;
          },
          orderable: true,
          name: 'effective_date'
        },
        {
          render: function (data, type, full, meta) {
            return full.pf_employer_contribution + '%';
          },
          orderable: true,
          name: 'pf_employer_contribution'
        },
        {
          render: function (data, type, full, meta) {
            return full.pension_employer_contribution + '%';
          },
          orderable: true,
          name: 'pension_employer_contribution'
        },
        {
          render: function (data, type, full, meta) {
            return full.pf_employee_contribution + '%';
          },
          orderable: true,
          name: 'pf_employee_contribution'
        },
        {
          render: function (data, type, full, meta) {
            return full.edli_employer_contribution + '%';
          },
          orderable: true,
          name: 'edli_employer_contribution'
        },
        {
          render: function (data, type, full, meta) {
            return full.edli_admin_charges + '%';
          },
          orderable: true,
          name: 'edli_admin_charges'
        },
        {
          render: function (data, type, full, meta) {
            return full.admin_charges;
          },
          orderable: true,
          name: 'admin_charges'
        },
        {
          render: function (data, type, full, meta) {
            return full.minimum_admin_charges;
          },
          orderable: true,
          name: 'minimum_admin_charges'
        },
        {
          render: function (data, type, full, meta) {
            return full.retirement_age;
          },
          orderable: true,
          name: 'retirement_age'
        },
        {
          render: function (data, type, full, meta) {
            return full.wage_ceiling;
          },
          orderable: true,
          name: 'wage_ceiling'
        },
        {
          render: function (data, type, full, meta) {
            return full.total_employer_contribution;
          },
          orderable: true,
          name: 'total_employer_contribution'
        },
        {
          render: function (data, type, full, meta) {
            return full.total_employee_contribution;
          },
          orderable: true,
          name: 'total_employee_contribution'
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

        // $('#changeStatusButton', row).bind('click', () => {
        //   self.changeStatus(data);
        // });
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
    this.epfoRuleForm.setValue({
      circular_no: item.circular_no,
      pf_employer_contribution: item.pf_employer_contribution,
      total_employer_contribution: item.total_employer_contribution,
      pf_employee_contribution: item.pf_employee_contribution,
      total_employee_contribution: item.total_employee_contribution,
      pension_employer_contribution: item.pension_employer_contribution,
      pension_employer_contribution_restrict: (item.pension_employer_contribution_restrict == 'yes') ? true : false,
      retirement_age: item.retirement_age,
      edli_employer_contribution: item.edli_employer_contribution,
      edli_employer_contribution_restrict: (item.edli_employer_contribution_restrict == 'yes') ? true : false,
      wage_ceiling: item.wage_ceiling,
      admin_charges: item.admin_charges,
      admin_charges_restrict: (item.admin_charges_restrict == 'yes') ? true : false,
      minimum_admin_charges: item.minimum_admin_charges,
      edli_admin_charges: item.edli_admin_charges,
      edli_admin_charges_restrict: (item.edli_admin_charges_restrict == 'yes') ? true : false,
      round_off: item.round_off,
      effective_date: this.datePipe.transform(item.effective_date, 'MM/dd/YYYY'),
    });

    this.initialValueBeforeUpdate = {
      'epfo_id': this.editActionId,
      'circular_no': this.epfoRuleForm.value.circular_no.toString().trim(),
      'pf_employer_contribution': this.epfoRuleForm.value.pf_employer_contribution.toString().trim(),
      'total_employer_contribution': this.epfoRuleForm.value.total_employer_contribution.toString().trim(),
      'pf_employee_contribution': this.epfoRuleForm.value.pf_employee_contribution.toString().trim(),
      'total_employee_contribution': this.epfoRuleForm.value.total_employee_contribution.toString().trim(),
      'pension_employer_contribution': this.epfoRuleForm.value.pension_employer_contribution.toString().trim(),
      'pension_employer_contribution_restrict': (this.epfoRuleForm.value.pension_employer_contribution_restrict == true) ? 'yes' : 'no',
      'retirement_age': this.epfoRuleForm.value.retirement_age.toString().trim(),
      'edli_employer_contribution': this.epfoRuleForm.value.edli_employer_contribution.toString().trim(),
      'edli_employer_contribution_restrict': (this.epfoRuleForm.value.edli_employer_contribution_restrict == true) ? 'yes' : 'no',
      'admin_charges': this.epfoRuleForm.value.admin_charges.toString().trim(),
      'admin_charges_restrict': (this.epfoRuleForm.value.admin_charges_restrict == true) ? 'yes' : 'no',
      'minimum_admin_charges': this.epfoRuleForm.value.minimum_admin_charges.toString().trim(),
      'edli_admin_charges': this.epfoRuleForm.value.edli_admin_charges.toString().trim(),
      'edli_admin_charges_restrict': (this.epfoRuleForm.value.edli_admin_charges_restrict == true) ? 'yes' : 'no',
      'effective_date': this.datePipe.transform(this.epfoRuleForm.value.effective_date, 'Y-MM-dd'),
      'wage_ceiling': this.epfoRuleForm.value.wage_ceiling.toString().trim(),
      'round_off': this.epfoRuleForm.value.round_off.toString().trim(),
    }

    $('html, body').animate({
      'scrollTop': $("#epfo-submit-section").position().top
    });
  }

  cancelEdit() {
    this.editActionId = '';
    this.epfoRuleForm.reset();

    for (const key in this.epfoRuleForm.controls) {
      if (Object.prototype.hasOwnProperty.call(this.epfoRuleForm.controls, key)) {
        const element = this.epfoRuleForm.controls[key];

        element.markAsUntouched();
        element.markAsPristine();
      }
    }
  }

  create(event: any) {
    if (this.epfoRuleForm.valid) {
      event.target.classList.add('btn-loading');

      this.adminService.createEpfoRule({
        'circular_no': this.epfoRuleForm.value.circular_no,
        'pf_employer_contribution': this.epfoRuleForm.value.pf_employer_contribution,
        'total_employer_contribution': this.epfoRuleForm.value.total_employer_contribution,
        'pf_employee_contribution': this.epfoRuleForm.value.pf_employee_contribution,
        'total_employee_contribution': this.epfoRuleForm.value.total_employee_contribution,
        'pension_employer_contribution': this.epfoRuleForm.value.pension_employer_contribution,
        'pension_employer_contribution_restrict': (this.epfoRuleForm.value.pension_employer_contribution_restrict == true) ? 'yes' : 'no',
        'retirement_age': this.epfoRuleForm.value.retirement_age,
        'edli_employer_contribution': this.epfoRuleForm.value.edli_employer_contribution,
        'edli_employer_contribution_restrict': (this.epfoRuleForm.value.edli_employer_contribution_restrict == true) ? 'yes' : 'no',
        'admin_charges': this.epfoRuleForm.value.admin_charges,
        'admin_charges_restrict': (this.epfoRuleForm.value.admin_charges_restrict == true) ? 'yes' : 'no',
        'minimum_admin_charges': this.epfoRuleForm.value.minimum_admin_charges,
        'edli_admin_charges': this.epfoRuleForm.value.edli_admin_charges,
        'edli_admin_charges_restrict': (this.epfoRuleForm.value.edli_admin_charges_restrict == true) ? 'yes' : 'no',
        'effective_date': this.datePipe.transform(this.epfoRuleForm.value.effective_date, 'Y-MM-dd'),
        'wage_ceiling': this.epfoRuleForm.value.wage_ceiling,
        'round_off': this.epfoRuleForm.value.round_off,
      }).subscribe(res => {
        if (res.status == 'success') {
          this.toastr.success(res.message);
          // this.epfoRuleForm.reset();
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
        this.adminService.deleteEpfoRule({
          'epfo_id': item._id,
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
    if (this.epfoRuleForm.valid) {
      const documentUpdate = {
        'epfo_id': this.editActionId,
        'circular_no': this.epfoRuleForm.value.circular_no.toString().trim(),
        'pf_employer_contribution': this.epfoRuleForm.value.pf_employer_contribution.toString().trim(),
        'total_employer_contribution': this.epfoRuleForm.value.total_employer_contribution.toString().trim(),
        'pf_employee_contribution': this.epfoRuleForm.value.pf_employee_contribution.toString().trim(),
        'total_employee_contribution': this.epfoRuleForm.value.total_employee_contribution.toString().trim(),
        'pension_employer_contribution': this.epfoRuleForm.value.pension_employer_contribution.toString().trim(),
        'pension_employer_contribution_restrict': (this.epfoRuleForm.value.pension_employer_contribution_restrict == true) ? 'yes' : 'no',
        'retirement_age': this.epfoRuleForm.value.retirement_age.toString().trim(),
        'edli_employer_contribution': this.epfoRuleForm.value.edli_employer_contribution.toString().trim(),
        'edli_employer_contribution_restrict': (this.epfoRuleForm.value.edli_employer_contribution_restrict == true) ? 'yes' : 'no',
        'admin_charges': this.epfoRuleForm.value.admin_charges.toString().trim(),
        'admin_charges_restrict': (this.epfoRuleForm.value.admin_charges_restrict == true) ? 'yes' : 'no',
        'minimum_admin_charges': this.epfoRuleForm.value.minimum_admin_charges.toString().trim(),
        'edli_admin_charges': this.epfoRuleForm.value.edli_admin_charges.toString().trim(),
        'edli_admin_charges_restrict': (this.epfoRuleForm.value.edli_admin_charges_restrict == true) ? 'yes' : 'no',
        'effective_date': this.datePipe.transform(this.epfoRuleForm.value.effective_date, 'Y-MM-dd'),
        'wage_ceiling': this.epfoRuleForm.value.wage_ceiling.toString().trim(),
        'round_off': this.epfoRuleForm.value.round_off.toString().trim(),
      };

      if (JSON.stringify(documentUpdate) === JSON.stringify(this.initialValueBeforeUpdate)) {
        this.toastr.warning("No change detected to update");
        return;
      }

      event.target.classList.add('btn-loading');

      this.adminService.updateEpfoRule(
        documentUpdate
      ).subscribe(res => {
        if (res.status == 'success') {
          this.toastr.success(res.message);
          this.initialValueBeforeUpdate = documentUpdate;
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

  showUpdateHistory(item: any) {
    this.viewRuleDetails = item;
    if (this.viewRuleDetails.history != null) {
      $('#history-datatable').dataTable().api().ajax.reload();
      $('#historymmodalbutton').click();
    } else {
      this.toastr.warning("No update history found to show")
    }
  }

  getUpdateHistory() {
    if (this.viewRuleDetails != null && this.viewRuleDetails.history != null && Array.isArray(this.viewRuleDetails.history)) {
      return this.viewRuleDetails.history;
    } else {
      return [];
    }
  }
}


