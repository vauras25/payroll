import { Component, OnInit } from '@angular/core';
import { FormArray, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { AppComponent } from 'src/app/app.component';
import * as Global from 'src/app/globals';
import { AdminService } from 'src/app/services/admin.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'admin-app-salary-template',
  templateUrl: './salary-template.component.html',
  styleUrls: ['./salary-template.component.css']
})
export class ADSalaryTemplateComponent implements OnInit {
  dtOptions: DataTables.Settings = {};

  salaryTemplateForm: UntypedFormGroup;
  salaryEarningForm: UntypedFormGroup;
  salaryHeadForm: UntypedFormGroup;

  earnings: any[];
  earningSalaryHeads:any[] = [];
  dependentSalaryHeads:any[] = [];
  dependentSalaryHeadsId:any[] = [];

  salaryHeads: any[];
  priorityMaster: any[];
  attendanceRelationMaster: any[];
  headsIncludeMaster: any[];
  earningTypeMaster: any[];
  earningTypeOptions: any[];

  earningEditActionIndex: any;
  tempEditActionId: any;
  salaryTempateDetails: any;

  Global = Global;
  isAdvancePreDefiend:Boolean = false

  constructor(
    public formBuilder: UntypedFormBuilder,
    private titleService: Title,
    protected adminService: AdminService,
    private toastr: ToastrService,
    private spinner: NgxSpinnerService,
    public AppComponent: AppComponent,
    public router: Router
  ) {
    this.salaryTemplateForm = formBuilder.group({
      template_name: [null, Validators.compose([Validators.required])],
      // restricted_pf: [null, Validators.compose([Validators.required])],
      voluntary_pf: [null, Validators.compose([Validators.pattern("^[0-9]+(.[0-9]{0,2})?$")])],
      // no_pension: [null, Validators.compose([Validators.required])],
      advance: [null],
      minimum_wage_amount: [null, Validators.compose([Validators.pattern("^[0-9]+(.[0-9]{0,2})?$")])],
      minimum_wage_percentage: [null, Validators.compose([Validators.pattern("^[0-9]+(.[0-9]{0,2})?$")])],
      wage_applicable: [null],
    });

    this.salaryEarningForm = formBuilder.group({
      head_id: [null, Validators.compose([Validators.required])],
      priority: [null, Validators.compose([Validators.required])],
      is_percentage: [null, Validators.compose([])],
      percentage_amount: [null, Validators.compose([Validators.pattern("^[0-9]+(.[0-9]{0,2})?$")])],
      dependent_head: [null, Validators.compose([])],
      attendance_relation: [null, Validators.compose([Validators.required])],
      head_include_in: [null],
      earning_type: [null, Validators.compose([])],
      earning_value: [null, Validators.compose([Validators.pattern("^[0-9]+(.[0-9]{0,2})?$")])],
    });

    this.salaryHeadForm = formBuilder.group({
      full_name: [null, Validators.compose([Validators.required])],
      head_type: [null, Validators.compose([Validators.required])],
      abbreviation: [null, Validators.compose([])],
    });

    this.salaryTemplateForm.get('advance')?.valueChanges.subscribe(val => {
      if (val == true) {
        $('.advance-action').show(500);
        $('#salaryEarningForm').find('.advance-fields').show();

        this.salaryTemplateForm.controls['minimum_wage_amount'].setValidators([Validators.required, Validators.pattern("^[0-9]+(.[0-9]{0,2})?$")]);
        this.salaryTemplateForm.controls['minimum_wage_percentage'].setValidators([Validators.required, Validators.pattern("^[0-9]+(.[0-9]{0,2})?$")]);
        this.salaryTemplateForm.controls['wage_applicable'].setValidators([Validators.required]);

        // this.earningTypeOptions = [
        //   { 'value': 'auto', 'description': 'Auto' },
        //   { 'value': 'percent', 'description': 'Percent' },
        //   { 'value': 'amount', 'description': 'Amount' },
        // ];
      } else {
        $('.advance-action').hide(500);
        $('#salaryEarningForm').find('.advance-fields').hide();

        this.salaryTemplateForm.controls['minimum_wage_amount'].clearValidators();
        this.salaryTemplateForm.controls['minimum_wage_percentage'].clearValidators();
        this.salaryTemplateForm.controls['wage_applicable'].clearValidators();

        this.salaryTemplateForm.patchValue({
          "minimum_wage_amount": null,
          "minimum_wage_percentage": null,
          "wage_applicable": null,
        })

        // this.earningTypeOptions = [
        //   { 'value': 'percent', 'description': 'Percent' },
        //   { 'value': 'amount', 'description': 'Amount' },
        // ];
      }

      this.salaryTemplateForm.controls['minimum_wage_amount'].updateValueAndValidity();
      this.salaryTemplateForm.controls['minimum_wage_percentage'].updateValueAndValidity();
      this.salaryTemplateForm.controls['wage_applicable'].updateValueAndValidity();
    });

    this.salaryEarningForm.get('is_percentage')?.valueChanges.subscribe(val => {
      if (val == true) {
        this.salaryEarningForm.controls['percentage_amount'].setValidators([Validators.required]);
        $('[formControlName="percentage_amount"]').removeAttr('readonly');
        this.salaryEarningForm.get('earning_type')?.setValue({ value: 'auto', description: 'Auto' })
      } else {
        this.salaryEarningForm.controls['percentage_amount'].clearValidators();

        this.salaryEarningForm.patchValue({
          'percentage_amount': null
        })

        $('[formControlName="percentage_amount"]').attr('readonly', 'true');
      }
      this.salaryEarningForm.controls['percentage_amount'].updateValueAndValidity();
      if(this.isAdvancePreDefiend){
        this.salaryEarningForm.get('earning_type')?.setValue({ value: 'auto', description: 'Auto' })

        // this.earningTypeOptions = [
        //   // { value: 'auto', description: 'Auto' },
        //   { value: 'percent', description: 'Percent' },
        //   { value: 'amount', description: 'Amount' },
        // ];
      }

    });

    this.salaryEarningForm.get('earning_type')?.valueChanges.subscribe(val => {
      if (val?.value == 'percent') {
        this.salaryEarningForm.controls['earning_value'].setValidators([Validators.required]);
        $('[formControlName="earning_value"]').attr('placeholder', 'Enter Earning Percentage');
      } else if (val?.value == 'amount') {
        this.salaryEarningForm.controls['earning_value'].setValidators([Validators.required]);
        $('[formControlName="earning_value"]').attr('placeholder', 'Enter Earning Amount');
      } else {
        this.salaryEarningForm.controls['earning_value'].clearValidators();
        $('[formControlName="earning_value"]').attr('placeholder', 'Enter Earning Value');
      }

      this.salaryEarningForm.controls['earning_value'].updateValueAndValidity();
    });

    this.priorityMaster = [
      { 'value': 1, 'description': '1' },
      { 'value': 2, 'description': '2' },
      { 'value': 3, 'description': '3' },
      { 'value': 4, 'description': '4' },
      { 'value': 5, 'description': '5' },
    ];

    this.attendanceRelationMaster = [
      { 'value': 'dependent', 'description': 'Dependent' },
      { 'value': 'non_dependent', 'description': 'Non-Dependent' },
    ];

    this.headsIncludeMaster = [
      { 'value': 'PF', 'description': 'PF' },
      { 'value': 'ESI', 'description': 'ESI' },
      { 'value': 'PT', 'description': 'PT' },
      { 'value': 'TDS', 'description': 'TDS' },
      { 'value': 'OT', 'description': 'OT' },
      { 'value': 'Bonus', 'description': 'Bonus' },
      { 'value': 'Gratuity', 'description': 'Gratuity' },
    ];

    this.earningTypeMaster = this.earningTypeOptions = [
      // { 'value': 'auto', 'description': 'Auto' },
      { 'value': 'percent', 'description': 'Percent' },
      { 'value': 'amount', 'description': 'Amount' },
    ];

    // this.earnings = [{ "head_id": { "id": "6196536c730cfc6c51e280c4", "description": "Basic (BA)", "full_name": "Basic (BA)", "abbreviation": "df sfsfs", "head_type": "earning" }, "priority": { "value": 1, "description": "1" }, "is_percentage": null, "percentage_amount": null, "dependent_head": [], "attendance_relation": { "value": "non_dependent", "description": "Non-Dependent" }, "head_include_in": [], "earning_type": { "value": "percent", "description": "Percent" }, "earning_value": "30" }, { "head_id": { "id": "61e7ad3c312f79f752a5b1d4", "description": "House Rent", "full_name": "House Rent", "abbreviation": "HRA", "head_type": "earning" }, "priority": { "value": 2, "description": "2" }, "is_percentage": null, "percentage_amount": null, "dependent_head": [], "attendance_relation": { "value": "non_dependent", "description": "Non-Dependent" }, "head_include_in": [], "earning_type": { "value": "percent", "description": "Percent" }, "earning_value": "70" }];

    this.salaryHeads = [];
    this.earnings = [];

    this.earningEditActionIndex = "";
    this.tempEditActionId = "";
    this.salaryTempateDetails = null;
  }

  ngOnInit(): void {
    this.titleService.setTitle("Salary Template - " + Global.AppName);

    this.fetchSalaryHeads();
    this.fetchSalaryTemplate();
  }

  fetchSalaryTemplate() {
    this.dtOptions = {
      ajax: (dataTablesParameters: any, callback) => {
        this.adminService.fetchSalaryTemplates({
          'pageno': Math.floor((dataTablesParameters.start + dataTablesParameters.length) / dataTablesParameters.length), 'perpage': dataTablesParameters.length,
          'searchkey': dataTablesParameters.search.value,
          'sortbyfield': Global.getTableSortingOptions('sortbyfield', dataTablesParameters),
          'ascdesc': Global.getTableSortingOptions('ascdesc', dataTablesParameters)
        }).subscribe(res => {
          if (res.status == 'success') {
            callback({
              recordsTotal: res.salary_template.totalDocs,
              recordsFiltered: res.salary_template.totalDocs,
              data: res.salary_template.docs,
            });
          } else {
            this.toastr.error(res.message);

            callback({
              recordsTotal: 0,
              recordsFiltered: 0,
              data: [],
            });
          }
        }, (err) => {
          this.toastr.error(Global.showServerErrorMessage(err));

          callback({
            recordsTotal: 0,
            recordsFiltered: 0,
            data: [],
          });
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
            if (full.publish_status == "published") {
              btnstatus = 'on';
            } else {
              btnstatus = 'off';
            }

            return `<div class="br-toggle br-toggle-rounded br-toggle-primary ` + btnstatus + `" id="changeStatusButton">\
                      <div class="br-toggle-switch"></div>\
                    </div>`;
          },
          className: 'text-center',
          orderable: true,
          name: 'status',
        },
        {
          render: function (data, type, full, meta) {
            let html = ``;
            let flag: boolean = true;

            html += `<button class="btn btn-info btn-icon mx-1" data-toggle="tooltip" data-placement="top" title="View" id="viewButton">
                        <div style="width:25px; height:25px;"><i class="fa fa-eye"></i></div>
                    </button>`;

            if (full.edit_status == 'active') {
              html += `<button class="btn btn-primary btn-icon mx-1" data-toggle="tooltip" data-placement="top" title="Edit" id="editButton">
                          <div style="width:25px; height:25px;"><i class="fa fa-pen"></i></div>
                      </button>`;
            }

            if (flag) return html;
            else return '-';
          },
          className: 'text-center',
          orderable: false,
        },
        {
          render: function (data, type, full, meta) {
            return full.template_name;
          },
          orderable: true,
          name: 'template_name'
        },
        {
          render: function (data, type, full, meta) {
            return `<span class="text-uppercase">` + full.restricted_pf + `</span>`;
          },
          orderable: true,
          name: 'restricted_pf'
        },
        {
          render: function (data, type, full, meta) {
            return full.voluntary_pf;
          },
          orderable: true,
          name: 'voluntary_pf'
        },
        {
          render: function (data, type, full, meta) {
            return `<span class="text-uppercase">` + full.no_pension + `</span>`;
          },
          orderable: true,
          name: 'no_pension'
        },
        {
          render: function (data, type, full, meta) {
            return full.minimum_wage_amount ?? "N/A";
          },
          orderable: true,
          name: 'minimum_wage_amount'
        },
        {
          render: function (data, type, full, meta) {
            return full.minimum_wage_percentage ?? "N/A";
          },
          orderable: true,
          name: 'minimum_wage_percentage'
        },
        {
          render: function (data, type, full, meta) {
            return `<span class="text-uppercase">` + full.wage_applicable + `</span>`;
          },
          orderable: true,
          name: 'wage_applicable'
        },
      ],
      drawCallback: function (settings) {
        Global.loadCustomScripts('customJsScript');
      },
      rowCallback: (row: Node, data: any[] | Object, index: number) => {
        const self = this;

        $('#viewButton', row).bind('click', () => {
          self.viewSalaryTemplate(data);
        });

        $('#editButton', row).bind('click', () => {
          self.getEditSalaryTemplate(data);
        });

        $('#changeStatusButton', row).bind('click', () => {
          self.changeSalaryTemplatePlublishStatus(data);
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
      },
    };
  }

  viewSalaryTemplate(item: any) {
    item.earnings.forEach((element: any) => {
      element.attendance_relation = element.attendance_relation.replace(/_/gi, " ")
    });

    this.salaryTempateDetails = item;
    $('#viewSalaryTemplateModalButton').click();
  }

  getEditSalaryTemplate(item: any, isAddFromLibrary: boolean = false) {
    this.cancelSalaryTemplateEntry();

    if (!isAddFromLibrary) {
      this.tempEditActionId = item._id;
    }

    this.salaryTemplateForm.patchValue({
      template_name: item.template_name ?? null,
      restricted_pf: item.restricted_pf ?? null,
      voluntary_pf: item.voluntary_pf ?? null,
      no_pension: item.no_pension ?? null,
      advance: item.advance == 'yes' ? true : false,
      minimum_wage_amount: item.minimum_wage_amount ?? null,
      minimum_wage_percentage: item.minimum_wage_percentage ?? null,
      wage_applicable: item.wage_applicable ?? null,
    });

    this.earnings = [];

    item.earnings.forEach((element: any) => {
      let earning:any = {
        head_id:  this.salaryHeads.find((obj: any) => {
          // if(){
            
            return obj.id == element.head_id;
          // }
        }) ?? null,
        priority:
          this.priorityMaster.find((obj: any) => {
            return obj.value == element.priority;
          }) ?? null,

        dependent_head:
          this.salaryHeads.find((obj: any) => {
            return obj.id == element.dependent_head;
          }) ?? null,

        attendance_relation:
          this.attendanceRelationMaster.find((obj: any) => {
            return obj.value == element.attendance_relation;
          }) ?? null,

        

        is_percentage: element.is_percentage == 'yes' ? true : false,
        percentage_amount: element.percentage_amount ?? null,
        head_include_in: element.head_include_in ?? [],
        earning_value: element.earning_value ?? null,
      }
      if(element?.earning_type == 'auto'){
        earning.earning_type = { value: 'auto', description: 'Auto' }
      }else{
        earning.earning_type = this.earningTypeMaster.find((obj: any) => {return obj.value == element.earning_type})
      }
      this.earnings.push(earning);
      this.dependentSalaryHeadsId.push(element?.head_id)
    });

    if (item.no_pension == 'yes') {
      $('#no-pension').addClass('on');
    }

    if (item.restricted_pf == 'yes') {
      $('#restricted-pf').addClass('on');
    }

    Global.scrollToQuery('#salarytemplate-submit-section');
  }
  // getEditSalaryTemplate(item: any) {
  //   this.cancelSalaryTemplateEntry();
  //   this.tempEditActionId = item._id;

  //   this.salaryTemplateForm.patchValue({
  //     template_name: item.template_name ?? null,
  //     restricted_pf: item.restricted_pf ?? null,
  //     voluntary_pf: item.voluntary_pf ?? null,
  //     no_pension: item.no_pension ?? null,
  //     advance: item.advance == 'yes' ? true : false,
  //     minimum_wage_amount: item.minimum_wage_amount ?? null,
  //     minimum_wage_percentage: item.minimum_wage_percentage ?? null,
  //     wage_applicable: item.wage_applicable ?? null,
  //   })

  //   this.earnings = [];
  //   item.earnings.forEach((element: any) => {
  //     this.earnings.push({
  //       'head_id': this.salaryHeads.find((obj: any) => {
  //         return obj.id == element.head_id
  //       }) ?? null,

  //       'priority': this.priorityMaster.find((obj: any) => {
  //         return obj.value == element.priority
  //       }) ?? null,

  //       'dependent_head': this.salaryHeads.find((obj: any) => {
  //         return obj.id == element.dependent_head
  //       }) ?? null,

  //       'attendance_relation': this.attendanceRelationMaster.find((obj: any) => {
  //         return obj.value == element.attendance_relation
  //       }) ?? null,

  //       'earning_type': this.earningTypeMaster.find((obj: any) => {
  //         return obj.value == element.earning_type
  //       }) ?? null,

  //       'is_percentage': element.is_percentage == 'yes' ? true : false,
  //       'percentage_amount': element.percentage_amount ?? null,
  //       'head_include_in': element.head_include_in ?? [],
  //       'earning_value': element.earning_value ?? null,
  //     })
  //   });

  //   if (item.no_pension == "yes") {
  //     $('#no-pension').addClass("on");
  //   }

  //   if (item.restricted_pf == "yes") {
  //     $('#restricted-pf').addClass("on");
  //   }

  //   Global.scrollToQuery('#salarytemplate-submit-section');
  // }

  addSalaryTemplate(event: any) {
    let earnings = this.fetchEarningsForSubmit()

    this.salaryTemplateForm.markAllAsTouched();
    Global.scrollToQuery('p.error-element');

    if (this.salaryTemplateForm.valid && earnings != false) {
      event.target.classList.add('btn-loading');

      this.adminService.addSalaryTemplate({
        'template_name': this.salaryTemplateForm.value.template_name ?? "",
        'restricted_pf': $('#restricted-pf').hasClass('on') == true ? 'yes' : 'no',
        'voluntary_pf': this.salaryTemplateForm.value.voluntary_pf ?? "0",
        'no_pension': $('#no-pension').hasClass('on') == true ? 'yes' : 'no',
        'advance': this.salaryTemplateForm.value.advance == true ? "yes" : "no",
        'minimum_wage_amount': this.salaryTemplateForm.value.minimum_wage_amount ?? "",
        'minimum_wage_percentage': this.salaryTemplateForm.value.minimum_wage_percentage ?? "",
        'wage_applicable': this.salaryTemplateForm.value.wage_applicable ?? "higher",
        'earning': JSON.stringify(earnings),
      }).subscribe(res => {
        if (res.status == 'success') {
          this.toastr.success(res.message);
          this.cancelSalaryTemplateEntry();
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

  updateSalaryTemplate(event: any) {
    let earnings = this.fetchEarningsForSubmit()

    this.salaryTemplateForm.markAllAsTouched();
    Global.scrollToQuery('p.error-element');

    if (this.salaryTemplateForm.valid && earnings != false) {
      event.target.classList.add('btn-loading');

      this.adminService.updateSalaryTemplate({
        'template_id': this.tempEditActionId,
        'template_name': this.salaryTemplateForm.value.template_name ?? "",
        'restricted_pf': $('#restricted-pf').hasClass('on') == true ? 'yes' : 'no',
        'voluntary_pf': this.salaryTemplateForm.value.voluntary_pf ?? "0",
        'no_pension': $('#no-pension').hasClass('on') == true ? 'yes' : 'no',
        'advance': this.salaryTemplateForm.value.advance == true ? "yes" : "no",
        'minimum_wage_amount': this.salaryTemplateForm.value.minimum_wage_amount ?? "",
        'minimum_wage_percentage': this.salaryTemplateForm.value.minimum_wage_percentage ?? "",
        'wage_applicable': this.salaryTemplateForm.value.wage_applicable ?? "higher",
        'earning': JSON.stringify(earnings),
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

  fetchEarningsForSubmit() {
    if (this.earnings.length < 1) {
      this.toastr.error("Please add atleast one earning to create salary template");
      return false;
    }

    let isEarningTypePercentPres = 'false';
    let totalEarningTypePercent = 0;
    let isEarningTypeAutoFound = 'false';

    let totalPercAmount: any = 0;

    let earnings: any[] = [];
    this.earnings.forEach(element => {
      let obj: any = {
        'head_id': element.head_id?.id ?? "",
        'head_full_name': element.head_id?.full_name ?? "",
        'head_abbreviation': element.head_id?.abbreviation ?? "",
        'type': element.head_id?.head_type ?? "",

        'priority': element.priority?.value ?? "",
        'is_percentage': element.is_percentage == true ? 'yes' : 'no',
        'percentage_amount': element.percentage_amount ?? "",
        'attendance_relation': element.attendance_relation?.value ?? "",
        'head_include_in': element.head_include_in ?? [],
        'earning_type': element.earning_type?.value ?? "",
        'earning_value': element.earning_value ?? "",
      }

      if (this.salaryTemplateForm.value.advance != true) {
        obj.is_percentage = 'no';
        obj.percentage_amount = '';

        element.dependent_head = '';
      }

      if (element.dependent_head?.id) {
        obj.dependent_head = element.dependent_head?.id ?? "";
        obj.dependent_head_full_name = element.dependent_head?.full_name ?? "";
        obj.dependent_head_abbreviation = element.dependent_head?.abbreviation ?? "";
        obj.dependent_head_type = element.dependent_head?.head_type ?? "";
      } else {
        obj.dependent_head = '';
        obj.dependent_head_full_name = '';
        obj.dependent_head_abbreviation = '';
        obj.dependent_head_type = '';
      }

      if (obj.earning_type == 'percent') {
        isEarningTypePercentPres = 'true';
        totalEarningTypePercent += parseFloat(obj.earning_value)
      }

      if (obj.earning_type == 'auto') {
        isEarningTypeAutoFound = 'true';
      }

      if (obj.percentage_amount) {
        totalPercAmount += parseFloat(obj.percentage_amount);
      }

      earnings.push(obj)
    });

    if (isEarningTypePercentPres == 'true' && totalEarningTypePercent != 100) {
      this.toastr.error("The total earning percentage must be 100")
      return false;
    }

    if (totalPercAmount && parseFloat(totalPercAmount) != 100) {
      this.toastr.error("The total percentage applicable for the template must be 100")
      return false;
    }

    if (isEarningTypeAutoFound == 'true' && this.salaryTemplateForm.value.advance != true) {
      this.toastr.error("Auto Earning Type option is only available for Advance Templates")
      return false;
    }

    return earnings;
  }

  cancelSalaryTemplateEntry() {
    this.tempEditActionId = "";
    this.earnings = [];

    this.salaryTemplateForm.reset();
    for (const key in this.salaryTemplateForm.controls) {
      if (Object.prototype.hasOwnProperty.call(this.salaryTemplateForm.controls, key)) {
        const element = this.salaryTemplateForm.controls[key];

        element.markAsUntouched();
        element.markAsPristine();
      }
    }

    $('#no-pension').removeClass("on");
    $('#restricted-pf').removeClass("on");

    Global.scrollToQuery('#salarytemplate-submit-section');
  }

  // addEarning() {
  //   this.cancelEarningEntry();

  //   $('.earning-desc').show();
  // }

  // editEarning(item: any, index: any) {
  //   this.earningEditActionIndex = index;
  //   this.salaryEarningForm.patchValue({
  //     'head_id': item.head_id,
  //     'priority': item.priority,
  //     'is_percentage': item.is_percentage,
  //     'percentage_amount': item.percentage_amount,
  //     'dependent_head': item.dependent_head,
  //     'attendance_relation': item.attendance_relation,
  //     'earning_type': item.earning_type,
  //     'earning_value': item.earning_value,
  //   });

  //   this.selectedEarningHeadForEdit(item.head_include_in)

  //   $('.earning-desc').show();
  // }

  removeEarning(index: any) {
    this.earnings.splice(index, 1);
  }

  cancelEarningEntry() {
    $('.earning-desc').hide();
    this.earningEditActionIndex = "";
    this.resetSelectedEarningHead();

    this.salaryEarningForm.reset();
    for (const key in this.salaryEarningForm.controls) {
      if (Object.prototype.hasOwnProperty.call(this.salaryEarningForm.controls, key)) {
        const element = this.salaryEarningForm.controls[key];

        element.markAsUntouched();
        element.markAsPristine();
      }
    }
  }

  submitEarning(event: any) {
    this.salaryEarningForm.markAllAsTouched();
    setTimeout(function () {
      let $_errFormControl = document.querySelectorAll("p.error-element");
      if ($_errFormControl.length > 0) {
        const firstErr: Element = $_errFormControl[0];
        firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100)

    if (this.salaryEarningForm.valid) {
      let head_includes = this.getSelectedEarningHeadIncludes();
      // if (head_includes.length < 1) {
      //   this.toastr.error("Please select a head include for earning");
      //   return;
      // }

      this.salaryEarningForm.patchValue({
        'head_include_in': head_includes
      })

      if (this.earningEditActionIndex === "") {
        this.earnings.push(this.salaryEarningForm.value);
      } else {
        this.earnings[this.earningEditActionIndex] = this.salaryEarningForm.value;
      }

      this.cancelEarningEntry();
    }
  }

  fetchSalaryHeads() {
    this.spinner.show();

    this.adminService.fetchSalaryHeads()
      .subscribe(res => {
        if (res.status == 'success') {
          this.salaryHeads = [];
          res.temp_head.forEach((element: any) => {
            this.salaryHeads.push({
              'id': element._id,
              'description': element.full_name,
              'full_name': element.full_name,
              'abbreviation': element.abbreviation,
              'head_type': element.head_type,
              'pre_def_head':element.pre_def_head,
            });
          });
        } else if (res.status == 'val_err') {
          this.toastr.error(Global.showValidationMessage(res.val_msg));
        } else {
          this.toastr.error(res.message);
        }

        this.spinner.hide();
      }, (err) => {
        this.spinner.hide();
        this.toastr.error(Global.showServerErrorMessage(err));
      });
  }

  // addSalaryHead(event: any) {
  //   this.salaryHeadForm.markAllAsTouched();
  //   setTimeout(function () {
  //     let $_errFormControl = document.querySelectorAll("p.error-element");
  //     if ($_errFormControl.length > 0) {
  //       const firstErr: Element = $_errFormControl[0];
  //       firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
  //     }
  //   }, 100)

  //   if (this.salaryHeadForm.valid) {
  //     event.target.classList.add('btn-loading');

  //     this.adminService.addSalaryHead({
  //       'full_name': this.salaryHeadForm.value.full_name,
  //       'head_type': this.salaryHeadForm.value.head_type,
  //       'abbreviation': this.salaryHeadForm.value.abbreviation,
  //     }).subscribe(res => {
  //       if (res.status == 'success') {
  //         this.toastr.success(res.message);
  //         this.cancelSalaryHeadEntry();
  //         this.fetchSalaryHeads();
  //       } else if (res.status == 'val_err') {
  //         this.toastr.error(Global.showValidationMessage(res.val_msg));
  //       } else {
  //         this.toastr.error(res.message);
  //       }

  //       event.target.classList.remove('btn-loading');
  //     }, (err) => {
  //       event.target.classList.remove('btn-loading');
  //       this.toastr.error(Global.showServerErrorMessage(err));
  //     });
  //   }
  // }

  // cancelSalaryHeadEntry() {
  //   let modal: any = $('#salary-head-modal');
  //   modal.modal('hide');

  //   this.salaryHeadForm.reset();
  // }

  // getSelectedEarningHeadIncludes() {
  //   let modules: any[] = []

  //   $('input[name="head_include_in[]"]:checked').each(function () {
  //     modules.push($(this).val())
  //   });

  //   return modules;
  // }

  // selectedEarningHeadForEdit(modules: any) {
  //   this.resetSelectedEarningHead();

  //   for (const key in modules) {
  //     if (Object.prototype.hasOwnProperty.call(modules, key)) {
  //       const element = modules[key];
  //       $('input[name="head_include_in[]"][value="' + element + '"]').prop('checked', true);
  //     }
  //   }
  // }

  // resetSelectedEarningHead() {
  //   $('input[name="head_include_in[]"]:checked').each(function () {
  //     $(this).prop('checked', false)
  //   });
  // }

  changeSalaryTemplatePlublishStatus(item: any) {
    this.spinner.show();
    this.adminService.updateSalaryTemplatePublishStatus({
      'template_id': item._id,
      'status': (item.publish_status == "published") ? 'privet' : 'published',
    }).subscribe(res => {
      if (res.status == 'success') {
        $('#my-datatable').dataTable().api().ajax.reload(function (json) { }, false);
        this.toastr.success(res.message);
      } else {
        this.toastr.error(res.message);
      }
      this.spinner.hide();
    }, (err) => {
      this.toastr.error("Internal server error occured. Please try again later.");
      this.spinner.hide();
    });
  }


  addSalaryHead(event: any) {
    this.salaryHeadForm.markAllAsTouched();
    setTimeout(function () {
      let $_errFormControl = document.querySelectorAll('p.error-element');
      if ($_errFormControl.length > 0) {
        const firstErr: Element = $_errFormControl[0];
        firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);

    if (this.salaryHeadForm.valid) {
      event.target.classList.add('btn-loading');

      this.adminService
        .addSalaryHead({
          full_name: this.salaryHeadForm.value.full_name,
          head_type: this.salaryHeadForm.value.head_type,
          abbreviation: this.salaryHeadForm.value.abbreviation,
        })
        .subscribe(
          (res) => {
            if (res.status == 'success') {
              this.toastr.success(res.message);
              this.cancelSalaryHeadEntry();
              this.fetchSalaryHeads();
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

  cancelSalaryHeadEntry() {
    let modal: any = $('#salary-head-modal');
    modal.modal('hide');

    this.salaryHeadForm.reset();
  }

  getSelectedEarningHeadIncludes() {
    let modules: any[] = [];

    $('input[name="head_include_in[]"]:checked').each(function () {
      modules.push($(this).val());
    });

    return modules;
  }

  selectedEarningHeadForEdit(modules: any) {
    this.resetSelectedEarningHead();

    for (const key in modules) {
      if (Object.prototype.hasOwnProperty.call(modules, key)) {
        const element = modules[key];
        $('input[name="head_include_in[]"][value="' + element + '"]').prop(
          'checked',
          true
        );
      }
    }
  }

  resetSelectedEarningHead() {
    $('input[name="head_include_in[]"]:checked').each(function () {
      $(this).prop('checked', false);
    });
  }

  editEarning(item: any, index: any) {
    this.earningEditActionIndex = index;
    
    this.salaryEarningForm.patchValue({
      head_id: item.head_id,
      priority: item.priority,
      is_percentage: item.is_percentage,
      percentage_amount: item.percentage_amount,
      dependent_head: item.dependent_head,
      attendance_relation: item.attendance_relation,
      earning_type: item.earning_type,
      earning_value: item.earning_value,
    });
    if(item?.head_id?.pre_def_head === 'yes' && index == 0 && item?.priority?.value == 1){
      // this.salaryEarningForm.get
      this.salaryEarningForm.get('earning_type')?.setValue({ value: 'auto', description: 'Auto' })

    }
    if(item?.head_id?.pre_def_head === 'yes' && this.salaryTemplateForm.get("advance")?.value){
      this.isAdvancePreDefiend = true
      this.salaryEarningForm.get('is_percentage')?.disable()
    //   this.salaryEarningForm.get('head_id')?.disable()
    //   this.salaryEarningForm.get('priority')?.disable()
    //   this.salaryEarningForm.get('is_percentage')?.disable()
    //   this.salaryEarningForm.get('percentage_amount')?.disable()
    //   this.salaryEarningForm.get('dependent_head')?.disable()
    //   this.salaryEarningForm.get('attendance_relation')?.disable()
    //   this.salaryEarningForm.get('earning_type')?.disable()
    //   this.salaryEarningForm.get('earning_value')?.disable()
    // }else{
    //   this.salaryEarningForm.get('head_id')?.enable()
    //   this.salaryEarningForm.get('priority')?.enable()
    //   this.salaryEarningForm.get('is_percentage')?.enable()
    //   this.salaryEarningForm.get('percentage_amount')?.enable()
    //   this.salaryEarningForm.get('dependent_head')?.enable()
    //   this.salaryEarningForm.get('attendance_relation')?.enable()
    //   this.salaryEarningForm.get('earning_type')?.enable()
    //   this.salaryEarningForm.get('earning_value')?.enable()
    }else{
      this.mapDataForEarning()
      this.isAdvancePreDefiend = false;
      this.salaryEarningForm.get('is_percentage')?.enable()
    }
    // this.mapDataForEarning()
    this.selectedEarningHeadForEdit(item.head_include_in);

    $('.earning-desc').show();
  }

  mapDataForEarning(){
    this.earningSalaryHeads = this.salaryHeads.filter(head => !this.dependentSalaryHeadsId.includes(head.id));
    this.dependentSalaryHeads = this.salaryHeads.filter(head => this.dependentSalaryHeadsId.includes(head.id));
    const value = this.earnings?.find(earning => earning?.priority?.value === 1)?.priority.value
    if(value){
      const i = this.priorityMaster.findIndex((el:any) => el.value === value);
      if(i >= 0){
        this.priorityMaster.splice(i, 1)
      }
    }else if(this.priorityMaster.findIndex((el:any) => el.value === 1) < 0){
      this.priorityMaster.unshift({ value: 1, description: '1' })
    }
    this.isAdvancePreDefiend = false
    this.salaryEarningForm.get('is_percentage')?.enable()
    // this.salaryEarningForm.get('head_id')?.enable();
    // this.salaryEarningForm.get('priority')?.enable();
    // this.salaryEarningForm.get('is_percentage')?.enable();
    // this.salaryEarningForm.get('percentage_amount')?.enable();
    // this.salaryEarningForm.get('dependent_head')?.enable();
    // this.salaryEarningForm.get('attendance_relation')?.enable();
    // this.salaryEarningForm.get('earning_type')?.enable();
    // this.salaryEarningForm.get('earning_value')?.enable();
  }

  addEarning() {
    // this.earningsSalaryHeads = this.salaryHeads;
    // this.dependentSalaryHeads = this.salaryHeads;
    this.mapDataForEarning()
    this.cancelEarningEntry();
    $('.earning-desc').show();
  }

  markAdvance(e: any) {
    if (this.earnings.length) {
      Swal.fire({
        title: 'Warning!',
        text: 'All current earnings will be removed with this action!',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Okay',
        cancelButtonText: 'Cancel',
      }).then((result) => {
        if (result.value) {
          // if(e?.target?.checked){
            this.salaryTemplateForm.get("advance")?.setValue(e?.target?.checked)
          // }else{
            this.earnings = [];
            this.earningSalaryHeads = [];
            this.dependentSalaryHeads = [];
            this.dependentSalaryHeadsId = [];
            if(e.target.checked){
              let earning = this.salaryEarningForm.value;
              earning.head_id = this.salaryHeads.find(head => head.pre_def_head == 'yes');
              earning.priority = {value:1, description:"1"};
              earning.earning_type = { value: 'auto', description: 'Auto' };
              earning.attendance_relation = { value: 'dependent', description: 'Dependent' };
              earning.dependent_head = [];
              earning.head_include_in = [];
              this.earnings.push(earning);
              this.dependentSalaryHeadsId.push(earning?.head_id?.id)
              this.salaryTemplateForm.get("advance")?.setValue(true)
            // console.log('yes');
              
            }
          // }
        } else if (result.dismiss === Swal.DismissReason.cancel) {
          e.target.checked = !e.target.checked
        }
      });
    }else{
        let earning = this.salaryEarningForm.value;
        earning.head_id = this.salaryHeads.find(head => head.pre_def_head == 'yes');
        earning.priority = {value:1, description:"1"};
        earning.earning_type = { value: 'auto', description: 'Auto' };
        earning.attendance_relation = { value: 'dependent', description: 'Dependent' },
        earning.dependent_head = [];
        earning.head_include_in = [];
        this.earnings.push(earning);
        this.dependentSalaryHeadsId.push(earning?.head_id?.id)
        this.salaryTemplateForm.get("advance")?.setValue(true)
    }
    // if(e?.target?.checked){
    //   if(this.earnings.length){
    //     Swal.fire({
    //       title: 'Warning!',
    //       text: 'All current earnings will be removed with this action!',
    //       icon: 'warning',
    //       showCancelButton: true,
    //       confirmButtonText: 'Okay',
    //       cancelButtonText: 'Cancel'
    //     }).then((result) => {
    //       if (result.value) {
           
    //       } else if (result.dismiss === Swal.DismissReason.cancel) {
           
    //       }
    //     })
    //   }else{
    //     let earning = this.salaryEarningForm.value;
    //     earning.head_id = this.salaryHeads.find(head => head.pre_def_head == 'yes');
    //     earning.priority = {value:1, description:"1"};
    //     earning.earning_type = { value: 'auto', description: 'Auto' };
    //     earning.dependent_head = [];
    //     earning.head_include_in = [];
    //     this.earnings.push(earning);
    //     this.dependentSalaryHeadsId.push(earning?.head_id?.id)
        
    //   }
    // }else{
    //   if(this.earnings.length){
    //     Swal.fire({
    //       title: 'Warning!',
    //       text: 'All current earnings will be removed with this action!',
    //       icon: 'warning',
    //       showCancelButton: true,
    //       confirmButtonText: 'Okay',
    //       cancelButtonText: 'Cancel'
    //     }).then((result) => {
    //       if (result.value) {
    //         if(this.earnings.length){
    //           this.earnings = this.earnings.filter(earning => earning?.head_id?.pre_def_head !== 'yes');
    //         }
    //       } else if (result.dismiss === Swal.DismissReason.cancel) {
    //         if(this.earnings.length){
    //               this.earnings = this.earnings.filter(earning => earning?.head_id?.pre_def_head !== 'yes');

    //             }
    //       }
    //     })
    //   }else{
        
    //   }
    // }  
  }
}
