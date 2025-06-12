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
  selector: 'admin-app-gratuity-rules',
  templateUrl: './gratuity-rules.component.html',
  styleUrls: ['./gratuity-rules.component.css']
})
export class ADGratuityRulesComponent implements OnInit {
  dtOptions: DataTables.Settings = {};
  dtOptionsHistory: DataTables.Settings = {};

  gratuityRuleForm: UntypedFormGroup;
  editActionId: String;
  rulesMaster: any[];
  applicableMaster: any[];
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
    this.gratuityRuleForm = formBuilder.group({
      employee_no_rule: [null, Validators.compose([Validators.required])],
      employee_no: [null, Validators.compose([Validators.required, Validators.pattern("^[0-9]*$")])],
      employee_no_applicable: [null, Validators.compose([Validators.required])],
      service_year_no_rule: [null, Validators.compose([Validators.required])],
      service_year_no: [null, Validators.compose([Validators.required, Validators.pattern("^[0-9]*$")])],
      service_year_no_applicable: [null, Validators.compose([Validators.required])],
      fifth_year_atrendance_rule: [null, Validators.compose([Validators.required])],
      fifth_year_atrendance: [null, Validators.compose([Validators.required, Validators.pattern("^[0-9]*$")])],
      fifth_year_atrendance_applicable: [null, Validators.compose([Validators.required])],
      max_gratuity_anual_rule: [null, Validators.compose([Validators.required])],
      max_gratuity_anual: [null, Validators.compose([Validators.required, Validators.pattern("^[0-9]*$")])],
      max_gratuity_anual_applicable: [null, Validators.compose([Validators.required])],
      income_tax_applicable: [null, Validators.compose([Validators.required])],
      effective_date: [null, [Validators.required]],
    });

    this.editActionId = '';

    this.rulesMaster = [
      { id: 'greaterthanequal', description: 'Greater then equal (>=)' },
      { id: 'greater', description: 'Greater then (>)' },
      { id: 'less', description: 'Less then (<)' },
      { id: 'lessthanequal', description: 'Less then equal (<=)' },
      { id: 'equal', description: 'Equal (=)' },
      { id: 'none', description: 'None' },
    ];

    this.applicableMaster = [
      { id: 'yes', description: 'Applicable' },
      { id: 'no', description: 'Not Applicable' },
    ];
  }

  ngOnInit() {
    this.titleService.setTitle("Gratuity Rule - " + Global.AppName);
    this.fetch();

    this.dtOptionsHistory = {
      ajax: (dataTablesParameters: any, callback) => {
        var result = this.getUpdateHistory();

        // console.log(result);

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
            return full.corporate_id ?? 'N/A';
          },
          className: 'text-uppercase'
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
            let html = `<span class="badge badge-primary">`;

            switch (full.employee_no_rule) {
              case 'greaterthanequal': html += `<i class="fas fa-greater-than-equal"></i>&nbsp;`; break;
              case 'greater': html += `<i class="fas fa-greater-than"></i>&nbsp;`; break;
              case 'less': html += `<i class="fas fa-less-than"></i>&nbsp;`; break;
              case 'lessthanequal': html += `<i class="fas fa-less-than-equal"></i>&nbsp;`; break;
              case 'equal': html += `<i class="fas fa-less-than"></i>&nbsp;`; break;
            }

            html += full.employee_no + `</span>`;

            if (full.employee_no_applicable == 'yes') {
              html += `&nbsp; <i class="fas fa-check-circle text-success"></i>`
            } else {
              html += `&nbsp; <i class="fas fa-times-circle text-danger"></i>`
            }

            return html;
          },
          className: 'text-center'
        },
        {
          render: function (data, type, full, meta) {
            let html = `<span class="badge badge-primary">`;

            switch (full.service_year_no_rule) {
              case 'greaterthanequal': html += `<i class="fas fa-greater-than-equal"></i>&nbsp;`; break;
              case 'greater': html += `<i class="fas fa-greater-than"></i>&nbsp;`; break;
              case 'less': html += `<i class="fas fa-less-than"></i>&nbsp;`; break;
              case 'lessthanequal': html += `<i class="fas fa-less-than-equal"></i>&nbsp;`; break;
              case 'equal': html += `<i class="fas fa-less-than"></i>&nbsp;`; break;
            }

            html += full.service_year_no + `</span>`;

            if (full.service_year_no_applicable == 'yes') {
              html += `&nbsp; <i class="fas fa-check-circle text-success"></i>`
            } else {
              html += `&nbsp; <i class="fas fa-times-circle text-danger"></i>`
            }

            return html;
          },
          className: 'text-center'
        },
        {
          render: function (data, type, full, meta) {
            let html = `<span class="badge badge-primary">`;

            switch (full.fifth_year_atrendance_rule) {
              case 'greaterthanequal': html += `<i class="fas fa-greater-than-equal"></i>&nbsp;`; break;
              case 'greater': html += `<i class="fas fa-greater-than"></i>&nbsp;`; break;
              case 'less': html += `<i class="fas fa-less-than"></i>&nbsp;`; break;
              case 'lessthanequal': html += `<i class="fas fa-less-than-equal"></i>&nbsp;`; break;
              case 'equal': html += `<i class="fas fa-less-than"></i>&nbsp;`; break;
            }

            html += full.fifth_year_atrendance + `</span>`;

            if (full.fifth_year_atrendance_applicable == 'yes') {
              html += `&nbsp; <i class="fas fa-check-circle text-success"></i>`
            } else {
              html += `&nbsp; <i class="fas fa-times-circle text-danger"></i>`
            }

            return html;
          },
          className: 'text-center'
        },
        {
          render: function (data, type, full, meta) {
            let html = `<span class="badge badge-primary">`;

            switch (full.max_gratuity_anual_rule) {
              case 'greaterthanequal': html += `<i class="fas fa-greater-than-equal"></i>&nbsp;`; break;
              case 'greater': html += `<i class="fas fa-greater-than"></i>&nbsp;`; break;
              case 'less': html += `<i class="fas fa-less-than"></i>&nbsp;`; break;
              case 'lessthanequal': html += `<i class="fas fa-less-than-equal"></i>&nbsp;`; break;
              case 'equal': html += `<i class="fas fa-less-than"></i>&nbsp;`; break;
            }

            html += full.max_gratuity_anual + `</span>`;

            if (full.max_gratuity_anual_applicable == 'yes') {
              html += `&nbsp; <i class="fas fa-check-circle text-success"></i>`
            } else {
              html += `&nbsp; <i class="fas fa-times-circle text-danger"></i>`
            }

            return html;
          },
          className: 'text-center'
        },
        {
          render: function (data, type, full, meta) {
            return (full.income_tax_applicable == 'yes') ? 'Applicable' : 'Not Applicable';
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
        this.adminService.fetchGratuityRules({
          pageno:nextPage ?? 1,
          perpage: dataTablesParameters.length,
          // 'pageno': Math.floor((dataTablesParameters.start + dataTablesParameters.length) / dataTablesParameters.length), 'perpage': dataTablesParameters.length,
          'searchkey': dataTablesParameters.search.value,
          'sortbyfield': Global.getTableSortingOptions('sortbyfield', dataTablesParameters),
          'ascdesc': Global.getTableSortingOptions('ascdesc', dataTablesParameters)
        }).subscribe(res => {
          if (res.status == 'success') {
            callback({
              recordsTotal: res.gratuity.totalDocs,
              recordsFiltered: res.gratuity.totalDocs,
              data: res.gratuity.docs,
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
            return full.corporate_id;
          },
          className: 'text-uppercase',
          orderable: true,
          name: 'corporate_id'
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
            let html = `<span class="badge badge-primary">`;

            switch (full.employee_no_rule) {
              case 'greaterthanequal': html += `<i class="fas fa-greater-than-equal"></i>&nbsp;`; break;
              case 'greater': html += `<i class="fas fa-greater-than"></i>&nbsp;`; break;
              case 'less': html += `<i class="fas fa-less-than"></i>&nbsp;`; break;
              case 'lessthanequal': html += `<i class="fas fa-less-than-equal"></i>&nbsp;`; break;
              case 'equal': html += `<i class="fas fa-less-than"></i>&nbsp;`; break;
            }

            html += full.employee_no + `</span>`;

            if (full.employee_no_applicable == 'yes') {
              html += `&nbsp; <i class="fas fa-check-circle text-success"></i>`
            } else {
              html += `&nbsp; <i class="fas fa-times-circle text-danger"></i>`
            }

            return html;
          },
          className: 'text-center',
          orderable: false,
        },
        {
          render: function (data, type, full, meta) {
            let html = `<span class="badge badge-primary">`;

            switch (full.service_year_no_rule) {
              case 'greaterthanequal': html += `<i class="fas fa-greater-than-equal"></i>&nbsp;`; break;
              case 'greater': html += `<i class="fas fa-greater-than"></i>&nbsp;`; break;
              case 'less': html += `<i class="fas fa-less-than"></i>&nbsp;`; break;
              case 'lessthanequal': html += `<i class="fas fa-less-than-equal"></i>&nbsp;`; break;
              case 'equal': html += `<i class="fas fa-less-than"></i>&nbsp;`; break;
            }

            html += full.service_year_no + `</span>`;

            if (full.service_year_no_applicable == 'yes') {
              html += `&nbsp; <i class="fas fa-check-circle text-success"></i>`
            } else {
              html += `&nbsp; <i class="fas fa-times-circle text-danger"></i>`
            }

            return html;
          },
          className: 'text-center',
          orderable: false,
        },
        {
          render: function (data, type, full, meta) {
            let html = `<span class="badge badge-primary">`;

            switch (full.fifth_year_atrendance_rule) {
              case 'greaterthanequal': html += `<i class="fas fa-greater-than-equal"></i>&nbsp;`; break;
              case 'greater': html += `<i class="fas fa-greater-than"></i>&nbsp;`; break;
              case 'less': html += `<i class="fas fa-less-than"></i>&nbsp;`; break;
              case 'lessthanequal': html += `<i class="fas fa-less-than-equal"></i>&nbsp;`; break;
              case 'equal': html += `<i class="fas fa-less-than"></i>&nbsp;`; break;
            }

            html += full.fifth_year_atrendance + `</span>`;

            if (full.fifth_year_atrendance_applicable == 'yes') {
              html += `&nbsp; <i class="fas fa-check-circle text-success"></i>`
            } else {
              html += `&nbsp; <i class="fas fa-times-circle text-danger"></i>`
            }

            return html;
          },
          className: 'text-center',
          orderable: false,
        },
        {
          render: function (data, type, full, meta) {
            let html = `<span class="badge badge-primary">`;

            switch (full.max_gratuity_anual_rule) {
              case 'greaterthanequal': html += `<i class="fas fa-greater-than-equal"></i>&nbsp;`; break;
              case 'greater': html += `<i class="fas fa-greater-than"></i>&nbsp;`; break;
              case 'less': html += `<i class="fas fa-less-than"></i>&nbsp;`; break;
              case 'lessthanequal': html += `<i class="fas fa-less-than-equal"></i>&nbsp;`; break;
              case 'equal': html += `<i class="fas fa-less-than"></i>&nbsp;`; break;
            }

            html += full.max_gratuity_anual + `</span>`;

            if (full.max_gratuity_anual_applicable == 'yes') {
              html += `&nbsp; <i class="fas fa-check-circle text-success"></i>`
            } else {
              html += `&nbsp; <i class="fas fa-times-circle text-danger"></i>`
            }

            return html;
          },
          className: 'text-center',
          orderable: false,
        },
        {
          render: function (data, type, full, meta) {
            return (full.income_tax_applicable == 'yes') ? 'Applicable' : 'Not Applicable';
          },
          orderable: true,
          name: 'income_tax_applicable'
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
    // console.log(item.employee_no_applicable);

    this.editActionId = item._id;
    this.gratuityRuleForm.patchValue({
      employee_no: item.employee_no,
      service_year_no: item.service_year_no,
      fifth_year_atrendance: item.fifth_year_atrendance,
      max_gratuity_anual: item.max_gratuity_anual,

      employee_no_rule: this.rulesMaster.find(obj => {
        return obj.id === item.employee_no_rule
      }),

      employee_no_applicable: this.applicableMaster.find(obj => {
        return obj.id === item.employee_no_applicable
      }),

      service_year_no_rule: this.rulesMaster.find(obj => {
        return obj.id === item.service_year_no_rule
      }),

      service_year_no_applicable: this.applicableMaster.find(obj => {
        return obj.id === item.service_year_no_applicable
      }),

      fifth_year_atrendance_rule: this.rulesMaster.find(obj => {
        return obj.id === item.fifth_year_atrendance_rule
      }),

      fifth_year_atrendance_applicable: this.applicableMaster.find(obj => {
        return obj.id === item.fifth_year_atrendance_applicable
      }),

      max_gratuity_anual_rule: this.rulesMaster.find(obj => {
        return obj.id === item.max_gratuity_anual_rule
      }),

      max_gratuity_anual_applicable: this.applicableMaster.find(obj => {
        return obj.id === item.max_gratuity_anual_applicable
      }),

      income_tax_applicable: this.applicableMaster.find(obj => {
        return obj.id === item.income_tax_applicable
      }),

      effective_date: this.datePipe.transform(item.effective_date, 'MM/dd/YYYY'),
    });

    this.initialValueBeforeUpdate = {
      'gratuity_id': this.editActionId,
      'employee_no_rule': this.gratuityRuleForm.value.employee_no_rule.id,
      'employee_no': this.gratuityRuleForm.value.employee_no.toString().trim(),
      'employee_no_applicable': this.gratuityRuleForm.value.employee_no_applicable.id,
      'service_year_no_rule': this.gratuityRuleForm.value.service_year_no_rule.id,
      'service_year_no': this.gratuityRuleForm.value.service_year_no.toString().trim(),
      'service_year_no_applicable': this.gratuityRuleForm.value.service_year_no_applicable.id,
      'fifth_year_atrendance_rule': this.gratuityRuleForm.value.fifth_year_atrendance_rule.id,
      'fifth_year_atrendance': this.gratuityRuleForm.value.fifth_year_atrendance.toString().trim(),
      'fifth_year_atrendance_applicable': this.gratuityRuleForm.value.fifth_year_atrendance_applicable.id,
      'max_gratuity_anual_rule': this.gratuityRuleForm.value.max_gratuity_anual_rule.id,
      'max_gratuity_anual': this.gratuityRuleForm.value.max_gratuity_anual.toString().trim(),
      'max_gratuity_anual_applicable': this.gratuityRuleForm.value.max_gratuity_anual_applicable.id,
      'income_tax_applicable': this.gratuityRuleForm.value.income_tax_applicable.id,
      'effective_date': this.datePipe.transform(this.gratuityRuleForm.value.effective_date, 'Y-MM-dd'),
    }

    $('html, body').animate({
      'scrollTop': $("#gratuity-submit-section").position().top
    });
  }

  cancelEdit() {
    this.editActionId = '';
    this.gratuityRuleForm.reset();

    for (const key in this.gratuityRuleForm.controls) {
      if (Object.prototype.hasOwnProperty.call(this.gratuityRuleForm.controls, key)) {
        const element = this.gratuityRuleForm.controls[key];

        element.markAsUntouched();
        element.markAsPristine();
      }
    }
  }

  create(event: any) {
    if (this.gratuityRuleForm.valid) {
      event.target.classList.add('btn-loading');

      this.adminService.createGratuityRule({
        'employee_no_rule': this.gratuityRuleForm.value.employee_no_rule.id,
        'employee_no': this.gratuityRuleForm.value.employee_no,
        'employee_no_applicable': this.gratuityRuleForm.value.employee_no_applicable.id,
        'service_year_no_rule': this.gratuityRuleForm.value.service_year_no_rule.id,
        'service_year_no': this.gratuityRuleForm.value.service_year_no,
        'service_year_no_applicable': this.gratuityRuleForm.value.service_year_no_applicable.id,
        'fifth_year_atrendance_rule': this.gratuityRuleForm.value.fifth_year_atrendance_rule.id,
        'fifth_year_atrendance': this.gratuityRuleForm.value.fifth_year_atrendance,
        'fifth_year_atrendance_applicable': this.gratuityRuleForm.value.fifth_year_atrendance_applicable.id,
        'max_gratuity_anual_rule': this.gratuityRuleForm.value.max_gratuity_anual_rule.id,
        'max_gratuity_anual': this.gratuityRuleForm.value.max_gratuity_anual,
        'max_gratuity_anual_applicable': this.gratuityRuleForm.value.max_gratuity_anual_applicable.id,
        'income_tax_applicable': this.gratuityRuleForm.value.income_tax_applicable.id,
        'effective_date': this.datePipe.transform(this.gratuityRuleForm.value.effective_date, 'Y-MM-dd'),
      }).subscribe(res => {
        if (res.status == 'success') {
          this.toastr.success(res.message);
          // this.gratuityRuleForm.reset();
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
        this.adminService.deleteGratuityRule({
          'gratuity_id': item._id,
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
    if (this.gratuityRuleForm.valid) {
      const documentUpdate = {
        'gratuity_id': this.editActionId,
        'employee_no_rule': this.gratuityRuleForm.value.employee_no_rule.id,
        'employee_no': this.gratuityRuleForm.value.employee_no.toString().trim(),
        'employee_no_applicable': this.gratuityRuleForm.value.employee_no_applicable.id,
        'service_year_no_rule': this.gratuityRuleForm.value.service_year_no_rule.id,
        'service_year_no': this.gratuityRuleForm.value.service_year_no.toString().trim(),
        'service_year_no_applicable': this.gratuityRuleForm.value.service_year_no_applicable.id,
        'fifth_year_atrendance_rule': this.gratuityRuleForm.value.fifth_year_atrendance_rule.id,
        'fifth_year_atrendance': this.gratuityRuleForm.value.fifth_year_atrendance.toString().trim(),
        'fifth_year_atrendance_applicable': this.gratuityRuleForm.value.fifth_year_atrendance_applicable.id,
        'max_gratuity_anual_rule': this.gratuityRuleForm.value.max_gratuity_anual_rule.id,
        'max_gratuity_anual': this.gratuityRuleForm.value.max_gratuity_anual.toString().trim(),
        'max_gratuity_anual_applicable': this.gratuityRuleForm.value.max_gratuity_anual_applicable.id,
        'income_tax_applicable': this.gratuityRuleForm.value.income_tax_applicable.id,
        'effective_date': this.datePipe.transform(this.gratuityRuleForm.value.effective_date, 'Y-MM-dd'),
      };

      if (JSON.stringify(documentUpdate) === JSON.stringify(this.initialValueBeforeUpdate)) {
        this.toastr.warning("No change detected to update");
        return;
      }

      event.target.classList.add('btn-loading');

      this.adminService.updateGratuityRule(
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
