import { DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { AbstractControl, UntypedFormArray, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { disableDebugTools, Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import * as moment from 'moment';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import * as Global from 'src/app/globals';
import { CompanyuserService } from 'src/app/services/companyuser.service';
import swal from 'sweetalert2';

@Component({
  selector: 'companyuser-app-itax-slabs',
  templateUrl: './itax-slabs.component.html',
  styleUrls: ['./itax-slabs.component.css']
})
export class CMPItaxSlabsComponent implements OnInit {
  dtOptions: DataTables.Settings = {};
  dtOptionsHistory: DataTables.Settings = {};
  dtOptionsLibrary: DataTables.Settings = {};
  iTaxSlabForm: UntypedFormGroup;
  // iTaxCategoryForm: UntypedFormGroup;
  editActionId: String;
  categoryMaster:any[] = [];
  viewItTaxTemplate: any = null;
  initialValueBeforeUpdate: any = null;
  viewItTaxTemplateHistory: any = null;
  preferenceGroup: any[] = [];
  Global = Global;
  financialYearPeriod:any[] = []; 

  constructor(
    public formBuilder: UntypedFormBuilder,
    private titleService: Title,
    private toastr: ToastrService,
    private router: Router,
    private companyuserService: CompanyuserService,
    private spinner: NgxSpinnerService,
    private datePipe: DatePipe
  ) {

      
    if (!Global.checkCompanyModulePermission({
      company_module: 'government_rules',
      company_operation:"gov_ptax_rule",
      company_sub_module: ['income_tax_slabs'],
      company_sub_operation: ['view'],
      company_strict:true
    })
    ) {
      // setTimeout(() => {
        this.router.navigate(['company/errors/unauthorized-access'], {
          skipLocationChange: true,
        });
      // }, 10);
    }

    this.iTaxSlabForm = formBuilder.group({
      // template_name: [null, Validators.compose([Validators.required])],
      category: [null, Validators.compose([Validators.required])],
      financial_year_period: [null, Validators.compose([Validators.required])],
      income_tax_slab: this.formBuilder.array([
        this.initIncomeTaxSlabs(),
      ]),
      surcharge_slab: this.formBuilder.array([
        this.initIncomeTaxSlabs1(),
      ])
      // upper_limit: [null, Validators.compose([Validators.required, Validators.pattern("^[0-9]*$")])],
      // lower_limit: [null, Validators.compose([Validators.required, Validators.pattern("^[0-9]*$")])],
      // financial_year_from: [null, Validators.compose([Validators.required, Validators.pattern("^[0-9]*$"), Validators.minLength(4), Validators.maxLength(4)])],
      // financial_year_to: [null, Validators.compose([Validators.required, Validators.pattern("^[0-9]*$"), Validators.minLength(4), Validators.maxLength(4)])],
    });

    this.editActionId = '';
    // this.categoryMaster = [];
  }

  ngOnInit() {-
    this.titleService.setTitle("Income Tax Slab - " + Global.AppName);

    const y = moment().year();
    const format = (y: number) => `${y}-${(y + 1).toString().slice(-2)}`;

    this.financialYearPeriod = [format(y - 1), format(y), format(y + 1)];
  

    this.fetch();
    this.fetchCategories();

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
            return `<button class="btn btn-info btn-icon mx-1" data-toggle="tooltip" data-placement="top" title="View Details" id="viewHistoryDetailsButton-` + meta.row + `">
                        <div style="width:25px; height:25px;"><i class="fa fa-eye"></i></div>
                    </button>`;
          },
          className: 'text-center'
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
            return full.category_name ?? 'N/A';
          }
        },
        {
          render: function (data, type, full, meta) {
            return full.financial_year_from;
          }
        },
        {
          render: function (data, type, full, meta) {
            return full.financial_year_to;
          }
        },
      ],
      drawCallback: function (settings) {
        Global.loadCustomScripts('customJsScript');
      },
      rowCallback: (row: Node, data: any[] | Object, index: number) => {
        const self = this;

        $("table").on('click', '#viewHistoryDetailsButton-' + index, function () {
          self.viewHistoryDetails(data);
        });

        return row;
      },
      searching: true,
      lengthChange: true, lengthMenu: Global.DataTableLengthChangeMenu,
      responsive: true,
      language: {
        searchPlaceholder: 'Search...',
        search: ""
      }
    }
    this.fetchTemplateLibrary();
  }

  initIncomeTaxSlabs(income_slab_from: any = null, income_slab_to: any = null, Standard_Deduction: any = null, Limit: any = null, tax_rate: any = null, additional_charge: any = null, additional_cess: any = null, last_slab = false) {
    return this.formBuilder.group({
      income_slab_from: [income_slab_from, Validators.compose([Validators.required, Validators.pattern("^[0-9]*$"), Validators.min(1)])],
      income_slab_to: [income_slab_to, Validators.compose([Validators.required, Validators.pattern("^[0-9]*$")])],
      Standard_Deduction: [Standard_Deduction, Validators.compose([Validators.required, Validators.pattern("^[0-9]*$")])],
      Limit: [Limit, Validators.compose([Validators.required, Validators.pattern("^[0-9]*$")])],
      tax_rate: [tax_rate, Validators.compose([Validators.required, Validators.pattern("^[0-9]*$"), Validators.min(0)])],
      additional_charge: [additional_charge, Validators.compose([Validators.required, Validators.pattern("^[0-9]*$"), Validators.min(0)])],
      additional_cess: [additional_cess, Validators.compose([Validators.required, Validators.pattern("^[0-9]*$"), Validators.min(0)])],
      last_slab: [last_slab, Validators.compose([Validators.required])],
    });
  }

   initIncomeTaxSlabs1(surcharge_slab_from: any = null, surcharge_slab_to: any = null, surcharge_slab_tax_rule: any = null, last_slab1 = false) {
    return this.formBuilder.group({
      surcharge_slab_from: [surcharge_slab_from, Validators.compose([Validators.required, Validators.pattern("^[0-9]*$"), Validators.min(1)])],
      surcharge_slab_to: [surcharge_slab_to, Validators.compose([Validators.required, Validators.pattern("^[0-9]*$")])],
      surcharge_slab_tax_rule: [surcharge_slab_tax_rule, Validators.compose([Validators.required, Validators.pattern("^[0-9]*$")])],
      last_slab1: [last_slab1, Validators.compose([Validators.required])],
       });
  }

  getTaxSlabControls() {
    return (this.iTaxSlabForm.get('income_tax_slab') as UntypedFormArray).controls;
  }

  removeTaxSlab(i: number) {
    const control = <UntypedFormArray>this.iTaxSlabForm.get('income_tax_slab');
    control.removeAt(i);
  }

  addTaxSlab(income_slab_from: any = null, income_slab_to: any = null, tax_rate: any = null, additional_charge: any = null, additional_cess: any = null, last_slab: any = false) {
    const control = <UntypedFormArray>this.iTaxSlabForm.get('income_tax_slab');
    if (last_slab == 'yes') {
      last_slab = true;
    } else if (last_slab == 'no') {
      last_slab = false;
    }
    control.push(this.initIncomeTaxSlabs(income_slab_from, income_slab_to, tax_rate, additional_charge, additional_cess));
  }

  getTaxSlabControls1() {
    return (this.iTaxSlabForm.get('surcharge_slab') as UntypedFormArray).controls;
  }

  removeTaxSlab1(i: number) {
    const control = <UntypedFormArray>this.iTaxSlabForm.get('surcharge_slab');
    control.removeAt(i);
  }

  addTaxSlab1(surcharge_slab_from: any = null, surcharge_slab_to: any = null, surcharge_slab_tax_rule: any = null, last_slab1: any = false) {
    const control = <UntypedFormArray>this.iTaxSlabForm.get('surcharge_slab');
    if (last_slab1 == 'yes') {
      last_slab1 = true;
    } else if (last_slab1 == 'no') {
      last_slab1 = false;
    }
    control.push(this.initIncomeTaxSlabs1(surcharge_slab_from, surcharge_slab_to, surcharge_slab_tax_rule));
  }

  fetchCategories() {
    this.spinner.show();

    this.companyuserService.fetchITaxCategories()
      .subscribe(res => {
        if (res.status == "success") {
          this.categoryMaster = [];
          for (const key in res.categories) {
            if (Object.prototype.hasOwnProperty.call(res.categories, key)) {
              const element = res.categories[key];
              this.categoryMaster.push({ "id": element._id, "title": element.title, "category_name": element.category_name,  });
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
        this.companyuserService.fetchITaxTemplates({
          'pageno': Math.floor((dataTablesParameters.start + dataTablesParameters.length) / dataTablesParameters.length), 'perpage': dataTablesParameters.length,
          'searchkey': dataTablesParameters.search.value,
          'sortbyfield': Global.getTableSortingOptions('sortbyfield', dataTablesParameters),
          'ascdesc': Global.getTableSortingOptions('ascdesc', dataTablesParameters),
          'pagination':true
        }).subscribe(res => {
          if (res.status == 'success') {
            callback({
              recordsTotal: res.incometax.totalDocs,
              recordsFiltered: res.incometax.totalDocs,
              data: res.incometax.docs,
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
        // <button class="btn btn-info btn-icon mx-1" data-toggle="tooltip" data-placement="top" title="Update History" id="historyButton-` + meta.row + `">
        //     <div style="width:25px; height:25px;"><i class="fa fa-history"></i></div>
        // </button>
        {
          render: function (data, type, full, meta) {
            let html = '';
            if(
             Global.checkCompanyModulePermission({
                company_module: 'government_rules',
                company_sub_module: ['income_tax_slabs'],
                company_sub_operation: [ 'edit'],
                company_strict: true
              })
            ){
              html += ` <button class="btn btn-primary btn-icon mg-5" data-toggle="tooltip" data-placement="top" title="Edit" id="editButton-` + meta.row + `">
                <div style="width:25px; height:25px;"><i class="fa fa-pen"></i></div>
              </button>`

            }
            if(
             Global.checkCompanyModulePermission({
                company_module: 'government_rules',
                company_sub_module: ['income_tax_slabs'],
                company_sub_operation: [ 'delete'],
                company_strict: true
              })
            ){
              html += 
              `<button class="btn btn-danger btn-icon mg-5" data-toggle="tooltip" data-placement="top" title="Delete" id="deleteButton-`+ meta.row + `">
                <div style="width:25px; height:25px;"><i class="fa fa-trash"></i></div>
              </button>`;

            }

            return `<button class="btn btn-info btn-icon mg-5" data-toggle="tooltip" data-placement="top" title="View Details" id="viewButton-` + meta.row + `">
                      <div style="width:25px; height:25px;"><i class="fa fa-eye"></i></div>
                    </button>   ${html}`
                  
          },
          className: 'text-center',
          orderable: false,
        },
        // {
        //   render: function (data, type, full, meta) {
        //     return full.template_name;
        //   },
        //   orderable: true,
        //   name: 'template_name'
        // },
        {
          render: function (data, type, full, meta) {
            if (full.categorydata.length > 0) {
              let html: any = '';

              full.categorydata.forEach((element: any) => {
                html += element.category_name + `<br>`;
              });

              return html;
            } else {
              return 'N/A';
            }
          },
          orderable: false
        },
        // {
        //   render: function (data, type, full, meta) {
        //     return full.upper_limit;
        //   }
        // },
        // {
        //   render: function (data, type, full, meta) {
        //     return full.lower_limit;
        //   }
        // },
        // {
        //   render: function (data, type, full, meta) {
        //     return full.financial_year_from;
        //   },
        //   orderable: true,
        //   name: 'financial_year_from'
        // },
        // {
        //   render: function (data, type, full, meta) {
        //     return full.financial_year_to;
        //   },
        //   orderable: true,
        //   name: 'financial_year_to'
        // },
        {
          render: function (data, type, full, meta) {
            return full.financial_year_period;
          },
          orderable: true,
          name: 'financial_year_period'
        },
      ],
      drawCallback: function (settings) {
        Global.loadCustomScripts('customJsScript');
      },
      rowCallback: (row: Node, data: any[] | Object, index: number) => {
        const self = this;

        $("table").on('click', '#viewButton-' + index, function () {
          self.view(data);
        });

        $("table").on('click', '#historyButton-' + index, function () {
          self.showUpdateHistory(data);
        });

        $("table").on('click', '#editButton-' + index, function () {
          self.getEdit(data);
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

    async create(event: any) {
    if (this.iTaxSlabForm.valid) {
      event.target.classList.add('btn-loading');

      const validateData = await this.validate_itax_data();
      if (!validateData) {
        event.target.classList.remove('btn-loading');
        return;
      }

      this.companyuserService.createITaxTemplate({
        // 'template_name': this.iTaxSlabForm.value.template_name,
        'category': this.iTaxSlabForm.value.category.id,
        'financial_year_period': this.iTaxSlabForm.value.financial_year_period,
        'income_tax_slab': JSON.stringify(this.iTaxSlabForm.value.income_tax_slab),
        // 'financial_year_from': this.iTaxSlabForm.value.financial_year_from,
        // 'financial_year_to': this.iTaxSlabForm.value.financial_year_to,
      }).subscribe(res => {
        if (res.status == 'success') {
          this.toastr.success(res.message);
          // this.iTaxSlabForm.reset();
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

  getEdit(item: any, isNew?:boolean ) {
    if(!isNew){
      this.editActionId = item._id;
    }
    this.iTaxSlabForm.patchValue({
      template_name: item.template_name,
      category: this.categoryMaster.find(obj => {
        return obj.category_name === item.category_name
      }),
      // upper_limit: item.upper_limit,
      // lower_limit: item.lower_limit,
      financial_year_from: item.financial_year_from,
      financial_year_to: item.financial_year_to,
    });

    const control = <UntypedFormArray>this.iTaxSlabForm.get('income_tax_slab');
    control.clear();

    item.income_tax_slab.forEach((element: any) => {
      this.addTaxSlab(element.income_slab_from, element.income_slab_to, element.tax_rate, element.additional_charge, element.additional_cess,element.last_slab )
    });

    this.initialValueBeforeUpdate = {
      // 'taxslab_id': this.editActionId,
      'template_name': this.iTaxSlabForm.value.template_name.toString().trim(),
      'category': this.iTaxSlabForm.value.category.id,
      'category_name': this.iTaxSlabForm.value.category.description,
      'financial_year_from': this.iTaxSlabForm.value.financial_year_from.toString().trim(),
      'financial_year_to': this.iTaxSlabForm.value.financial_year_to.toString().trim(),
      'income_tax_slab': JSON.stringify(this.iTaxSlabForm.value.income_tax_slab)
    }
    if(!isNew) this.initialValueBeforeUpdate['taxslab_id'] =  this.editActionId;

    $('html, body').animate({
      'scrollTop': $("#itaxslab-submit-section").position().top
    });
  }

  cancelEdit() {
    this.editActionId = '';
    this.iTaxSlabForm.reset();

    for (const key in this.iTaxSlabForm.controls) {
      if (Object.prototype.hasOwnProperty.call(this.iTaxSlabForm.controls, key)) {
        const element = this.iTaxSlabForm.controls[key];

        element.markAsUntouched();
        element.markAsPristine();
      }
    }

    const control = <UntypedFormArray>this.iTaxSlabForm.get('income_tax_slab');
    control.clear();

    this.addTaxSlab();

    $('html, body').animate({
      'scrollTop': $("#itaxslab-submit-section").position().top
    });
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
        this.companyuserService.deleteITaxTemplate({
          'taxslab_id': item._id,
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

  async update(event: any) {
    if (this.iTaxSlabForm.valid) {
      event.target.classList.add('btn-loading');

      const validateData = await this.validate_itax_data();
      if (!validateData) {
        event.target.classList.remove('btn-loading');
        return;
      }

      const documentUpdate = {
        'taxslab_id': this.editActionId,
        'template_name': this.iTaxSlabForm.value.template_name.toString().trim(),
        'category': this.iTaxSlabForm.value.category.id,
        'category_name': this.iTaxSlabForm.value.category.description,
        'financial_year_from': this.iTaxSlabForm.value.financial_year_from.toString().trim(),
        'financial_year_to': this.iTaxSlabForm.value.financial_year_to.toString().trim(),
        'income_tax_slab': JSON.stringify(this.iTaxSlabForm.value.income_tax_slab)
      };

      if (JSON.stringify(documentUpdate) === JSON.stringify(this.initialValueBeforeUpdate)) {
        event.target.classList.remove('btn-loading');
        this.toastr.warning("No change detected to update");
        return;
      }

      this.companyuserService.updateITaxTemplate(
        documentUpdate
      ).subscribe(res => {
        if (res.status == 'success') {
          this.toastr.success(res.message);
          this.initialValueBeforeUpdate = documentUpdate;
          $('#my-datatable').dataTable().api().ajax.reload(function (json) { }, false);
          this.cancelEdit()
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

  view(item: any) {
    $('#viewmmodalbutton').click();
    this.viewItTaxTemplate = item;
  }

  viewHistoryDetails(item: any) {
    $('#viewhistorymodalbutton').click();
    this.viewItTaxTemplateHistory = item;
  }

  validate_itax_data() {
    const ele = this;

    return new Promise(function (resolve, reject) {
      // if (parseInt(ele.iTaxSlabForm.value.financial_year_to) < parseInt(ele.iTaxSlabForm.value.financial_year_from)) {
      //   ele.toastr.error("The ending financial year should be greater than the starting year");
      //   resolve(false);
      //   return;
      // }

      /** Validating Income Tax Slab Range */
      for (const key in ele.iTaxSlabForm.value.income_tax_slab) {
        if (Object.prototype.hasOwnProperty.call(ele.iTaxSlabForm.value.income_tax_slab, key)) {
          const element = ele.iTaxSlabForm.value.income_tax_slab[key];
          if (element.income_slab_to <= element.income_slab_from) {
            ele.toastr.error("For Income Tax Slab " + (parseInt(key) + 1) + ": The amount range entered is not acceptable");
            resolve(false);
            return;
          }

          if (!element.last_slab && element.income_slab_to <= element.income_slab_from) {
            ele.toastr.error(
              'For Income Tax Slab ' +
                (parseInt(key) + 1) +
                ': The amount range entered is not acceptable'
            );
            resolve(false);
            return;
          }
          if(element.last_slab){
            element.income_slab_to = 0
          }

          if (parseInt(key) > 0 && element.income_slab_from <= ele.iTaxSlabForm.value.income_tax_slab[parseInt(key) - 1]?.income_slab_to) {
            ele.toastr.error("For Income Tax Slab " + (parseInt(key) + 1) + ": The amount range starting should be greater than the previous one");
            resolve(false);
            return;
          }
        }
      }

        resolve(true);
        return;
      /** End of Validating Income Tax Slab Range */

      // ele.companyuserService.validateITaxTemplateFinancialYear({
      //   'tax_slab_id': ele.editActionId ? ele.editActionId : null,
      //   // 'fromdate': ele.iTaxSlabForm.value.financial_year_from,
      //   // 'fromdate': ele.iTaxSlabForm.value.financial_year_from,
      //   // 'todate': ele.iTaxSlabForm.value.financial_year_to,
      // }).subscribe(res => {
      //   if (res.status == 'success') {
      //     resolve(true);
      //     return;
      //   } else if (res.status == 'val_err') {
      //     ele.toastr.error(Global.showValidationMessage(res.val_msg));
      //     resolve(false);
      //     return;
      //   } else {
      //     ele.toastr.error(res.message);
      //     resolve(false);
      //     return;
      //   }
      // }, (err) => {
      //   ele.toastr.error("Internal server error occured. Please try again later.");
      //   resolve(false);
      //   return;
      // });
    })
  }

  showUpdateHistory(item: any) {
    this.viewItTaxTemplate = item;
    // console.log(this.viewItTaxTemplate.history);
    if (this.viewItTaxTemplate.history != null) {
      $('#history-datatable').dataTable().api().ajax.reload();
      $('#historymmodalbutton').click();
    } else {
      this.toastr.warning("No update history found to show")
    }
  }

  getUpdateHistory() {
    if (this.viewItTaxTemplate != null && this.viewItTaxTemplate.history != null && Array.isArray(this.viewItTaxTemplate.history)) {
      return this.viewItTaxTemplate.history;
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
        this.companyuserService.fetchITaxTemplateLibrary({
          'pageno': Math.floor((dataTablesParameters.start + dataTablesParameters.length) / dataTablesParameters.length), 'perpage': dataTablesParameters.length,
          'searchkey': dataTablesParameters.search.value,
          'sortbyfield': Global.getTableSortingOptions('sortbyfield', dataTablesParameters),
          'ascdesc': Global.getTableSortingOptions('ascdesc', dataTablesParameters)
        }).subscribe(res => {
          if (res.status == 'success') {
            callback({
              recordsTotal: res.incometax.totalDocs,
              recordsFiltered: res.incometax.totalDocs,
              data: res.incometax.docs,
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

            // if (_this.preferenceGroup.includes('customizable')) {
              html += `<button class="btn btn-primary btn-icon mx-1" data-toggle="tooltip" data-placement="top" title="Clone" id="cloneButton-` + meta.row + `">
                            <div style="width:25px; height:25px;"><i class="fa fa-copy"></i></div>
                        </button>`;
            // }

            return html ? html : "N/A";
          },
          className: 'text-center',
          orderable: false
        },
        {
          render: function (data, type, full, meta) {
            return full.template_name
          },
          orderable: true,
          name: 'template_name'
        },
        {
          render: function (data, type, full, meta) {
            if (full.categorydata.length > 0) {
              let html: any = '';

              full.categorydata.forEach((element: any) => {
                html += element.category_name + `<br>`;
              });

              return html;
            } else {
              return 'N/A';
            }
          },
          orderable: false
        },
        // {
        //   render: function (data, type, full, meta) {
        //     return full.upper_limit;
        //   }
        // },
        // {
        //   render: function (data, type, full, meta) {
        //     return full.lower_limit;
        //   }
        // },
        {
          render: function (data, type, full, meta) {
            return full.financial_year_from;
          },
          orderable: true,
          name: 'financial_year_from'
        },
        {
          render: function (data, type, full, meta) {
            return full.financial_year_to;
          },
          orderable: true,
          name: 'financial_year_to'
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
    this.getEdit(item, true)
  }

  configLastSlab(t: any) {
      let i = this.iTaxSlabForm.get('income_tax_slab')?.value?.length - 1;
      if (i >= 0) {
        const contol: AbstractControl = this.getTaxSlabControls()[i];
        if (t.checked) {
          contol.get('income_slab_to')?.disable();
          contol.get('income_slab_to')?.clearValidators();
          contol.get('income_slab_to')?.setValue(0);
          contol.get('income_slab_to')?.updateValueAndValidity();
        } else {
          contol.get('income_slab_to')?.enable();
          contol.get('income_slab_to')?.setValidators([Validators.required]);
          contol.get('income_slab_to')?.setValue(null);
          contol.get('income_slab_to')?.updateValueAndValidity();
        }
      }
      // console.log(this.pTaxRuleForm.get("tax_range_amount")?.value);
    }
  configLastSlab1(t: any) {
      let i = this.iTaxSlabForm.get('surcharge_slab')?.value?.length - 1;
      if (i >= 0) {
        const contol: AbstractControl = this.getTaxSlabControls()[i];
        if (t.checked) {
          contol.get('income_slab_to')?.disable();
          contol.get('income_slab_to')?.clearValidators();
          contol.get('income_slab_to')?.setValue(0);
          contol.get('income_slab_to')?.updateValueAndValidity();
        } else {
          contol.get('income_slab_to')?.enable();
          contol.get('income_slab_to')?.setValidators([Validators.required]);
          contol.get('income_slab_to')?.setValue(null);
          contol.get('income_slab_to')?.updateValueAndValidity();
        }
      }
      // console.log(this.pTaxRuleForm.get("tax_range_amount")?.value);
    }
}
