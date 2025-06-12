import { DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import * as Global from 'src/app/globals';
import { AdminService } from 'src/app/services/admin.service';
import { CompanyuserService } from 'src/app/services/companyuser.service';
import swal from 'sweetalert2';
import { timer } from 'rxjs';

@Component({
  selector: 'companyuser-app-bonus-policy',
  templateUrl: './bonus-policy.component.html',
  styleUrls: ['./bonus-policy.component.css']
})
export class CMPBonusPolicyComponent implements OnInit {
  dtOptions: DataTables.Settings = {};
  dtOptionsHistory: DataTables.Settings = {};
  dtOptionsLibrary: DataTables.Settings = {};
  bonusPolicyForm: UntypedFormGroup;
  editActionId: String;
  frequencyMaster: any[];
  disburesmentMaster: any[];
  viewPolicyDetail: any = null;
  initialValueBeforeUpdate: any = null;
  publishStatusMaster: any[];
  bonusRuleArchive: any;

  Global = Global

  constructor(
    public formBuilder: UntypedFormBuilder,
    private titleService: Title,
    private toastr: ToastrService,
    private companyuserService: CompanyuserService,
    private datePipe: DatePipe,
    private router: Router,

  ) {

    if (
      !Global.checkCompanyModulePermission({
        company_module: 'company_rules_1',
        company_sub_module: 'bonus_policy',
        company_sub_operation: ['view'],
        company_strict: true,
      })
    ) {
      // const _this = this;
      // setTimeout(function () {
      router.navigate(['company/errors/unauthorized-access'], {
        skipLocationChange: true,
      });
      return;
      // }, 500);
      // return;
    }
    this.editActionId = '';

    this.publishStatusMaster = [
      { 'value': 'privet', 'description': 'Private' },
      { 'value': 'published', 'description': 'Published' },
    ];

    this.frequencyMaster = [
      { 'value': 'monthly', 'description': 'Monthly' },
      { 'value': 'quaterly', 'description': 'Quaterly' },
      { 'value': 'half_yearly', 'description': 'Half Yearly' },
      { 'value': 'yearly', 'description': 'Yearly' },
    ];

    this.disburesmentMaster = [
      { 'value': 'fixed', 'description': 'Fixed Amount' },
      { 'value': 'percent', 'description': 'Percent' },
    ];

    this.bonusPolicyForm = formBuilder.group({
      template_name: [null, Validators.compose([Validators.required])],
      min_service: [null, Validators.compose([Validators.required, Validators.pattern("^[0-9]*$")])],
      max_bonus: [null, Validators.compose([Validators.required, Validators.pattern("^[0-9]+(.[0-9]{0,2})?$")])],
      max_bonus_wage: [null, Validators.compose([Validators.required, Validators.pattern("^[0-9]+(.[0-9]{0,2})?$")])],
      eligible_capping: [null, Validators.compose([Validators.required, Validators.pattern("^[0-9]*$")])],
      disbursement_frequency: [null, Validators.compose([Validators.required])],
      disbursement_type: [null, Validators.compose([Validators.required])],
      publish_status: [null, Validators.compose([])],
    });
  }

   ngOnInit() {
    this.titleService.setTitle("Bonus Policy Template - " + Global.AppName);
    this.fetch();
    this.fetchTemplateLibrary();
    this.fetchArchiveBonus();
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
            return full.template_name;
          }
        },
        {
          render: function (data, type, full, meta) {
            let html = "";

            if (Array.isArray(full.disbursement_frequency)) {
              full.disbursement_frequency.forEach((element: any) => {
                html += `<span class='text-capitalize badge badge-primary rg-badges'>` + element.replace(/_/gi, " ") + `</span>`;
              });
            } else {
              html += `<span class='text-capitalize badge badge-primary rg-badges'>` + full.disbursement_frequency.replace(/_/gi, " ").replace(/_/gi, " ") + `</span>`;
            }

            return html;
          },
          className: "text-center"
        },
        {
          render: function (data, type, full, meta) {
            let html = "";

            if (Array.isArray(full.disbursement_type)) {
              full.disbursement_type.forEach((element: any) => {
                html += `<span class='text-capitalize badge badge-primary rg-badges'>` + element.replace(/_/gi, " ") + `</span>`;
              });
            } else {
              html += `<span class='text-capitalize badge badge-primary rg-badges'>` + full.disbursement_type.replace(/_/gi, " ").replace(/_/gi, " ") + `</span>`;
            }

            return html;
          },
          className: "text-center"
        },
        {
          render: function (data, type, full, meta) {
            return full.min_service;
          }
        },
        {
          render: function (data, type, full, meta) {
            return full.max_bonus;
          }
        },
        {
          render: function (data, type, full, meta) {
            return full.max_bonus_wage;
          }
        },
        {
          render: function (data, type, full, meta) {
            return full.eligible_capping;
          }
        },
        {
          render: function (data, type, full, meta) {
            return `<span class="text-capitalize">` + full.esic_apply + `</span>`;
          },
          className: 'text-capitalize'
        },
        {
          render: function (data, type, full, meta) {
            return `<span class="text-capitalize">` + full.epfo_apply + `</span>`;
          },
          className: 'text-capitalize'
        },
        {
          render: function (data, type, full, meta) {
            return `<span class="text-capitalize">` + full.pt_apply + `</span>`;
          },
          className: 'text-capitalize'
        },
        {
          render: function (data, type, full, meta) {
            return `<span class="text-capitalize">` + full.tds_apply + `</span>`;
          },
          className: 'text-capitalize'
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
        this.companyuserService.fetchBonusPolicies({
          'pageno': Math.floor((dataTablesParameters.start + dataTablesParameters.length) / dataTablesParameters.length), 'perpage': dataTablesParameters.length,
          'searchkey': dataTablesParameters.search.value,
          'sortbyfield': Global.getTableSortingOptions('sortbyfield', dataTablesParameters),
          'ascdesc': Global.getTableSortingOptions('ascdesc', dataTablesParameters)
        }).subscribe(res => {
          if (res.status == 'success') {
            callback({
              recordsTotal: res.bonus_policy.totalDocs,
              recordsFiltered: res.bonus_policy.totalDocs,
              data: res.bonus_policy.docs,
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
            if (full.status == "active") {
              btnstatus = 'on';
            } else {
              btnstatus = 'off';
            }

            if(Global.checkCompanyModulePermission({
              company_module: 'company_rules_1',
              company_sub_module: 'bonus_policy',
              company_sub_operation: ['edit'],
              company_strict: true
            })){
              return `<div class="br-toggle br-toggle-rounded br-toggle-primary ` + btnstatus + `" id="changeStatusButton">\
                        <div class="br-toggle-switch"></div>\
                      </div>`;
            }else{
              return full?.status
            }
          },
          className: 'text-center text-capitalize',
          orderable: true,
          name: 'status',
        },
        {
          render: function (data, type, full, meta) {
            let html = `<button class="btn btn-info btn-icon mx-1" data-toggle="tooltip" data-placement="top" title="Update History" id="historyButton-` + meta.row + `">
            <div style="width:25px; height:25px;"><i class="fa fa-history"></i></div>
        </button> `

        if(Global.checkCompanyModulePermission({
          company_module: 'company_rules_1',
          company_sub_module: 'bonus_policy',
          company_sub_operation: ['edit'],
          company_strict: true
        })){
         html += `<button class="btn btn-primary btn-icon mx-1" data-toggle="tooltip" data-placement="top" title="Edit" id="editButton-` + meta.row + `">
                     <div style="width:25px; height:25px;"><i class="fa fa-pen"></i></div>
                 </button>  `
          
        }
        if(Global.checkCompanyModulePermission({
          company_module: 'company_rules_1',
          company_sub_module: 'bonus_policy',
          company_sub_operation: ['delete'],
          company_strict: true
        })){
         html +=`  <button class="btn btn-danger btn-icon mx-1" data-toggle="tooltip" data-placement="top" title="Delete" id="deleteButton-`+ meta.row + `">
         <div style="width:25px; height:25px;"><i class="fa fa-trash"></i></div>
     </button>`
          
        }



                  
                  ;

                    return html
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
            let html = "";

            if (Array.isArray(full.disbursement_frequency)) {
              full.disbursement_frequency.forEach((element: any) => {
                html += `<span class='text-capitalize badge badge-primary rg-badges'>` + element.replace(/_/gi, " ") + `</span>`;
              });
            } else {
              html += `<span class='text-capitalize badge badge-primary rg-badges'>` + full.disbursement_frequency.replace(/_/gi, " ").replace(/_/gi, " ") + `</span>`;
            }

            return html;
          },
          className: "text-center",
          orderable: false,
        },
        {
          render: function (data, type, full, meta) {
            let html = "";

            if (Array.isArray(full.disbursement_type)) {
              full.disbursement_type.forEach((element: any) => {
                html += `<span class='text-capitalize badge badge-primary rg-badges'>` + element.replace(/_/gi, " ") + `</span>`;
              });
            } else {
              html += `<span class='text-capitalize badge badge-primary rg-badges'>` + full.disbursement_type.replace(/_/gi, " ").replace(/_/gi, " ") + `</span>`;
            }

            return html;
          },
          className: "text-center",
          orderable: false,
        },
        {
          render: function (data, type, full, meta) {
            return full.min_service;
          },
          orderable: true,
          name: 'min_service'
        },
        {
          render: function (data, type, full, meta) {
            return full.max_bonus;
          },
          orderable: true,
          name: 'max_bonus'
        },
        {
          render: function (data, type, full, meta) {
            return full.max_bonus_wage;
          },
          orderable: true,
          name: 'max_bonus_wage'
        },
        {
          render: function (data, type, full, meta) {
            return full.eligible_capping;
          },
          orderable: true,
          name: 'eligible_capping'
        },
        {
          render: function (data, type, full, meta) {
            return `<span class="text-capitalize">` + full.esic_apply + `</span>`;
          },
          className: 'text-capitalize',
          orderable: true,
          name: 'esic_apply'
        },
        {
          render: function (data, type, full, meta) {
            return `<span class="text-capitalize">` + full.epfo_apply + `</span>`;
          },
          className: 'text-capitalize',
          orderable: true,
          name: 'epfo_apply'
        },
        {
          render: function (data, type, full, meta) {
            return `<span class="text-capitalize">` + full.pt_apply + `</span>`;
          },
          className: 'text-capitalize',
          orderable: true,
          name: 'pt_apply'
        },
        {
          render: function (data, type, full, meta) {
            return `<span class="text-capitalize">` + full.tds_apply + `</span>`;
          },
          className: 'text-capitalize',
          orderable: true,
          name: 'tds_apply'
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
   fetchArchiveBonus(){
    this.companyuserService.fetchArchiveBonus({}).subscribe((res:any)=>{
      if (res.status == 'success') {
        this.bonusRuleArchive = res?.data || [];
        this.toggleArchive();
      }
      
    })
   }
   toggleArchive(){
    timer(200).subscribe(()=>{
      if ($("#template-auto-fill-archive").hasClass('on')) {
          this.bonusPolicyForm.patchValue({
            min_service:this.bonusRuleArchive?.min_service_qualify || 0,
            max_bonus:this.bonusRuleArchive?.max_bonus || 0,
            max_bonus_wage:this.bonusRuleArchive?.max_bonus_wage || 0,
            eligible_capping:this.bonusRuleArchive?.eligible_capping || 0,
    
          })
        }
        else{
          $("#template-auto-fill-archive").removeClass('on')
          this.bonusPolicyForm.get('min_service')?.reset();
          this.bonusPolicyForm.get('max_bonus')?.reset();
          this.bonusPolicyForm.get('max_bonus_wage')?.reset();
          this.bonusPolicyForm.get('eligible_capping')?.reset();
        }
    })
  
   }
  changePublishStatus(item: any) {
    this.companyuserService.updateBonusPolicyPublishStatus({
      'bonus_policy_id': item._id,
      'status': (item.publish_status == "published") ? 'privet' : 'published',
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
  }

  changeStatus(item: any) {
    this.companyuserService.updateBonusPolicyStatus({
      'bonus_policy_id': item._id,
      'status': (item.status == "active") ? 'inactive' : 'active',
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
  }

  getEdit(item: any) {
    this.editActionId = item._id;
    this.bonusPolicyForm.patchValue({
      template_name: item.template_name,
      min_service: item.min_service,
      max_bonus: item.max_bonus,
      max_bonus_wage: item.max_bonus_wage,
      eligible_capping: item.eligible_capping,
      disbursement_frequency: item.disbursement_frequency,
      disbursement_type: item.disbursement_type,
      publish_status: this.publishStatusMaster.find(obj => {
        return obj.value == item.publish_status
      }),
    });

    // this.selectCheckboxForEdit(item.disbursement_frequency, item.disbursement_type);

    if (item.auto_fill_archive == 'yes') {
      $('#template-auto-fill-archive').addClass("on");
    } else {
      $('#template-auto-fill-archive').removeClass("on");
    }

    if (item.esic_apply == 'yes') {
      $('#template-esic-apply').addClass("on");
    } else {
      $('#template-esic-apply').removeClass("on");
    }

    if (item.pt_apply == 'yes') {
      $('#template-pt-apply').addClass("on");
    } else {
      $('#template-pt-apply').removeClass("on");
    }

    if (item.tds_apply == 'yes') {
      $('#template-tds-apply').addClass("on");
    } else {
      $('#template-tds-apply').removeClass("on");
    }

    if (item.epfo_apply == 'yes') {
      $('#template-epfo-apply').addClass("on");
    } else {
      $('#template-epfo-apply').removeClass("on");
    }

    $('html, body').animate({
      'scrollTop': $("#policy-submit-section").position().top
    });

    this.initialValueBeforeUpdate = {
      'bonus_policy_id': this.editActionId,
      'template_name': this.bonusPolicyForm.value.template_name.toString().trim(),
      'auto_fill_archive': item.auto_fill_archive,
      'min_service': this.bonusPolicyForm.value.min_service.toString().trim(),
      'max_bonus': this.bonusPolicyForm.value.max_bonus.toString().trim(),
      'max_bonus_wage': this.bonusPolicyForm.value.max_bonus_wage.toString().trim(),
      'eligible_capping': this.bonusPolicyForm.value.eligible_capping.toString().trim(),
      'tds_apply': item.tds_apply,
      'esic_apply': item.esic_apply,
      'epfo_apply': item.epfo_apply,
      'pt_apply': item.pt_apply,
      'disbursement_frequency': this.bonusPolicyForm.value.disbursement_frequency,
      'disbursement_type': this.bonusPolicyForm.value.disbursement_type,
      'publish_status': this.bonusPolicyForm.value.publish_status?.value ?? "published",
    }
  }

  cancelEdit() {
    this.editActionId = '';
    this.bonusPolicyForm.reset();
    this.resetSelectedCheckboxes();

    for (const key in this.bonusPolicyForm.controls) {
      if (Object.prototype.hasOwnProperty.call(this.bonusPolicyForm.controls, key)) {
        const element = this.bonusPolicyForm.controls[key];

        element.markAsUntouched();
        element.markAsPristine();
      }
    }
  }

  create(event: any) {
    if (this.bonusPolicyForm.valid) {
      let auto_fill_archive = ($("#template-auto-fill-archive").hasClass('on') == true) ? 'yes' : 'no';
      let tds_apply = ($("#template-esic-apply").hasClass('on') == true) ? 'yes' : 'no';
      let esic_apply = ($("#template-pt-apply").hasClass('on') == true) ? 'yes' : 'no';
      let epfo_apply = ($("#template-tds-apply").hasClass('on') == true) ? 'yes' : 'no';
      let pt_apply = ($("#template-epfo-apply").hasClass('on') == true) ? 'yes' : 'no';

      // let disbursement_frequency = this.getSelectedDisbursementFrequencies();
      // if (disbursement_frequency.length == 0) {
      //   this.toastr.error("You must select atleast one Disbursement Frequency");
      //   return;
      // }

      // let disbursement_type = this.getSelectedDisbursementTypes();
      // if (disbursement_type.length == 0) {
      //   this.toastr.error("You must select atleast one Disbursement Type");
      //   return;
      // }

      event.target.classList.add('btn-loading');

      this.companyuserService.createBonusPolicy({
        'template_name': this.bonusPolicyForm.value.template_name,
        'auto_fill_archive': auto_fill_archive,
        'min_service': this.bonusPolicyForm.value.min_service,
        'max_bonus': this.bonusPolicyForm.value.max_bonus,
        'max_bonus_wage': this.bonusPolicyForm.value.max_bonus_wage,
        'eligible_capping': this.bonusPolicyForm.value.eligible_capping,
        'tds_apply': tds_apply,
        'esic_apply': esic_apply,
        'epfo_apply': epfo_apply,
        'pt_apply': pt_apply,
        'disbursement_frequency': this.bonusPolicyForm.value.disbursement_frequency,
        'disbursement_type': this.bonusPolicyForm.value.disbursement_type,
        'publish_status': this.bonusPolicyForm.value.publish_status?.value ?? "published",
      }).subscribe(res => {
        if (res.status == 'success') {
          this.toastr.success(res.message);

          this.cancelEdit();
          // this.bonusPolicyForm.reset();
          // this.resetSelectedCheckboxes();
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
    swal.fire({
      title: 'Are you sure want to remove?',
      text: 'You will not be able to recover this data!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'No, keep it'
    }).then((result) => {
      if (result.value) {
        this.companyuserService.deleteBonusPolicy({
          'bonus_policy_id': item._id,
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
    if (this.bonusPolicyForm.valid) {
      let auto_fill_archive = ($("#template-auto-fill-archive").hasClass('on') == true) ? "yes" : "no";
      let esic_apply = ($("#template-esic-apply").hasClass('on') == true) ? "yes" : "no";
      let pt_apply = ($("#template-pt-apply").hasClass('on') == true) ? "yes" : "no";
      let tds_apply = ($("#template-tds-apply").hasClass('on') == true) ? "yes" : "no";
      let epfo_apply = ($("#template-epfo-apply").hasClass('on') == true) ? "yes" : "no";

      // let disbursement_frequency = this.getSelectedDisbursementFrequencies();
      // if (disbursement_frequency.length == 0) {
      //   this.toastr.error("You must select atleast one Disbursement Frequency");
      //   return;
      // }

      // let disbursement_type = this.getSelectedDisbursementTypes();
      // if (disbursement_type.length == 0) {
      //   this.toastr.error("You must select atleast one Disbursement Type");
      //   return;
      // }

      const documentUpdate = {
        'bonus_policy_id': this.editActionId,
        'template_name': this.bonusPolicyForm.value.template_name.toString().trim(),
        'auto_fill_archive': auto_fill_archive,
        'min_service': this.bonusPolicyForm.value.min_service.toString().trim(),
        'max_bonus': this.bonusPolicyForm.value.max_bonus.toString().trim(),
        'max_bonus_wage': this.bonusPolicyForm.value.max_bonus_wage.toString().trim(),
        'eligible_capping': this.bonusPolicyForm.value.eligible_capping.toString().trim(),
        'tds_apply': tds_apply,
        'esic_apply': esic_apply,
        'epfo_apply': epfo_apply,
        'pt_apply': pt_apply,
        'disbursement_frequency': this.bonusPolicyForm.value.disbursement_frequency,
        'disbursement_type': this.bonusPolicyForm.value.disbursement_type,
        'publish_status': this.bonusPolicyForm.value.publish_status?.value ?? "published",
      } 

      // console.log(documentUpdate)
      // console.log(this.initialValueBeforeUpdate)
      // return;

      if (JSON.stringify(documentUpdate) === JSON.stringify(this.initialValueBeforeUpdate)) {
        this.toastr.warning("No change detected to update");
        return;
      }

      event.target.classList.add('btn-loading');

      this.companyuserService.updateBonusPolicy(
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
        this.toastr.error(Global.showServerErrorMessage(err));
      });
    }
  }

  getSelectedDisbursementFrequencies() {
    const disbursement_frequency: any = []

    $('input[name="disbursement_frequency[]"]:checked').each(function () {
      disbursement_frequency.push($(this).val())
    });

    return disbursement_frequency;
  }

  getSelectedDisbursementTypes() {
    const disbursement_type: any = []

    $('input[name="disbursement_type[]"]:checked').each(function () {
      disbursement_type.push($(this).val())
    });

    return disbursement_type;
  }

  resetSelectedCheckboxes() {
    $('input[name="disbursement_frequency[]"]:checked').each(function () {
      $(this).prop('checked', false)
    });

    $('input[name="disbursement_type[]"]:checked').each(function () {
      $(this).prop('checked', false)
    });

    $('#template-auto-fill-archive').addClass("on");
    $('#template-esic-apply').addClass("on");
    $('#template-pt-apply').addClass("on");
    $('#template-tds-apply').addClass("on");
    $('#template-epfo-apply').addClass("on");
  }

  selectCheckboxForEdit(disbursement_frequency: any, disbursement_type: any) {
    this.resetSelectedCheckboxes();

    for (const key in disbursement_frequency) {
      if (Object.prototype.hasOwnProperty.call(disbursement_frequency, key)) {
        const element = disbursement_frequency[key];
        $('input[name="disbursement_frequency[]"][value="' + element + '"]').prop('checked', true);
      }
    }

    for (const key in disbursement_type) {
      if (Object.prototype.hasOwnProperty.call(disbursement_type, key)) {
        const element = disbursement_type[key];
        $('input[name="disbursement_type[]"][value="' + element + '"]').prop('checked', true);
      }
    }
  }

  showUpdateHistory(item: any) {
    this.viewPolicyDetail = item;
    if (this.viewPolicyDetail.history != null) {
      $('#history-datatable').dataTable().api().ajax.reload();
      $('#historymmodalbutton').click();
    } else {
      this.toastr.warning("No update history found to show")
    }
  }

  getUpdateHistory() {
    if (this.viewPolicyDetail != null && this.viewPolicyDetail.history != null && Array.isArray(this.viewPolicyDetail.history)) {
      return this.viewPolicyDetail.history;
    } else {
      return [];
    }
  }

  openTemplateLibrary() {
    $('#librarymmodalbutton').click();
  }

  fetchTemplateLibrary() {
    const _this = this;

    this.dtOptionsLibrary = {
      ajax: (dataTablesParameters: any, callback) => {
        this.companyuserService.fetchBonusPolicyTemplate({
          'pageno': Math.floor((dataTablesParameters.start + dataTablesParameters.length) / dataTablesParameters.length), 'perpage': dataTablesParameters.length,
          'searchkey': dataTablesParameters.search.value,
          'sortbyfield': Global.getTableSortingOptions('sortbyfield', dataTablesParameters),
          'ascdesc': Global.getTableSortingOptions('ascdesc', dataTablesParameters)
        }).subscribe(res => {
          if (res.status == 'success') {
            callback({
              recordsTotal: res.bonus_policy.totalDocs,
              recordsFiltered: res.bonus_policy.totalDocs,
              data: res.bonus_policy.docs,
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
          orderable: false
        },
        {
          render: function (data, type, full, meta) {
            let html = "";

            html += `<button class="btn btn-primary btn-icon mx-1" data-toggle="tooltip" data-placement="top" title="Clone" id="cloneButton-` + meta.row + `">
                          <div style="width:25px; height:25px;"><i class="fa fa-copy"></i></div>
                      </button>`;

            return html ? html : "N/A";
          },
          className: 'text-center',
          orderable: false
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
            let html = "";

            if (Array.isArray(full.disbursement_frequency)) {
              full.disbursement_frequency.forEach((element: any) => {
                html += `<span class='text-capitalize badge badge-primary rg-badges'>` + element.replace(/_/gi, " ") + `</span>`;
              });
            } else {
              html += `<span class='text-capitalize badge badge-primary rg-badges'>` + full.disbursement_frequency.replace(/_/gi, " ").replace(/_/gi, " ") + `</span>`;
            }

            return html;
          },
          className: "text-center",
          orderable: false,
        },
        {
          render: function (data, type, full, meta) {
            let html = "";

            if (Array.isArray(full.disbursement_type)) {
              full.disbursement_type.forEach((element: any) => {
                html += `<span class='text-capitalize badge badge-primary rg-badges'>` + element.replace(/_/gi, " ") + `</span>`;
              });
            } else {
              html += `<span class='text-capitalize badge badge-primary rg-badges'>` + full.disbursement_type.replace(/_/gi, " ").replace(/_/gi, " ") + `</span>`;
            }

            return html;
          },
          className: "text-center",
          orderable: false,
        },
        {
          render: function (data, type, full, meta) {
            return full.min_service;
          },
          orderable: true,
          name: 'min_service'
        },
        {
          render: function (data, type, full, meta) {
            return full.max_bonus;
          },
          orderable: true,
          name: 'max_bonus'
        },
        {
          render: function (data, type, full, meta) {
            return full.max_bonus_wage;
          },
          orderable: true,
          name: 'max_bonus_wage'
        },
        {
          render: function (data, type, full, meta) {
            return full.eligible_capping;
          },
          orderable: true,
          name: 'eligible_capping'
        },
        {
          render: function (data, type, full, meta) {
            return `<span class="text-capitalize">` + full.esic_apply + `</span>`;
          },
          className: 'text-capitalize',
          orderable: true,
          name: 'esic_apply'
        },
        {
          render: function (data, type, full, meta) {
            return `<span class="text-capitalize">` + full.epfo_apply + `</span>`;
          },
          className: 'text-capitalize',
          orderable: true,
          name: 'epfo_apply'
        },
        {
          render: function (data, type, full, meta) {
            return `<span class="text-capitalize">` + full.pt_apply + `</span>`;
          },
          className: 'text-capitalize',
          orderable: true,
          name: 'pt_apply'
        },
        {
          render: function (data, type, full, meta) {
            return `<span class="text-capitalize">` + full.tds_apply + `</span>`;
          },
          className: 'text-capitalize',
          orderable: true,
          name: 'tds_apply'
        },
      ],
      drawCallback: function (settings) {
        Global.loadCustomScripts('customJsScript');
      },
      rowCallback: (row: Node, data: any[] | Object, index: number) => {
        const self = this;
        $("table").on('click', '#cloneButton-' + index, function () {
          self.cloneItem(data);
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

  cloneItem(item: any) {
    $('[data-dismiss="modal"]')?.click()
    this.cancelEdit();

    this.bonusPolicyForm.patchValue({
      template_name: item.template_name,
      min_service: item.min_service,
      max_bonus: item.max_bonus,
      max_bonus_wage: item.max_bonus_wage,
      eligible_capping: item.eligible_capping,
      disbursement_frequency: item.disbursement_frequency,
      disbursement_type: item.disbursement_type,
      publish_status: this.publishStatusMaster.find(obj => {
        return obj.value == item.publish_status
      }),
    });

    if (item.auto_fill_archive == 'yes') {
      $('#template-auto-fill-archive').addClass("on");
    } else {
      $('#template-auto-fill-archive').removeClass("on");
    }

    if (item.esic_apply == 'yes') {
      $('#template-esic-apply').addClass("on");
    } else {
      $('#template-esic-apply').removeClass("on");
    }

    if (item.pt_apply == 'yes') {
      $('#template-pt-apply').addClass("on");
    } else {
      $('#template-pt-apply').removeClass("on");
    }

    if (item.tds_apply == 'yes') {
      $('#template-tds-apply').addClass("on");
    } else {
      $('#template-tds-apply').removeClass("on");
    }

    if (item.epfo_apply == 'yes') {
      $('#template-epfo-apply').addClass("on");
    } else {
      $('#template-epfo-apply').removeClass("on");
    }

    $('html, body').animate({
      'scrollTop': $("#policy-submit-section").position().top
    });
  }
}
