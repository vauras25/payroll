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
  selector: 'admin-app-esic-rules',
  templateUrl: './esic-rules.component.html',
  styleUrls: ['./esic-rules.component.css']
})
export class ADEsicRulesComponent implements OnInit {
  dtOptions: DataTables.Settings = {};
  dtOptionsHistory: DataTables.Settings = {};

  esicRuleForm: UntypedFormGroup;
  monthMaster: any;
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
    this.esicRuleForm = formBuilder.group({
      circular_no: [null, Validators.compose([Validators.required])],
      wage_ceiling: [null, Validators.compose([Validators.required, Validators.pattern("^[0-9]+(.[0-9]{0,2})?$")])],
      round_off: [null, [Validators.required]],
      employer_contribution: [null, Validators.compose([Validators.required, Validators.pattern("^[0-9]+(.[0-9]{0,2})?$")])],
      employee_contribution: [null, Validators.compose([Validators.required, Validators.pattern("^[0-9]+(.[0-9]{0,2})?$")])],
      effective_date: [null, [Validators.required]],
      contribution_period_a_from: [null, [Validators.required]],
      contribution_period_a_to: [null, [Validators.required]],
      contribution_period_b_from: [null, [Validators.required]],
      contribution_period_b_to: [null, [Validators.required]],
    });

    this.monthMaster = [
      { 'id': 1, 'description': 'January' },
      { 'id': 2, 'description': 'February' },
      { 'id': 3, 'description': 'March' },
      { 'id': 4, 'description': 'April' },
      { 'id': 5, 'description': 'May' },
      { 'id': 6, 'description': 'June' },
      { 'id': 7, 'description': 'July' },
      { 'id': 8, 'description': 'August' },
      { 'id': 9, 'description': 'September' },
      { 'id': 10, 'description': 'October' },
      { 'id': 11, 'description': 'November' },
      { 'id': 12, 'description': 'December' },
    ];

    this.editActionId = '';
  }

  ngOnInit() {
    this.titleService.setTitle("ESIC Rule - " + Global.AppName);
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
            return full.employer_contribution + '%';
          }
        },
        {
          render: function (data, type, full, meta) {
            return full.employee_contribution + '%';
          }
        },
        {
          render: function (data, type, full, meta) {
            return full.wage_ceiling;
          }
        },
        {
          render: function (data, type, full, meta) {
            let month = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

            return `Period A ` + month[full.contribution_period_a_from - 1] + ` to ` + month[full.contribution_period_a_to - 1] + ` <br>Period B ` + month[full.contribution_period_b_from - 1] + ` to ` + month[full.contribution_period_b_to - 1];
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
        this.adminService.fetchEsicRules({
          pageno:nextPage ?? 1,
          perpage: dataTablesParameters.length,
          // 'pageno': Math.floor((dataTablesParameters.start + dataTablesParameters.length) / dataTablesParameters.length), 'perpage': dataTablesParameters.length,
          'searchkey': dataTablesParameters.search.value,
          'sortbyfield': Global.getTableSortingOptions('sortbyfield', dataTablesParameters),
          'ascdesc': Global.getTableSortingOptions('ascdesc', dataTablesParameters)
        }).subscribe(res => {
          if (res.status == 'success') {
            callback({
              recordsTotal: res.esic.totalDocs,
              recordsFiltered: res.esic.totalDocs,
              data: res.esic.docs,
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
          name: 'updated_at'
        },
        {
          render: function (data, type, full, meta) {
            var datePipe = new DatePipe("en-US");
            let value = datePipe.transform(full.effective_date, 'dd/MM/yyyy');
            return value;
          },
          orderable: true,
          name: 'updated_at'
        },
        {
          render: function (data, type, full, meta) {
            return full.employer_contribution + '%';
          },
          orderable: true,
          name: 'updated_at'
        },
        {
          render: function (data, type, full, meta) {
            return full.employee_contribution + '%';
          },
          orderable: true,
          name: 'updated_at'
        },
        {
          render: function (data, type, full, meta) {
            return full.wage_ceiling;
          },
          orderable: true,
          name: 'updated_at'
        },
        {
          render: function (data, type, full, meta) {
            let month = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

            return `Period A ` + month[full.contribution_period_a_from - 1] + ` to ` + month[full.contribution_period_a_to - 1] + ` <br>Period B ` + month[full.contribution_period_b_from - 1] + ` to ` + month[full.contribution_period_b_to - 1];
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

        $("table").on('click', '#historyButton-' + index, function () {
          self.showUpdateHistory(data);
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
    let contribution_period_a_from = this.monthMaster.find((obj: any) => {
      return obj.id == item.contribution_period_a_from
    });

    let contribution_period_a_to = this.monthMaster.find((obj: any) => {
      return obj.id == item.contribution_period_a_to
    });

    let contribution_period_b_from = this.monthMaster.find((obj: any) => {
      return obj.id == item.contribution_period_b_from
    });

    let contribution_period_b_to = this.monthMaster.find((obj: any) => {
      return obj.id == item.contribution_period_b_to
    });

    this.editActionId = item._id;
    this.esicRuleForm.setValue({
      circular_no: item.circular_no,
      wage_ceiling: item.wage_ceiling,
      round_off: item.round_off,
      employer_contribution: item.employer_contribution,
      employee_contribution: item.employee_contribution,
      effective_date: this.datePipe.transform(item.effective_date, 'MM/dd/YYYY'),
      contribution_period_a_from: contribution_period_a_from,
      contribution_period_a_to: contribution_period_a_to,
      contribution_period_b_from: contribution_period_b_from,
      contribution_period_b_to: contribution_period_b_to,
    });

    $('html, body').animate({
      'scrollTop': $("#esic-submit-section").position().top
    });

    this.initialValueBeforeUpdate = {
      'esic_id': this.editActionId,
      'circular_no': this.esicRuleForm.value.circular_no.toString().trim(),
      'wage_ceiling': this.esicRuleForm.value.wage_ceiling.toString().trim(),
      'round_off': this.esicRuleForm.value.round_off.toString().trim(),
      'employer_contribution': this.esicRuleForm.value.employer_contribution.toString().trim(),
      'employee_contribution': this.esicRuleForm.value.employee_contribution.toString().trim(),
      'effective_date': this.datePipe.transform(this.esicRuleForm.value.effective_date, 'Y-MM-dd'),
      'contribution_period_a_from': this.esicRuleForm.value.contribution_period_a_from.id,
      'contribution_period_a_to': this.esicRuleForm.value.contribution_period_a_to.id,
      'contribution_period_b_from': this.esicRuleForm.value.contribution_period_b_from.id,
      'contribution_period_b_to': this.esicRuleForm.value.contribution_period_b_to.id,
    };
  }

  cancelEdit() {
    this.editActionId = '';
    this.esicRuleForm.reset();

    for (const key in this.esicRuleForm.controls) {
      if (Object.prototype.hasOwnProperty.call(this.esicRuleForm.controls, key)) {
        const element = this.esicRuleForm.controls[key];

        element.markAsUntouched();
        element.markAsPristine();
      }
    }
  }

  create(event: any) {
    if (this.esicRuleForm.valid) {
      event.target.classList.add('btn-loading');

      this.adminService.createEsicRule({
        'circular_no': this.esicRuleForm.value.circular_no,
        'wage_ceiling': this.esicRuleForm.value.wage_ceiling,
        'round_off': this.esicRuleForm.value.round_off,
        'employer_contribution': this.esicRuleForm.value.employer_contribution,
        'employee_contribution': this.esicRuleForm.value.employee_contribution,
        'effective_date': this.datePipe.transform(this.esicRuleForm.value.effective_date, 'Y-MM-dd'),
        'contribution_period_a_from': this.esicRuleForm.value.contribution_period_a_from.id,
        'contribution_period_a_to': this.esicRuleForm.value.contribution_period_a_to.id,
        'contribution_period_b_from': this.esicRuleForm.value.contribution_period_b_from.id,
        'contribution_period_b_to': this.esicRuleForm.value.contribution_period_b_to.id,
      }).subscribe(res => {
        if (res.status == 'success') {
          this.toastr.success(res.message);
          // this.esicRuleForm.reset();
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
        this.adminService.deleteEsicRule({
          'esic_id': item._id,
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
    if (this.esicRuleForm.valid) {
      const documentUpdate = {
        'esic_id': this.editActionId,
        'circular_no': this.esicRuleForm.value.circular_no.toString().trim(),
        'wage_ceiling': this.esicRuleForm.value.wage_ceiling.toString().trim(),
        'round_off': this.esicRuleForm.value.round_off.toString().trim(),
        'employer_contribution': this.esicRuleForm.value.employer_contribution.toString().trim(),
        'employee_contribution': this.esicRuleForm.value.employee_contribution.toString().trim(),
        'effective_date': this.datePipe.transform(this.esicRuleForm.value.effective_date, 'Y-MM-dd'),
        'contribution_period_a_from': this.esicRuleForm.value.contribution_period_a_from.id,
        'contribution_period_a_to': this.esicRuleForm.value.contribution_period_a_to.id,
        'contribution_period_b_from': this.esicRuleForm.value.contribution_period_b_from.id,
        'contribution_period_b_to': this.esicRuleForm.value.contribution_period_b_to.id,
      };

      if (JSON.stringify(documentUpdate) === JSON.stringify(this.initialValueBeforeUpdate)) {
        this.toastr.warning("No change detected to update");
        return;
      }

      event.target.classList.add('btn-loading');

      this.adminService.updateEsicRule(
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
