import { DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';
import { disableDebugTools, Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import * as Global from 'src/app/globals';
import { CompanyuserService } from 'src/app/services/companyuser.service';
import swal from 'sweetalert2';

@Component({
  selector: 'companyuser-app-bonus-rules',
  templateUrl: './bonus-rules.component.html',
  styleUrls: ['./bonus-rules.component.css'],
})
export class CMPBonusRulesComponent implements OnInit {
  dtOptions: DataTables.Settings = {};
  // dtOptionsHistory: DataTables.Settings = {};
  Global = Global
  bonusRuleForm: UntypedFormGroup;
  editActionId: String;
  viewRuleDetails: any = null;
  initialValueBeforeUpdate: any = null;
  preferenceGroup: any[] = [];

  constructor(
    public formBuilder: UntypedFormBuilder,
    private titleService: Title,
    private toastr: ToastrService,
    private router: Router,
    private companyuserService: CompanyuserService,
    private spinner: NgxSpinnerService,
    private datePipe: DatePipe
  ) {

    // if (!Global.checkCompanyModulePermission({
    //   company_module: 'government_rules',
    //   company_operation:"gov_bonus_rule",
    //   company_sub_module: ['bonus_rules'],
    //   company_sub_operation: ['view'],
    //   company_strict:true
    //   })
    // ) {
    //   // setTimeout(() => {
    //     this.router.navigate(['company/errors/unauthorized-access'], {
    //       skipLocationChange: true,
    //     });
    //   // }, 10);
    // }
    this.bonusRuleForm = formBuilder.group({
      gov_document_no: [null, Validators.compose([Validators.required])],
      effective_date: [null, [Validators.required]],
      min_service_qualify: [
        null,
        Validators.compose([
          Validators.required,
          Validators.pattern('^[0-9]*$'),
        ]),
      ],
      max_bonus: [
        null,
        Validators.compose([
          Validators.required,
          Validators.pattern('^[0-9]+(.[0-9]{0,2})?$'),
        ]),
      ],
      max_bonus_wage: [
        null,
        Validators.compose([
          Validators.required,
          Validators.pattern('^[0-9]+(.[0-9]{0,2})?$'),
        ]),
      ],
      eligible_capping: [
        null,
        Validators.compose([
          Validators.required,
          Validators.pattern('^[0-9]*$'),
        ]),
      ],
    });

    this.editActionId = '';
  }

  ngOnInit() {
    this.titleService.setTitle('Bonus Rule - ' + Global.AppName);

    if (
      !Global.checkCompanyModulePermission({
        company_module: 'gov_bonus_rule',
        company_operation: ['customizable', 'default'],
      }) &&
      !Global.checkCompanyModulePermission({
        company_module: 'government_rules',
        company_sub_module: ['bonus_rules'],
        company_sub_operation: ['add', 'edit', 'view', 'delete'],
      })
    ) {
      const _this = this;
      setTimeout(function () {
        _this.router.navigate(['company/errors/unauthorized-access'], {
          skipLocationChange: true,
        });
      }, 500);
      return;
    }

    if (
      Global.checkCompanyModulePermission({
        company_module: 'gov_bonus_rule',
        company_operation: 'customizable',
      }) ||
      Global.checkCompanyModulePermission({
        company_module: 'government_rules',
        company_sub_module: ['bonus_rules'],
        company_sub_operation: ['add', 'edit', 'delete', 'view'],
      })
    ) {
      this.preferenceGroup.push('customizable');
    }else if (
      Global.checkCompanyModulePermission({
        company_module: 'gov_bonus_rule',
        company_operation: 'default',
      }) ||
      Global.checkCompanyModulePermission({
        company_module: 'government_rules',
        company_sub_module: ['bonus_rules'],
        company_sub_operation: ['add', 'edit', 'delete', 'view'],
      })
    ) {
      this.preferenceGroup.push('default');
      this.copyDefaultTemplate();
    }

    if (!this.preferenceGroup.includes('customizable')) {
      $('.form-layout').find('input').attr('disabled', 'true');
    } else {
      if (
        Global.checkModulePermission(
          'companyuserpreference',
          'bonus_rule',
          'custom'
        ) ||   Global.checkCompanyModulePermission({
          company_module: 'government_rules',
          company_sub_module: ['bonus_rules'],
          company_sub_operation: ['view'],
        })

      ) {
        this.preferenceGroup = ['customizable'];
      } else {
        this.preferenceGroup = ['default'];
        $('.form-layout').find('input').attr('disabled', 'true');
        this.copyDefaultTemplate();
      }
    }

    if (this.preferenceGroup.includes('customizable')) {
      this.fetch();

      // this.dtOptionsHistory = {
      //   ajax: (dataTablesParameters: any, callback) => {
      //     var result = this.getUpdateHistory();

      //     callback({
      //       recordsTotal: result.length,
      //       recordsFiltered: result.length,
      //       data: result.reverse(),
      //     });
      //   },
      //   columns: [
      //     {
      //       render: function (data, type, full, meta: any) {
      //         return meta.settings._iDisplayStart + (meta.row + 1)
      //       },
      //     },
      //     {
      //       render: function (data, type, full, meta) {
      //         var date = full.created_at ? full.created_at : full.updated_at;

      //         var datePipe = new DatePipe("en-US");
      //         let value = datePipe.transform(date, 'dd/MM/yyyy hh:mm a');
      //         return value;
      //       }
      //     },
      //     {
      //       render: function (data, type, full, meta) {
      //         return full.user_name ?? 'N/A';
      //       }
      //     },
      //     {
      //       render: function (data, type, full, meta) {
      //         return full.gov_document_no;
      //       }
      //     },
      //     {
      //       render: function (data, type, full, meta) {
      //         var datePipe = new DatePipe("en-US");
      //         let value = datePipe.transform(full.effective_date, 'dd/MM/yyyy');
      //         return value;
      //       }
      //     },
      //     {
      //       render: function (data, type, full, meta) {
      //         return full.min_service_qualify;
      //       }
      //     },
      //     {
      //       render: function (data, type, full, meta) {
      //         return full.max_bonus;
      //       }
      //     },
      //     {
      //       render: function (data, type, full, meta) {
      //         return full.max_bonus_wage;
      //       }
      //     },
      //     {
      //       render: function (data, type, full, meta) {
      //         return full.eligible_capping;
      //       }
      //     },
      //   ],
      //   searching: true,
      //   lengthChange: true, lengthMenu: Global.DataTableLengthChangeMenu,
      //   responsive: true,
      //   language: {
      //     searchPlaceholder: 'Search...',
      //     search: ""
      //   }
      // }
    }
  }

  fetch() {
    this.dtOptions = {
      ajax: (dataTablesParameters: any, callback) => {
        this.companyuserService
          .fetchBonusRules({
            pageno: dataTablesParameters.start / Global.DataTableLength + 1,
            perpage: dataTablesParameters.length,
            searchkey: dataTablesParameters.search.value,
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
                callback({
                  recordsTotal: res.bonus.totalDocs,
                  recordsFiltered: res.bonus.totalDocs,
                  data: res.bonus.docs,
                });
              } else {
                this.toastr.error(res.message);

                callback({
                  recordsTotal: 0,
                  recordsFiltered: 0,
                  data: [],
                });
              }
            },
            (err) => {
              this.toastr.error(Global.showServerErrorMessage(err));

              callback({
                recordsTotal: 0,
                recordsFiltered: 0,
                data: [],
              });
            }
          );
      },
      columns: [
        {
          render: function (data, type, full, meta: any) {
            return meta.settings._iDisplayStart + (meta.row + 1);
          },
          orderable: false,
        },
        {
          render: function (data, type, full, meta) {
            var html = '';

            if (
              Global.checkCompanyModulePermission({
                company_module: 'government_rules',
                company_sub_module: ['bonus_rules'],
                company_sub_operation: ['edit'],
                company_strict: true,
              })
            ) {
              html +=
                `<button class="btn btn-primary btn-icon mx-1" data-toggle="tooltip" data-placement="top" title="Edit" id="editButton-` +
                meta.row +
                `">
                          <div style="width:25px; height:25px;"><i class="fa fa-pen"></i></div>
                      </button>`;
            }
            if (
              Global.checkCompanyModulePermission({
                company_module: 'government_rules',
                company_sub_module: ['bonus_rules'],
                company_sub_operation: ['delete'],
                company_strict: true,
              })
            ) {
              html +=
                `<button class="btn btn-danger btn-icon mx-1" data-toggle="tooltip" data-placement="top" title="Delete" id="deleteButton-` +
                meta.row +
                `">
                                              <div style="width:25px; height:25px;"><i class="fa fa-trash"></i></div>
                                          </button>`;
            }

            // html += `<button class="btn btn-info btn-icon mx-1" data-toggle="tooltip" data-placement="top" title="Update History" id="historyButton-` + meta.row + `">
            //             <div style="width:25px; height:25px;"><i class="fa fa-history"></i></div>
            //         </button>`;

            return html;
          },
          className: 'text-center',
          orderable: false,
        },
        {
          render: function (data, type, full, meta) {
            return full.gov_document_no;
          },
          orderable: true,
          name: 'gov_document_no',
        },
        {
          render: function (data, type, full, meta) {
            var datePipe = new DatePipe('en-US');
            let value = datePipe.transform(full.effective_date, 'dd/MM/yyyy');
            return value;
          },
          orderable: true,
          name: 'effective_date',
        },
        {
          render: function (data, type, full, meta) {
            return full.min_service_qualify;
          },
          orderable: true,
          name: 'min_service_qualify',
        },
        {
          render: function (data, type, full, meta) {
            return full.max_bonus;
          },
          orderable: true,
          name: 'max_bonus',
        },
        {
          render: function (data, type, full, meta) {
            return full.max_bonus_wage;
          },
          orderable: true,
          name: 'max_bonus_wage',
        },
        {
          render: function (data, type, full, meta) {
            return full.eligible_capping;
          },
          orderable: true,
          name: 'eligible_capping',
        },
      ],
      drawCallback: function (settings) {
        Global.loadCustomScripts('customJsScript');
      },
      rowCallback: (row: Node, data: any[] | Object, index: number) => {
        const self = this;

        $('table').on('click', '#editButton-' + index, function () {
          self.getEdit(data);
        });

        // $("table").on('click', '#historyButton-' + index, function () {
        //   self.showUpdateHistory(data);
        // });

        $('table').on('click', '#deleteButton-' + index, function () {
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
      lengthChange: true,
      lengthMenu: Global.DataTableLengthChangeMenu,
      responsive: true,
      language: {
        searchPlaceholder: 'Search...',
        search: '',
      },
    };
  }

  getEdit(item: any) {
    this.editActionId = item._id;
    this.bonusRuleForm.setValue({
      gov_document_no: item.gov_document_no,
      effective_date: this.datePipe.transform(
        item.effective_date,
        'MM/dd/YYYY'
      ),
      min_service_qualify: item.min_service_qualify,
      max_bonus: item.max_bonus,
      max_bonus_wage: item.max_bonus_wage,
      eligible_capping: item.eligible_capping,
    });

    this.initialValueBeforeUpdate = {
      bonus_id: this.editActionId,
      gov_document_no: this.bonusRuleForm.value.gov_document_no
        .toString()
        .trim(),
      effective_date: this.datePipe.transform(
        this.bonusRuleForm.value.effective_date,
        'Y-MM-dd'
      ),
      min_service_qualify: this.bonusRuleForm.value.min_service_qualify
        .toString()
        .trim(),
      max_bonus: this.bonusRuleForm.value.max_bonus.toString().trim(),
      max_bonus_wage: this.bonusRuleForm.value.max_bonus_wage.toString().trim(),
      eligible_capping: this.bonusRuleForm.value.eligible_capping
        .toString()
        .trim(),
    };

    $('html, body').animate({
      scrollTop: $('#bonus-submit-section').position().top,
    });
  }

  cancelEdit() {
    this.editActionId = '';
    this.bonusRuleForm.reset();

    for (const key in this.bonusRuleForm.controls) {
      if (
        Object.prototype.hasOwnProperty.call(this.bonusRuleForm.controls, key)
      ) {
        const element = this.bonusRuleForm.controls[key];

        element.markAsUntouched();
        element.markAsPristine();
      }
    }
  }

  create(event: any) {
    if (this.bonusRuleForm.valid) {
      event.target.classList.add('btn-loading');

      this.companyuserService
        .createBonusRule({
          gov_document_no: this.bonusRuleForm.value.gov_document_no,
          effective_date: this.datePipe.transform(
            this.bonusRuleForm.value.effective_date,
            'Y-MM-dd'
          ),
          min_service_qualify: this.bonusRuleForm.value.min_service_qualify,
          max_bonus: this.bonusRuleForm.value.max_bonus,
          max_bonus_wage: this.bonusRuleForm.value.max_bonus_wage,
          eligible_capping: this.bonusRuleForm.value.eligible_capping,
        })
        .subscribe(
          (res) => {
            if (res.status == 'success') {
              this.toastr.success(res.message);
              // this.bonusRuleForm.reset();
              this.cancelEdit();
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
            this.toastr.error(Global.showServerErrorMessage(err));
          }
        );
    }
  }

  deleteItem(item: any) {
    swal
      .fire({
        title: 'Are you sure want to remove?',
        text: 'You will not be able to recover this data!',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'No, keep it',
      })
      .then((result) => {
        if (result.value) {
          this.companyuserService
            .deleteBonusRule({
              bonus_id: item._id,
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
              },
              (err) => {
                this.toastr.error(Global.showServerErrorMessage(err));
              }
            );
        } else if (result.dismiss === swal.DismissReason.cancel) {
          swal.fire('Cancelled', 'Your data is safe :)', 'error');
        }
      });
  }

  update(event: any) {
    if (this.bonusRuleForm.valid) {
      const documentUpdate = {
        bonus_id: this.editActionId,
        gov_document_no: this.bonusRuleForm.value.gov_document_no
          .toString()
          .trim(),
        effective_date: this.datePipe.transform(
          this.bonusRuleForm.value.effective_date,
          'Y-MM-dd'
        ),
        min_service_qualify: this.bonusRuleForm.value.min_service_qualify
          .toString()
          .trim(),
        max_bonus: this.bonusRuleForm.value.max_bonus.toString().trim(),
        max_bonus_wage: this.bonusRuleForm.value.max_bonus_wage
          .toString()
          .trim(),
        eligible_capping: this.bonusRuleForm.value.eligible_capping
          .toString()
          .trim(),
      };

      if (
        JSON.stringify(documentUpdate) ===
        JSON.stringify(this.initialValueBeforeUpdate)
      ) {
        this.toastr.warning('No change detected to update');
        return;
      }

      event.target.classList.add('btn-loading');

      this.companyuserService.updateBonusRule(documentUpdate).subscribe(
        (res) => {
          if (res.status == 'success') {
            this.toastr.success(res.message);
            this.initialValueBeforeUpdate = documentUpdate;
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
          this.toastr.error(Global.showServerErrorMessage(err));
        }
      );
    }
  }

  // showUpdateHistory(item: any) {
  //   this.viewRuleDetails = item;
  //   if (this.viewRuleDetails.history != null) {
  //     $('#history-datatable').dataTable().api().ajax.reload();
  //     $('#historymmodalbutton').click();
  //   } else {
  //     this.toastr.warning("No update history found to show")
  //   }
  // }

  // getUpdateHistory() {
  //   if (this.viewRuleDetails != null && this.viewRuleDetails.history != null && Array.isArray(this.viewRuleDetails.history)) {
  //     return this.viewRuleDetails.history;
  //   } else {
  //     return [];
  //   }
  // }

  copyDefaultTemplate() {
    this.spinner.show();

    this.companyuserService.getActiveBonusRule().subscribe(
      (res: any) => {
        if (res.status == 'success') {
          if (res.bonus && Object.keys(res.bonus).length !== 0) {
            this.bonusRuleForm.patchValue({
              gov_document_no: res.bonus?.gov_document_no,
              effective_date: this.datePipe.transform(
                res.bonus?.effective_date,
                'MM/dd/YYYY'
              ),
              min_service_qualify: res.bonus?.min_service_qualify,
              max_bonus: res.bonus?.max_bonus,
              max_bonus_wage: res.bonus?.max_bonus_wage,
              eligible_capping: res.bonus?.eligible_capping,
            });
          } else {
            this.toastr.error(
              'No Default Template added. Please contact our administrator team for further support'
            );
          }
        }

        this.spinner.hide();
      },
      (err) => {
        this.spinner.hide();
        this.toastr.error(Global.showServerErrorMessage(err));
      }
    );
  }
}
